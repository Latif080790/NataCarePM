import { test, expect } from '@playwright/test';

test.describe('Finance Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as finance manager
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('financemanager@example.com');
    await page.getByPlaceholder('Password').fill('FinanceManager123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow finance manager to add project expense', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to finance section
    await page.getByRole('link', { name: 'Finance' }).click();
    
    // Create new expense
    await page.getByRole('button', { name: 'Add Expense' }).click();
    
    // Fill expense form
    await page.getByLabel('Date').fill('2023-01-01');
    await page.getByLabel('Amount').fill('5000000');
    await page.getByLabel('Category').selectOption('Material');
    await page.getByPlaceholder('Description').fill('Cement purchase for foundation');
    
    // Submit expense
    await page.getByRole('button', { name: 'Submit Expense' }).click();

    // Assert
    await expect(page.getByText('Expense added successfully')).toBeVisible();
    await expect(page.getByText('Rp5,000,000')).toBeVisible();
  });

  test('should allow approving pending expenses', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to finance section
    await page.getByRole('link', { name: 'Finance' }).click();
    
    // Find pending expense and approve it
    const expenseRow = page.getByText('Cement purchase for foundation').first();
    await expenseRow.getByRole('button', { name: 'Approve' }).click();
    
    // Confirm approval
    await page.getByRole('button', { name: 'Confirm Approval' }).click();

    // Assert
    await expect(page.getByText('Expense approved successfully')).toBeVisible();
    await expect(page.getByText('Approved')).toBeVisible();
  });

  test('should display financial summary correctly', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to finance section
    await page.getByRole('link', { name: 'Finance' }).click();
    
    // Check financial summary
    await expect(page.getByText('Total Budget')).toBeVisible();
    await expect(page.getByText('Total Expenses')).toBeVisible();
    await expect(page.getByText('Remaining Budget')).toBeVisible();
    
    // Check that values are displayed
    const totalBudget = await page.getByText(/Rp\d+/).first().textContent();
    const totalExpenses = await page.getByText(/Rp\d+/).nth(1).textContent();
    
    expect(totalBudget).not.toBeNull();
    expect(totalExpenses).not.toBeNull();
  });

  test('should allow adding termin payment', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to finance section
    await page.getByRole('link', { name: 'Finance' }).click();
    
    // Go to termin payments tab
    await page.getByRole('tab', { name: 'Termin Payments' }).click();
    
    // Create new termin
    await page.getByRole('button', { name: 'Add Termin' }).click();
    
    // Fill termin form
    await page.getByPlaceholder('Title').fill('Foundation Completion Payment');
    await page.getByLabel('Amount').fill('100000000');
    await page.getByLabel('Due Date').fill('2023-02-01');
    await page.getByPlaceholder('Notes').fill('Payment for foundation work completion');
    
    // Submit termin
    await page.getByRole('button', { name: 'Create Termin' }).click();

    // Assert
    await expect(page.getByText('Termin payment created successfully')).toBeVisible();
    await expect(page.getByText('Foundation Completion Payment')).toBeVisible();
    await expect(page.getByText('Rp100,000,000')).toBeVisible();
  });
});