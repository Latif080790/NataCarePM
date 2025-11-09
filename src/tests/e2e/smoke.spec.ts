/**
 * Smoke Tests - Critical User Flows
 * 
 * These tests verify that the most critical user journeys work end-to-end.
 * Run before every production deployment.
 * 
 * Critical flows:
 * 1. Login → Dashboard
 * 2. Create Project
 * 3. Create Transaction
 * 4. Generate Report
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:4173';
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@natacare.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!@#',
  name: 'Test User'
};

// Reusable login helper
async function login(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Test Suite 1: Authentication Flow
 * Verifies: Login → Dashboard → Logout
 */
test.describe('Smoke Test: Authentication', () => {
  test('should login and logout successfully', async ({ page }) => {
    // Login
    await login(page);
    
    // Verify dashboard loaded
    await expect(page.locator('h1')).toContainText(/Dashboard|Beranda/, { timeout: 5000 });
    
    // Verify user menu visible
    const userMenu = page.locator('[data-testid="user-menu"], [aria-label="User menu"]').first();
    await expect(userMenu).toBeVisible();
    
    // Logout
    await userMenu.click();
    await page.click('button:has-text("Logout"), button:has-text("Keluar")');
    
    // Verify redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Try invalid login
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/Invalid|Gagal|Error/i')).toBeVisible({ timeout: 5000 });
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });
});

/**
 * Test Suite 2: Project Management Flow
 * Verifies: Login → Create Project → View Project
 */
test.describe('Smoke Test: Project Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new project', async ({ page }) => {
    // Navigate to projects (might be on dashboard already)
    const createButton = page.locator('button:has-text("Create Project"), button:has-text("Buat Proyek")').first();
    
    // If not visible, navigate to projects page
    if (!(await createButton.isVisible())) {
      await page.click('a[href*="/project"], a:has-text("Projects"), a:has-text("Proyek")');
      await page.waitForTimeout(1000);
    }
    
    // Click create project button
    await createButton.click();
    
    // Fill project form
    const projectName = `Smoke Test Project ${Date.now()}`;
    await page.fill('input[name="name"], input[placeholder*="nama"]', projectName);
    await page.fill('input[name="description"], textarea[name="description"]', 'Automated smoke test');
    
    // Select project type (if dropdown exists)
    const typeSelect = page.locator('select[name="type"], select[name="projectType"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 }); // Select first option after default
    }
    
    // Set budget (if field exists)
    const budgetInput = page.locator('input[name="budget"]');
    if (await budgetInput.isVisible()) {
      await budgetInput.fill('100000000');
    }
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Buat")');
    
    // Wait for success notification or redirect
    await expect(
      page.locator('text=/Success|Berhasil|Created/i, [role="alert"]')
    ).toBeVisible({ timeout: 10000 });
    
    // Verify project appears in list
    await expect(page.locator(`text="${projectName}"`)).toBeVisible({ timeout: 5000 });
  });

  test('should view project details', async ({ page }) => {
    // Navigate to projects
    await page.click('a[href*="/project"], a:has-text("Projects"), a:has-text("Proyek")');
    await page.waitForTimeout(1000);
    
    // Click first project in list
    const firstProject = page.locator('[data-testid="project-card"], .project-card, tr').first();
    await firstProject.click();
    
    // Verify project detail page loaded
    await expect(
      page.locator('h1, h2, [data-testid="project-title"]')
    ).toBeVisible({ timeout: 5000 });
    
    // Verify tabs or sections exist
    await expect(
      page.locator('text=/Overview|Details|Transactions|Timeline|Ringkasan/i')
    ).toBeVisible();
  });
});

/**
 * Test Suite 3: Financial Transaction Flow
 * Verifies: Login → Navigate to Finance → Create Transaction
 */
test.describe('Smoke Test: Transaction Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should create a new transaction', async ({ page }) => {
    // Navigate to finance/cashflow page
    await page.click('a[href*="/finance"], a[href*="/cashflow"], a:has-text("Finance"), a:has-text("Keuangan")');
    await page.waitForTimeout(1000);
    
    // Click create transaction button
    const createButton = page.locator('button:has-text("Add Transaction"), button:has-text("Tambah Transaksi")').first();
    await createButton.click();
    
    // Fill transaction form
    await page.fill('input[name="description"], input[placeholder*="description"]', 'Smoke test transaction');
    await page.fill('input[name="amount"]', '500000');
    
    // Select transaction type (income/expense)
    const typeSelect = page.locator('select[name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('expense');
    }
    
    // Select category (if exists)
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }
    
    // Set date (if exists)
    const dateInput = page.locator('input[type="date"], input[name="date"]');
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Simpan")');
    
    // Wait for success notification
    await expect(
      page.locator('text=/Success|Berhasil|Added/i, [role="alert"]')
    ).toBeVisible({ timeout: 10000 });
    
    // Verify transaction appears in list
    await expect(page.locator('text="Smoke test transaction"')).toBeVisible({ timeout: 5000 });
  });

  test('should validate transaction amount', async ({ page }) => {
    // Navigate to finance page
    await page.click('a[href*="/finance"], a[href*="/cashflow"]');
    await page.waitForTimeout(1000);
    
    // Click create transaction
    const createButton = page.locator('button:has-text("Add Transaction"), button:has-text("Tambah Transaksi")').first();
    await createButton.click();
    
    // Try to submit with empty amount
    await page.fill('input[name="description"]', 'Invalid transaction');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(
      page.locator('text=/required|wajib|invalid/i, [role="alert"]')
    ).toBeVisible({ timeout: 5000 });
  });
});

/**
 * Test Suite 4: Report Generation Flow
 * Verifies: Login → Navigate to Reports → Generate Report
 */
test.describe('Smoke Test: Report Generation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should generate a budget report', async ({ page }) => {
    // Navigate to reports page
    await page.click('a[href*="/report"], a:has-text("Reports"), a:has-text("Laporan")');
    await page.waitForTimeout(1000);
    
    // Select report type (budget summary)
    const reportTypeSelect = page.locator('select[name="reportType"], select[name="type"]').first();
    if (await reportTypeSelect.isVisible()) {
      await reportTypeSelect.selectOption(/budget|anggaran/i);
    }
    
    // Set date range (if exists)
    const startDate = page.locator('input[name="startDate"], input[name="dateFrom"]');
    const endDate = page.locator('input[name="endDate"], input[name="dateTo"]');
    
    if (await startDate.isVisible()) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      await startDate.fill(firstDay.toISOString().split('T')[0]);
      await endDate.fill(today.toISOString().split('T')[0]);
    }
    
    // Click generate button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Buat Laporan")').first();
    await generateButton.click();
    
    // Wait for report to load (either inline or download)
    await page.waitForTimeout(3000);
    
    // Verify report content or download started
    const reportContent = page.locator('[data-testid="report-content"], .report-viewer, canvas, table');
    const downloadNotification = page.locator('text=/Download|Generated|Berhasil/i');
    
    const hasContent = await reportContent.isVisible().catch(() => false);
    const hasNotification = await downloadNotification.isVisible().catch(() => false);
    
    expect(hasContent || hasNotification).toBeTruthy();
  });

  test('should export report to PDF', async ({ page }) => {
    // Navigate to reports page
    await page.click('a[href*="/report"]');
    await page.waitForTimeout(1000);
    
    // Generate a simple report
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Buat")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    
    // Click export/download PDF button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("PDF"), button:has-text("Download")').first();
    await exportButton.click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify file name
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});

/**
 * Test Suite 5: Dashboard Health Check
 * Verifies: Dashboard loads all critical widgets
 */
test.describe('Smoke Test: Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should load all dashboard widgets', async ({ page }) => {
    // Already on dashboard after login
    
    // Check for key dashboard elements
    const widgets = [
      'text=/Project|Proyek/i',
      'text=/Budget|Anggaran/i',
      'text=/Transaction|Transaksi/i',
      'canvas, svg', // Charts
    ];
    
    for (const selector of widgets) {
      await expect(page.locator(selector).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate between dashboard tabs', async ({ page }) => {
    // Look for tabs/sections
    const tabs = page.locator('[role="tab"], .tab, button[data-tab]');
    const tabCount = await tabs.count();
    
    if (tabCount > 1) {
      // Click second tab
      await tabs.nth(1).click();
      await page.waitForTimeout(500);
      
      // Verify content changed (no errors)
      await expect(page.locator('body')).not.toContainText(/Error|Failed/i);
    }
  });
});

/**
 * Test Suite 6: Search & Navigation
 * Verifies: Global search works
 */
test.describe('Smoke Test: Search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should search for projects', async ({ page }) => {
    // Find search input (global search or project search)
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Cari"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Verify results loaded (or no results message)
      const hasResults = await page.locator('[data-testid="search-results"], .search-result').isVisible().catch(() => false);
      const noResults = await page.locator('text=/No results|Tidak ditemukan/i').isVisible().catch(() => false);
      
      expect(hasResults || noResults).toBeTruthy();
    }
  });
});
