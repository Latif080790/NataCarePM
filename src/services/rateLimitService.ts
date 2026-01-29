/**
 * Rate Limiting and Brute Force Protection Service
 * Implements login attempt tracking, account lockout, and rate limiting
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { logger } from '@/utils/logger';

/**
 * Rate Limiting Configuration
 */
const RATE_LIMIT_CONFIG = {
  // Login attempts
  maxLoginAttemptsPerHour: 10,
  maxLoginAttemptsPerDay: 50,
  lockoutDurationMinutes: 30,
  
  // Failed attempts before increasing delays
  warningThreshold: 3, // Show warning after 3 failed attempts
  delayThreshold: 5, // Add delays after 5 failed attempts
  lockoutThreshold: 10, // Lock account after 10 failed attempts
  
  // Delays (in seconds)
  baseDelay: 2,
  maxDelay: 60,
};

/**
 * Login attempt record structure
 */
interface LoginAttempt {
  userId?: string;
  email: string;
  ipAddress?: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
}

interface AccountLockout {
  locked: boolean;
  lockedAt?: Date;
  lockedUntil?: Date;
  failedAttempts: number;
  lastAttemptAt?: Date;
  attempts: LoginAttempt[];
}

/**
 * Check if account is locked due to too many failed attempts
 */
export const checkAccountLockout = async (
  email: string
): Promise<{
  locked: boolean;
  lockedUntil?: Date;
  remainingAttempts?: number;
  message?: string;
}> => {
  try {
    const lockoutRef = doc(db, 'accountLockouts', email);
    const lockoutDoc = await getDoc(lockoutRef);

    if (!lockoutDoc.exists()) {
      return {
        locked: false,
        remainingAttempts: RATE_LIMIT_CONFIG.lockoutThreshold,
      };
    }

    const data = lockoutDoc.data() as AccountLockout;

    // Check if lockout has expired
    if (data.locked && data.lockedUntil) {
      const lockedUntil = data.lockedUntil instanceof Date 
        ? data.lockedUntil 
        : (data.lockedUntil as any).toDate();
      
      if (new Date() > lockedUntil) {
        // Lockout expired, reset
        await updateDoc(lockoutRef, {
          locked: false,
          failedAttempts: 0,
          lockedAt: null,
          lockedUntil: null,
          updatedAt: serverTimestamp(),
        });

        return {
          locked: false,
          remainingAttempts: RATE_LIMIT_CONFIG.lockoutThreshold,
        };
      }

      // Still locked
      const minutesRemaining = Math.ceil(
        (lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );

      return {
        locked: true,
        lockedUntil,
        message: `Akun terkunci karena terlalu banyak percobaan login gagal. Coba lagi dalam ${minutesRemaining} menit.`,
      };
    }

    // Not locked, return remaining attempts
    const remainingAttempts = Math.max(
      0,
      RATE_LIMIT_CONFIG.lockoutThreshold - data.failedAttempts
    );

    return {
      locked: false,
      remainingAttempts,
    };
  } catch (error: any) {
    logger.error('Error checking account lockout', error, { email });
    // Fail open - allow attempt if we can't check
    return { locked: false };
  }
};

/**
 * Record a login attempt (success or failure)
 */
export const recordLoginAttempt = async (
  email: string,
  success: boolean,
  userId?: string,
  ipAddress?: string,
  reason?: string
): Promise<void> => {
  try {
    const lockoutRef = doc(db, 'accountLockouts', email);
    const lockoutDoc = await getDoc(lockoutRef);

    const attempt: LoginAttempt = {
      email,
      userId,
      ipAddress,
      timestamp: new Date(),
      success,
      reason,
    };

    if (success) {
      // Successful login - reset counters
      if (lockoutDoc.exists()) {
        await updateDoc(lockoutRef, {
          failedAttempts: 0,
          locked: false,
          lockedAt: null,
          lockedUntil: null,
          lastAttemptAt: serverTimestamp(),
          attempts: [], // Clear old attempts on success
          updatedAt: serverTimestamp(),
        });
      }

      logger.info('Successful login recorded', { email, userId });
    } else {
      // Failed login - increment counter
      if (lockoutDoc.exists()) {
        const data = lockoutDoc.data() as AccountLockout;
        const newFailedAttempts = data.failedAttempts + 1;

        // Check if should lock account
        if (newFailedAttempts >= RATE_LIMIT_CONFIG.lockoutThreshold) {
          const lockedUntil = new Date(
            Date.now() + RATE_LIMIT_CONFIG.lockoutDurationMinutes * 60 * 1000
          );

          await updateDoc(lockoutRef, {
            failedAttempts: newFailedAttempts,
            locked: true,
            lockedAt: serverTimestamp(),
            lockedUntil,
            lastAttemptAt: serverTimestamp(),
            attempts: [...(data.attempts || []).slice(-9), attempt], // Keep last 10 attempts
            updatedAt: serverTimestamp(),
          });

          logger.warn('Account locked due to too many failed attempts', {
            email,
            failedAttempts: newFailedAttempts,
            lockedUntil,
          });

          // Log security event
          await logSecurityEvent(email, 'account_locked', {
            reason: 'too_many_failed_attempts',
            failedAttempts: newFailedAttempts,
            lockedUntil,
          });
        } else {
          await updateDoc(lockoutRef, {
            failedAttempts: newFailedAttempts,
            lastAttemptAt: serverTimestamp(),
            attempts: [...(data.attempts || []).slice(-9), attempt],
            updatedAt: serverTimestamp(),
          });

          logger.info('Failed login attempt recorded', {
            email,
            failedAttempts: newFailedAttempts,
            remainingAttempts: RATE_LIMIT_CONFIG.lockoutThreshold - newFailedAttempts,
          });
        }
      } else {
        // First failed attempt
        await setDoc(lockoutRef, {
          email,
          failedAttempts: 1,
          locked: false,
          lastAttemptAt: serverTimestamp(),
          attempts: [attempt],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error: any) {
    logger.error('Error recording login attempt', error, { email, success });
    // Don't throw - this shouldn't block login flow
  }
};

/**
 * Calculate delay before next login attempt (exponential backoff)
 */
export const calculateLoginDelay = async (email: string): Promise<number> => {
  try {
    const lockoutRef = doc(db, 'accountLockouts', email);
    const lockoutDoc = await getDoc(lockoutRef);

    if (!lockoutDoc.exists()) {
      return 0;
    }

    const data = lockoutDoc.data() as AccountLockout;
    
    if (data.failedAttempts < RATE_LIMIT_CONFIG.delayThreshold) {
      return 0;
    }

    // Exponential backoff: baseDelay * 2^(attempts - delayThreshold)
    const exponent = data.failedAttempts - RATE_LIMIT_CONFIG.delayThreshold;
    const delay = Math.min(
      RATE_LIMIT_CONFIG.baseDelay * Math.pow(2, exponent),
      RATE_LIMIT_CONFIG.maxDelay
    );

    return delay;
  } catch (error: any) {
    logger.error('Error calculating login delay', error, { email });
    return 0;
  }
};

/**
 * Get login attempt statistics for an account
 */
export const getLoginAttemptStats = async (
  email: string
): Promise<{
  failedAttempts: number;
  lastAttemptAt?: Date;
  locked: boolean;
  lockedUntil?: Date;
  recentAttempts: LoginAttempt[];
}> => {
  try {
    const lockoutRef = doc(db, 'accountLockouts', email);
    const lockoutDoc = await getDoc(lockoutRef);

    if (!lockoutDoc.exists()) {
      return {
        failedAttempts: 0,
        locked: false,
        recentAttempts: [],
      };
    }

    const data = lockoutDoc.data() as AccountLockout;

    return {
      failedAttempts: data.failedAttempts,
      lastAttemptAt: data.lastAttemptAt instanceof Date 
        ? data.lastAttemptAt 
        : (data.lastAttemptAt as any)?.toDate(),
      locked: data.locked,
      lockedUntil: data.lockedUntil instanceof Date 
        ? data.lockedUntil 
        : (data.lockedUntil as any)?.toDate(),
      recentAttempts: data.attempts || [],
    };
  } catch (error: any) {
    logger.error('Error getting login attempt stats', error, { email });
    return {
      failedAttempts: 0,
      locked: false,
      recentAttempts: [],
    };
  }
};

/**
 * Manually unlock an account (admin function)
 */
export const unlockAccount = async (email: string, adminUserId: string): Promise<void> => {
  try {
    const lockoutRef = doc(db, 'accountLockouts', email);
    await updateDoc(lockoutRef, {
      locked: false,
      failedAttempts: 0,
      lockedAt: null,
      lockedUntil: null,
      updatedAt: serverTimestamp(),
    });

    logger.info('Account manually unlocked', { email, adminUserId });

    await logSecurityEvent(email, 'account_unlocked', {
      reason: 'manual_unlock',
      adminUserId,
    });
  } catch (error: any) {
    logger.error('Error unlocking account', error, { email, adminUserId });
    throw error;
  }
};

/**
 * Log security event
 */
const logSecurityEvent = async (
  email: string,
  eventType: string,
  details: Record<string, any>
): Promise<void> => {
  try {
    const eventRef = doc(db, 'securityEvents', `${email}_${Date.now()}`);
    await setDoc(eventRef, {
      email,
      eventType,
      details,
      timestamp: serverTimestamp(),
      severity: eventType.includes('locked') ? 'high' : 'medium',
    });
  } catch (error: any) {
    logger.error('Error logging security event', error, { email, eventType });
  }
};

/**
 * Rate limit check for API endpoints
 * Returns true if request should be allowed, false if rate limited
 */
export const checkRateLimit = async (
  identifier: string, // user ID, IP address, or email
  action: string, // e.g., 'login', 'api_call', 'password_reset'
  maxAttempts: number = 10,
  windowMinutes: number = 60
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}> => {
  try {
    const rateLimitRef = doc(db, 'rateLimits', `${identifier}_${action}`);
    const rateLimitDoc = await getDoc(rateLimitRef);

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    if (!rateLimitDoc.exists()) {
      // First attempt
      await setDoc(rateLimitRef, {
        identifier,
        action,
        attempts: 1,
        windowStart: now,
        lastAttempt: serverTimestamp(),
      });

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: new Date(now.getTime() + windowMinutes * 60 * 1000),
      };
    }

    const data = rateLimitDoc.data();
    const dataWindowStart = data.windowStart instanceof Date 
      ? data.windowStart 
      : (data.windowStart as any).toDate();

    // Check if window has expired
    if (dataWindowStart < windowStart) {
      // Reset window
      await updateDoc(rateLimitRef, {
        attempts: 1,
        windowStart: now,
        lastAttempt: serverTimestamp(),
      });

      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetAt: new Date(now.getTime() + windowMinutes * 60 * 1000),
      };
    }

    // Within window - check attempts
    if (data.attempts >= maxAttempts) {
      const resetAt = new Date(dataWindowStart.getTime() + windowMinutes * 60 * 1000);
      
      logger.warn('Rate limit exceeded', {
        identifier,
        action,
        attempts: data.attempts,
        maxAttempts,
        resetAt,
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Increment attempts
    await updateDoc(rateLimitRef, {
      attempts: increment(1),
      lastAttempt: serverTimestamp(),
    });

    return {
      allowed: true,
      remaining: maxAttempts - data.attempts - 1,
      resetAt: new Date(dataWindowStart.getTime() + windowMinutes * 60 * 1000),
    };
  } catch (error: any) {
    logger.error('Error checking rate limit', error, { identifier, action });
    // Fail open - allow request if we can't check
    return { allowed: true, remaining: maxAttempts };
  }
};

export default {
  checkAccountLockout,
  recordLoginAttempt,
  calculateLoginDelay,
  getLoginAttemptStats,
  unlockAccount,
  checkRateLimit,
};
