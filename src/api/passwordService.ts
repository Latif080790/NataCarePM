/**
 * Password Service
 * Handles password changes, validation, and strength checking
 */

import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { logger } from '@/utils/logger';
import type { 
  PasswordChangeRequest, 
  PasswordValidationResult 
} from '@/types';

// Password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
};

// Common passwords to reject
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'password1', '123456789', '1234567890', 'admin', 'admin123',
  'letmein', 'welcome', 'monkey', '111111', '123123',
  'password!', 'Password1', 'Passw0rd', 'P@ssw0rd', 'P@ssword'
];

/**
 * Validate password strength and requirements
 */
export const validatePassword = (
  password: string, 
  email?: string
): PasswordValidationResult => {
  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
    notSimilarToEmail: email ? !password.toLowerCase().includes(email.split('@')[0].toLowerCase()) : true
  };

  // Calculate strength score (0-100)
  let score = 0;
  
  // Length scoring (max 30 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety (max 40 points)
  if (requirements.hasUppercase) score += 10;
  if (requirements.hasLowercase) score += 10;
  if (requirements.hasNumber) score += 10;
  if (requirements.hasSpecialChar) score += 10;

  // Additional factors (max 30 points)
  if (requirements.notCommon) score += 15;
  if (requirements.notSimilarToEmail) score += 15;

  // Determine strength level
  let strength: PasswordValidationResult['strength'];
  if (score < 40) strength = 'weak';
  else if (score < 60) strength = 'fair';
  else if (score < 75) strength = 'good';
  else if (score < 90) strength = 'strong';
  else strength = 'very_strong';

  // Generate suggestions
  const suggestions: string[] = [];
  if (!requirements.minLength) {
    suggestions.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  if (!requirements.hasUppercase) {
    suggestions.push('Add uppercase letters (A-Z)');
  }
  if (!requirements.hasLowercase) {
    suggestions.push('Add lowercase letters (a-z)');
  }
  if (!requirements.hasNumber) {
    suggestions.push('Add numbers (0-9)');
  }
  if (!requirements.hasSpecialChar) {
    suggestions.push('Add special characters (!@#$%^&*)');
  }
  if (!requirements.notCommon) {
    suggestions.push('Avoid common passwords');
  }
  if (!requirements.notSimilarToEmail) {
    suggestions.push('Password should not contain parts of your email');
  }
  if (password.length < 12) {
    suggestions.push('Consider using a longer password (12+ characters)');
  }

  // Estimate crack time (simplified)
  let estimatedCrackTime = 'Less than a second';
  if (score >= 90) estimatedCrackTime = 'Centuries';
  else if (score >= 75) estimatedCrackTime = 'Several years';
  else if (score >= 60) estimatedCrackTime = 'Several months';
  else if (score >= 40) estimatedCrackTime = 'Several days';
  else estimatedCrackTime = 'Less than an hour';

  // Check if all requirements are met
  const isValid = Object.values(requirements).every(req => req === true);

  return {
    isValid,
    strength,
    score,
    requirements,
    suggestions,
    estimatedCrackTime
  };
};

/**
 * Change user password
 */
export const changePassword = async (
  request: PasswordChangeRequest
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { userId, currentPassword, newPassword, confirmPassword } = request;

    logger.info('Password change requested', { userId });

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        success: false,
        error: 'All fields are required'
      };
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: 'New passwords do not match'
      };
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return {
        success: false,
        error: 'New password must be different from current password'
      };
    }

    // Get user email for validation
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const userEmail = currentUser.email;
    if (!userEmail) {
      return {
        success: false,
        error: 'User email not found'
      };
    }

    // Validate new password strength
    const validation = validatePassword(newPassword, userEmail);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Password does not meet requirements: ${validation.suggestions.join(', ')}`
      };
    }

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(userEmail, currentPassword);
    
    try {
      await reauthenticateWithCredential(currentUser, credential);
    } catch (error: any) {
      logger.warn('Re-authentication failed during password change', { userId, error: error.code });
      
      if (error.code === 'auth/wrong-password') {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }
      
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      };
    }

    // Update password
    await updatePassword(currentUser, newPassword);

    logger.info('Password updated successfully', { userId });

    // Update user document in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastPasswordChange: serverTimestamp(),
      passwordExpiresAt: null, // Reset expiration if any
      requirePasswordChange: false,
      updatedAt: serverTimestamp()
    });

    logger.info('User document updated after password change', { userId });

    // Log activity (will be handled by activityLogService)
    await logPasswordChange(userId);

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error changing password', error, { userId: request.userId });
    
    return {
      success: false,
      error: error.message || 'Failed to change password. Please try again.'
    };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info('Password reset requested', { email });

    await sendPasswordResetEmail(auth, email);

    logger.info('Password reset email sent', { email });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error sending password reset email', error, { email });
    
    let errorMessage = 'Failed to send password reset email';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Check if password needs to be changed (based on policy)
 */
export const checkPasswordExpiration = async (
  userId: string
): Promise<{ expired: boolean; daysUntilExpiration?: number }> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { expired: false };
    }

    const userData = userDoc.data();
    
    // Check if password change is required
    if (userData.requirePasswordChange) {
      return { expired: true };
    }

    // Check expiration date
    if (userData.passwordExpiresAt) {
      const expirationDate = userData.passwordExpiresAt.toDate();
      const now = new Date();
      
      if (expirationDate <= now) {
        return { expired: true };
      }

      // Calculate days until expiration
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        expired: false,
        daysUntilExpiration
      };
    }

    return { expired: false };

  } catch (error: any) {
    logger.error('Error checking password expiration', error, { userId });
    return { expired: false };
  }
};

/**
 * Set password expiration policy (admin function)
 */
export const setPasswordExpiration = async (
  userId: string,
  daysUntilExpiration: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysUntilExpiration);

    await updateDoc(userRef, {
      passwordExpiresAt: expirationDate,
      updatedAt: serverTimestamp()
    });

    logger.info('Password expiration set', { userId, daysUntilExpiration });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error setting password expiration', error, { userId });
    
    return {
      success: false,
      error: error.message || 'Failed to set password expiration'
    };
  }
};

/**
 * Force password change on next login (admin function)
 */
export const forcePasswordChange = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      requirePasswordChange: true,
      updatedAt: serverTimestamp()
    });

    logger.info('Password change forced', { userId });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error forcing password change', error, { userId });
    
    return {
      success: false,
      error: error.message || 'Failed to force password change'
    };
  }
};

/**
 * Log password change activity
 */
const logPasswordChange = async (userId: string): Promise<void> => {
  try {
    // TODO: Implement activity logging when activityLogService is created
    logger.info('Password change activity', { userId, action: 'password_change' });

  } catch (error: any) {
    // Log error but don't fail the password change
    logger.error('Error logging password change activity', error, { userId });
  }
};

/**
 * Generate random password (for admin password resets)
 */
export const generateRandomPassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export default {
  validatePassword,
  changePassword,
  sendPasswordReset,
  checkPasswordExpiration,
  setPasswordExpiration,
  forcePasswordChange,
  generateRandomPassword
};
