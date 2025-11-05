/**
 * Input Validation Middleware
 * Comprehensive input validation and sanitization for API security
 */

import * as yup from 'yup';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { Request, Response, NextFunction } from 'express';
import type { APIResponse } from '@/types/userProfile';

// ========================================
// DOMPURIFY SETUP
// ========================================

// Create a DOMPurify instance with JSDOM
const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

// ========================================
// TYPES
// ========================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
}

// ========================================
// SANITIZATION FUNCTIONS
// ========================================

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';

  // Use DOMPurify to sanitize HTML
  const sanitized = DOMPurifyInstance.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });

  // Additional custom sanitization
  return sanitized
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .substring(0, 10000); // Limit length
};

/**
 * Sanitize HTML input (for rich text fields)
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';

  // Allow basic HTML tags for rich text
  return DOMPurifyInstance.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase().substring(0, 254);
};

/**
 * Sanitize filename for file uploads
 */
export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') return '';

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .substring(0, 255); // Limit length
};

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Password validation schema
 */
export const passwordSchema = yup
  .string()
  .required('Password is required')
  .min(12, 'Password must be at least 12 characters long')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .max(128, 'Password must not exceed 128 characters');

/**
 * Email validation schema
 */
export const emailSchema = yup
  .string()
  .required('Email is required')
  .email('Invalid email format')
  .max(254, 'Email must not exceed 254 characters');

/**
 * User registration schema
 */
export const userRegistrationSchema = yup.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: yup
    .string()
    .required('First name is required')
    .min(1, 'First name cannot be empty')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(1, 'Last name cannot be empty')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  role: yup
    .string()
    .oneOf(['admin', 'manager', 'user'], 'Invalid role')
    .default('user'),
});

/**
 * Password change schema
 */
export const passwordChangeSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

/**
 * Project creation schema
 */
export const projectCreationSchema = yup.object({
  name: yup
    .string()
    .required('Project name is required')
    .min(1, 'Project name cannot be empty')
    .max(100, 'Project name must not exceed 100 characters'),
  description: yup
    .string()
    .max(1000, 'Description must not exceed 1000 characters'),
  budget: yup
    .number()
    .positive('Budget must be positive')
    .max(999999999.99, 'Budget exceeds maximum allowed'),
  startDate: yup
    .date()
    .required('Start date is required'),
  endDate: yup
    .date()
    .required('End date is required')
    .min(yup.ref('startDate'), 'End date must be after start date'),
  managerId: yup
    .string()
    .required('Project manager is required')
    .uuid('Invalid manager ID'),
});

/**
 * Task creation schema
 */
export const taskCreationSchema = yup.object({
  title: yup
    .string()
    .required('Task title is required')
    .min(1, 'Task title cannot be empty')
    .max(200, 'Task title must not exceed 200 characters'),
  description: yup
    .string()
    .max(2000, 'Description must not exceed 2000 characters'),
  projectId: yup
    .string()
    .required('Project ID is required')
    .uuid('Invalid project ID'),
  assigneeId: yup
    .string()
    .uuid('Invalid assignee ID'),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high', 'urgent'], 'Invalid priority'),
  dueDate: yup
    .date(),
  estimatedHours: yup
    .number()
    .positive('Estimated hours must be positive')
    .max(9999, 'Estimated hours exceeds maximum'),
});

/**
 * File upload schema
 */
export const fileUploadSchema = yup.object({
  filename: yup
    .string()
    .required('Filename is required')
    .max(255, 'Filename too long'),
  contentType: yup
    .string()
    .required('Content type is required')
    .matches(
      /^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats|text\/)/,
      'Unsupported file type'
    ),
  size: yup
    .number()
    .required('File size is required')
    .max(10 * 1024 * 1024, 'File size exceeds 10MB limit'), // 10MB
});

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

/**
 * Generic validation middleware
 */
export const validateRequest = (schema: yup.ObjectSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input data
      const sanitizedBody = sanitizeRequestBody(req.body);

      // Validate against schema
      const validatedData = await schema.validate(sanitizedBody, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Attach validated data to request
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || 'unknown',
          message: err.message,
          value: err.value,
        }));

        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: errors,
          },
        };

        return res.status(400).json(response);
      }

      next(error);
    }
  };
};

/**
 * Sanitize request body recursively
 */
export const sanitizeRequestBody = (body: any): any => {
  if (typeof body === 'string') {
    return sanitizeString(body);
  }

  if (Array.isArray(body)) {
    return body.map(sanitizeRequestBody);
  }

  if (body && typeof body === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(body)) {
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value as string);
      } else if (key.toLowerCase().includes('description') || key.toLowerCase().includes('content')) {
        sanitized[key] = sanitizeHtml(value as string);
      } else if (key.toLowerCase().includes('filename')) {
        sanitized[key] = sanitizeFilename(value as string);
      } else {
        sanitized[key] = sanitizeRequestBody(value);
      }
    }
    return sanitized;
  }

  return body;
};

/**
 * File upload validation middleware
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;

  if (!file) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: 'No file uploaded',
      },
    };
    return res.status(400).json(response);
  }

  // Validate file type
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'File type not allowed',
      },
    };
    return res.status(400).json(response);
  }

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds 10MB limit',
      },
    };
    return res.status(400).json(response);
  }

  // Sanitize filename
  file.originalname = sanitizeFilename(file.originalname);

  next();
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Validate data against a schema
 */
export const validateData = async (
  data: any,
  schema: yup.ObjectSchema<any>
): Promise<ValidationResult> => {
  try {
    const sanitizedData = sanitizeRequestBody(data);
    const validatedData = await schema.validate(sanitizedData, {
      abortEarly: false,
      stripUnknown: true,
    });

    return {
      isValid: true,
      errors: [],
      sanitizedData: validatedData,
    };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: ValidationError[] = error.inner.map(err => ({
        field: err.path || 'unknown',
        message: err.message,
        value: err.value,
      }));

      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed',
      }],
    };
  }
};

/**
 * Password strength checker
 */
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) score += 1;
  else feedback.push('Use at least 12 characters');

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  // Number check
  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');

  // Special character check
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  return {
    score: Math.max(0, score),
    feedback,
    isStrong: score >= 4,
  };
};

// ========================================
// EXPORT SCHEMAS
// ========================================

export const validationSchemas = {
  userRegistration: userRegistrationSchema,
  passwordChange: passwordChangeSchema,
  projectCreation: projectCreationSchema,
  taskCreation: taskCreationSchema,
  fileUpload: fileUploadSchema,
  password: passwordSchema,
  email: emailSchema,
};
