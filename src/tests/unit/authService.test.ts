/**
 * Authentication Service Tests - Vitest Edition
 *
 * Target Coverage: 95%+
 * Powered by Vitest for blazing-fast execution with full TypeScript support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  changePassword,
  reauthenticateUser,
  getPasswordHistory,
  getLastPasswordChange,
  type PasswordChangeRequest,
} from '../../src/api/authService';
import { Timestamp } from 'firebase/firestore';

// ========================================
// MOCKS
// ========================================

// Mock modules
vi.mock('../../src/utils/passwordValidator');
vi.mock('@/firebaseConfig');

// Import mocked modules to get typed mocks
import { validatePassword } from '../../src/utils/passwordValidator';
import { auth } from '@/firebaseConfig';
import * as firebaseAuth from 'firebase/auth';
import * as firebaseFirestore from 'firebase/firestore';
import * as bcrypt from 'bcryptjs';

// ========================================
// TEST SUITE
// ========================================

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('changePassword', () => {
    const validRequest: PasswordChangeRequest = {
      userId: 'user123',
      currentPassword: 'OldPass123!',
      newPassword: 'NewSecurePass123!@#',
    };

    const mockUser = {
      uid: 'user123',
      email: 'test@example.com',
    };

    it('should successfully change password with valid credentials', async () => {
      // Setup mocks
      (auth as any).currentUser = mockUser;

      vi.mocked(validatePassword).mockReturnValue({
        valid: true,
        score: 5,
        strength: 'very-strong',
        errors: [],
        warnings: [],
        suggestions: [],
        estimatedCrackTime: '1 year',
      });

      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ passwordHistory: [] }),
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as any);
      vi.mocked(firebaseAuth.EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(firebaseAuth.reauthenticateWithCredential).mockResolvedValue({} as any);
      vi.mocked(firebaseAuth.updatePassword).mockResolvedValue(undefined as any);
      vi.mocked(firebaseFirestore.updateDoc).mockResolvedValue(undefined as any);

      // Execute
      const result = await changePassword(validRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.success).toBe(true);
      expect(result.data?.passwordStrength).toBe(5);
      expect(result.message).toContain('berhasil');

      // Verify calls
      expect(firebaseAuth.updatePassword).toHaveBeenCalledWith(
        expect.objectContaining({ uid: 'user123' }),
        validRequest.newPassword
      );
      expect(firebaseFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should fail when user is not authenticated', async () => {
      (auth as any).currentUser = null;

      const result = await changePassword(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_AUTHENTICATED');
      expect(result.error?.message).toContain('tidak terautentikasi');
    });

    it('should fail when userId does not match current user', async () => {
      (auth as any).currentUser = { uid: 'different_user', email: 'other@test.com' };

      const result = await changePassword(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
      expect(result.error?.message).toContain('Tidak diizinkan');
    });

    it('should fail with weak password', async () => {
      (auth as any).currentUser = mockUser;

      vi.mocked(validatePassword).mockReturnValue({
        valid: false,
        score: 1,
        strength: 'weak',
        errors: ['Password terlalu pendek', 'Tidak ada simbol'],
        warnings: ['Tambahkan karakter khusus'],
        suggestions: ['Minimal 12 karakter'],
        estimatedCrackTime: 'Instant',
      });

      const result = await changePassword({
        ...validRequest,
        newPassword: 'weak',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEAK_PASSWORD');
      expect(result.error?.details?.errors).toContain('Password terlalu pendek');
    });

    it('should fail when new password equals current password', async () => {
      (auth as any).currentUser = mockUser;

      vi.mocked(validatePassword).mockReturnValue({
        valid: true,
        score: 4,
        strength: 'strong',
        errors: [],
        warnings: [],
        suggestions: [],
        estimatedCrackTime: '6 months',
      });

      const result = await changePassword({
        ...validRequest,
        newPassword: validRequest.currentPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SAME_PASSWORD');
      expect(result.error?.message).toContain('tidak boleh sama');
    });

    it('should fail when password was recently used (history check)', async () => {
      (auth as any).currentUser = mockUser;

      vi.mocked(validatePassword).mockReturnValue({
        valid: true,
        score: 4,
        strength: 'strong',
        errors: [],
        warnings: [],
        suggestions: [],
        estimatedCrackTime: '6 months',
      });

      // Use hashed password format that matches our bcrypt mock behavior
      // The new password is 'NewSecurePass123!@#', so we add a hashed version of it to history
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          passwordHistory: [
            { userId: 'user123', passwordHash: 'hashed_OldPassword1!', createdAt: new Date() },
            {
              userId: 'user123',
              passwordHash: 'hashed_NewSecurePass123!@#',
              createdAt: new Date(),
            },
          ],
        }),
      } as any);

      // bcrypt.compare will return true when comparing 'NewSecurePass123!@#' with 'hashed_NewSecurePass123!@#'
      // This simulates that the new password matches a hash in history
      vi.mocked(bcrypt.compare).mockImplementation((password: string, hash: string) => {
        return Promise.resolve(password === hash.replace('hashed_', ''));
      });

      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as any);

      const result = await changePassword(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PASSWORD_REUSED');
      expect(result.error?.message).toContain('sudah pernah digunakan');
    });

    it('should handle reauthentication failure', async () => {
      (auth as any).currentUser = mockUser;

      vi.mocked(validatePassword).mockReturnValue({
        valid: true,
        score: 4,
        strength: 'strong',
        errors: [],
        warnings: [],
        suggestions: [],
        estimatedCrackTime: '6 months',
      });

      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ passwordHistory: [] }),
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
      vi.mocked(firebaseAuth.EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(firebaseAuth.reauthenticateWithCredential).mockRejectedValue({
        code: 'auth/wrong-password',
      });

      const result = await changePassword(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WRONG_PASSWORD');
    });

    it('should handle Firebase weak-password error', async () => {
      (auth as any).currentUser = mockUser;

      vi.mocked(validatePassword).mockReturnValue({
        valid: true,
        score: 4,
        strength: 'strong',
        errors: [],
        warnings: [],
        suggestions: [],
        estimatedCrackTime: '6 months',
      });

      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ passwordHistory: [] }),
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
      vi.mocked(firebaseAuth.EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(firebaseAuth.reauthenticateWithCredential).mockResolvedValue({} as any);
      vi.mocked(firebaseAuth.updatePassword).mockRejectedValue({
        code: 'auth/weak-password',
      });

      const result = await changePassword(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WEAK_PASSWORD');
    });

    it('should handle requires-recent-login error', async () => {
      (auth as any).currentUser = mockUser;

      vi.mocked(validatePassword).mockReturnValue({
        valid: true,
        score: 4,
        strength: 'strong',
        errors: [],
        warnings: [],
        suggestions: [],
        estimatedCrackTime: '6 months',
      });

      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ passwordHistory: [] }),
      } as any);

      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
      vi.mocked(firebaseAuth.updatePassword).mockRejectedValue({
        code: 'auth/requires-recent-login',
      });

      const result = await changePassword(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('REQUIRES_RECENT_LOGIN');
      expect(result.error?.message).toContain('kadaluarsa');
    });
  });

  describe('reauthenticateUser', () => {
    const mockUser: any = {
      uid: 'user123',
      email: 'test@example.com',
    };

    it('should successfully reauthenticate with correct password', async () => {
      vi.mocked(firebaseAuth.EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(firebaseAuth.reauthenticateWithCredential).mockResolvedValue({} as any);

      const result = await reauthenticateUser(mockUser, 'CorrectPassword123!');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(firebaseAuth.EmailAuthProvider.credential).toHaveBeenCalledWith(
        'test@example.com',
        'CorrectPassword123!'
      );
    });

    it('should fail when user has no email', async () => {
      const userWithoutEmail: any = { uid: 'user123', email: null };

      const result = await reauthenticateUser(userWithoutEmail, 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_EMAIL');
    });

    it('should fail with wrong password', async () => {
      vi.mocked(firebaseAuth.EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(firebaseAuth.reauthenticateWithCredential).mockRejectedValue({
        code: 'auth/wrong-password',
      });

      const result = await reauthenticateUser(mockUser, 'WrongPassword');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WRONG_PASSWORD');
      expect(result.error?.message).toContain('salah');
    });

    it('should handle invalid-credential error', async () => {
      vi.mocked(firebaseAuth.EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(firebaseAuth.reauthenticateWithCredential).mockRejectedValue({
        code: 'auth/invalid-credential',
      });

      const result = await reauthenticateUser(mockUser, 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WRONG_PASSWORD');
    });

    it('should handle too-many-requests error', async () => {
      vi.mocked(firebaseAuth.EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(firebaseAuth.reauthenticateWithCredential).mockRejectedValue({
        code: 'auth/too-many-requests',
      });

      const result = await reauthenticateUser(mockUser, 'password');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TOO_MANY_REQUESTS');
      expect(result.error?.message).toContain('Terlalu banyak');
    });
  });

  describe('getPasswordHistory', () => {
    it('should return sanitized password history', async () => {
      // Create Timestamp instances that match Firestore behavior
      const timestamp1 = Timestamp.fromDate(new Date('2024-01-01'));
      const timestamp2 = Timestamp.fromDate(new Date('2024-01-02'));

      const mockHistory = [
        {
          userId: 'user123',
          passwordHash: 'actual_hash_1',
          createdAt: timestamp1, // Use Timestamp instance
        },
        {
          userId: 'user123',
          passwordHash: 'actual_hash_2',
          createdAt: timestamp2, // Use Timestamp instance
        },
      ];

      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ passwordHistory: mockHistory }),
      } as any);

      const result = await getPasswordHistory('user123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].passwordHash).toBe('***');
      expect(result.data?.[1].passwordHash).toBe('***');
      // Verify dates are preserved and converted from Timestamp
      expect(result.data?.[0].createdAt).toBeInstanceOf(Date);
      expect(result.data?.[1].createdAt).toBeInstanceOf(Date);
    });

    it('should fail when user not found', async () => {
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await getPasswordHistory('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });

    it('should return empty array when user has no history', async () => {
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      } as any);

      const result = await getPasswordHistory('user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle Firestore errors', async () => {
      vi.mocked(firebaseFirestore.getDoc).mockRejectedValue(new Error('Network error'));

      const result = await getPasswordHistory('user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_ERROR');
    });
  });

  describe('getLastPasswordChange', () => {
    it('should return last password change date', async () => {
      const lastChange = new Date('2024-01-15');

      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          lastPasswordChange: {
            toDate: () => lastChange,
          },
        }),
      } as any);

      const result = await getLastPasswordChange('user123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(lastChange);
    });

    it('should return null when password never changed', async () => {
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      } as any);

      const result = await getLastPasswordChange('user123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should fail when user not found', async () => {
      vi.mocked(firebaseFirestore.getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await getLastPasswordChange('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });

    it('should handle Firestore errors gracefully', async () => {
      vi.mocked(firebaseFirestore.getDoc).mockRejectedValue(new Error('Connection timeout'));

      const result = await getLastPasswordChange('user123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_ERROR');
    });
  });

  afterEach(() => {
    (auth as any).currentUser = null;
  });
});
