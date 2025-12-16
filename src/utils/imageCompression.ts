/**
 * Image Compression Utility
 * 
 * Enterprise-grade image optimization for construction photos
 * - Auto-compress before Firebase Storage upload
 * - Target: <500KB per photo
 * - Preserve EXIF data (GPS, timestamp)
 * - Progress tracking
 * - Quality optimization based on network
 * 
 * @module imageCompression
 */

import imageCompression from 'browser-image-compression';
import { logger } from '@/utils/logger.enhanced';

export interface CompressionOptions {
  maxSizeMB?: number;          // Default: 0.5 (500KB)
  maxWidthOrHeight?: number;   // Default: 1920px
  useWebWorker?: boolean;      // Default: true
  preserveExif?: boolean;      // Default: true
  quality?: number;            // 0.1 - 1.0, Default: 0.85
  fileType?: string;           // Default: image/jpeg
  signal?: AbortSignal;        // For cancellation
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface BatchCompressionResult {
  successful: CompressionResult[];
  failed: Array<{ file: File; error: string }>;
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavings: number;
  totalTime: number;
}

/**
 * Default compression options for construction photos
 */
const DEFAULT_OPTIONS: Required<Omit<CompressionOptions, 'signal'>> = {
  maxSizeMB: 0.5,              // 500KB target
  maxWidthOrHeight: 1920,      // Full HD resolution
  useWebWorker: true,          // Non-blocking compression
  preserveExif: true,          // Keep GPS & timestamp
  quality: 0.85,               // Good balance of quality/size
  fileType: 'image/jpeg',      // Best compression for photos
  onProgress: () => {},
};

/**
 * Network-aware compression profiles
 */
export const COMPRESSION_PROFILES = {
  // For fast/WiFi networks - higher quality
  HIGH_QUALITY: {
    maxSizeMB: 1.0,            // 1MB
    maxWidthOrHeight: 2560,    // 2K resolution
    quality: 0.9,
  },
  
  // Default - balanced
  BALANCED: {
    maxSizeMB: 0.5,            // 500KB
    maxWidthOrHeight: 1920,    // Full HD
    quality: 0.85,
  },
  
  // For slow networks - aggressive compression
  LOW_BANDWIDTH: {
    maxSizeMB: 0.25,           // 250KB
    maxWidthOrHeight: 1280,    // HD
    quality: 0.75,
  },
  
  // For mobile data - very aggressive
  MINIMAL: {
    maxSizeMB: 0.15,           // 150KB
    maxWidthOrHeight: 1024,    // Below HD
    quality: 0.7,
  },
} as const;

/**
 * Get compression profile based on network quality
 */
function getNetworkAwareProfile(): Partial<CompressionOptions> {
  if (!('connection' in navigator)) {
    return COMPRESSION_PROFILES.BALANCED;
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;
  const saveData = connection?.saveData;

  // User explicitly enabled data saver
  if (saveData) {
    return COMPRESSION_PROFILES.MINIMAL;
  }

  // Network-based selection
  switch (effectiveType) {
    case '4g':
    case 'wifi':
      return COMPRESSION_PROFILES.HIGH_QUALITY;
    case '3g':
      return COMPRESSION_PROFILES.BALANCED;
    case '2g':
    case 'slow-2g':
      return COMPRESSION_PROFILES.LOW_BANDWIDTH;
    default:
      return COMPRESSION_PROFILES.BALANCED;
  }
}

/**
 * Validate image file
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File bukan gambar' };
  }

  // Check file size (max 50MB original)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file terlalu besar (max 50MB)' };
  }

  // Supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  if (!supportedFormats.includes(file.type.toLowerCase())) {
    return { valid: false, error: `Format tidak didukung. Gunakan: ${supportedFormats.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Compress single image file
 * 
 * @example
 * ```tsx
 * const result = await compressImage(file, {
 *   maxSizeMB: 0.5,
 *   onProgress: (progress) => console.log(`${progress}%`)
 * });
 * console.log(`Reduced from ${result.originalSize} to ${result.compressedSize}`);
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = performance.now();

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Get network-aware defaults
  const networkProfile = getNetworkAwareProfile();
  
  // Merge options
  const finalOptions = {
    ...DEFAULT_OPTIONS,
    ...networkProfile,
    ...options,
  };

  try {
    logger.info('Starting image compression', {
      fileName: file.name,
      originalSize: file.size,
      options: finalOptions,
    });

    // Get original dimensions
    const originalDimensions = await getImageDimensions(file);

    // Compress image
    const compressedFile = await imageCompression(file, {
      maxSizeMB: finalOptions.maxSizeMB,
      maxWidthOrHeight: finalOptions.maxWidthOrHeight,
      useWebWorker: finalOptions.useWebWorker,
      fileType: finalOptions.fileType,
      initialQuality: finalOptions.quality,
      alwaysKeepResolution: false,
      exifOrientation: finalOptions.preserveExif ? undefined : 1,
      signal: options.signal,
      onProgress: finalOptions.onProgress,
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Get compressed dimensions
    const compressedDimensions = await getImageDimensions(compressedFile);

    const result: CompressionResult = {
      compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: (1 - compressedFile.size / file.size) * 100,
      processingTime,
      dimensions: compressedDimensions,
    };

    logger.info('Image compression completed', {
      fileName: file.name,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: result.compressionRatio.toFixed(2) + '%',
      processingTime: processingTime.toFixed(2) + 'ms',
      dimensions: `${originalDimensions.width}x${originalDimensions.height} → ${compressedDimensions.width}x${compressedDimensions.height}`,
    });

    return result;
  } catch (error) {
    logger.error('Image compression failed', error instanceof Error ? error : new Error(String(error)), {
      fileName: file.name,
      fileSize: file.size,
    });
    throw error;
  }
}

/**
 * Compress multiple images in batch
 * 
 * @example
 * ```tsx
 * const results = await compressImageBatch(files, {
 *   maxSizeMB: 0.5,
 *   onProgress: (progress, fileName) => console.log(`${fileName}: ${progress}%`)
 * });
 * console.log(`Saved ${results.totalSavings} bytes`);
 * ```
 */
export async function compressImageBatch(
  files: File[],
  options: CompressionOptions = {}
): Promise<BatchCompressionResult> {
  const startTime = performance.now();
  
  const successful: CompressionResult[] = [];
  const failed: Array<{ file: File; error: string }> = [];

  logger.info('Starting batch image compression', {
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
  });

  // Process all files (in parallel for better performance)
  const results = await Promise.allSettled(
    files.map(file => compressImage(file, options))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push({
        file: files[index],
        error: result.reason.message || 'Unknown error',
      });
    }
  });

  const endTime = performance.now();

  const batchResult: BatchCompressionResult = {
    successful,
    failed,
    totalOriginalSize: successful.reduce((sum, r) => sum + r.originalSize, 0),
    totalCompressedSize: successful.reduce((sum, r) => sum + r.compressedSize, 0),
    totalSavings: successful.reduce((sum, r) => sum + (r.originalSize - r.compressedSize), 0),
    totalTime: endTime - startTime,
  };

  logger.info('Batch compression completed', {
    successful: successful.length,
    failed: failed.length,
    totalSavings: `${(batchResult.totalSavings / 1024 / 1024).toFixed(2)} MB`,
    avgCompressionRatio: successful.length > 0
      ? (successful.reduce((sum, r) => sum + r.compressionRatio, 0) / successful.length).toFixed(2) + '%'
      : '0%',
    totalTime: `${batchResult.totalTime.toFixed(2)} ms`,
  });

  return batchResult;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Check if compression is beneficial
 * (Skip compression for already small files)
 */
export function shouldCompress(file: File, targetSizeMB: number = 0.5): boolean {
  const targetBytes = targetSizeMB * 1024 * 1024;
  return file.size > targetBytes;
}
