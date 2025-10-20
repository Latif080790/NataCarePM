/**
 * 🛡️ FILE VALIDATION UTILITIES
 * Prevents malicious file uploads and validates file integrity
 */

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv'],
    
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/svg+xml': ['.svg'],
    
    // Archives
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
};

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
    '.vbs', '.js', '.jse', '.wsf', '.wsh', '.ps1',
    '.msi', '.app', '.deb', '.rpm', '.dmg',
    '.dll', '.sys', '.drv', '.ocx',
];

// Malicious filename patterns
const MALICIOUS_PATTERNS = [
    /\.\./,           // Directory traversal
    /[<>:"|?*]/,      // Invalid filename characters
    /^\./,            // Hidden files
    /\.\.$/,          // Ends with ..
    /\x00/,           // Null byte
    /[\x00-\x1F]/,    // Control characters
];

export interface FileValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

/**
 * Validate uploaded file
 */
export function validateFile(file: File): FileValidationResult {
    const warnings: string[] = [];
    
    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Ukuran file (${formatFileSize(file.size)}) melebihi batas maksimal (${formatFileSize(MAX_FILE_SIZE)})`
        };
    }
    
    if (file.size === 0) {
        return {
            valid: false,
            error: 'File kosong tidak diperbolehkan'
        };
    }
    
    // 2. Check filename length
    if (file.name.length > 255) {
        return {
            valid: false,
            error: 'Nama file terlalu panjang (maksimal 255 karakter)'
        };
    }
    
    // 3. Check for malicious filename patterns
    for (const pattern of MALICIOUS_PATTERNS) {
        if (pattern.test(file.name)) {
            return {
                valid: false,
                error: 'Nama file mengandung karakter yang tidak diperbolehkan'
            };
        }
    }
    
    // 4. Check file extension
    const extension = getFileExtension(file.name);
    if (!extension) {
        return {
            valid: false,
            error: 'File harus memiliki ekstensi'
        };
    }
    
    // 5. Block dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
        return {
            valid: false,
            error: `Tipe file ${extension} tidak diizinkan karena alasan keamanan`
        };
    }
    
    // 6. Validate MIME type
    const mimeValid = Object.keys(ALLOWED_MIME_TYPES).includes(file.type);
    if (!mimeValid) {
        return {
            valid: false,
            error: `Tipe file "${file.type}" tidak diizinkan`
        };
    }
    
    // 7. Check MIME type matches extension
    const allowedExtensions = ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES];
    if (allowedExtensions && !allowedExtensions.includes(extension.toLowerCase())) {
        return {
            valid: false,
            error: `Ekstensi file (${extension}) tidak sesuai dengan tipe file (${file.type})`
        };
    }
    
    // 8. Check for suspicious file names
    if (file.name.includes('..')) {
        warnings.push('Nama file mengandung ".." - telah dibersihkan');
    }
    
    // 9. Validate image dimensions (if image)
    if (file.type.startsWith('image/')) {
        // This would require reading the file, can be done with FileReader
        // For now, we just add a warning if file is very large
        if (file.size > 5 * 1024 * 1024) {
            warnings.push('Ukuran gambar sangat besar, pertimbangkan untuk mengompresnya');
        }
    }
    
    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): { valid: boolean; results: Map<string, FileValidationResult> } {
    const results = new Map<string, FileValidationResult>();
    let allValid = true;
    
    for (const file of files) {
        const result = validateFile(file);
        results.set(file.name, result);
        if (!result.valid) {
            allValid = false;
        }
    }
    
    return { valid: allValid, results };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? `.${match[1]}` : '';
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

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * Check if file is a document
 */
export function isDocumentFile(file: File): boolean {
    return file.type.startsWith('application/') || file.type === 'text/plain' || file.type === 'text/csv';
}

/**
 * Generate safe filename from original filename
 */
export function generateSafeFilename(originalFilename: string): string {
    const extension = getFileExtension(originalFilename);
    const nameWithoutExt = originalFilename.replace(extension, '');
    
    // Remove dangerous characters
    const safeName = nameWithoutExt
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 200); // Limit length
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now();
    
    return `${safeName}_${timestamp}${extension}`;
}

/**
 * Validate file before upload to Firebase Storage
 */
export async function validateFileForUpload(
    file: File,
    options?: {
        maxSize?: number;
        allowedTypes?: string[];
    }
): Promise<FileValidationResult> {
    const maxSize = options?.maxSize || MAX_FILE_SIZE;
    const allowedTypes = options?.allowedTypes || Object.keys(ALLOWED_MIME_TYPES);
    
    // Basic validation
    const basicValidation = validateFile(file);
    if (!basicValidation.valid) {
        return basicValidation;
    }
    
    // Additional size check
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File terlalu besar (${formatFileSize(file.size)}), maksimal ${formatFileSize(maxSize)}`
        };
    }
    
    // Additional type check
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Tipe file tidak diizinkan: ${file.type}`
        };
    }
    
    return { valid: true };
}
