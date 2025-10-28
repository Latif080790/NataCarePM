import { test, expect } from '@playwright/test';

test.describe('Logistics Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as logistics manager
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('logistics@example.com');
    await page.getByPlaceholder('Password').fill('Logistics123!');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should allow creating goods receipt from purchase order', async ({ page }) => {
    // Navigate to existing project
    await page.goto('/projects');
    await page.getByText('Test Construction Project').click();
    
    // Go to logistics section
    await page.getByRole('link', { name: 'Logistics' }).click();
    
    // Create goods receipt
    await page.getByRole('button', { name: 'Create Goods Receipt' }).click();
    
    // Select purchase order
    await page.getByLabel('Purchase Order').selectOption('PR-001');
    
    // Fill receipt details
    await page.getByLabel('Receipt Date').fill('2023-01-01');
    await page.getByPlaceholder('Delivery Note').fill('DN-001');
    await page.getByPlaceholder('Vehicle Number').fill('B1234XYZ');
    await page.getByPlaceholder('Driver Name').fill('John Doe');
    
    // Verify items from PO are pre-filled
    await expect(page.getByText('Portland Cement')).toBeVisible();
    await expect(page.getByText('100')).toBeVisible();
    
    // Submit goods receipt
    await page.getByRole('button', { name: 'Submit Receipt' }).click();

    // Assert
    await expect(page.getByText('Goods receipt created successfully')).toBeVisible();
    await expect(page.getByText('GR-')).toBeVisible(); // GR number should be generated
  });

  test('should allow adding item to inventory', async ({ page }) => {
    // Navigate to inventory section
    await page.goto('/inventory');
    
    // Create new inventory item
    await page.getByRole('button', { name: 'Add Item' }).click();
    
    // Fill item details
    await page.getByPlaceholder('Item Name').fill('Sand');
    await page.getByLabel('Category').selectOption('Raw Materials');
    await page.getByPlaceholder('Description').fill('Construction sand');
    await page.getByLabel('Base Unit').fill('cubic meters');
    await page.getByLabel('Quantity').fill('50');
    await page.getByLabel('Unit Price').fill('200000');
    await page.getByPlaceholder('Supplier').fill('Sand Supplier Co.');
    
    // Submit item
    await page.getByRole('button', { name: 'Add to Inventory' }).click();

    // Assert
    await expect(page.getByText('Item added to inventory successfully')).toBeVisible();
    await expect(page.getByText('Sand')).toBeVisible();
    await expect(page.getByText('50 cubic meters')).toBeVisible();
  });

  test('should show low stock alerts', async ({ page }) => {
    // Navigate to inventory section
    await page.goto('/inventory');
    
    // Check for low stock alerts
    await page.getByRole('tab', { name: 'Low Stock' }).click();
    
    // Assert that low stock items are displayed
    // In a real test, we would ensure some items have low stock
    // For now, we just check the UI elements exist
    await expect(page.getByText('Low Stock Items')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should allow recording inventory transaction', async ({ page }) => {
    // Navigate to inventory section
    await page.goto('/inventory');
    
    // Find an item and record transaction
    const itemRow = page.getByText('Portland Cement').first();
    await itemRow.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Record Transaction' }).click();
    
    // Fill transaction form
    await page.getByLabel('Transaction Type').selectOption('out');
    await page.getByLabel('Quantity').fill('10');
    await page.getByPlaceholder('Reason').fill('Used in foundation work');
    await page.getByLabel('Date').fill('2023-01-01');
    
    // Submit transaction
    await page.getByRole('button', { name: 'Record Transaction' }).click();

    // Assert
    await expect(page.getByText('Transaction recorded successfully')).toBeVisible();
    // The quantity should be updated (50 - 10 = 40)
    // This would be checked in a more comprehensive test
  });
});