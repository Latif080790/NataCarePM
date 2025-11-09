# Sentry Error Monitoring Setup Guide

## Overview

Sentry provides real-time error tracking, performance monitoring, and session replay for NataCarePM. This guide covers complete setup, configuration, and best practices.

## Quick Start

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up (free tier available: 5,000 errors/month)
3. Create new project:
   - Platform: **React**
   - Alert frequency: **On every new issue**
   - Project name: **NataCarePM**

### 2. Get DSN (Data Source Name)

1. After project creation, copy DSN from project settings
2. Format: `https://xxxxxxxxxxxxx@xxxxxxx.ingest.sentry.io/xxxxxxx`
3. Add to `.env.local`:
   ```bash
   VITE_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
   VITE_SENTRY_ENVIRONMENT=production
   VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

### 3. Install Dependencies

```bash
npm install --save @sentry/react
```

### 4. Deploy & Verify

1. Deploy to production
2. Trigger a test error
3. Check Sentry dashboard for captured error

## Features Implemented

### ✅ Core Error Tracking

- **Automatic error capture**: All unhandled exceptions
- **Promise rejection tracking**: Catches async errors
- **Stack traces**: With source maps in production
- **Error grouping**: Similar errors grouped together
- **Deduplication**: Prevents duplicate error reports

### ✅ Performance Monitoring

- **Transaction tracking**: Page loads, API calls
- **LCP, FID, CLS**: Core Web Vitals monitoring
- **Custom transactions**: Track specific operations
- **Sample rate**: 10% of transactions (configurable)

### ✅ Session Replay

- **Video-like playback**: See what user did before error
- **Privacy-first**: All text/inputs masked
- **10% of sessions**: Recorded for analysis
- **100% of error sessions**: Every error has replay

### ✅ Breadcrumbs

- **User actions**: Clicks, navigations, inputs
- **Console logs**: Error and assert levels
- **Network requests**: API calls and responses
- **State changes**: Route changes, auth events
- **Custom breadcrumbs**: App-specific events

### ✅ Context & Tags

- **User context**: ID, email, username
- **App version**: Track errors by release
- **Environment**: production, staging, development
- **Custom tags**: Feature flags, experiments

### ✅ Privacy & Security

- **Sensitive data filtering**: Passwords, tokens, API keys
- **Header sanitization**: Authorization, Cookie headers
- **Breadcrumb filtering**: Sensitive console logs
- **PII scrubbing**: Automatic removal of personal data

## Configuration Details

### Environment Variables

```bash
# Required
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Optional (with defaults)
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1  # 0.0 to 1.0
VITE_APP_VERSION=1.0.0
```

### Sentry Init Configuration

```typescript
// src/utils/sentryInit.ts
Sentry.init({
  dsn: VITE_SENTRY_DSN,
  environment: 'production',
  release: 'natacare-pm@1.0.0',
  
  // Performance
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Session Replay
  replaysSessionSampleRate: 0.1,  // 10% of sessions
  replaysOnErrorSampleRate: 1.0,  // 100% with errors
  
  // Privacy
  beforeSend: sanitizeEvent,
  beforeBreadcrumb: sanitizeBreadcrumb,
  
  // Filtering
  ignoreErrors: [...],
  denyUrls: [...],
});
```

### Sample Rates Explained

| Rate | Sessions/Day | Cost Impact | Use Case |
|------|--------------|-------------|----------|
| 0.0 | 0 | Free | Disabled |
| 0.1 | 10% | Low | Production (recommended) |
| 0.5 | 50% | Medium | Staging/testing |
| 1.0 | 100% | High | Development only |

**Recommendation**: 0.1 (10%) for production, 1.0 (100%) for development

## Using Sentry in Code

### 1. Manual Error Capture

```typescript
import { captureException } from '@/utils/sentryInit';

try {
  // Risky operation
  await dangerousFunction();
} catch (error) {
  captureException(error as Error, {
    context: 'project_creation',
    projectId: '123',
  });
}
```

### 2. Custom Messages

```typescript
import { captureMessage } from '@/utils/sentryInit';

captureMessage('User completed onboarding', 'info');
captureMessage('High memory usage detected', 'warning');
captureMessage('Critical database error', 'error');
```

### 3. Add Breadcrumbs

```typescript
import { addBreadcrumb } from '@/utils/sentryInit';

// User action
addBreadcrumb('User clicked Create Project', 'user', {
  buttonId: 'create-project-btn',
});

// State change
addBreadcrumb('Auth state changed', 'auth', {
  userId: user.id,
  action: 'login',
});

// API call
addBreadcrumb('API request sent', 'http', {
  url: '/api/projects',
  method: 'POST',
});
```

### 4. Set User Context

```typescript
// In AuthContext after login
import Sentry from '@sentry/react';

Sentry.setUser({
  id: user.uid,
  email: user.email,
  username: user.name,
});

// On logout
Sentry.setUser(null);
```

### 5. Add Custom Tags

```typescript
import Sentry from '@sentry/react';

Sentry.setTag('feature_flag_new_ui', 'enabled');
Sentry.setTag('user_plan', 'premium');
Sentry.setTag('browser_version', navigator.userAgent);
```

## Error Filtering

### Ignored Errors

These errors are automatically filtered and NOT sent to Sentry:

1. **Browser Extensions**
   - Chrome extension errors
   - Firefox addon errors
   - Safari extension errors

2. **Network Errors**
   - `Failed to fetch`
   - `NetworkError`
   - `Network request failed`

3. **User Cancellations**
   - `User denied`
   - `User cancelled`
   - Firebase popup closed

4. **Expected Errors**
   - ResizeObserver warnings
   - Script error (cross-origin)
   - React DevTools

### Custom Filtering

```typescript
// beforeSend hook
beforeSend(event, hint) {
  // Filter by error message
  if (event.exception?.values?.[0]?.value?.includes('Expected error')) {
    return null; // Don't send to Sentry
  }
  
  // Filter by context
  if (event.tags?.environment === 'development') {
    return null;
  }
  
  return event; // Send to Sentry
}
```

## Privacy & Data Sanitization

### Automatic Sanitization

```typescript
beforeSend(event) {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
    delete event.request.headers['Cookie'];
  }
  
  // Sanitize URLs with API keys
  if (event.request?.url) {
    event.request.url = event.request.url.replace(
      /apiKey=[^&]+/,
      'apiKey=[REDACTED]'
    );
  }
  
  return event;
}
```

### Breadcrumb Sanitization

```typescript
beforeBreadcrumb(breadcrumb) {
  // Remove sensitive console logs
  if (breadcrumb.category === 'console') {
    const message = breadcrumb.message || '';
    if (message.includes('password') || message.includes('token')) {
      return null; // Don't capture
    }
  }
  
  // Sanitize API keys in URLs
  if (breadcrumb.data?.url?.includes('apiKey')) {
    breadcrumb.data.url = breadcrumb.data.url.replace(
      /apiKey=[^&]+/,
      'apiKey=[REDACTED]'
    );
  }
  
  return breadcrumb;
}
```

### Session Replay Privacy

```typescript
new Sentry.Replay({
  maskAllText: true,        // Hide all text content
  blockAllMedia: true,      // Block images/videos
  maskAllInputs: true,      // Hide input values
})
```

## Source Maps Setup

### 1. Generate Source Maps

```json
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true,  // Enable in production
  },
});
```

### 2. Upload to Sentry

```bash
# Install Sentry CLI
npm install --save-dev @sentry/vite-plugin

# Configure Vite
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: "your-org",
      project: "natacare-pm",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

### 3. Set Release in Sentry

```typescript
Sentry.init({
  release: `natacare-pm@${process.env.VITE_APP_VERSION}`,
});
```

## Alerts & Notifications

### 1. Email Alerts

**Setup:**
1. Sentry Dashboard → Alerts → Create Alert Rule
2. Conditions:
   - When: A new issue is created
   - If: environment equals production
3. Actions:
   - Send email to: dev@yourcompany.com

### 2. Slack Integration

**Setup:**
1. Sentry Dashboard → Settings → Integrations
2. Enable Slack
3. Configure channel: #errors
4. Alert on:
   - New issues
   - Regressions
   - High-volume issues

### 3. Custom Alert Rules

```yaml
# Alert when error rate spikes
Condition: Error count > 100 in 1 hour
Action: Send to Slack #critical-alerts

# Alert on critical errors
Condition: Error level = fatal OR error
Action: Send email + PagerDuty

# Alert on performance degradation
Condition: LCP > 2.5s for 50% of users
Action: Send to Slack #performance
```

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Error Rate**
   - Errors per hour
   - Errors per user
   - Error-free sessions %

2. **Performance**
   - Transaction duration
   - Apdex score
   - Core Web Vitals (LCP, FID, CLS)

3. **User Impact**
   - Affected users
   - Crash-free users %
   - Session replay views

4. **Release Health**
   - Crash rate by release
   - Adoption rate
   - Regressions

### Creating Dashboards

```markdown
## Production Health Dashboard

### Error Overview
- Total errors (24h): [Chart]
- Error rate trend: [Chart]
- Top 10 errors: [Table]

### Performance
- Avg transaction duration: [Metric]
- LCP (p75): [Metric]
- API response time: [Chart]

### User Impact
- Users affected: [Metric]
- Crash-free rate: [Metric]
- Session replays: [Link]
```

## Troubleshooting

### Issue: Errors not appearing in Sentry

**Solutions:**
1. Check DSN is correct in `.env.local`
2. Verify `PROD` environment: `import.meta.env.PROD`
3. Check network tab for Sentry requests
4. Verify Sentry SDK installed: `npm list @sentry/react`

### Issue: Too many errors

**Solutions:**
1. Reduce sample rate: `tracesSampleRate: 0.05`
2. Add more filters in `ignoreErrors`
3. Use `beforeSend` to filter
4. Check for error loops

### Issue: Source maps not working

**Solutions:**
1. Verify `sourcemap: true` in build config
2. Check release name matches: `natacare-pm@1.0.0`
3. Upload source maps with Sentry CLI
4. Verify auth token has permissions

### Issue: PII in error reports

**Solutions:**
1. Review `beforeSend` sanitization
2. Enable `beforeBreadcrumb` filtering
3. Use `maskAllText` in Replay
4. Add custom data scrubbing rules

## Best Practices

### ✅ DO

1. **Set User Context**
   ```typescript
   Sentry.setUser({ id: user.id, email: user.email });
   ```

2. **Add Custom Tags**
   ```typescript
   Sentry.setTag('feature', 'new_dashboard');
   ```

3. **Use Breadcrumbs**
   ```typescript
   addBreadcrumb('User action', 'ui', { button: 'submit' });
   ```

4. **Filter Errors**
   ```typescript
   ignoreErrors: ['ResizeObserver', 'Script error']
   ```

5. **Monitor Performance**
   ```typescript
   tracesSampleRate: 0.1
   ```

### ❌ DON'T

1. **Send PII**
   - Don't include passwords, tokens
   - Sanitize URLs with sensitive data

2. **Over-sample**
   - Don't use 1.0 in production
   - Cost scales with volume

3. **Ignore Errors**
   - Don't ignore all errors
   - Be selective

4. **Skip Source Maps**
   - Stack traces useless without
   - Always upload in production

5. **Forget to Test**
   - Test error capture before launch
   - Verify alerts work

## Cost Optimization

### Free Tier (5,000 errors/month)

**Strategies:**
- Sample rate: 0.1 (10%)
- Filter common errors
- Group similar errors

### Paid Tier ($26/month - 50K errors)

**Included:**
- 50,000 errors/month
- Performance monitoring
- Session replay
- 90-day retention

### Cost Calculation

| Users | Errors/Day | Monthly | Tier | Cost |
|-------|-----------|---------|------|------|
| 100 | 10 | 300 | Free | $0 |
| 500 | 50 | 1,500 | Free | $0 |
| 1,000 | 150 | 4,500 | Free | $0 |
| 5,000 | 500 | 15,000 | Team | $26/mo |
| 10,000 | 1,500 | 45,000 | Team | $26/mo |

**Tip**: Use error grouping and filtering to stay in free tier

## References

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)

---

**Last Updated**: Phase 3 Implementation (Task #7 Complete)
**Status**: ✅ Production Ready
**Next**: Google Analytics Activation (Task #8)
