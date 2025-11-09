# NataCarePM - Deployment Guide
**Production Deployment & CI/CD**

## Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [First-Time Deployment](#first-time-deployment)
4. [Continuous Deployment](#continuous-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Rollback Procedures](#rollback-procedures)
7. [Health Checks](#health-checks)
8. [Production Checklist](#production-checklist)

---

## Prerequisites

### Required Accounts

- ✅ **Firebase Project** - Production & Staging
- ✅ **Google Cloud Platform** - Billing enabled
- ✅ **GitHub Repository** - Source code
- ✅ **Sentry Account** - Error monitoring
- ✅ **Google Analytics 4** - Analytics tracking

### Required Tools

```bash
# Node.js (v18 LTS recommended)
node --version  # v18.x.x

# npm (v9+)
npm --version  # 9.x.x

# Firebase CLI
npm install -g firebase-tools
firebase --version  # 13.x.x

# Git
git --version  # 2.x.x
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Latif080790/NataCarePM.git
cd NataCarePM
```

### 2. Install Dependencies

```bash
npm install
```

**Expected time:** ~2-3 minutes

---

### 3. Environment Variables

**Create `.env.production`:**

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=natacare-pm.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=natacare-pm
VITE_FIREBASE_STORAGE_BUCKET=natacare-pm.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Gemini API (AI Assistant)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Sentry (Error Monitoring)
VITE_SENTRY_DSN=https://xxxxxxxxxxxxx@o1234567.ingest.sentry.io/1234567
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# App Configuration
VITE_APP_URL=https://natacarepm.web.app
VITE_APP_NAME=NataCarePM
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true
VITE_ENABLE_OFFLINE=true
```

**Get Firebase Config:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project → **Project Settings** → **General**
3. Scroll to **"Your apps"** → Web app
4. Copy config values

**Get Gemini API Key:**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy key

**Get Sentry DSN:**

1. Go to [Sentry.io](https://sentry.io)
2. Create project → Select "React"
3. Copy DSN from setup instructions

**Get GA4 Measurement ID:**

1. Go to [Google Analytics](https://analytics.google.com)
2. Admin → Data Streams → Web
3. Copy **Measurement ID** (format: `G-XXXXXXXXXX`)

---

### 4. Firebase Configuration

**Login to Firebase:**

```bash
firebase login
```

**Initialize Firebase (if not done):**

```bash
firebase init
```

Select:
- ✅ Hosting
- ✅ Firestore
- ✅ Storage
- ✅ Functions

**Set Firebase Project:**

```bash
# Production
firebase use production

# Staging
firebase use staging
```

**Create aliases (if not exist):**

```bash
firebase use --add
# Select production project → alias: production
firebase use --add
# Select staging project → alias: staging
```

---

## First-Time Deployment

### Step 1: Build Application

```bash
npm run build
```

**Output:** `dist/` folder with optimized files

**Verify build:**
- Check `dist/index.html` exists
- Check `dist/assets/` contains JS/CSS files
- Total size should be ~2-3 MB (uncompressed)

---

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules --project production
```

**Verify:**
1. Go to Firebase Console → Firestore → Rules
2. Check rules deployed successfully
3. Test with emulator: `firebase emulators:start --only firestore`

---

### Step 3: Deploy Cloud Functions

```bash
cd functions
npm install
cd ..

firebase deploy --only functions --project production
```

**Functions deployed:**
- `scheduleFirestoreBackup` - Daily backup at 2 AM UTC
- `cleanupOldBackups` - Delete backups > 30 days
- `onUserCreate` - Setup new user defaults

**Expected time:** ~3-5 minutes

---

### Step 4: Deploy Storage Rules

```bash
firebase deploy --only storage --project production
```

---

### Step 5: Deploy Hosting

```bash
firebase deploy --only hosting --project production
```

**Expected time:** ~1-2 minutes

**Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/natacare-pm/overview
Hosting URL: https://natacarepm.web.app
```

---

### Step 6: Verify Deployment

**Automated health check:**

```bash
# Run smoke tests against production
VITE_APP_URL=https://natacarepm.web.app npm run test:e2e
```

**Manual verification:**

1. Open `https://natacarepm.web.app`
2. Test:
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Create project works
   - ✅ No console errors
3. Check performance:
   - Run Lighthouse: `npm run lighthouse`
   - Score should be ≥ 80

---

## Continuous Deployment

### Git Workflow

**Branches:**
- `main` - Production (auto-deploy)
- `staging` - Staging environment (auto-deploy)
- `develop` - Development (manual deploy)
- `feature/*` - Feature branches (no deploy)

**Workflow:**

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# After review → Merge to develop

# Test on staging
git checkout staging
git merge develop
git push origin staging
# Auto-deploys to staging.natacarepm.web.app

# If tests pass → Merge to main
git checkout main
git merge staging
git push origin main
# Auto-deploys to natacarepm.web.app
```

---

### Deployment Commands

**Deploy everything:**
```bash
npm run deploy:all
```

**Deploy specific components:**
```bash
# Hosting only (frontend)
npm run deploy:hosting

# Firestore rules only
npm run deploy:firestore

# Cloud Functions only
firebase deploy --only functions

# All Firebase services
firebase deploy
```

---

### Preview Channels (Testing)

**Create preview:**

```bash
firebase hosting:channel:deploy preview-feature-123 --expires 7d
```

**Output:**
```
✔  Channel URL (preview-feature-123): https://natacare-pm--preview-feature-123-xxxxx.web.app
```

**Share URL** with team for testing before merging.

**Delete preview:**
```bash
firebase hosting:channel:delete preview-feature-123
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint:check
      
      - name: Unit tests
        run: npm run test:run
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
      
      - name: Run Lighthouse
        run: npm run lighthouse
      
      - name: E2E Smoke Tests
        run: npm run test:e2e
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

  deploy:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: natacare-pm
      
      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment ${{ job.status }}: ${{ github.event.head_commit.message }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

### Setup GitHub Secrets

1. Go to GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=natacare-pm.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=natacare-pm
VITE_FIREBASE_STORAGE_BUCKET=natacare-pm.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxx
GEMINI_API_KEY=AIzaSy...
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
TEST_USER_EMAIL=test@natacare.com
TEST_USER_PASSWORD=Test123!@#
FIREBASE_SERVICE_ACCOUNT=<contents of serviceAccountKey.json>
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

---

### Automatic Deployment

**Trigger:** Push to `main` branch

**Flow:**
1. ✅ Code pushed to GitHub
2. ✅ GitHub Actions runs tests
3. ✅ Type check → Lint → Unit tests → Build
4. ✅ Lighthouse audit (performance check)
5. ✅ E2E smoke tests (critical flows)
6. ✅ If all pass → Deploy to Firebase Hosting
7. ✅ Notify team via Slack

**Time:** ~5-8 minutes (from push to live)

---

## Rollback Procedures

### Quick Rollback (Firebase Hosting)

**Firebase Hosting keeps deployment history.**

**View versions:**
```bash
firebase hosting:releases:list --project production
```

**Output:**
```
Release      Version      Deploy Time
------------ ------------ ---------------------------
abc123def    v1.2.3       2024-01-15 10:30:00 UTC ← Current
xyz789uvw    v1.2.2       2024-01-14 08:15:00 UTC
```

**Rollback to previous version:**
```bash
# Clone previous release
firebase hosting:clone natacare-pm:abc123def natacare-pm:live
```

**Or re-deploy specific version:**
```bash
git checkout <previous-commit-hash>
npm run build
firebase deploy --only hosting
```

**Time:** ~2 minutes

---

### Rollback Code Changes

**Revert last commit:**
```bash
git revert HEAD
git push origin main
```

**Revert to specific commit:**
```bash
git log --oneline -10  # Find commit hash
git revert <commit-hash>
git push origin main
```

**GitHub Actions auto-deploys the revert.**

---

### Emergency Rollback Script

**Create:** `scripts/rollback.sh`

```bash
#!/bin/bash
# Emergency rollback script

echo "🚨 EMERGENCY ROLLBACK"
echo "This will revert to the previous production version."
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled."
  exit 1
fi

# Get last 2 commits
previous_commit=$(git log --oneline -2 | tail -1 | awk '{print $1}')

echo "Rolling back to: $previous_commit"

# Revert changes
git revert HEAD --no-edit
git push origin main

echo "✅ Rollback initiated. GitHub Actions will deploy in ~5 minutes."
echo "Monitor: https://github.com/Latif080790/NataCarePM/actions"
```

**Usage:**
```bash
chmod +x scripts/rollback.sh
./scripts/rollback.sh
```

---

## Health Checks

### Post-Deployment Verification

**Automated (GitHub Actions):**
```bash
npm run test:e2e
```

**Manual checks:**

```bash
# 1. Check app loads
curl -I https://natacarepm.web.app
# Expected: HTTP/2 200

# 2. Check API endpoint
curl https://natacarepm.web.app/api/health
# Expected: {"status": "ok"}

# 3. Check Firestore connection
# Login to app → Create test project → Verify saved

# 4. Check error monitoring
# Open Sentry → No new critical errors

# 5. Check analytics
# Open GA4 → Real-time users > 0
```

---

### Monitoring Dashboard

**Create:** `scripts/health-check.js`

```javascript
const axios = require('axios');

async function healthCheck() {
  const checks = [
    { name: 'Frontend', url: 'https://natacarepm.web.app' },
    { name: 'Firebase Auth', url: 'https://natacare-pm.firebaseapp.com/__/auth/handler' },
  ];
  
  for (const check of checks) {
    try {
      const response = await axios.get(check.url, { timeout: 5000 });
      console.log(`✅ ${check.name}: OK (${response.status})`);
    } catch (error) {
      console.error(`❌ ${check.name}: FAILED (${error.message})`);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 All health checks passed!');
}

healthCheck();
```

**Run:**
```bash
node scripts/health-check.js
```

---

## Production Checklist

### Before Deployment

- [ ] All tests pass locally: `npm test && npm run test:e2e`
- [ ] Type check passes: `npm run type-check`
- [ ] Linting passes: `npm run lint:check`
- [ ] Build succeeds: `npm run build`
- [ ] Lighthouse score ≥ 80: `npm run lighthouse`
- [ ] No console errors in production build
- [ ] Environment variables updated (`.env.production`)
- [ ] Database migrations applied (if any)
- [ ] Firestore rules deployed: `firebase deploy --only firestore:rules`
- [ ] Cloud Functions deployed: `firebase deploy --only functions`
- [ ] Backup taken: `gcloud firestore export gs://natacare-backups/pre-deploy/$(date +%Y-%m-%d)`

### During Deployment

- [ ] Monitor GitHub Actions workflow
- [ ] Check for deployment errors
- [ ] Verify Firebase Hosting URL updates
- [ ] Run health checks immediately after deploy

### After Deployment

- [ ] Test critical flows (login, create project, generate report)
- [ ] Check Sentry for new errors (first 30 minutes)
- [ ] Monitor GA4 for traffic spike/drops
- [ ] Verify performance metrics (Lighthouse)
- [ ] Notify team in Slack: "✅ v1.2.3 deployed to production"
- [ ] Update changelog: `CHANGELOG.md`
- [ ] Tag release: `git tag v1.2.3 && git push --tags`

---

## Troubleshooting Deployment

### Build Fails

**Error:** `Module not found`

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Firebase Deploy Fails

**Error:** `Permission denied`

**Solution:**
```bash
firebase login --reauth
firebase use production
```

---

### Hosting Shows Old Version

**Cause:** Browser cache

**Solution:**
```bash
# Clear Firebase CDN cache
firebase hosting:channel:deploy live --only natacarepm

# Or wait 5-10 minutes for CDN propagation
```

**For users:**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

### Firestore Rules Not Applied

**Check rules syntax:**
```bash
firebase deploy --only firestore:rules --project production --dry-run
```

**Test rules:**
```bash
firebase emulators:start --only firestore
# Then run: npm run test:security
```

---

## Summary

### Quick Commands

| Task | Command |
|------|---------|
| Build for production | `npm run build` |
| Deploy everything | `npm run deploy:all` |
| Deploy hosting only | `npm run deploy:hosting` |
| Deploy Firestore rules | `npm run deploy:firestore` |
| Run health checks | `node scripts/health-check.js` |
| Rollback | `./scripts/rollback.sh` |
| View deployment history | `firebase hosting:releases:list` |

### Deployment Flow

```
Code Push → GitHub Actions → Tests → Build → Deploy → Health Checks → Notify
```

### Time Estimates

- Manual deployment: ~5-10 minutes
- Automated (CI/CD): ~5-8 minutes
- Rollback: ~2-3 minutes

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Maintained by:** NataCarePM DevOps Team
