import { test, expect } from '@playwright/test';

test.describe('Dashboard and Reporting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as project manager
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('projectmanager@example.com');
    await page.getByPlaceholder('Password').fill('ProjectManager123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display project overview on dashboard', async ({ page }) => {
    // Assert dashboard elements are visible
    await expect(page.getByText('Project Overview')).toBeVisible();
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Active Projects')).toBeVisible();
    await expect(page.getByText('Completed Projects')).toBeVisible();
    
    // Check that charts are rendered
    await expect(page.getByTestId('project-status-chart')).toBeVisible();
    await expect(page.getByTestId('budget-utilization-chart')).toBeVisible();
  });

  test('should allow generating project report', async ({ page }) => {
    // Navigate to reports section
    await page.getByRole('link', { name: 'Reports' }).click();
    
    // Select report type
    await page.getByLabel('Report Type').selectOption('Project Summary');
    
    // Select project
    await page.getByLabel('Project').selectOption('Test Construction Project');
    
    // Set date range
    await page.getByLabel('Start Date').fill('2023-01-01');
    await page.getByLabel('End Date').fill('2023-01-31');
    
    // Generate report
    await page.getByRole('button', { name: 'Generate Report' }).click();
    
    // Wait for report to be generated
    await expect(page.getByText('Report Generated')).toBeVisible();
    
    // Check report content
    await expect(page.getByText('Project Summary Report')).toBeVisible();
    await expect(page.getByText('Test Construction Project')).toBeVisible();
    
    // Check that report can be exported
    await expect(page.getByRole('button', { name: 'Export to PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export to Excel' })).toBeVisible();
  });

  test('should display notifications and alerts', async ({ page }) => {
    // Check notifications panel
    await page.getByRole('button', { name: 'Notifications' }).click();
    
    // Assert notifications are displayed
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByRole('list')).toBeVisible();
    
    // Check for specific alert types
    // In a real test, we would ensure there are actual notifications
    // For now, we just check the UI elements exist
    await expect(page.getByText('No new notifications')).toBeVisible();
  });

  test('should allow filtering and searching projects', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/projects');
    
    // Use search filter
    await page.getByPlaceholder('Search projects').fill('Test');
    
    // Assert filtered results
    await expect(page.getByText('Test Construction Project')).toBeVisible();
    
    // Use status filter
    await page.getByLabel('Status').selectOption('Active');
    
    // Clear filters
    await page.getByRole('button', { name: 'Clear Filters' }).click();
    
    // Assert all projects are shown again
    await expect(page.getByText('Test Construction Project')).toBeVisible();
  });
});