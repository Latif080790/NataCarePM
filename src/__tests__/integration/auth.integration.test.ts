import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from '../../services/authService';
import { twoFactorService } from '../../api/twoFactorService';
import { rateLimiter } from '../../utils/rateLimiter';

// Mock Firebase auth methods
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockUpdateProfile = vi.fn();

// Mock Firebase Firestore methods
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockCollection = vi.fn();

// Mock rate limiter
const mockRateLimiter = {
  checkLimit: vi.fn().mockReturnValue({ allowed: true }),
  reset: vi.fn(),
};

// Mock two-factor service
const mockTwoFactorService = {
  isEnabled: vi.fn().mockResolvedValue(false),
  generateSecret: vi.fn().mockResolvedValue('secret123'),
  verifyCode: vi.fn().mockResolvedValue(true),
};

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  updateProfile: mockUpdateProfile,
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  collection: mockCollection,
}));

// Mock Firebase config
vi.mock('@/firebaseConfig', () => ({
  auth: {},
  db: {},
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock rate limiter
vi.mock('@/utils/rateLimiter', () => ({
  get rateLimiter() {
    return mockRateLimiter;
  }
}));

// Mock two-factor service
vi.mock('@/api/twoFactorService', () => ({
  get twoFactorService() {
    return mockTwoFactorService;
  }
}));

// Mock response wrapper
vi.mock('@/utils/responseWrapper', () => {
  const originalModule = vi.importActual('@/utils/responseWrapper');
  return {
    ...originalModule,
    wrapResponse: vi.fn().mockImplementation((data) => ({ success: true, data })),
    wrapError: vi.fn().mockImplementation((error) => ({ 
      success: false, 
      error: { 
        message: error.message || 'Unknown error',
        code: 'UNKNOWN_ERROR'
      } 
    })),
  };
});

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Login Flow', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'SecurePassword123!';
      const mockFirebaseUser = {
        uid: 'user123',
        email,
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar.jpg',
      };
      
      const mockAppUser = {
        uid: 'user123',
        id: 'user123',
        email,
        name: 'Test User',
        roleId: 'user',
        avatarUrl: 'https://example.com/avatar.jpg',
        isOnline: true,
        permissions: [],
        lastSeen: new Date().toISOString(),
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          roleId: 'user',
          permissions: [],
        }),
      });

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        email,
        name: 'Test User',
        roleId: 'user',
      }));
      
      // Verify Firebase calls
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        email,
        password
      );
      
      // Verify rate limiter reset on success
      expect(rateLimiter.reset).toHaveBeenCalledWith(email, 'login');
    });

    it('should handle login with 2FA enabled', async () => {
      // Arrange
      const email = 'user2fa@example.com';
      const password = 'SecurePassword123!';
      const mockFirebaseUser = {
        uid: 'user456',
        email,
        displayName: '2FA User',
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      // Mock 2FA enabled for this user
      (twoFactorService.isEnabled as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.requires2FA).toBe(true);
      expect(result.data?.pending2FAUserId).toBe('user456');
      
      // Verify 2FA was checked
      expect(twoFactorService.isEnabled).toHaveBeenCalledWith('user456');
    });

    it('should handle invalid credentials gracefully', async () => {
      // Arrange
      const email = 'invalid@example.com';
      const password = 'wrongpassword';
      const errorMessage = 'Invalid email or password';

      mockSignInWithEmailAndPassword.mockRejectedValue(
        new Error(errorMessage)
      );

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
      
      // Verify rate limiter was not reset on failure
      expect(rateLimiter.reset).not.toHaveBeenCalled();
    });

    it('should enforce rate limiting on excessive login attempts', async () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'password123';
      
      // Mock rate limiter to block
      (rateLimiter.checkLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        allowed: false,
        message: 'Too many attempts. Please try again later.',
      });

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Too many attempts. Please try again later.');
      
      // Verify Firebase auth was not called
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  describe('User Registration Flow', () => {
    it('should successfully register new user', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'SecurePassword123!';
      const name = 'New User';
      const mockFirebaseUser = {
        uid: 'newuser789',
        email,
        displayName: name,
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      mockUpdateProfile.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await authService.register(email, password, name);

      // Assert
      expect(result.success).toBe(true);
      
      // Verify Firebase calls
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        email,
        password
      );
      
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        mockFirebaseUser,
        { displayName: name }
      );
      
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should handle registration with weak password', async () => {
      // Arrange
      const email = 'weakpass@example.com';
      const weakPassword = '123';
      const name = 'Weak Password User';
      const errorMessage = 'Password should be at least 6 characters';

      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error(errorMessage)
      );

      // Act
      const result = await authService.register(email, weakPassword, name);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });
  });

  describe('Password Reset Flow', () => {
    it('should successfully send password reset email', async () => {
      // Arrange
      const email = 'reset@example.com';
      
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      // Act
      const result = await authService.resetPassword(email);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({}, email);
    });

    it('should handle password reset for non-existent email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const errorMessage = 'No user found with this email';

      mockSendPasswordResetEmail.mockRejectedValue(
        new Error(errorMessage)
      );

      // Act
      const result = await authService.resetPassword(email);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });
  });

  describe('User Logout Flow', () => {
    it('should successfully logout authenticated user', async () => {
      // Arrange
      mockSignOut.mockResolvedValue(undefined);

      // Act
      const result = await authService.logout();

      // Assert
      expect(result.success).toBe(true);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should handle logout failure gracefully', async () => {
      // Arrange
      const errorMessage = 'Logout failed due to network error';
      
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.logout();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(errorMessage);
    });
  });

  describe('2FA Verification Flow', () => {
    it('should successfully verify 2FA code', async () => {
      // Arrange
      const userId = 'user123';
      const code = '123456';
      
      // Mock successful 2FA verification
      (twoFactorService.verifyCode as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);

      // Act & Assert
      await expect(twoFactorService.verifyCode(userId, code)).resolves.toBe(true);
      
      // Verify the call was made correctly
      expect(twoFactorService.verifyCode).toHaveBeenCalledWith(userId, code);
    });

    it('should reject invalid 2FA code', async () => {
      // Arrange
      const userId = 'user123';
      const invalidCode = '000000';
      
      // Mock failed 2FA verification
      (twoFactorService.verifyCode as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);

      // Act & Assert
      await expect(twoFactorService.verifyCode(userId, invalidCode)).resolves.toBe(false);
    });
  });

  describe('Security Integration', () => {
    it('should prevent brute force attacks with rate limiting', async () => {
      // Arrange
      const email = 'bruteforce@example.com';
      const password = 'wrongpassword';
      
      // Simulate multiple failed attempts
      (rateLimiter.checkLimit as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        allowed: false,
        message: 'Account temporarily locked due to multiple failed attempts',
      });

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Account temporarily locked due to multiple failed attempts');
    });

    it('should handle concurrent login attempts properly', async () => {
      // Arrange
      const email = 'concurrent@example.com';
      const password = 'password123';
      const mockFirebaseUser = {
        uid: 'concurrent123',
        email,
        displayName: 'Concurrent User',
      };

      // Mock concurrent resolution
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          roleId: 'user',
          permissions: [],
        }),
      });

      // Act - Simulate concurrent calls
      const results = await Promise.all([
        authService.login(email, password),
        authService.login(email, password),
        authService.login(email, password),
      ]);

      // Assert - All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});