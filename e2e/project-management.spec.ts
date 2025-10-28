import { test, expect } from '@playwright/test';

test.describe('Project Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('projectmanager@example.com');
    await page.getByPlaceholder('Password').fill('ProjectManager123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow project manager to create a new project', async ({ page }) => {
    // Act
    await page.getByRole('button', { name: 'Create Project' }).click();
    
    // Fill project form
    await page.getByPlaceholder('Project Name').fill('Test Construction Project');
    await page.getByPlaceholder('Location').fill('Jakarta, Indonesia');
    await page.getByLabel('Start Date').fill('2023-01-01');
    await page.getByLabel('End Date').fill('2023-12-31');
    await page.getByPlaceholder('Project Description').fill('A test construction project for E2E testing');
    
    // Submit form
    await page.getByRole('button', { name: 'Create Project' }).click();

    // Assert
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.getByText('Test Construction Project')).toBeVisible();
    await expect(page.getByText('Jakarta, Indonesia')).toBeVisible();
  });

  test('should allow adding daily report to project', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to daily reports section
    await page.getByRole('link', { name: 'Daily Reports' }).click();
    
    // Create new daily report
    await page.getByRole('button', { name: 'Add Daily Report' }).click();
    
    // Fill daily report form
    await page.getByLabel('Date').fill('2023-01-01');
    await page.getByLabel('Weather').selectOption('Cerah');
    await page.getByPlaceholder('Work progress notes').fill('Completed foundation work for day 1');
    
    // Add workforce
    await page.getByRole('button', { name: 'Add Worker' }).click();
    await page.getByPlaceholder('Worker Name').fill('John Doe');
    await page.getByLabel('Status').selectOption('Hadir');
    
    // Submit report
    await page.getByRole('button', { name: 'Submit Report' }).click();

    // Assert
    await expect(page.getByText('Daily report created successfully')).toBeVisible();
    await expect(page.getByText('2023-01-01')).toBeVisible();
  });

  test('should allow adding purchase order to project', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to purchase orders section
    await page.getByRole('link', { name: 'Purchase Orders' }).click();
    
    // Create new purchase order
    await page.getByRole('button', { name: 'Create PO' }).click();
    
    // Fill PO form
    await page.getByPlaceholder('PR Number').fill('PR-001');
    await page.getByPlaceholder('Description').fill('Cement for foundation work');
    
    // Add item
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByPlaceholder('Material Name').fill('Portland Cement');
    await page.getByPlaceholder('Quantity').fill('100');
    await page.getByPlaceholder('Unit').fill('bags');
    await page.getByPlaceholder('Unit Price').fill('50000');
    
    // Submit PO
    await page.getByRole('button', { name: 'Submit PO' }).click();

    // Assert
    await expect(page.getByText('Purchase order created successfully')).toBeVisible();
    await expect(page.getByText('PR-001')).toBeVisible();
  });

  test('should allow uploading project document', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to documents section
    await page.getByRole('link', { name: 'Documents' }).click();
    
    // Upload document
    await page.getByRole('button', { name: 'Upload Document' }).click();
    
    // Fill document form
    await page.getByPlaceholder('Document Name').fill('Foundation Plans');
    await page.getByLabel('Category').selectOption('Technical');
    await page.getByLabel('Upload Date').fill('2023-01-01');
    
    // Upload file (we'll mock this in tests)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'foundation-plans.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content mock', 'utf-8')
    });
    
    // Submit form
    await page.getByRole('button', { name: 'Upload' }).click();

    // Assert
    await expect(page.getByText('Document uploaded successfully')).toBeVisible();
    await expect(page.getByText('Foundation Plans')).toBeVisible();
  });
});