import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { rateLimiter } from '../utils/rateLimiter';
import { twoFactorService } from '../api/twoFactorService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  requires2FA: boolean;
  pending2FAUserId: string | null;
  verify2FA: (code: string) => Promise<void>;
  cancel2FA: () => void;
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
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          roleId: 'user',
          avatarUrl: user.photoURL || '',
          isOnline: true,
          permissions: []
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Check rate limit BEFORE attempting login
      const rateCheck = rateLimiter.checkLimit(email, 'login');
      
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.message || 'Too many login attempts. Please try again later.');
      }

      setLoading(true);
      
      // Step 1: Authenticate with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Step 2: Check if 2FA is enabled for this user
      const is2FAEnabled = await twoFactorService.isEnabled(userId);
      
      if (is2FAEnabled) {
        // 2FA is enabled - don't complete login yet, show 2FA verification
        setRequires2FA(true);
        setPending2FAUserId(userId);
        setPendingCredentials({ email, password });
        setLoading(false);
        
        // Sign out temporarily (will re-authenticate after 2FA verification)
        await signOut(auth);
        return; // Stop here, wait for 2FA verification
      }
      
      // No 2FA required - complete login normally
      rateLimiter.reset(email, 'login');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error instanceof Error) {
        throw new Error(`Login failed: ${error.message}`);
      } else {
        throw new Error('Login failed: Unknown error occurred');
      }
    }
  }, []);

  const verify2FA = useCallback(async (code: string) => {
    if (!pending2FAUserId || !pendingCredentials) {
      throw new Error('No pending 2FA verification');
    }

    try {
      setLoading(true);
      
      // Verify the 2FA code
      const isValid = await twoFactorService.verifyCode(pending2FAUserId, code);
      
      if (!isValid) {
        throw new Error('Invalid 2FA code');
      }
      
      // 2FA verified - complete the login
      await signInWithEmailAndPassword(auth, pendingCredentials.email, pendingCredentials.password);
      
      // Reset rate limit on success
      rateLimiter.reset(pendingCredentials.email, 'login');
      
      // Clear 2FA state
      setRequires2FA(false);
      setPending2FAUserId(null);
      setPendingCredentials(null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error instanceof Error) {
        throw new Error(`2FA verification failed: ${error.message}`);
      } else {
        throw new Error('2FA verification failed: Unknown error occurred');
      }
    }
  }, [pending2FAUserId, pendingCredentials]);

  const cancel2FA = useCallback(() => {
    setRequires2FA(false);
    setPending2FAUserId(null);
    setPendingCredentials(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loading,
    requires2FA,
    pending2FAUserId,
    verify2FA,
    cancel2FA
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};