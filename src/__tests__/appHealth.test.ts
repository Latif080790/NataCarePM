/**
 * 🧪 APPLICATION HEALTH CHECK TEST
 * Simple test to verify the application is functioning correctly
 */

import { describe, it, expect } from 'vitest';

describe('Application Health Check', () => {
  it('should pass basic health check', () => {
    // This is a simple test to ensure the testing environment is working
    expect(true).toBe(true);
  });

  it('should have required environment variables', () => {
    // Check that essential environment variables are defined
    expect(import.meta.env.VITE_FIREBASE_API_KEY).toBeDefined();
    expect(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN).toBeDefined();
    expect(import.meta.env.VITE_FIREBASE_PROJECT_ID).toBeDefined();
  });

  it('should have authentication service available', async () => {
    // Dynamically import the auth service to verify it can be loaded
    const { authService } = await import('../services/authService');
    expect(authService).toBeDefined();
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.register).toBe('function');
    expect(typeof authService.logout).toBe('function');
  });

  it('should have authentication context available', async () => {
    // Dynamically import the auth context to verify it can be loaded
    const { useAuth } = await import('../contexts/AuthContext');
    expect(useAuth).toBeDefined();
  });
});