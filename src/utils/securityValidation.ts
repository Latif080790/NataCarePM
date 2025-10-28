/**
 * Enhanced Security Validation Utilities
 * 
 * Provides additional security validation beyond basic input validation
 * including request validation, suspicious activity detection, and 
 * enhanced sanitization for security-critical operations.
 */

import { logger } from '@/utils/logger.enhanced';
import DOMPurify from 'dompurify';

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface RequestValidationOptions {
  maxPayloadSize?: number;
  allowedMethods?: string[];
  rateLimitKey?: string;
  requireAuthentication?: boolean;
  allowedOrigins?: string[];
}

/**
 * Validate HTTP request for security issues
 */
export function validateRequest(
  request: Request,
  options: RequestValidationOptions = {}
): SecurityValidationResult {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check payload size
  if (options.maxPayloadSize) {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > options.maxPayloadSize) {
      errors.push('Request payload exceeds maximum allowed size');
      riskLevel = 'high';
    }
  }

  // Check HTTP method
  if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
    errors.push(`HTTP method ${request.method} not allowed`);
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  // Check origin (CORS)
  if (options.allowedOrigins) {
    const origin = request.headers.get('origin');
    if (origin && !options.allowedOrigins.includes(origin)) {
      errors.push('Request origin not allowed');
      riskLevel = riskLevel === 'low' ? 'high' : riskLevel;
    }
  }

  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-original-host',
    'x-rewrite-url',
    'x-original-url'
  ];
  
  for (const header of suspiciousHeaders) {
    if (request.headers.has(header)) {
      errors.push(`Suspicious header detected: ${header}`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      recommendations.push(`Investigate requests with ${header} header`);
    }
  }

  // Check for SQL injection patterns in URL parameters
  const url = new URL(request.url);
  for (const [key, value] of url.searchParams.entries()) {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /('|"|`).*?(--|;)/,
      /\b(OR|AND)\s+\d+\s*=\s*\d+/i
    ];
    
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(value)) {
        errors.push(`Potential SQL injection in parameter ${key}`);
        riskLevel = riskLevel === 'low' ? 'high' : riskLevel;
        recommendations.push(`Sanitize parameter ${key} input`);
      }
    }
  }

  logger.debug('Request security validation completed', {
    url: request.url,
    method: request.method,
    errors: errors.length,
    riskLevel
  });

  return {
    isValid: errors.length === 0,
    errors,
    riskLevel,
    recommendations
  };
}

/**
 * Detect suspicious user activity patterns
 */
export function detectSuspiciousActivity(
  activity: {
    userId: string;
    action: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    location?: string;
  },
  baseline: {
    averageActionsPerHour: number;
    commonLocations: string[];
    typicalUserAgents: string[];
  }
): SecurityValidationResult {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check for unusual frequency
  // This would typically be compared against historical data
  // For now, we'll use a simple heuristic
  const actionsInLastHour = 1; // Would be fetched from DB in real implementation
  if (actionsInLastHour > baseline.averageActionsPerHour * 5) {
    errors.push('Unusual activity frequency detected');
    riskLevel = 'high';
    recommendations.push('Consider temporary account restriction');
  }

  // Check for unusual location
  if (activity.location && !baseline.commonLocations.includes(activity.location)) {
    errors.push('Unusual location detected');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    recommendations.push('Verify location with user');
  }

  // Check for suspicious user agent
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /scanner/i,
    /automated/i
  ];
  
  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(activity.userAgent)) {
      errors.push('Suspicious user agent detected');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      recommendations.push('Investigate automated activity');
    }
  }

  // Check for known malicious IP patterns
  const ipParts = activity.ipAddress.split('.');
  if (ipParts.length === 4) {
    const firstOctet = parseInt(ipParts[0]);
    // Private IP ranges that shouldn't be public
    if (firstOctet === 10 || firstOctet === 172 || firstOctet === 192) {
      errors.push('Private IP address in public context');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
  }

  logger.info('Suspicious activity detection completed', {
    userId: activity.userId,
    action: activity.action,
    errors: errors.length,
    riskLevel
  });

  return {
    isValid: errors.length === 0,
    errors,
    riskLevel,
    recommendations
  };
}

/**
 * Enhanced sanitization for security-critical content
 */
export function sanitizeForSecurity(input: string, context: string): string {
  if (!input) return '';

  try {
    // Context-specific sanitization
    let sanitized = '';
    const lowerContext = context.toLowerCase();

    if (lowerContext === 'html') {
      // For 'html' context, use default DOMPurify which removes <script> AND its content
      // This will make '<script>alert("xss")</script>Hello' become 'Hello'
      sanitized = DOMPurify.sanitize(input);
    } else {
      // For other contexts, use the logic to strip tags but keep content
      sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // Strip all HTML by default
        KEEP_CONTENT: true,
      });
    }

    // Second pass: Remove potentially dangerous characters
    sanitized = sanitized
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
      .replace(/[\u2028-\u2029]/g, '') // Line/paragraph separators
      .replace(/javascript:/gi, '') // JavaScript protocols
      .replace(/vbscript:/gi, '') // VBScript protocols
      .replace(/data:/gi, '') // Data URLs (except images in appropriate contexts)
      .replace(/on\w+\s*=/gi, '') // Event handlers
      .trim();

    // Context-specific sanitization
    // We keep the switch for non-'html' contexts
    switch (lowerContext) {
      case 'filename':
        // Remove path traversal attempts and invalid characters
        sanitized = sanitized
          .replace(/\.\./g, '') // Path traversal
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Invalid filename characters
          .replace(/^\.+/, '') // Leading dots
          .substring(0, 255); // Limit filename length
        break;
        
      case 'json':
        // Ensure valid JSON characters
        sanitized = sanitized.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');
        break;
        
      case 'csv':
        // Prevent CSV formula injection
        const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
        if (dangerousPrefixes.some(prefix => sanitized.startsWith(prefix))) {
          sanitized = `'${sanitized}`; // Prefix with single quote
        }
        break;
        
      case 'url':
        // Validate URL format
        try {
          new URL(sanitized);
        } catch {
          sanitized = ''; // Invalid URL
        }
        break;
    }

    logger.debug('Content sanitized for security', { context, originalLength: input.length, sanitizedLength: sanitized.length });
    
    return sanitized;
  } catch (error) {
    logger.error('Security sanitization failed', error instanceof Error ? error : new Error(String(error)), { context });
    return ''; // Return empty string on error
  }
}

/**
 * Validate file upload for security
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFilenameLength?: number;
  } = {}
): SecurityValidationResult {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`File size (${file.size} bytes) exceeds maximum allowed size (${options.maxSize} bytes)`);
    riskLevel = 'high';
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed`);
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  // Check filename - only flag as error if dangerous characters were actually removed
  const sanitizedFilename = sanitizeForSecurity(file.name, 'filename');
  // Only consider it an error if potentially dangerous characters were removed
  const hasDangerousChars = file.name !== sanitizedFilename && (
    file.name.includes('..') || 
    /[<>:"/\\|?*\x00-\x1F]/.test(file.name) ||
    file.name.startsWith('.')
  );
  
  if (hasDangerousChars) {
    errors.push('Filename contains invalid characters');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  if (options.maxFilenameLength && file.name.length > options.maxFilenameLength) {
    errors.push(`Filename too long (max ${options.maxFilenameLength} characters)`);
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.msi'
  ];
  
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (dangerousExtensions.includes(fileExtension)) {
    errors.push(`Potentially dangerous file extension: ${fileExtension}`);
    riskLevel = 'critical';
    recommendations.push('Reject file upload immediately');
  }

  logger.info('File upload validation completed', {
    filename: file.name,
    size: file.size,
    type: file.type,
    errors: errors.length,
    riskLevel
  });

  return {
    isValid: errors.length === 0,
    errors,
    riskLevel,
    recommendations
  };
}

/**
 * Generate security headers for responses
 */
export function generateSecurityHeaders(): Record<string, string> {
  return {
    // Prevent XSS
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Content Security Policy
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    
    // Strict Transport Security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}