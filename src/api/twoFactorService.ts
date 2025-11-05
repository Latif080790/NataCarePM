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
 * - Device trust management
 * - Multi-factor authentication levels
 */

import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { rateLimiter } from '@/utils/rateLimiter';
import { APIResponse, safeAsync, APIError, ErrorCodes } from '@/utils/responseWrapper';
import { logger } from '@/utils/logger.enhanced';

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
  trustedDevices?: TrustedDevice[];
  recoveryEmail?: string;
  mfaLevel?: 'standard' | 'enhanced' | 'strict';
}

export interface TrustedDevice {
  id: string;
  deviceId: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date;
}

export interface TwoFactorStatus {
  enabled: boolean;
  lastUsed?: Date;
  backupCodesRemaining: number;
  trustedDevicesCount: number;
  mfaLevel?: 'standard' | 'enhanced' | 'strict';
}

export interface TwoFactorRecoveryOptions {
  recoveryEmail?: string;
  phoneNumber?: string;
  securityQuestions?: SecurityQuestion[];
}

export interface SecurityQuestion {
  id: string;
  question: string;
  answer: string; // Hashed
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
  async generateSecret(userId: string, email: string): Promise<APIResponse<TwoFactorSecret>> {
    return await safeAsync(async () => {
      try {
        logger.info('Generating 2FA secret for user', { userId });

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
          trustedDevices: [],
        };

        await setDoc(doc(db, 'twoFactorAuth', userId), twoFactorData);

        logger.info('2FA secret generated successfully', { userId });

        return {
          secret: secret.base32,
          qrCode,
          backupCodes, // Return unhashed for user to save
          enabled: false,
          createdAt: new Date(),
        };
      } catch (error: any) {
        logger.error('Error generating 2FA secret', error as Error);
        throw new APIError(ErrorCodes.INTERNAL_ERROR, 'Failed to generate 2FA secret', 500);
      }
    }, 'twoFactorService.generateSecret');
  },

  /**
   * Verify TOTP code and enable 2FA
   * Step 2 of 2FA setup process
   *
   * @param userId - User ID
   * @param code - 6-digit TOTP code from authenticator app
   * @returns Success status
   */
  async enableTwoFactor(userId: string, code: string): Promise<APIResponse<boolean>> {
    return await safeAsync(async () => {
      try {
        logger.info('Enabling 2FA for user', { userId });

        // Check rate limit
        const rateCheck = rateLimiter.checkLimit(userId, '2fa');
        if (!rateCheck.allowed) {
          throw new APIError(ErrorCodes.RATE_LIMIT_EXCEEDED, rateCheck.message || 'Too many verification attempts', 429);
        }

        const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

        if (!twoFactorDoc.exists()) {
          throw new APIError(ErrorCodes.NOT_FOUND, '2FA not initialized. Generate secret first.', 400);
        }

        const data = twoFactorDoc.data() as TwoFactorData;

        // Verify code
        const isValid = this.verifyTOTP(data.secret, code);

        if (!isValid) {
          // Increment verification attempts
          await updateDoc(doc(db, 'twoFactorAuth', userId), {
            verificationAttempts: (data.verificationAttempts || 0) + 1,
          });
          
          throw new APIError(ErrorCodes.INVALID_INPUT, 'Invalid verification code. Please try again.', 400);
        }

        // Enable 2FA
        await updateDoc(doc(db, 'twoFactorAuth', userId), {
          enabled: true,
          lastUsed: new Date(),
          verificationAttempts: 0,
          mfaLevel: 'standard', // Default level
        });

        // Reset rate limit on success
        rateLimiter.reset(userId, '2fa');

        logger.info('2FA enabled successfully', { userId });
        return true;
      } catch (error: any) {
        logger.error('Error enabling 2FA', error as Error);
        throw error;
      }
    }, 'twoFactorService.enableTwoFactor');
  },

  /**
   * Verify TOTP code or backup code during login
   *
   * @param userId - User ID
   * @param code - 6-digit TOTP code or 8-character backup code
   * @param deviceId - Device identifier for trusted device checking
   * @param ipAddress - IP address for logging
   * @param userAgent - User agent for logging
   * @returns Verification success status
   */
  async verifyCode(
    userId: string, 
    code: string, 
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<APIResponse<{ success: boolean; trustedDevice?: boolean }>> {
    return await safeAsync(async () => {
      try {
        logger.info('Verifying 2FA code for user', { userId });

        // Check rate limit
        const rateCheck = rateLimiter.checkLimit(userId, '2fa');
        if (!rateCheck.allowed) {
          logger.warn('Rate limit exceeded for 2FA verification', { userId });
          throw new APIError(ErrorCodes.RATE_LIMIT_EXCEEDED, rateCheck.message || 'Too many verification attempts', 429);
        }

        const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

        if (!twoFactorDoc.exists()) {
          logger.warn('No 2FA data found for user', { userId });
          return { success: false };
        }

        const data = twoFactorDoc.data() as TwoFactorData;

        if (!data.enabled) {
          logger.warn('2FA not enabled for user', { userId });
          return { success: false };
        }

        // Check if device is trusted
        if (deviceId && data.trustedDevices) {
          const trustedDevice = data.trustedDevices.find(device => 
            device.deviceId === deviceId && device.expiresAt > new Date()
          );
          
          if (trustedDevice) {
            // Update last used timestamp
            trustedDevice.lastUsed = new Date();
            await updateDoc(doc(db, 'twoFactorAuth', userId), {
              trustedDevices: data.trustedDevices,
            });
            
            logger.info('Trusted device bypassed 2FA', { userId, deviceId });
            return { success: true, trustedDevice: true };
          }
        }

        let isValid = false;

        // Try TOTP code (6 digits)
        if (code.length === 6 && /^\d{6}$/.test(code)) {
          isValid = this.verifyTOTP(data.secret, code);
        }
        // Try backup code (8 characters alphanumeric)
        else if (code.length === 8 && /^[A-Za-z0-9]{8}$/.test(code)) {
          isValid = this.verifyBackupCode(data.backupCodes, code);
          
          // If backup code is valid, remove it from the list
          if (isValid) {
            const updatedBackupCodes = data.backupCodes.filter(
              backupCode => backupCode !== this.hashBackupCode(code)
            );
            
            await updateDoc(doc(db, 'twoFactorAuth', userId), {
              backupCodes: updatedBackupCodes,
            });
          }
        }

        if (isValid) {
          // Update last used timestamp
          await updateDoc(doc(db, 'twoFactorAuth', userId), {
            lastUsed: new Date(),
            verificationAttempts: 0,
          });

          // Reset rate limit on success
          rateLimiter.reset(userId, '2fa');

          logger.info('2FA code verified successfully', { userId });
          return { success: true, trustedDevice: false };
        } else {
          // Increment verification attempts
          await updateDoc(doc(db, 'twoFactorAuth', userId), {
            verificationAttempts: (data.verificationAttempts || 0) + 1,
          });
          
          logger.warn('Invalid 2FA code attempt', { userId });
          return { success: false };
        }
      } catch (error: any) {
        logger.error('Error verifying 2FA code', error as Error);
        throw error;
      }
    }, 'twoFactorService.verifyCode');
  },

  /**
   * Trust device for future logins
   *
   * @param userId - User ID
   * @param deviceId - Device identifier
   * @param deviceName - Optional device name
   * @param ipAddress - IP address
   * @param userAgent - User agent
   * @returns Success status
   */
  async trustDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    ipAddress: string,
    userAgent: string
  ): Promise<APIResponse<boolean>> {
    return await safeAsync(async () => {
      try {
        logger.info('Trusting device for user', { userId, deviceId });

        const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

        if (!twoFactorDoc.exists()) {
          throw new APIError(ErrorCodes.NOT_FOUND, '2FA not initialized', 400);
        }

        const data = twoFactorDoc.data() as TwoFactorData;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const trustedDevice: TrustedDevice = {
          id: this.generateDeviceId(),
          deviceId,
          deviceName,
          ipAddress,
          userAgent,
          createdAt: now,
          expiresAt,
          lastUsed: now,
        };

        const trustedDevices = data.trustedDevices || [];
        trustedDevices.push(trustedDevice);

        await updateDoc(doc(db, 'twoFactorAuth', userId), {
          trustedDevices,
        });

        logger.info('Device trusted successfully', { userId, deviceId });
        return true;
      } catch (error: any) {
        logger.error('Error trusting device', error as Error);
        throw error;
      }
    }, 'twoFactorService.trustDevice');
  },

  /**
   * Get 2FA status for user
   *
   * @param userId - User ID
   * @returns 2FA status
   */
  async getStatus(userId: string): Promise<APIResponse<TwoFactorStatus>> {
    return await safeAsync(async () => {
      try {
        logger.info('Getting 2FA status for user', { userId });

        const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

        if (!twoFactorDoc.exists()) {
          return {
            enabled: false,
            backupCodesRemaining: 0,
            trustedDevicesCount: 0,
          };
        }

        const data = twoFactorDoc.data() as TwoFactorData;

        // Convert Timestamp to Date if needed
        let lastUsedDate: Date | undefined;
        if (data.lastUsed) {
          if (data.lastUsed instanceof Timestamp) {
            lastUsedDate = data.lastUsed.toDate();
          } else {
            lastUsedDate = data.lastUsed as Date;
          }
        }

        const status: TwoFactorStatus = {
          enabled: data.enabled,
          lastUsed: lastUsedDate,
          backupCodesRemaining: data.backupCodes.length,
          trustedDevicesCount: data.trustedDevices ? data.trustedDevices.length : 0,
          mfaLevel: data.mfaLevel,
        };

        logger.info('2FA status retrieved successfully', { userId });
        return status;
      } catch (error: any) {
        logger.error('Error getting 2FA status', error as Error);
        throw error;
      }
    }, 'twoFactorService.getStatus');
  },

  /**
   * Disable 2FA for user
   *
   * @param userId - User ID
   * @returns Success status
   */
  async disableTwoFactor(userId: string): Promise<APIResponse<boolean>> {
    return await safeAsync(async () => {
      try {
        logger.info('Disabling 2FA for user', { userId });

        const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));

        if (!twoFactorDoc.exists()) {
          throw new APIError(ErrorCodes.NOT_FOUND, '2FA not initialized', 400);
        }

        await updateDoc(doc(db, 'twoFactorAuth', userId), {
          enabled: false,
          secret: '',
          backupCodes: [],
          trustedDevices: [],
        });

        logger.info('2FA disabled successfully', { userId });
        return true;
      } catch (error: any) {
        logger.error('Error disabling 2FA', error as Error);
        throw error;
      }
    }, 'twoFactorService.disableTwoFactor');
  },

  /**
   * Generate backup codes
   *
   * @param count - Number of backup codes to generate
   * @returns Array of backup codes
   */
  generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      codes.push(code);
    }
    
    return codes;
  },

  /**
   * Hash backup code for secure storage
   *
   * @param code - Backup code to hash
   * @returns Hashed backup code
   */
  hashBackupCode(code: string): string {
    // In a real implementation, you would use a proper hashing algorithm
    // For this example, we'll use a simple approach
    return btoa(code); // Base64 encoding as placeholder
  },

  /**
   * Verify TOTP code
   *
   * @param secret - Base32 encoded secret
   * @param token - 6-digit TOTP code
   * @returns Validity status
   */
  verifyTOTP(secret: string, token: string): boolean {
    try {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });

      return totp.validate({ token, window: 1 }) !== null;
    } catch (error: any) {
      logger.error('Error verifying TOTP', error as Error);
      return false;
    }
  },

  /**
   * Verify backup code
   *
   * @param hashedCodes - Array of hashed backup codes
   * @param code - Backup code to verify
   * @returns Validity status
   */
  verifyBackupCode(hashedCodes: string[], code: string): boolean {
    const hashedCode = this.hashBackupCode(code);
    return hashedCodes.includes(hashedCode);
  },

  /**
   * Generate device ID
   */
  generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};