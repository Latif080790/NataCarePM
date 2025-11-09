# Day 1-2 Infrastructure Deployment - Checklist

> **Status**: ✅ **2/5 COMPLETED** (40%)  
> **Last Updated**: 2025-01-XX  
> **Deployment Target**: natacara-hns (Production)

---

## ✅ Task 1: Firestore Security Rules - COMPLETED

### Deployment
```bash
firebase deploy --only firestore:rules
```

### ✅ Status: DEPLOYED
- ✅ Rules compiled successfully
- ✅ Released to cloud.firestore
- ✅ Project: natacara-hns
- ✅ 450+ lines with 20+ helper functions
- ✅ Role-based access control for all collections
- ✅ Field-level validation (email, numeric ranges, timestamps)
- ✅ Rate limiting protection
- ✅ Immutable audit logs

### Verification
1. Go to [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/natacara-hns/firestore/rules)
2. Verify rules are active
3. Test with authenticated/unauthenticated requests

---

## ✅ Task 2: Cloud Functions Backup Automation - COMPLETED

### Deployment
```bash
cd functions
npm install
firebase deploy --only functions
```

### ✅ Status: DEPLOYED (5 Functions)
All functions deployed to **asia-southeast2**:

#### 1. scheduledFirestoreBackup
- **Schedule**: Daily at 02:00 UTC (09:00 WIB)
- **Purpose**: Full database backup
- **Retention**: 30 days
- **Status**: ✅ DEPLOYED

#### 2. incrementalBackup
- **Schedule**: Every 6 hours
- **Purpose**: Backup modified collections only
- **Status**: ✅ DEPLOYED

#### 3. criticalBackup
- **Schedule**: Every hour
- **Purpose**: Backup critical collections (projects, users, transactions, POs)
- **Status**: ✅ DEPLOYED

#### 4. cleanupOldBackups
- **Schedule**: Weekly on Sunday at 03:00 WIB
- **Purpose**: Delete backups older than 30 days
- **Status**: ✅ DEPLOYED

#### 5. manualBackup
- **Type**: HTTP endpoint
- **URL**: https://asia-southeast2-natacara-hns.cloudfunctions.net/manualBackup
- **Purpose**: Manual backup trigger
- **Status**: ✅ DEPLOYED

### ⚠️ MANUAL ACTION REQUIRED: Create Cloud Storage Bucket

**You MUST create the backup bucket manually:**

1. Go to [Firebase Console - Storage](https://console.firebase.google.com/project/natacara-hns/storage)
2. Click "Get Started" or "Create Bucket"
3. **Bucket Name**: `natacare-backups`
4. **Location**: `asia-southeast2` (Jakarta)
5. **Access Control**: Uniform (bucket-level only)
6. **Security Rules**: 
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/natacare-backups/o {
       match /{allPaths=**} {
         allow read, write: if false; // Admin/Functions only
       }
     }
   }
   ```

7. **IAM Permissions**: Ensure Cloud Functions service account has:
   - Storage Object Creator
   - Storage Object Viewer
   - Storage Object Admin

### Verification
1. Go to [Cloud Functions Console](https://console.firebase.google.com/project/natacara-hns/functions)
2. Verify 5 functions are deployed
3. Check function logs for errors
4. Trigger manual backup to test:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
     https://asia-southeast2-natacara-hns.cloudfunctions.net/manualBackup
   ```

### Cost Estimation
- **Daily Full Backup**: ~500MB/day
- **Incremental**: ~100MB/6h
- **Storage (30 days)**: ~20GB
- **Estimated Monthly Cost**: ~$5-10 USD

---

## ⏳ Task 3: Firebase App Check - IN PROGRESS

### Prerequisites
App Check code is already integrated:
- ✅ `src/appCheckConfig.ts` configured
- ✅ `index.tsx` imports and initializes
- ✅ Environment variables defined in `.env.example`

### Manual Steps Required

#### Step 1: Create reCAPTCHA v3 Site Key
1. Go to [Google Cloud Console - reCAPTCHA](https://console.cloud.google.com/security/recaptcha?project=natacara-hns)
2. Click "Create Key"
3. **Settings**:
   - **Label**: `NataCarePM Production`
   - **reCAPTCHA Type**: Score based (v3)
   - **Domains**: 
     - `natacara-hns.web.app`
     - `natacara-hns.firebaseapp.com`
     - `localhost` (for testing)
4. Click "Create"
5. **Copy the Site Key** (starts with `6Le...`)

#### Step 2: Enable App Check in Firebase Console
1. Go to [Firebase Console - App Check](https://console.firebase.google.com/project/natacara-hns/appcheck)
2. Click "Get Started"
3. Register your web app:
   - Select your web app
   - Provider: **reCAPTCHA v3**
   - Paste the Site Key from Step 1
   - Click "Save"

#### Step 3: Enforce App Check for Firebase Services
1. In App Check console, go to **Apps** tab
2. For each service you want to protect:
   - **Firestore**: Click "Enforce" → Enable
   - **Storage**: Click "Enforce" → Enable
   - **Functions**: Click "Enforce" → Enable
   - **Realtime Database**: Skip (not used)

**⚠️ WARNING**: Test thoroughly before enforcing in production!

#### Step 4: Create Debug Token for Development
1. In App Check console, go to **Apps** tab
2. Find your web app → Click "Manage debug tokens"
3. Click "Add debug token"
4. **Name**: `Local Development`
5. Copy the generated token (UUID format)

#### Step 5: Update Environment Variables
Create/update `.env.local`:
```bash
# App Check Configuration
VITE_RECAPTCHA_SITE_KEY=6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_APP_CHECK_ENABLED=true
VITE_APP_CHECK_DEBUG_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

For production deployment (Firebase Hosting):
```bash
firebase functions:config:set \
  appcheck.recaptcha_site_key="6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

#### Step 6: Test App Check
1. Rebuild the app: `npm run build`
2. Test in production mode: `npm run preview`
3. Open browser DevTools → Console
4. Look for: `[App Check] Initialized successfully with reCAPTCHA v3`
5. Check Network tab for `X-Firebase-AppCheck` header

#### Step 7: Monitor App Check
1. Go to [App Check Metrics](https://console.firebase.google.com/project/natacara-hns/appcheck/metrics)
2. Monitor:
   - Request success rate
   - Token issuance rate
   - Replay attack detection

### Verification Checklist
- [ ] reCAPTCHA v3 site key created
- [ ] App Check enabled in Firebase Console
- [ ] Enforcement enabled for Firestore, Storage, Functions
- [ ] Debug token created for development
- [ ] Environment variables updated
- [ ] App builds without errors
- [ ] App Check header visible in Network tab
- [ ] No App Check errors in console logs

---

## ⏳ Task 4: Sentry Error Tracking - PENDING

### Prerequisites
Sentry integration code is already complete:
- ✅ `src/utils/sentryInit.ts` (280 lines)
- ✅ Enhanced breadcrumbs tracking
- ✅ Session replay (10% sample)
- ✅ Privacy filters for sensitive data
- ✅ Integration with Firebase Auth
- ✅ Documentation: `docs/SENTRY_SETUP_GUIDE.md`

### Manual Steps Required

#### Step 1: Create Sentry Account & Project
1. Go to [Sentry.io](https://sentry.io/signup/)
2. Sign up or log in
3. Click "Create Project"
4. **Platform**: React
5. **Project Name**: `NataCarePM Production`
6. **Alert Frequency**: Default
7. Click "Create Project"

#### Step 2: Get Sentry DSN
1. After project creation, copy the **DSN** from:
   - Settings → Projects → NataCarePM Production → Client Keys (DSN)
   - Format: `https://PUBLIC_KEY@o123456.ingest.sentry.io/789`

#### Step 3: Configure Sentry Project Settings
1. **General Settings**:
   - Default Environment: `production`
   - Enable: Data Scrubbing
   - Enable: Use Sentry's Suggested Rules

2. **Performance Monitoring**:
   - Enable Performance Monitoring
   - Transaction Sample Rate: 0.1 (10%)

3. **Session Replay**:
   - Enable Session Replay
   - Session Sample Rate: 0.1 (10%)
   - Error Sample Rate: 1.0 (100%)

4. **Integrations**:
   - Enable: GitHub (for release tracking)
   - Enable: Slack (for alerts)

5. **Alerts**:
   - Create alert rule:
     - Condition: Error count > 10 in 1 minute
     - Action: Send notification to email/Slack

#### Step 4: Update Environment Variables
Create/update `.env.local`:
```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://PUBLIC_KEY@o123456.ingest.sentry.io/789
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

For staging environment (`.env.staging`):
```bash
VITE_SENTRY_ENVIRONMENT=staging
```

#### Step 5: Configure Source Maps Upload
Update `vite.config.ts` with Sentry plugin:
```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org-slug",
      project: "natacarepm-production",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Required for Sentry
  },
});
```

Get Auth Token from: [Sentry Account Settings → Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)

#### Step 6: Test Error Tracking
1. Rebuild the app: `npm run build`
2. Trigger a test error:
   ```typescript
   // In any component
   Sentry.captureMessage('Test error from production deployment');
   ```
3. Go to [Sentry Issues](https://sentry.io/organizations/YOUR_ORG/issues/)
4. Verify the test error appears

#### Step 7: Monitor Performance
1. Go to [Sentry Performance](https://sentry.io/organizations/YOUR_ORG/performance/)
2. Check:
   - Page load times
   - Component render times
   - API call durations
   - User interactions

### Verification Checklist
- [ ] Sentry account created
- [ ] Project created with React platform
- [ ] DSN copied and added to .env.local
- [ ] Source maps upload configured
- [ ] Test error captured successfully
- [ ] Session replay working
- [ ] Performance monitoring active
- [ ] Alerts configured for critical errors

---

## ⏳ Task 5: Google Analytics 4 - PENDING

### Prerequisites
GA4 integration code is already complete:
- ✅ `src/utils/analytics.ts` (350 lines)
- ✅ 15+ custom event types
- ✅ User properties tracking
- ✅ GDPR compliance (consent mode)
- ✅ E-commerce tracking
- ✅ Documentation: `docs/GA4_SETUP_GUIDE.md`

### Manual Steps Required

#### Step 1: Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in and click "Admin" (bottom left)
3. **Account**: Create new or select existing
   - Account Name: `NataCare`
4. **Property**:
   - Property Name: `NataCarePM Production`
   - Reporting Time Zone: `(GMT+07:00) Bangkok, Jakarta`
   - Currency: `Indonesian Rupiah (IDR)`
5. Click "Next" → "Create"

#### Step 2: Setup Data Stream
1. In Property settings, click "Data Streams"
2. Click "Add stream" → "Web"
3. **Settings**:
   - Website URL: `https://natacara-hns.web.app`
   - Stream Name: `Production Web App`
   - Enhanced Measurement: **Enable ALL**
     - Page views ✓
     - Scrolls ✓
     - Outbound clicks ✓
     - Site search ✓
     - Video engagement ✓
     - File downloads ✓
4. Click "Create stream"
5. **Copy the Measurement ID** (format: `G-XXXXXXXXXX`)

#### Step 3: Configure Enhanced Measurement
1. In Data Stream details, click "Configure tag settings"
2. Enable:
   - Page changes based on browser history events
   - Scroll tracking (90% threshold)
   - Outbound link clicks
   - Site search (query parameter: `q`)
   - Form interactions
   - File downloads (pdf, xlsx, docx, jpg, png)

#### Step 4: Create Custom Dimensions
In GA4 Admin → Custom Definitions:

**User-Scoped Dimensions:**
1. `user_role` - User role in system
2. `user_company` - User company name
3. `subscription_tier` - User subscription level

**Event-Scoped Dimensions:**
1. `project_id` - Project identifier
2. `project_name` - Project name
3. `transaction_type` - Type of transaction
4. `po_status` - Purchase order status
5. `document_type` - Document type uploaded
6. `report_type` - Type of report generated
7. `error_code` - Error code for failures
8. `search_term` - Search query text

#### Step 5: Create Custom Metrics
In GA4 Admin → Custom Definitions:

**Metrics:**
1. `transaction_amount` (Currency) - Transaction value
2. `project_budget` (Currency) - Project budget
3. `po_value` (Currency) - Purchase order value
4. `task_completion_time` (Standard, seconds) - Task duration
5. `ai_query_count` (Standard) - AI assistant queries
6. `error_count` (Standard) - Number of errors

#### Step 6: Configure Conversions
Mark these events as conversions:
1. `signup` - User registration
2. `project_created` - New project
3. `transaction_completed` - Transaction done
4. `po_approved` - PO approval
5. `report_generated` - Report creation
6. `subscription_upgrade` - Upgrade event

Steps:
1. Go to Admin → Events
2. Click "Mark as conversion" for each event above

#### Step 7: Setup Audiences
Create these audiences for remarketing:

1. **Active Users**:
   - Condition: Active in last 7 days
   - Membership: 30 days

2. **Power Users**:
   - Condition: 5+ sessions in last 30 days
   - Membership: 90 days

3. **Construction Managers**:
   - Condition: user_role = "manager"
   - Membership: 90 days

4. **High-Value Projects**:
   - Condition: project_budget > 1,000,000,000 IDR
   - Membership: 90 days

#### Step 8: Update Environment Variables
Create/update `.env.local`:
```bash
# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_ENABLED=true
```

For production hosting:
```bash
firebase hosting:channel:deploy production \
  --config GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Step 9: Test GA4 Integration
1. Rebuild the app: `npm run build`
2. Run in preview mode: `npm run preview`
3. Open [GA4 DebugView](https://analytics.google.com/analytics/web/#/a123456/p789/realtime/overview?params=_u..debugEvent%3D1)
4. Navigate the app and trigger events:
   - Login
   - Create project
   - Upload document
   - Generate report
   - Use AI assistant
5. Verify events appear in DebugView

#### Step 10: Configure Data Retention
1. Go to Admin → Data Settings → Data Retention
2. **Event Data Retention**: 14 months
3. **Reset on New Activity**: Enable
4. Save changes

#### Step 11: Link to Google Search Console
1. Go to Admin → Property Settings → Product Links
2. Click "Link" next to Search Console
3. Select your Search Console property
4. Submit for organic search data

### Verification Checklist
- [ ] GA4 property created
- [ ] Data stream configured
- [ ] Measurement ID copied
- [ ] Custom dimensions created (11 total)
- [ ] Custom metrics created (6 total)
- [ ] Conversions configured (6 events)
- [ ] Audiences created (4 audiences)
- [ ] Environment variables updated
- [ ] DebugView shows events correctly
- [ ] Data retention set to 14 months
- [ ] Search Console linked

---

## Summary

### ✅ Completed (2/5)
1. ✅ Firestore Security Rules - DEPLOYED
2. ✅ Cloud Functions Backup - DEPLOYED (⚠️ Manual bucket creation needed)

### ⏳ Pending (3/5)
3. ⏳ Firebase App Check - Ready to configure (manual steps required)
4. ⏳ Sentry Error Tracking - Ready to configure (manual steps required)
5. ⏳ Google Analytics 4 - Ready to configure (manual steps required)

### Next Steps
1. **IMMEDIATE**: Create Cloud Storage bucket `natacare-backups` in Firebase Console
2. **HIGH PRIORITY**: Configure Firebase App Check (security critical)
3. **HIGH PRIORITY**: Setup Sentry DSN (error monitoring)
4. **MEDIUM PRIORITY**: Configure GA4 Measurement ID (analytics)

### Estimated Time to Complete
- Task 3 (App Check): 30-45 minutes
- Task 4 (Sentry): 45-60 minutes
- Task 5 (GA4): 60-90 minutes
- **Total**: ~3-4 hours

### Support Resources
- Firebase Console: https://console.firebase.google.com/project/natacara-hns
- Sentry Setup Guide: `docs/SENTRY_SETUP_GUIDE.md`
- GA4 Setup Guide: `docs/GA4_SETUP_GUIDE.md`
- Deployment Guide: `docs/DEPLOYMENT_GUIDE.md`

---

**Last Updated**: 2025-01-XX  
**Deployment Engineer**: [Your Name]  
**Project**: NataCarePM Production Launch
