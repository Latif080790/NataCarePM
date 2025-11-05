/**
 * Unit Tests for Authentication Schemas
 * Tests validation rules for login, registration, password reset
 */

import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registrationSchema,
  passwordResetRequestSchema,
  type LoginFormData,
  type RegistrationFormData,
  type PasswordResetRequestData,
} from '@/schemas/authSchemas';

describe('authSchemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData: LoginFormData = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
        rememberMe: false,
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('ValidPassword123!');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'ValidPassword123!',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject email with leading/trailing whitespace', () => {
      const data = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'ValidPassword123!',
      };

      const result = loginSchema.safeParse(data);
      // Email schema requires valid format without whitespace
      expect(result.success).toBe(false);
    });

    it('should set default rememberMe to false', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPassword123!',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(false);
      }
    });
  });

  describe('registrationSchema', () => {
    it('should validate correct registration data', () => {
      const validData: RegistrationFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!@#',
        confirmPassword: 'SecurePass123!@#',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 12 characters', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Short1!',
        confirmPassword: 'Short1!',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError).toBeDefined();
      }
    });

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'lowercase123!@#',
        confirmPassword: 'lowercase123!@#',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('uppercase');
      }
    });

    it('should reject password without number', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'NoNumbers!@#$',
        confirmPassword: 'NoNumbers!@#$',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('number');
      }
    });

    it('should reject password without special character', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'NoSpecialChar123',
        confirmPassword: 'NoSpecialChar123',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError?.message).toContain('special character');
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!@#',
        confirmPassword: 'DifferentPass123!@#',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
        expect(confirmError?.message).toContain('match');
      }
    });

    it('should reject if terms not agreed', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!@#',
        confirmPassword: 'SecurePass123!@#',
        agreeToTerms: false,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const termsError = result.error.issues.find((i) => i.path.includes('agreeToTerms'));
        expect(termsError).toBeDefined();
      }
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'SecurePass123!@#',
        confirmPassword: 'SecurePass123!@#',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((i) => i.path.includes('name'));
        expect(nameError?.message).toContain('at least 2 characters');
      }
    });

    it('should trim whitespace from name', () => {
      const data = {
        name: '  John Doe  ',
        email: 'john@example.com',
        password: 'SecurePass123!@#',
        confirmPassword: 'SecurePass123!@#',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });
  });

  describe('passwordResetRequestSchema', () => {
    it('should validate correct email', () => {
      const validData: PasswordResetRequestData = {
        email: 'user@example.com',
      };

      const result = passwordResetRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
      };

      const result = passwordResetRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
      };

      const result = passwordResetRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject email with leading/trailing whitespace', () => {
      const data = {
        email: '  user@example.com  ',
      };

      const result = passwordResetRequestSchema.safeParse(data);
      // Email schema requires valid format without whitespace
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject extremely long email', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const data = {
        email: longEmail,
        password: 'ValidPass123!',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject extremely long password', () => {
      const longPassword = 'A'.repeat(200) + '1!';
      const data = {
        email: 'test@example.com',
        password: longPassword,
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should handle ascii characters in name', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecureP@ss123',
        confirmPassword: 'SecureP@ss123',
        agreeToTerms: true,
      };

      const result = registrationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });
  });
});
