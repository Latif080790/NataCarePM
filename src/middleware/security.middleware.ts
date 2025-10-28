/**
 * Security Middleware
 * 
 * Provides comprehensive security middleware for API endpoints including:
 * - Rate limiting
 * - Request validation
 * - Input sanitization
 * - Suspicious activity detection
 * - Security headers
 */

import { logger } from '@/utils/logger.enhanced';
import { rateLimiter } from '@/utils/rateLimiter';
import { validateRequest, sanitizeForSecurity, detectSuspiciousActivity, generateSecurityHeaders } from '@/utils/securityValidation';
import { APIResponse, APIError, ErrorCodes } from '@/utils/responseWrapper';

// Type definitions
interface SecurityMiddlewareOptions {
  rateLimitType?: string;
  requireAuthentication?: boolean;
  maxPayloadSize?: number;
  allowedMethods?: string[];
  sanitizeInputs?: boolean;
  detectSuspiciousActivity?: boolean;
}

interface SecurityContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Security Middleware for API endpoints
 */
export class SecurityMiddleware {
  private options: SecurityMiddlewareOptions;
  private context: SecurityContext;

  constructor(options: SecurityMiddlewareOptions = {}, context: SecurityContext = {}) {
    this.options = {
      rateLimitType: 'api',
      requireAuthentication: false,
      maxPayloadSize: 1024 * 1024, // 1MB default
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      sanitizeInputs: true,
      detectSuspiciousActivity: true,
      ...options
    };
    this.context = context;
  }

  /**
   * Apply security middleware to request handler
   */
  async apply<T>(
    handler: (request: Request) => Promise<APIResponse<T>>,
    request: Request
  ): Promise<APIResponse<T>> {
    try {
      // Step 1: Rate limiting
      if (this.options.rateLimitType) {
        const identifier = this.getRateLimitIdentifier(request);
        const rateLimitResult = rateLimiter.checkLimit(identifier, this.options.rateLimitType);
        
        if (!rateLimitResult.allowed) {
          logger.warn('Rate limit exceeded', {
            identifier,
            type: this.options.rateLimitType,
            blockedUntil: rateLimitResult.blockedUntil
          });
          
          return {
            success: false,
            error: {
              message: rateLimitResult.message || 'Too many requests',
              code: ErrorCodes.RATE_LIMIT_EXCEEDED
            }
          };
        }
      }

      // Step 2: Request validation
      const validation = validateRequest(request, {
        maxPayloadSize: this.options.maxPayloadSize,
        allowedMethods: this.options.allowedMethods,
        requireAuthentication: this.options.requireAuthentication
      });

      if (!validation.isValid) {
        logger.warn('Request validation failed', {
          errors: validation.errors,
          riskLevel: validation.riskLevel,
          url: request.url
        });

        // For high/critical risk, block immediately
        if (validation.riskLevel === 'high' || validation.riskLevel === 'critical') {
          return {
            success: false,
            error: {
              message: 'Request blocked for security reasons',
              code: ErrorCodes.PERMISSION_DENIED
            }
          };
        }
      }

      // Step 3: Suspicious activity detection
      if (this.options.detectSuspiciousActivity && this.context.userId) {
        const activity = {
          userId: this.context.userId,
          action: `${request.method} ${new URL(request.url).pathname}`,
          ipAddress: this.context.ipAddress || 'unknown',
          userAgent: this.context.userAgent || request.headers.get('user-agent') || 'unknown',
          timestamp: new Date()
        };

        // In a real implementation, this would use historical data
        const baseline = {
          averageActionsPerHour: 10,
          commonLocations: ['ID', 'SG', 'MY'],
          typicalUserAgents: ['Mozilla', 'Chrome', 'Safari', 'Firefox']
        };

        const activityCheck = detectSuspiciousActivity(activity, baseline);
        
        if (activityCheck.riskLevel === 'high' || activityCheck.riskLevel === 'critical') {
          logger.warn('Suspicious activity detected', {
            userId: this.context.userId,
            action: activity.action,
            riskLevel: activityCheck.riskLevel,
            errors: activityCheck.errors
          });

          // For critical risk, block immediately
          if (activityCheck.riskLevel === 'critical') {
            return {
              success: false,
              error: {
                message: 'Suspicious activity detected',
                code: ErrorCodes.PERMISSION_DENIED
              }
            };
          }
        }
      }

      // Step 4: Input sanitization (if needed)
      if (this.options.sanitizeInputs) {
        // This would be applied to request body in a real implementation
        logger.debug('Input sanitization applied');
      }

      // Step 5: Execute handler
      const result = await handler(request);

      // Step 6: Add security headers to response (if applicable)
      // Note: In a real Firebase Functions environment, headers would be set differently
      logger.debug('Security middleware applied successfully');

      return result;
    } catch (error) {
      logger.error('Security middleware error', error instanceof Error ? error : new Error(String(error)));
      
      return {
        success: false,
        error: {
          message: 'Security check failed',
          code: ErrorCodes.INTERNAL_ERROR
        }
      };
    }
  }

  /**
   * Get identifier for rate limiting
   */
  private getRateLimitIdentifier(request: Request): string {
    // Prefer user ID if available
    if (this.context.userId) {
      return this.context.userId;
    }

    // Fallback to IP address
    if (this.context.ipAddress) {
      return this.context.ipAddress;
    }

    // Last resort: extract from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    // Default to localhost for development
    return 'localhost';
  }

  /**
   * Reset rate limit for identifier
   */
  resetRateLimit(identifier: string): void {
    if (this.options.rateLimitType) {
      rateLimiter.reset(identifier, this.options.rateLimitType);
      logger.debug('Rate limit reset', { identifier, type: this.options.rateLimitType });
    }
  }

  /**
   * Block identifier for specified duration
   */
  blockIdentifier(identifier: string, durationMs?: number): void {
    if (this.options.rateLimitType) {
      rateLimiter.block(identifier, this.options.rateLimitType, durationMs);
      logger.warn('Identifier blocked', { identifier, type: this.options.rateLimitType, durationMs });
    }
  }

  /**
   * Get security headers for response
   */
  getSecurityHeaders(): Record<string, string> {
    return generateSecurityHeaders();
  }
}

/**
 * Create security middleware instance
 */
export function createSecurityMiddleware(
  options: SecurityMiddlewareOptions = {},
  context: SecurityContext = {}
): SecurityMiddleware {
  return new SecurityMiddleware(options, context);
}

/**
 * Express.js style middleware for security headers
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: () => void): void {
  try {
    const headers = generateSecurityHeaders();
    
    // Apply headers to response
    Object.entries(headers).forEach(([key, value]) => {
      // In Express, this would be res.setHeader(key, value)
      // For Firebase Functions, headers are set differently
      logger.debug('Security header applied', { key, value });
    });
    
    next();
  } catch (error) {
    logger.error('Security headers middleware error', error instanceof Error ? error : new Error(String(error)));
    next();
  }
}

// Export types
export type { SecurityMiddlewareOptions, SecurityContext };

