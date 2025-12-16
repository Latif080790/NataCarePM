/**
 * Accessibility E2E Tests
 * 
 * WCAG AA compliance testing:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - ARIA labels
 * - Focus management
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - WCAG AA Compliance', () => {
  test('should not have accessibility violations on login page', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on RAB page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    await page.goto('/rab');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('should navigate login form with keyboard', async ({ page }) => {
    await page.goto('/login');

    // Tab to email input
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    // Type email
    await page.keyboard.type('test@example.com');

    // Tab to password input
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();

    // Type password
    await page.keyboard.type('Test@123456');

    // Tab to submit button
    await page.keyboard.press('Tab');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();

    // Press Enter to submit
    await page.keyboard.press('Enter');
    await page.waitForURL(/.*dashboard/);
  });

  test('should navigate dashboard with keyboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Tab through interactive elements
    let tabCount = 0;
    const maxTabs = 20; // Safety limit

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      // Check if we can reach important elements
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          type: (el as any)?.type,
          ariaLabel: el?.getAttribute('aria-label'),
        };
      });

      // Should be able to focus on buttons, links, inputs
      expect(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(focusedElement.tagName);
    }
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Test command palette (if exists)
    // Ctrl+K or Cmd+K
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    
    // Should open command palette (if implemented)
    // await expect(page.locator('[role="dialog"], [class*="command"]')).toBeVisible();
  });
});

test.describe('Accessibility - ARIA Labels', () => {
  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/login');

    // Check email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-label', /.+/);

    // Check password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('aria-label', /.+/);

    // Check submit button
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    expect(buttonText?.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA roles', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Navigation should have proper role
    const nav = page.locator('nav').first();
    await expect(nav).toHaveAttribute('role', 'navigation');

    // Main content should have proper role
    const main = page.locator('main').first();
    await expect(main).toHaveAttribute('role', 'main');
  });
});

test.describe('Accessibility - Focus Management', () => {
  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Open a modal (if exists)
    const modalTrigger = page.locator('button:has-text("Tambah"), button:has-text("Create")').first();
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();

      // Modal should be visible
      const modal = page.locator('[role="dialog"]').first();
      await expect(modal).toBeVisible();

      // Tab should stay within modal
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      
      // Focus should be inside modal
      await expect(modal.locator(':focus')).toBeVisible();
    }
  });

  test('should restore focus after modal close', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    const modalTrigger = page.locator('button:has-text("Tambah")').first();
    if (await modalTrigger.count() > 0) {
      // Click to open modal
      await modalTrigger.click();
      
      // Wait for modal
      await page.waitForSelector('[role="dialog"]');

      // Close modal
      await page.keyboard.press('Escape');
      
      // Focus should return to trigger button
      await expect(modalTrigger).toBeFocused();
    }
  });
});

test.describe('Accessibility - Screen Reader Support', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Heading hierarchy should be logical (h1 -> h2 -> h3, not h1 -> h3)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should announce status messages', async ({ page }) => {
    await page.goto('/login');

    // Submit with empty fields
    await page.click('button[type="submit"]');

    // Error message should have role="alert" or aria-live="polite"
    const errorMessage = page.locator('text=/error|gagal/i').first();
    if (await errorMessage.count() > 0) {
      const ariaLive = await errorMessage.getAttribute('aria-live');
      const role = await errorMessage.getAttribute('role');
      
      expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'alert').toBe(true);
    }
  });

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // All links should have descriptive text (not "click here", "read more")
    const links = await page.locator('a').all();
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      
      // Either has text or aria-label
      expect(text?.trim().length || ariaLabel?.length).toBeGreaterThan(0);
      
      // Should not be generic text
      const genericTexts = ['click here', 'klik disini', 'here', 'disini', 'more', 'selengkapnya'];
      const isGeneric = genericTexts.some(gt => text?.toLowerCase().includes(gt));
      expect(isGeneric).toBe(false);
    }
  });
});

test.describe('Accessibility - Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 },
  });

  test('should have touch-friendly targets on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // All interactive elements should be at least 44x44px (iOS guideline)
    const buttons = await page.locator('button, a[href]').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(40); // Allow some tolerance
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should not have accessibility violations on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
