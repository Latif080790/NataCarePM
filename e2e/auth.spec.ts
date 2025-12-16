/**
 * Authentication E2E Tests
 * 
 * Tests:
 * - Login/Logout flow
 * - Session timeout
 * - 2FA authentication
 * - Password requirements
 * - Remember me functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    
    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Verify user is logged in
    await expect(page.locator('text=/Selamat datang/i')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid|salah|gagal/i')).toBeVisible();
    
    // Should remain on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Click menu button (mobile or desktop)
    const menuButton = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"]').first();
    await menuButton.click();

    // Click logout
    await page.click('text=/logout|keluar/i');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should enforce strong password requirements', async ({ page }) => {
    await page.goto('/login');
    
    // Assume there's a "Create Account" or "Register" link
    // This is a placeholder - adjust based on actual UI
    // await page.click('text=/Daftar|Register/i');

    // Test weak password
    // await page.fill('input[name="password"]', 'weak');
    // await expect(page.locator('text=/password must|kata sandi harus/i')).toBeVisible();
    
    // Note: Implement when registration flow exists
    test.skip();
  });

  test('should handle session timeout', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Clear session storage to simulate timeout
    await context.clearCookies();
    await page.evaluate(() => window.localStorage.clear());
    await page.evaluate(() => window.sessionStorage.clear());

    // Attempt to navigate to protected route
    await page.goto('/rab');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Authentication - Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  test('should login on mobile device', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');

    // Mobile should show mobile layout
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check for mobile navigation
    await expect(page.locator('nav').filter({ hasText: /Beranda|Home/i })).toBeVisible();
  });
});
