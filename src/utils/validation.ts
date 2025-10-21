/**
 * Comprehensive Input Validation using Zod
 *
 * Provides schema-based validation for all forms and API inputs across the application.
 * Protects against injection attacks, malformed data, and ensures data integrity.
 *
 * Features:
 * - Type-safe validation with TypeScript inference
 * - Custom error messages in Indonesian
 * - Reusable schemas for common patterns
 * - Client-side and server-side validation support
 * - Protection against SQL injection, XSS, and malicious input
 *
 * @module utils/validation
 */

import { z } from 'zod';

// ============================================================================
// COMMON PATTERNS & REUSABLE SCHEMAS
// ============================================================================

/**
 * Email validation with RFC 5322 compliance
 */
export const emailSchema = z
  .string()
  .min(1, 'Email tidak boleh kosong')
  .email('Format email tidak valid')
  .max(254, 'Email terlalu panjang (maksimal 254 karakter)')
  .toLowerCase()
  .trim();

/**
 * Password validation with security requirements
 * - Minimum 12 characters
 * - At least one uppercase, lowercase, number, and special character
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password minimal 12 karakter')
  .max(128, 'Password terlalu panjang (maksimal 128 karakter)')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung angka')
  .regex(/[^A-Za-z0-9]/, 'Password harus mengandung karakter khusus');

/**
 * Name validation (person names, project names, etc.)
 */
export const nameSchema = z
  .string()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama terlalu panjang (maksimal 100 karakter)')
  .regex(
    /^[a-zA-Z0-9\s\-_'.]+$/,
    "Nama hanya boleh mengandung huruf, angka, spasi, dan karakter: - _ ' ."
  )
  .trim();

/**
 * Description/text field validation
 */
export const descriptionSchema = z
  .string()
  .max(2000, 'Deskripsi terlalu panjang (maksimal 2000 karakter)')
  .trim()
  .optional();

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Format URL tidak valid')
  .max(2048, 'URL terlalu panjang')
  .optional();

/**
 * UUID validation (for Firestore document IDs)
 */
export const uuidSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'ID tidak valid');

/**
 * Date validation (ISO 8601 format)
 */
export const dateSchema = z.string().datetime('Format tanggal tidak valid').or(z.date());

/**
 * Phone number validation (Indonesian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Format nomor telepon tidak valid')
  .optional();

/**
 * Positive number validation
 */
export const positiveNumberSchema = z
  .number()
  .positive('Angka harus lebih dari 0')
  .finite('Angka tidak valid');

/**
 * Non-negative number validation
 */
export const nonNegativeNumberSchema = z
  .number()
  .nonnegative('Angka tidak boleh negatif')
  .finite('Angka tidak valid');

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Login form validation
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password tidak boleh kosong'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration form validation
 */
export const registrationSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Password reset request validation
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset validation
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Token tidak valid'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/**
 * Password change validation (for authenticated users)
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama tidak boleh kosong'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Password baru tidak cocok',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Password baru harus berbeda dari password lama',
    path: ['newPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/**
 * Two-factor authentication code validation
 */
export const twoFactorCodeSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, 'Kode harus 6 digit angka'),
});

export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;

/**
 * Backup code validation
 */
export const backupCodeSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{8}$/, 'Backup code harus 8 karakter (huruf besar dan angka)'),
});

export type BackupCodeInput = z.infer<typeof backupCodeSchema>;

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

/**
 * Profile update validation
 */
export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  avatarUrl: urlSchema,
  bio: descriptionSchema,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Avatar upload validation
 */
export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Ukuran file maksimal 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Format file harus JPG, PNG, atau WebP'
    ),
});

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

/**
 * Project creation validation
 */
export const projectCreateSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    clientName: nameSchema.optional(),
    startDate: dateSchema,
    endDate: dateSchema,
    budget: nonNegativeNumberSchema.optional(),
    status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).default('planning'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai',
      path: ['endDate'],
    }
  );

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

/**
 * Project update validation
 */
export const projectUpdateSchema = projectCreateSchema.partial().extend({
  id: uuidSchema,
});

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

/**
 * Project filter validation
 */
export const projectFilterSchema = z.object({
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).optional(),
  search: z.string().max(100).optional(),
  clientName: z.string().max(100).optional(),
  startDateFrom: dateSchema.optional(),
  startDateTo: dateSchema.optional(),
});

export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;

// ============================================================================
// TASK SCHEMAS
// ============================================================================

/**
 * Task creation validation
 */
export const taskCreateSchema = z.object({
  projectId: uuidSchema,
  title: z
    .string()
    .min(3, 'Judul task minimal 3 karakter')
    .max(200, 'Judul task terlalu panjang (maksimal 200 karakter)')
    .trim(),
  description: descriptionSchema,
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['todo', 'in-progress', 'review', 'done', 'blocked']).default('todo'),
  assigneeId: uuidSchema.optional(),
  dueDate: dateSchema.optional(),
  estimatedHours: positiveNumberSchema.optional(),
  tags: z.array(z.string().max(50)).max(10, 'Maksimal 10 tags').optional(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

/**
 * Task update validation
 */
export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: uuidSchema,
});

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

/**
 * Task comment validation
 */
export const taskCommentSchema = z.object({
  taskId: uuidSchema,
  content: z
    .string()
    .min(1, 'Komentar tidak boleh kosong')
    .max(1000, 'Komentar terlalu panjang (maksimal 1000 karakter)')
    .trim(),
});

export type TaskCommentInput = z.infer<typeof taskCommentSchema>;

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

/**
 * Document upload validation
 */
export const documentUploadSchema = z.object({
  projectId: uuidSchema,
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, 'Ukuran file maksimal 50MB')
    .refine((file) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
      ];
      return allowedTypes.includes(file.type);
    }, 'Format file tidak didukung'),
  name: z
    .string()
    .min(1, 'Nama file tidak boleh kosong')
    .max(255, 'Nama file terlalu panjang')
    .regex(/^[a-zA-Z0-9\s\-_().]+$/, 'Nama file mengandung karakter tidak valid')
    .trim(),
  description: descriptionSchema,
  category: z.enum(['contract', 'invoice', 'report', 'design', 'other']).optional(),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

/**
 * Document metadata update validation
 */
export const documentUpdateSchema = z.object({
  id: uuidSchema,
  name: z.string().max(255).optional(),
  description: descriptionSchema,
  category: z.enum(['contract', 'invoice', 'report', 'design', 'other']).optional(),
});

export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;

// ============================================================================
// PURCHASE ORDER (PO) SCHEMAS
// ============================================================================

/**
 * PO item validation
 */
export const poItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Deskripsi item tidak boleh kosong')
    .max(500, 'Deskripsi item terlalu panjang'),
  quantity: positiveNumberSchema,
  unitPrice: nonNegativeNumberSchema,
  unit: z.string().max(50).default('pcs'),
  total: nonNegativeNumberSchema,
});

export type POItemInput = z.infer<typeof poItemSchema>;

/**
 * Purchase Order creation validation
 */
export const poCreateSchema = z
  .object({
    projectId: uuidSchema,
    poNumber: z
      .string()
      .min(1, 'Nomor PO tidak boleh kosong')
      .max(50, 'Nomor PO terlalu panjang')
      .regex(/^[A-Z0-9\-/]+$/, 'Format nomor PO tidak valid'),
    vendorName: nameSchema,
    vendorContact: z.string().max(200).optional(),
    issueDate: dateSchema,
    dueDate: dateSchema,
    items: z.array(poItemSchema).min(1, 'Minimal harus ada 1 item').max(100, 'Maksimal 100 items'),
    subtotal: nonNegativeNumberSchema,
    tax: nonNegativeNumberSchema.default(0),
    total: nonNegativeNumberSchema,
    notes: descriptionSchema,
    status: z.enum(['draft', 'pending', 'approved', 'rejected', 'completed']).default('draft'),
  })
  .refine(
    (data) => {
      const issue = new Date(data.issueDate);
      const due = new Date(data.dueDate);
      return due >= issue;
    },
    {
      message: 'Tanggal jatuh tempo harus setelah atau sama dengan tanggal terbit',
      path: ['dueDate'],
    }
  );

export type POCreateInput = z.infer<typeof poCreateSchema>;

/**
 * Purchase Order update validation
 */
export const poUpdateSchema = poCreateSchema.partial().extend({
  id: uuidSchema,
});

export type POUpdateInput = z.infer<typeof poUpdateSchema>;

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

/**
 * Global search validation
 */
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Kata kunci pencarian tidak boleh kosong')
    .max(100, 'Kata kunci terlalu panjang')
    .trim(),
  type: z.enum(['all', 'projects', 'tasks', 'documents', 'users']).default('all'),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type SearchInput = z.infer<typeof searchSchema>;

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Generic ID parameter validation
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

export type IdParamInput = z.infer<typeof idParamSchema>;

/**
 * Bulk delete validation
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(uuidSchema)
    .min(1, 'Minimal pilih 1 item untuk dihapus')
    .max(100, 'Maksimal 100 items per batch'),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

/**
 * File upload validation (generic)
 */
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'File tidak boleh kosong')
    .refine((file) => file.size <= 100 * 1024 * 1024, 'Ukuran file maksimal 100MB'),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate data against a Zod schema and return formatted errors
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag and data/errors
 *
 * @example
 * ```typescript
 * const result = validateData(loginSchema, { email: 'test@example.com', password: '123' });
 * if (!result.success) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format errors for easy consumption
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return { success: false, errors };
}

/**
 * Validate data and throw an error if validation fails
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const validData = validateOrThrow(loginSchema, formData);
 *   await login(validData);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     displayErrors(error.errors);
 *   }
 * }
 * ```
 */
export function validateOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = validateData(schema, data);

  if (!result.success) {
    throw new ValidationError('Validation failed', (result as any).errors);
  }

  return result.data;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  /**
   * Get the first error message for a field
   */
  getFieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }

  /**
   * Get all error messages as a flat array
   */
  getAllErrors(): string[] {
    return Object.values(this.errors).flat();
  }

  /**
   * Get all error messages as a formatted string
   */
  getFormattedErrors(): string {
    return this.getAllErrors().join(', ');
  }
}

/**
 * Sanitize string input to prevent XSS attacks
 * Note: This is a basic sanitization. Use DOMPurify for HTML content.
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent script injection
    .trim();
}

/**
 * Validate and sanitize form data
 *
 * @param schema - Zod schema to validate against
 * @param data - Form data to validate and sanitize
 * @returns Validated and sanitized data
 */
export function validateAndSanitize<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  // First validate with Zod
  const validated = validateOrThrow(schema, data);

  // Then sanitize string fields if it's an object
  if (typeof validated !== 'object' || validated === null) {
    return validated;
  }

  const sanitized = { ...validated } as any;
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    }
  });

  return sanitized as z.infer<T>;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Schemas
  emailSchema,
  passwordSchema,
  nameSchema,
  descriptionSchema,
  urlSchema,
  uuidSchema,
  dateSchema,
  phoneSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,

  // Auth schemas
  loginSchema,
  registrationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  passwordChangeSchema,
  twoFactorCodeSchema,
  backupCodeSchema,

  // Profile schemas
  profileUpdateSchema,
  avatarUploadSchema,

  // Project schemas
  projectCreateSchema,
  projectUpdateSchema,
  projectFilterSchema,

  // Task schemas
  taskCreateSchema,
  taskUpdateSchema,
  taskCommentSchema,

  // Document schemas
  documentUploadSchema,
  documentUpdateSchema,

  // PO schemas
  poCreateSchema,
  poUpdateSchema,
  poItemSchema,

  // Search schemas
  searchSchema,
  paginationSchema,

  // API schemas
  idParamSchema,
  bulkDeleteSchema,
  fileUploadSchema,

  // Helper functions
  validateData,
  validateOrThrow,
  validateAndSanitize,
  sanitizeString,

  // Error class
  ValidationError,
};
