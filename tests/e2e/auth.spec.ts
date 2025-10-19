/**
 * E2E Test: Authentication Flow
 * 
 * Priority 2B: Test Coverage Expansion
 * 
 * Tests critical authentication paths:
 * - User login
 * - User logout
 * - Failed login attempts
 * - Password reset flow
 * - 2FA authentication
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

const INVALID_USER = {
  email: 'invalid@example.com',
  password: 'WrongPassword123!',
};

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/NataCarePM/);
    
    // Check login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check "Forgot Password" link
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill in login form
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/dashboard/);
    
    // Verify user is logged in (check for user menu or welcome message)
    await expect(page.getByText(/welcome/i).or(page.getByText(TEST_USER.name))).toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    // Fill in login form with invalid credentials
    await page.getByLabel(/email/i).fill(INVALID_USER.email);
    await page.getByLabel(/password/i).fill(INVALID_USER.password);
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for error message
    await expect(page.getByText(/invalid credentials|wrong password|user not found/i)).toBeVisible({ timeout: 5000 });
    
    // Verify we're still on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit without filling anything
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for validation errors
    await expect(page.getByText(/email.*required|please enter.*email/i)).toBeVisible();
    await expect(page.getByText(/password.*required|please enter.*password/i)).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.getByText(/forgot password/i).click();
    
    // Verify navigation to forgot password page
    await expect(page).toHaveURL(/forgot-password|reset-password/);
    
    // Verify forgot password form is visible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|send/i })).toBeVisible();
  });

  test('should successfully logout', async ({ page }) => {
    // First login
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Click user menu or logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();
    
    // Verify redirected to login page
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
    
    // Verify user is logged out (try accessing dashboard should redirect)
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should handle 2FA authentication', async ({ page }) => {
    // This test assumes 2FA is enabled for the test user
    // You may need to skip this test if 2FA is not configured
    
    // Login with credentials
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check if 2FA prompt appears
    const twoFAInput = page.getByLabel(/verification code|2fa code|authenticator code/i);
    
    if (await twoFAInput.isVisible({ timeout: 3000 })) {
      // 2FA is enabled - verify the prompt is shown
      await expect(twoFAInput).toBeVisible();
      await expect(page.getByText(/enter.*code|verification|authenticator/i)).toBeVisible();
      
      // Note: We can't test actual 2FA code submission without a valid code
      // This would require integration with a test authenticator
    } else {
      // 2FA is not enabled - should go directly to dashboard
      await expect(page).toHaveURL(/dashboard/);
    }
  });

  test('should prevent brute force attempts with rate limiting', async ({ page }) => {
    // Attempt multiple failed logins rapidly
    const attempts = 6; // Assuming rate limit is 5 attempts
    
    for (let i = 0; i < attempts; i++) {
      await page.getByLabel(/email/i).fill(INVALID_USER.email);
      await page.getByLabel(/password/i).fill(INVALID_USER.password);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Wait a bit between attempts
      await page.waitForTimeout(500);
    }
    
    // After multiple attempts, should see rate limit message
    await expect(
      page.getByText(/too many attempts|rate limit|try again later/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should persist session after page reload', async ({ page, context }) => {
    // Login
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Reload the page
    await page.reload();
    
    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/welcome/i).or(page.getByText(TEST_USER.name))).toBeVisible();
  });
});
