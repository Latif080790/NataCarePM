/**
 * Security Headers Middleware
 * Implements comprehensive security headers for the application
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// ========================================
// HELMET CONFIGURATION
// ========================================

/**
 * Configure Helmet with comprehensive security headers
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.firebase.com", "https://*.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://*.firebase.com", "https://*.googleapis.com", "wss://*.firebaseio.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Remove X-Powered-By header
  hidePoweredBy: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // XSS protection
  xssFilter: true,

  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Feature policy (permissions policy)
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'self'"],
    },
  },

  // Cross-origin embedder policy
  crossOriginEmbedderPolicy: false, // Disabled for Firebase compatibility

  // Cross-origin opener policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },

  // Cross-origin resource policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

// ========================================
// CUSTOM SECURITY MIDDLEWARE
// ========================================

/**
 * Additional security headers not covered by Helmet
 */
export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove server information
  res.removeHeader('X-Powered-By');

  // Cache control for sensitive pages
  if (req.path.includes('/auth') || req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Environment-specific security headers
 */
export const environmentSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Strict security in production
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.firebase.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.firebase.com wss://*.firebaseio.com");
  } else {
    // Relaxed security in development
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://*.firebase.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob: http://localhost:*; connect-src 'self' http://localhost:* https://*.firebase.com wss://*.firebaseio.com");
  }

  next();
};

/**
 * API-specific security headers
 */
export const apiSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // API-specific headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());

  // Prevent caching of API responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // CORS headers (if needed)
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  next();
};

/**
 * Security headers for static assets
 */
export const staticAssetSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Long-term caching for static assets
  const oneYear = 31536000;
  res.setHeader('Cache-Control', `public, max-age=${oneYear}, immutable`);

  // Security headers for assets
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Generate unique request ID
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Log security header violations (for monitoring)
 */
export const logSecurityViolation = (
  violation: string,
  req: Request,
  details?: any
) => {
  console.warn('Security violation:', {
    violation,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    details,
  });

  // TODO: Send to monitoring service (e.g., Sentry, DataDog)
};

// ========================================
// COMBINED MIDDLEWARE
// ========================================

/**
 * Apply all security headers
 */
export const applySecurityHeaders = [
  securityHeaders,
  additionalSecurityHeaders,
  environmentSecurityHeaders,
];

/**
 * Apply security headers for API routes
 */
export const applyAPISecurityHeaders = [
  securityHeaders,
  additionalSecurityHeaders,
  environmentSecurityHeaders,
  apiSecurityHeaders,
];

/**
 * Apply security headers for static assets
 */
export const applyStaticAssetSecurityHeaders = [
  staticAssetSecurityHeaders,
];

// ========================================
// EXPORT
// ========================================

export const securityMiddleware = {
  applySecurityHeaders,
  applyAPISecurityHeaders,
  applyStaticAssetSecurityHeaders,
  additionalSecurityHeaders,
  environmentSecurityHeaders,
  apiSecurityHeaders,
  staticAssetSecurityHeaders,
  logSecurityViolation,
};
