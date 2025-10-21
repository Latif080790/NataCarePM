/**
 * 🚀 ENTERPRISE AUTHENTICATION SERVICE
 * Advanced authentication with comprehensive security features
 * Version: 2.0.0
 * Last Updated: October 2025
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { User as AppUser } from '@/types';
import { rateLimiter } from '@/utils/rateLimiter';
import { twoFactorService } from '@/api/twoFactorService';
import { logger } from '@/utils/logger';
import { APIResponse, APIError, ErrorCodes, wrapResponse, wrapError } from '@/utils/responseWrapper';

// Session timeout constants
const SESSION_TIMEOUT = import.meta.env.VITE_SESSION_TIMEOUT
  ? parseInt(import.meta.env.VITE_SESSION_TIMEOUT)
  : 7200000; // 2 hours default

/**
 * Enhanced user session management
 */
class UserSessionManager {
  private sessionTimer: NodeJS.Timeout | null = null;
  private sessionExpiry: number | null = null;

  /**
   * Start session timeout monitoring
   */
  startSessionTimeout(onTimeout: () => void): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionExpiry = Date.now() + SESSION_TIMEOUT;
    this.sessionTimer = setTimeout(() => {
      logger.info('authService:sessionTimeout', 'User session expired');
      onTimeout();
    }, SESSION_TIMEOUT);
  }

  /**
   * Reset session timeout
   */
  resetSessionTimeout(onTimeout: () => void): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }

    this.sessionExpiry = Date.now() + SESSION_TIMEOUT;
    this.sessionTimer = setTimeout(() => {
      logger.info('authService:sessionTimeout', 'User session expired');
      onTimeout();
    }, SESSION_TIMEOUT);
  }

  /**
   * Get remaining session time
   */
  getRemainingSessionTime(): number | null {
    if (!this.sessionExpiry) return null;
    return Math.max(0, this.sessionExpiry - Date.now());
  }

  /**
   * Clear session timeout
   */
  clearSessionTimeout(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    this.sessionExpiry = null;
  }
}

export const sessionManager = new UserSessionManager();

/**
 * Convert Firebase User to App User
 */
const convertFirebaseUserToAppUser = async (firebaseUser: User): Promise<AppUser> => {
  try {
    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    return {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || userData.name || '',
      roleId: userData.roleId || 'user',
      avatarUrl: firebaseUser.photoURL || userData.avatarUrl || '',
      isOnline: true,
      permissions: userData.permissions || [],
      lastSeen: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('authService:convertFirebaseUserToAppUser', 'Failed to convert user', error);
    // Fallback to basic user object
    return {
      uid: firebaseUser.uid,
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      roleId: 'user',
      avatarUrl: firebaseUser.photoURL || '',
      isOnline: true,
      permissions: [],
      lastSeen: new Date().toISOString(),
    };
  }
};

/**
 * Enhanced Authentication Service
 */
export const authService = {
  /**
   * Enhanced login with comprehensive security checks
   */
  async login(email: string, password: string): Promise<APIResponse<AppUser & { requires2FA?: boolean; pending2FAUserId?: string }>> {
    try {
      logger.info('authService:login', 'Login attempt initiated', { email });

      // Validate input
      if (!email || !password) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          'Email and password are required',
          400,
          { email }
        );
      }

      // Check rate limit BEFORE attempting login
      const rateCheck = rateLimiter.checkLimit(email, 'login');
      if (!rateCheck.allowed) {
        logger.warn('authService:login', 'Rate limit exceeded', { email });
        throw new APIError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          rateCheck.message || 'Too many login attempts. Please try again later.',
          429,
          { email }
        );
      }

      // Attempt authentication
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update last login timestamp
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastSeen: new Date().toISOString(),
      });

      // Check if 2FA is enabled for this user
      const is2FAEnabled = await twoFactorService.isEnabled(userCredential.user.uid);
      if (is2FAEnabled) {
        logger.info('authService:login', '2FA required for user', { email });
        // Don't complete login yet, show 2FA verification
        rateLimiter.reset(email, 'login');
        
        const appUser = await convertFirebaseUserToAppUser(userCredential.user);
        return wrapResponse({
          ...appUser,
          requires2FA: true,
          pending2FAUserId: userCredential.user.uid,
        });
      }

      // Convert to app user
      const appUser = await convertFirebaseUserToAppUser(userCredential.user);

      // Reset rate limit on success
      rateLimiter.reset(email, 'login');

      logger.info('authService:login', 'Login successful', { email, userId: appUser.id });
      return wrapResponse(appUser);
    } catch (error) {
      logger.error('authService:login', 'Login failed', error, { email });
      return wrapError(error, 'authService:login', email);
    }
  },

  /**
   * Enhanced registration with profile creation
   */
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<APIResponse<AppUser>> {
    try {
      logger.info('authService:register', 'Registration attempt initiated', { email });

      // Validate input
      if (!email || !password || !name) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          'Email, password, and name are required',
          400,
          { email }
        );
      }

      // Check rate limit
      const rateCheck = rateLimiter.checkLimit(email, 'registration');
      if (!rateCheck.allowed) {
        logger.warn('authService:register', 'Rate limit exceeded', { email });
        throw new APIError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          rateCheck.message || 'Too many registration attempts. Please try again later.',
          429,
          { email }
        );
      }

      // Create user in Firebase Authentication
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update user profile
      await updateProfile(userCredential.user, { displayName: name });

      // Create user document in Firestore
      const userData = {
        name,
        email,
        roleId: 'user', // Default role
        avatarUrl: `https://i.pravatar.cc/150?u=${userCredential.user.uid}`,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        permissions: [],
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // Send email verification
      try {
        await sendEmailVerification(userCredential.user);
        logger.info('authService:register', 'Verification email sent', { email });
      } catch (emailError) {
        logger.warn('authService:register', 'Failed to send verification email', emailError, {
          email,
        });
      }

      // Convert to app user
      const appUser = await convertFirebaseUserToAppUser(userCredential.user);

      // Reset rate limit on success
      rateLimiter.reset(email, 'registration');

      logger.info('authService:register', 'Registration successful', {
        email,
        userId: appUser.id,
      });
      return wrapResponse(appUser);
    } catch (error) {
      logger.error('authService:register', 'Registration failed', error, { email });
      return wrapError(error, 'authService:register', email);
    }
  },

  /**
   * Enhanced logout with session cleanup
   */
  async logout(): Promise<APIResponse<null>> {
    try {
      logger.info('authService:logout', 'Logout initiated');

      // Clear session timeout
      sessionManager.clearSessionTimeout();

      // Sign out from Firebase
      await signOut(auth);

      logger.info('authService:logout', 'Logout successful');
      return wrapResponse(null);
    } catch (error) {
      logger.error('authService:logout', 'Logout failed', error);
      return wrapError(error, 'authService:logout');
    }
  },

  /**
   * Password reset request
   */
  async resetPassword(email: string): Promise<APIResponse<null>> {
    try {
      logger.info('authService:resetPassword', 'Password reset requested', { email });

      // Validate input
      if (!email) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Email is required', 400, { email });
      }

      // Check rate limit
      const rateCheck = rateLimiter.checkLimit(email, 'password-reset');
      if (!rateCheck.allowed) {
        logger.warn('authService:resetPassword', 'Rate limit exceeded', { email });
        throw new APIError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          rateCheck.message || 'Too many password reset attempts. Please try again later.',
          429,
          { email }
        );
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email);

      // Reset rate limit on success
      rateLimiter.reset(email, 'password-reset');

      logger.info('authService:resetPassword', 'Password reset email sent', { email });
      return wrapResponse(null);
    } catch (error) {
      logger.error('authService:resetPassword', 'Password reset failed', error, { email });

      // Handle specific Firebase errors
      if (error instanceof Error) {
        if (error.message.includes('auth/user-not-found')) {
          // For security reasons, we don't reveal if user exists
          logger.info('authService:resetPassword', 'Password reset requested for non-existent user', {
            email,
          });
          // Still return success to prevent user enumeration
          return wrapResponse(null);
        }
      }

      return wrapError(error, 'authService:resetPassword', email);
    }
  },

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<APIResponse<null>> {
    try {
      logger.info('authService:confirmPasswordReset', 'Password reset confirmation');

      // Validate input
      if (!oobCode || !newPassword) {
        throw new APIError(
          ErrorCodes.INVALID_INPUT,
          'Reset code and new password are required',
          400
        );
      }

      // Confirm password reset
      await confirmPasswordReset(auth, oobCode, newPassword);

      logger.info('authService:confirmPasswordReset', 'Password reset confirmed');
      return wrapResponse(null);
    } catch (error) {
      logger.error('authService:confirmPasswordReset', 'Password reset confirmation failed', error);
      return wrapError(error, 'authService:confirmPasswordReset');
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(oobCode: string): Promise<APIResponse<null>> {
    try {
      logger.info('authService:verifyEmail', 'Email verification requested');

      // Validate input
      if (!oobCode) {
        throw new APIError(ErrorCodes.INVALID_INPUT, 'Verification code is required', 400);
      }

      // Apply action code
      await applyActionCode(auth, oobCode);

      logger.info('authService:verifyEmail', 'Email verified successfully');
      return wrapResponse(null);
    } catch (error) {
      logger.error('authService:verifyEmail', 'Email verification failed', error);
      return wrapError(error, 'authService:verifyEmail');
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: AppUser | null) => void): () => void {
    logger.info('authService:onAuthStateChanged', 'Setting up auth state listener');

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await convertFirebaseUserToAppUser(firebaseUser);
          callback(appUser);
        } catch (error) {
          logger.error('authService:onAuthStateChanged', 'Failed to convert user', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AppUser | null> {
    if (!auth.currentUser) {
      return null;
    }

    try {
      return await convertFirebaseUserToAppUser(auth.currentUser);
    } catch (error) {
      logger.error('authService:getCurrentUser', 'Failed to get current user', error);
      return null;
    }
  },
};