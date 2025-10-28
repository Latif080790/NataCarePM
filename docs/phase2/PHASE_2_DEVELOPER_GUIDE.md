# 🚀 PHASE 2 FEATURES - DEVELOPER GUIDE

This guide covers the newly implemented PWA, Testing, and Monitoring features (Priority 2A, 2B, 2C).

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [PWA Features](#pwa-features)
4. [Testing](#testing)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ All dependencies installed: `npm install --legacy-peer-deps`

---

## Environment Setup

### 1. Create Environment File

Copy the template and fill in your credentials:

```bash
cp .env.template .env
```

### 2. Required Credentials

#### Sentry (Error Tracking)

1. Sign up at [sentry.io](https://sentry.io/)
2. Create a new React project
3. Copy your DSN from **Settings → Client Keys (DSN)**
4. Add to `.env`:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   VITE_SENTRY_ENABLED=true  # Set to true to enable in dev
   ```

#### Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com/)
2. Create a new GA4 property
3. Create a web data stream
4. Copy the **Measurement ID** (starts with `G-`)
5. Add to `.env`:
   ```
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_GA4_ENABLED=true  # Set to true to enable in dev
   ```

#### VAPID Keys (Push Notifications)

1. Generate keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Add the **public key** to `.env`:
   ```
   VITE_VAPID_PUBLIC_KEY=your-public-key-here
   ```
3. Store the **private key** securely (use in backend/cloud functions)

---

## PWA Features

### Service Worker

The service worker automatically registers in **production mode** and provides:

- **Offline Support**: Cached assets available offline
- **Push Notifications**: Browser push notification support
- **Background Sync**: Queue actions when offline
- **Auto-Updates**: Prompts users when new version available

#### Test Service Worker

```bash
# Build for production
npm run build

# Serve production build
npm run preview

# Open browser and check:
# - DevTools → Application → Service Workers
# - Should see "Activated and running"
```

### PWA Install Prompt

Users will see an install prompt after 5 seconds (configurable). The prompt:

- Shows native install UI on Android/Desktop
- Shows step-by-step guide on iOS
- Has a 7-day dismiss cooldown
- Tracks installation in GA4

#### Customize Install Prompt

In `App.tsx`:

```typescript
<PWAInstallPrompt
  position="bottom-right"  // or bottom-left, top-right, top-left
  showInitialDelay={3000}  // milliseconds
  collectEmail={true}      // ask for email
  allowScreenshot={true}   // allow bug screenshots
/>
```

### Offline Page

When offline, users see a beautiful offline page at `/offline.html` with:

- Connection status indicator
- Auto-reload on reconnection
- List of available offline features

### Push Notifications

#### Subscribe to Push Notifications

```typescript
import { subscribeToPushNotifications } from './src/utils/pwa';

const subscribe = async () => {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const subscription = await subscribeToPushNotifications(vapidKey);

  if (subscription) {
    // Send subscription to your backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }
};
```

#### Send Push Notification (Backend)

```javascript
// Node.js backend example
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const payload = JSON.stringify({
  title: 'New Project Update',
  body: 'Task "Design Review" was completed',
  icon: '/icons/icon-192x192.png',
  data: { projectId: '123', taskId: '456' },
});

await webpush.sendNotification(subscription, payload);
```

---

## Testing

### E2E Tests (Playwright)

#### Run All E2E Tests

```bash
npm run test:e2e
```

#### Run with UI (Interactive Mode)

```bash
npm run test:e2e:ui
```

#### Run in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

#### Run Specific Test File

```bash
npx playwright test tests/e2e/auth.spec.ts
```

#### Run Specific Test

```bash
npx playwright test -g "should successfully login"
```

#### Generate Test Report

```bash
npx playwright show-report
```

### Unit Tests (Jest)

#### Run All Unit Tests

```bash
npm run test
```

#### Watch Mode

```bash
npm run test:watch
```

#### Coverage Report

```bash
npm run test:coverage
```

### Writing New Tests

#### E2E Test Example

Create `tests/e2e/my-feature.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login steps...
  });

  test('should do something', async ({ page }) => {
    await page.goto('/my-feature');
    await expect(page.getByText('Feature Title')).toBeVisible();
  });
});
```

#### Unit Test Example

Create `src/components/__tests__/MyComponent.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## Monitoring & Analytics

### Sentry (Error Tracking)

#### Manual Error Capture

```typescript
import { captureSentryException } from './src/config/sentry.config';

try {
  // Your code
} catch (error) {
  captureSentryException(error, {
    feature: 'project-creation',
    userId: currentUser.id,
  });
}
```

#### Add Breadcrumbs (Debug Trail)

```typescript
import { addSentryBreadcrumb } from './src/config/sentry.config';

addSentryBreadcrumb('user-action', 'User clicked save button', 'info', {
  formData: sanitizedData,
});
```

#### Set User Context

```typescript
import { setSentryUser, clearSentryUser } from './src/config/sentry.config';

// On login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.name,
  role: user.roleId,
});

// On logout
clearSentryUser();
```

#### Show Feedback Dialog

```typescript
import { showSentryFeedbackDialog } from './src/config/sentry.config';

// After an error occurs
showSentryFeedbackDialog();
```

### Google Analytics 4

#### Track Page Views

```typescript
import { trackPageView } from './src/config/ga4.config';

// Automatically tracked in App.tsx on navigation
// Manual tracking:
trackPageView('/custom-page', 'Custom Page Title');
```

#### Track Custom Events

```typescript
import { trackEvent } from './src/config/ga4.config';

trackEvent('User Action', 'Button Click', 'Save Button', 1);
```

#### Track Project Events

```typescript
import { ProjectEvents } from './src/config/ga4.config';

// Project created
ProjectEvents.created(projectId, projectType);

// Project viewed
ProjectEvents.viewed(projectId, projectType);

// Project updated
ProjectEvents.updated(projectId, 'budget');

// Project deleted
ProjectEvents.deleted(projectId);

// Project shared
ProjectEvents.shared(projectId, 'email');
```

#### Track Task Events

```typescript
import { TaskEvents } from './src/config/ga4.config';

TaskEvents.created(taskId, projectId);
TaskEvents.completed(taskId, projectId);
TaskEvents.updated(taskId, 'priority');
TaskEvents.deleted(taskId);
```

#### Track PWA Events

```typescript
import { PWAEvents } from './src/config/ga4.config';

PWAEvents.installed();
PWAEvents.promptShown();
PWAEvents.promptAccepted();
PWAEvents.pushEnabled();
```

### User Feedback Widget

The feedback widget is automatically displayed in the bottom-right corner. Users can:

- Report bugs
- Suggest improvements
- Rate their experience (1-5 stars)
- Provide general feedback

Feedback is automatically sent to:

- ✅ Sentry (for bugs and issues)
- ✅ Google Analytics 4 (for metrics)
- ⏳ Your backend API (TODO: implement)

---

## Troubleshooting

### Service Worker Issues

**Problem**: Service worker not registering

**Solution**:

1. Check you're in production mode: `npm run build && npm run preview`
2. Check browser console for errors
3. Verify `sw.js` is accessible at `/sw.js`
4. Clear cache and hard reload (Ctrl+Shift+R)

**Problem**: Old service worker cached

**Solution**:

```javascript
// Force update
await navigator.serviceWorker.ready.then((reg) => {
  reg.update();
});
```

### PWA Installation Issues

**Problem**: Install prompt not showing

**Solution**:

1. Verify you're using HTTPS or localhost
2. Check manifest.json is accessible
3. Verify all icons exist
4. Clear browser data and retry
5. Check browser support (Chrome, Edge work best)

**Problem**: iOS not showing prompt

**Solution**:
iOS doesn't support `beforeinstallprompt`. Users must:

1. Tap Share button
2. Select "Add to Home Screen"
3. Tap "Add"

Our prompt shows these instructions automatically on iOS.

### Sentry Issues

**Problem**: Sentry not capturing errors

**Solution**:

1. Verify DSN is correct in `.env`
2. Check `VITE_SENTRY_ENABLED=true`
3. Verify environment: errors are filtered in development
4. Check Sentry dashboard for blocked errors

**Problem**: Too many events in Sentry

**Solution**:
Adjust sample rates in `src/config/sentry.config.ts`:

```typescript
tracesSampleRate: 0.1,  // 10% sampling
replaysSessionSampleRate: 0.05,  // 5% sampling
```

### GA4 Issues

**Problem**: GA4 not tracking events

**Solution**:

1. Verify Measurement ID is correct
2. Check `VITE_GA4_ENABLED=true`
3. Use GA4 DebugView in real-time
4. Check browser console for `gtag` errors

**Problem**: Web Vitals not showing

**Solution**:
Web Vitals may take 24-48 hours to appear in GA4 dashboard.

### Test Issues

**Problem**: Playwright tests failing

**Solution**:

1. Install browsers: `npx playwright install`
2. Verify dev server is running
3. Check test credentials in test files
4. Run in headed mode to debug: `npm run test:e2e:headed`

**Problem**: Tests timeout

**Solution**:
Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 30000,
  navigationTimeout: 60000,
}
```

---

## 📚 Additional Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [GA4 Docs](https://developers.google.com/analytics/devguides/collection/ga4)
- [Playwright Docs](https://playwright.dev/)
- [Web Push Docs](https://web.dev/push-notifications-overview/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Search existing issues in the repository
3. Check browser console for error messages
4. Review Sentry error dashboard
5. Contact the development team

---

**Last Updated**: 2025-10-20  
**Version**: 1.0  
**Maintainer**: Development Team
