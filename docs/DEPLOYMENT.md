# Deployment Runbook - NataCarePM

**Last Updated:** November 12, 2025  
**Version:** 1.0  
**Maintainer:** Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Database Migrations](#database-migrations)
8. [Monitoring & Alerting](#monitoring--alerting)
9. [Troubleshooting](#troubleshooting)
10. [Emergency Contacts](#emergency-contacts)

---

## Overview

### System Architecture
- **Frontend:** React 18.3 + TypeScript 5.8 + Vite 6.4.1
- **Backend:** Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Hosting:** Firebase Hosting
- **CDN:** Firebase CDN (automatic)
- **Monitoring:** Sentry + Google Analytics 4

### Deployment Frequency
- **Production:** Weekly (every Friday, 10:00 WIB)
- **Staging:** Daily (automated on main branch merge)
- **Hotfixes:** As needed (with approval)

### Deployment Time
- **Estimated Duration:** 15-20 minutes
- **Downtime:** None (zero-downtime deployment)
- **Rollback Window:** 30 minutes

---

## Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] All tests passing (`npm test`)
```powershell
npm test
```
- [ ] No TypeScript errors (`npm run type-check`)
```powershell
npm run type-check
```
- [ ] Linting passed (`npm run lint`)
```powershell
npm run lint
```
- [ ] Production build successful (`npm run build`)
```powershell
npm run build
```

### 2. Environment Configuration ✅

- [ ] `.env.production` configured correctly
- [ ] Firebase project selected
```powershell
firebase use production
```
- [ ] All required environment variables set
```powershell
# Verify all VITE_* variables are set
cat .env.production | Select-String "VITE_"
```

### 3. Database & Infrastructure ✅

- [ ] Firestore indexes deployed
```powershell
firebase deploy --only firestore:indexes
```
- [ ] Firestore rules tested and ready
```powershell
firebase deploy --only firestore:rules --project staging
# Test in staging first!
```
- [ ] Cloud Functions tested in staging
```powershell
firebase deploy --only functions --project staging
```

### 4. Dependencies ✅

- [ ] All npm dependencies up to date
```powershell
npm audit
npm outdated
```
- [ ] No critical vulnerabilities
- [ ] Lock files (`package-lock.json`) committed

### 5. Documentation ✅

- [ ] CHANGELOG.md updated with changes
- [ ] API documentation updated (if applicable)
- [ ] User-facing changes documented

### 6. Team Communication ✅

- [ ] Deployment scheduled in team calendar
- [ ] Stakeholders notified
- [ ] On-call engineer identified
- [ ] Rollback plan reviewed

---

## Environment Setup

### 1. Install Dependencies

```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### 2. Configure Firebase CLI

```powershell
# Login to Firebase
firebase login

# Select production project
firebase use production

# Verify configuration
firebase projects:list
```

### 3. Environment Variables

Create `.env.production` file:

```env
# Firebase Configuration (REQUIRED)
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=natacare-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=natacare-prod
VITE_FIREBASE_STORAGE_BUCKET=natacare-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry (Error Tracking)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENABLED=true

# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_ENABLED=true

# Gemini AI (Optional)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Feature Flags
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_OFFLINE_MODE=false
VITE_ENABLE_PWA=false

# Environment
VITE_ENVIRONMENT=production
VITE_DEBUG_MODE=false
```

**Security Note:** Never commit `.env.production` to Git!

### 4. Firebase Configuration Files

Ensure these files are configured:

- `firebase.json` - Hosting and deployment settings
- `firestore.rules` - Database security rules
- `firestore.indexes.json` - Database indexes
- `storage.rules` - Storage security rules
- `functions/` - Cloud Functions source code

---

## Deployment Process

### Method 1: Automated Deployment (Recommended)

Use the provided PowerShell deployment script:

```powershell
.\deploy-nocache.ps1
```

**What it does:**
1. Runs production build with cache-busting
2. Deploys to Firebase Hosting
3. Deploys Firestore rules and indexes
4. Creates deployment timestamp
5. Generates deployment report

### Method 2: Manual Step-by-Step Deployment

#### Step 1: Build Production Bundle

```powershell
# Set production mode
$env:NODE_ENV = "production"

# Build with Vite
npm run build

# Verify dist/ folder created
Test-Path dist/
```

Expected output:
- `dist/` folder with optimized assets
- Main vendor bundle: ~1.54 MB (450 KB gzipped)
- Firebase bundle: ~372 KB (109 KB gzipped)
- 13 code-split chunks

#### Step 2: Deploy Firebase Hosting

```powershell
firebase deploy --only hosting

# With custom message
firebase deploy --only hosting -m "Release v1.2.3 - Bug fixes and performance improvements"
```

Expected output:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/natacare-prod/overview
Hosting URL: https://natacare-prod.web.app
```

#### Step 3: Deploy Firestore Rules & Indexes

```powershell
# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Important:** Indexes may take 5-10 minutes to build. Monitor in Firebase Console.

#### Step 4: Deploy Cloud Functions

```powershell
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:changePassword

cd ..
```

Expected output:
```
✔  functions[changePassword(us-central1)] Successful update operation.
✔  functions[generateAiInsight(us-central1)] Successful update operation.
```

#### Step 5: Deploy Storage Rules

```powershell
firebase deploy --only storage
```

### Method 3: Deploy Functions Only

For backend-only changes:

```powershell
.\deploy-functions.ps1
```

---

## Post-Deployment Verification

### 1. Health Check ✅

Visit production URL and verify:

```
https://natacare-prod.web.app
```

- [ ] Homepage loads successfully
- [ ] Login page accessible
- [ ] No console errors (F12 Developer Tools)
- [ ] Network requests successful (check Network tab)

### 2. Functionality Testing ✅

Test critical user flows:

**Authentication:**
- [ ] User can log in
- [ ] User can log out
- [ ] 2FA/MFA working (if enabled)
- [ ] Password reset functional

**Core Features:**
- [ ] Dashboard loads with data
- [ ] Project creation works
- [ ] RAB/AHSP management functional
- [ ] Document upload working
- [ ] Reports generate correctly

**Performance:**
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive (TTI) < 5 seconds
- [ ] No JavaScript errors

### 3. Database Verification ✅

```powershell
# Check Firestore indexes status
firebase firestore:indexes --project production
```

Expected output:
```
[ { id: 'auto_XXXXXXXXXX', state: 'READY' } ]
```

### 4. Monitoring Check ✅

**Sentry:**
- [ ] Error tracking active
- [ ] New release tagged in Sentry dashboard
- [ ] No spike in error rate

**Google Analytics:**
- [ ] Real-time users visible
- [ ] Page views tracking
- [ ] Events firing correctly

### 5. Cloud Functions Verification ✅

```powershell
# View function logs
firebase functions:log --project production --limit 50
```

Test function endpoints:
```typescript
// Call from browser console on production site
const functions = firebase.functions();
const testFunc = functions.httpsCallable('changePassword');
// Don't actually call - just verify it exists
console.log(testFunc);
```

---

## Rollback Procedure

### Immediate Rollback (< 30 minutes)

If critical issues detected:

#### Option 1: Firebase Hosting Rollback

```powershell
# List recent deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

#### Option 2: Manual Rollback

```powershell
# Checkout previous working commit
git log --oneline -10
git checkout <previous-working-commit>

# Rebuild and redeploy
npm run build
firebase deploy --only hosting
```

### Partial Rollback

**Functions only:**
```powershell
# Redeploy previous function code
cd functions
git checkout HEAD~1 -- src/
npm run build
firebase deploy --only functions
```

**Rules only:**
```powershell
# Restore previous rules
git checkout HEAD~1 -- firestore.rules
firebase deploy --only firestore:rules
```

### Rollback Verification

After rollback:
- [ ] Health check passed
- [ ] Core functionality working
- [ ] Error rate normalized
- [ ] User reports addressed

---

## Database Migrations

### Firestore Data Migration Pattern

For schema changes (e.g., adding new fields):

#### 1. Additive Changes (Safe)

Add new fields without removing old ones:

```typescript
// Cloud Function for migration
export const migrateUserSchema = functions.https.onCall(async (data, context) => {
  // Verify admin user
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const batch = admin.firestore().batch();
  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.get();

  snapshot.forEach((doc) => {
    // Add new field with default value
    batch.update(doc.ref, {
      newField: 'defaultValue',
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  return { migrated: snapshot.size };
});
```

#### 2. Breaking Changes (Requires Staging)

For field removals or type changes:

1. **Stage 1:** Deploy dual-read code (read both old and new fields)
2. **Stage 2:** Migrate data in background
3. **Stage 3:** Deploy write-only-new-field code
4. **Stage 4:** Remove old field references

#### 3. Migration Checklist

- [ ] Test migration on staging environment
- [ ] Create database backup
```powershell
# Export Firestore data
gcloud firestore export gs://natacare-prod-backup/$(Get-Date -Format 'yyyy-MM-dd')
```
- [ ] Run migration during low-traffic period
- [ ] Monitor error logs during migration
- [ ] Verify data integrity post-migration

---

## Monitoring & Alerting

### 1. Sentry Monitoring

**Production Dashboard:**
```
https://sentry.io/organizations/natacare/projects/natacare-prod/
```

**Key Metrics to Watch:**
- **Error Rate:** Should be < 1% of total requests
- **Response Time:** P95 < 2 seconds
- **User Impact:** Affected users < 5% of DAU

**Alert Thresholds:**
```yaml
# Sentry alert rules
error_rate_spike:
  threshold: 10 errors/minute
  time_window: 5 minutes
  action: Notify on-call engineer

crash_rate_spike:
  threshold: 5% of sessions
  time_window: 15 minutes
  action: Page on-call + rollback consideration
```

### 2. Firebase Performance Monitoring

Enable in Firebase Console:
- Web app performance traces
- Network request monitoring
- Custom performance metrics

### 3. Google Analytics 4

Monitor:
- **Real-time users:** Should match normal traffic patterns
- **Bounce rate:** Should be < 40%
- **Average session duration:** Track for regressions

### 4. Cloud Functions Monitoring

```powershell
# View function execution count
firebase functions:log --only changePassword,generateAiInsight

# Check function errors
firebase functions:log --severity ERROR
```

### 5. Custom Health Endpoint

Create `/api/health` endpoint:

```typescript
// functions/src/health.ts
export const health = functions.https.onRequest((req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || 'unknown',
    uptime: process.uptime(),
  });
});
```

Monitor with:
```powershell
curl https://us-central1-natacare-prod.cloudfunctions.net/health
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Build Fails

**Symptoms:**
```
✘ Build failed
Error: Transform failed with 1 error
```

**Solutions:**
1. Clear cache and rebuild:
```powershell
Remove-Item -Recurse -Force node_modules, dist, .vite
npm install
npm run build
```

2. Check TypeScript errors:
```powershell
npm run type-check
```

3. Verify environment variables loaded:
```powershell
npm run build -- --mode production --debug
```

#### Issue 2: Functions Deployment Fails

**Symptoms:**
```
Error: HTTP Error: 403, Permission denied
```

**Solutions:**
1. Verify authentication:
```powershell
firebase login --reauth
```

2. Check project permissions:
```powershell
firebase projects:list
```

3. Verify Node.js version (must be 20):
```powershell
node --version  # Should be v20.x.x
```

#### Issue 3: Firestore Rules Not Updating

**Symptoms:**
- Users getting "Permission denied" errors
- Old rules still active

**Solutions:**
1. Force rules deployment:
```powershell
firebase deploy --only firestore:rules --force
```

2. Verify in Firebase Console:
- Go to Firestore → Rules tab
- Check timestamp of last deployment

3. Test rules with Rules Playground

#### Issue 4: Hosting Shows Old Version

**Symptoms:**
- Users seeing cached old version
- New features not visible

**Solutions:**
1. Clear CDN cache:
```powershell
firebase hosting:channel:deploy production --expires 1h
```

2. Check cache headers in `firebase.json`:
```json
{
  "hosting": {
    "headers": [{
      "source": "**/*.@(js|css|html)",
      "headers": [{
        "key": "Cache-Control",
        "value": "no-cache, no-store, must-revalidate"
      }]
    }]
  }
}
```

3. Hard refresh browser (Ctrl+Shift+R)

#### Issue 5: High Error Rate Post-Deployment

**Immediate Actions:**
1. Check Sentry dashboard for error patterns
2. Review Cloud Functions logs:
```powershell
firebase functions:log --severity ERROR --limit 100
```
3. If critical, initiate rollback
4. Notify team and stakeholders

**Investigation:**
- Identify error type (frontend, backend, database)
- Check if affecting all users or specific subset
- Review recent code changes in affected area
- Test in staging environment

---

## Emergency Contacts

### On-Call Schedule

**Primary On-Call:**
- Name: [Insert Name]
- Phone: [Insert Phone]
- Email: [Insert Email]

**Secondary On-Call:**
- Name: [Insert Name]
- Phone: [Insert Phone]
- Email: [Insert Email]

### Escalation Path

1. **Level 1 (Minor issues):** On-call engineer
2. **Level 2 (Service degradation):** Team lead + On-call
3. **Level 3 (Service outage):** CTO + Team lead + On-call

### External Contacts

**Firebase Support:**
- Enterprise support portal: https://firebase.google.com/support
- Priority: P1 (Production outage)

**Sentry Support:**
- Support email: support@sentry.io
- Dashboard: https://sentry.io/support/

---

## Deployment Checklist Summary

### Pre-Deployment (30 min before)
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] Team notified
- [ ] Rollback plan reviewed

### Deployment (15-20 min)
- [ ] Run deployment script
- [ ] Monitor deployment progress
- [ ] Verify hosting deployment
- [ ] Verify functions deployment
- [ ] Check Firestore indexes

### Post-Deployment (10 min)
- [ ] Health check passed
- [ ] Core features tested
- [ ] Monitoring dashboards checked
- [ ] No error spikes
- [ ] Team notified of completion

### Sign-Off
- [ ] Deployment successful
- [ ] Production stable
- [ ] CHANGELOG updated
- [ ] Deployment notes documented

**Deployed By:** _________________  
**Date/Time:** _________________  
**Version:** _________________  

---

## Appendix

### A. Deployment Scripts Reference

**deploy-nocache.ps1:**
- Builds with cache-busting timestamps
- Deploys hosting with no-cache headers
- Updates firestore rules and indexes
- Generates deployment report

**deploy-functions.ps1:**
- Builds TypeScript functions
- Deploys all Cloud Functions
- Shows function URLs
- Displays logs

**final-verification.ps1:**
- Runs type check
- Runs linting
- Runs tests
- Builds production bundle
- Verifies all passed

### B. Firebase Commands Quick Reference

```powershell
# Authentication
firebase login
firebase logout
firebase login --reauth

# Project management
firebase use <project-id>
firebase projects:list

# Deployment
firebase deploy
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
firebase deploy --only storage

# Functions
firebase functions:log
firebase functions:shell
firebase functions:config:get

# Hosting
firebase hosting:channel:list
firebase hosting:rollback

# Firestore
firebase firestore:delete <path> --recursive
firebase firestore:indexes

# Emulators (for testing)
firebase emulators:start
```

### C. Useful URLs

**Production:**
- App: https://natacare-prod.web.app
- Console: https://console.firebase.google.com/project/natacare-prod
- Sentry: https://sentry.io/organizations/natacare/projects/natacare-prod/
- Analytics: https://analytics.google.com/

**Staging:**
- App: https://natacare-staging.web.app
- Console: https://console.firebase.google.com/project/natacare-staging

---

**Document Version:** 1.0  
**Last Review:** November 12, 2025  
**Next Review:** December 12, 2025
