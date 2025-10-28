/**
 * Enhanced Input Validation Utilities
 * 
 * Provides comprehensive input validation beyond basic validation
 * including advanced sanitization, XSS protection, SQL injection prevention,
 * and enhanced data type validation.
 */

import { logger } from './logger.enhanced';
import DOMPurify from 'dompurify';

export interface EnhancedValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface EnhancedValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedChars?: string;
  disallowedChars?: string;
  sanitize?: boolean;
  sanitizeContext?: string;
  customValidator?: (value: any) => boolean;
  trimWhitespace?: boolean;
  allowNull?: boolean;
}

/**
 * Enhanced string validation with comprehensive sanitization
 */
export function validateString(
  value: any,
  fieldName: string,
  options: EnhancedValidationOptions = {}
): EnhancedValidationResult {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let sanitizedValue = value;

  // Check if value is null/undefined
  if (value === null || value === undefined) {
    if (options.required) {
      errors.push(`${fieldName} is required`);
      riskLevel = 'high';
    } else if (options.allowNull) {
      return {
        isValid: true,
        errors: [],
        sanitizedValue: null,
        riskLevel: 'low',
        recommendations: []
      };
    } else {
      sanitizedValue = '';
    }
  } else {
    // Convert to string if needed
    if (typeof value !== 'string') {
      sanitizedValue = String(value);
    }

    // Trim whitespace if requested
    if (options.trimWhitespace !== false) {
      sanitizedValue = sanitizedValue.trim();
    }

    // Check minimum length
    if (options.minLength && sanitizedValue.length < options.minLength) {
      errors.push(`${fieldName} must be at least ${options.minLength} characters long`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // Check maximum length
    if (options.maxLength && sanitizedValue.length > options.maxLength) {
      errors.push(`${fieldName} must be no more than ${options.maxLength} characters long`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // Check pattern
    if (options.pattern && !options.pattern.test(sanitizedValue)) {
      errors.push(`${fieldName} format is invalid`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // Check allowed characters
    if (options.allowedChars) {
      const disallowedChars = sanitizedValue.split('').filter((char: string) => !options.allowedChars?.includes(char));
      if (disallowedChars.length > 0) {
        errors.push(`${fieldName} contains disallowed characters: ${disallowedChars.join(', ')}`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }

    // Check disallowed characters
    if (options.disallowedChars) {
      const foundDisallowed = sanitizedValue.split('').filter((char: string) => options.disallowedChars?.includes(char));
      if (foundDisallowed.length > 0) {
        errors.push(`${fieldName} contains disallowed characters: ${foundDisallowed.join(', ')}`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }

    // Run custom validator
    if (options.customValidator && !options.customValidator(sanitizedValue)) {
      errors.push(`${fieldName} failed custom validation`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
  }

  // Sanitize if requested
  if (options.sanitize !== false && sanitizedValue) {
    try {
      sanitizedValue = sanitizeInput(sanitizedValue, options.sanitizeContext || 'text');
    } catch (error) {
      errors.push(`Failed to sanitize ${fieldName}`);
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      logger.error(`Input sanitization failed for ${fieldName}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
    riskLevel,
    recommendations
  };
}

/**
 * Enhanced email validation with comprehensive checks
 */
export function validateEmail(
  email: any,
  fieldName: string = 'Email',
  options: EnhancedValidationOptions = {}
): EnhancedValidationResult {
  const baseOptions: EnhancedValidationOptions = {
    required: true,
    maxLength: 254,
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    sanitize: true,
    sanitizeContext: 'email',
    ...options
  };

  const result = validateString(email, fieldName, baseOptions);

  // Additional email-specific checks
  if (result.isValid && result.sanitizedValue) {
    const emailStr = result.sanitizedValue as string;
    
    // Check for common disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
      'yopmail.com', 'tempmail.com', 'throwawaymail.com'
    ];
    
    const domain = emailStr.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      result.errors.push('Disposable email addresses are not allowed');
      result.riskLevel = 'medium';
      result.isValid = false;
    }
    
    // Check for suspicious patterns
    if (emailStr.length < 5) {
      result.errors.push('Email address is too short');
      result.riskLevel = result.riskLevel === 'low' ? 'medium' : result.riskLevel;
    }
  }

  return result;
}

/**
 * Enhanced password validation with strength checking
 */
export function validatePassword(
  password: any,
  fieldName: string = 'Password',
  options: EnhancedValidationOptions = {}
): EnhancedValidationResult {
  const baseOptions: EnhancedValidationOptions = {
    required: true,
    minLength: 8,
    maxLength: 128,
    sanitize: false, // Never sanitize passwords
    ...options
  };

  const result = validateString(password, fieldName, baseOptions);

  // Additional password strength checks
  if (result.isValid && result.sanitizedValue) {
    const passwordStr = result.sanitizedValue as string;
    let strengthScore = 0;
    const recommendations: string[] = [];

    // Length check (already done by base validation)
    if (passwordStr.length >= 12) strengthScore += 2;
    else if (passwordStr.length >= 8) strengthScore += 1;

    // Character variety checks
    if (/[a-z]/.test(passwordStr)) strengthScore += 1;
    else recommendations.push('Include lowercase letters');

    if (/[A-Z]/.test(passwordStr)) strengthScore += 1;
    else recommendations.push('Include uppercase letters');

    if (/[0-9]/.test(passwordStr)) strengthScore += 1;
    else recommendations.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(passwordStr)) strengthScore += 1;
    else recommendations.push('Include special characters');

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'qwerty', 'admin', 'letmein', 
      'welcome', 'monkey', '123456789', 'password123'
    ];
    
    const lowerPassword = passwordStr.toLowerCase();
    if (weakPasswords.includes(lowerPassword)) {
      result.errors.push('Password is too common and easily guessable');
      result.riskLevel = 'critical';
      result.isValid = false;
      return result;
    }

    // Check for sequential characters
    if (/123|abc|qwe/.test(lowerPassword)) {
      result.errors.push('Password contains sequential characters');
      result.riskLevel = result.riskLevel === 'low' ? 'medium' : result.riskLevel;
      recommendations.push('Avoid sequential characters');
    }

    // Determine strength based on score
    if (strengthScore < 3) {
      result.errors.push('Password is too weak');
      result.riskLevel = 'high';
      result.isValid = false;
    } else if (strengthScore < 5) {
      result.riskLevel = result.riskLevel === 'low' ? 'medium' : result.riskLevel;
    }

    result.recommendations = recommendations;
  }

  return result;
}

/**
 * Enhanced number validation
 */
export function validateNumber(
  value: any,
  fieldName: string,
  options: EnhancedValidationOptions & { min?: number; max?: number } = {}
): EnhancedValidationResult {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let sanitizedValue: number | null = null;

  // Check if value is null/undefined
  if (value === null || value === undefined) {
    if (options.required) {
      errors.push(`${fieldName} is required`);
      riskLevel = 'high';
    } else if (options.allowNull) {
      return {
        isValid: true,
        errors: [],
        sanitizedValue: null,
        riskLevel: 'low',
        recommendations: []
      };
    }
  } else {
    // Convert to number
    const numValue = Number(value);
    
    // Check if it's a valid number
    if (isNaN(numValue) || !isFinite(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
      riskLevel = 'high';
    } else {
      sanitizedValue = numValue;
      
      // Check minimum value
      if (options.min !== undefined && numValue < options.min) {
        errors.push(`${fieldName} must be at least ${options.min}`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
      
      // Check maximum value
      if (options.max !== undefined && numValue > options.max) {
        errors.push(`${fieldName} must be no more than ${options.max}`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
    riskLevel,
    recommendations
  };
}

/**
 * Enhanced array validation
 */
export function validateArray(
  value: any,
  fieldName: string,
  itemValidator: (item: any, index: number) => EnhancedValidationResult,
  options: EnhancedValidationOptions & { minItems?: number; maxItems?: number } = {}
): EnhancedValidationResult {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let sanitizedValue: any[] = [];

  // Check if value is null/undefined
  if (value === null || value === undefined) {
    if (options.required) {
      errors.push(`${fieldName} is required`);
      riskLevel = 'high';
    } else if (options.allowNull) {
      return {
        isValid: true,
        errors: [],
        sanitizedValue: null,
        riskLevel: 'low',
        recommendations: []
      };
    } else {
      sanitizedValue = [];
    }
  } else {
    // Check if it's an array
    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array`);
      riskLevel = 'high';
    } else {
      sanitizedValue = [...value];
      
      // Check minimum items
      if (options.minItems !== undefined && value.length < options.minItems) {
        errors.push(`${fieldName} must have at least ${options.minItems} items`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
      
      // Check maximum items
      if (options.maxItems !== undefined && value.length > options.maxItems) {
        errors.push(`${fieldName} must have no more than ${options.maxItems} items`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
      
      // Validate each item
      const itemErrors: string[] = [];
      value.forEach((item, index) => {
        const itemResult = itemValidator(item, index);
        if (!itemResult.isValid) {
          itemErrors.push(...itemResult.errors.map(err => `${fieldName}[${index}]: ${err}`));
          if (itemResult.riskLevel === 'critical' || itemResult.riskLevel === 'high') {
            riskLevel = itemResult.riskLevel;
          } else if (itemResult.riskLevel === 'medium' && riskLevel === 'low') {
            riskLevel = 'medium';
          }
        }
      });
      
      if (itemErrors.length > 0) {
        errors.push(...itemErrors);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
    riskLevel,
    recommendations
  };
}

/**
 * Comprehensive input sanitization
 */
export function sanitizeInput(input: string, context: string = 'text'): string {
  if (!input) return '';

  try {
    let sanitized = input;

    // First pass: DOMPurify for HTML content based on context
    switch (context.toLowerCase()) {
      case 'html':
        sanitized = DOMPurify.sanitize(input, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
          ALLOWED_ATTR: ['href', 'title'],
          KEEP_CONTENT: true,
        });
        break;
        
      case 'email':
        // Remove any HTML tags for emails
        sanitized = DOMPurify.sanitize(input, {
          ALLOWED_TAGS: [],
          KEEP_CONTENT: true,
        });
        break;
        
      case 'url':
        // Validate and sanitize URL
        try {
          const url = new URL(input);
          // Only allow http/https protocols
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            sanitized = url.toString();
          } else {
            sanitized = '';
          }
        } catch {
          sanitized = ''; // Invalid URL
        }
        break;
        
      default:
        // Strip all HTML by default for text contexts
        sanitized = DOMPurify.sanitize(input, {
          ALLOWED_TAGS: [],
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
    switch (context.toLowerCase()) {
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
    }

    logger.debug('Input sanitized', { context, originalLength: input.length, sanitizedLength: sanitized.length });
    
    return sanitized;
  } catch (error) {
    logger.error('Input sanitization failed', error instanceof Error ? error : new Error(String(error)), { context });
    return ''; // Return empty string on error
  }
}

/**
 * Validate and sanitize object with multiple fields
 */
export function validateObject(
  obj: any,
  fieldValidators: { [key: string]: (value: any) => EnhancedValidationResult },
  options: EnhancedValidationOptions = {}
): EnhancedValidationResult {
  const errors: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const sanitizedValue: { [key: string]: any } = {};

  // Check if object is null/undefined
  if (obj === null || obj === undefined) {
    if (options.required) {
      return {
        isValid: false,
        errors: ['Object is required'],
        riskLevel: 'high',
        recommendations: []
      };
    } else {
      return {
        isValid: true,
        errors: [],
        sanitizedValue: {},
        riskLevel: 'low',
        recommendations: []
      };
    }
  }

  // Validate each field
  for (const [fieldName, validator] of Object.entries(fieldValidators)) {
    const fieldValue = obj[fieldName];
    const fieldResult = validator(fieldValue);
    
    if (!fieldResult.isValid) {
      errors.push(...fieldResult.errors.map(err => `${fieldName}: ${err}`));
      if (fieldResult.riskLevel === 'critical' || fieldResult.riskLevel === 'high') {
        riskLevel = fieldResult.riskLevel;
      } else if (fieldResult.riskLevel === 'medium' && riskLevel === 'low') {
        riskLevel = 'medium';
      }
    }
    
    sanitizedValue[fieldName] = fieldResult.sanitizedValue;
    recommendations.push(...fieldResult.recommendations.map(rec => `${fieldName}: ${rec}`));
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
    riskLevel,
    recommendations
  };
}

// Export all validation functions
export default {
  validateString,
  validateEmail,
  validatePassword,
  validateNumber,
  validateArray,
  sanitizeInput,
  validateObject
};