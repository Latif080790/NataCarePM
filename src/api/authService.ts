/**
 * Authentication Service
 * Handles user authentication, session management, password change, and audit logging
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import type { APIResponse } from '@/types/userProfile';
import { Permission } from '@/types';
import { ROLES_CONFIG } from '@/constants';

// ========================================
// TYPES
// ========================================

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordChangeResult {
  success: boolean;
  message: string;
  passwordStrength?: number;
}

// ========================================
// PASSWORD CHANGE
// ========================================

/**
 * Change user password using Firebase Function
 */
export const changePassword = async (
  request: PasswordChangeRequest
): Promise<APIResponse<PasswordChangeResult>> => {
  try {
    const { currentPassword, newPassword } = request;

    // Get Firebase Functions instance
    const functions = getFunctions();
    const changePasswordFunction = httpsCallable(functions, 'changePassword');
    
    // Call Firebase Function
    const result = await changePasswordFunction({
      currentPassword,
      newPassword
    });
    
    return result.data as APIResponse<PasswordChangeResult>;
  } catch (error: any) {
    logger.error('Error changing password', error as Error);
    
    // Handle Firebase Function errors
    if (error.code === 'functions/invalid-argument') {
      return {
        success: false,
        error: {
          code: 'INVALID_ARGUMENT',
          message: error.message || 'Invalid password',
        },
      };
    }
    
    if (error.code === 'functions/permission-denied') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Permission denied',
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: 'Failed to change password',
        details: error,
      },
    };
  }
};

// ========================================
// AUTHENTICATION & SESSION MANAGEMENT
// ========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
  lastActivity: Timestamp;
}

export interface AuthActivity {
  userId: string;
  action: 'login' | 'logout' | 'login_failed' | 'token_refresh' | 'session_expired';
  ipAddress: string;
  userAgent: string;
  timestamp: Timestamp;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Get client IP address
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get/Store session ID
 */
function getCurrentSessionId(): string {
  return sessionStorage.getItem('sessionId') || 'unknown';
}

function storeSessionId(sessionId: string): void {
  sessionStorage.setItem('sessionId', sessionId);
}

function clearSessionId(): void {
  sessionStorage.removeItem('sessionId');
}

/**
 * Create user session
 */
async function createUserSession(session: UserSession): Promise<void> {
  await setDoc(doc(db, 'userSessions', session.sessionId), session);
  storeSessionId(session.sessionId);
}

/**
 * Update session activity
 */
async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'userSessions', sessionId), {
      lastActivity: Timestamp.now(),
    });
  } catch (error) {
    logger.error('Failed to update session activity', error as Error);
  }
}

/**
 * Invalidate all user sessions
 */
async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    const sessionsQuery = query(
      collection(db, 'userSessions'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(sessionsQuery);
    const updatePromises = snapshot.docs.map(docSnapshot =>
      updateDoc(doc(db, 'userSessions', docSnapshot.id), {
        isActive: false,
        lastActivity: Timestamp.now(),
      })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    logger.error('Failed to invalidate user sessions', error as Error);
  }
}

/**
 * Validate session
 */
export async function validateSession(sessionId: string): Promise<boolean> {
  try {
    const sessionDoc = await getDoc(doc(db, 'userSessions', sessionId));
    if (!sessionDoc.exists()) return false;

    const session = sessionDoc.data() as UserSession;
    const isValid = session.isActive && session.expiresAt.toDate() > new Date();

    if (isValid) {
      await updateSessionActivity(sessionId);
    }

    return isValid;
  } catch (error) {
    logger.error('Session validation error', error as Error);
    return false;
  }
}

/**
 * Log authentication activity
 */
async function logAuthActivity(activity: AuthActivity): Promise<void> {
  try {
    const logId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(db, 'authLogs', logId), activity);
  } catch (error) {
    logger.error('Failed to log auth activity', error as Error);
  }
}

/**
 * Get user permissions from Firestore
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      logger.warn(`User document not found for userId: ${userId}`);
      return [];
    }

    const userData = userDoc.data();
    const roleId = userData.roleId;

    if (!roleId) {
      logger.warn(`User ${userId} has no roleId assigned`);
      return [];
    }

    const role = ROLES_CONFIG.find(r => r.id === roleId);
    if (!role) {
      logger.warn(`Role not found for roleId: ${roleId}`);
      return [];
    }

    return role.permissions || [];
  } catch (error) {
    logger.error('Error getting user permissions', error as Error);
    return [];
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    return userData.roleId || null;
  } catch (error) {
    logger.error('Error getting user role', error as Error);
    return null;
  }
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const ipAddress = await getClientIP();
    const userAgent = navigator.userAgent;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      const idToken = await user.getIdToken();
      const refreshToken = user.refreshToken;

      const sessionId = generateSessionId();
      await createUserSession({
        userId: user.uid,
        sessionId,
        ipAddress,
        userAgent,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        isActive: true,
        lastActivity: Timestamp.now(),
      });

      await logAuthActivity({
        userId: user.uid,
        action: 'login',
        ipAddress,
        userAgent,
        timestamp: Timestamp.now(),
        success: true,
        metadata: { email: credentials.email, sessionId },
      });

      return { accessToken: idToken, refreshToken, expiresIn: 3600 };
    } catch (error: any) {
      await logAuthActivity({
        userId: credentials.email,
        action: 'login_failed',
        ipAddress,
        userAgent,
        timestamp: Timestamp.now(),
        success: false,
        error: error.message,
        metadata: { email: credentials.email },
      });
      throw error;
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    const user = auth.currentUser;
    const sessionId = getCurrentSessionId();

    if (user) {
      await invalidateUserSessions(user.uid);
      await logAuthActivity({
        userId: user.uid,
        action: 'logout',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: Timestamp.now(),
        success: true,
        metadata: { sessionId },
      });
    }

    clearSessionId();
    await firebaseSignOut(auth);
  },

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    try {
      const newToken = await user.getIdToken(true);
      await logAuthActivity({
        userId: user.uid,
        action: 'token_refresh',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: Timestamp.now(),
        success: true,
      });
      return newToken;
    } catch (error: any) {
      await logAuthActivity({
        userId: user.uid,
        action: 'token_refresh',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: Timestamp.now(),
        success: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    const sessionId = getCurrentSessionId();
    if (!sessionId || sessionId === 'unknown') return false;
    return validateSession(sessionId);
  },

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};
