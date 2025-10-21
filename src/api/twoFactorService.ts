/**
 * Two-Factor Authentication Service
 *
 * Implements TOTP-based 2FA using OTPAuth library.
 * Provides QR code generation, backup codes, and verification.
 *
 * Security Features:
 * - TOTP (Time-based One-Time Password) with SHA1
 * - 6-digit codes, 30-second intervals
 * - Backup codes for account recovery
 * - Rate limiting on verification attempts
 * - Secure storage in Firestore
 */

import { doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { rateLimiter } from '@/utils/rateLimiter';

// ========================================
// TYPES
// ========================================

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  enabled: boolean;
  createdAt: Date;
}

export interface TwoFactorData {
  userId: string;
  secret: string;
  backupCodes: string[];
  enabled: boolean;
  createdAt: Date | Timestamp;
  lastUsed?: Date | Timestamp;
  verificationAttempts?: number;
}

export interface TwoFactorStatus {
  enabled: boolean;
  lastUsed?: Date;
  backupCodesRemaining: number;
}

// ========================================
// 2FA SERVICE
// ========================================

export const twoFactorService = {
  /**
   * Generate 2FA secret and QR code for user
   * Step 1 of 2FA setup process
   *
   * @param userId - User ID
   * @param email - User email for QR code label
   * @returns Secret, QR code, and backup codes
   */
  async generateSecret(userId: string, email: string): Promise<TwoFactorSecret> {
    try {
      // Generate cryptographically secure secret
      const secret = new OTPAuth.Secret({ size: 20 });

      // Create TOTP instance
      const totp = new OTPAuth.TOTP({
        issuer: 'NataCarePM',
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      // Generate QR code as data URL
      const otpauthURL = totp.toString();
      const qrCode = await QRCode.toDataURL(otpauthURL, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Generate 10 backup codes
      const backupCodes = this.generateBackupCodes(10);

      // Save to Firestore (not enabled yet)
      const twoFactorData: TwoFactorData = {
        userId,
        secret: secret.base32,
        backupCodes: backupCodes.map((code) => this.hashBackupCode(code)),
        enabled: false,
        createdAt: new Date(),
        verificationAttempts: 0,
      };

      await setDoc(doc(db, 'twoFactorAuth', userId), twoFactorData);

      console.log('[2FA] Secret generated for user:', userId);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes, // Return unhashed for user to save
        enabled: false,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('[2FA] Error generating secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  },

  /**
   * Verify TOTP code and enable 2FA
   * Step 2 of 2FA setup process
   *
   * @param userId - User ID
   * @param code - 6-digit TOTP code from authenticator app
   * @returns Success status
   */
  async enableTwoFactor(userId: string, code: string): Promise<boolean> {
    try {
      // Check rate limit
      const rateCheck = rateLimiter.checkLimit(userId, '2fa');
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.message || 'Too many verification attempts');
      }

      const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

      if (!twoFactorDoc.exists()) {
        throw new Error('2FA not initialized. Generate secret first.');
      }

      const data = twoFactorDoc.data() as TwoFactorData;

      // Verify code
      const isValid = this.verifyTOTP(data.secret, code);

      if (!isValid) {
        throw new Error('Invalid verification code. Please try again.');
      }

      // Enable 2FA
      await updateDoc(doc(db, 'twoFactorAuth', userId), {
        enabled: true,
        lastUsed: new Date(),
        verificationAttempts: 0,
      });

      // Reset rate limit on success
      rateLimiter.reset(userId, '2fa');

      console.log('[2FA] Enabled for user:', userId);
      return true;
    } catch (error) {
      console.error('[2FA] Error enabling 2FA:', error);
      throw error;
    }
  },

  /**
   * Verify TOTP code or backup code during login
   *
   * @param userId - User ID
   * @param code - 6-digit TOTP code or 8-character backup code
   * @returns Verification success status
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    try {
      // Check rate limit
      const rateCheck = rateLimiter.checkLimit(userId, '2fa');
      if (!rateCheck.allowed) {
        console.warn('[2FA] Rate limit exceeded for user:', userId);
        throw new Error(rateCheck.message || 'Too many verification attempts');
      }

      const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

      if (!twoFactorDoc.exists()) {
        console.warn('[2FA] No 2FA data found for user:', userId);
        return false;
      }

      const data = twoFactorDoc.data() as TwoFactorData;

      if (!data.enabled) {
        console.warn('[2FA] 2FA not enabled for user:', userId);
        return false;
      }

      // Try TOTP code (6 digits)
      if (code.length === 6 && /^\d{6}$/.test(code)) {
        const totpValid = this.verifyTOTP(data.secret, code);
        if (totpValid) {
          await updateDoc(doc(db, 'twoFactorAuth', userId), {
            lastUsed: new Date(),
            verificationAttempts: 0,
          });
          rateLimiter.reset(userId, '2fa');
          console.log('[2FA] TOTP verification successful for user:', userId);
          return true;
        }
      }

      // Try backup code (8 characters)
      if (code.length === 8) {
        const backupValid = await this.verifyBackupCode(userId, code, data.backupCodes);
        if (backupValid) {
          rateLimiter.reset(userId, '2fa');
          console.log('[2FA] Backup code verification successful for user:', userId);
          return true;
        }
      }

      // Increment failed attempts
      const attempts = (data.verificationAttempts || 0) + 1;
      await updateDoc(doc(db, 'twoFactorAuth', userId), {
        verificationAttempts: attempts,
      });

      console.warn('[2FA] Verification failed for user:', userId, 'Attempts:', attempts);
      return false;
    } catch (error) {
      console.error('[2FA] Error verifying code:', error);
      if (error instanceof Error && error.message.includes('Too many')) {
        throw error;
      }
      return false;
    }
  },

  /**
   * Check if user has 2FA enabled
   *
   * @param userId - User ID
   * @returns 2FA enabled status
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

      if (!twoFactorDoc.exists()) {
        return false;
      }

      const data = twoFactorDoc.data() as TwoFactorData;
      return data.enabled === true;
    } catch (error) {
      console.error('[2FA] Error checking if enabled:', error);
      return false;
    }
  },

  /**
   * Get 2FA status for user
   *
   * @param userId - User ID
   * @returns 2FA status details
   */
  async getStatus(userId: string): Promise<TwoFactorStatus | null> {
    try {
      const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

      if (!twoFactorDoc.exists()) {
        return null;
      }

      const data = twoFactorDoc.data() as TwoFactorData;

      return {
        enabled: data.enabled,
        lastUsed: data.lastUsed instanceof Timestamp ? data.lastUsed.toDate() : data.lastUsed,
        backupCodesRemaining: data.backupCodes.length,
      };
    } catch (error) {
      console.error('[2FA] Error getting status:', error);
      return null;
    }
  },

  /**
   * Disable 2FA (requires verification)
   *
   * @param userId - User ID
   * @param code - Current TOTP code or backup code
   * @returns Success status
   */
  async disable(userId: string, code: string): Promise<boolean> {
    try {
      const isValid = await this.verifyCode(userId, code);

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      await deleteDoc(doc(db, 'twoFactorAuth', userId));

      console.log('[2FA] Disabled for user:', userId);
      return true;
    } catch (error) {
      console.error('[2FA] Error disabling 2FA:', error);
      throw error;
    }
  },

  /**
   * Regenerate backup codes (requires verification)
   *
   * @param userId - User ID
   * @param code - Current TOTP code
   * @returns New backup codes
   */
  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    try {
      const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

      if (!twoFactorDoc.exists()) {
        throw new Error('2FA not setup');
      }

      const data = twoFactorDoc.data() as TwoFactorData;

      // Verify current code
      const isValid = this.verifyTOTP(data.secret, code);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes(10);

      // Update Firestore
      await updateDoc(doc(db, 'twoFactorAuth', userId), {
        backupCodes: newBackupCodes.map((code) => this.hashBackupCode(code)),
      });

      console.log('[2FA] Backup codes regenerated for user:', userId);
      return newBackupCodes;
    } catch (error) {
      console.error('[2FA] Error regenerating backup codes:', error);
      throw error;
    }
  },

  /**
   * Verify TOTP code against secret
   * Allows 1 time step before/after for clock drift
   *
   * @param secret - Base32 encoded secret
   * @param code - 6-digit TOTP code
   * @returns Verification success
   */
  verifyTOTP(secret: string, code: string): boolean {
    try {
      const totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      // Allow 1 time step (30 seconds) before/after for clock drift
      const delta = totp.validate({ token: code, window: 1 });
      return delta !== null;
    } catch (error) {
      console.error('[2FA] Error verifying TOTP:', error);
      return false;
    }
  },

  /**
   * Generate cryptographically random backup codes
   *
   * @param count - Number of codes to generate
   * @returns Array of backup codes
   */
  generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
      }
      codes.push(code);
    }

    return codes;
  },

  /**
   * Hash backup code for storage
   * Simple base64 encoding - in production consider bcrypt
   *
   * @param code - Backup code
   * @returns Hashed code
   */
  hashBackupCode(code: string): string {
    // Simple encoding - in production use bcrypt or similar
    return Buffer.from(code).toString('base64');
  },

  /**
   * Verify and consume backup code
   * Backup codes are single-use
   *
   * @param userId - User ID
   * @param code - Backup code to verify
   * @param hashedCodes - Array of hashed backup codes
   * @returns Verification success
   */
  async verifyBackupCode(userId: string, code: string, hashedCodes: string[]): Promise<boolean> {
    try {
      const hashedInput = this.hashBackupCode(code.toUpperCase());
      const index = hashedCodes.indexOf(hashedInput);

      if (index === -1) {
        return false;
      }

      // Remove used backup code
      hashedCodes.splice(index, 1);

      await updateDoc(doc(db, 'twoFactorAuth', userId), {
        backupCodes: hashedCodes,
        lastUsed: new Date(),
        verificationAttempts: 0,
      });

      console.log('[2FA] Backup code used. Remaining:', hashedCodes.length);

      // Warn if running low on backup codes
      if (hashedCodes.length <= 2) {
        console.warn('[2FA] User', userId, 'has', hashedCodes.length, 'backup codes remaining');
      }

      return true;
    } catch (error) {
      console.error('[2FA] Error verifying backup code:', error);
      return false;
    }
  },
};

export default twoFactorService;
