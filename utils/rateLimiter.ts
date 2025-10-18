import { Timestamp } from 'firebase/firestore';

/**
 * Rate Limit Configuration
 */
interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxAttempts: number;     // Maximum attempts allowed in window
  blockDurationMs: number; // Block duration after max attempts exceeded
}

/**
 * Rate Limit Entry for tracking attempts
 */
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

/**
 * Rate Limit Check Result
 */
export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetAt?: Date;
  blockedUntil?: Date;
  message?: string;
}

/**
 * Rate Limiter
 * 
 * Client-side rate limiting to prevent brute force attacks and API abuse.
 * Uses in-memory storage with automatic cleanup.
 * 
 * @example
 * ```typescript
 * const result = rateLimiter.checkLimit('user@example.com', 'login');
 * if (!result.allowed) {
 *   throw new Error(result.message);
 * }
 * ```
 */
class RateLimiter {
  private storage: Map<string, RateLimitEntry>;
  private configs: Map<string, RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.storage = new Map();
    this.configs = new Map();
    this.setupDefaultConfigs();
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Setup default rate limit configurations
   */
  private setupDefaultConfigs(): void {
    // Login attempts: 5 attempts per 15 minutes, 30 min block
    this.configs.set('login', {
      windowMs: 15 * 60 * 1000,      // 15 minutes
      maxAttempts: 5,
      blockDurationMs: 30 * 60 * 1000 // 30 minutes
    });

    // Password reset: 3 attempts per hour, 1 hour block
    this.configs.set('password-reset', {
      windowMs: 60 * 60 * 1000,      // 1 hour
      maxAttempts: 3,
      blockDurationMs: 60 * 60 * 1000 // 1 hour
    });

    // API calls: 100 per minute, 5 min block
    this.configs.set('api', {
      windowMs: 60 * 1000,            // 1 minute
      maxAttempts: 100,
      blockDurationMs: 5 * 60 * 1000  // 5 minutes
    });

    // 2FA verification: 3 attempts per 15 minutes, 15 min block
    this.configs.set('2fa', {
      windowMs: 15 * 60 * 1000,      // 15 minutes
      maxAttempts: 3,
      blockDurationMs: 15 * 60 * 1000 // 15 minutes
    });

    // Registration: 3 per hour, 2 hour block
    this.configs.set('registration', {
      windowMs: 60 * 60 * 1000,      // 1 hour
      maxAttempts: 3,
      blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours
    });

    // Email sending: 10 per hour, 1 hour block
    this.configs.set('email', {
      windowMs: 60 * 60 * 1000,      // 1 hour
      maxAttempts: 10,
      blockDurationMs: 60 * 60 * 1000 // 1 hour
    });
  }

  /**
   * Check if request is within rate limit
   * 
   * @param identifier - Unique identifier (email, IP, user ID, etc.)
   * @param type - Type of rate limit ('login', 'api', '2fa', etc.)
   * @returns Rate limit check result
   */
  checkLimit(identifier: string, type: string): RateLimitResult {
    const config = this.configs.get(type);
    
    if (!config) {
      console.warn(`Rate limit config not found for type: ${type}. Allowing by default.`);
      return {
        allowed: true,
        remainingAttempts: Infinity,
        message: 'No rate limit configured'
      };
    }

    const key = `${type}:${identifier}`;
    const now = Date.now();
    const entry = this.storage.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      const blockedUntil = new Date(entry.blockedUntil);
      const minutesRemaining = Math.ceil((entry.blockedUntil - now) / 60000);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil,
        message: `Too many attempts. Account locked for ${minutesRemaining} more minute(s). Please try again at ${blockedUntil.toLocaleTimeString()}.`
      };
    }

    // No previous attempts or window expired - fresh start
    if (!entry || (now - entry.firstAttempt) > config.windowMs) {
      this.storage.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs),
        message: `${config.maxAttempts - 1} attempts remaining`
      };
    }

    // Within window - increment attempts
    entry.attempts++;
    entry.lastAttempt = now;

    // Max attempts exceeded - block user
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + config.blockDurationMs;
      this.storage.set(key, entry);
      
      const blockedUntil = new Date(entry.blockedUntil);
      const minutesBlocked = Math.ceil(config.blockDurationMs / 60000);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil,
        message: `Maximum attempts exceeded. Account locked for ${minutesBlocked} minutes until ${blockedUntil.toLocaleTimeString()}.`
      };
    }

    // Still within limit
    this.storage.set(key, entry);
    const remaining = config.maxAttempts - entry.attempts;
    
    return {
      allowed: true,
      remainingAttempts: remaining,
      resetAt: new Date(entry.firstAttempt + config.windowMs),
      message: `${remaining} attempt(s) remaining`
    };
  }

  /**
   * Reset rate limit for identifier
   * Call this after successful authentication or operation
   * 
   * @param identifier - Unique identifier
   * @param type - Type of rate limit
   */
  reset(identifier: string, type: string): void {
    const key = `${type}:${identifier}`;
    this.storage.delete(key);
  }

  /**
   * Manually block an identifier
   * Useful for implementing custom blocking logic
   * 
   * @param identifier - Unique identifier
   * @param type - Type of rate limit
   * @param durationMs - Block duration in milliseconds
   */
  block(identifier: string, type: string, durationMs?: number): void {
    const config = this.configs.get(type);
    if (!config) return;

    const key = `${type}:${identifier}`;
    const now = Date.now();
    const blockUntil = now + (durationMs || config.blockDurationMs);

    this.storage.set(key, {
      attempts: config.maxAttempts + 1,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: blockUntil
    });
  }

  /**
   * Get current status for identifier
   * 
   * @param identifier - Unique identifier
   * @param type - Type of rate limit
   * @returns Current rate limit status
   */
  getStatus(identifier: string, type: string): {
    attempts: number;
    blocked: boolean;
    remainingAttempts: number;
  } {
    const config = this.configs.get(type);
    if (!config) {
      return { attempts: 0, blocked: false, remainingAttempts: Infinity };
    }

    const key = `${type}:${identifier}`;
    const entry = this.storage.get(key);
    const now = Date.now();

    if (!entry) {
      return {
        attempts: 0,
        blocked: false,
        remainingAttempts: config.maxAttempts
      };
    }

    const blocked = !!(entry.blockedUntil && entry.blockedUntil > now);
    const remaining = Math.max(0, config.maxAttempts - entry.attempts);

    return {
      attempts: entry.attempts,
      blocked,
      remainingAttempts: remaining
    };
  }

  /**
   * Add or update a rate limit configuration
   * 
   * @param type - Type identifier
   * @param config - Rate limit configuration
   */
  setConfig(type: string, config: RateLimitConfig): void {
    this.configs.set(type, config);
  }

  /**
   * Cleanup expired entries
   * Automatically called every 5 minutes
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.storage.entries()) {
      const type = key.split(':')[0];
      const config = this.configs.get(type);
      if (!config) continue;

      // Remove if window expired and not blocked
      const windowExpired = (now - entry.firstAttempt) > config.windowMs;
      const notBlocked = !entry.blockedUntil || entry.blockedUntil < now;

      if (windowExpired && notBlocked) {
        this.storage.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[RateLimiter] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get statistics about rate limiter
   */
  getStats(): {
    totalEntries: number;
    blockedEntries: number;
    configuredTypes: string[];
  } {
    const now = Date.now();
    let blocked = 0;

    for (const entry of this.storage.values()) {
      if (entry.blockedUntil && entry.blockedUntil > now) {
        blocked++;
      }
    }

    return {
      totalEntries: this.storage.size,
      blockedEntries: blocked,
      configuredTypes: Array.from(this.configs.keys())
    };
  }

  /**
   * Clear all entries (use with caution)
   */
  clear(): void {
    this.storage.clear();
    console.warn('[RateLimiter] All entries cleared');
  }

  /**
   * Destroy rate limiter and cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.storage.clear();
    this.configs.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup on module unload (if supported)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    rateLimiter.destroy();
  });
}
