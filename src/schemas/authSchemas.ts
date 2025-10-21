/**
 * Authentication Form Validation Schemas
 * Comprehensive Zod schemas for login, registration, password reset, 2FA
 */

import { z } from 'zod';

/**
 * Password Validation Rules
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password is too long (max 128 characters)')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*...)');

/**
 * Email Validation
 * Standard email format with additional checks
 */
const emailSchema = z
  .string()
  .min(5, 'Email is too short')
  .max(100, 'Email is too long')
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

/**
 * Login Form Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration Form Schema
 */
export const registrationSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
      .trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Password Reset Request Schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password Reset Confirm Schema
 */
export const passwordResetConfirmSchema = z
  .object({
    resetToken: z.string().min(20, 'Invalid reset token').max(500, 'Invalid reset token'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Change Password Schema (for logged-in users)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Password is too long'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

/**
 * 2FA Setup Schema
 */
export const twoFactorSetupSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required for 2FA setup')
    .max(128, 'Password is too long'),
  backupEmail: emailSchema.optional(),
});

export type TwoFactorSetupData = z.infer<typeof twoFactorSetupSchema>;

/**
 * 2FA Verification Schema
 */
export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .length(6, '2FA code must be exactly 6 digits')
    .regex(/^\d{6}$/, '2FA code must contain only numbers'),
  trustDevice: z.boolean().optional().default(false),
});

export type TwoFactorVerifyData = z.infer<typeof twoFactorVerifySchema>;

/**
 * 2FA Disable Schema
 */
export const twoFactorDisableSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required to disable 2FA')
    .max(128, 'Password is too long'),
  code: z
    .string()
    .length(6, '2FA code must be exactly 6 digits')
    .regex(/^\d{6}$/, '2FA code must contain only numbers'),
});

export type TwoFactorDisableData = z.infer<typeof twoFactorDisableSchema>;

/**
 * Profile Update Schema
 */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  email: emailSchema,
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (E.164 format)')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'Bio is too long (max 500 characters)').optional(),
  avatarUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

/**
 * Email Verification Schema
 */
export const emailVerificationSchema = z.object({
  code: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;

/**
 * Helper function to validate and parse data
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors for easier display
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return { success: false, errors };
}

/**
 * Password strength calculator
 * Returns: 'weak' | 'medium' | 'strong' | 'very-strong'
 */
export function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 12) score += 25;
  else feedback.push('Use at least 12 characters');

  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Complexity checks
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else feedback.push('Add special characters (!@#$%^&*...)');

  // Bonus for variety
  const uniqueChars = new Set(password).size;
  if (uniqueChars > 10) score += 10;

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 50) {
    strength = 'weak';
  } else if (score < 75) {
    strength = 'medium';
  } else if (score < 90) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return { strength, score, feedback };
}

/**
 * Common password blacklist (top 100 most common passwords)
 * In production, this should be loaded from a larger database
 */
const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'monkey',
  '1234567',
  'letmein',
  'trustno1',
  'dragon',
  'baseball',
  'iloveyou',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'passw0rd',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'Football',
  'password1',
  '!@#$%^&*',
  'password123',
  'welcome',
  'admin',
  'adminpassword',
  'root',
  'toor',
  'pass',
  'test',
  'guest',
  '123456789',
  '12345',
  '1234',
  '123',
  'Password1',
  'Password123',
]);

/**
 * Check if password is in common passwords blacklist
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

/**
 * Validate password with all checks
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
  strength: ReturnType<typeof calculatePasswordStrength>;
} {
  const errors: string[] = [];

  // Check against schema
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    result.error.issues.forEach((err) => {
      errors.push(err.message);
    });
  }

  // Check common passwords
  if (isCommonPassword(password)) {
    errors.push('This password is too common and easily guessed');
  }

  // Calculate strength
  const strength = calculatePasswordStrength(password);

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}
