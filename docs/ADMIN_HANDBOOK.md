# NataCarePM - Admin Handbook
**Panduan Administrator & DevOps**

## Daftar Isi
1. [Tanggung Jawab Admin](#tanggung-jawab-admin)
2. [User Management](#user-management)
3. [Security Management](#security-management)
4. [Backup & Recovery](#backup--recovery)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)
8. [Emergency Procedures](#emergency-procedures)

---

## Tanggung Jawab Admin

### Admin Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Super Admin** | Full access, can delete users/data | Owner/CTO |
| **Admin** | Manage users, view all data, system settings | IT Manager |
| **Manager** | Manage projects, approve transactions | Project Manager |
| **User** | View/edit assigned projects only | Team Member |

### Daily Tasks

- ✅ Check monitoring dashboard (errors, performance)
- ✅ Review user access requests
- ✅ Verify backups completed successfully
- ✅ Check security alerts (Sentry, Firebase Auth)
- ✅ Monitor storage usage (Firestore, Cloud Storage)

### Weekly Tasks

- ✅ Review audit logs for suspicious activity
- ✅ Update user roles/permissions as needed
- ✅ Check system performance metrics (Lighthouse scores)
- ✅ Review and close resolved support tickets

### Monthly Tasks

- ✅ Generate usage reports (active users, projects, transactions)
- ✅ Review and optimize Firebase costs
- ✅ Test backup restoration process
- ✅ Update documentation if features changed
- ✅ Security audit (review Firestore rules, API keys)

---

## User Management

### Creating Users

**Method 1: Firebase Console (Recommended for testing)**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project → **Authentication**
3. Click **"Add user"**
4. Enter:
   - **Email:** user@company.com
   - **Password:** (auto-generate or custom)
5. Click **"Add user"**
6. Copy UID

**Method 2: Admin SDK (Bulk creation)**

```javascript
// scripts/create-users.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createUser(email, displayName, role) {
  try {
    const user = await admin.auth().createUser({
      email,
      password: generateRandomPassword(),
      displayName,
      emailVerified: false
    });
    
    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(user.uid, { role });
    
    // Create user document in Firestore
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email,
      displayName,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    
    console.log(`✅ User created: ${email} (${role})`);
    return user.uid;
  } catch (error) {
    console.error(`❌ Failed to create ${email}:`, error.message);
  }
}

// Usage
createUser('manager@company.com', 'John Doe', 'manager');
```

---

### Assigning Roles

**Update user role:**

```javascript
// In Firebase Functions or Admin SDK
await admin.auth().setCustomUserClaims(userId, { 
  role: 'admin',
  permissions: ['projects.create', 'users.manage']
});
```

**Verify role from client:**

```typescript
// src/hooks/useUserRole.ts
const user = firebase.auth().currentUser;
const idTokenResult = await user.getIdTokenResult();
const role = idTokenResult.claims.role; // 'admin', 'manager', 'user'
```

---

### Disabling Users

**Disable user (soft delete):**

```javascript
// Firebase Console → Authentication → Users → Select user → Disable
// Or via Admin SDK:
await admin.auth().updateUser(userId, { disabled: true });
```

**Re-enable user:**

```javascript
await admin.auth().updateUser(userId, { disabled: false });
```

---

### Deleting Users

**⚠️ PERMANENT! Cannot be undone.**

```javascript
// Step 1: Delete user from Auth
await admin.auth().deleteUser(userId);

// Step 2: Delete user data from Firestore
await admin.firestore().collection('users').doc(userId).delete();

// Step 3: Anonymize user in audit logs (keep history)
await admin.firestore().collection('auditLogs')
  .where('userId', '==', userId)
  .get()
  .then(snapshot => {
    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        userId: 'DELETED_USER',
        userEmail: '[deleted]' 
      });
    });
    return batch.commit();
  });
```

---

## Security Management

### Firestore Security Rules

**Location:** `firestore.rules.production`

**Check rules:**
```bash
firebase deploy --only firestore:rules --project production
```

**Test rules locally:**
```bash
firebase emulators:start --only firestore
# Then run: npm run test:security
```

**Common rule patterns:**

```javascript
// Read-only for authenticated users
match /projects/{projectId} {
  allow read: if request.auth != null;
  allow write: if request.auth.token.role in ['admin', 'manager'];
}

// Owner-only access
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Admin-only
match /settings/{document=**} {
  allow read, write: if request.auth.token.role == 'admin';
}
```

---

### API Key Management

**Firebase API Keys:**

1. Go to Firebase Console → **Project Settings** → **General**
2. **Web API Key** - Public (safe to expose)
3. **Server Key** - NEVER expose (use in Cloud Functions only)

**Rotate API keys (if compromised):**

1. Go to Google Cloud Console → **APIs & Services** → **Credentials**
2. Delete old key
3. Create new API key
4. Restrict by:
   - **HTTP referrers:** Only allow your domain
   - **APIs:** Only enable used APIs (Firestore, Auth, Storage)
5. Update `.env` file with new key
6. Redeploy app

---

### App Check Tokens

**Enable Firebase App Check:**

```bash
# Install App Check in project
firebase appcheck:apps:create web --display-name "NataCarePM Web"

# Get debug token (for local development)
firebase appcheck:apps:create web --debug-token <GENERATED_TOKEN>
```

**Monitor App Check violations:**

1. Go to Firebase Console → **App Check**
2. Check **"Metrics"** tab for:
   - Valid requests
   - Invalid/missing tokens
   - Rate limiting

**Block unauthenticated requests:**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.appCheck != null;
    }
  }
}
```

---

### Two-Factor Authentication (2FA)

**Enable 2FA for admin accounts:**

1. Login as admin → Profile → Security Settings
2. Enable **"Two-Factor Authentication"**
3. Choose method:
   - **SMS:** Requires phone number verification
   - **TOTP:** Use Google Authenticator/Authy

**Enforce 2FA for all admins (via Cloud Function):**

```javascript
exports.enforce2FA = functions.auth.user().onCreate(async (user) => {
  const claims = await admin.auth().getUser(user.uid).then(u => u.customClaims);
  
  if (claims?.role === 'admin') {
    await admin.firestore().collection('users').doc(user.uid).update({
      require2FA: true,
      mfaEnrollmentDeadline: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      )
    });
    
    // Send email reminder
    await sendEmail(user.email, 'Enable 2FA within 7 days');
  }
});
```

---

## Backup & Recovery

### Automated Backups

**Configured:** Cloud Functions run daily at 2 AM UTC

**Check backup status:**

```bash
# View Cloud Functions logs
firebase functions:log --only scheduleFirestoreBackup

# List backups in Cloud Storage
gsutil ls gs://natacare-backups/firestore/
```

**Backup retention:** 30 days (automatically delete older backups)

---

### Manual Backup

**Export Firestore to Cloud Storage:**

```bash
gcloud firestore export gs://natacare-backups/manual/$(date +%Y-%m-%d) \
  --project=natacare-pm
```

**Download backup locally:**

```bash
gsutil -m cp -r gs://natacare-backups/manual/2024-01-15 ./local-backup/
```

---

### Restore from Backup

**⚠️ This will OVERWRITE current data!**

**Step 1: Create test/staging environment**

```bash
# Never restore directly to production!
gcloud firestore import gs://natacare-backups/firestore/2024-01-15 \
  --project=natacare-pm-staging
```

**Step 2: Verify restored data**

1. Login to staging environment
2. Check projects, transactions, users
3. Verify data integrity

**Step 3: Restore to production (if needed)**

```bash
# Stop app (maintenance mode)
# Update Firebase Hosting to show maintenance page

# Restore data
gcloud firestore import gs://natacare-backups/firestore/2024-01-15 \
  --project=natacare-pm \
  --async

# Monitor progress
gcloud firestore operations list --project=natacare-pm

# Re-enable app
```

---

### Disaster Recovery Plan

**Scenario 1: Data Corruption**

1. Identify affected collections
2. Export current state (for forensics)
3. Restore from last known good backup
4. Notify users of data rollback

**Scenario 2: Complete Data Loss**

1. Deploy app to maintenance mode
2. Restore full Firestore backup
3. Restore Cloud Storage files
4. Re-deploy app
5. Verify all features work
6. Notify users

**RTO (Recovery Time Objective):** < 4 hours
**RPO (Recovery Point Objective):** < 24 hours (daily backups)

---

## Monitoring & Alerts

### Sentry Error Monitoring

**Dashboard:** https://sentry.io/organizations/natacare/issues/

**Check errors:**

1. Filter by:
   - **Environment:** Production
   - **Level:** Error, Fatal
   - **Unresolved:** Only show new issues
2. Click error to see:
   - Stack trace
   - User context (ID, email)
   - Breadcrumbs (actions before error)
   - Device/browser info

**Resolve error:**

1. Fix bug in code
2. Deploy fix
3. Mark error as "Resolved" in Sentry
4. Add regression test

---

### Google Analytics 4

**Dashboard:** https://analytics.google.com/

**Key Metrics:**

| Metric | Target | Alert If |
|--------|--------|----------|
| Active Users (daily) | > 50 | < 10 |
| Session Duration | > 5 min | < 2 min |
| Bounce Rate | < 40% | > 60% |
| Error Rate | < 1% | > 5% |

**Custom Reports:**

1. Go to **Explore** → **Create new exploration**
2. Set dimensions:
   - User Role (admin/manager/user)
   - Feature Usage (most used features)
3. Set metrics:
   - Event count
   - Engagement time

---

### Performance Monitoring

**Firebase Performance:**

1. Go to Firebase Console → **Performance**
2. Check:
   - **App start time:** < 2s
   - **Network request duration:** < 1s
   - **Screen rendering:** < 100ms

**Lighthouse CI:**

```bash
# Run performance audit
npm run lighthouse

# View report
start lighthouse-reports/index.html
```

**Targets:**
- Performance Score: ≥ 80
- Accessibility: ≥ 90
- Best Practices: ≥ 90

---

### Alert Configuration

**Sentry Alerts:**

1. Go to Sentry → **Alerts** → **Create Alert**
2. Set conditions:
   - **Error count:** > 10 in 5 minutes
   - **New error:** First time seen
3. Actions:
   - Send email to admin@natacare.com
   - Post to Slack #alerts channel

**Firebase Crashlytics (future):**

```javascript
// Enable crash reporting
import crashlytics from '@react-native-firebase/crashlytics';

crashlytics().log('App started');
crashlytics().recordError(new Error('Test crash'));
```

---

## Performance Optimization

### Database Optimization

**Create indexes for frequent queries:**

```bash
# firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Optimize queries:**

```typescript
// ❌ Bad: Fetch all, filter in client
const allTransactions = await getDocs(collection(db, 'transactions'));
const filtered = allTransactions.filter(t => t.projectId === '123');

// ✅ Good: Filter in query
const q = query(
  collection(db, 'transactions'),
  where('projectId', '==', '123'),
  orderBy('date', 'desc'),
  limit(50)
);
const transactions = await getDocs(q);
```

---

### Caching Strategy

**Firebase Persistence:**

```typescript
// Enable offline persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open
  } else if (err.code == 'unimplemented') {
    // Browser doesn't support
  }
});
```

**Service Worker Caching:**

```javascript
// vite-plugin-pwa config
VitePWA({
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'firebase-storage',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      }
    ]
  }
});
```

---

### Bundle Size Optimization

**Analyze bundle:**

```bash
npm run build
start dist/stats.html
```

**Reduce size:**

1. **Lazy load heavy libraries:**
   ```typescript
   const Tesseract = lazy(() => import('tesseract.js'));
   ```

2. **Tree shake Firebase:**
   ```typescript
   // ❌ Import entire SDK
   import firebase from 'firebase/app';
   
   // ✅ Import only needed modules
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   ```

3. **Remove unused dependencies:**
   ```bash
   npm install -g depcheck
   depcheck
   npm uninstall <unused-package>
   ```

---

## Troubleshooting

### Common Issues

#### 1. **Users Can't Login**

**Symptoms:**
- "Invalid credentials" error
- Infinite loading on login

**Diagnosis:**
```bash
# Check Firebase Auth status
firebase auth:users:list

# Check Firestore rules
firebase deploy --only firestore:rules --project production --dry-run
```

**Solutions:**
- Verify email/password in Firebase Console
- Check Firestore rules allow user read
- Check App Check tokens valid
- Clear browser cache

---

#### 2. **Data Not Syncing**

**Symptoms:**
- New data doesn't appear
- Updates not reflected in UI

**Diagnosis:**
```typescript
// Check network status
navigator.onLine // true/false

// Check Firestore connection
import { enableNetwork, disableNetwork } from 'firebase/firestore';
await enableNetwork(db);
```

**Solutions:**
- Check internet connection
- Verify Firestore indexes deployed
- Check browser console for errors
- Force refresh (Ctrl+Shift+R)

---

#### 3. **High Error Rate in Sentry**

**Symptoms:**
- Sentry dashboard shows spike in errors
- Specific error repeating

**Investigation:**
1. Group errors by:
   - Error message
   - Stack trace
   - User browser/OS
2. Check if recent deployment caused it
3. Rollback if critical

**Hotfix procedure:**
```bash
# Rollback to previous version
git log --oneline -10
git revert <commit-hash>
git push origin main

# Deploy immediately
npm run deploy:all
```

---

#### 4. **Performance Degradation**

**Symptoms:**
- Slow page loads (> 5s)
- Firebase quota exceeded

**Check quotas:**
```bash
# Firestore reads/writes
gcloud firestore operations list --limit=100

# Cloud Functions invocations
gcloud functions logs read --limit=100
```

**Solutions:**
- Optimize queries (add indexes)
- Implement pagination (limit results to 20-50)
- Cache frequently accessed data
- Upgrade Firebase plan if hitting free tier limits

---

## Emergency Procedures

### Production Down (P0 Incident)

**Steps:**

1. **Alert team:**
   - Post in #incidents Slack channel
   - Call on-call engineer

2. **Enable maintenance mode:**
   ```bash
   # Deploy maintenance page
   firebase hosting:channel:deploy maintenance
   ```

3. **Investigate:**
   - Check Sentry for errors
   - Check Firebase Console for outages
   - Check Google Cloud Status: https://status.cloud.google.com

4. **Fix:**
   - If code bug: Rollback or hotfix
   - If Firebase issue: Wait for resolution, communicate to users
   - If quota exceeded: Upgrade plan or implement throttling

5. **Verify fix:**
   - Test in staging
   - Deploy to production
   - Monitor for 30 minutes

6. **Post-mortem:**
   - Document incident in `docs/INCIDENTS.md`
   - Root cause analysis
   - Action items to prevent recurrence

---

### Data Breach (P1 Incident)

**Steps:**

1. **Contain:**
   - Disable affected user accounts
   - Rotate API keys
   - Block suspicious IP addresses

2. **Assess damage:**
   - Check audit logs for accessed data
   - Identify affected users

3. **Notify:**
   - Email affected users within 72 hours (GDPR)
   - Report to authorities if required

4. **Remediate:**
   - Fix security vulnerability
   - Force password reset for affected users
   - Review and tighten Firestore rules

5. **Monitor:**
   - Increase logging for 30 days
   - Watch for suspicious activity

---

### Contacts

**Escalation Matrix:**

| Issue | Contact | Response Time |
|-------|---------|---------------|
| P0 (Production down) | On-call engineer | 15 min |
| P1 (Security breach) | Security lead | 30 min |
| P2 (Feature broken) | Dev team | 2 hours |
| P3 (Minor bug) | Support team | 24 hours |

**On-Call Rotation:**
- Week 1: Engineer A - +62 811-1111-1111
- Week 2: Engineer B - +62 811-2222-2222
- Backup: Lead Engineer - +62 811-9999-9999

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Maintained by:** NataCarePM DevOps Team
