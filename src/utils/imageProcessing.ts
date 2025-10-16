/**
 * Image Processing Utilities
 * Handles image validation, compression, resizing, and cropping
 */

import imageCompression from 'browser-image-compression';
import { IMAGE_REQUIREMENTS } from '../types/userProfile';
import type { ImageValidation, CropArea } from '../types/userProfile';

// ========================================
// IMAGE VALIDATION
// ========================================

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File): ImageValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if file exists
  if (!file) {
    return {
      valid: false,
      errors: ['No file provided'],
      fileSize: 0,
    };
  }

  // Check file size
  if (file.size > IMAGE_REQUIREMENTS.maxSize) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(IMAGE_REQUIREMENTS.maxSize)})`
    );
  }

  // Check file type
  if (!IMAGE_REQUIREMENTS.allowedFormats.includes(file.type as any)) {
    errors.push(
      `File type ${file.type} is not allowed. Allowed formats: ${IMAGE_REQUIREMENTS.allowedExtensions.join(', ')}`
    );
  }

  // Check file extension
  const extension = getFileExtension(file.name).toLowerCase();
  if (!IMAGE_REQUIREMENTS.allowedExtensions.includes(extension as any)) {
    errors.push(
      `File extension ${extension} is not allowed. Allowed extensions: ${IMAGE_REQUIREMENTS.allowedExtensions.join(', ')}`
    );
  }

  // Warning for large files
  if (file.size > 2 * 1024 * 1024 && file.size <= IMAGE_REQUIREMENTS.maxSize) {
    warnings.push('File is large and will be compressed. This may take a moment.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    fileSize: file.size,
    format: file.type,
  };
};

/**
 * Get image dimensions from file
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = async (file: File): Promise<ImageValidation> => {
  try {
    const dimensions = await getImageDimensions(file);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Minimum dimensions
    if (dimensions.width < 200 || dimensions.height < 200) {
      errors.push('Image dimensions must be at least 200x200 pixels');
    }

    // Warn if image is very large
    if (dimensions.width > 4000 || dimensions.height > 4000) {
      warnings.push('Image is very large and will be resized');
    }

    // Warn if aspect ratio is not square
    const aspectRatio = dimensions.width / dimensions.height;
    if (aspectRatio < 0.8 || aspectRatio > 1.2) {
      warnings.push('Image is not square. You can crop it to fit.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      fileSize: file.size,
      dimensions,
      format: file.type,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [(error as Error).message || 'Failed to validate image dimensions'],
      fileSize: file.size,
    };
  }
};

// ========================================
// IMAGE COMPRESSION & RESIZING
// ========================================

/**
 * Compress and resize image to target size
 */
export const compressImage = async (
  file: File,
  targetWidth: number = IMAGE_REQUIREMENTS.targetSize.width,
  targetHeight: number = IMAGE_REQUIREMENTS.targetSize.height
): Promise<File> => {
  try {
    const options = {
      maxSizeMB: IMAGE_REQUIREMENTS.maxSize / (1024 * 1024), // Convert to MB
      maxWidthOrHeight: Math.max(targetWidth, targetHeight),
      useWebWorker: true,
      fileType: file.type,
      quality: IMAGE_REQUIREMENTS.quality,
      initialQuality: IMAGE_REQUIREMENTS.quality,
    };

    const compressedFile = await imageCompression(file, options);
    
    // Preserve original filename
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error(`Failed to compress image: ${(error as Error).message}`);
  }
};

/**
 * Resize image to specific dimensions
 */
export const resizeImage = async (
  file: File,
  width: number,
  height: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type,
        IMAGE_REQUIREMENTS.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Create thumbnail from image
 */
export const createThumbnail = async (
  file: File,
  size: number = IMAGE_REQUIREMENTS.thumbnailSize.width
): Promise<Blob> => {
  return resizeImage(file, size, size);
};

// ========================================
// IMAGE CROPPING
// ========================================

/**
 * Crop image based on crop area
 */
export const cropImage = async (
  file: File,
  cropArea: CropArea
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const dimensions = await getImageDimensions(file);
        
        // Convert percentage to pixels if needed
        let x = cropArea.x;
        let y = cropArea.y;
        let width = cropArea.width;
        let height = cropArea.height;

        if (cropArea.unit === '%') {
          x = (cropArea.x / 100) * dimensions.width;
          y = (cropArea.y / 100) * dimensions.height;
          width = (cropArea.width / 100) * dimensions.width;
          height = (cropArea.height / 100) * dimensions.height;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw cropped image
        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          file.type,
          IMAGE_REQUIREMENTS.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Crop image to square (center crop)
 */
export const cropToSquare = async (file: File): Promise<Blob> => {
  const dimensions = await getImageDimensions(file);
  const size = Math.min(dimensions.width, dimensions.height);
  const x = (dimensions.width - size) / 2;
  const y = (dimensions.height - size) / 2;

  return cropImage(file, {
    x,
    y,
    width: size,
    height: size,
    unit: 'px',
  });
};

// ========================================
// IMAGE PREVIEW
// ========================================

/**
 * Create preview URL from file
 */
export const createPreviewURL = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke preview URL to free memory
 */
export const revokePreviewURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Convert blob to data URL
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert data URL to blob
 */
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// ========================================
// IMAGE OPTIMIZATION
// ========================================

/**
 * Optimize image for upload (compress, resize, and convert to optimal format)
 */
export const optimizeImageForUpload = async (
  file: File,
  options?: {
    targetWidth?: number;
    targetHeight?: number;
    cropArea?: CropArea;
  }
): Promise<{ primary: File; thumbnail: File }> => {
  try {
    // Step 1: Validate image
    const validation = await validateImageDimensions(file);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Step 2: Crop if crop area provided
    let processedFile = file;
    if (options?.cropArea) {
      const croppedBlob = await cropImage(file, options.cropArea);
      processedFile = new File([croppedBlob], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
    }

    // Step 3: Compress and resize primary image
    const primaryFile = await compressImage(
      processedFile,
      options?.targetWidth || IMAGE_REQUIREMENTS.targetSize.width,
      options?.targetHeight || IMAGE_REQUIREMENTS.targetSize.height
    );

    // Step 4: Create thumbnail
    const thumbnailBlob = await createThumbnail(processedFile);
    const thumbnailFile = new File(
      [thumbnailBlob],
      `thumbnail_${file.name}`,
      {
        type: file.type,
        lastModified: Date.now(),
      }
    );

    return {
      primary: primaryFile,
      thumbnail: thumbnailFile,
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error(`Failed to optimize image: ${(error as Error).message}`);
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format file size to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot);
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const extension = getFileExtension(originalName);
  const basename = originalName.substring(0, originalName.length - extension.length);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${basename}_${timestamp}_${random}${extension}`;
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Get optimal image format for upload
 */
export const getOptimalImageFormat = (file: File): string => {
  // WebP is more efficient but not universally supported in upload contexts
  // Stick with JPEG for photos, PNG for graphics
  if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    return 'image/png';
  }
  return 'image/jpeg';
};

/**
 * Calculate image aspect ratio
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Check if image is square (within tolerance)
 */
export const isSquareImage = (
  width: number,
  height: number,
  tolerance: number = 0.1
): boolean => {
  const aspectRatio = calculateAspectRatio(width, height);
  return Math.abs(aspectRatio - 1) <= tolerance;
};

/**
 * Rotate image by degrees
 */
export const rotateImage = async (
  file: File,
  degrees: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions after rotation
      const radians = (degrees * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;

      // Rotate and draw
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type,
        IMAGE_REQUIREMENTS.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};
