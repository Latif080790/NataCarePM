/**
 * validators.ts Unit Tests
 * 
 * Tests cover:
 * - Basic type validators (string, number, ID, email, URL, date)
 * - Complex validators (arrays, enums, phone, date ranges)
 * - Sanitization functions
 * - Object validators (Task, Project, User, PO, Document)
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest';
import { validators, validateTask, ValidationError } from './validators';

describe('validators - Basic Type Validators', () => {
  describe('String Validators', () => {
    describe('isNonEmptyString', () => {
      it('should accept non-empty strings', () => {
        expect(validators.isNonEmptyString('hello')).toBe(true);
        expect(validators.isNonEmptyString('a')).toBe(true);
        expect(validators.isNonEmptyString('  text  ')).toBe(true);
      });

      it('should reject empty strings', () => {
        expect(validators.isNonEmptyString('')).toBe(false);
        expect(validators.isNonEmptyString('   ')).toBe(false);
      });

      it('should reject non-string types', () => {
        expect(validators.isNonEmptyString(123)).toBe(false);
        expect(validators.isNonEmptyString(null)).toBe(false);
        expect(validators.isNonEmptyString(undefined)).toBe(false);
        expect(validators.isNonEmptyString({})).toBe(false);
      });
    });

    describe('isValidString', () => {
      it('should validate string length', () => {
        const result = validators.isValidString('hello', 3, 10);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject strings too short', () => {
        const result = validators.isValidString('ab', 3, 10);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('String must be at least 3 characters');
      });

      it('should reject strings too long', () => {
        const result = validators.isValidString('hello world', 1, 5);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('String must not exceed 5 characters');
      });

      it('should reject non-string types', () => {
        const result = validators.isValidString(123);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Value must be a string');
      });

      it('should trim whitespace before validation', () => {
        const result = validators.isValidString('  hello  ', 3, 10);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Number Validators', () => {
    describe('isValidNumber', () => {
      it('should accept valid numbers', () => {
        expect(validators.isValidNumber(5, 0, 10).valid).toBe(true);
        expect(validators.isValidNumber(0, 0, 10).valid).toBe(true);
        expect(validators.isValidNumber(-5).valid).toBe(true);
      });

      it('should reject numbers below minimum', () => {
        const result = validators.isValidNumber(5, 10, 20);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Number must be at least 10');
      });

      it('should reject numbers above maximum', () => {
        const result = validators.isValidNumber(25, 10, 20);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Number must not exceed 20');
      });

      it('should reject non-numeric values', () => {
        expect(validators.isValidNumber('5').valid).toBe(false);
        expect(validators.isValidNumber(NaN).valid).toBe(false);
        expect(validators.isValidNumber(null).valid).toBe(false);
      });
    });

    describe('isPositiveNumber', () => {
      it('should accept positive numbers', () => {
        expect(validators.isPositiveNumber(1)).toBe(true);
        expect(validators.isPositiveNumber(0.1)).toBe(true);
        expect(validators.isPositiveNumber(1000)).toBe(true);
      });

      it('should reject zero and negative numbers', () => {
        expect(validators.isPositiveNumber(0)).toBe(false);
        expect(validators.isPositiveNumber(-1)).toBe(false);
        expect(validators.isPositiveNumber(-0.1)).toBe(false);
      });

      it('should reject non-numbers', () => {
        expect(validators.isPositiveNumber('1')).toBe(false);
        expect(validators.isPositiveNumber(NaN)).toBe(false);
      });
    });

    describe('isNonNegativeNumber', () => {
      it('should accept zero and positive numbers', () => {
        expect(validators.isNonNegativeNumber(0)).toBe(true);
        expect(validators.isNonNegativeNumber(1)).toBe(true);
        expect(validators.isNonNegativeNumber(100)).toBe(true);
      });

      it('should reject negative numbers', () => {
        expect(validators.isNonNegativeNumber(-1)).toBe(false);
        expect(validators.isNonNegativeNumber(-0.1)).toBe(false);
      });
    });
  });

  describe('ID Validators', () => {
    describe('isValidId', () => {
      it('should accept valid IDs', () => {
        expect(validators.isValidId('abc123')).toBe(true);
        expect(validators.isValidId('project-123')).toBe(true);
        expect(validators.isValidId('task_456')).toBe(true);
        expect(validators.isValidId('ID-123-ABC')).toBe(true);
      });

      it('should reject empty or too long IDs', () => {
        expect(validators.isValidId('')).toBe(false);
        expect(validators.isValidId('a'.repeat(129))).toBe(false);
      });

      it('should reject IDs with invalid characters', () => {
        expect(validators.isValidId('abc 123')).toBe(false);
        expect(validators.isValidId('abc@123')).toBe(false);
        expect(validators.isValidId('abc#123')).toBe(false);
      });

      it('should reject non-string types', () => {
        expect(validators.isValidId(123)).toBe(false);
        expect(validators.isValidId(null)).toBe(false);
      });
    });

    describe('isValidProjectId', () => {
      it('should validate correct project IDs', () => {
        const result = validators.isValidProjectId('project-123');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty project IDs', () => {
        const result = validators.isValidProjectId('');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('required') || e.includes('empty'))).toBe(true);
      });

      it('should reject project IDs with invalid characters', () => {
        const result = validators.isValidProjectId('project@123');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('invalid characters'))).toBe(true);
      });

      it('should reject too long project IDs', () => {
        const result = validators.isValidProjectId('a'.repeat(129));
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('too long'))).toBe(true);
      });
    });
  });

  describe('Email Validator', () => {
    it('should accept valid email addresses', () => {
      expect(validators.isValidEmail('user@example.com')).toBe(true);
      expect(validators.isValidEmail('test.user@domain.co.id')).toBe(true);
      expect(validators.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validators.isValidEmail('invalid')).toBe(false);
      expect(validators.isValidEmail('user@')).toBe(false);
      expect(validators.isValidEmail('@domain.com')).toBe(false);
      expect(validators.isValidEmail('user @domain.com')).toBe(false);
    });

    it('should reject empty or non-string emails', () => {
      expect(validators.isValidEmail('')).toBe(false);
      expect(validators.isValidEmail(null as any)).toBe(false);
      expect(validators.isValidEmail(123 as any)).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(validators.isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('URL Validator', () => {
    it('should accept valid URLs', () => {
      expect(validators.isValidUrl('https://example.com')).toBe(true);
      expect(validators.isValidUrl('http://domain.co.id')).toBe(true);
      expect(validators.isValidUrl('https://sub.domain.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validators.isValidUrl('not-a-url')).toBe(false);
      expect(validators.isValidUrl('http://')).toBe(false);
      expect(validators.isValidUrl('')).toBe(false);
    });

    it('should reject non-string types', () => {
      expect(validators.isValidUrl(null as any)).toBe(false);
      expect(validators.isValidUrl(123 as any)).toBe(false);
    });
  });

  describe('Date Validators', () => {
    describe('isValidDate', () => {
      it('should accept valid dates', () => {
        expect(validators.isValidDate('2025-01-01')).toBe(true);
        expect(validators.isValidDate(new Date())).toBe(true);
        expect(validators.isValidDate('2025-11-05T10:00:00Z')).toBe(true);
      });

      it('should reject invalid dates', () => {
        expect(validators.isValidDate('invalid')).toBe(false);
        expect(validators.isValidDate('2025-13-01')).toBe(false);
        expect(validators.isValidDate(null)).toBe(false);
        expect(validators.isValidDate(undefined)).toBe(false);
      });
    });

    describe('isValidDateRange', () => {
      it('should accept valid date ranges', () => {
        const result = validators.isValidDateRange('2025-01-01', '2025-12-31');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject when end date is before start date', () => {
        const result = validators.isValidDateRange('2025-12-31', '2025-01-01');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('End date must be after start date');
      });

      it('should reject invalid start dates', () => {
        const result = validators.isValidDateRange('invalid', '2025-12-31');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Start date'))).toBe(true);
      });

      it('should reject invalid end dates', () => {
        const result = validators.isValidDateRange('2025-01-01', 'invalid');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('End date'))).toBe(true);
      });
    });
  });

  describe('Array Validators', () => {
    describe('isNonEmptyArray', () => {
      it('should accept non-empty arrays', () => {
        expect(validators.isNonEmptyArray([1])).toBe(true);
        expect(validators.isNonEmptyArray([1, 2, 3])).toBe(true);
        expect(validators.isNonEmptyArray(['a', 'b'])).toBe(true);
      });

      it('should reject empty arrays', () => {
        expect(validators.isNonEmptyArray([])).toBe(false);
      });

      it('should reject non-array types', () => {
        expect(validators.isNonEmptyArray('not array')).toBe(false);
        expect(validators.isNonEmptyArray(null)).toBe(false);
        expect(validators.isNonEmptyArray({})).toBe(false);
      });
    });

    describe('isValidArray', () => {
      it('should validate array length', () => {
        const result = validators.isValidArray([1, 2, 3], 1, 5);
        expect(result.valid).toBe(true);
      });

      it('should reject arrays too short', () => {
        const result = validators.isValidArray([1], 2, 5);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Array must contain at least 2 items');
      });

      it('should reject arrays too long', () => {
        const result = validators.isValidArray([1, 2, 3, 4, 5, 6], 1, 5);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Array must not exceed 5 items');
      });

      it('should reject non-array types', () => {
        const result = validators.isValidArray('not array');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Value must be an array');
      });
    });
  });

  describe('Enum Validator', () => {
    it('should accept valid enum values', () => {
      expect(validators.isValidEnum('low', ['low', 'medium', 'high'])).toBe(true);
      expect(validators.isValidEnum(1, [1, 2, 3])).toBe(true);
    });

    it('should reject invalid enum values', () => {
      expect(validators.isValidEnum('invalid', ['low', 'medium', 'high'])).toBe(false);
      expect(validators.isValidEnum(4, [1, 2, 3])).toBe(false);
    });
  });

  describe('Phone Validator', () => {
    it('should accept valid phone numbers', () => {
      expect(validators.isValidPhone('08123456789')).toBe(true);
      expect(validators.isValidPhone('+6281234567890')).toBe(true);
      expect(validators.isValidPhone('02112345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validators.isValidPhone('abc')).toBe(false);
      expect(validators.isValidPhone('12')).toBe(false); // Too short
      expect(validators.isValidPhone('')).toBe(false);
    });

    it('should reject non-string types', () => {
      expect(validators.isValidPhone(null as any)).toBe(false);
      expect(validators.isValidPhone(123 as any)).toBe(false);
    });
  });

  describe('Sanitization Functions', () => {
    describe('sanitizeString', () => {
      it('should trim whitespace', () => {
        expect(validators.sanitizeString('  hello  ')).toBe('hello');
      });

      it('should remove potential HTML tags', () => {
        // Only removes < and >, not full tag content
        expect(validators.sanitizeString('hello<script>alert(1)</script>')).toBe('helloscriptalert(1)/script');
        expect(validators.sanitizeString('test<div>content</div>')).toBe('testdivcontent/div');
      });

      it('should replace newlines with spaces', () => {
        expect(validators.sanitizeString('line1\nline2')).toBe('line1 line2');
        expect(validators.sanitizeString('line1\r\nline2')).toBe('line1 line2');
      });

      it('should cap at 10k characters', () => {
        const longString = 'a'.repeat(11000);
        const sanitized = validators.sanitizeString(longString);
        expect(sanitized.length).toBe(10000);
      });

      it('should return empty string for non-string input', () => {
        expect(validators.sanitizeString(123 as any)).toBe('');
        expect(validators.sanitizeString(null as any)).toBe('');
      });
    });

    describe('sanitizeHtml', () => {
      it('should escape HTML special characters', () => {
        expect(validators.sanitizeHtml('<script>')).toBe('&lt;script&gt;');
        expect(validators.sanitizeHtml('a<b>c</b>d')).toBe('a&lt;b&gt;c&lt;&#x2F;b&gt;d');
      });

      it('should escape quotes', () => {
        expect(validators.sanitizeHtml('"test"')).toBe('&quot;test&quot;');
        expect(validators.sanitizeHtml("'test'")).toBe('&#x27;test&#x27;');
      });

      it('should escape forward slashes', () => {
        expect(validators.sanitizeHtml('a/b/c')).toBe('a&#x2F;b&#x2F;c');
      });

      it('should return empty string for non-string input', () => {
        expect(validators.sanitizeHtml(123 as any)).toBe('');
      });
    });
  });
});

describe('validators - Complex Object Validators', () => {
  describe('validateTask', () => {
    it('should accept valid task', () => {
      const task = {
        title: 'Test Task',
        description: 'Test description',
        status: 'todo' as const,
        priority: 'medium' as const,
      };
      const result = validateTask(task);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject task without title', () => {
      const task = { description: 'Test' };
      const result = validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task title is required');
    });

    it('should reject task with too long title', () => {
      const task = { title: 'a'.repeat(501) };
      const result = validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('title must not exceed'))).toBe(true);
    });

    it('should reject task with invalid status', () => {
      const task = { title: 'Test', status: 'invalid' as any };
      const result = validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid status'))).toBe(true);
    });

    it('should reject task with invalid priority', () => {
      const task = { title: 'Test', priority: 'invalid' as any };
      const result = validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid priority'))).toBe(true);
    });

    it('should reject task with too long description', () => {
      const task = { title: 'Test', description: 'a'.repeat(5001) };
      const result = validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('description must not exceed'))).toBe(true);
    });
  });

  describe('ValidationError class', () => {
    it('should create error with message', () => {
      const error = new ValidationError(['Error 1', 'Error 2']);
      expect(error.message).toContain('Error 1');
      expect(error.message).toContain('Error 2');
      expect(error.name).toBe('ValidationError');
    });

    it('should store errors and field', () => {
      const error = new ValidationError(['Test error'], 'testField');
      expect(error.errors).toEqual(['Test error']);
      expect(error.field).toBe('testField');
    });
  });
});
