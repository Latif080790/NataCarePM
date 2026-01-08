import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from '@/types';
import * as React from 'react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  requires2FA: boolean;
  mfaResolver: any | null;
  cancel2FA: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default value untuk mencegah infinite re-render
// Harus di luar function agar tidak di-recreate setiap render
const DEFAULT_AUTH_CONTEXT: AuthContextType = {
  currentUser: null,
  loading: false,
  login: async () => { throw new Error('AuthProvider not found'); },
  logout: async () => { throw new Error('AuthProvider not found'); },
  error: null,
  clearError: () => {},
  requires2FA: false,
  mfaResolver: null,
  cancel2FA: () => {},
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // JANGAN throw error - return default value untuk prevent crash
    console.warn('[useAuth] Called outside AuthProvider - returning defaults');
    // Return stable default untuk prevent infinite re-render
    return DEFAULT_AUTH_CONTEXT;
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // All hooks MUST be called unconditionally at the top
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<any | null>(null);

  // Single useEffect with proper cleanup
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;

      if (user) {
        setCurrentUser({
          uid: user.uid,
          id: user.uid,
          email: user.email || '',
          name: user.displayName || 'User',
          roleId: 'user',
          avatarUrl: user.photoURL || '',
          isOnline: true,
          permissions: [],
          lastSeen: new Date().toISOString(),
        });
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Dummy functions for now - just to prevent crashes
  const login = React.useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Simple Firebase login
      await signInWithEmailAndPassword(auth, email, password);
      
      // User will be set by onAuthStateChanged listener
    } catch (err: any) {
      console.error('[AuthContext] Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const cancel2FA = React.useCallback(() => {
    setRequires2FA(false);
    setMfaResolver(null);
  }, []);

  const value = React.useMemo(
    () => ({ 
      currentUser, 
      loading, 
      login, 
      logout, 
      error, 
      clearError, 
      requires2FA, 
      mfaResolver, 
      cancel2FA 
    }),
    [currentUser, loading, login, logout, error, clearError, requires2FA, mfaResolver, cancel2FA]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
