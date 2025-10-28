import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User as AppUser } from '@/types';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { rateLimiter } from '@/utils/rateLimiter';
import { twoFactorService } from '@/api/twoFactorService';
import { authService } from '@/services/authService';
import { logger } from '@/utils/logger.enhanced';

interface AuthContextType {
  currentUser: AppUser | null;
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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear error message
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
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
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Enhanced login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.login(email, password);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Login failed');
      }

      // Check if 2FA is required
      if (response.data?.requires2FA) {
        setRequires2FA(true);
        setPending2FAUserId(response.data.pending2FAUserId || null);
        setPendingCredentials({ email, password });
        setLoading(false);
        return;
      }

      // Login successful, user will be set by auth state listener
      rateLimiter.reset(email, 'login');
    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Login failed: Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
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
          const errorMessage = 'Invalid 2FA code';
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        // 2FA verified - complete the login
        await authService.login(pendingCredentials.email, pendingCredentials.password);

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
    setError(null);
  }, []);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.logout();
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Logout failed');
      }

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};