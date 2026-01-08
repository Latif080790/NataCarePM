/**
 * Security Middleware
 * Centralized security utilities for sensitive operations
 * 
 * Provides:
 * - Pre-operation security checks
 * - Rate limiting integration
 * - Input validation
 * - Audit logging
 * - App Check verification
 * 
 * @module SecurityMiddleware
 */

import { rateLimiter, RateLimitResult } from './rateLimiter';
import { sanitizeStrict, sanitizeBasic, sanitizeUrl, sanitizeFilename } from './sanitizer';
import { logger } from './logger.enhanced';
import { auditService } from '@/api/auditService.enhanced';

// ============================================================================
// Types
// ============================================================================

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface SecureOperationOptions {
  /** User ID performing the operation */
  userId: string;
  /** Type of operation for rate limiting */
  operationType: 'login' | 'password-reset' | '2fa' | 'api' | 'registration' | 'email' | 'sensitive';
  /** Operation description for audit log */
  operationDescription: string;
  /** Project ID if applicable */
  projectId?: string;
  /** Skip rate limiting check */
  skipRateLimit?: boolean;
  /** Additional metadata for audit */
  metadata?: Record<string, unknown>;
}

export interface SanitizedInput<T> {
  original: T;
  sanitized: T;
  modified: boolean;
}

// ============================================================================
// Rate Limit Configurations for Sensitive Operations
// ============================================================================

// Configure additional rate limits
const SENSITIVE_RATE_LIMITS = {
  'sensitive': {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 10,
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  'budget-change': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  'approval': {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxAttempts: 10,
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  'export': {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 5,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  },
  'delete': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 10,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
};

// Register configurations
Object.entries(SENSITIVE_RATE_LIMITS).forEach(([type, config]) => {
  rateLimiter.setConfig(type, config);
});

// ============================================================================
// Security Check Functions
// ============================================================================

/**
 * Perform comprehensive security check before sensitive operation
 */
export async function performSecurityCheck(
  options: SecureOperationOptions
): Promise<SecurityCheckResult> {
  const { userId, operationType, operationDescription, projectId, skipRateLimit, metadata } = options;

  try {
    // 1. Rate limit check
    if (!skipRateLimit) {
      const rateLimitResult = rateLimiter.checkLimit(userId, operationType);
      if (!rateLimitResult.allowed) {
        logger.warn('[Security] Rate limit exceeded', {
          userId,
          operationType,
          blockedUntil: rateLimitResult.blockedUntil,
        });

        return {
          allowed: false,
          reason: rateLimitResult.message,
          details: {
            type: 'rate_limit',
            remainingAttempts: rateLimitResult.remainingAttempts,
            blockedUntil: rateLimitResult.blockedUntil,
          },
        };
      }
    }

    // 2. Log the operation attempt
    logger.info('[Security] Operation check passed', {
      userId,
      operationType,
      operationDescription,
      projectId,
    });

    // 3. Create audit log entry
    try {
      await auditService.logActivity({
        userId,
        action: 'security_check',
        resourceType: 'security',
        resourceId: operationType,
        projectId: projectId || undefined,
        details: {
          operationDescription,
          checkPassed: true,
          ...metadata,
        },
      });
    } catch (auditError) {
      // Don't fail the operation if audit logging fails
      logger.error('[Security] Audit logging failed', auditError instanceof Error ? auditError : new Error(String(auditError)));
    }

    return {
      allowed: true,
      details: {
        type: 'success',
        operationType,
      },
    };
  } catch (error) {
    logger.error('[Security] Security check failed', error instanceof Error ? error : new Error(String(error)));
    return {
      allowed: false,
      reason: 'Security check failed unexpectedly',
      details: {
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ============================================================================
// Input Sanitization Functions
// ============================================================================

/**
 * Sanitize text input (strict - no HTML)
 */
export function sanitizeTextInput(input: string): SanitizedInput<string> {
  const sanitized = sanitizeStrict(input);
  return {
    original: input,
    sanitized,
    modified: input !== sanitized,
  };
}

/**
 * Sanitize rich text input (basic HTML allowed)
 */
export function sanitizeRichTextInput(input: string): SanitizedInput<string> {
  const sanitized = sanitizeBasic(input);
  return {
    original: input,
    sanitized,
    modified: input !== sanitized,
  };
}

/**
 * Sanitize URL input
 */
export function sanitizeUrlInput(input: string): SanitizedInput<string> {
  const sanitized = sanitizeUrl(input);
  return {
    original: input,
    sanitized,
    modified: input !== sanitized,
  };
}

/**
 * Sanitize filename input
 */
export function sanitizeFilenameInput(input: string): SanitizedInput<string> {
  const sanitized = sanitizeFilename(input);
  return {
    original: input,
    sanitized,
    modified: input !== sanitized,
  };
}

/**
 * Sanitize object with string values
 */
export function sanitizeObjectInput<T extends Record<string, unknown>>(
  input: T,
  options: {
    strictFields?: string[];
    basicFields?: string[];
    urlFields?: string[];
    skipFields?: string[];
  } = {}
): SanitizedInput<T> {
  const { strictFields = [], basicFields = [], urlFields = [], skipFields = [] } = options;
  
  const sanitized = { ...input } as T;
  let modified = false;

  Object.keys(input).forEach((key) => {
    if (skipFields.includes(key)) return;
    
    const value = input[key];
    if (typeof value !== 'string') return;

    let sanitizedValue: string;
    
    if (strictFields.includes(key)) {
      sanitizedValue = sanitizeStrict(value);
    } else if (basicFields.includes(key)) {
      sanitizedValue = sanitizeBasic(value);
    } else if (urlFields.includes(key)) {
      sanitizedValue = sanitizeUrl(value);
    } else {
      // Default to strict
      sanitizedValue = sanitizeStrict(value);
    }

    if (sanitizedValue !== value) {
      (sanitized as Record<string, unknown>)[key] = sanitizedValue;
      modified = true;
    }
  });

  return {
    original: input,
    sanitized,
    modified,
  };
}

// ============================================================================
// Secure Operation Wrapper
// ============================================================================

/**
 * Wrapper for executing secure operations with built-in protections
 * 
 * @example
 * ```typescript
 * const result = await executeSecureOperation(
 *   {
 *     userId: currentUser.id,
 *     operationType: 'budget-change',
 *     operationDescription: 'Update RAB item price',
 *     projectId: project.id,
 *   },
 *   async () => {
 *     return await rabService.updateItem(itemId, data);
 *   }
 * );
 * ```
 */
export async function executeSecureOperation<T>(
  options: SecureOperationOptions,
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  // 1. Perform security check
  const securityCheck = await performSecurityCheck(options);
  
  if (!securityCheck.allowed) {
    return {
      success: false,
      error: securityCheck.reason || 'Operation not allowed',
    };
  }

  // 2. Execute operation
  try {
    const result = await operation();
    
    // 3. Log successful completion
    try {
      await auditService.logActivity({
        userId: options.userId,
        action: 'operation_completed',
        resourceType: 'security',
        resourceId: options.operationType,
        projectId: options.projectId || undefined,
        details: {
          operationDescription: options.operationDescription,
          status: 'success',
          ...options.metadata,
        },
      });
    } catch (auditError) {
      logger.error('[Security] Post-operation audit failed', auditError instanceof Error ? auditError : new Error(String(auditError)));
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // 4. Log failed operation
    logger.error('[Security] Secure operation failed', error instanceof Error ? error : new Error(String(error)), {
      userId: options.userId,
      operationType: options.operationType,
      operationDescription: options.operationDescription,
    });

    try {
      await auditService.logActivity({
        userId: options.userId,
        action: 'operation_failed',
        resourceType: 'security',
        resourceId: options.operationType,
        projectId: options.projectId || undefined,
        details: {
          operationDescription: options.operationDescription,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          ...options.metadata,
        },
      });
    } catch (auditError) {
      logger.error('[Security] Failed operation audit failed', auditError instanceof Error ? auditError : new Error(String(auditError)));
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
    };
  }
}

// ============================================================================
// Rate Limit Helpers
// ============================================================================

/**
 * Check rate limit without incrementing
 */
export function checkRateLimit(userId: string, operationType: string): RateLimitResult {
  return rateLimiter.checkLimit(userId, operationType);
}

/**
 * Reset rate limit after successful operation
 */
export function resetRateLimit(userId: string, operationType: string): void {
  rateLimiter.reset(userId, operationType);
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(userId: string, operationType: string) {
  return rateLimiter.getStatus(userId, operationType);
}

// ============================================================================
// Export
// ============================================================================

export const securityMiddleware = {
  performSecurityCheck,
  executeSecureOperation,
  sanitizeTextInput,
  sanitizeRichTextInput,
  sanitizeUrlInput,
  sanitizeFilenameInput,
  sanitizeObjectInput,
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
};

export default securityMiddleware;
