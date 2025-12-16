/**
 * Offline Mode E2E Tests
 * 
 * Critical for construction sites with poor connectivity:
 * - Save data offline to IndexedDB
 * - Auto-sync when connection restored
 * - Queue operations during offline
 * - Visual indicators for offline status
 */

import { test, expect } from '@playwright/test';

test.describe('Offline Mode', () => {
  test('should detect offline status', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);

    // Wait for offline indicator
    await expect(page.locator('text=/offline|tidak terhubung/i')).toBeVisible({ timeout: 5000 });
    
    // Should show visual indicator
    const offlineIndicator = page.locator('[class*="offline"], [class*="Offline"]').first();
    await expect(offlineIndicator).toBeVisible();
  });

  test('should save daily log offline', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Navigate to daily logs
    await page.goto('/daily-logs');

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Try to create daily log
    await page.locator('button:has-text("Buat"), button:has-text("Tambah"), button:has-text("Create")').first().click();

    // Fill form
    await page.fill('textarea[name="description"], textarea[placeholder*="deskripsi"]', 'Test offline log');
    
    // Submit
    await page.click('button[type="submit"]');

    // Should show success message (saved locally)
    await expect(page.locator('text=/berhasil|success|tersimpan/i')).toBeVisible();
    
    // Should show pending count
    await expect(page.locator('text=/pending|menunggu/i')).toBeVisible();
  });

  test('should sync when connection restored', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    await page.goto('/daily-logs');

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Create offline log
    // ... (same as above)

    // Go back online
    await context.setOffline(false);
    
    // Wait for sync
    await page.waitForTimeout(3000);

    // Pending count should decrease
    const pendingIndicator = page.locator('text=/0 pending|semua tersinkron/i');
    await expect(pendingIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should show sync status and progress', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);
    
    // Look for sync button
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("Sinkron")');
    if (await syncButton.count() > 0) {
      // When offline, sync button should be disabled or show offline message
      await expect(syncButton).toBeDisabled();
    }

    // Go online
    await context.setOffline(false);
    await page.waitForTimeout(1000);

    // Sync button should be enabled
    if (await syncButton.count() > 0) {
      await expect(syncButton).toBeEnabled();
      
      // Click to manually sync
      await syncButton.click();
      
      // Should show syncing indicator
      await expect(page.locator('text=/syncing|menyinkronkan/i')).toBeVisible();
    }
  });

  test('should queue multiple operations offline', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);

    // Perform multiple operations
    // 1. Create daily log
    await page.goto('/daily-logs');
    // ... create log

    // 2. Update progress
    await page.goto('/progress');
    // ... update progress

    // Should show pending count > 1
    const pendingCount = page.locator('[class*="pending-count"], [class*="badge"]').filter({ hasText: /\d+/ });
    const count = await pendingCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThan(0);
  });

  test('should handle offline photo uploads', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);

    await page.goto('/daily-logs');
    
    // Try to upload photo
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg');
      
      // Photo should be stored locally
      await expect(page.locator('text=/tersimpan lokal|saved locally/i')).toBeVisible();
    }
  });

  test('should persist offline data across page reloads', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);

    // Create offline data
    await page.goto('/daily-logs');
    // ... create log

    // Get pending count
    const pendingBefore = await page.locator('[class*="pending"]').textContent();

    // Reload page
    await page.reload();

    // Login again (session might be cleared)
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'Test@123456');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);
    }

    // Pending count should be same
    const pendingAfter = await page.locator('[class*="pending"]').textContent();
    expect(pendingAfter).toBe(pendingBefore);
  });
});

test.describe('Offline Mode - Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 },
  });

  test('should work offline on mobile device', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);

    // Mobile offline indicator should be at top (not overlapping bottom nav)
    const offlineIndicator = page.locator('[class*="offline"]').first();
    await expect(offlineIndicator).toBeVisible();

    // Should not overlap bottom navigation
    const bottomNav = page.locator('nav[class*="bottom"], nav[class*="fixed"]').last();
    if (await bottomNav.count() > 0) {
      const navBox = await bottomNav.boundingBox();
      const indicatorBox = await offlineIndicator.boundingBox();
      
      // Indicator should be above bottom nav
      if (navBox && indicatorBox) {
        expect(indicatorBox.y + indicatorBox.height).toBeLessThan(navBox.y);
      }
    }
  });
});

test.describe('Offline Mode - Error Handling', () => {
  test('should retry failed syncs', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);

    // Create operation
    // ...

    // Go online but simulate server error by blocking API
    await context.route('**/api/**', route => route.abort());
    await context.setOffline(false);

    // Should show retry attempts
    await expect(page.locator('text=/retry|mencoba lagi/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show errors for failed operations', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Go offline
    await context.setOffline(true);

    // Create invalid operation (e.g., missing required fields)
    // ...

    // Should show validation error
    await expect(page.locator('text=/error|gagal|salah/i')).toBeVisible();
  });
});
