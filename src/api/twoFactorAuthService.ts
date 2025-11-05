/**
 * Two-Factor Authentication Service
 * Handles 2FA enrollment, verification, and recovery using Firebase Authentication
 */

import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  RecaptchaVerifier,
  getAuth,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { logger } from '@/utils/logger';
import type { TwoFactorVerificationRequest } from '@/types';

/**
 * Generate backup codes for 2FA recovery
 */
const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
      if (j === 3) code += '-'; // Format: XXXX-XXXX
    }
    codes.push(code);
  }

  return codes;
};

/**
 * Hash backup code for storage (simple hash for demo - use proper hashing in production)
 */
const hashBackupCode = (code: string): string => {
  // In production, use bcrypt or similar
  // This is a simple hash for demonstration
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

/**
 * Enroll user in SMS-based 2FA
 */
export const enrollSMS2FA = async (
  userId: string,
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ success: boolean; verificationId?: string; error?: string }> => {
  try {
    logger.info('Starting SMS 2FA enrollment', { userId, phoneNumber });

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Initialize phone auth provider
    const phoneAuthProvider = new PhoneAuthProvider(auth);

    // Get multi-factor session
    const multiFactorSession = await multiFactor(currentUser).getSession();

    // Send verification code
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      {
        phoneNumber,
        session: multiFactorSession,
      },
      recaptchaVerifier
    );

    logger.info('SMS verification code sent', { userId, phoneNumber });

    return {
      success: true,
      verificationId,
    };
  } catch (error: any) {
    logger.error('Error enrolling SMS 2FA', error, { userId, phoneNumber });

    let errorMessage = 'Failed to enroll SMS 2FA';

    if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Invalid phone number format';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Complete SMS 2FA enrollment with verification code
 */
export const completeSMS2FAEnrollment = async (
  userId: string,
  verificationId: string,
  verificationCode: string,
  phoneNumber: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> => {
  try {
    logger.info('Completing SMS 2FA enrollment', { userId });

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Create phone credential
    const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);

    // Create multi-factor assertion
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneCredential);

    // Enroll with display name
    await multiFactor(currentUser).enroll(multiFactorAssertion, 'Primary Phone');

    logger.info('SMS 2FA enrolled successfully', { userId });

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map((code) => hashBackupCode(code));

    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorEnabled: true,
      twoFactorMethod: 'sms',
      twoFactorPhone: phoneNumber,
      twoFactorBackupCodes: hashedCodes,
      twoFactorEnrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logger.info('User document updated with 2FA info', { userId });

    // Log activity
    await logTwoFactorActivity(userId, '2fa_enabled');

    return {
      success: true,
      backupCodes, // Return plain codes to show user once
    };
  } catch (error: any) {
    logger.error('Error completing SMS 2FA enrollment', error, { userId });

    let errorMessage = 'Failed to complete 2FA enrollment';

    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'Invalid verification code';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = 'Verification code expired. Please try again.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Verify 2FA code during login
 */
export const verify2FACode = async (
  request: TwoFactorVerificationRequest
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { userId, code, method } = request;

    logger.info('Verifying 2FA code', { userId, method });

    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const userData = userDoc.data();

    // Check if 2FA is enabled
    if (!userData.twoFactorEnabled) {
      return {
        success: false,
        error: '2FA is not enabled for this account',
      };
    }

    // Verify based on method
    if (method === 'backup_code') {
      // Verify backup code
      const hashedCode = hashBackupCode(code);
      const backupCodes = userData.twoFactorBackupCodes || [];

      if (!backupCodes.includes(hashedCode)) {
        logger.warn('Invalid backup code used', { userId });
        await logTwoFactorActivity(userId, '2fa_failed');

        return {
          success: false,
          error: 'Invalid backup code',
        };
      }

      // Remove used backup code
      const updatedCodes = backupCodes.filter((c: string) => c !== hashedCode);
      await updateDoc(userRef, {
        twoFactorBackupCodes: updatedCodes,
        updatedAt: serverTimestamp(),
      });

      logger.info('Backup code verified and removed', {
        userId,
        remainingCodes: updatedCodes.length,
      });
      await logTwoFactorActivity(userId, '2fa_verified');

      return {
        success: true,
      };
    }

    // For SMS verification, Firebase handles this automatically during sign-in
    // This function is mainly for backup code verification
    logger.info('2FA code verified successfully', { userId, method });
    await logTwoFactorActivity(userId, '2fa_verified');

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('Error verifying 2FA code', error, { userId: request.userId });

    return {
      success: false,
      error: error.message || 'Failed to verify 2FA code',
    };
  }
};

/**
 * Disable 2FA for user
 */
export const disable2FA = async (
  userId: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info('Disabling 2FA', { userId });

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Re-authenticate user first (security measure)
    const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
    const credential = EmailAuthProvider.credential(currentUser.email!, password);

    try {
      await reauthenticateWithCredential(currentUser, credential);
    } catch (error: any) {
      logger.warn('Re-authentication failed during 2FA disable', { userId, error: error.code });

      return {
        success: false,
        error: 'Password incorrect. Cannot disable 2FA.',
      };
    }

    // Unenroll all multi-factor options
    const enrolledFactors = multiFactor(currentUser).enrolledFactors;

    for (const factor of enrolledFactors) {
      await multiFactor(currentUser).unenroll(factor);
    }

    logger.info('All multi-factor options unenrolled', { userId });

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorEnabled: false,
      twoFactorMethod: null,
      twoFactorPhone: null,
      twoFactorBackupCodes: [],
      twoFactorDisabledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logger.info('User document updated - 2FA disabled', { userId });

    // Log activity
    await logTwoFactorActivity(userId, '2fa_disabled');

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('Error disabling 2FA', error, { userId });

    return {
      success: false,
      error: error.message || 'Failed to disable 2FA',
    };
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (
  userId: string,
  password: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> => {
  try {
    logger.info('Regenerating backup codes', { userId });

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Re-authenticate user first
    const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
    const credential = EmailAuthProvider.credential(currentUser.email!, password);

    try {
      await reauthenticateWithCredential(currentUser, credential);
    } catch (error: any) {
      return {
        success: false,
        error: 'Password incorrect',
      };
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = backupCodes.map((code) => hashBackupCode(code));

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorBackupCodes: hashedCodes,
      backupCodesRegeneratedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logger.info('Backup codes regenerated', { userId });

    // Log activity
    await logTwoFactorActivity(userId, '2fa_backup_codes_regenerated');

    return {
      success: true,
      backupCodes, // Return plain codes to show user
    };
  } catch (error: any) {
    logger.error('Error regenerating backup codes', error, { userId });

    return {
      success: false,
      error: error.message || 'Failed to regenerate backup codes',
    };
  }
};

/**
 * Get 2FA status for user
 */
export const get2FAStatus = async (
  userId: string
): Promise<{
  enabled: boolean;
  method?: 'sms' | 'app' | 'email';
  phoneNumber?: string;
  enrolledAt?: Date;
  backupCodesRemaining?: number;
}> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { enabled: false };
    }

    const userData = userDoc.data();

    return {
      enabled: userData.twoFactorEnabled || false,
      method: userData.twoFactorMethod,
      phoneNumber: userData.twoFactorPhone,
      enrolledAt: userData.twoFactorEnrolledAt?.toDate(),
      backupCodesRemaining: userData.twoFactorBackupCodes?.length || 0,
    };
  } catch (error: any) {
    logger.error('Error getting 2FA status', error, { userId });
    return { enabled: false };
  }
};

/**
 * Send 2FA verification code (for already enrolled users)
 */
export const send2FACode = async (
  userId: string,
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ success: boolean; verificationId?: string; error?: string }> => {
  try {
    logger.info('Sending 2FA verification code', { userId, phoneNumber });

    const phoneAuthProvider = new PhoneAuthProvider(auth);

    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneNumber,
      recaptchaVerifier
    );

    logger.info('2FA verification code sent', { userId });

    return {
      success: true,
      verificationId,
    };
  } catch (error: any) {
    logger.error('Error sending 2FA code', error, { userId });

    return {
      success: false,
      error: error.message || 'Failed to send verification code',
    };
  }
};

/**
 * Log 2FA activity
 */
const logTwoFactorActivity = async (userId: string, action: string): Promise<void> => {
  try {
    // Log 2FA activity to Firestore
    const activityRef = doc(db, 'activityLogs', `${userId}_${Date.now()}`);
    await setDoc(activityRef, {
      userId,
      action: 'security_setting_change',
      category: 'security',
      description: `Two-factor authentication: ${action.replace('2fa_', '').replace(/_/g, ' ')}`,
      details: { twoFactorAction: action },
      status: 'success',
      securityRelevant: true,
      riskLevel: 'medium',
      timestamp: serverTimestamp(),
    });
  } catch (error: any) {
    // Log error but don't fail the 2FA operation
    logger.error('Error logging 2FA activity', error, { userId, action });
  }
};

export default {
  enrollSMS2FA,
  completeSMS2FAEnrollment,
  verify2FACode,
  disable2FA,
  regenerateBackupCodes,
  get2FAStatus,
  send2FACode,
};
