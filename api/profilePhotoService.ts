/**
 * Profile Photo Service
 * Handles user profile photo upload, update, and deletion with Firebase Storage
 */

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';
import { logger } from '../utils/logger';
import type { 
  ProfilePhotoUpload, 
  ProfilePhotoResponse 
} from '../types';

// Constants
const PROFILE_PHOTOS_PATH = 'profile_photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_QUALITY = 0.9;
const MAX_DIMENSION = 1024; // Max width/height in pixels

/**
 * Validate profile photo file
 */
const validateProfilePhoto = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Resize and compress image before upload
 */
const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          IMAGE_QUALITY
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Upload profile photo to Firebase Storage
 */
export const uploadProfilePhoto = async (
  request: ProfilePhotoUpload
): Promise<ProfilePhotoResponse> => {
  try {
    const { userId, file } = request;

    logger.info('Uploading profile photo', { userId, filename: file.name });

    // Validate file
    const validation = validateProfilePhoto(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Resize and compress image
    const compressedBlob = await resizeImage(file);

    // Generate storage path
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${userId}_${timestamp}.${extension}`;
    const storagePath = `${PROFILE_PHOTOS_PATH}/${userId}/${filename}`;

    // Create storage reference
    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, compressedBlob, {
      contentType: file.type,
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        originalFilename: file.name,
        originalSize: file.size.toString(),
        compressedSize: compressedBlob.size.toString()
      }
    });

    logger.info('Profile photo uploaded to storage', { 
      userId, 
      path: storagePath,
      originalSize: file.size,
      compressedSize: compressedBlob.size
    });

    // Get download URL
    const photoURL = await getDownloadURL(snapshot.ref);

    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      photoURL,
      photoStoragePath: storagePath,
      photoUploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    logger.info('User profile updated with photo URL', { userId });

    return {
      success: true,
      photoURL,
      storagePath,
      uploadedAt: new Date()
    };

  } catch (error: any) {
    logger.error('Error uploading profile photo', error, { userId: request.userId });
    
    return {
      success: false,
      photoURL: '',
      storagePath: '',
      uploadedAt: new Date(),
      error: error.message || 'Failed to upload profile photo'
    };
  }
};

/**
 * Update existing profile photo
 */
export const updateProfilePhoto = async (
  request: ProfilePhotoUpload
): Promise<ProfilePhotoResponse> => {
  try {
    const { userId } = request;

    logger.info('Updating profile photo', { userId });

    // Delete old photo first
    await deleteProfilePhoto(userId);

    // Upload new photo
    return await uploadProfilePhoto(request);

  } catch (error: any) {
    logger.error('Error updating profile photo', error, { userId: request.userId });
    
    return {
      success: false,
      photoURL: '',
      storagePath: '',
      uploadedAt: new Date(),
      error: error.message || 'Failed to update profile photo'
    };
  }
};

/**
 * Delete profile photo from Firebase Storage
 */
export const deleteProfilePhoto = async (userId: string): Promise<boolean> => {
  try {
    logger.info('Deleting profile photo', { userId });

    // Get user document to find storage path
    const userRef = doc(db, 'users', userId);
    const userDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(userRef));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const storagePath = userData.photoStoragePath;

    if (!storagePath) {
      logger.warn('No profile photo to delete', { userId });
      return true; // No photo to delete
    }

    // Delete from storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    logger.info('Profile photo deleted from storage', { userId, path: storagePath });

    // Update user document
    await updateDoc(userRef, {
      photoURL: null,
      photoStoragePath: null,
      photoUploadedAt: null,
      updatedAt: serverTimestamp()
    });

    logger.info('User profile updated after photo deletion', { userId });

    return true;

  } catch (error: any) {
    // If file doesn't exist, that's okay
    if (error.code === 'storage/object-not-found') {
      logger.warn('Profile photo not found in storage', { userId });
      
      // Still update Firestore to clear the fields
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        photoURL: null,
        photoStoragePath: null,
        photoUploadedAt: null,
        updatedAt: serverTimestamp()
      });
      
      return true;
    }

    logger.error('Error deleting profile photo', error, { userId });
    throw error;
  }
};

/**
 * Get profile photo metadata
 */
export const getProfilePhotoMetadata = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(userRef));
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const storagePath = userData.photoStoragePath;

    if (!storagePath) {
      return null;
    }

    const storageRef = ref(storage, storagePath);
    const metadata = await getMetadata(storageRef);

    return {
      userId,
      photoURL: userData.photoURL,
      storagePath,
      uploadedAt: userData.photoUploadedAt?.toDate(),
      size: metadata.size,
      contentType: metadata.contentType,
      customMetadata: metadata.customMetadata
    };

  } catch (error: any) {
    logger.error('Error getting profile photo metadata', error, { userId });
    return null;
  }
};

/**
 * Check if user has profile photo
 */
export const hasProfilePhoto = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(userRef));
    
    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    return !!userData.photoURL && !!userData.photoStoragePath;

  } catch (error: any) {
    logger.error('Error checking profile photo', error, { userId });
    return false;
  }
};

/**
 * Get profile photo URL (convenience function)
 */
export const getProfilePhotoURL = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(userRef));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return userData.photoURL || null;

  } catch (error: any) {
    logger.error('Error getting profile photo URL', error, { userId });
    return null;
  }
};

export default {
  uploadProfilePhoto,
  updateProfilePhoto,
  deleteProfilePhoto,
  getProfilePhotoMetadata,
  hasProfilePhoto,
  getProfilePhotoURL
};
