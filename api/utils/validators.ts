/**
 * 🔒 INPUT VALIDATION UTILITY
 * Comprehensive validation functions for all data types
 * Prevents invalid data from entering the system
 */

import { Task, Project, User, PurchaseOrder, Document } from '../../types';

/**
 * Validation Result Interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validation Error Class
 */
export class ValidationError extends Error {
  constructor(
    public errors: string[],
    public field?: string
  ) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * Basic Type Validators
 */
export const validators = {
  // String validators
  isNonEmptyString: (value: any): boolean => {
    return typeof value === 'string' && value.trim().length > 0;
  },

  isValidString: (value: any, minLength = 1, maxLength = 1000): ValidationResult => {
    const errors: string[] = [];

    if (typeof value !== 'string') {
      errors.push('Value must be a string');
    } else {
      const trimmed = value.trim();
      if (trimmed.length < minLength) {
        errors.push(`String must be at least ${minLength} characters`);
      }
      if (trimmed.length > maxLength) {
        errors.push(`String must not exceed ${maxLength} characters`);
      }
    }

    return { valid: errors.length === 0, errors };
  },

  // Number validators
  isValidNumber: (value: any, min?: number, max?: number): ValidationResult => {
    const errors: string[] = [];

    if (typeof value !== 'number' || isNaN(value)) {
      errors.push('Value must be a valid number');
    } else {
      if (min !== undefined && value < min) {
        errors.push(`Number must be at least ${min}`);
      }
      if (max !== undefined && value > max) {
        errors.push(`Number must not exceed ${max}`);
      }
    }

    return { valid: errors.length === 0, errors };
  },

  isPositiveNumber: (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value) && value > 0;
  },

  isNonNegativeNumber: (value: any): boolean => {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
  },

  // ID validators
  isValidId: (id: any): boolean => {
    return typeof id === 'string' && 
           id.length > 0 && 
           id.length < 128 &&
           /^[a-zA-Z0-9_-]+$/.test(id);
  },

  isValidProjectId: (id: string): ValidationResult => {
    const errors: string[] = [];

    if (!id || typeof id !== 'string') {
      errors.push('Project ID is required and must be a string');
    } else if (id.length === 0) {
      errors.push('Project ID cannot be empty');
    } else if (id.length > 128) {
      errors.push('Project ID is too long (max 128 characters)');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      errors.push('Project ID contains invalid characters (only alphanumeric, dash, underscore allowed)');
    }

    return { valid: errors.length === 0, errors };
  },

  // Email validator
  isValidEmail: (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  // URL validator
  isValidUrl: (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Date validators
  isValidDate: (date: any): boolean => {
    if (!date) return false;
    
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  },

  isValidDateRange: (startDate: any, endDate: any): ValidationResult => {
    const errors: string[] = [];

    if (!validators.isValidDate(startDate)) {
      errors.push('Start date is invalid');
    }
    
    if (!validators.isValidDate(endDate)) {
      errors.push('End date is invalid');
    }

    if (errors.length === 0) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        errors.push('End date must be after start date');
      }
    }

    return { valid: errors.length === 0, errors };
  },

  // Array validators
  isNonEmptyArray: (value: any): boolean => {
    return Array.isArray(value) && value.length > 0;
  },

  isValidArray: (value: any, minLength = 0, maxLength = 1000): ValidationResult => {
    const errors: string[] = [];

    if (!Array.isArray(value)) {
      errors.push('Value must be an array');
    } else {
      if (value.length < minLength) {
        errors.push(`Array must contain at least ${minLength} items`);
      }
      if (value.length > maxLength) {
        errors.push(`Array must not exceed ${maxLength} items`);
      }
    }

    return { valid: errors.length === 0, errors };
  },

  // Enum validator
  isValidEnum: <T>(value: any, enumValues: T[]): boolean => {
    return enumValues.includes(value);
  },

  // Phone validator
  isValidPhone: (phone: string): boolean => {
    if (!phone || typeof phone !== 'string') return false;
    
    // Basic phone validation (accepts various formats)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Sanitization
  sanitizeString: (input: string): string => {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
      .substring(0, 10000); // Cap at 10k characters
  },

  sanitizeHtml: (input: string): string => {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

/**
 * Complex Object Validators
 */

// Task validation
export const validateTask = (task: Partial<Task>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title
  if (!validators.isNonEmptyString(task.title)) {
    errors.push('Task title is required');
  } else if (task.title!.length > 500) {
    errors.push('Task title must not exceed 500 characters');
  }

  // Description (optional but has max length)
  if (task.description && task.description.length > 5000) {
    errors.push('Task description must not exceed 5000 characters');
  }

  // Status
  const validStatuses = ['todo', 'in-progress', 'done', 'blocked', 'completed'];
  if (task.status && !validators.isValidEnum(task.status, validStatuses)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Priority
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (task.priority && !validators.isValidEnum(task.priority, validPriorities)) {
    errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }

  // Progress
  if (task.progress !== undefined) {
    const progressValidation = validators.isValidNumber(task.progress, 0, 100);
    if (!progressValidation.valid) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  // Assigned users
  if (task.assignedTo) {
    const assignedValidation = validators.isValidArray(task.assignedTo, 0, 100);
    if (!assignedValidation.valid) {
      errors.push('Cannot assign more than 100 users to a task');
    }
  }

  // Dates
  if (task.startDate && task.endDate) {
    const dateValidation = validators.isValidDateRange(task.startDate, task.endDate);
    if (!dateValidation.valid) {
      errors.push(...dateValidation.errors);
    }
  }

  // Due date warning
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      warnings.push('Task is overdue');
    } else if (daysDiff <= 3) {
      warnings.push('Task due date is approaching within 3 days');
    }
  }

  // Tags
  if (task.tags) {
    const tagsValidation = validators.isValidArray(task.tags, 0, 50);
    if (!tagsValidation.valid) {
      errors.push('Cannot have more than 50 tags per task');
    }

    // Check individual tag length
    if (Array.isArray(task.tags)) {
      task.tags.forEach((tag, index) => {
        if (typeof tag === 'string' && tag.length > 50) {
          errors.push(`Tag ${index + 1} exceeds 50 characters`);
        }
      });
    }
  }

  // Subtasks
  if (task.subtasks) {
    const subtasksValidation = validators.isValidArray(task.subtasks, 0, 100);
    if (!subtasksValidation.valid) {
      errors.push('Cannot have more than 100 subtasks per task');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

// Project validation
export const validateProject = (project: Partial<Project>): ValidationResult => {
  const errors: string[] = [];

  // Name
  if (!validators.isNonEmptyString(project.name)) {
    errors.push('Project name is required');
  } else if (project.name!.length > 200) {
    errors.push('Project name must not exceed 200 characters');
  }

  // Description
  if (project.description && project.description.length > 10000) {
    errors.push('Project description must not exceed 10000 characters');
  }

  // Budget
  if (project.budget !== undefined) {
    const budgetValidation = validators.isValidNumber(project.budget, 0);
    if (!budgetValidation.valid) {
      errors.push('Budget must be a non-negative number');
    }
  }

  // Dates
  if (project.startDate && project.endDate) {
    const dateValidation = validators.isValidDateRange(project.startDate, project.endDate);
    if (!dateValidation.valid) {
      errors.push(...dateValidation.errors);
    }
  }

  // Client info
  if (project.client) {
    if (project.client.email && !validators.isValidEmail(project.client.email)) {
      errors.push('Invalid client email address');
    }
    if (project.client.phone && !validators.isValidPhone(project.client.phone)) {
      errors.push('Invalid client phone number');
    }
  }

  return { valid: errors.length === 0, errors };
};

// User validation
export const validateUser = (user: Partial<User>): ValidationResult => {
  const errors: string[] = [];

  // Name
  if (!validators.isNonEmptyString(user.name)) {
    errors.push('User name is required');
  } else if (user.name!.length > 100) {
    errors.push('User name must not exceed 100 characters');
  }

  // Email
  if (!user.email || !validators.isValidEmail(user.email)) {
    errors.push('Valid email address is required');
  }

  // Role
  const validRoles = ['admin', 'project-manager', 'site-engineer', 'finance', 'worker'];
  if (user.roleId && !validators.isValidEnum(user.roleId, validRoles)) {
    errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Phone
  if (user.phone && !validators.isValidPhone(user.phone)) {
    errors.push('Invalid phone number');
  }

  return { valid: errors.length === 0, errors };
};

// Purchase Order validation
export const validatePurchaseOrder = (po: Partial<PurchaseOrder>): ValidationResult => {
  const errors: string[] = [];

  // PR Number
  if (!validators.isNonEmptyString(po.prNumber)) {
    errors.push('PR Number is required');
  }

  // Vendor
  if (!validators.isNonEmptyString(po.vendor)) {
    errors.push('Vendor name is required');
  }

  // Items
  if (!validators.isNonEmptyArray(po.items)) {
    errors.push('At least one item is required');
  } else if (po.items!.length > 1000) {
    errors.push('Cannot have more than 1000 items in a single PO');
  }

  // Total amount
  if (po.totalAmount !== undefined) {
    const amountValidation = validators.isValidNumber(po.totalAmount, 0);
    if (!amountValidation.valid) {
      errors.push('Total amount must be a non-negative number');
    }
  }

  // Status
  const validStatuses = ['Menunggu Persetujuan', 'Disetujui', 'Ditolak', 'Delivered'];
  if (po.status && !validators.isValidEnum(po.status, validStatuses)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Request date
  if (!validators.isValidDate(po.requestDate)) {
    errors.push('Valid request date is required');
  }

  return { valid: errors.length === 0, errors };
};

// Document validation
export const validateDocument = (doc: Partial<Document>): ValidationResult => {
  const errors: string[] = [];

  // Name
  if (!validators.isNonEmptyString(doc.name)) {
    errors.push('Document name is required');
  } else if (doc.name!.length > 255) {
    errors.push('Document name must not exceed 255 characters');
  }

  // Category
  const validCategories = [
    'contract', 'specification', 'report', 'drawing', 'permit',
    'invoice', 'certificate', 'correspondence', 'other'
  ];
  if (doc.category && !validators.isValidEnum(doc.category, validCategories)) {
    errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }

  // File size (if uploading)
  if (doc.size !== undefined) {
    const maxSize = 100 * 1024 * 1024; // 100 MB
    if (doc.size > maxSize) {
      errors.push('File size must not exceed 100 MB');
    }
  }

  // URL (if provided)
  if (doc.url && !validators.isValidUrl(doc.url)) {
    errors.push('Invalid document URL');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Batch validation
 * Validates multiple items and returns aggregated results
 */
export const validateBatch = <T>(
  items: T[],
  validatorFn: (item: T) => ValidationResult
): {
  allValid: boolean;
  results: ValidationResult[];
  totalErrors: number;
  totalWarnings: number;
} => {
  const results = items.map(item => validatorFn(item));
  
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
  const totalWarnings = results.reduce((sum, result) => sum + (result.warnings?.length || 0), 0);
  const allValid = results.every(result => result.valid);

  return {
    allValid,
    results,
    totalErrors,
    totalWarnings
  };
};

/**
 * Custom validator builder
 * Creates a custom validator with multiple rules
 */
export const createValidator = (
  rules: Array<{
    condition: (value: any) => boolean;
    errorMessage: string;
  }>
) => {
  return (value: any): ValidationResult => {
    const errors: string[] = [];

    rules.forEach(rule => {
      if (!rule.condition(value)) {
        errors.push(rule.errorMessage);
      }
    });

    return { valid: errors.length === 0, errors };
  };
};

/**
 * Throws ValidationError if validation fails
 * Useful for functions that should halt execution on invalid input
 */
export const assertValid = (
  validation: ValidationResult,
  field?: string
): void => {
  if (!validation.valid) {
    throw new ValidationError(validation.errors, field);
  }
};

/**
 * Firebase-specific validators
 */
export const firebaseValidators = {
  // Firestore array-contains-any has max 10 items
  isValidArrayContainsAny: (values: any[]): ValidationResult => {
    const errors: string[] = [];
    
    if (!Array.isArray(values)) {
      errors.push('Value must be an array');
    } else if (values.length > 10) {
      errors.push('Firestore array-contains-any supports maximum 10 items');
    } else if (values.length === 0) {
      errors.push('Array must contain at least one item');
    }

    return { valid: errors.length === 0, errors };
  },

  // Firestore "in" query has max 10 values
  isValidInQuery: (values: any[]): ValidationResult => {
    const errors: string[] = [];
    
    if (!Array.isArray(values)) {
      errors.push('Value must be an array');
    } else if (values.length > 10) {
      errors.push('Firestore "in" query supports maximum 10 values');
    } else if (values.length === 0) {
      errors.push('Array must contain at least one value');
    }

    return { valid: errors.length === 0, errors };
  },

  // Firestore has max 500 writes per batch
  isValidBatchSize: (size: number): ValidationResult => {
    const errors: string[] = [];
    
    if (typeof size !== 'number' || size <= 0) {
      errors.push('Batch size must be a positive number');
    } else if (size > 500) {
      errors.push('Firestore batch operations support maximum 500 writes');
    }

    return { valid: errors.length === 0, errors };
  },

  // Document path validation
  isValidDocumentPath: (path: string): ValidationResult => {
    const errors: string[] = [];
    
    if (!path || typeof path !== 'string') {
      errors.push('Document path is required');
    } else {
      const segments = path.split('/');
      
      // Must have even number of segments (collection/doc/collection/doc...)
      if (segments.length % 2 !== 0) {
        errors.push('Document path must have even number of segments');
      }
      
      // Each segment must be non-empty
      if (segments.some(segment => segment.trim().length === 0)) {
        errors.push('Document path segments cannot be empty');
      }
      
      // Path length limit
      if (path.length > 6144) {
        errors.push('Document path must not exceed 6144 bytes');
      }
    }

    return { valid: errors.length === 0, errors };
  }
};
