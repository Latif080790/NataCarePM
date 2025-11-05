/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA for enhanced security
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { getAuth, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type { APIResponse } from '@/types/userProfile';

// ========================================
// TYPES
// ========================================

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  isVerified: boolean;
}

export interface BackupCodeInfo {
  codes: string[];
  usedCodes: string[];
  generatedAt: Date;
}

// ========================================
// CONSTANTS
// ========================================

const TWO_FACTOR_COLLECTION = 'twoFactorAuth';
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

// ========================================
// 2FA SETUP
// ========================================

/**
 * Generate TOTP secret and QR code for 2FA setup
 */
export const generateTwoFactorSecret = async (
  userId: string,
  userEmail: string
): Promise<APIResponse<TwoFactorSetup>> => {
  try {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `NataCarePM (${userEmail})`,
      issuer: 'NataCarePM',
      length: 32,
    });

    // Generate QR code URL
    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: encodeURIComponent(`NataCarePM (${userEmail})`),
      issuer: 'NataCarePM',
      encoding: 'base32',
    });

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Store temporary setup data (not yet verified)
    const setupData = {
      secret: secret.base32,
      backupCodes,
      createdAt: new Date(),
      verified: false,
    };

    await setDoc(doc(db, TWO_FACTOR_COLLECTION, userId), setupData);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

    return {
      success: true,
      data: {
        secret: secret.base32,
        qrCodeUrl: qrCodeDataUrl,
        backupCodes,
      },
    };
  } catch (error: any) {
    console.error('Error generating 2FA secret:', error);
    return {
      success: false,
      error: {
        code: 'TWO_FACTOR_SETUP_ERROR',
        message: 'Failed to generate 2FA setup',
        details: error,
      },
    };
  }
};

/**
 * Verify and enable 2FA for user
 */
export const verifyAndEnableTwoFactor = async (
  userId: string,
  token: string
): Promise<APIResponse<boolean>> => {
  try {
    const docRef = doc(db, TWO_FACTOR_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'TWO_FACTOR_NOT_SETUP',
          message: '2FA setup not found',
        },
      };
    }

    const setupData = docSnap.data();

    // Verify TOTP token
    const isValid = speakeasy.totp.verify({
      secret: setupData.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (30 seconds) tolerance
    });

    if (!isValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOTP_TOKEN',
          message: 'Invalid 2FA token',
        },
      };
    }

    // Mark as verified and store backup codes securely
    await updateDoc(docRef, {
      verified: true,
      enabledAt: new Date(),
      backupCodesUsed: [],
    });

    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    console.error('Error verifying 2FA:', error);
    return {
      success: false,
      error: {
        code: 'TWO_FACTOR_VERIFICATION_ERROR',
        message: 'Failed to verify 2FA',
        details: error,
      },
    };
  }
};

/**
 * Disable 2FA for user
 */
export const disableTwoFactor = async (
  userId: string,
  token: string
): Promise<APIResponse<boolean>> => {
  try {
    const docRef = doc(db, TWO_FACTOR_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'TWO_FACTOR_NOT_ENABLED',
          message: '2FA not enabled',
        },
      };
    }

    const setupData = docSnap.data();

    // Verify TOTP token before disabling
    const isValid = speakeasy.totp.verify({
      secret: setupData.secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOTP_TOKEN',
          message: 'Invalid 2FA token',
        },
      };
    }

    // Remove 2FA data
    await setDoc(docRef, {
      disabledAt: new Date(),
      verified: false,
    });

    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    console.error('Error disabling 2FA:', error);
    return {
      success: false,
      error: {
        code: 'TWO_FACTOR_DISABLE_ERROR',
        message: 'Failed to disable 2FA',
        details: error,
      },
    };
  }
};

// ========================================
// 2FA VERIFICATION
// ========================================

/**
 * Verify 2FA token during login
 */
export const verifyTwoFactorToken = async (
  userId: string,
  token: string
): Promise<APIResponse<TwoFactorVerification>> => {
  try {
    const docRef = doc(db, TWO_FACTOR_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'TWO_FACTOR_NOT_ENABLED',
          message: '2FA not enabled for this user',
        },
      };
    }

    const setupData = docSnap.data();

    if (!setupData.verified) {
      return {
        success: false,
        error: {
          code: 'TWO_FACTOR_NOT_VERIFIED',
          message: '2FA not verified',
        },
      };
    }

    // Verify TOTP token
    const isValid = speakeasy.totp.verify({
      secret: setupData.secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    return {
      success: true,
      data: {
        token,
        isVerified: isValid,
      },
    };
  } catch (error: any) {
    console.error('Error verifying 2FA token:', error);
    return {
      success: false,
      error: {
        code: 'TWO_FACTOR_VERIFICATION_ERROR',
        message: 'Failed to verify 2FA token',
        details: error,
      },
    };
  }
};

/**
 * Verify backup code
 */
export const verifyBackupCode = async (
  userId: string,
  backupCode: string
): Promise<APIResponse<boolean>> => {
  try {
    const docRef = doc(db, TWO_FACTOR_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: {
          code: 'TWO_FACTOR_NOT_ENABLED',
          message: '2FA not enabled',
        },
      };
    }

    const setupData = docSnap.data();
    const backupCodes = setupData.backupCodes || [];
    const usedCodes = setupData.backupCodesUsed || [];

    // Check if code exists and hasn't been used
    if (!backupCodes.includes(backupCode) || usedCodes.includes(backupCode)) {
      return {
        success: false,
        error: {
          code: 'INVALID_BACKUP_CODE',
          message: 'Invalid or used backup code',
        },
      };
    }

    // Mark code as used
    usedCodes.push(backupCode);
    await updateDoc(docRef, {
      backupCodesUsed: usedCodes,
      lastBackupCodeUsed: new Date(),
    });

    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    console.error('Error verifying backup code:', error);
    return {
      success: false,
      error: {
        code: 'BACKUP_CODE_VERIFICATION_ERROR',
        message: 'Failed to verify backup code',
        details: error,
      },
    };
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if user has 2FA enabled
 */
export const isTwoFactorEnabled = async (userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, TWO_FACTOR_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return false;
    }

    const setupData = docSnap.data();
    return setupData.verified === true;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
};

/**
 * Get 2FA status for user
 */
export const getTwoFactorStatus = async (
  userId: string
): Promise<APIResponse<{ enabled: boolean; setupComplete: boolean }>> => {
  try {
    const docRef = doc(db, TWO_FACTOR_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: true,
        data: {
          enabled: false,
          setupComplete: false,
        },
      };
    }

    const setupData = docSnap.data();

    return {
      success: true,
      data: {
        enabled: setupData.verified === true,
        setupComplete: setupData.verified === true,
      },
    };
  } catch (error: any) {
    console.error('Error getting 2FA status:', error);
    return {
      success: false,
      error: {
        code: 'TWO_FACTOR_STATUS_ERROR',
        message: 'Failed to get 2FA status',
        details: error,
      },
    };
  }
};

/**
 * Generate backup codes
 */
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate random alphanumeric code
    const code = Array.from({ length: BACKUP_CODE_LENGTH }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');

    codes.push(code);
  }

  return codes;
};

/**
 * Regenerate backup codes (invalidates old ones)
 */
export const regenerateBackupCodes = async (
  userId: string
): Promise<APIResponse<string[]>> => {
  try {
    const newCodes = generateBackupCodes();

    const docRef = doc(db, TWO_FACTOR_COLLECTION, userId);
    await updateDoc(docRef, {
      backupCodes: newCodes,
      backupCodesUsed: [],
      backupCodesRegeneratedAt: new Date(),
    });

    return {
      success: true,
      data: newCodes,
    };
  } catch (error: any) {
    console.error('Error regenerating backup codes:', error);
    return {
      success: false,
      error: {
        code: 'BACKUP_CODE_REGENERATION_ERROR',
        message: 'Failed to regenerate backup codes',
        details: error,
      },
    };
  }
};

// ========================================
// EXPORT
// ========================================

export const twoFactorAuth = {
  generateSecret: generateTwoFactorSecret,
  verifyAndEnable: verifyAndEnableTwoFactor,
  disable: disableTwoFactor,
  verifyToken: verifyTwoFactorToken,
  verifyBackupCode,
  isEnabled: isTwoFactorEnabled,
  getStatus: getTwoFactorStatus,
  regenerateBackupCodes,
};
