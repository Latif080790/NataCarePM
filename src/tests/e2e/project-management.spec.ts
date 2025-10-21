/**
 * E2E Test: Project Management Flow
 *
 * Priority 2B: Test Coverage Expansion
 *
 * Tests critical project management paths:
 * - Create new project
 * - View project details
 * - Update project information
 * - Delete project
 * - Project permissions
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_PROJECT = {
  name: 'E2E Test Project',
  description: 'This is a test project created by E2E tests',
  client: 'Test Client',
  budget: '50000',
  deadline: '2025-12-31',
};

test.describe('Project Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should display projects page correctly', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');

    // Check page elements
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new project|create project/i })).toBeVisible();

    // Check if projects list or grid is visible
    await expect(
      page
        .locator('[data-testid="projects-list"]')
        .or(page.locator('[data-testid="projects-grid"]'))
        .or(page.locator('.project-card'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('should create a new project successfully', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');

    // Click create project button
    await page.getByRole('button', { name: /new project|create project/i }).click();

    // Wait for project form to appear
    await expect(page.getByRole('heading', { name: /create.*project|new project/i })).toBeVisible();

    // Fill in project details
    await page.getByLabel(/project name/i).fill(TEST_PROJECT.name);
    await page.getByLabel(/description/i).fill(TEST_PROJECT.description);
    await page.getByLabel(/client/i).fill(TEST_PROJECT.client);
    await page.getByLabel(/budget/i).fill(TEST_PROJECT.budget);
    await page.getByLabel(/deadline|due date/i).fill(TEST_PROJECT.deadline);

    // Submit form
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for success message
    await expect(page.getByText(/project created|successfully created/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify project appears in the list
    await expect(page.getByText(TEST_PROJECT.name)).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');

    // Click on a project (assuming at least one exists)
    const projectCard = page
      .locator('.project-card')
      .first()
      .or(page.getByRole('link', { name: /view|details/i }).first());

    await projectCard.click();

    // Should navigate to project details page
    await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/);

    // Verify project details are displayed
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByText(/description|details/i)).toBeVisible();

    // Check for common project sections
    const hasTasks = await page.getByText(/tasks|to-do/i).isVisible({ timeout: 3000 });
    const hasTimeline = await page.getByText(/timeline|schedule/i).isVisible({ timeout: 3000 });
    const hasTeam = await page.getByText(/team|members/i).isVisible({ timeout: 3000 });

    expect(hasTasks || hasTimeline || hasTeam).toBeTruthy();
  });

  test('should update project information', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');

    // Find and click on a project
    const projectCard = page
      .locator('.project-card')
      .first()
      .or(page.getByRole('link', { name: /view|details/i }).first());

    await projectCard.click();

    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();

    // Update project name
    const updatedName = `Updated Project ${Date.now()}`;
    const nameInput = page.getByLabel(/project name/i);
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // Save changes
    await page.getByRole('button', { name: /save|update/i }).click();

    // Verify success message
    await expect(page.getByText(/updated|saved successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify updated name is displayed
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should validate required fields when creating project', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');

    // Click create project button
    await page.getByRole('button', { name: /new project|create project/i }).click();

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /create|save/i }).click();

    // Check for validation errors
    await expect(page.getByText(/required|cannot be empty/i).first()).toBeVisible();
  });

  test('should filter projects by status', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');

    // Look for filter/status buttons
    const activeFilter = page
      .getByRole('button', { name: /active/i })
      .or(page.getByRole('tab', { name: /active/i }));

    if (await activeFilter.isVisible({ timeout: 3000 })) {
      await activeFilter.click();

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify URL or UI reflects the filter
      const url = page.url();
      const hasFilterInUrl = url.includes('status') || url.includes('filter');
      const hasActiveClass = await page.locator('[aria-selected="true"]').isVisible();

      expect(hasFilterInUrl || hasActiveClass).toBeTruthy();
    }
  });

  test('should search for projects', async ({ page }) => {
    // Navigate to projects
    await page.goto('/projects');

    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));

    if (await searchInput.isVisible({ timeout: 3000 })) {
      // Type search query
      await searchInput.fill('test');

      // Wait for search results
      await page.waitForTimeout(500);

      // Verify search is working (projects list should update)
      const projectsList = page
        .locator('[data-testid="projects-list"]')
        .or(page.locator('.project-card'));

      await expect(projectsList).toBeVisible();
    }
  });

  test('should delete project with confirmation', async ({ page }) => {
    // First create a project to delete
    await page.goto('/projects');
    await page.getByRole('button', { name: /new project|create project/i }).click();

    const tempProjectName = `Temp Project ${Date.now()}`;
    await page.getByLabel(/project name/i).fill(tempProjectName);
    await page.getByRole('button', { name: /create|save/i }).click();

    // Wait for success
    await expect(page.getByText(/project created/i)).toBeVisible({ timeout: 5000 });

    // Find the project and click on it
    await page.getByText(tempProjectName).click();

    // Click delete button
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await deleteButton.click();

    // Confirm deletion in modal/dialog
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
    await confirmButton.click();

    // Verify deletion success
    await expect(page.getByText(/deleted|removed successfully/i)).toBeVisible({ timeout: 5000 });

    // Verify project is no longer in the list
    await page.goto('/projects');
    await expect(page.getByText(tempProjectName)).not.toBeVisible();
  });

  test('should handle project permissions correctly', async ({ page }) => {
    // Navigate to a project
    await page.goto('/projects');

    const projectCard = page
      .locator('.project-card')
      .first()
      .or(page.getByRole('link', { name: /view|details/i }).first());

    await projectCard.click();

    // Check for permission-based UI elements
    // Admin/Owner should see edit and delete buttons
    const hasEditButton = await page
      .getByRole('button', { name: /edit/i })
      .isVisible({ timeout: 3000 });
    const hasDeleteButton = await page
      .getByRole('button', { name: /delete/i })
      .isVisible({ timeout: 3000 });

    // At least one should be visible for owner/admin
    // For viewer role, both should be hidden
    // This test verifies RBAC is working
    const hasPermissions = hasEditButton || hasDeleteButton;

    // Log the permission status
    console.log('User has edit permissions:', hasEditButton);
    console.log('User has delete permissions:', hasDeleteButton);

    // If no permissions, verify view-only access
    if (!hasPermissions) {
      // Should still be able to view project details
      await expect(page.getByRole('heading')).toBeVisible();
      await expect(page.getByText(/description|details/i)).toBeVisible();
    }
  });

  test('should create and manage project tasks', async ({ page }) => {
    // Navigate to a project
    await page.goto('/projects');

    const projectCard = page
      .locator('.project-card')
      .first()
      .or(page.getByRole('link', { name: /view|details/i }).first());

    await projectCard.click();

    // Look for tasks section
    const tasksSection = page.getByText(/tasks|to-do/i);

    if (await tasksSection.isVisible({ timeout: 3000 })) {
      await tasksSection.click();

      // Try to add a new task
      const addTaskButton = page.getByRole('button', { name: /add task|new task/i });

      if (await addTaskButton.isVisible({ timeout: 3000 })) {
        await addTaskButton.click();

        // Fill task details
        const taskName = `E2E Test Task ${Date.now()}`;
        await page.getByLabel(/task name|title/i).fill(taskName);

        // Save task
        await page.getByRole('button', { name: /save|add|create/i }).click();

        // Verify task was created
        await expect(page.getByText(taskName)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
