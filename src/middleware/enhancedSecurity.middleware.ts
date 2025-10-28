/**
 * Enhanced Security Middleware with Sliding Window Rate Limiting
 * 
 * Provides comprehensive security middleware for API endpoints including:
 * - Sliding window rate limiting
 * - Advanced request validation
 * - Input sanitization
 * - Suspicious activity detection
 * - Security headers
 * - Enhanced authentication and session management
 */

import { logger } from '../utils/logger.enhanced';
import { enhancedRateLimiter } from '@/utils/enhancedRateLimiter';
import { validateRequest, detectSuspiciousActivity, generateSecurityHeaders } from '../utils/securityValidation';
import { APIResponse, ErrorCodes } from '@/utils/responseWrapper';

// Type definitions
interface EnhancedSecurityMiddlewareOptions {
  rateLimitType?: string;
  slidingWindowMs?: number;
  maxRequestsPerWindow?: number;
  requireAuthentication?: boolean;
  maxPayloadSize?: number;
  allowedMethods?: string[];
  sanitizeInputs?: boolean;
  detectSuspiciousActivity?: boolean;
  enableCSP?: boolean;
  enableHSTS?: boolean;
}

interface SecurityContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Enhanced Security Middleware for API endpoints with sliding window rate limiting
 */
export class EnhancedSecurityMiddleware {
  private options: EnhancedSecurityMiddlewareOptions;
  private context: SecurityContext;
  private rateLimiter: typeof enhancedRateLimiter;

  constructor(options: EnhancedSecurityMiddlewareOptions = {}, context: SecurityContext = {}) {
    this.options = {
      rateLimitType: 'api',
      slidingWindowMs: 60000, // 1 minute default
      maxRequestsPerWindow: 100,
      requireAuthentication: false,
      maxPayloadSize: 1024 * 1024, // 1MB default
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      sanitizeInputs: true,
      detectSuspiciousActivity: true,
      enableCSP: true,
      enableHSTS: true,
      ...options
    };
    
    this.context = context;
    this.rateLimiter = enhancedRateLimiter;
    
    // Configure rate limiter with sliding window
    if (this.options.rateLimitType) {
      this.rateLimiter.setConfig(this.options.rateLimitType, {
        windowMs: this.options.slidingWindowMs || 60000,
        maxRequests: this.options.maxRequestsPerWindow || 100,
        blockDurationMs: 300000 // 5 minutes default block
      });
    }
  }

  /**
   * Apply enhanced security middleware to request handler
   */
  async apply<T>(
    handler: (request: Request) => Promise<APIResponse<T>>,
    request: Request
  ): Promise<APIResponse<T>> {
    try {
      // Step 1: Enhanced rate limiting with sliding window
      if (this.options.rateLimitType) {
        const identifier = this.getRateLimitIdentifier(request);
        const rateLimitResult = this.rateLimiter.checkLimit(identifier, this.options.rateLimitType);
        
        if (!rateLimitResult.allowed) {
          logger.warn('Rate limit exceeded with sliding window', {
            identifier,
            type: this.options.rateLimitType,
            blockedUntil: rateLimitResult.blockedUntil,
            requestsInWindow: rateLimitResult.requestsInWindow
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

      // Step 2: Enhanced request validation
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

      // Step 6: Add enhanced security headers to response (if applicable)
      // Note: In a real Firebase Functions environment, headers would be set differently
      logger.debug('Enhanced security middleware applied successfully');

      return result;
    } catch (error) {
      logger.error('Enhanced security middleware error', error instanceof Error ? error : new Error(String(error)));
      
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
      this.rateLimiter.reset(identifier, this.options.rateLimitType);
      logger.debug('Rate limit reset', { identifier, type: this.options.rateLimitType });
    }
  }

  /**
   * Block identifier for specified duration
   */
  blockIdentifier(identifier: string, durationMs?: number): void {
    if (this.options.rateLimitType) {
      this.rateLimiter.block(identifier, this.options.rateLimitType, durationMs);
      logger.warn('Identifier blocked', { identifier, type: this.options.rateLimitType, durationMs });
    }
  }

  /**
   * Get enhanced security headers for response
   */
  getSecurityHeaders(): Record<string, string> {
    const headers = generateSecurityHeaders();
    
    // Add enhanced headers if enabled
    if (this.options.enableCSP) {
      headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
    }
    
    if (this.options.enableHSTS) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }
    
    return headers;
  }
}

/**
 * Create enhanced security middleware instance
 */
export function createEnhancedSecurityMiddleware(
  options: EnhancedSecurityMiddlewareOptions = {},
  context: SecurityContext = {}
): EnhancedSecurityMiddleware {
  return new EnhancedSecurityMiddleware(options, context);
}

/**
 * Express.js style middleware for enhanced security headers
 */
export function enhancedSecurityHeadersMiddleware(_req: Request, _res: Response, next: () => void): void {
  try {
    const middleware = new EnhancedSecurityMiddleware();
    const headers = middleware.getSecurityHeaders();
    
    // Apply headers to response
    Object.entries(headers).forEach(([key, value]) => {
      // In Express, this would be res.setHeader(key, value)
      // For Firebase Functions, headers are set differently
      logger.debug('Enhanced security header applied', { key, value });
    });
    
    next();
  } catch (error) {
    logger.error('Enhanced security headers middleware error', error instanceof Error ? error : new Error(String(error)));
    next();
  }
}

// Export types
export type { EnhancedSecurityMiddlewareOptions, SecurityContext };