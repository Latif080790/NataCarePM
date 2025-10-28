import { logger } from './logger.enhanced';

/**
 * Enhanced Rate Limit Configuration with Sliding Window
 */
interface EnhancedRateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
  blockDurationMs: number; // Block duration after max requests exceeded
}

/**
 * Enhanced Rate Limit Entry for tracking requests with sliding window
 */
interface EnhancedRateLimitEntry {
  requests: Array<{ timestamp: number; weight?: number }>;
  blockedUntil?: number;
}

/**
 * Enhanced Rate Limit Check Result
 */
export interface EnhancedRateLimitResult {
  allowed: boolean;
  requestsInWindow: number;
  remainingRequests: number;
  resetAt?: Date;
  blockedUntil?: Date;
  message?: string;
}

/**
 * Enhanced Rate Limiter with Sliding Window Algorithm
 *
 * Provides more sophisticated rate limiting using sliding window algorithm
 * to prevent bursts and provide more granular control.
 *
 * @example
 * ```typescript
 * const result = enhancedRateLimiter.checkLimit('user@example.com', 'api');
 * if (!result.allowed) {
 *   throw new Error(result.message);
 * }
 * ```
 */
class EnhancedRateLimiter {
  private storage: Map<string, EnhancedRateLimitEntry>;
  private configs: Map<string, EnhancedRateLimitConfig>;
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
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
    });

    // Password reset: 3 attempts per hour, 1 hour block
    this.configs.set('password-reset', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    });

    // API calls: 100 per minute, 5 min block
    this.configs.set('api', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      blockDurationMs: 5 * 60 * 1000, // 5 minutes
    });

    // 2FA verification: 3 attempts per 15 minutes, 15 min block
    this.configs.set('2fa', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 3,
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
    });

    // Registration: 3 per hour, 2 hour block
    this.configs.set('registration', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
    });

    // Email sending: 10 per hour, 1 hour block
    this.configs.set('email', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      blockDurationMs: 60 * 60 * 1000, // 1 hour
    });
  }

  /**
   * Check if request is within rate limit using sliding window algorithm
   *
   * @param identifier - Unique identifier (email, IP, user ID, etc.)
   * @param type - Type of rate limit ('login', 'api', '2fa', etc.)
   * @param weight - Weight of the request (default: 1)
   * @returns Rate limit check result
   */
  checkLimit(identifier: string, type: string, weight: number = 1): EnhancedRateLimitResult {
    const config = this.configs.get(type);

    if (!config) {
      logger.warn('Rate limit config not found', { type, action: 'allowing by default' });
      return {
        allowed: true,
        requestsInWindow: 0,
        remainingRequests: Infinity,
        message: 'No rate limit configured',
      };
    }

    const key = `${type}:${identifier}`;
    const now = Date.now();
    let entry = this.storage.get(key);

    // Initialize entry if it doesn't exist
    if (!entry) {
      entry = { requests: [] };
      this.storage.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      const blockedUntil = new Date(entry.blockedUntil);
      const minutesRemaining = Math.ceil((entry.blockedUntil - now) / 60000);

      return {
        allowed: false,
        requestsInWindow: entry.requests.length,
        remainingRequests: 0,
        blockedUntil,
        message: `Too many requests. Account locked for ${minutesRemaining} more minute(s). Please try again at ${blockedUntil.toLocaleTimeString()}.`,
      };
    }

    // Remove expired requests from sliding window
    const windowStart = now - config.windowMs;
    entry.requests = entry.requests.filter(req => req.timestamp > windowStart);

    // Check if adding this request would exceed the limit
    const currentRequests = entry.requests.reduce((sum, req) => sum + (req.weight || 1), 0);
    const newTotalRequests = currentRequests + weight;

    if (newTotalRequests > config.maxRequests) {
      // Block user
      entry.blockedUntil = now + config.blockDurationMs;
      this.storage.set(key, entry);

      const blockedUntil = new Date(entry.blockedUntil);
      const minutesBlocked = Math.ceil(config.blockDurationMs / 60000);

      return {
        allowed: false,
        requestsInWindow: entry.requests.length,
        remainingRequests: 0,
        blockedUntil,
        message: `Maximum requests exceeded. Account locked for ${minutesBlocked} minutes until ${blockedUntil.toLocaleTimeString()}.`,
      };
    }

    // Add request to window
    entry.requests.push({ timestamp: now, weight });
    this.storage.set(key, entry);

    const remaining = config.maxRequests - newTotalRequests;

    return {
      allowed: true,
      requestsInWindow: entry.requests.length,
      remainingRequests: remaining,
      resetAt: new Date(now + config.windowMs),
      message: `${remaining} request(s) remaining in current window`,
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

    const entry: EnhancedRateLimitEntry = {
      requests: [],
      blockedUntil: blockUntil,
    };

    this.storage.set(key, entry);
  }

  /**
   * Get current status for identifier
   *
   * @param identifier - Unique identifier
   * @param type - Type of rate limit
   * @returns Current rate limit status
   */
  getStatus(
    identifier: string,
    type: string
  ): {
    requestsInWindow: number;
    blocked: boolean;
    remainingRequests: number;
  } {
    const config = this.configs.get(type);
    if (!config) {
      return { requestsInWindow: 0, blocked: false, remainingRequests: Infinity };
    }

    const key = `${type}:${identifier}`;
    const entry = this.storage.get(key);
    const now = Date.now();

    if (!entry) {
      return {
        requestsInWindow: 0,
        blocked: false,
        remainingRequests: config.maxRequests,
      };
    }

    // Remove expired requests
    const windowStart = now - config.windowMs;
    if (entry.requests) {
      entry.requests = entry.requests.filter(req => req.timestamp > windowStart);
    }

    const blocked = !!(entry.blockedUntil && entry.blockedUntil > now);
    const currentRequests = entry.requests?.reduce((sum, req) => sum + (req.weight || 1), 0) || 0;
    const remaining = Math.max(0, config.maxRequests - currentRequests);

    return {
      requestsInWindow: entry.requests?.length || 0,
      blocked,
      remainingRequests: remaining,
    };
  }

  /**
   * Add or update a rate limit configuration
   *
   * @param type - Type identifier
   * @param config - Rate limit configuration
   */
  setConfig(type: string, config: EnhancedRateLimitConfig): void {
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
      const windowExpired = entry.requests.every(req => req.timestamp < now - config.windowMs);
      const notBlocked = !entry.blockedUntil || entry.blockedUntil < now;

      if (windowExpired && notBlocked && entry.requests.length > 0) {
        this.storage.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Enhanced rate limiter cleanup completed', { cleanedEntries: cleaned });
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
      configuredTypes: Array.from(this.configs.keys()),
    };
  }

  /**
   * Clear all entries (use with caution)
   */
  clear(): void {
    this.storage.clear();
    logger.warn('Enhanced rate limiter entries cleared');
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
export const enhancedRateLimiter = new EnhancedRateLimiter();

// Cleanup on module unload (if supported)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    enhancedRateLimiter.destroy();
  });
}

export default EnhancedRateLimiter;