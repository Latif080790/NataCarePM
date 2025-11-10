# 🔴 Firestore 400 Error Investigation Report

**Date:** November 10, 2025  
**Production URL:** https://natacara-hns.web.app  
**Firebase Project:** natacara-hns

---

## 📊 Current Status

### ✅ What's Working
1. **Login:** User authentication successful
2. **Build:** TypeScript compilation successful (12.65s, 0 errors)
3. **Deployment:** 137 files deployed successfully
4. **Date Formatting:** Fixed `formatDate()` to handle:
   - Firestore Timestamps (`.toDate()` method)
   - Invalid dates (returns '-' instead of crashing)
   - Null/undefined values
   - JavaScript Date objects
   - Date strings

### ❌ What's NOT Working
1. **Dashboard Data Loading:** Still failing
2. **Firestore Queries:** 17+ errors with status 400
3. **CRUD Operations:** Cannot create/read/update/delete data

---

## 🔍 Error Analysis

### Console Errors (17+ instances)
```
Failed to load resource: the server responded with a status of 400 ()
firestore.googleapis.com/v1/projects/natacara-hns/databases/(default)/documents:batchGet
firestore.googleapis.com/v1/projects/natacara-hns/databases/(default)/documents:runQuery
```

### Error Pattern
- **Type:** HTTP 400 Bad Request
- **Target:** All Firestore API endpoints
- **Frequency:** Every Firestore operation
- **Timing:** After successful authentication

---

## 🧩 Root Cause Hypotheses

### Hypothesis 1: **App Check Still Enabled in Firebase Console** (MOST LIKELY)
**Evidence:**
- Code has App Check disabled: `VITE_APP_CHECK_ENABLED=false`
- `initAppCheck()` commented out in `src/index.tsx`
- **BUT** Firebase Console might still enforce App Check

**Test:**
```bash
# Check Firebase Console
https://console.firebase.google.com/project/natacara-hns/appcheck
```

**Expected:** App Check should be "Not Enforced" or "Disabled"

**Fix if confirmed:**
1. Go to Firebase Console > Build > App Check
2. Click on Web App
3. Set enforcement to "Off" or "Unenforced"
4. Save changes

---

### Hypothesis 2: **Firestore Rules Mismatch**
**Evidence:**
- Rules deployed successfully: ✅
- Rules are permissive (authenticated users allowed): ✅
- Rules file used: `firestore.rules` (relaxed rules)

**Test:**
```bash
firebase firestore:rules --version
```

**Current Rules (deployed):**
```javascript
match /projects/{projectId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated();
}
```

**Fix if needed:**
- Already using most permissive rules for debugging
- No further rule relaxation possible

---

### Hypothesis 3: **Firebase SDK Version Incompatibility**
**Evidence:**
- Using Firebase SDK v11.1.0
- Firestore API endpoint: `/v1/projects/.../documents`

**Test:**
Check package.json:
```json
"firebase": "^11.1.0"
```

**Fix if needed:**
```bash
npm update firebase
npm run build
firebase deploy --only hosting
```

---

### Hypothesis 4: **CORS Configuration Issue**
**Evidence:**
- Production domain: `natacara-hns.web.app`
- Auth domain: `natacara-hns.firebaseapp.com`
- Potential CORS mismatch

**Test:**
Check browser console for CORS errors

**Fix if needed:**
Update Firebase Console > Authentication > Authorized domains

---

### Hypothesis 5: **Auth Token Not Sent with Requests**
**Evidence:**
- Login successful ✅
- `authGuard.ts` implemented ✅
- `waitForAuth()` called before queries ✅

**Test:**
Check Network tab in DevTools:
- Look for `Authorization` header in Firestore requests
- Verify Firebase ID token is present

**Fix if needed:**
```typescript
// Add explicit token refresh
const user = auth.currentUser;
if (user) {
  await user.getIdToken(true); // Force refresh
}
```

---

## 🔧 Implemented Fixes (Already Done)

### 1. ✅ Date Formatting Fix
**File:** `src/constants.ts`  
**Changes:**
- Added Firestore Timestamp support (`.toDate()`)
- Added null/undefined handling
- Added invalid date detection
- Returns '-' for invalid dates instead of throwing error

**Code:**
```typescript
export const formatDate = (dateInput: string | Date | { toDate?: () => Date } | null | undefined): string => {
  try {
    if (!dateInput) return '-';
    
    // Handle Firestore Timestamp
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      const date = dateInput.toDate();
      if (isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('id-ID', { /* ... */ }).format(date);
    }
    
    // Handle Date object
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) return '-';
      return new Intl.DateTimeFormat('id-ID', { /* ... */ }).format(dateInput);
    }
    
    // Handle string
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('id-ID', { /* ... */ }).format(date);
    }
    
    return '-';
  } catch (error) {
    console.error('[formatDate] Error:', error, dateInput);
    return '-';
  }
};
```

### 2. ✅ Auth Guard Implementation
**File:** `src/utils/authGuard.ts` (159 lines)  
**Functions:**
- `waitForAuth()` - Wait for auth state with 5s timeout
- `requireAuth()` - Throw if not authenticated
- `withAuthRetry()` - Retry with exponential backoff

### 3. ✅ ProjectContext Update
**File:** `src/contexts/ProjectContext.tsx`  
**Changes:**
- Added `await waitForAuth()` before data fetch
- Added user logout check

### 4. ✅ ProjectService Update
**File:** `src/api/projectService.ts`  
**Changes:**
- Added `await requireAuth()` to `getWorkspaces()` and `getProjectById()`
- Replaced `withRetry()` with `withAuthRetry()`

---

## 🎯 Next Steps (Immediate Actions Required)

### Step 1: Check App Check in Firebase Console
1. **Open:** https://console.firebase.google.com/project/natacara-hns/appcheck
2. **Verify:** App Check enforcement status
3. **Action:** Disable if enabled

### Step 2: Check Network Requests
1. **Open DevTools:** F12 → Network tab
2. **Filter:** `firestore.googleapis.com`
3. **Inspect:** Request headers for `Authorization` token
4. **Look for:** CORS errors, missing headers

### Step 3: Check Firebase Auth Status
1. **Open DevTools:** F12 → Console
2. **Run:**
   ```javascript
   firebase.auth().currentUser
   ```
3. **Verify:** User object exists with valid UID

### Step 4: Test with Firebase Emulator (Local Testing)
```bash
# Install emulators
firebase init emulators

# Start emulators
firebase emulators:start

# Update .env.local
VITE_USE_EMULATOR=true

# Run dev server
npm run dev
```

### Step 5: Enable Detailed Logging
Add to `src/api/projectService.ts`:
```typescript
import { enableIndexedDbPersistence, enableNetwork } from 'firebase/firestore';

// Enable offline persistence and logging
enableIndexedDbPersistence(db).catch((err) => {
  console.error('[Firestore] Persistence error:', err);
});
```

---

## 📝 Testing Checklist

### Pre-Test Preparation
- [ ] Clear browser cache: Ctrl+Shift+Delete
- [ ] Hard refresh: Ctrl+F5
- [ ] Open DevTools: F12
- [ ] Open Console tab: Check for errors
- [ ] Open Network tab: Filter Firestore requests

### Test Sequence
1. **Login**
   - [ ] Navigate to https://natacara-hns.web.app
   - [ ] Enter credentials
   - [ ] Click "Masuk"
   - [ ] Verify redirect to dashboard
   - [ ] **Check Console:** Any auth errors?

2. **Dashboard Load**
   - [ ] Wait for dashboard to render
   - [ ] **Check Console:** How many 400 errors?
   - [ ] **Check Network:** Status of Firestore requests
   - [ ] **Check Network:** Request headers (Authorization?)

3. **Manual Firestore Test**
   - [ ] Open Console
   - [ ] Run:
     ```javascript
     // Get current user
     const user = firebase.auth().currentUser;
     console.log('User:', user?.uid);
     
     // Get ID token
     const token = await user.getIdToken();
     console.log('Token:', token.substring(0, 50) + '...');
     
     // Try simple query
     const snapshot = await firebase.firestore().collection('projects').limit(1).get();
     console.log('Projects:', snapshot.size);
     ```
   - [ ] **Check:** Does it succeed or fail?
   - [ ] **Record:** Exact error message if fails

4. **App Check Verification**
   - [ ] Open: https://console.firebase.google.com/project/natacara-hns/appcheck
   - [ ] **Check:** Enforcement status
   - [ ] **Screenshot:** Current settings

---

## 🚨 Critical Information Needed

### From User:
1. **Firebase Console Screenshot:**
   - Go to: https://console.firebase.google.com/project/natacara-hns/appcheck
   - Take screenshot of App Check settings
   - Share here

2. **Network Request Details:**
   - Open DevTools → Network
   - Filter: `firestore.googleapis.com`
   - Click on any failed (red) request
   - Go to "Headers" tab
   - **Screenshot:**
     - Request Headers (especially `Authorization`)
     - Response Headers
     - Status Code details

3. **Console Error Details:**
   - Open DevTools → Console
   - Click on any red error
   - Expand full error stack
   - Copy and paste exact error message

---

## 💡 Temporary Workaround (If Needed)

### Option 1: Use Firebase Emulator (Development)
```bash
firebase emulators:start
# Then connect app to emulator
```

### Option 2: Increase Auth Timeout
```typescript
// In authGuard.ts
const MAX_WAIT_TIME = 30000; // Increase from 5s to 30s
```

### Option 3: Add Retry with Longer Delays
```typescript
// In projectService.ts
const result = await withAuthRetry(
  () => getDocs(collection(db, 'projects')),
  { 
    maxAttempts: 10,
    initialDelay: 5000  // Start with 5s delay
  }
);
```

---

## 📚 Reference Documentation

### Firebase App Check
- https://firebase.google.com/docs/app-check
- How to disable: https://firebase.google.com/docs/app-check/web/debug-provider

### Firestore Troubleshooting
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/firestore/client/offline-data

### Common 400 Errors
1. **Invalid request format** - Malformed API call
2. **Missing required fields** - API schema mismatch
3. **App Check failure** - Token validation failed (MOST COMMON)
4. **Invalid authentication** - Token expired or invalid
5. **CORS issue** - Cross-origin request blocked

---

## ✅ Success Criteria

Application will be considered **fixed** when:
1. ✅ Login successful (ALREADY WORKING)
2. ✅ Dashboard loads project data without errors
3. ✅ Console shows 0 Firestore 400 errors
4. ✅ Can create new project
5. ✅ Can update existing project
6. ✅ Can view project details
7. ✅ Can delete project (if permitted)

---

## 📞 Support Resources

### Firebase Support
- Console: https://console.firebase.google.com/project/natacara-hns
- Status: https://status.firebase.google.com
- Community: https://stackoverflow.com/questions/tagged/firebase

### Debugging Tools
- Firebase Debugger: https://firebase.google.com/docs/reference/js/firestore_
- Chrome DevTools Network Tab
- Firebase Emulator Suite

---

**Last Updated:** November 10, 2025  
**Status:** 🔴 Investigating (Date errors fixed, Firestore 400 errors remain)  
**Next Action:** User to provide App Check screenshot and Network request details
