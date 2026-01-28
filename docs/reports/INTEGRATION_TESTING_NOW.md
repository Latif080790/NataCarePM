# 🧪 INTEGRATION TESTING - QUICK GUIDE

**Status**: Testing in progress at http://localhost:4173/

---

## 1️⃣ Test Sentry Error Tracking (NOW)

### Step 1: Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for Sentry initialization message:
   ```
   [Sentry] Initialized successfully
   ```

### Step 2: Test Error Capture
Run this command in console:
```javascript
Sentry.captureMessage('🎉 Test from NataCarePM Production - ' + new Date().toISOString());
```

### Step 3: Verify in Sentry Dashboard
1. Go to: https://sentry.io
2. Navigate to your organization → Projects → **NataCarePM-Production**
3. Click **Issues** tab
4. You should see the test message appear within 30 seconds!

### Expected Result
✅ Message appears in Sentry dashboard  
✅ Includes user context (if logged in)  
✅ Includes browser info, timestamp, URL

---

## 2️⃣ Test Firebase App Check

### Step 1: Open Network Tab
1. In DevTools, go to **Network** tab
2. Keep it open

### Step 2: Trigger Firestore Request
- Try to login
- Or navigate to any page that loads data

### Step 3: Check Request Headers
1. Click on any Firestore request in Network tab
2. Check **Request Headers** section
3. Look for: `X-Firebase-AppCheck: <token>`

### Expected Result
✅ `X-Firebase-AppCheck` header is present  
✅ Console shows: "[App Check] Initialized successfully"

---

## 3️⃣ Test Google Analytics 4

### Step 1: Check Console for Initialization
Look for:
```
[GA4] Tracking initialized with G-7XPWRK3R2P
```

### Step 2: Navigate the App
- Login/Logout
- View dashboard
- Create a project
- View reports
- Each action triggers GA4 events!

### Step 3: Check GA4 DebugView
1. Go to: https://analytics.google.com
2. Select your property (NataCarePM)
3. Go to **Configure** → **DebugView**
4. See real-time events streaming in!

### Expected Result
✅ Initialization message in console  
✅ Events appear in DebugView real-time  
✅ User properties tracked (role, company)

---

## 4️⃣ Advanced Testing (Optional)

### Test Session Replay (Sentry)
1. Perform some actions in the app
2. Trigger an error (try invalid input)
3. Go to Sentry → Issues → Click on error
4. Check **Replays** tab to see video recording!

### Test Performance Monitoring (Sentry)
1. Navigate through the app
2. Go to Sentry → Performance
3. See transaction timings, API calls, render times

### Test Custom Events (GA4)
Specific events to test:
- **project_created** - Create a new project
- **po_created** - Create a purchase order
- **document_uploaded** - Upload a document
- **report_generated** - Generate a report
- **ai_query** - Ask AI assistant a question

---

## 🐛 Troubleshooting

### Sentry Not Initializing?
**Check**:
1. `.env.local` has correct `VITE_SENTRY_DSN`
2. Console for errors: `Failed to fetch Sentry`
3. Sentry project is active (not paused)

**Fix**:
- Verify DSN in Sentry dashboard: Settings → Client Keys (DSN)
- Rebuild app: `npm run build`
- Restart preview: `npm run preview`

### App Check Header Missing?
**Check**:
1. `.env.local` has `VITE_APP_CHECK_ENABLED=true`
2. reCAPTCHA site key is correct
3. Console for: `App Check debug token configured`

**Fix**:
- Wait 30 seconds after page load (token generation takes time)
- Check Firebase Console → App Check → Apps
- Verify reCAPTCHA v3 is registered

### GA4 Not Tracking?
**Check**:
1. `.env.local` has `VITE_GA4_ENABLED=true`
2. Measurement ID is correct: `G-7XPWRK3R2P`
3. Console for: `GA4 disabled` or errors

**Fix**:
- Verify Measurement ID in GA4: Admin → Data Streams
- Check GA4 property is not deleted/suspended
- Use DebugView (not Realtime) for testing

### No Events in GA4 DebugView?
**Enable Debug Mode**:
Add to URL: `?debug_mode=true`
Example: `http://localhost:4173/?debug_mode=true`

Or install **Google Analytics Debugger** Chrome extension

---

## ✅ Success Criteria

### Sentry ✅
- [x] Initialization message in console
- [x] Test message appears in dashboard
- [x] Source maps loaded (readable stack traces)
- [x] User context captured (if logged in)

### App Check ✅
- [x] Initialization message in console
- [x] `X-Firebase-AppCheck` header in requests
- [x] No 401 errors from Firestore

### GA4 ✅
- [x] Initialization message in console
- [x] Events appear in DebugView
- [x] User properties tracked
- [x] Page views recorded

---

## 📊 Expected Console Output

```javascript
// On page load, you should see:

[App Check] Initializing with reCAPTCHA v3...
[App Check] Debug token configured: BB89B642-DDD7-4F07-B5CC-306B87226796
[App Check] Initialized successfully with reCAPTCHA v3

[Sentry] Initializing for environment: production
[Sentry] Initialized successfully
[Sentry] Session replay enabled (10% sample rate)
[Sentry] Browser tracing enabled

[GA4] Initializing Google Analytics 4
[GA4] Tracking initialized with G-7XPWRK3R2P
[GA4] Event tracked: page_view
```

---

## 🎯 Quick Test Commands

Copy-paste these into browser console:

```javascript
// Test Sentry
Sentry.captureMessage('Test message from console');
Sentry.captureException(new Error('Test error from console'));

// Test GA4
gtag('event', 'test_event', {
  event_category: 'testing',
  event_label: 'manual_test',
  value: 1
});

// Check if integrations loaded
console.log('Sentry loaded:', typeof Sentry !== 'undefined');
console.log('GA4 loaded:', typeof gtag !== 'undefined');
console.log('App Check loaded:', typeof firebase !== 'undefined');
```

---

## 📸 Screenshot Checklist

Take screenshots of:
1. ✅ Browser console showing all initialization messages
2. ✅ Network tab showing `X-Firebase-AppCheck` header
3. ✅ Sentry dashboard with test message
4. ✅ GA4 DebugView with real-time events

Save to `screenshots/` folder for documentation!

---

## ⏱️ Estimated Testing Time

- **Sentry**: 5 minutes
- **App Check**: 5 minutes  
- **GA4**: 10 minutes
- **Total**: **20 minutes** for complete verification

---

## 🚀 After Testing

Once all integrations verified:

1. ✅ Mark todos as complete
2. ✅ Create Cloud Storage bucket for backups
3. ✅ Enforce App Check in Firebase Console
4. ✅ Configure Sentry alerts (optional)
5. ✅ Setup GA4 custom reports (optional)
6. ✅ Proceed to UAT testing

---

**Current Status**: 🟢 Ready for testing  
**Preview URL**: http://localhost:4173/  
**DevTools**: Press F12 to start!

**Let's verify all integrations are working!** 🧪
