/**
 * 🧪 AUTH CONTEXT UNIT TESTS
 * Testing the authentication context provider and hooks
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

// Mock the authService
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_, callback) => {
    callback(null);
    return vi.fn();
  }),
  signOut: vi.fn(),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state correctly', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.requires2FA).toBe(false);
    expect(result.current.pending2FAUserId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle login successfully', async () => {
    const mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      roleId: 'admin',
    };

    (authService.login as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    // Note: currentUser will be set by the auth state listener, not directly by login
  });

  it('should handle login errors', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
  });

  it('should handle registration successfully', async () => {
    const mockUser = {
      uid: 'user123',
      email: 'newuser@example.com',
      name: 'New User',
      roleId: 'user',
    };

    (authService.register as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.register('newuser@example.com', 'password123', 'New User');
    });

    expect(authService.register).toHaveBeenCalledWith(
      'newuser@example.com',
      'password123',
      'New User'
    );
  });

  it('should handle logout successfully', async () => {
    (authService.logout as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should handle password reset successfully', async () => {
    (authService.resetPassword as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('should clear errors when clearError is called', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper,
    });

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
