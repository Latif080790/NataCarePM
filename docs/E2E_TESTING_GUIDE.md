# E2E Testing Guide - Playwright

## Table of Contents
1. [Overview](#overview)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Smoke Tests](#smoke-tests)
6. [Writing Tests](#writing-tests)
7. [Best Practices](#best-practices)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

NataCarePM uses [Playwright](https://playwright.dev/) for end-to-end testing. Playwright provides:
- **Cross-browser testing** (Chromium, Firefox, WebKit)
- **Mobile emulation** for responsive testing
- **Auto-waiting** for elements (no manual waits)
- **Screenshot/video recording** on failure
- **Network interception** for API mocking
- **Parallel execution** for fast test runs

### Test Coverage

| Test Suite | Purpose | Critical Flows |
|------------|---------|----------------|
| **Smoke Tests** | Verify critical user journeys work | Login, Project Creation, Transactions, Reports |
| **Authentication** | Login/logout, password reset, 2FA | User flows, error handling |
| **Project Management** | CRUD operations, workflows | Create, edit, view, delete projects |
| **Financial** | Transactions, budgets, reports | Income/expense, budget tracking |
| **Reports** | Generate and export reports | PDF export, date filtering |

---

## Setup

### 1. Install Dependencies

Playwright is already installed:
```bash
npm install
```

### 2. Install Browsers

Install Playwright browsers (Chromium, Firefox, WebKit):
```bash
npx playwright install
```

**Or install specific browser:**
```bash
npx playwright install chromium
```

---

### 3. Configure Test Environment

Copy `.env.test.example` to `.env.test`:
```bash
cp .env.test.example .env.test
```

Edit `.env.test`:
```env
VITE_APP_URL=http://localhost:4173
TEST_USER_EMAIL=test@natacare.com
TEST_USER_PASSWORD=Test123!@#
```

**Important:** Create a dedicated test user in Firebase:
1. Go to Firebase Console → Authentication
2. Add user with email `test@natacare.com`
3. Set password: `Test123!@#`
4. Assign necessary roles/permissions

---

### 4. Build Production App

Tests run against production build:
```bash
npm run build
```

---

## Running Tests

### Quick Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI (headed mode)
npm run test:e2e:headed

# Run tests with Playwright UI (recommended for development)
npm run test:e2e:ui

# Run smoke tests only
npx playwright test smoke

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

### Debug Mode

Run tests with Playwright Inspector:
```bash
npx playwright test --debug
```

**Features:**
- Step through tests line-by-line
- Inspect DOM at each step
- View network requests
- Edit selectors in real-time

---

### Generate Report

After tests run, view HTML report:
```bash
npx playwright show-report
```

---

## Test Structure

### Directory Layout

```
src/tests/e2e/
├── smoke.spec.ts           # Critical smoke tests (run before deploy)
├── auth.spec.ts            # Authentication flows
├── project-management.spec.ts  # Project CRUD operations
├── finance.spec.ts         # Transactions & budgets
├── reports.spec.ts         # Report generation
└── helpers/
    ├── login.ts            # Reusable login helper
    └── test-data.ts        # Test data generators
```

---

### Configuration

File: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './src/tests/e2e',
  timeout: 30000,
  retries: 2, // Retry failed tests
  workers: 4, // Parallel execution
  
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'mobile', use: devices['iPhone 13'] },
  ],
});
```

---

## Smoke Tests

### What are Smoke Tests?

Smoke tests verify that **critical user journeys** work end-to-end. Run these before every production deployment to catch regressions.

### Critical Flows Covered

1. **Authentication**
   - ✅ Login with valid credentials → Dashboard
   - ✅ Logout → Redirect to login
   - ✅ Invalid credentials → Error message

2. **Project Management**
   - ✅ Create new project → Success notification
   - ✅ View project details → Load all sections

3. **Financial Transactions**
   - ✅ Create transaction → Appears in list
   - ✅ Validation → Reject invalid amount

4. **Report Generation**
   - ✅ Generate budget report → Display or download
   - ✅ Export to PDF → File downloaded

5. **Dashboard**
   - ✅ Load all widgets → No errors
   - ✅ Navigate tabs → Content changes

6. **Search**
   - ✅ Search projects → Show results or "no results"

---

### Running Smoke Tests

```bash
# Run smoke tests only (fastest - ~2 minutes)
npx playwright test smoke

# Run smoke tests in all browsers
npx playwright test smoke --project=chromium --project=firefox
```

**Expected output:**
```
Running 12 tests using 4 workers
  ✓ [chromium] › smoke.spec.ts:35:3 › should login and logout successfully (5s)
  ✓ [chromium] › smoke.spec.ts:56:3 › should reject invalid credentials (2s)
  ...
  12 passed (28s)
```

---

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate to page, etc.
    await page.goto('/dashboard');
  });

  test('should perform action successfully', async ({ page }) => {
    // Arrange
    const button = page.locator('button:has-text("Click Me")');
    
    // Act
    await button.click();
    
    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

### Reusable Login Helper

File: `src/tests/e2e/helpers/login.ts`

```typescript
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}
```

**Usage:**
```typescript
import { login } from './helpers/login';

test('should access dashboard', async ({ page }) => {
  await login(page, 'test@natacare.com', 'Test123!@#');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

### Selectors Best Practices

**Priority order:**

1. **Data Test IDs** (most reliable)
   ```typescript
   page.locator('[data-testid="submit-button"]')
   ```

2. **Accessibility Attributes**
   ```typescript
   page.locator('[aria-label="Close dialog"]')
   page.getByRole('button', { name: 'Submit' })
   ```

3. **Text Content** (flexible)
   ```typescript
   page.locator('button:has-text("Save")')
   page.locator('text=/Success|Berhasil/i') // Regex for i18n
   ```

4. **CSS Selectors** (last resort)
   ```typescript
   page.locator('.submit-btn')
   ```

---

### Waiting Strategies

**Playwright auto-waits, but sometimes you need explicit waits:**

```typescript
// Wait for element to be visible
await expect(page.locator('.loading')).toBeVisible();

// Wait for element to disappear
await expect(page.locator('.loading')).not.toBeVisible();

// Wait for URL change
await page.waitForURL(/\/dashboard/);

// Wait for network request
await page.waitForResponse(resp => resp.url().includes('/api/projects'));

// Manual timeout (use sparingly)
await page.waitForTimeout(1000);
```

---

### Assertions

```typescript
// Visibility
await expect(page.locator('h1')).toBeVisible();
await expect(page.locator('.error')).not.toBeVisible();

// Text content
await expect(page.locator('h1')).toContainText('Dashboard');
await expect(page.locator('h1')).toHaveText('Dashboard Pro');

// Attributes
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('input')).toHaveValue('test@example.com');

// Count
await expect(page.locator('.project-card')).toHaveCount(5);

// URL
await expect(page).toHaveURL(/\/dashboard/);
await expect(page).toHaveURL('http://localhost:4173/dashboard');
```

---

## Best Practices

### DO ✅

1. **Use Page Object Model (POM)**
   ```typescript
   class LoginPage {
     constructor(private page: Page) {}
     
     async login(email: string, password: string) {
       await this.page.fill('input[name="email"]', email);
       await this.page.fill('input[name="password"]', password);
       await this.page.click('button[type="submit"]');
     }
   }
   ```

2. **Add Data Test IDs to Components**
   ```tsx
   <button data-testid="submit-btn">Submit</button>
   ```

3. **Test User Journeys, Not Implementation**
   - ✅ "User can create a project"
   - ❌ "Click button triggers handleSubmit function"

4. **Use Fixtures for Test Data**
   ```typescript
   test('should display project', async ({ page }) => {
     const project = {
       name: `Test Project ${Date.now()}`,
       description: 'Automated test',
     };
     // ... use project
   });
   ```

5. **Cleanup Test Data**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Delete test projects/transactions
     await cleanup(page);
   });
   ```

---

### DON'T ❌

1. **Don't Hardcode Wait Times**
   ```typescript
   // ❌ Bad
   await page.waitForTimeout(5000);
   
   // ✅ Good
   await expect(page.locator('.loading')).not.toBeVisible();
   ```

2. **Don't Test Third-Party Libraries**
   - ❌ Test Firebase Auth directly
   - ✅ Test your login flow integration

3. **Don't Use Brittle Selectors**
   ```typescript
   // ❌ Bad (breaks if styling changes)
   page.locator('.MuiButton-root-123')
   
   // ✅ Good
   page.locator('[data-testid="submit-btn"]')
   ```

4. **Don't Duplicate Test Logic**
   - Extract reusable helpers (login, create project, etc.)

5. **Don't Skip Assertions**
   ```typescript
   // ❌ Bad (no verification)
   await page.click('button');
   
   // ✅ Good
   await page.click('button');
   await expect(page.locator('text=Success')).toBeVisible();
   ```

---

## CI/CD Integration

### GitHub Actions Workflow

File: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Build app
        run: npm run build
      
      - name: Run smoke tests
        run: npx playwright test smoke
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - name: Upload test report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

### Pre-Deployment Check

Run smoke tests before every production deployment:

```bash
#!/bin/bash
# deploy.sh

# Build production
npm run build

# Start preview server
npm run preview &
SERVER_PID=$!
sleep 5

# Run smoke tests
npx playwright test smoke --project=chromium

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Smoke tests passed! Deploying..."
  firebase deploy
else
  echo "❌ Smoke tests failed! Deployment aborted."
  kill $SERVER_PID
  exit 1
fi

kill $SERVER_PID
```

---

## Troubleshooting

### Tests Fail Locally but Pass in CI

**Cause:** Different environment (screen size, timezone, etc.)

**Solution:**
```typescript
test.use({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  timezoneId: 'America/New_York',
});
```

---

### "Element not found" Errors

**Cause:** Element not rendered yet or wrong selector

**Solution:**
1. Check if element is inside a lazy-loaded component
   ```typescript
   await page.waitForSelector('[data-testid="component"]');
   ```

2. Use more flexible selectors
   ```typescript
   // Instead of exact text
   page.locator('text="Submit"')
   
   // Use regex for flexibility
   page.locator('text=/Submit|Save|Simpan/i')
   ```

---

### Tests are Flaky (Pass/Fail Randomly)

**Cause:** Race conditions, animations, network timing

**Solution:**
1. Enable retries in `playwright.config.ts`:
   ```typescript
   retries: 2
   ```

2. Wait for network idle:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. Disable animations:
   ```typescript
   await page.addStyleTag({ content: '* { animation: none !important; }' });
   ```

---

### Timeout Errors

**Cause:** Action takes longer than 30s default timeout

**Solution:**
```typescript
// Increase timeout for specific action
await page.click('button', { timeout: 60000 });

// Or set global timeout
test.setTimeout(60000);
```

---

### Authentication Issues

**Cause:** Test user doesn't have proper roles/permissions

**Solution:**
1. Create dedicated test user in Firebase
2. Assign all necessary roles
3. Use Firebase Admin SDK to create user programmatically:

```typescript
import { getAuth } from 'firebase-admin/auth';

await getAuth().createUser({
  email: 'test@natacare.com',
  password: 'Test123!@#',
  displayName: 'Test User',
});
```

---

## Summary

### Quick Reference

| Task | Command |
|------|---------|
| Run all tests | `npm run test:e2e` |
| Run smoke tests | `npx playwright test smoke` |
| Run with UI | `npm run test:e2e:ui` |
| Debug mode | `npx playwright test --debug` |
| Install browsers | `npx playwright install` |
| View report | `npx playwright show-report` |

### Test Coverage

- ✅ Smoke tests: 12 critical flows
- ✅ Authentication: Login, logout, errors
- ✅ Project management: CRUD operations
- ✅ Financial: Transactions, validation
- ✅ Reports: Generate, export PDF
- ✅ Dashboard: Widget loading, navigation

### Next Steps

1. Create `.env.test` with test credentials
2. Run `npx playwright install chromium`
3. Build app: `npm run build`
4. Run smoke tests: `npm run test:e2e:ui`
5. Add to CI/CD pipeline

---

**Updated:** 2024-01-15
**Version:** 1.0.0
**Author:** NataCarePM Team
