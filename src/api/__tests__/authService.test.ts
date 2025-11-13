/**
 * Unit Tests for Authentication Service
 * 
 * Tests coverage:
 * - Login/Logout operations
 * - Token management (JWT)
 * - Password change operations
 * - Session management
 * - User permissions (RBAC)
 * - Authentication audit logging
 * 
 * Created: November 13, 2025 (Week 3 Day 3)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1699900000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
}));

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

// Mock Firebase config
vi.mock('@/firebaseConfig', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Mock logger
vi.mock('@/utils/logger.enhanced', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock getClientIP function used by authService
global.fetch = vi.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve('127.0.0.1'),
  })
) as any;

// Mock sessionStorage
global.sessionStorage = {
  getItem: vi.fn((key: string) => {
    if (key === 'sessionId') return 'session-123';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
} as any;

// Mock ROLES_CONFIG
vi.mock('@/constants', () => ({
  ROLES_CONFIG: {
    admin: {
      id: 'admin',
      name: 'Administrator',
      permissions: ['manage_users', 'view_all_projects', 'edit_rab'],
    },
    pm: {
      id: 'pm',
      name: 'Project Manager',
      permissions: ['view_projects', 'edit_rab', 'approve_po'],
    },
    viewer: {
      id: 'viewer',
      name: 'Viewer',
      permissions: ['view_projects'],
    },
  },
}));

describe('authService', () => {
  let authService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock global functions used by authService
    global.navigator = {
      userAgent: 'Test User Agent',
    } as any;

    // Dynamic import to get fresh instance
    const module = await import('../authService');
    authService = module.authService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== Login/Logout Operations ====================

  describe('Login Operations', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'Test@Pass123',
    };

    const mockUser = {
      uid: 'user-123',
      email: 'test@example.com',
      getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
      refreshToken: 'mock-refresh-token',
    };

    it('should login with valid credentials', async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await authService.login(mockCredentials);

      expect(result).toHaveProperty('accessToken', 'mock-id-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        mockCredentials.email,
        mockCredentials.password
      );
    });

    it('should reject invalid credentials', async () => {
      const authError = new Error('Invalid credentials');
      (authError as any).code = 'auth/invalid-credential';

      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(authError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Invalid credentials');
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });

    it('should create session on successful login', async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      await authService.login(mockCredentials);

      // Verify session creation
      expect(setDoc).toHaveBeenCalled();
    });

    it('should log authentication activity on login', async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      await authService.login(mockCredentials);

      // Verify audit logging (setDoc called for both session and activity)
      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle network errors during login', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'auth/network-request-failed';

      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(networkError);

      await expect(authService.login(mockCredentials)).rejects.toThrow('Network error');
    });

    it('should validate email format before login', async () => {
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'Test@Pass123',
      };

      const emailError = new Error('Invalid email');
      (emailError as any).code = 'auth/invalid-email';

      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(emailError);

      await expect(authService.login(invalidCredentials)).rejects.toThrow('Invalid email');
    });
  });

  describe('Logout Operations', () => {
    it('should logout successfully', async () => {
      const mockCurrentUser = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      // Mock auth.currentUser
      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = mockCurrentUser;

      vi.mocked(firebaseSignOut).mockResolvedValue(undefined);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          { id: 'session-1', ref: { path: 'sessions/session-1' } },
        ],
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await authService.logout();

      expect(firebaseSignOut).toHaveBeenCalled();
    });

    it('should invalidate all user sessions on logout', async () => {
      const mockCurrentUser = {
        uid: 'user-123',
      };

      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = mockCurrentUser;

      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          { id: 'session-1', ref: { path: 'sessions/session-1' } },
          { id: 'session-2', ref: { path: 'sessions/session-2' } },
        ],
      } as any);

      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(firebaseSignOut).mockResolvedValue(undefined);

      await authService.logout();

      // Verify both sessions invalidated
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should log logout activity', async () => {
      const mockCurrentUser = {
        uid: 'user-123',
      };

      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = mockCurrentUser;

      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(firebaseSignOut).mockResolvedValue(undefined);

      await authService.logout();

      // Verify audit log created
      expect(setDoc).toHaveBeenCalled();
    });

    it('should handle logout when no user logged in', async () => {
      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = null;

      vi.mocked(firebaseSignOut).mockResolvedValue(undefined);

      await expect(authService.logout()).resolves.toBeUndefined();
      expect(firebaseSignOut).toHaveBeenCalled();
    });
  });

  // ==================== Token Management ====================

  describe('Token Management', () => {
    it('should refresh access token', async () => {
      const mockUser = {
        uid: 'user-123',
        getIdToken: vi.fn().mockResolvedValue('new-access-token'),
      };

      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = mockUser;

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const newToken = await authService.refreshAccessToken();

      expect(newToken).toBe('new-access-token');
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true); // Force refresh
    });

    it('should throw error if no user logged in for token refresh', async () => {
      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = null;

      await expect(authService.refreshAccessToken()).rejects.toThrow('No user logged in');
    });

    it('should log token refresh activity', async () => {
      const mockUser = {
        uid: 'user-123',
        getIdToken: vi.fn().mockResolvedValue('new-token'),
      };

      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = mockUser;

      vi.mocked(setDoc).mockResolvedValue(undefined);

      await authService.refreshAccessToken();

      // Verify audit log
      expect(setDoc).toHaveBeenCalled();
    });

    it('should handle token refresh failure', async () => {
      const mockUser = {
        uid: 'user-123',
        getIdToken: vi.fn().mockRejectedValue(new Error('Token refresh failed')),
      };

      const { auth } = await import('@/firebaseConfig');
      (auth as any).currentUser = mockUser;

      vi.mocked(setDoc).mockResolvedValue(undefined);

      await expect(authService.refreshAccessToken()).rejects.toThrow('Token refresh failed');
      
      // Verify failure logged
      expect(setDoc).toHaveBeenCalled();
    });
  });

  // ==================== Password Change ====================

  describe('Password Change', () => {
    it('should change password with valid request', async () => {
      const mockChangePassword = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            success: true,
            message: 'Password changed successfully',
            passwordStrength: 85,
          },
        },
      });

      vi.mocked(getFunctions).mockReturnValue({} as any);
      vi.mocked(httpsCallable).mockReturnValue(mockChangePassword);

      const { changePassword } = await import('../authService');

      const result = await changePassword({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });

      expect(result.success).toBe(true);
      expect(result.data?.message).toMatch(/success/i);
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });
    });

    it('should reject weak passwords', async () => {
      const mockChangePassword = vi.fn().mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'Password too weak',
          },
        },
      });

      vi.mocked(getFunctions).mockReturnValue({} as any);
      vi.mocked(httpsCallable).mockReturnValue(mockChangePassword);

      const { changePassword } = await import('../authService');

      const result = await changePassword({
        currentPassword: 'OldPass@123',
        newPassword: 'weak',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/weak/i);
    });

    it('should reject incorrect current password', async () => {
      const functionError = new Error('Invalid current password');
      (functionError as any).code = 'functions/invalid-argument';

      const mockChangePassword = vi.fn().mockRejectedValue(functionError);

      vi.mocked(getFunctions).mockReturnValue({} as any);
      vi.mocked(httpsCallable).mockReturnValue(mockChangePassword);

      const { changePassword } = await import('../authService');

      const result = await changePassword({
        currentPassword: 'WrongPass@123',
        newPassword: 'NewPass@456',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_ARGUMENT');
    });

    it('should enforce password history (prevent reuse)', async () => {
      const mockChangePassword = vi.fn().mockResolvedValue({
        data: {
          success: false,
          error: {
            code: 'PASSWORD_REUSE',
            message: 'Cannot reuse recent passwords',
          },
        },
      });

      vi.mocked(getFunctions).mockReturnValue({} as any);
      vi.mocked(httpsCallable).mockReturnValue(mockChangePassword);

      const { changePassword } = await import('../authService');

      const result = await changePassword({
        currentPassword: 'CurrentPass@123',
        newPassword: 'OldPass@123', // Reused password
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/reuse/i);
    });

    it('should handle permission denied errors', async () => {
      const functionError = new Error('Permission denied');
      (functionError as any).code = 'functions/permission-denied';

      const mockChangePassword = vi.fn().mockRejectedValue(functionError);

      vi.mocked(getFunctions).mockReturnValue({} as any);
      vi.mocked(httpsCallable).mockReturnValue(mockChangePassword);

      const { changePassword } = await import('../authService');

      const result = await changePassword({
        currentPassword: 'Pass@123',
        newPassword: 'NewPass@456',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });
  });

  // ==================== Session Management ====================

  describe('Session Management', () => {
    it('should validate active session', async () => {
      // Mock getCurrentSessionId to return valid session
      global.sessionStorage = {
        getItem: vi.fn().mockReturnValue('session-123'),
      } as any;

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 60000)), // Future
        }),
      } as any);

      const { validateSession } = await import('../authService');
      const isValid = await validateSession('session-123');

      expect(isValid).toBe(true);
      expect(getDoc).toHaveBeenCalled();
    });

    it('should reject expired session', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() - 60000)), // Past
        }),
      } as any);

      const { validateSession } = await import('../authService');
      const isValid = await validateSession('session-123');

      expect(isValid).toBe(false);
    });

    it('should reject inactive session', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          isActive: false,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 60000)),
        }),
      } as any);

      const { validateSession } = await import('../authService');
      const isValid = await validateSession('session-123');

      expect(isValid).toBe(false);
    });

    it('should reject non-existent session', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const { validateSession } = await import('../authService');
      const isValid = await validateSession('invalid-session');

      expect(isValid).toBe(false);
    });

    it('should validate current session via authService', async () => {
      global.sessionStorage = {
        getItem: vi.fn().mockReturnValue('session-123'),
      } as any;

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          isActive: true,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 60000)),
        }),
      } as any);

      const isValid = await authService.validateSession();

      expect(isValid).toBe(true);
    });

    it('should return false if no session ID in storage', async () => {
      global.sessionStorage = {
        getItem: vi.fn().mockReturnValue(null),
      } as any;

      const isValid = await authService.validateSession();

      expect(isValid).toBe(false);
    });
  });

  // ==================== User Permissions (RBAC) ====================

  describe('RBAC Permissions', () => {
    it('should get user permissions by role', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          roleId: 'admin',
        }),
      } as any);

      const { getUserPermissions } = await import('../authService');
      const permissions = await getUserPermissions('user-123');

      expect(permissions).toContain('manage_users');
      expect(permissions).toContain('view_all_projects');
      expect(permissions).toContain('edit_rab');
    });

    it('should return empty permissions for invalid user', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const { getUserPermissions } = await import('../authService');
      const permissions = await getUserPermissions('invalid-user');

      expect(permissions).toEqual([]);
    });

    it('should return empty permissions for unknown role', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          roleId: 'unknown-role',
        }),
      } as any);

      const { getUserPermissions } = await import('../authService');
      const permissions = await getUserPermissions('user-123');

      expect(permissions).toEqual([]);
    });

    it('should get user role', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          roleId: 'pm',
        }),
      } as any);

      const { getUserRole } = await import('../authService');
      const role = await getUserRole('user-123');

      expect(role).toBe('pm');
    });

    it('should return null for user without role', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      } as any);

      const { getUserRole } = await import('../authService');
      const role = await getUserRole('user-123');

      expect(role).toBeNull();
    });

    it('should differentiate permissions by role', async () => {
      // Admin permissions
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ roleId: 'admin' }),
      } as any);

      const { getUserPermissions } = await import('../authService');
      const adminPerms = await getUserPermissions('admin-user');

      // Viewer permissions
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ roleId: 'viewer' }),
      } as any);

      const viewerPerms = await getUserPermissions('viewer-user');

      expect(adminPerms.length).toBeGreaterThan(viewerPerms.length);
      expect(viewerPerms).toContain('view_projects');
      expect(viewerPerms).not.toContain('manage_users');
    });
  });

  // ==================== getCurrentUser ====================

  describe('getCurrentUser', () => {
    it('should return current user if logged in', () => {
      const mockCurrentUser = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      const { auth } = require('@/firebaseConfig');
      auth.currentUser = mockCurrentUser;

      const currentUser = authService.getCurrentUser();

      expect(currentUser).toBe(mockCurrentUser);
      expect(currentUser?.uid).toBe('user-123');
    });

    it('should return null if no user logged in', () => {
      const { auth } = require('@/firebaseConfig');
      auth.currentUser = null;

      const currentUser = authService.getCurrentUser();

      expect(currentUser).toBeNull();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle concurrent login attempts', async () => {
      const mockUser = {
        uid: 'user-123',
        getIdToken: vi.fn().mockResolvedValue('token'),
        refreshToken: 'refresh-token',
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const credentials = { email: 'test@example.com', password: 'Pass@123' };

      const [result1, result2] = await Promise.all([
        authService.login(credentials),
        authService.login(credentials),
      ]);

      expect(result1).toHaveProperty('accessToken');
      expect(result2).toHaveProperty('accessToken');
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(2);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(200) + '@123';
      const mockChangePassword = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: { success: true, message: 'Success' },
        },
      });

      vi.mocked(getFunctions).mockReturnValue({} as any);
      vi.mocked(httpsCallable).mockReturnValue(mockChangePassword);

      const { changePassword } = await import('../authService');

      const result = await changePassword({
        currentPassword: 'Old@123',
        newPassword: longPassword,
      });

      expect(result.success).toBe(true);
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'Old@123',
        newPassword: longPassword,
      });
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+filter@sub-domain.example.com';
      const mockUser = {
        uid: 'user-special',
        getIdToken: vi.fn().mockResolvedValue('token'),
        refreshToken: 'refresh-token',
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await authService.login({
        email: specialEmail,
        password: 'Pass@123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        specialEmail,
        'Pass@123'
      );
    });

    it('should handle Firestore write failures gracefully', async () => {
      const mockUser = {
        uid: 'user-123',
        getIdToken: vi.fn().mockResolvedValue('token'),
        refreshToken: 'refresh-token',
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      // Simulate Firestore write failure
      vi.mocked(setDoc).mockRejectedValue(new Error('Firestore write failed'));

      await expect(authService.login({
        email: 'test@example.com',
        password: 'Pass@123',
      })).rejects.toThrow('Firestore write failed');
    });

    it('should handle null timestamp gracefully', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          isActive: true,
          expiresAt: null, // Null timestamp
        }),
      } as any);

      const { validateSession } = await import('../authService');
      const isValid = await validateSession('session-null-timestamp');

      expect(isValid).toBe(false);
    });
  });
});
