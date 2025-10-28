import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow user to login with valid credentials', async ({ page }) => {
    // Arrange
    const email = 'test@example.com';
    const password = 'TestPassword123!';

    // Act
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Arrange
    const email = 'invalid@example.com';
    const password = 'wrongpassword';

    // Act
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Assert
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('should allow user to register', async ({ page }) => {
    // Arrange
    const name = 'Test User';
    const email = 'newuser@example.com';
    const password = 'SecurePassword123!';

    // Act
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByPlaceholder('Full Name').fill(name);
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Register' }).click();

    // Assert
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should allow user to logout', async ({ page }) => {
    // First login
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');

    // Act
    await page.getByRole('button', { name: 'User Menu' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    // Assert
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });
});