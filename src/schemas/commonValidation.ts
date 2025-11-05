/**
 * Common Validation Schemas
 * 
 * Reusable Zod validation schemas for common field types.
 * Used across the application for consistent validation.
 */

import { z } from 'zod';

// ============================================
// BASIC FIELD VALIDATIONS
// ============================================

/**
 * Email validation
 * - Required
 * - Must be valid email format
 * - Case insensitive
 */
export const emailSchema = z
  .string()
  .min(1, 'Email wajib diisi')
  .email('Format email tidak valid')
  .toLowerCase()
  .trim();

/**
 * Password validation
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka')
  .regex(/[^A-Za-z0-9]/, 'Password harus mengandung minimal 1 karakter khusus');

/**
 * Weak password validation (for less critical forms)
 * - Minimum 6 characters
 */
export const weakPasswordSchema = z
  .string()
  .min(6, 'Password minimal 6 karakter');

/**
 * Phone number validation (Indonesian format)
 * - Starts with 0 or +62
 * - 10-15 digits
 */
export const phoneSchema = z
  .string()
  .min(1, 'Nomor telepon wajib diisi')
  .regex(
    /^(\+62|62|0)[0-9]{9,14}$/,
    'Format nomor telepon tidak valid (contoh: 08123456789 atau +628123456789)'
  );

/**
 * Optional phone number
 */
export const optionalPhoneSchema = z
  .string()
  .regex(
    /^(\+62|62|0)[0-9]{9,14}$/,
    'Format nomor telepon tidak valid (contoh: 08123456789 atau +628123456789)'
  )
  .optional()
  .or(z.literal(''));

/**
 * Name validation
 * - 2-100 characters
 * - Letters, spaces, hyphens, apostrophes only
 */
export const nameSchema = z
  .string()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter')
  .regex(/^[a-zA-Z\s'-]+$/, 'Nama hanya boleh mengandung huruf, spasi, tanda hubung, dan apostrof')
  .trim();

/**
 * Username validation
 * - 3-30 characters
 * - Alphanumeric, underscore, hyphen only
 * - Must start with letter
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username minimal 3 karakter')
  .max(30, 'Username maksimal 30 karakter')
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Username harus dimulai dengan huruf dan hanya boleh mengandung huruf, angka, underscore, dan tanda hubung')
  .toLowerCase()
  .trim();

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Format URL tidak valid')
  .trim();

/**
 * Optional URL validation
 */
export const optionalUrlSchema = z
  .string()
  .url('Format URL tidak valid')
  .optional()
  .or(z.literal(''));

// ============================================
// NUMERIC VALIDATIONS
// ============================================

/**
 * Positive number validation
 */
export const positiveNumberSchema = z
  .number({
    message: 'Harus berupa angka',
  })
  .positive('Angka harus lebih besar dari 0');

/**
 * Non-negative number validation (>= 0)
 */
export const nonNegativeNumberSchema = z
  .number({
    message: 'Harus berupa angka',
  })
  .nonnegative('Angka tidak boleh negatif');

/**
 * Currency/Money validation
 * - Positive number
 * - Max 2 decimal places
 */
export const currencySchema = z
  .number({
    message: 'Harus berupa angka',
  })
  .positive('Nominal harus lebih besar dari 0')
  .refine(
    (val) => Number(val.toFixed(2)) === val,
    'Maksimal 2 angka di belakang koma'
  );

/**
 * Percentage validation (0-100)
 */
export const percentageSchema = z
  .number({
    message: 'Harus berupa angka',
  })
  .min(0, 'Persentase minimal 0%')
  .max(100, 'Persentase maksimal 100%');

/**
 * Integer validation
 */
export const integerSchema = z
  .number({
    message: 'Harus berupa angka',
  })
  .int('Harus berupa bilangan bulat');

// ============================================
// DATE VALIDATIONS
// ============================================

/**
 * Date validation
 */
export const dateSchema = z
  .date({
    message: 'Format tanggal tidak valid',
  });

/**
 * Date string validation (ISO format)
 */
export const dateStringSchema = z
  .string()
  .min(1, 'Tanggal wajib diisi')
  .refine(
    (val) => !isNaN(Date.parse(val)),
    'Format tanggal tidak valid'
  );

/**
 * Future date validation
 */
export const futureDateSchema = z
  .date({
    message: 'Format tanggal tidak valid',
  })
  .refine(
    (date) => date > new Date(),
    'Tanggal harus di masa depan'
  );

/**
 * Past date validation
 */
export const pastDateSchema = z
  .date({
    message: 'Format tanggal tidak valid',
  })
  .refine(
    (date) => date < new Date(),
    'Tanggal harus di masa lalu'
  );

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'Tanggal akhir harus setelah atau sama dengan tanggal mulai',
    path: ['endDate'],
  }
);

// ============================================
// TEXT FIELD VALIDATIONS
// ============================================

/**
 * Required text field
 */
export const requiredTextSchema = z
  .string()
  .min(1, 'Field ini wajib diisi')
  .trim();

/**
 * Optional text field
 */
export const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Short text field (max 100 chars)
 */
export const shortTextSchema = z
  .string()
  .min(1, 'Field ini wajib diisi')
  .max(100, 'Maksimal 100 karakter')
  .trim();

/**
 * Long text field (max 1000 chars)
 */
export const longTextSchema = z
  .string()
  .min(1, 'Field ini wajib diisi')
  .max(1000, 'Maksimal 1000 karakter')
  .trim();

/**
 * Description field (max 500 chars)
 */
export const descriptionSchema = z
  .string()
  .min(1, 'Deskripsi wajib diisi')
  .max(500, 'Deskripsi maksimal 500 karakter')
  .trim();

/**
 * Optional description field
 */
export const optionalDescriptionSchema = z
  .string()
  .max(500, 'Deskripsi maksimal 500 karakter')
  .trim()
  .optional()
  .or(z.literal(''));

// ============================================
// FILE VALIDATIONS
// ============================================

/**
 * File validation
 * - Max 10MB
 */
export const fileSchema = z
  .instanceof(File, { message: 'File wajib diupload' })
  .refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'Ukuran file maksimal 10MB'
  );

/**
 * Image file validation
 * - Max 5MB
 * - Allowed types: jpg, jpeg, png, gif, webp
 */
export const imageFileSchema = z
  .instanceof(File, { message: 'File gambar wajib diupload' })
  .refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'Ukuran gambar maksimal 5MB'
  )
  .refine(
    (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
    'Format file harus JPG, PNG, GIF, atau WebP'
  );

/**
 * Document file validation
 * - Max 10MB
 * - Allowed types: pdf, doc, docx, xls, xlsx
 */
export const documentFileSchema = z
  .instanceof(File, { message: 'File dokumen wajib diupload' })
  .refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'Ukuran dokumen maksimal 10MB'
  )
  .refine(
    (file) => [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(file.type),
    'Format file harus PDF, DOC, DOCX, XLS, atau XLSX'
  );

// ============================================
// SELECTION VALIDATIONS
// ============================================

/**
 * Required select/dropdown
 */
export const requiredSelectSchema = z
  .string()
  .min(1, 'Pilih salah satu opsi');

/**
 * Optional select/dropdown
 */
export const optionalSelectSchema = z
  .string()
  .optional();

/**
 * Multi-select validation (at least 1 item)
 */
export const multiSelectSchema = z
  .array(z.string())
  .min(1, 'Pilih minimal 1 opsi');

/**
 * Optional multi-select
 */
export const optionalMultiSelectSchema = z
  .array(z.string())
  .optional();

// ============================================
// BOOLEAN VALIDATIONS
// ============================================

/**
 * Required checkbox (must be true)
 */
export const requiredCheckboxSchema = z
  .boolean()
  .refine((val) => val === true, 'Anda harus menyetujui untuk melanjutkan');

/**
 * Optional checkbox
 */
export const optionalCheckboxSchema = z
  .boolean()
  .optional();

// ============================================
// INDONESIAN-SPECIFIC VALIDATIONS
// ============================================

/**
 * NIK (Nomor Induk Kependudukan) validation
 * - 16 digits
 */
export const nikSchema = z
  .string()
  .min(1, 'NIK wajib diisi')
  .regex(/^[0-9]{16}$/, 'NIK harus 16 digit angka');

/**
 * NPWP validation
 * - Format: XX.XXX.XXX.X-XXX.XXX or 15 digits
 */
export const npwpSchema = z
  .string()
  .min(1, 'NPWP wajib diisi')
  .regex(
    /^[0-9]{2}\.[0-9]{3}\.[0-9]{3}\.[0-9]-[0-9]{3}\.[0-9]{3}$|^[0-9]{15}$/,
    'Format NPWP tidak valid (contoh: 01.234.567.8-901.234 atau 012345678901234)'
  );

/**
 * Indonesian postal code validation
 * - 5 digits
 */
export const postalCodeSchema = z
  .string()
  .min(1, 'Kode pos wajib diisi')
  .regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit angka');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create custom min length validation
 */
export const minLengthSchema = (min: number, fieldName = 'Field') =>
  z.string().min(min, `${fieldName} minimal ${min} karakter`).trim();

/**
 * Create custom max length validation
 */
export const maxLengthSchema = (max: number, fieldName = 'Field') =>
  z.string().max(max, `${fieldName} maksimal ${max} karakter`).trim();

/**
 * Create custom length range validation
 */
export const lengthRangeSchema = (min: number, max: number, fieldName = 'Field') =>
  z
    .string()
    .min(min, `${fieldName} minimal ${min} karakter`)
    .max(max, `${fieldName} maksimal ${max} karakter`)
    .trim();

/**
 * Create custom regex validation
 */
export const customRegexSchema = (pattern: RegExp, errorMessage: string) =>
  z.string().regex(pattern, errorMessage);

/**
 * Create conditional required field
 */
export const conditionalRequiredSchema = (condition: boolean) =>
  condition
    ? z.string().min(1, 'Field ini wajib diisi').trim()
    : z.string().optional();
