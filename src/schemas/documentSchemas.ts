/**
 * Document Management Form Validation Schemas
 * Zod schemas for documents, uploads, versions, approvals
 */

import { z } from 'zod';

/**
 * Document Type Enum
 */
export const DocumentType = z.enum([
  'contract',
  'invoice',
  'receipt',
  'drawing',
  'specification',
  'report',
  'presentation',
  'spreadsheet',
  'image',
  'video',
  'other',
]);

/**
 * Document Status Enum
 */
export const DocumentStatus = z.enum([
  'draft',
  'pending-review',
  'approved',
  'rejected',
  'archived',
]);

/**
 * Access Level Enum
 */
export const AccessLevel = z.enum(['public', 'internal', 'confidential', 'restricted']);

/**
 * File size limits (in bytes)
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

/**
 * Allowed MIME types
 */
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

/**
 * Document Upload Schema
 */
export const documentUploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, 'File is required')
    .refine((file) => {
      // Check file size
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return file.size <= MAX_IMAGE_SIZE;
      }
      if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return file.size <= MAX_VIDEO_SIZE;
      }
      return file.size <= MAX_FILE_SIZE;
    }, 'File size exceeds maximum allowed limit')
    .refine((file) => {
      const allowedTypes = [
        ...ALLOWED_DOCUMENT_TYPES,
        ...ALLOWED_IMAGE_TYPES,
        ...ALLOWED_VIDEO_TYPES,
      ];
      return allowedTypes.includes(file.type);
    }, 'File type not allowed. Please upload PDF, Word, Excel, PowerPoint, images, or videos.'),

  title: z
    .string()
    .min(3, 'Document title must be at least 3 characters')
    .max(200, 'Document title is too long')
    .trim(),

  description: z.string().max(2000, 'Description is too long (max 2000 characters)').optional(),

  type: DocumentType.default('other'),

  projectId: z.string().min(1, 'Project ID is required'),

  category: z.string().max(100, 'Category is too long').optional(),

  tags: z.array(z.string().trim()).max(20, 'Maximum 20 tags allowed').optional(),

  accessLevel: AccessLevel.default('internal'),

  expiryDate: z.coerce.date().optional(),

  requiresApproval: z.boolean().default(false),
});

export type DocumentUploadData = z.infer<typeof documentUploadSchema>;

/**
 * Document Metadata Update Schema
 */
export const documentUpdateSchema = z.object({
  title: z
    .string()
    .min(3, 'Document title must be at least 3 characters')
    .max(200, 'Document title is too long')
    .trim()
    .optional(),

  description: z.string().max(2000, 'Description is too long').optional(),

  type: DocumentType.optional(),

  category: z.string().max(100).optional(),

  tags: z.array(z.string().trim()).max(20).optional(),

  accessLevel: AccessLevel.optional(),

  status: DocumentStatus.optional(),

  expiryDate: z.coerce.date().optional(),
});

export type DocumentUpdateData = z.infer<typeof documentUpdateSchema>;

/**
 * Document Approval Schema
 */
export const documentApprovalSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),

  approved: z.boolean(),

  comments: z
    .string()
    .min(10, 'Please provide detailed feedback (at least 10 characters)')
    .max(2000, 'Comments are too long')
    .trim(),

  signature: z.string().optional(),

  approvalDate: z.coerce.date().default(new Date()),
});

export type DocumentApprovalData = z.infer<typeof documentApprovalSchema>;

/**
 * Document Share Schema
 */
export const documentShareSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),

  recipientEmails: z
    .array(z.string().email('Please enter valid email addresses'))
    .min(1, 'At least one recipient is required')
    .max(50, 'Maximum 50 recipients allowed'),

  message: z.string().max(1000, 'Message is too long').optional(),

  expiryDate: z.coerce.date().optional(),

  allowDownload: z.boolean().default(true),

  notifyByEmail: z.boolean().default(true),
});

export type DocumentShareData = z.infer<typeof documentShareSchema>;

/**
 * Document Filter Schema
 */
export const documentFilterSchema = z.object({
  type: z.array(DocumentType).optional(),

  status: z.array(DocumentStatus).optional(),

  projectId: z.string().optional(),

  uploadedBy: z.string().optional(),

  search: z.string().max(200).optional(),

  uploadedFrom: z.coerce.date().optional(),

  uploadedTo: z.coerce.date().optional(),

  tags: z.array(z.string()).optional(),

  accessLevel: z.array(AccessLevel).optional(),

  onlyExpiringSoon: z.boolean().optional(),
});

export type DocumentFilterData = z.infer<typeof documentFilterSchema>;

/**
 * Bulk Document Action Schema
 */
export const bulkDocumentActionSchema = z.object({
  documentIds: z.array(z.string()).min(1, 'At least one document must be selected'),

  action: z.enum(['move', 'delete', 'archive', 'change-access', 'add-tags']),

  params: z.record(z.string(), z.unknown()).optional(),
});

export type BulkDocumentActionData = z.infer<typeof bulkDocumentActionSchema>;

/**
 * Document Version Comment Schema
 */
export const documentVersionCommentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),

  versionNumber: z.number().int().positive(),

  comment: z
    .string()
    .min(5, 'Comment must be at least 5 characters')
    .max(1000, 'Comment is too long')
    .trim(),
});

export type DocumentVersionCommentData = z.infer<typeof documentVersionCommentSchema>;

/**
 * OCR Request Schema
 */
export const ocrRequestSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),

  language: z.enum(['eng', 'ind', 'auto']).default('auto'),

  extractTables: z.boolean().default(false),

  extractImages: z.boolean().default(false),
});

export type OCRRequestData = z.infer<typeof ocrRequestSchema>;

/**
 * Digital Signature Schema
 */
export const digitalSignatureSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),

  signatureData: z.string().min(100, 'Invalid signature data'),

  certificateId: z.string().optional(),

  reason: z.string().max(200, 'Reason is too long').optional(),

  location: z.string().max(100, 'Location is too long').optional(),
});

export type DigitalSignatureData = z.infer<typeof digitalSignatureSchema>;

/**
 * Validate uploaded file
 * Comprehensive file validation with security checks
 */
export function validateUploadedFile(file: File): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file exists
  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors, warnings };
  }

  // Check file name
  if (file.name.length > 255) {
    errors.push('File name is too long (max 255 characters)');
  }

  // Check for dangerous characters in filename
  const dangerousChars = /[<>:"|?*\x00-\x1f]/g;
  if (dangerousChars.test(file.name)) {
    errors.push('File name contains invalid characters');
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js', 'jar'];
  if (extension && dangerousExtensions.includes(extension)) {
    errors.push('File type not allowed for security reasons');
  }

  // Check MIME type
  const allowedMimeTypes = [
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_VIDEO_TYPES,
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed`);
  }

  // Check file size
  let maxSize = MAX_FILE_SIZE;
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    maxSize = MAX_IMAGE_SIZE;
  } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    maxSize = MAX_VIDEO_SIZE;
  }

  if (file.size > maxSize) {
    errors.push(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${(maxSize / 1024 / 1024).toFixed(0)}MB)`
    );
  }

  // Warnings for large files
  if (file.size > 50 * 1024 * 1024) {
    warnings.push('Large file size may result in slow upload');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get file type category
 */
export function getFileCategory(mimeType: string): 'document' | 'image' | 'video' | 'unknown' {
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  return 'unknown';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
