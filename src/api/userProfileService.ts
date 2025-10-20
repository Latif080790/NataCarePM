/**
 * User Profile Service
 * Handles user profile operations including photo upload, profile updates, and user data management
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage, auth } from '../../firebaseConfig';
import {
  optimizeImageForUpload,
  validateImageFile,
  validateImageDimensions,
  generateUniqueFilename,
} from '@/utils/imageProcessing';
import type {
  UserProfile,
  APIResponse,
  PhotoUploadResult,
  NotificationPreferences,
  DeepPartial,
} from '@/types/userProfile';

// ========================================
// USER PROFILE CRUD
// ========================================

/**
 * Get user profile by ID
 */
export const getUserProfile = async (
  userId: string
): Promise<APIResponse<UserProfile>> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      };
    }

    const userData = userDoc.data();

    // Convert Firestore timestamps to Date objects
    const profile: UserProfile = {
      ...userData,
      id: userDoc.id,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
      lastLoginAt: userData.lastLoginAt?.toDate(),
      lastActivityAt: userData.lastActivityAt?.toDate(),
      lastPasswordChange: userData.lastPasswordChange?.toDate(),
    } as UserProfile;

    return {
      success: true,
      data: profile,
      message: 'User profile fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch user profile',
        details: error,
      },
    };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: DeepPartial<UserProfile>
): Promise<APIResponse<UserProfile>> => {
  try {
    const userRef = doc(db, 'users', userId);

    // Remove fields that shouldn't be directly updated
    const { id, createdAt, ...safeUpdates } = updates as any;

    await updateDoc(userRef, {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });

    // Fetch updated profile
    const updatedProfile = await getUserProfile(userId);

    return {
      success: true,
      data: updatedProfile.data,
      message: 'User profile updated successfully',
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update user profile',
        details: error,
      },
    };
  }
};

// ========================================
// PROFILE PHOTO UPLOAD
// ========================================

/**
 * Upload profile photo to Firebase Storage
 */
export const uploadProfilePhoto = async (
  userId: string,
  file: File,
  cropArea?: any
): Promise<APIResponse<PhotoUploadResult>> => {
  try {
    // Step 1: Validate file
    const basicValidation = validateImageFile(file);
    if (!basicValidation.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: basicValidation.errors.join(', '),
        },
      };
    }

    // Step 2: Validate dimensions
    const dimensionValidation = await validateImageDimensions(file);
    if (!dimensionValidation.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_DIMENSIONS',
          message: dimensionValidation.errors.join(', '),
        },
      };
    }

    // Step 3: Optimize image (compress, resize, create thumbnail)
    const optimized = await optimizeImageForUpload(file, { cropArea });

    // Step 4: Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const thumbnailFilename = `thumbnail_${uniqueFilename}`;

    // Step 5: Upload primary image
    const primaryRef = ref(storage, `profile-photos/${userId}/${uniqueFilename}`);
    const primarySnapshot = await uploadBytes(primaryRef, optimized.primary);
    const photoURL = await getDownloadURL(primarySnapshot.ref);

    // Step 6: Upload thumbnail
    const thumbnailRef = ref(storage, `profile-photos/${userId}/thumbnails/${thumbnailFilename}`);
    const thumbnailSnapshot = await uploadBytes(thumbnailRef, optimized.thumbnail);
    const thumbnailURL = await getDownloadURL(thumbnailSnapshot.ref);

    // Step 7: Get file dimensions
    const dimensions = dimensionValidation.dimensions || { width: 800, height: 800 };

    // Step 8: Update user profile with new photo URL
    await updateDoc(doc(db, 'users', userId), {
      photoURL,
      thumbnailURL,
      updatedAt: serverTimestamp(),
    });

    // Step 9: Delete old photo if exists (optional - implement later)
    // await deleteOldProfilePhoto(userId, photoURL);

    const result: PhotoUploadResult = {
      photoURL,
      thumbnailURL,
      uploadedAt: new Date(),
      fileSize: optimized.primary.size,
      dimensions,
    };

    return {
      success: true,
      data: result,
      message: 'Profile photo uploaded successfully',
    };
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return {
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload profile photo',
        details: error,
      },
    };
  }
};

/**
 * Delete old profile photo from storage
 */
export const deleteOldProfilePhoto = async (
  userId: string,
  currentPhotoURL: string
): Promise<void> => {
  try {
    // Get user's old photo URL
    const userProfile = await getUserProfile(userId);
    if (!userProfile.success || !userProfile.data?.photoURL) {
      return; // No old photo to delete
    }

    const oldPhotoURL = userProfile.data.photoURL;

    // Don't delete if it's the same photo or a default avatar
    if (oldPhotoURL === currentPhotoURL || oldPhotoURL.includes('default-avatar')) {
      return;
    }

    // Extract path from URL and delete
    const photoPath = extractStoragePath(oldPhotoURL);
    if (photoPath) {
      const photoRef = ref(storage, photoPath);
      await deleteObject(photoRef);
    }

    // Also delete thumbnail if exists
    if (userProfile.data.thumbnailURL) {
      const thumbnailPath = extractStoragePath(userProfile.data.thumbnailURL);
      if (thumbnailPath) {
        const thumbnailRef = ref(storage, thumbnailPath);
        await deleteObject(thumbnailRef).catch(() => {
          // Ignore if thumbnail doesn't exist
        });
      }
    }
  } catch (error) {
    console.error('Error deleting old profile photo:', error);
    // Don't throw - this is a cleanup operation
  }
};

/**
 * Extract storage path from download URL
 */
const extractStoragePath = (downloadURL: string): string | null => {
  try {
    const url = new URL(downloadURL);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  } catch {
    return null;
  }
};

/**
 * Get profile photo URL (with fallback to default avatar)
 */
export const getProfilePhotoURL = (
  user: UserProfile | null,
  size: 'full' | 'thumbnail' = 'full'
): string => {
  if (!user) {
    return '/default-avatar.png';
  }

  if (size === 'thumbnail' && user.thumbnailURL) {
    return user.thumbnailURL;
  }

  return user.photoURL || '/default-avatar.png';
};

// ========================================
// NOTIFICATION PREFERENCES
// ========================================

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (
  userId: string
): Promise<APIResponse<NotificationPreferences>> => {
  try {
    const userProfile = await getUserProfile(userId);

    if (!userProfile.success || !userProfile.data) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    return {
      success: true,
      data: userProfile.data.notificationPreferences,
      message: 'Notification preferences fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notification preferences',
        details: error,
      },
    };
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: DeepPartial<NotificationPreferences>
): Promise<APIResponse<NotificationPreferences>> => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      notificationPreferences: preferences,
      updatedAt: serverTimestamp(),
    });

    const updated = await getNotificationPreferences(userId);

    return {
      success: true,
      data: updated.data,
      message: 'Notification preferences updated successfully',
    };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update notification preferences',
        details: error,
      },
    };
  }
};

// ========================================
// USER SEARCH & LOOKUP
// ========================================

/**
 * Search users by email or display name
 */
export const searchUsers = async (
  searchTerm: string,
  limit: number = 10
): Promise<APIResponse<UserProfile[]>> => {
  try {
    const normalizedTerm = searchTerm.toLowerCase().trim();

    if (normalizedTerm.length < 2) {
      return {
        success: false,
        error: {
          code: 'INVALID_SEARCH',
          message: 'Search term must be at least 2 characters',
        },
      };
    }

    // Search by email
    const emailQuery = query(
      collection(db, 'users'),
      where('email', '>=', normalizedTerm),
      where('email', '<=', normalizedTerm + '\uf8ff')
    );

    const emailSnapshot = await getDocs(emailQuery);
    const users: UserProfile[] = [];

    emailSnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        ...userData,
        id: doc.id,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLoginAt: userData.lastLoginAt?.toDate(),
        lastActivityAt: userData.lastActivityAt?.toDate(),
        lastPasswordChange: userData.lastPasswordChange?.toDate(),
      } as UserProfile);
    });

    return {
      success: true,
      data: users.slice(0, limit),
      message: `Found ${users.length} user(s)`,
    };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      data: [],
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search users',
        details: error,
      },
    };
  }
};

/**
 * Get multiple user profiles by IDs
 */
export const getUserProfiles = async (
  userIds: string[]
): Promise<APIResponse<UserProfile[]>> => {
  try {
    const profiles: UserProfile[] = [];

    // Batch get users (Firestore limit is 10 per query, so we chunk)
    const chunks = chunkArray(userIds, 10);

    for (const chunk of chunks) {
      const promises = chunk.map((id) => getUserProfile(id));
      const results = await Promise.all(promises);

      results.forEach((result) => {
        if (result.success && result.data) {
          profiles.push(result.data);
        }
      });
    }

    return {
      success: true,
      data: profiles,
      message: `Fetched ${profiles.length} user profile(s)`,
    };
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return {
      success: false,
      data: [],
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch user profiles',
        details: error,
      },
    };
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Chunk array into smaller arrays
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Check if user exists
 */
export const userExists = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists();
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUserProfile = async (): Promise<APIResponse<UserProfile>> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      };
    }

    return getUserProfile(currentUser.uid);
  } catch (error) {
    console.error('Error getting current user profile:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to get current user profile',
        details: error,
      },
    };
  }
};

/**
 * Update user's last activity timestamp
 */
export const updateLastActivity = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last activity:', error);
    // Don't throw - this is a background operation
  }
};

/**
 * Update user's last login timestamp
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      lastLoginAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't throw - this is a background operation
  }
};
