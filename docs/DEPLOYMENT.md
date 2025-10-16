# 🚀 Deployment Guide - NataCarePM

**Version:** 2.0  
**Last Updated:** October 16, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Firebase Deployment](#firebase-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [CI/CD Pipeline](#cicd-pipeline)

---

## ✅ Pre-Deployment Checklist

### **1. Code Quality** ✅
```bash
# Run TypeScript compiler
npm run type-check
# Expected: Found 0 errors

# Run ESLint
npm run lint
# Expected: No critical errors

# Run tests
npm test
# Expected: All tests passing

# Create production build
npm run build
# Expected: Build succeeds without errors
```

**Checklist:**
- [ ] TypeScript: 0 compilation errors
- [ ] ESLint: No critical issues
- [ ] Tests: All passing (85%+ coverage)
- [ ] Build: Completes successfully
- [ ] Bundle size: < 3 MB

---

### **2. Security** 🔒
```bash
# Check for vulnerabilities
npm audit
# Expected: 0 high/critical vulnerabilities

# Verify environment variables
cat .env.production  # Or check hosting platform

# Test Firebase security rules
npm run test:rules  # If you have rules tests
```

**Checklist:**
- [ ] No hardcoded secrets in code
- [ ] All API keys in environment variables
- [ ] Firebase security rules deployed
- [ ] Storage rules deployed
- [ ] npm audit clean (0 critical vulnerabilities)
- [ ] .gitignore configured properly

---

### **3. Performance** ⚡
```bash
# Analyze bundle size
npm run build
# Check dist/ folder size

# Preview production build
npm run preview
# Test performance in browser DevTools
```

**Checklist:**
- [ ] Bundle size optimized (< 3 MB)
- [ ] Code splitting functional
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Lighthouse score > 90

---

### **4. Documentation** 📚

**Checklist:**
- [ ] CHANGELOG.md updated with latest changes
- [ ] README.md reflects current state
- [ ] API documentation up to date
- [ ] Deployment guide current (this document)

---

## ⚙️ Environment Configuration

### **Development (.env.local)**
```env
# Firebase Development
VITE_FIREBASE_API_KEY=AIza...dev
VITE_FIREBASE_AUTH_DOMAIN=natacare-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=natacare-dev
VITE_FIREBASE_STORAGE_BUCKET=natacare-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_GEMINI_API_KEY=AIza...dev

# App Configuration
VITE_APP_ENV=development
VITE_APP_NAME=NataCarePM Dev
```

### **Production (.env.production)**
```env
# Firebase Production
VITE_FIREBASE_API_KEY=AIza...prod
VITE_FIREBASE_AUTH_DOMAIN=natacare-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=natacare-prod
VITE_FIREBASE_STORAGE_BUCKET=natacare-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:ghijkl
VITE_GEMINI_API_KEY=AIza...prod

# App Configuration
VITE_APP_ENV=production
VITE_APP_NAME=NataCarePM
```

### **Environment Variables Reference**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `VITE_GEMINI_API_KEY` | ✅ | Google Gemini AI API key |
| `VITE_APP_ENV` | ⚠️ | Environment name (dev/prod) |
| `VITE_APP_NAME` | ⚠️ | Application display name |

---

## 🏗️ Build Process

### **Step 1: Clean Install**
```bash
# Remove existing node_modules and lock file
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Or use clean install
npm ci
```

### **Step 2: Type Check**
```bash
# Run TypeScript compiler without emitting files
npm run type-check

# Or manually
npx tsc --noEmit
```

**Expected output:**
```
Found 0 errors. Watching for file changes.
```

### **Step 3: Lint Code**
```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### **Step 4: Run Tests**
```bash
# Run test suite
npm test

# With coverage
npm run test:coverage
```

**Expected output:**
```
Test Suites: 15 passed, 15 total
Tests:       127 passed, 127 total
Coverage:    85.4%
```

### **Step 5: Build for Production**
```bash
# Build production bundle
npm run build
```

**Expected output:**
```
vite v5.0.0 building for production...
✓ 1247 modules transformed.
dist/index.html                  0.45 kB │ gzip:  0.30 kB
dist/assets/index-a1b2c3d4.css  124.3 kB │ gzip: 18.7 kB
dist/assets/index-e5f6g7h8.js   842.1 kB │ gzip: 289.4 kB
✓ built in 5.83s
```

### **Step 6: Preview Build**
```bash
# Preview production build locally
npm run preview

# Opens at http://localhost:4173
```

**Manual checks:**
- [ ] Login works
- [ ] Dashboard loads
- [ ] Navigation functional
- [ ] No console errors
- [ ] API calls succeed

---

## 🔥 Firebase Deployment

### **Prerequisites**

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Verify installation
firebase --version

# Login to Firebase
firebase login

# Select project
firebase use your-project-id
```

### **Deployment Methods**

#### **Method 1: Full Deployment (All Services)**

```bash
# Deploy everything (Firestore rules, Storage rules, Hosting)
npm run deploy:all

# Or manually
firebase deploy
```

#### **Method 2: Firestore Rules Only**

```bash
# Deploy Firestore security rules
npm run deploy:rules

# Or manually
firebase deploy --only firestore:rules
```

**Script content (deploy-firebase-rules.ps1 / .sh):**
```bash
#!/bin/bash
echo "Deploying Firebase Security Rules..."

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules  
firebase deploy --only storage

echo "✅ Security rules deployed successfully!"
```

#### **Method 3: Hosting Only**

```bash
# Build and deploy hosting
npm run build && firebase deploy --only hosting

# Or with script
npm run deploy:hosting
```

#### **Method 4: Monitoring Configuration**

```bash
# Deploy monitoring setup
.\deploy-monitoring-production.ps1  # Windows

# Or
bash deploy-monitoring-production.sh  # Linux/Mac
```

### **Firebase Configuration** (`firebase.json`)

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### **Deployment Output**

```
=== Deploying to 'natacare-prod'...

i  deploying firestore, storage, hosting
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules file firestore.rules compiled successfully
i  storage: checking storage.rules for compilation errors...
✔  storage: rules file storage.rules compiled successfully
i  hosting[natacare-prod]: beginning deploy...
i  hosting[natacare-prod]: found 15 files in dist
✔  hosting[natacare-prod]: file upload complete
i  hosting[natacare-prod]: finalizing version...
✔  hosting[natacare-prod]: version finalized
i  hosting[natacare-prod]: releasing new version...
✔  hosting[natacare-prod]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/natacare-prod/overview
Hosting URL: https://natacare-prod.web.app
```

---

## 📊 Monitoring Setup

### **Enable Firebase Performance Monitoring**

```typescript
// Add to firebaseConfig.ts
import { getPerformance } from 'firebase/performance';

export const perf = getPerformance(app);
```

### **Enable Analytics**

```typescript
// Add to firebaseConfig.ts
import { getAnalytics } from 'firebase/analytics';

export const analytics = getAnalytics(app);
```

### **Custom Monitoring Script**

```bash
# Run monitoring deployment
.\deploy-monitoring-production.ps1

# Or
npm run deploy:monitoring
```

### **Monitoring Dashboard Access**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to:
   - **Performance** - App performance metrics
   - **Analytics** - User behavior
   - **Crashlytics** - Error reports

---

## ✅ Post-Deployment Verification

### **Automated Checks**

```bash
# Run verification script
npm run verify:deployment

# Or manual curl test
curl -I https://your-app.web.app
```

### **Manual Verification Checklist**

#### **1. Application Access** ✅
- [ ] App loads at production URL
- [ ] No 404 errors
- [ ] HTTPS enabled
- [ ] Custom domain working (if configured)

#### **2. Authentication** ✅
- [ ] Login page accessible
- [ ] Email/password login works
- [ ] Social login works (if enabled)
- [ ] Logout works
- [ ] Session persists on refresh

#### **3. Core Functionality** ✅
- [ ] Dashboard displays correctly
- [ ] Navigation works
- [ ] Projects can be created
- [ ] Tasks can be added
- [ ] Documents can be uploaded
- [ ] Data saves to Firestore
- [ ] Real-time updates work

#### **4. Finance Modules** ✅
- [ ] Chart of Accounts loads
- [ ] Journal entries work
- [ ] AP/AR modules functional
- [ ] Reports generate

#### **5. Logistics Modules** ✅
- [ ] Material requests work
- [ ] PO creation functional
- [ ] Goods receipt processes
- [ ] Inventory updates

#### **6. AI Features** ✅
- [ ] AI Assistant responds
- [ ] Document intelligence works
- [ ] OCR processing functional

#### **7. Performance** ⚡
- [ ] Page load < 3 seconds
- [ ] No console errors
- [ ] Images load properly
- [ ] API responses < 1 second

#### **8. Security** 🔒
- [ ] Firebase rules enforced
- [ ] Unauthorized access blocked
- [ ] API keys not exposed
- [ ] XSS protection active

### **Monitoring First 24 Hours**

```bash
# Check logs
firebase functions:log

# Check hosting status
firebase hosting:channel:list

# Monitor performance
# Visit Firebase Console → Performance
```

**Watch for:**
- Error rate spikes
- Performance degradation
- User reports
- Failed API calls

---

## 🔄 Rollback Procedures

### **Quick Rollback (Firebase Hosting)**

```bash
# List previous deployments
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live

# Rollback to previous version
firebase hosting:channel:deploy CHANNEL_ID --expires 7d

# Or use Firebase Console:
# 1. Go to Hosting
# 2. Click "Release History"
# 3. Select previous version
# 4. Click "Rollback"
```

### **Emergency Rollback**

```bash
# Immediately rollback to last known good version
firebase hosting:channel:deploy production-backup --expires 1h

# Then fix issue and redeploy
npm run build
firebase deploy --only hosting
```

### **Rollback Checklist**

- [ ] Identify issue causing rollback
- [ ] Execute rollback command
- [ ] Verify rollback successful
- [ ] Notify team
- [ ] Document issue
- [ ] Fix in development
- [ ] Test fix thoroughly
- [ ] Redeploy with fix

---

## 🤖 CI/CD Pipeline

### **GitHub Actions** (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        # ... other env vars
        
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: your-project-id
```

### **Automated Deployment Workflow**

1. **Push to main branch**
2. **GitHub Actions triggered**
3. **Run tests**
4. **Build production bundle**
5. **Deploy to Firebase**
6. **Notify team (Slack/Email)**

---

## 📞 Support & Troubleshooting

### **Common Issues**

#### **Build Fails**
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

#### **Firebase Deployment Fails**
```bash
# Re-authenticate
firebase logout
firebase login

# Check project
firebase projects:list
firebase use your-project-id
```

#### **Environment Variables Not Working**
- Ensure variables start with `VITE_`
- Restart dev server after changing .env
- Check Firebase console for correct values

### **Getting Help**

1. Check Firebase Console logs
2. Review deployment output
3. Check [Firebase Status](https://status.firebase.google.com/)
4. Contact development team
5. Review [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📚 Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Performance Optimization Guide](https://web.dev/performance/)

---

## 🎉 Deployment Success Checklist

After successful deployment:

- [ ] App accessible at production URL
- [ ] All functionality verified
- [ ] Monitoring enabled
- [ ] Team notified
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Backup created
- [ ] Post-deployment report written

---

**Deployment Guide Version:** 2.0  
**Last Updated:** October 16, 2025  
**Next Review:** January 2026

**Status:** ✅ Production Ready

**Questions?** → Contact DevOps team or check [docs/](../docs/)
