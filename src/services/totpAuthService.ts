/**
 * TOTP-based Two-Factor Authentication Service
 * Implements Time-based One-Time Password (TOTP) using OATH standard
 * Compatible with Google Authenticator, Authy, and other TOTP apps
 */

import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { logger } from '@/utils/logger';

/**
 * TOTP Configuration
 */
const TOTP_CONFIG = {
  issuer: 'NataCarePM',
  algorithm: 'SHA1' as const,
  digits: 6,
  period: 30, // 30 seconds
  window: 1, // Allow 1 period before/after for clock skew
};

/**
 * Generate backup codes for recovery
 */
export const generateBackupCodes = (count: number = 10): string[] => {
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
 * Hash backup code for secure storage
 * In production, use bcrypt or similar
 */
const hashBackupCode = async (code: string): Promise<string> => {
  // Simple hash for demonstration - replace with bcrypt in production
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate TOTP secret and QR code for enrollment
 */
export const generateTOTPSecret = async (
  userId: string,
  email: string
): Promise<{
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  manualEntryKey?: string;
  error?: string;
}> => {
  try {
    logger.info('Generating TOTP secret', { userId });

    // Generate random secret (base32 encoded)
    const secret = new Secret({ size: 20 });

    // Create TOTP instance
    const totp = new TOTP({
      issuer: TOTP_CONFIG.issuer,
      label: email,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
      secret: secret,
    });

    // Generate otpauth URL
    const otpauthUrl = totp.toString();

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Manual entry key (formatted for easier entry)
    const manualEntryKey = secret.base32;

    logger.info('TOTP secret generated successfully', { userId });

    return {
      success: true,
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey,
    };
  } catch (error: any) {
    logger.error('Error generating TOTP secret', error, { userId });

    return {
      success: false,
      error: error.message || 'Failed to generate TOTP secret',
    };
  }
};

/**
 * Verify TOTP code
 */
export const verifyTOTPCode = (secret: string, token: string): boolean => {
  try {
    // Recreate TOTP instance
    const totp = new TOTP({
      issuer: TOTP_CONFIG.issuer,
      algorithm: TOTP_CONFIG.algorithm,
      digits: TOTP_CONFIG.digits,
      period: TOTP_CONFIG.period,
      secret: Secret.fromBase32(secret),
    });

    // Validate token with time window
    const delta = totp.validate({
      token,
      window: TOTP_CONFIG.window,
    });

    // delta is null if invalid, or a number indicating time difference
    return delta !== null;
  } catch (error: any) {
    logger.error('Error verifying TOTP code', error);
    return false;
  }
};

/**
 * Complete TOTP enrollment
 */
export const enrollTOTP = async (
  userId: string,
  secret: string,
  verificationCode: string
): Promise<{
  success: boolean;
  backupCodes?: string[];
  error?: string;
}> => {
  try {
    logger.info('Enrolling TOTP for user', { userId });

    // Verify the code first
    const isValid = verifyTOTPCode(secret, verificationCode);

    if (!isValid) {
      logger.warn('Invalid TOTP code during enrollment', { userId });
      return {
        success: false,
        error: 'Kode verifikasi tidak valid. Pastikan kode dari aplikasi authenticator Anda benar.',
      };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = await Promise.all(backupCodes.map((code) => hashBackupCode(code)));

    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorEnabled: true,
      twoFactorMethod: 'totp',
      totpSecret: secret, // In production, encrypt this before storing
      twoFactorBackupCodes: hashedCodes,
      twoFactorEnrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logger.info('TOTP enrollment completed successfully', { userId });

    // Log security activity
    await logTwoFactorActivity(userId, '2fa_totp_enabled');

    return {
      success: true,
      backupCodes, // Return plain codes to show user (only time they see them)
    };
  } catch (error: any) {
    logger.error('Error enrolling TOTP', error, { userId });

    return {
      success: false,
      error: error.message || 'Gagal mengaktifkan 2FA. Silakan coba lagi.',
    };
  }
};

/**
 * Verify TOTP during login
 */
export const verifyTOTPLogin = async (
  userId: string,
  code: string,
  isBackupCode: boolean = false
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    logger.info('Verifying TOTP login', { userId, isBackupCode });

    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'User tidak ditemukan',
      };
    }

    const userData = userDoc.data();

    // Check if 2FA is enabled
    if (!userData.twoFactorEnabled || userData.twoFactorMethod !== 'totp') {
      return {
        success: false,
        error: '2FA tidak aktif untuk akun ini',
      };
    }

    // Verify backup code
    if (isBackupCode) {
      const hashedCode = await hashBackupCode(code);
      const backupCodes = userData.twoFactorBackupCodes || [];

      if (!backupCodes.includes(hashedCode)) {
        logger.warn('Invalid backup code used', { userId });
        await logTwoFactorActivity(userId, '2fa_failed_backup_code');

        return {
          success: false,
          error: 'Kode backup tidak valid',
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

      await logTwoFactorActivity(userId, '2fa_verified_backup_code');

      return {
        success: true,
      };
    }

    // Verify TOTP code
    const secret = userData.totpSecret;
    if (!secret) {
      return {
        success: false,
        error: 'TOTP secret tidak ditemukan',
      };
    }

    const isValid = verifyTOTPCode(secret, code);

    if (!isValid) {
      logger.warn('Invalid TOTP code during login', { userId });
      await logTwoFactorActivity(userId, '2fa_failed_totp');

      return {
        success: false,
        error: 'Kode verifikasi tidak valid atau telah kadaluarsa',
      };
    }

    logger.info('TOTP verification successful', { userId });
    await logTwoFactorActivity(userId, '2fa_verified_totp');

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('Error verifying TOTP login', error, { userId });

    return {
      success: false,
      error: error.message || 'Gagal memverifikasi kode 2FA',
    };
  }
};

/**
 * Disable TOTP
 */
export const disableTOTP = async (
  userId: string,
  _password: string // Prefix with _ to indicate intentionally unused (for future reauthentication)
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    logger.info('Disabling TOTP for user', { userId });

    // TODO: In production, verify password with reauthentication
    // For now, we'll assume password is verified

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorEnabled: false,
      twoFactorMethod: null,
      totpSecret: null,
      twoFactorBackupCodes: [],
      twoFactorDisabledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logger.info('TOTP disabled successfully', { userId });

    // Log security activity
    await logTwoFactorActivity(userId, '2fa_totp_disabled');

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('Error disabling TOTP', error, { userId });

    return {
      success: false,
      error: error.message || 'Gagal menonaktifkan 2FA',
    };
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateTOTPBackupCodes = async (
  userId: string,
  _password: string // Prefix with _ to indicate intentionally unused (for future reauthentication)
): Promise<{
  success: boolean;
  backupCodes?: string[];
  error?: string;
}> => {
  try {
    logger.info('Regenerating TOTP backup codes', { userId });

    // TODO: In production, verify password with reauthentication

    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    const hashedCodes = await Promise.all(backupCodes.map((code) => hashBackupCode(code)));

    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      twoFactorBackupCodes: hashedCodes,
      backupCodesRegeneratedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    logger.info('TOTP backup codes regenerated', { userId });

    // Log security activity
    await logTwoFactorActivity(userId, '2fa_backup_codes_regenerated');

    return {
      success: true,
      backupCodes,
    };
  } catch (error: any) {
    logger.error('Error regenerating backup codes', error, { userId });

    return {
      success: false,
      error: error.message || 'Gagal membuat ulang kode backup',
    };
  }
};

/**
 * Get TOTP status
 */
export const getTOTPStatus = async (
  userId: string
): Promise<{
  enabled: boolean;
  enrolledAt?: Date;
  backupCodesRemaining?: number;
  method?: string;
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
      enrolledAt: userData.twoFactorEnrolledAt?.toDate(),
      backupCodesRemaining: userData.twoFactorBackupCodes?.length || 0,
    };
  } catch (error: any) {
    logger.error('Error getting TOTP status', error, { userId });
    return { enabled: false };
  }
};

/**
 * Log 2FA activity
 */
const logTwoFactorActivity = async (userId: string, action: string): Promise<void> => {
  try {
    const activityRef = doc(db, 'activityLogs', `${userId}_${Date.now()}`);
    await setDoc(activityRef, {
      userId,
      action: 'security_setting_change',
      category: 'security',
      description: `Two-factor authentication: ${action.replace('2fa_', '').replace(/_/g, ' ')}`,
      details: { twoFactorAction: action },
      status: 'success',
      securityRelevant: true,
      riskLevel: action.includes('failed') ? 'high' : 'medium',
      timestamp: serverTimestamp(),
    });
  } catch (error: any) {
    logger.error('Error logging 2FA activity', error, { userId, action });
  }
};

export default {
  generateTOTPSecret,
  verifyTOTPCode,
  enrollTOTP,
  verifyTOTPLogin,
  disableTOTP,
  regenerateTOTPBackupCodes,
  getTOTPStatus,
  generateBackupCodes,
};
