import { twoFactorService } from '@/api/twoFactorService';
import { 
  checkAccountLockout, 
  recordLoginAttempt, 
  calculateLoginDelay 
} from '@/api/rateLimitService';
import { auth } from '@/firebaseConfig';
import { authService } from '@/services/authService';
import { logger } from '@/utils/logger.enhanced';
import { rateLimiter } from '@/utils/rateLimiter';
import { trackLogin, trackSignUp, clearUserProperties } from '@/utils/analytics';
import { jwtUtils } from '@/utils/jwtUtils';
import { 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  MultiFactorResolver,
} from 'firebase/auth';
import type { User } from '@/types';
import * as React from 'react';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  requires2FA: boolean;
  pending2FAUserId: string | null;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
  error: string | null;
  clearError: () => void;
  mfaResolver: MultiFactorResolver | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  // Clear error message
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize JWT utilities on mount
  // TEMPORARILY DISABLED FOR DEBUGGING
  /*
  useEffect(() => {
    try {
      jwtUtils.initializeJWT();
    } catch (error) {
      console.error('[AuthContext] Failed to initialize JWT:', error);
    }
    
    return () => {
      // Cleanup on unmount
      try {
        jwtUtils.stopAutoRefresh();
      } catch (error) {
        console.error('[AuthContext] Failed to stop auto-refresh:', error);
      }
    };
  }, []);
  */

  // Listen to auth state changes
  useEffect(() => {
    // Timeout fallback: set loading false after 3 seconds max
    const timeoutId = setTimeout(() => {
      console.warn('[AuthContext] Firebase auth state check timeout - proceeding without user');
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeoutId); // Cancel timeout if auth state received
      
      if (user) {
        try {
          // TEMPORARILY DISABLED JWT FOR DEBUGGING
          /*
          // Get and store ID token
          const idToken = await user.getIdToken();
          
          // Store token with error handling
          try {
            jwtUtils.storeToken(idToken, 3600); // Store for 1 hour
            console.log('[AuthContext] Token stored successfully');
          } catch (tokenError) {
            console.error('[AuthContext] Failed to store token:', tokenError);
          }
          
          // Start auto-refresh
          try {
            jwtUtils.startAutoRefresh();
            console.log('[AuthContext] Auto-refresh started');
          } catch (refreshError) {
            console.error('[AuthContext] Failed to start auto-refresh:', refreshError);
          }
          */
          
          const appUser = await authService.getCurrentUser();
          if (appUser) {
            setCurrentUser(appUser);
          } else {
            setCurrentUser({
              uid: user.uid,
              id: user.uid,
              email: user.email || '',
              name: user.displayName || '',
              roleId: 'user',
              avatarUrl: user.photoURL || '',
              isOnline: true,
              permissions: [],
              lastSeen: new Date().toISOString(),
            });
          }
        } catch (err) {
          logger.error('Error getting user data', err instanceof Error ? err : new Error(String(err)));
          setCurrentUser({
            uid: user.uid,
            id: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            roleId: 'user',
            avatarUrl: user.photoURL || '',
            isOnline: true,
            permissions: [],
            lastSeen: new Date().toISOString(),
          });
        }
      } else {
        // User logged out, cleanup JWT
        // TEMPORARILY DISABLED FOR DEBUGGING
        /*
        try {
          jwtUtils.cleanupJWT();
          console.log('[AuthContext] JWT cleaned up');
        } catch (cleanupError) {
          console.error('[AuthContext] Failed to cleanup JWT:', cleanupError);
        }
        */
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Enhanced login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      // Step 1: Check for account lockout
      const lockoutStatus = await checkAccountLockout(email);
      
      if (lockoutStatus.locked && lockoutStatus.lockedUntil) {
        const minutesRemaining = Math.ceil(
          (lockoutStatus.lockedUntil.getTime() - Date.now()) / (1000 * 60)
        );
        const errorMessage = `Account locked due to too many failed attempts. Please try again in ${minutesRemaining} minutes. Remaining attempts: ${lockoutStatus.remainingAttempts}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // Step 2: Calculate and apply delay for failed attempts
      const delay = await calculateLoginDelay(email);
      if (delay > 0) {
        logger.warn('Login attempt delayed due to previous failures', { email, delaySeconds: delay });
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }

      // Step 3: Attempt login with Firebase Auth (to detect MFA)
      try {
        await signInWithEmailAndPassword(auth, email, password);
        
        // If we get here, no MFA required - proceed with normal login
        const response = await authService.login(email, password);
        
        if (!response.success) {
          await recordLoginAttempt(
            email, 
            false, 
            undefined, 
            undefined, 
            response.error?.message || 'Login failed'
          );
          throw new Error(response.error?.message || 'Login failed');
        }

        // Record successful login
        const user = auth.currentUser;
        if (user) {
          // Get and store ID token with error handling
          try {
            const idToken = await user.getIdToken();
            jwtUtils.storeToken(idToken, 3600); // Store for 1 hour
            jwtUtils.startAutoRefresh();
            console.log('[AuthContext] Login: Token stored and auto-refresh started');
          } catch (tokenError) {
            console.error('[AuthContext] Login: Failed to store token:', tokenError);
            // Don't fail the login, just log the error
          }
        }
        
        await recordLoginAttempt(
          email, 
          true, 
          user?.uid, 
          undefined, 
          'Login successful'
        );
        rateLimiter.reset(email, 'login');
        
        // Track successful login
        trackLogin('email');
        
      } catch (authError: any) {
        // Check if this is a multi-factor auth error
        if (authError.code === 'auth/multi-factor-auth-required') {
          const resolver = authError.resolver as MultiFactorResolver;
          setMfaResolver(resolver);
          setRequires2FA(true);
          setPendingCredentials({ email, password });
          setLoading(false);
          return;
        }
        
        // Other auth errors
        await recordLoginAttempt(
          email, 
          false, 
          undefined, 
          undefined, 
          authError.message || 'Login failed'
        );
        throw authError;
      }

    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Login failed: Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced register function
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.register(email, password, name);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Registration failed');
      }

      // Track successful signup
      trackSignUp('email');

      // Registration successful, user will be set by auth state listener after email verification
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed: Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced password reset function
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.resetPassword(email);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Password reset failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed: Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2FA verification
  const verify2FA = useCallback(
    async (code: string) => {
      if (!pending2FAUserId || !pendingCredentials) {
        const errorMessage = 'No pending 2FA verification';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        setLoading(true);
        setError(null);

        // Verify the 2FA code
        const isValid = await twoFactorService.verifyCode(pending2FAUserId, code);

        if (!isValid) {
          // Record failed 2FA attempt
          await recordLoginAttempt(
            pendingCredentials.email,
            false,
            pending2FAUserId,
            undefined,
            'Invalid 2FA code'
          );
          
          const errorMessage = 'Invalid 2FA code';
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        // 2FA verified - complete the login
        await authService.login(pendingCredentials.email, pendingCredentials.password);

        // Record successful login with 2FA
        await recordLoginAttempt(
          pendingCredentials.email,
          true,
          pending2FAUserId,
          undefined,
          'Login successful with 2FA'
        );

        // Reset rate limit on success
        rateLimiter.reset(pendingCredentials.email, 'login');

        // Clear 2FA state
        setRequires2FA(false);
        setPending2FAUserId(null);
        setPendingCredentials(null);
      } catch (err) {
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : '2FA verification failed: Unknown error occurred';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [pending2FAUserId, pendingCredentials]
  );

  // Cancel 2FA verification
  const cancel2FA = useCallback(() => {
    setRequires2FA(false);
    setPending2FAUserId(null);
    setPendingCredentials(null);
    setMfaResolver(null);
    setError(null);
  }, []);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Cleanup JWT before logout with error handling
      try {
        jwtUtils.cleanupJWT();
        console.log('[AuthContext] Logout: JWT cleaned up');
      } catch (cleanupError) {
        console.error('[AuthContext] Logout: Failed to cleanup JWT:', cleanupError);
        // Continue with logout even if cleanup fails
      }

      const response = await authService.logout();
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Logout failed');
      }

      // Clear analytics user properties
      clearUserProperties();

      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed: Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    register,
    resetPassword,
    loading,
    requires2FA,
    pending2FAUserId,
    verify2FA,
    cancel2FA,
    error,
    clearError,
    mfaResolver,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};