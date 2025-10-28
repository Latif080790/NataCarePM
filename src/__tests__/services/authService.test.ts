import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from '@/services/authService';
import { APIResponse } from '@/utils/responseWrapper';
import { logger } from '@/utils/logger.enhanced';

// Mock Firebase auth
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();

vi.mock('@/firebaseConfig', () => ({
  auth: {
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
    sendPasswordResetEmail: mockSendPasswordResetEmail,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
  },
}));

// Mock logger
vi.mock('@/utils/logger.enhanced', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { uid: 'user123', email };
      const mockResponse: APIResponse<{ requires2FA?: boolean }> = {
        success: true,
        data: { requires2FA: false },
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), email, password);
      expect(logger.info).toHaveBeenCalledWith('User login attempt', { email });
    });

    it('should return requires2FA when 2FA is needed', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { uid: 'user123', email };
      const mockResponse: APIResponse<{ requires2FA?: boolean; pending2FAUserId?: string }> = {
        success: true,
        data: { requires2FA: true, pending2FAUserId: 'user123' },
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      // Mock that user requires 2FA
      vi.spyOn(authService as any, 'checkUser2FAStatus').mockResolvedValue(true);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.data?.requires2FA).toBe(true);
    });

    it('should handle login failure with invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const errorMessage = 'Invalid credentials';

      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const networkError = new Error('Network error');

      mockSignInWithEmailAndPassword.mockRejectedValue(networkError);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'password123';
      const name = 'New User';
      const mockUser = { uid: 'newuser123', email };
      const mockResponse: APIResponse<null> = {
        success: true,
        data: null,
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

      // Act
      const result = await authService.register(email, password, name);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        email,
        password
      );
      expect(logger.info).toHaveBeenCalledWith('New user registration', { email, name });
    });

    it('should handle registration failure with weak password', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const weakPassword = '123';
      const name = 'New User';
      const errorMessage = 'Password should be at least 6 characters';

      mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.register(email, weakPassword, name);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });

    it('should handle duplicate email registration', async () => {
      // Arrange
      const email = 'existing@example.com';
      const password = 'password123';
      const name = 'New User';
      const errorMessage = 'Email already in use';

      mockCreateUserWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.register(email, password, name);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });
  });

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      // Arrange
      const email = 'user@example.com';
      const mockResponse: APIResponse<null> = {
        success: true,
        data: null,
      };

      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      // Act
      const result = await authService.resetPassword(email);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), email);
      expect(logger.info).toHaveBeenCalledWith('Password reset requested', { email });
    });

    it('should handle password reset for non-existent email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const errorMessage = 'No user found with this email';

      mockSendPasswordResetEmail.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.resetPassword(email);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const mockResponse: APIResponse<null> = {
        success: true,
        data: null,
      };

      mockSignOut.mockResolvedValue(undefined);

      // Act
      const result = await authService.logout();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockSignOut).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User logged out');
    });

    it('should handle logout failure', async () => {
      // Arrange
      const errorMessage = 'Logout failed';

      mockSignOut.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.logout();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is authenticated', async () => {
      // Arrange
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(null);
        return vi.fn(); // unsubscribe function
      });

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });

    it('should return user data when user is authenticated', async () => {
      // Arrange
      const mockFirebaseUser = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      const mockAppUser = {
        uid: 'user123',
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        roleId: 'user',
        avatarUrl: 'https://example.com/photo.jpg',
        isOnline: true,
        permissions: [],
        lastSeen: expect.any(String),
      };

      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return vi.fn(); // unsubscribe function
      });

      // Mock user data fetch
      vi.spyOn(authService as any, 'fetchUserData').mockResolvedValue(mockAppUser);

      // Act
      const result = await authService.getCurrentUser();

      // Assert
      expect(result).toEqual(mockAppUser);
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';

      mockSignInWithEmailAndPassword.mockRejectedValue('Unexpected error type');

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('An unexpected error occurred');
    });

    it('should sanitize sensitive data in logs', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const errorMessage = 'Invalid credentials';

      mockSignInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));

      // Act
      await authService.login(email, password);

      // Assert
      expect(logger.error).toHaveBeenCalled();
      // Ensure password is not logged
      const logCalls = (logger.error as any).mock.calls;
      for (const call of logCalls) {
        expect(JSON.stringify(call)).not.toContain(password);
      }
    });
  });
});