# Firebase v10 → v12 Migration Plan 🔥

**Date:** November 12, 2025  
**Current Version:** Firebase 10.14.1  
**Target Version:** Firebase 12.5.0  
**Priority:** HIGH (Fixes 10 moderate vulnerabilities)  
**Estimated Time:** 4-6 hours  
**Status:** Planning Phase

---

## 📊 Executive Summary

### Vulnerabilities Fixed
**Total:** 10 moderate severity vulnerabilities
- **8 Firebase modules** affected by `undici` CVE (moderate)
- **2 undici vulnerabilities:**
  1. CVE (GHSA-c76h-2ccp-4975): Use of Insufficiently Random Values
  2. CVE (GHSA-cxrh-j4jr-qwg3): Denial of Service via bad certificate data

### Affected Modules
```
@firebase/auth                v1.7.7 → v12.x
@firebase/auth-compat          v0.5.12 → v12.x
@firebase/firestore            v4.7.0 → v12.x
@firebase/firestore-compat     v0.3.25 → v12.x
@firebase/functions            v0.11.7 → v12.x
@firebase/functions-compat     v0.3.13 → v12.x
@firebase/storage              v0.13.0 → v12.x
@firebase/storage-compat       v0.3.10 → v12.x
undici                         v6.0.0-6.21.1 → v6.21.2+
```

---

## 🔍 Impact Analysis

### Codebase Scan Results
**Total Firebase Imports:** 100+ files

#### Most Used APIs (Top 10)
1. **Firestore:** 80+ files
   - `collection`, `doc`, `getDoc`, `getDocs`, `addDoc`, `updateDoc`, `deleteDoc`
   - `query`, `where`, `orderBy`, `limit`
   - `Timestamp`, `serverTimestamp`, `increment`

2. **Auth:** 15+ files
   - `getAuth`, `onAuthStateChanged`, `signInWithEmailAndPassword`
   - `createUserWithEmailAndPassword`, `signOut`, `updateProfile`
   - `sendPasswordResetEmail`, `updatePassword`

3. **Storage:** 8+ files
   - `ref`, `uploadBytes`, `uploadBytesResumable`, `getDownloadURL`
   - `listAll`, `deleteObject`

4. **Functions:** 3+ files
   - `getFunctions`, `httpsCallable`

5. **Messaging:** 1 file
   - `getMessaging`, `getToken`, `onMessage`

#### Critical Files Requiring Updates
| File | Firebase APIs Used | Complexity |
|------|-------------------|------------|
| `src/firebaseConfig.ts` | initializeApp, initializeFirestore | HIGH |
| `src/contexts/AuthContext.tsx` | Auth (6+ methods) | HIGH |
| `src/api/projectService.ts` | Firestore + Storage | MEDIUM |
| `src/api/authService.ts` | Auth + Firestore + Functions | HIGH |
| `src/api/*.ts` (80+ files) | Firestore queries | MEDIUM |
| `src/services/authService.ts` | Auth operations | MEDIUM |
| `src/services/disasterRecoveryService.ts` | Firestore + Storage | MEDIUM |
| `src/components/CameraCapture.tsx` | Storage uploads | LOW |

---

## 🚨 Breaking Changes (v10 → v12)

### 1. **Modular SDK API Changes**
Firebase v12 enforces stricter typing and removes deprecated APIs.

#### Auth API Changes
```typescript
// ❌ DEPRECATED (may be removed in v12)
import { getAuth } from 'firebase/auth';
const auth = getAuth(app);

// ✅ RECOMMENDED (v12 compatible)
import { initializeAuth } from 'firebase/auth';
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
```

#### Firestore Persistence Changes
```typescript
// ❌ OLD (v10) - enableIndexedDbPersistence
import { enableIndexedDbPersistence } from 'firebase/firestore';
await enableIndexedDbPersistence(db);

// ✅ NEW (v12) - initializeFirestore with persistenceSettings
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
});
```

#### Storage API Changes
```typescript
// ❌ OLD (v10)
import { uploadBytes } from 'firebase/storage';
await uploadBytes(ref, file);

// ✅ NEW (v12) - Same API, improved error handling
// No breaking changes, but better TypeScript types
```

### 2. **TypeScript Strictness**
v12 has stricter TypeScript definitions:
- `Timestamp` type imports required explicitly
- Better null/undefined handling
- Stricter query type inference

### 3. **Bundle Size Changes**
v12 has improved tree-shaking:
- Smaller bundle size (est. 10-15% reduction)
- Better code splitting
- Improved lazy loading

### 4. **Node.js 18+ Required**
v12 requires Node.js 18 or higher (we use Node 20 ✅).

---

## 📋 Migration Checklist

### Phase 1: Preparation (30 minutes)
- [ ] **Backup current code**
  ```powershell
  git checkout -b firebase-v12-migration
  git add .
  git commit -m "Pre-migration backup: Firebase v10.14.1"
  ```

- [ ] **Create test environment**
  - Use Firebase emulators for testing
  - Prepare staging Firebase project

- [ ] **Document current behavior**
  - Run full test suite: `npm test`
  - Capture baseline metrics
  - Screenshot critical flows

- [ ] **Review dependencies**
  ```powershell
  npm list firebase
  npm audit
  ```

### Phase 2: Update Dependencies (15 minutes)
- [ ] **Update package.json**
  ```json
  {
    "dependencies": {
      "firebase": "^12.5.0"  // from ^10.14.1
    },
    "devDependencies": {
      "firebase-admin": "^13.6.0"  // already latest
    }
  }
  ```

- [ ] **Install new version**
  ```powershell
  npm install firebase@12.5.0 --save
  npm install --legacy-peer-deps
  ```

- [ ] **Verify installation**
  ```powershell
  npm list firebase
  # Should show: firebase@12.5.0
  ```

### Phase 3: Update firebaseConfig.ts (30 minutes)
- [ ] **Update Firestore initialization**
  ```typescript
  // OLD (v10)
  import { initializeFirestore } from 'firebase/firestore';
  const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });

  // NEW (v12)
  import { 
    initializeFirestore, 
    persistentLocalCache,
    CACHE_SIZE_UNLIMITED 
  } from 'firebase/firestore';

  const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    }),
  });
  ```

- [ ] **Update Auth initialization** (optional enhancement)
  ```typescript
  // NEW (v12 - optional)
  import { 
    initializeAuth, 
    browserLocalPersistence,
    browserPopupRedirectResolver 
  } from 'firebase/auth';

  const auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  ```

- [ ] **Update console logs**
  ```typescript
  console.log('[FIREBASE] Using SDK v12.5.0'); // Update version
  ```

### Phase 4: Update Type Imports (45 minutes)
Search and update all Timestamp imports:

- [ ] **Find all Timestamp usages**
  ```powershell
  grep -r "Timestamp" src/ --include="*.ts" --include="*.tsx"
  ```

- [ ] **Ensure explicit imports**
  ```typescript
  // ✅ Correct (v12 requires explicit import)
  import { Timestamp } from 'firebase/firestore';

  // ❌ May fail in v12
  // Using Timestamp without import
  ```

- [ ] **Update Query types**
  ```typescript
  // v12 has better type inference
  import { Query, DocumentData } from 'firebase/firestore';
  const q: Query<DocumentData> = query(collection(db, 'items'));
  ```

### Phase 5: Update Test Mocks (30 minutes)
- [ ] **Update Vitest mocks** (`src/api/__tests__/*.test.ts`)
  ```typescript
  // Update Firebase version in mock setup
  vi.mock('firebase/firestore', () => ({
    // v12 exports
    getFirestore: vi.fn(),
    collection: vi.fn(),
    // ... rest of mocks
  }));
  ```

- [ ] **Update Firestore test utilities**
  ```typescript
  // v12 may have new testing utilities
  import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
  ```

### Phase 6: Update Functions (if applicable) (30 minutes)
- [ ] **Check Cloud Functions compatibility**
  ```powershell
  cd functions
  npm list firebase-admin
  # Should be v13.6.0 (already compatible with v12 client SDK)
  ```

- [ ] **Update Functions if needed**
  ```typescript
  // functions/package.json
  {
    "engines": {
      "node": "20"  // Already correct
    },
    "dependencies": {
      "firebase-admin": "^13.6.0",  // Already latest
      "firebase-functions": "^6.2.0"  // Check if update needed
    }
  }
  ```

### Phase 7: Testing (90 minutes)
- [ ] **Run unit tests**
  ```powershell
  npm test
  # Expected: 51/51 tests passing
  ```

- [ ] **Run E2E tests**
  ```powershell
  npm run test:e2e
  ```

- [ ] **Manual testing checklist**
  - [ ] Login/Logout flow
  - [ ] Create project
  - [ ] Add RAB items
  - [ ] Upload files (Storage)
  - [ ] Real-time listeners (Firestore)
  - [ ] Cloud Functions calls
  - [ ] Offline mode (if re-enabled)

- [ ] **Performance testing**
  ```powershell
  npm run lighthouse
  # Compare with baseline
  ```

- [ ] **Bundle size analysis**
  ```powershell
  npm run build
  # Check dist/ folder size
  # Expected: 10-15% reduction
  ```

### Phase 8: Deployment (30 minutes)
- [ ] **Deploy to staging**
  ```powershell
  npm run build
  firebase use staging
  firebase deploy --only hosting
  ```

- [ ] **Smoke tests on staging**
  - [ ] Login works
  - [ ] Data loads
  - [ ] No console errors

- [ ] **Monitor Sentry for errors**
  - Check Sentry dashboard
  - Watch for new Firebase-related errors

- [ ] **Production deployment**
  ```powershell
  firebase use production
  .\deploy-nocache.ps1
  ```

### Phase 9: Post-Migration (15 minutes)
- [ ] **Verify vulnerabilities fixed**
  ```powershell
  npm audit
  # Expected: 0 moderate Firebase vulnerabilities
  ```

- [ ] **Update documentation**
  - [ ] Update `.github/copilot-instructions.md` (line 53)
  - [ ] Update `firebaseConfig.ts` comments
  - [ ] Update `README.md` if needed

- [ ] **Monitor for 24 hours**
  - [ ] Sentry error rates
  - [ ] GA4 user metrics
  - [ ] Firebase usage (Firestore reads/writes)

- [ ] **Clean up**
  ```powershell
  git add .
  git commit -m "Complete Firebase v12 migration"
  git push origin firebase-v12-migration
  # Create PR for review
  ```

---

## 🎯 Success Criteria

### Must Have ✅
- [ ] All 10 Firebase vulnerabilities resolved
- [ ] `npm audit` shows 0 moderate Firebase issues
- [ ] All 51 unit tests passing
- [ ] All E2E tests passing
- [ ] No console errors in production
- [ ] Auth flows working (login, logout, password reset)
- [ ] Firestore CRUD operations working
- [ ] Storage uploads working

### Nice to Have 🎁
- [ ] 10-15% bundle size reduction achieved
- [ ] Lighthouse performance score maintained or improved
- [ ] Offline persistence re-enabled (if disabled)
- [ ] Improved TypeScript type safety
- [ ] Zero Sentry errors for 24 hours post-deployment

---

## ⚠️ Risk Assessment

### High Risk Areas
1. **Authentication Flow** (HIGH)
   - Critical: Login/logout must work
   - Mitigation: Test extensively in staging
   - Rollback: Keep v10 branch ready

2. **Firestore Persistence** (MEDIUM)
   - Currently disabled due to 400 errors
   - v12 has new persistence API
   - Mitigation: Test cache behavior thoroughly

3. **Cloud Functions** (MEDIUM)
   - Client SDK v12 must work with Functions
   - Mitigation: Admin SDK already v13 (compatible)

4. **Type Errors** (LOW-MEDIUM)
   - v12 has stricter TypeScript
   - Mitigation: Run `npm run type-check` frequently

### Rollback Plan
If critical issues occur:
```powershell
# 1. Revert package.json
git checkout main -- package.json

# 2. Reinstall v10
npm install firebase@10.14.1 --save

# 3. Revert code changes
git checkout main -- src/firebaseConfig.ts

# 4. Redeploy
.\deploy-nocache.ps1

# 5. Notify team
# Post in Slack/Discord about rollback
```

---

## 📚 Key Resources

### Official Documentation
- [Firebase v12 Release Notes](https://firebase.google.com/support/release-notes/js)
- [Migration Guide v10→v12](https://firebase.google.com/docs/web/modular-upgrade)
- [Breaking Changes](https://firebase.google.com/support/releases)

### Security Advisories
- [GHSA-c76h-2ccp-4975](https://github.com/advisories/GHSA-c76h-2ccp-4975) - Undici random values
- [GHSA-cxrh-j4jr-qwg3](https://github.com/advisories/GHSA-cxrh-j4jr-qwg3) - Undici DoS

### Testing Resources
- [Firebase Test Lab](https://firebase.google.com/docs/test-lab)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite)

---

## 🔧 Code Changes Preview

### 1. firebaseConfig.ts (Core Change)
```typescript
// BEFORE (v10)
import { initializeFirestore } from 'firebase/firestore';

const db: Firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

// Persistence disabled due to 400 errors
// (commented out code)

// AFTER (v12)
import { 
  initializeFirestore, 
  persistentLocalCache,
  CACHE_SIZE_UNLIMITED 
} from 'firebase/firestore';

const db: Firestore = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    tabManager: experimentalTabManager(), // Optional: multi-tab support
  }),
});

console.log('[FIREBASE] Using SDK v12.5.0');
console.log('[FIREBASE] ✅ Persistence enabled with new API');
```

### 2. Type Imports (Pattern)
```typescript
// Files: src/types/*.ts (10+ files)

// BEFORE (v10 - may work without explicit import)
interface MyType {
  createdAt: Timestamp;
}

// AFTER (v12 - must import explicitly)
import { Timestamp } from 'firebase/firestore';

interface MyType {
  createdAt: Timestamp;
}
```

### 3. Query Type Inference (Auto-improved)
```typescript
// v12 has better type inference
// No code changes needed, but TypeScript will catch more errors

// Example: This will now error if 'items' collection doesn't match type
const q = query(
  collection(db, 'items'),
  where('status', '==', 'active')
);
```

---

## 📊 Estimated Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Preparation | 30 min | - |
| 2 | Update Dependencies | 15 min | Phase 1 |
| 3 | Update firebaseConfig.ts | 30 min | Phase 2 |
| 4 | Update Type Imports | 45 min | Phase 2 |
| 5 | Update Test Mocks | 30 min | Phase 2 |
| 6 | Update Functions | 30 min | Phase 2 |
| 7 | Testing | 90 min | Phases 3-6 |
| 8 | Deployment | 30 min | Phase 7 |
| 9 | Post-Migration | 15 min | Phase 8 |
| **TOTAL** | | **4-6 hours** | |

**Breakdown:**
- Development: 2.5 hours
- Testing: 1.5 hours
- Deployment: 0.5 hours
- Buffer: 0.5-1.5 hours

---

## 🚀 Quick Start Guide

### For Immediate Migration
```powershell
# 1. Create migration branch
git checkout -b firebase-v12-migration

# 2. Update package.json
# Edit: "firebase": "^12.5.0"

# 3. Install
npm install --legacy-peer-deps

# 4. Update firebaseConfig.ts
# See "Code Changes Preview" section above

# 5. Test
npm test
npm run test:e2e

# 6. Build
npm run build

# 7. Lighthouse check
npm run lighthouse

# 8. Deploy staging
firebase use staging
firebase deploy --only hosting

# 9. Verify & deploy production
firebase use production
.\deploy-nocache.ps1
```

### For Staged Migration (Recommended)
1. **Week 1:** Planning + Dependency Update
2. **Week 2:** Code Changes + Unit Tests
3. **Week 3:** E2E Tests + Staging Deployment
4. **Week 4:** Production Deployment + Monitoring

---

## ✅ Completion Criteria

Migration is **COMPLETE** when:
1. ✅ Firebase v12.5.0 installed
2. ✅ All tests passing (51/51 unit + E2E)
3. ✅ `npm audit` shows 0 Firebase vulnerabilities
4. ✅ Production deployment successful
5. ✅ No Sentry errors for 24 hours
6. ✅ Bundle size reduced by 10-15%
7. ✅ Documentation updated
8. ✅ Team notified

---

**Status:** 📋 Planning Complete - Ready for Implementation  
**Next Step:** Phase 1 - Preparation (create migration branch)  
**Owner:** Development Team  
**Last Updated:** November 12, 2025
