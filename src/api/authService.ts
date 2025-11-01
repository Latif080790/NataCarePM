/**
 * Authentication Service
 * Handles password change through Firebase Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import type { APIResponse } from '@/types/userProfile';

// ========================================
// TYPES
// ========================================

export interface PasswordChangeRequest {
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
 * Change user password using Firebase Function
 */
export const changePassword = async (
  request: PasswordChangeRequest
): Promise<APIResponse<PasswordChangeResult>> => {
  try {
    const { currentPassword, newPassword } = request;

    // Get Firebase Functions instance
    const functions = getFunctions();
    const changePasswordFunction = httpsCallable(functions, 'changePassword');
    
    // Call Firebase Function
    const result = await changePasswordFunction({
      currentPassword,
      newPassword
    });
    
    return result.data as APIResponse<PasswordChangeResult>;
  } catch (error: any) {
    console.error('Error changing password:', error);
    
    // Handle Firebase Function errors
    if (error.code === 'functions/invalid-argument') {
      return {
        success: false,
        error: {
          code: 'INVALID_ARGUMENT',
          message: error.message || 'Invalid password',
        },
      };
    }
    
    if (error.code === 'functions/permission-denied') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Permission denied',
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: 'Failed to change password',
        details: error,
      },
    };
  }
};

