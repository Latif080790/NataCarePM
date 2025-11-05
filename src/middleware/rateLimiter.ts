/**
 * Rate Limiting Middleware
 * Implements rate limiting for API endpoints to prevent abuse
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ========================================
// TYPES
// ========================================

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message: string; // Error message
  standardHeaders: boolean; // Return rate limit info in headers
  legacyHeaders: boolean; // Disable legacy headers
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
}

// ========================================
// RATE LIMIT CONFIGURATIONS
// ========================================

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
});

/**
 * General API rate limiter
 * Prevents API abuse and ensures fair usage
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'API rate limit exceeded. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for password reset
 * Prevents abuse of password reset functionality
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please try again in 1 hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file uploads
 * Prevents abuse of file upload functionality
 */
export const fileUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    success: false,
    error: {
      code: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'File upload rate limit exceeded. Please try again in 1 hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for search endpoints
 * Prevents search abuse and ensures performance
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Search rate limit exceeded. Please slow down your requests.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create custom rate limiter with specific options
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: options.standardHeaders,
    legacyHeaders: options.legacyHeaders,
    skipSuccessfulRequests: options.skipSuccessfulRequests,
    skipFailedRequests: options.skipFailedRequests,
  });
};

/**
 * Middleware to check if request is within rate limits
 * Can be used for custom rate limiting logic
 */
export const checkRateLimit = (req: Request, res: Response, next: Function) => {
  // This is a placeholder for custom rate limiting logic
  // In a real implementation, you might check Redis or a database
  // for more sophisticated rate limiting (e.g., per-user limits)

  // For now, just pass through to the express-rate-limit middleware
  next();
};

// ========================================
// RATE LIMIT MONITORING
// ========================================

/**
 * Log rate limit violations for monitoring
 */
export const logRateLimitViolation = (req: Request, limiterName: string) => {
  console.warn(`Rate limit violation: ${limiterName}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // TODO: Send to monitoring service (e.g., Sentry, DataDog)
  // This could be integrated with the monitoring service
};

// ========================================
// EXPORT ALL RATE LIMITERS
// ========================================

export const rateLimiters = {
  auth: authRateLimiter,
  api: apiRateLimiter,
  passwordReset: passwordResetRateLimiter,
  fileUpload: fileUploadRateLimiter,
  search: searchRateLimiter,
};
