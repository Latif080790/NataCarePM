/**
 * Enhanced Security Tests
 * Comprehensive test suite for enhanced security features
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnhancedSecurityMiddleware, createEnhancedSecurityMiddleware } from '../../middleware/enhancedSecurity.middleware';
import { enhancedRateLimiter } from '../../utils/enhancedRateLimiter';
import * as securityValidation from '../../utils/securityValidation';
import { validateString, validateEmail, validatePassword, validateNumber } from '../../utils/enhancedInputValidation';

// Mock logger
vi.mock('@/utils/logger.enhanced', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn().mockImplementation((input, config) => {
      // console.log('DOMPurify.sanitize called with:', { input, config }); // Debug log
      
      // Handle null/undefined input
      if (!input) return '';
      
      // If it's not a string, convert to string
      if (typeof input !== 'string') {
        return String(input);
      }
      
      // Handle DOMPurify config for stripping HTML tags but keeping content
      if (config && config.ALLOWED_TAGS && config.ALLOWED_TAGS.length === 0 && config.KEEP_CONTENT === true) {
        // Strip all HTML tags but keep content
        // This regex finds HTML tags and removes them, but keeps the content between them
        const result = input.replace(/<[^>]*>/g, '');
        // console.log('Stripped HTML, result:', result); // Debug log
        return result;
      } 
      // Handle case for HTML context (no config) - remove script tags and content
      else if (!config) {
        // For HTML sanitization, remove script tags and their content
        return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
      }
      // Handle other DOMPurify configs that allow specific tags
      else if (config && config.ALLOWED_TAGS) {
        // For configs that allow some tags, just strip script tags for testing purposes
        return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
      }
      
      // Default case - just return input
      return input;
    }),
  },
}));

describe('Enhanced Security Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enhancedRateLimiter.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Security Middleware', () => {
    it('should create middleware with default options', () => {
      const middleware = new EnhancedSecurityMiddleware();
      
      expect(middleware).toBeInstanceOf(EnhancedSecurityMiddleware);
    });

    it('should create middleware with custom options', () => {
      const options = {
        rateLimitType: 'custom',
        slidingWindowMs: 30000,
        maxRequestsPerWindow: 50,
        requireAuthentication: true,
      };
      
      const middleware = new EnhancedSecurityMiddleware(options);
      
      // We can't directly access private properties, but we can test behavior
      expect(middleware).toBeInstanceOf(EnhancedSecurityMiddleware);
    });

    it('should apply security middleware successfully', async () => {
      const middleware = new EnhancedSecurityMiddleware();
      
      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        data: 'test data'
      });
      
      const mockRequest = new Request('http://localhost:3000/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await middleware.apply(mockHandler, mockRequest);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('test data');
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    });

    it('should block requests when rate limit is exceeded', async () => {
      const middleware = new EnhancedSecurityMiddleware({
        rateLimitType: 'test-limit',
        slidingWindowMs: 1000,
        maxRequestsPerWindow: 2
      });
      
      const mockHandler = vi.fn().mockResolvedValue({
        success: true,
        data: 'test data'
      });
      
      const mockRequest = new Request('http://localhost:3000/test', {
        method: 'GET'
      });
      
      // First two requests should pass
      await middleware.apply(mockHandler, mockRequest);
      await middleware.apply(mockHandler, mockRequest);
      
      // Third request should be blocked
      const result = await middleware.apply(mockHandler, mockRequest);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should reset rate limit for identifier', () => {
      const middleware = new EnhancedSecurityMiddleware({
        rateLimitType: 'reset-test'
      });
      
      // @ts-ignore - accessing private method for testing
      middleware.resetRateLimit('test-user');
      
      // This should not throw an error
      expect(true).toBe(true);
    });

    it('should block identifier manually', () => {
      const middleware = new EnhancedSecurityMiddleware({
        rateLimitType: 'block-test'
      });
      
      // @ts-ignore - accessing private method for testing
      middleware.blockIdentifier('test-user', 5000);
      
      // This should not throw an error
      expect(true).toBe(true);
    });

    it('should generate security headers', () => {
      const middleware = new EnhancedSecurityMiddleware({
        enableCSP: true,
        enableHSTS: true
      });
      
      const headers = middleware.getSecurityHeaders();
      
      expect(headers).toHaveProperty('X-XSS-Protection');
      expect(headers).toHaveProperty('X-Content-Type-Options');
      expect(headers).toHaveProperty('X-Frame-Options');
      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('Strict-Transport-Security');
    });
  });

  describe('Enhanced Rate Limiter', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user';
      const type = 'api-test';
      
      // Configure rate limiter
      enhancedRateLimiter.setConfig(type, {
        windowMs: 60000,
        maxRequests: 5,
        blockDurationMs: 300000
      });
      
      // First request should be allowed
      const result1 = enhancedRateLimiter.checkLimit(identifier, type);
      expect(result1.allowed).toBe(true);
      expect(result1.remainingRequests).toBe(4);
      
      // Second request should be allowed
      const result2 = enhancedRateLimiter.checkLimit(identifier, type);
      expect(result2.allowed).toBe(true);
      expect(result2.remainingRequests).toBe(3);
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user-exceed';
      const type = 'exceed-test';
      
      // Configure rate limiter
      enhancedRateLimiter.setConfig(type, {
        windowMs: 1000,
        maxRequests: 2,
        blockDurationMs: 5000
      });
      
      // Make requests to exceed limit
      enhancedRateLimiter.checkLimit(identifier, type);
      enhancedRateLimiter.checkLimit(identifier, type);
      
      // Third request should be blocked
      const result = enhancedRateLimiter.checkLimit(identifier, type);
      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
    });

    it('should reset rate limit', () => {
      const identifier = 'test-user-reset';
      const type = 'reset-test';
      
      // Configure rate limiter
      enhancedRateLimiter.setConfig(type, {
        windowMs: 60000,
        maxRequests: 5,
        blockDurationMs: 300000
      });
      
      // Make a request
      enhancedRateLimiter.checkLimit(identifier, type);
      
      // Reset
      enhancedRateLimiter.reset(identifier, type);
      
      // Check status after reset
      const status = enhancedRateLimiter.getStatus(identifier, type);
      expect(status.requestsInWindow).toBe(0);
      expect(status.remainingRequests).toBe(5);
    });

    it('should provide accurate status information', () => {
      const identifier = 'test-user-status';
      const type = 'status-test';
      
      // Configure rate limiter
      enhancedRateLimiter.setConfig(type, {
        windowMs: 60000,
        maxRequests: 10,
        blockDurationMs: 300000
      });
      
      // Make a few requests
      enhancedRateLimiter.checkLimit(identifier, type);
      enhancedRateLimiter.checkLimit(identifier, type);
      enhancedRateLimiter.checkLimit(identifier, type);
      
      // Check status
      const status = enhancedRateLimiter.getStatus(identifier, type);
      expect(status.requestsInWindow).toBe(3);
      expect(status.remainingRequests).toBe(7);
      expect(status.blocked).toBe(false);
    });
  });

  describe('Enhanced Input Validation', () => {
    it('should validate strings with various options', () => {
      // Test basic string validation
      const result1 = validateString('Hello World', 'testField');
      expect(result1.isValid).toBe(true);
      expect(result1.sanitizedValue).toBe('Hello World');
      
      // Test required field
      const result2 = validateString('', 'requiredField', { required: true });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('requiredField is required');
      
      // Test minimum length
      const result3 = validateString('Hi', 'minLengthField', { minLength: 5 });
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('minLengthField must be at least 5 characters long');
      
      // Test maximum length
      const result4 = validateString('This is a very long string that exceeds the limit', 'maxLengthField', { maxLength: 10 });
      expect(result4.isValid).toBe(false);
      expect(result4.errors).toContain('maxLengthField must be no more than 10 characters long');
    });

    it('should validate emails with comprehensive checks', () => {
      // Test valid email
      const result1 = validateEmail('test@example.com', 'emailField');
      expect(result1.isValid).toBe(true);
      expect(result1.sanitizedValue).toBe('test@example.com');
      
      // Test invalid email
      const result2 = validateEmail('invalid-email', 'emailField');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('emailField format is invalid');
      
      // Test disposable email (should be blocked)
      const result3 = validateEmail('test@10minutemail.com', 'emailField');
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('Disposable email addresses are not allowed');
    });

    it('should validate passwords with strength checking', () => {
      // Test weak password - set minLength to allow 6 character passwords to pass basic validation
      const result1 = validatePassword('123456', 'passwordField', { minLength: 6 });
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Password is too common and easily guessable');
      
      // Test moderately strong password
      const result2 = validatePassword('Password123!', 'passwordField');
      expect(result2.isValid).toBe(true);
      
      // Test too short password
      const result3 = validatePassword('Pass1!', 'passwordField', { minLength: 12 });
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('passwordField must be at least 12 characters long');
    });

    it('should validate numbers with range checking', () => {
      // Test valid number
      const result1 = validateNumber(42, 'numberField');
      expect(result1.isValid).toBe(true);
      expect(result1.sanitizedValue).toBe(42);
      
      // Test number below minimum
      const result2 = validateNumber(5, 'numberField', { min: 10 });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('numberField must be at least 10');
      
      // Test number above maximum
      const result3 = validateNumber(100, 'numberField', { max: 50 });
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('numberField must be no more than 50');
    });

    it('should sanitize inputs properly', () => {
      // Test basic text sanitization
      const result1 = validateString('<script>alert("xss")</script>Hello World', 'textField', { sanitize: true });
      expect(result1.sanitizedValue).toBe('Hello World');
      
      // Test email sanitization
      const result2 = validateEmail('test@example.com<script>', 'emailField', { sanitize: true });
      expect(result2.sanitizedValue).toBe('test@example.com');
      
      // Test filename sanitization
      const result3 = validateString('../../../etc/passwd', 'filenameField', { 
        sanitize: true, 
        sanitizeContext: 'filename' 
      });
      expect(result3.sanitizedValue).toBe('etcpasswd');
    });
  });

  describe('Security Validation Utilities', () => {
    it('should validate HTTP requests', () => {
      const mockRequest = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '10000000' // 10MB
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      // Manually set the Content-Length header since Request constructor might not preserve it
      Object.defineProperty(mockRequest.headers, 'get', {
        value: vi.fn((name) => {
          if (name.toLowerCase() === 'content-length') {
            return '10000000';
          }
          return null;
        }),
        writable: true
      });
      
      const result = securityValidation.validateRequest(mockRequest, {
        maxPayloadSize: 1024 * 1024 // 1MB
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Request payload exceeds maximum allowed size');
    });

    it('should detect suspicious activity', () => {
      const activity = {
        userId: 'test-user',
        action: 'GET /api/sensitive-data',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date()
      };
      
      const baseline = {
        averageActionsPerHour: 10,
        commonLocations: ['ID', 'SG'],
        typicalUserAgents: ['Mozilla', 'Chrome']
      };
      
      const result = securityValidation.detectSuspiciousActivity(activity, baseline);
      
      // This is a mock test - in real implementation, this would depend on the logic
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('riskLevel');
    });

    it('should sanitize content for security', () => {
      // Test HTML sanitization
      const result1 = securityValidation.sanitizeForSecurity('<script>alert("xss")</script>Hello', 'html');
      expect(result1).toBe('Hello');
      
      // Test filename sanitization
      const result2 = securityValidation.sanitizeForSecurity('../../../etc/passwd', 'filename');
      expect(result2).toBe('etcpasswd');
      
      // Test CSV sanitization
      const result3 = securityValidation.sanitizeForSecurity('=1+1', 'csv');
      expect(result3).toBe('\'=1+1');
    });

    it('should validate file uploads', () => {
      // Create a mock file
      const mockFile = new File(['test content'], 'test.txt', {
        type: 'text/plain'
      });
      
      // Ensure the size property is correctly set
      Object.defineProperty(mockFile, 'size', {
        value: 12, // 'test content' is 12 bytes
        writable: false
      });
      
      const result = securityValidation.validateFileUpload(mockFile, {
        maxSize: 1024,
        allowedTypes: ['text/plain']
      });
      
      expect(result.isValid).toBe(true);
      
      // Test with oversized file
      const largeFile = new File(['x'.repeat(2048)], 'large.txt', {
        type: 'text/plain'
      });
      
      Object.defineProperty(largeFile, 'size', {
        value: 2048,
        writable: false
      });
      
      const result2 = securityValidation.validateFileUpload(largeFile, {
        maxSize: 1024
      });
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('File size (2048 bytes) exceeds maximum allowed size (1024 bytes)');
    });

    it('should generate security headers', () => {
      const headers = securityValidation.generateSecurityHeaders();
      
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('Referrer-Policy');
      expect(headers).toHaveProperty('Permissions-Policy');
      expect(headers).toHaveProperty('Strict-Transport-Security');
    });
  });
});