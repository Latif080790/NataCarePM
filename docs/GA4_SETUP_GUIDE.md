# Google Analytics 4 (GA4) Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Event Tracking](#event-tracking)
5. [Custom Dimensions & Metrics](#custom-dimensions--metrics)
6. [Conversion Tracking](#conversion-tracking)
7. [User Properties](#user-properties)
8. [Privacy & GDPR Compliance](#privacy--gdpr-compliance)
9. [Debugging](#debugging)
10. [Reports & Analysis](#reports--analysis)
11. [Best Practices](#best-practices)
12. [Cost Estimation](#cost-estimation)

---

## Overview

Google Analytics 4 (GA4) is integrated into NataCarePM to track user behavior, measure feature adoption, and provide insights for product improvement. This guide covers setup, usage, and best practices.

### Why GA4?

- **Free tier** with generous limits (10M events/month)
- **Real-time data** for instant insights
- **Privacy-first** design with automatic IP anonymization
- **Cross-platform tracking** (web, mobile, apps)
- **Machine learning insights** for predictions and anomaly detection
- **Enhanced measurement** (automatic scroll, outbound clicks, file downloads)

---

## Quick Start

### 1. Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property
3. Add a web data stream
4. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Configure Environment

Add to `.env.local`:

```env
# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Enable debug mode for development
VITE_ANALYTICS_DEBUG=true
```

### 3. Verify Installation

1. Start the app: `npm run dev`
2. Open browser DevTools → Console
3. Look for: `[Analytics] GA4 initialized: G-XXXXXXXXXX`
4. Visit GA4 → Reports → Realtime to see live events

---

## Features

### Automatic Tracking

The following are tracked automatically:

- ✅ **Page Views** - Every route change
- ✅ **Session Start** - When user opens the app
- ✅ **Session Engagement** - User activity time
- ✅ **First Visit** - New user detection
- ✅ **User Engagement** - Time on page

### Manual Event Tracking

Use the analytics utility for custom events:

```typescript
import { 
  trackEvent, 
  trackLogin, 
  trackProjectCreated 
} from '@/utils/analytics';

// Generic event
trackEvent('button_click', { button_name: 'Export Report' });

// Pre-defined events
trackLogin('email');
trackProjectCreated({ projectId: '123', type: 'construction', budget: 1000000 });
```

---

## Event Tracking

### Authentication Events

```typescript
import { trackLogin, trackSignUp } from '@/utils/analytics';

// Track login
trackLogin('email');          // Email/password
trackLogin('google');         // Google OAuth
trackLogin('microsoft');      // Microsoft SSO

// Track sign up
trackSignUp('email');
trackSignUp('google');
```

**GA4 Event Names:**
- `login` - User logged in
- `sign_up` - User registered

---

### Business Events

#### Project Creation

```typescript
import { trackProjectCreated } from '@/utils/analytics';

trackProjectCreated({
  projectId: project.id,
  type: project.type,           // 'construction', 'renovation', etc.
  budget: project.budget,
});
```

**GA4 Event:** `project_created`
- **Parameters:** `project_id`, `project_type`, `budget`

---

#### Transaction Creation

```typescript
import { trackTransactionCreated } from '@/utils/analytics';

trackTransactionCreated({
  transactionId: transaction.id,
  amount: transaction.amount,
  type: transaction.type,       // 'income', 'expense'
  category: transaction.category,
});
```

**GA4 Event:** `transaction_created`
- **Parameters:** `transaction_id`, `amount`, `transaction_type`, `category`

---

#### Purchase Order (PO) Creation

```typescript
import { trackPOCreated } from '@/utils/analytics';

trackPOCreated({
  poId: po.id,
  amount: po.totalAmount,
  vendor: po.vendorName,
});
```

**GA4 Event:** `po_created`
- **Parameters:** `po_id`, `amount`, `vendor`

---

### Document Events

```typescript
import { trackDocumentUpload, trackReportGenerated } from '@/utils/analytics';

// Document upload
trackDocumentUpload({
  documentId: doc.id,
  type: doc.type,               // 'pdf', 'image', 'excel'
  size: doc.size,               // bytes
  category: 'invoice',
});

// Report generation
trackReportGenerated({
  type: 'budget_summary',
  format: 'pdf',
  dateRange: '2024-01-01_2024-12-31',
});
```

**GA4 Events:** `document_uploaded`, `report_generated`

---

### AI Assistant Events

```typescript
import { trackAIQuery } from '@/utils/analytics';

trackAIQuery({
  queryType: 'project_advice',
  responseTime: 1250,           // milliseconds
  successful: true,
});
```

**GA4 Event:** `ai_query`
- **Parameters:** `query_type`, `response_time_ms`, `successful`

---

### Search & Feature Usage

```typescript
import { trackSearch, trackFeatureUsage } from '@/utils/analytics';

// Search
trackSearch({
  searchTerm: 'vendor invoice',
  resultsCount: 12,
  category: 'documents',
});

// Feature usage
trackFeatureUsage('OCR', 'upload');
trackFeatureUsage('Dashboard', 'filter_applied');
```

**GA4 Events:** `search`, `feature_usage`

---

### Error Tracking

```typescript
import { trackError } from '@/utils/analytics';

trackError({
  errorType: 'network_error',
  message: 'Failed to fetch transactions',
  fatal: false,
});
```

**GA4 Event:** `error_occurred`
- **Parameters:** `error_type`, `error_message`, `fatal`

---

### Conversion Tracking

```typescript
import { trackConversion } from '@/utils/analytics';

trackConversion({
  type: 'free_trial_start',
  value: 0,
  currency: 'IDR',
});

trackConversion({
  type: 'subscription_upgrade',
  value: 500000,
  currency: 'IDR',
});
```

**GA4 Event:** `conversion`
- **Parameters:** `conversion_type`, `value`, `currency`

---

### Engagement Tracking

```typescript
import { trackEngagement } from '@/utils/analytics';

// Track time spent on page
trackEngagement({
  duration: 120,                // seconds
  pageType: 'project_detail',
});
```

**GA4 Event:** `user_engagement`
- **Parameters:** `engagement_time_msec`, `page_type`

---

## Custom Dimensions & Metrics

### Set User Properties

```typescript
import { setUserProperties } from '@/utils/analytics';

setUserProperties({
  userId: user.id,
  role: user.role,              // 'admin', 'manager', 'user'
  companySize: 'medium',        // 'small', 'medium', 'large'
  industry: 'construction',
});
```

**GA4 User Properties:**
- `user_id` - Firebase UID
- `user_role` - User role
- `company_size` - Organization size
- `industry` - Business industry

### Clear User Properties (on logout)

```typescript
import { clearUserProperties } from '@/utils/analytics';

clearUserProperties();
```

---

## Conversion Tracking

### Define Conversions in GA4

1. Go to **Admin → Events**
2. Click **Mark as conversion** for these events:
   - `sign_up` - New user registration
   - `project_created` - First project created
   - `subscription_upgrade` - Premium purchase
   - `report_generated` - Report download

### Set Up Goals

1. Go to **Admin → Audiences**
2. Create custom audiences:
   - **Power Users** - `project_created` count > 5
   - **Report Generators** - `report_generated` count > 10
   - **AI Users** - `ai_query` count > 20

---

## Privacy & GDPR Compliance

### Privacy Settings

Our GA4 implementation includes:

- ✅ **IP Anonymization** - Enabled by default
- ✅ **No Ad Personalization** - Disabled by default
- ✅ **Cookie Consent** - Respects user preferences
- ✅ **Data Retention** - 14 months (configurable)

### GDPR Compliance Functions

```typescript
import { disableTracking, enableTracking } from '@/utils/analytics';

// Disable tracking (GDPR opt-out)
disableTracking();

// Re-enable tracking (user consent)
enableTracking();
```

### Cookie Settings

GA4 sets the following cookies:

- `_ga` - Client ID (2 years)
- `_ga_<container-id>` - Session state (2 years)
- `_gid` - User distinction (24 hours)

**Cookie flags:** `SameSite=None; Secure`

---

## Debugging

### Enable Debug Mode

```typescript
import { enableDebugMode } from '@/utils/analytics';

// Enable in development
if (import.meta.env.DEV) {
  enableDebugMode();
}
```

Or via `.env.local`:

```env
VITE_ANALYTICS_DEBUG=true
```

### View Debug Events

1. Go to GA4 → **Configure → DebugView**
2. Open your app with debug mode enabled
3. See events in real-time with full parameters

### Console Logging

With debug mode enabled, all events are logged to browser console:

```
[Analytics] Event tracked: login
  method: email
  timestamp: 2024-01-15T10:30:45.123Z
```

---

## Reports & Analysis

### Pre-Built Reports

#### 1. User Acquisition Report
**Path:** Reports → Acquisition → User Acquisition

Metrics:
- New users
- Total users
- Sessions
- Engagement rate

**Use case:** Track growth and marketing effectiveness

---

#### 2. Engagement Report
**Path:** Reports → Engagement → Events

Metrics:
- Event count by name
- Event value
- Total users

**Use case:** Measure feature adoption (project creation, report generation, AI queries)

---

#### 3. Real-Time Report
**Path:** Reports → Realtime

Metrics:
- Active users (last 30 min)
- Top events
- Top pages

**Use case:** Monitor live activity, verify event tracking

---

### Custom Reports

#### Power User Dashboard

1. Go to **Explore → Create new exploration**
2. Dimensions: `user_role`, `company_size`
3. Metrics: `project_created` count, `transaction_created` count
4. Filter: `user_id` is not null

**Insights:** Identify heavy users, target for feedback

---

#### Feature Adoption Funnel

1. Go to **Explore → Funnel exploration**
2. Steps:
   - Step 1: `sign_up`
   - Step 2: `project_created`
   - Step 3: `transaction_created`
   - Step 4: `report_generated`

**Insights:** Where users drop off, optimize onboarding

---

#### AI Assistant Usage

1. Go to **Explore → Free form**
2. Dimensions: `query_type`
3. Metrics: `ai_query` count, avg `response_time_ms`
4. Breakdown: By `successful` (true/false)

**Insights:** Most popular AI features, performance issues

---

## Best Practices

### DO ✅

1. **Track Business Events**
   - Focus on actions that matter: project creation, transactions, reports
   - Align events with business KPIs

2. **Use Descriptive Event Names**
   - Use snake_case: `project_created`, `report_generated`
   - Avoid generic names: `click`, `action`

3. **Add Relevant Parameters**
   - Include context: `project_type`, `report_format`, `error_type`
   - Keep parameter names consistent across events

4. **Set User Properties Early**
   - Call `setUserProperties()` after login
   - Update when user role/company changes

5. **Test in Debug Mode**
   - Verify events in DebugView before production
   - Check parameter values and data types

6. **Respect User Privacy**
   - Never track PII (emails, names, addresses)
   - Implement cookie consent UI
   - Provide opt-out mechanism

### DON'T ❌

1. **Don't Track Sensitive Data**
   - ❌ Passwords, credit cards, personal identifiers
   - ❌ Medical/financial records

2. **Don't Over-Track**
   - ❌ Tracking every mouse move or keystroke
   - ❌ Events with no business value

3. **Don't Use Dynamic Event Names**
   - ❌ `trackEvent('project_' + id)` - Creates unlimited events
   - ✅ `trackEvent('project_created', { project_id: id })` - Use parameters

4. **Don't Forget Error Handling**
   - ❌ Letting analytics errors break the app
   - ✅ Wrap in try-catch, fail silently

5. **Don't Ignore Data Quality**
   - ❌ Inconsistent parameter names: `userId`, `user_id`, `userID`
   - ✅ Standardize naming conventions

---

## Cost Estimation

### Free Tier

GA4 is **free** for up to:
- **10 million events/month** (standard properties)
- **25 million events/month** (360 properties - enterprise)
- **Unlimited users**
- **Unlimited properties**

### Typical Usage (NataCarePM)

Assuming **1,000 monthly active users**:

| Event Type | Events/User/Month | Total Events/Month |
|------------|------------------:|-------------------:|
| Page views | 50 | 50,000 |
| Project creation | 5 | 5,000 |
| Transactions | 20 | 20,000 |
| Reports | 8 | 8,000 |
| AI queries | 10 | 10,000 |
| Search | 15 | 15,000 |
| Document uploads | 12 | 12,000 |
| **TOTAL** | **120** | **120,000** |

**Result:** Well within free tier (120K < 10M)

### Scaling Estimate

| Users | Events/Month | Cost |
|------:|-------------:|-----:|
| 1,000 | 120,000 | **$0** |
| 10,000 | 1,200,000 | **$0** |
| 50,000 | 6,000,000 | **$0** |
| 100,000 | 12,000,000 | **$0*** |

*Requires GA4 360 (enterprise) - contact Google Sales for pricing

### Cost Optimization Tips

1. **Use Sampling for Large Reports**
   - GA4 auto-samples reports >10M events
   - Doesn't affect data collection

2. **Archive Old Data**
   - Default retention: 14 months
   - Export to BigQuery for long-term storage (free tier: 10GB/month)

3. **Monitor Event Count**
   - Check **Admin → Data Settings → Data Collection** for usage
   - Set up alerts at 80% of quota

---

## Troubleshooting

### Events Not Appearing in GA4

**Problem:** Events sent but not visible in real-time reports

**Solutions:**
1. Wait 24-48 hours for standard reports (real-time is instant)
2. Check DebugView for immediate validation
3. Verify Measurement ID is correct
4. Check browser console for errors
5. Ensure ad blockers are disabled (they may block GA4)

---

### Debug Mode Not Working

**Problem:** DebugView shows no events

**Solutions:**
1. Verify `VITE_ANALYTICS_DEBUG=true` in `.env.local`
2. Rebuild app: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R
4. Check if `debug_mode` parameter is sent (view in Network tab)

---

### Missing Custom Parameters

**Problem:** Events tracked but custom parameters missing

**Solutions:**
1. Wait 24 hours - custom dimensions need registration
2. Go to **Admin → Custom Definitions** → Register custom dimensions
3. Check parameter names match exactly (case-sensitive)
4. Verify parameter values are not null/undefined

---

### High Event Count

**Problem:** Approaching 10M events/month limit

**Solutions:**
1. Review event list - remove low-value events
2. Sample non-critical events:
   ```typescript
   if (Math.random() < 0.1) { // 10% sampling
     trackEvent('low_priority_event');
   }
   ```
3. Use `trackEngagement()` instead of individual page_view events
4. Upgrade to GA4 360 (contact sales)

---

### Privacy Concerns

**Problem:** Users worried about tracking

**Solutions:**
1. Add privacy policy page with GA4 disclosure
2. Implement cookie consent banner
3. Provide opt-out:
   ```typescript
   import { disableTracking } from '@/utils/analytics';
   
   function handleOptOut() {
     disableTracking();
     localStorage.setItem('analytics_opt_out', 'true');
   }
   ```
4. Respect Do Not Track (DNT) headers:
   ```typescript
   if (navigator.doNotTrack === '1') {
     disableTracking();
   }
   ```

---

## Summary

### Quick Reference

| Action | Function |
|--------|----------|
| Initialize GA4 | `initGA4()` (auto in `index.tsx`) |
| Track login | `trackLogin('email')` |
| Track signup | `trackSignUp('google')` |
| Track project | `trackProjectCreated({ ... })` |
| Track transaction | `trackTransactionCreated({ ... })` |
| Track PO | `trackPOCreated({ ... })` |
| Track document | `trackDocumentUpload({ ... })` |
| Track report | `trackReportGenerated({ ... })` |
| Track AI query | `trackAIQuery({ ... })` |
| Track search | `trackSearch({ ... })` |
| Track feature | `trackFeatureUsage(name, action)` |
| Track error | `trackError({ ... })` |
| Track conversion | `trackConversion({ ... })` |
| Set user properties | `setUserProperties({ ... })` |
| Clear user data | `clearUserProperties()` |
| Enable debug | `enableDebugMode()` |
| Disable tracking | `disableTracking()` |

### Next Steps

1. ✅ Verify events in GA4 DebugView
2. ✅ Create custom reports for business metrics
3. ✅ Set up conversion events
4. ✅ Define user audiences
5. ✅ Export data to BigQuery (optional)
6. ✅ Implement cookie consent UI
7. ✅ Monitor event quota usage

---

**Updated:** 2024-01-15
**Version:** 1.0.0
**Author:** NataCarePM Team
