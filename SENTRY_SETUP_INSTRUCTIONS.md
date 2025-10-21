# Sentry Error Tracking Setup

## Overview

Sentry has been integrated into NataCarePM for production error tracking and monitoring.

## Installation

### 1. Install Sentry Package

```bash
npm install @sentry/react
```

### 2. Configure Environment Variables

Add to your `.env.local` file:

```env
# Sentry Error Tracking (Production Only)
VITE_SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
VITE_APP_VERSION=1.0.0
```

### 3. Get Your Sentry DSN

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (React)
3. Copy your DSN from Settings > Projects > [Your Project] > Client Keys
4. Paste into `.env.local`

## Features Implemented

### 1. Automatic Error Tracking

- All unhandled errors are automatically captured
- React error boundary integration
- Network error filtering
- Browser extension error filtering

### 2. Manual Error Capture

```typescript
import { logger } from './utils/logger';

// Capture exception with context
logger.captureException(error, {
  feature: 'purchase-orders',
  action: 'create',
  userId: currentUser.id,
});
```

### 3. Breadcrumbs

```typescript
import { logger } from './utils/logger';

// Add breadcrumb for debugging
logger.addBreadcrumb('User clicked create button', 'user-action', 'info');
```

### 4. User Context

```typescript
import { logger } from './utils/logger';

// Set user context (useful for tracking which users encounter errors)
logger.setUser({
  id: user.id,
  email: user.email,
  username: user.displayName,
});

// Clear user context (on logout)
logger.clearUser();
```

### 5. Performance Monitoring

- 10% of transactions are sampled
- Tracks page load times
- API call performance
- Component render performance

### 6. Session Replay

- 10% of normal sessions
- 100% of sessions with errors
- All sensitive data is masked

## Usage in Code

### Logger Integration

The existing logger automatically sends errors to Sentry in production:

```typescript
import { logger } from './utils/logger';

// These will be sent to Sentry in production
logger.error('Failed to create PO:', error);
logger.warn('Budget threshold exceeded');
```

### React Component Error Boundary

```typescript
// In your main App.tsx or index.tsx
import { getSentryErrorBoundary } from './utils/sentryInit';

const SentryErrorBoundary = await getSentryErrorBoundary();

function App() {
  return (
    <SentryErrorBoundary fallback={<ErrorFallbackComponent />}>
      <YourApp />
    </SentryErrorBoundary>
  );
}
```

### Try-Catch with Sentry

```typescript
try {
  await someRiskyOperation();
} catch (error) {
  logger.captureException(error as Error, {
    operation: 'someRiskyOperation',
    params: {
      /* relevant data */
    },
  });
  throw error; // Re-throw if needed
}
```

## Development vs Production

- **Development**: Sentry is NOT loaded (zero overhead)
- **Production**: Sentry is loaded only when `VITE_SENTRY_DSN` is set

## Testing Sentry Integration

### 1. Test in Production Build

```bash
npm run build
npm run preview
```

### 2. Trigger a Test Error

```typescript
// Add a button in your app
<button onClick={() => {
  throw new Error('Sentry test error');
}}>
  Test Sentry
</button>
```

### 3. Check Sentry Dashboard

- Go to sentry.io
- Navigate to Issues
- You should see your test error appear within seconds

## Best Practices

### 1. Contextual Information

Always provide context when capturing errors:

```typescript
logger.captureException(error, {
  feature: 'material-requests',
  action: 'approve',
  mrId: mr.id,
  userId: currentUser.id,
  projectId: project.id,
});
```

### 2. Add Breadcrumbs

Add breadcrumbs before critical operations:

```typescript
logger.addBreadcrumb('Starting MR approval', 'workflow', 'info');
const result = await approveMR(mrId);
logger.addBreadcrumb('MR approved successfully', 'workflow', 'info');
```

### 3. Filter Sensitive Data

Sentry is configured to mask all text and inputs in session replays. Additional filtering in `sentryInit.ts`:

```typescript
beforeSend(event, hint) {
  // Remove sensitive data from event
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
  }
  return event;
}
```

### 4. User Privacy

```typescript
// Set user context without PII
logger.setUser({
  id: user.id, // OK
  email: user.email, // Consider hashing in production
  // username: user.phoneNumber // Avoid PII
});
```

## Configuration Options

Edit `utils/sentryInit.ts` to customize:

- **Sample Rate**: Adjust `tracesSampleRate` (0.0 to 1.0)
- **Ignored Errors**: Add to `ignoreErrors` array
- **Filtered URLs**: Add to `denyUrls` array
- **Custom Integrations**: Add to `integrations` array

## Monitoring & Alerts

### Sentry Dashboard

- **Issues**: See all errors with stack traces
- **Performance**: Monitor slow transactions
- **Releases**: Track errors by version
- **Alerts**: Set up email/Slack notifications

### Recommended Alerts

1. **New Issue**: Alert when a new error type appears
2. **Regression**: Alert when a previously resolved error returns
3. **Spike**: Alert when error count suddenly increases
4. **Threshold**: Alert when error rate exceeds X%

## Cost Optimization

### Free Tier

- 5,000 errors/month
- 10,000 performance units/month
- 50 replays/month

### Optimize Usage

1. **Reduce Sample Rates**: Lower `tracesSampleRate` to 0.05 (5%)
2. **Filter Noisy Errors**: Add common errors to `ignoreErrors`
3. **Disable Replays**: Set `replaysSessionSampleRate: 0`
4. **Use Quotas**: Set per-project quotas in Sentry settings

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check `VITE_SENTRY_DSN` is set
2. Verify DSN is correct
3. Ensure running production build (`npm run build`)
4. Check browser console for Sentry initialization message
5. Check Sentry project settings (inbound filters)

### Too Many Errors

1. Add common errors to `ignoreErrors`
2. Use `beforeSend` to filter out false positives
3. Set up rate limiting in Sentry project settings

### Sentry Not Loading

- Sentry is only loaded in production when `VITE_SENTRY_DSN` is set
- Check network tab for Sentry API calls
- Verify no ad blockers are blocking Sentry

## Support

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/react/
- NataCarePM Issue: Create GitHub issue with [Sentry] prefix
