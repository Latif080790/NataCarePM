/**
 * Authentication Service
 * Handles password change, reauthentication, and password history
 */

import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { auth, db } from '../../firebaseConfig';
import { validatePassword } from '@/utils/passwordValidator';
import type { APIResponse, PasswordHistory } from '@/types/userProfile';
import { PASSWORD_REQUIREMENTS } from '@/types/userProfile';

// ========================================
// TYPES
// ========================================

export interface PasswordChangeRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface PasswordChangeResult {
  success: boolean;
  message: string;
  passwordStrength?: number;
}

// ========================================
// PASSWORD CHANGE
// ========================================

/**
 * Change user password with validation and history tracking
 */
export const changePassword = async (
  request: PasswordChangeRequest
): Promise<APIResponse<PasswordChangeResult>> => {
  try {
    const { userId, currentPassword, newPassword } = request;

    // Step 1: Get Firebase Auth user
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User tidak terautentikasi',
        },
      };
    }

    // Step 2: Validate user ID matches
    if (firebaseUser.uid !== userId) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tidak diizinkan mengubah password user lain',
        },
      };
    }

    // Step 3: Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: validation.errors[0] || 'Password terlalu lemah',
          details: {
            errors: validation.errors,
            warnings: validation.warnings,
            suggestions: validation.suggestions,
            strength: validation.strength,
            score: validation.score,
          },
        },
      };
    }

    // Step 4: Check password similarity
    if (newPassword === currentPassword) {
      return {
        success: false,
        error: {
          code: 'SAME_PASSWORD',
          message: 'Password baru tidak boleh sama dengan password lama',
        },
      };
    }

    // Step 5: Check password history
    const historyCheck = await checkPasswordHistory(userId, newPassword);
    if (!historyCheck.success) {
      return {
        success: false,
        error: historyCheck.error,
      };
    }

    // Step 6: Reauthenticate user
    const reauthResult = await reauthenticateUser(firebaseUser, currentPassword);
    if (!reauthResult.success) {
      return {
        success: false,
        error: reauthResult.error,
      };
    }

    // Step 7: Update Firebase Auth password
    await updatePassword(firebaseUser, newPassword);

    // Step 8: Add to password history in Firestore
    await addToPasswordHistory(userId, newPassword);

    // Step 9: Update lastPasswordChange timestamp
    await updateDoc(doc(db, 'users', userId), {
      lastPasswordChange: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      data: {
        success: true,
        message: 'Password berhasil diubah',
        passwordStrength: validation.score,
      },
      message: 'Password berhasil diubah',
    };
  } catch (error: any) {
    console.error('Error changing password:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/weak-password') {
      return {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password terlalu lemah menurut Firebase',
        },
      };
    }

    if (error.code === 'auth/requires-recent-login') {
      return {
        success: false,
        error: {
          code: 'REQUIRES_RECENT_LOGIN',
          message: 'Sesi sudah kadaluarsa. Silakan login ulang.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: 'Gagal mengubah password',
        details: error,
      },
    };
  }
};

// ========================================
// REAUTHENTICATION
// ========================================

/**
 * Reauthenticate user with current password
 */
export const reauthenticateUser = async (
  user: FirebaseUser,
  currentPassword: string
): Promise<APIResponse<boolean>> => {
  try {
    if (!user.email) {
      return {
        success: false,
        error: {
          code: 'NO_EMAIL',
          message: 'User tidak memiliki email',
        },
      };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    return {
      success: true,
      data: true,
      message: 'Reauthentication successful',
    };
  } catch (error: any) {
    console.error('Reauthentication error:', error);

    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return {
        success: false,
        error: {
          code: 'WRONG_PASSWORD',
          message: 'Password saat ini salah',
        },
      };
    }

    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Terlalu banyak percobaan. Coba lagi nanti.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'REAUTH_ERROR',
        message: 'Gagal verifikasi password',
        details: error,
      },
    };
  }
};

// ========================================
// PASSWORD HISTORY
// ========================================

/**
 * Check if password has been used in recent history
 */
const checkPasswordHistory = async (
  userId: string,
  newPassword: string
): Promise<APIResponse<boolean>> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return {
        success: true, // User doesn't have history yet, allow
        data: true,
      };
    }

    const userData = userDoc.data();
    const passwordHistory: PasswordHistory[] = userData.passwordHistory || [];

    // Get recent password hashes
    const recentHashes = passwordHistory
      .slice(-PASSWORD_REQUIREMENTS.historyCount)
      .map(entry => entry.passwordHash);

    // Check if new password matches any recent hash using bcrypt
    for (const hash of recentHashes) {
      const isMatch = await bcrypt.compare(newPassword, hash);
      if (isMatch) {
        return {
          success: false,
          error: {
            code: 'PASSWORD_REUSED',
            message: `Password ini sudah pernah digunakan. Gunakan password berbeda dari ${PASSWORD_REQUIREMENTS.historyCount} password terakhir.`,
          },
        };
      }
    }

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('Error checking password history:', error);
    // Don't block password change if history check fails
    return {
      success: true,
      data: true,
    };
  }
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Add password to user's history
 */
const addToPasswordHistory = async (
  userId: string,
  password: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return;
    }

    // Create history entry with hashed password
    const passwordHash = await hashPassword(password);
    const historyEntry: PasswordHistory = {
      userId: userId,
      passwordHash: passwordHash,
      createdAt: new Date(),
    };

    const userData = userDoc.data();
    const currentHistory: PasswordHistory[] = userData.passwordHistory || [];

    // Keep only last N passwords
    const updatedHistory = [
      ...currentHistory.slice(-(PASSWORD_REQUIREMENTS.historyCount - 1)),
      historyEntry,
    ];

    // Update Firestore
    await updateDoc(userRef, {
      passwordHistory: updatedHistory,
    });
  } catch (error) {
    console.error('Error adding to password history:', error);
    // Don't throw - this is a background operation
  }
};

// ========================================
// PASSWORD RESET REQUEST
// ========================================

/**
 * Get user's password history (for admin/audit purposes)
 */
export const getPasswordHistory = async (
  userId: string
): Promise<APIResponse<PasswordHistory[]>> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    const userData = userDoc.data();
    const history: PasswordHistory[] = userData.passwordHistory || [];

    // Remove actual password hashes from response for security
    const sanitizedHistory = history.map(entry => ({
      ...entry,
      passwordHash: '***', // Hide hash
      createdAt: entry.createdAt instanceof Timestamp ? (entry.createdAt as Timestamp).toDate() : entry.createdAt,
    }));

    return {
      success: true,
      data: sanitizedHistory,
      message: 'Password history retrieved',
    };
  } catch (error) {
    console.error('Error getting password history:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to get password history',
        details: error,
      },
    };
  }
};

/**
 * Get last password change date
 */
export const getLastPasswordChange = async (
  userId: string
): Promise<APIResponse<Date | null>> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    const userData = userDoc.data();
    const lastPasswordChange = userData.lastPasswordChange
      ? (userData.lastPasswordChange as Timestamp).toDate()
      : null;

    return {
      success: true,
      data: lastPasswordChange,
      message: 'Last password change retrieved',
    };
  } catch (error) {
    console.error('Error getting last password change:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to get last password change',
        details: error,
      },
    };
  }
};
