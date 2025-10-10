import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import { projectService } from '../api/projectService';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            // User is signed in, fetch our app-specific user profile from Firestore.
            // The UID from Firebase Auth should match the document ID in our 'users' collection.
            const userProfile = await projectService.getUserById(firebaseUser.uid);
            setCurrentUser(userProfile);
        } else {
            // User is signed out.
            setCurrentUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    // In a real app, you get password from a form. Here we use a default for demo.
    const mockPassword = "password123";
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password || mockPassword);
        return true;
    } catch (error) {
        console.error("Firebase login failed", error);
        // You could check for error.code === 'auth/user-not-found' to create a new user.
        return false;
    } finally {
        // onAuthStateChanged will handle setting the user and loading state
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Firebase logout failed", error);
    }
  }, []);

  const value = { currentUser, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};