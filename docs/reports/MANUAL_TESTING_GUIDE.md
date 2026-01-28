# Manual Testing Guide - Phase 1 Integration
**Date:** November 6, 2025  
**Status:** Ready for Testing  
**Estimated Time:** 45-60 minutes

---

## Pre-Testing Setup

### 1. Start Development Server

```powershell
# Terminal 1: Start Vite dev server
npm run dev

# Application akan berjalan di: http://localhost:5173
```

### 2. Open Browser DevTools
- **Browser:** Chrome/Edge (recommended for PWA testing)
- **DevTools:** Press `F12` or `Ctrl+Shift+I`
- **Tabs to Open:**
  - Console
  - Network
  - Application

---

## Test Suite 1: Service Worker & PWA (15 min)

### ✅ Test 1.1: Service Worker Registration

**Steps:**
1. Navigate to `http://localhost:5173`
2. Open DevTools → **Console** tab
3. Look for log message

**Expected Result:**
```
[PWA] Service Worker registered successfully
```

**Pass Criteria:** ✅ Message appears in console

---

### ✅ Test 1.2: Service Worker Status

**Steps:**
1. Open DevTools → **Application** tab
2. Click on **Service Workers** (left sidebar)
3. Check status

**Expected Result:**
- Service Worker URL: `/service-worker.js`
- Status: **activated and is running**
- Source: `http://localhost:5173/service-worker.js`

**Pass Criteria:** ✅ Status shows "activated"

---

### ✅ Test 1.3: Cache Storage

**Steps:**
1. Navigate to different pages (Dashboard, Profile, Projects)
2. Open DevTools → **Application** tab
3. Click on **Cache Storage** (left sidebar)
4. Expand cache entries

**Expected Result:**
You should see 3 caches:
- `static-v1.0.0` - Contains JS, CSS, fonts
- `dynamic-v1.0.0` - Contains HTML pages
- `api-v1.0.0` - Contains API responses

**Pass Criteria:** ✅ At least 2 caches visible with entries

**Troubleshooting:**
- If no caches appear, hard refresh: `Ctrl+Shift+R`
- Navigate to 2-3 pages to trigger caching

---

### ✅ Test 1.4: Offline Mode

**Steps:**
1. Navigate to Dashboard (ensure it's loaded)
2. Open DevTools → **Network** tab
3. Select **Offline** (dropdown next to throttling)
4. Try navigating to different pages you've already visited

**Expected Result:**
- Previously visited pages load from cache
- Network tab shows "(from ServiceWorker)"
- No "Connection Error" messages

**Pass Criteria:** ✅ App works offline for cached pages

**Troubleshooting:**
- If pages don't load, you may need to visit them once while online first
- Check Console for Service Worker errors

---

### ✅ Test 1.5: Update Notification

**Steps:**
1. Open `public/service-worker.js`
2. Find line: `const CACHE_VERSION = 'v1.0.0';`
3. Change to: `const CACHE_VERSION = 'v1.0.1';`
4. Save file
5. Wait 5-10 seconds
6. Refresh browser

**Expected Result:**
- Toast notification appears: "New version available"
- Button: "Update Now" and "Later"
- Clicking "Update Now" reloads the page

**Pass Criteria:** ✅ Update notification appears

**Cleanup:** Change `CACHE_VERSION` back to `v1.0.0`

---

## Test Suite 2: Rate Limiting & Account Lockout (15 min)

### Setup: Create Test Account

**If you don't have a test account:**
1. Navigate to Login page
2. Click "Register" or "Sign Up"
3. Create account: `test@example.com` / `TestPassword123!`
4. Verify email if required

---

### ✅ Test 2.1: Normal Login (Baseline)

**Steps:**
1. Navigate to Login page
2. Enter **correct** credentials
3. Click "Login"

**Expected Result:**
- Login successful
- Redirected to Dashboard
- No delay

**Pass Criteria:** ✅ Login works normally

---

### ✅ Test 2.2: Failed Login Attempts (3x - No Delay)

**Steps:**
1. Logout
2. Try to login with **wrong password** 3 times
3. Enter: `test@example.com` / `wrongpassword`
4. Note the response time

**Expected Result:**
- Each attempt fails immediately
- Error message: "Invalid email or password"
- **No noticeable delay**

**Pass Criteria:** ✅ 3 failed attempts with normal response time

---

### ✅ Test 2.3: Exponential Backoff (Attempts 4-6)

**Steps:**
1. Continue with 4th failed login attempt
2. Note if there's a delay **before** error message
3. Try 5th attempt
4. Try 6th attempt

**Expected Result:**
- **4th attempt:** ~2 second delay before error
- **5th attempt:** ~4 second delay before error
- **6th attempt:** ~8 second delay before error

**Pass Criteria:** ✅ Delays increase exponentially

**How to verify:**
- Open DevTools → **Console** tab
- Look for log: `Login attempt delayed due to previous failures { email, delaySeconds: X }`

---

### ✅ Test 2.4: Warning Message (Attempts 7-9)

**Steps:**
1. Continue with 7th, 8th, 9th attempts

**Expected Result:**
Error message should include warning:
> ⚠️ Warning: Multiple failed login attempts detected. X attempts remaining before account lockout.

**Pass Criteria:** ✅ Warning appears

---

### ✅ Test 2.5: Account Lockout (10th Attempt)

**Steps:**
1. Make 10th failed login attempt

**Expected Result:**
- Error message:
  > 🔒 Account locked due to too many failed attempts. Please try again in 30 minutes. Remaining attempts: 0

- Button remains disabled
- Cannot login even with **correct password**

**Pass Criteria:** ✅ Account locked, cannot login

---

### ✅ Test 2.6: Security Event Logging

**Steps:**
1. Open Firebase Console: https://console.firebase.google.com
2. Navigate to your project
3. Click on **Firestore Database**
4. Find collection: `securityEvents`
5. Check recent documents

**Expected Result:**
You should see ~10 documents with:
```typescript
{
  type: "login_attempt",
  email: "test@example.com",
  success: false,
  timestamp: <recent timestamp>,
  reason: "Login failed" or "Invalid 2FA code",
  metadata: {
    attemptNumber: 1-10,
    userAgent: "..."
  }
}
```

**Pass Criteria:** ✅ Login attempts logged in Firestore

---

### ✅ Test 2.7: Manual Unlock (Admin)

**Steps:**
1. Open browser console
2. Paste and run:
```javascript
// Import the unlock function
import { unlockAccount } from './src/api/rateLimitService';

// Unlock the test account
unlockAccount('test@example.com', 'admin-user-id')
  .then(() => console.log('✅ Account unlocked'))
  .catch(err => console.error('❌ Unlock failed:', err));
```

**Alternative Method:**
1. Go to Firebase Console → Firestore
2. Find collection: `accountLockouts`
3. Find document with `email: "test@example.com"`
4. **Delete** the document
5. Try logging in with correct password

**Expected Result:**
- Can login successfully again
- No more lockout message

**Pass Criteria:** ✅ Account unlocked, login works

---

## Test Suite 3: 2FA Flow (10 min)

### ✅ Test 3.1: Enable 2FA

**Steps:**
1. Login to your account (use unlocked account from Test 2.7)
2. Navigate to **Profile** page
3. Scroll to **Keamanan Akun** section
4. Find **Autentikasi Dua Faktor (2FA)**
5. Click button: **Aktifkan 2FA**

**Expected Result:**
- Modal opens: "TwoFactorSetup"
- Shows 5-step wizard
- Step 1: Introduction

**Pass Criteria:** ✅ 2FA setup modal appears

---

### ✅ Test 3.2: QR Code Generation

**Steps:**
1. Click "Lanjut" / "Next" to go to Step 2
2. View QR code

**Expected Result:**
- QR code image displays (300x300px)
- Manual entry key shown (base32 format)
- Example: `JBSWY3DPEHPK3PXP`
- Copy button works

**Pass Criteria:** ✅ QR code visible, can copy key

---

### ✅ Test 3.3: Scan QR Code

**Steps:**
1. Open authenticator app on phone:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - Or any TOTP app
2. Scan QR code
3. App should add account: "NataCarePM (your-email)"

**Expected Result:**
- Account added to authenticator app
- Shows 6-digit code that changes every 30 seconds

**Pass Criteria:** ✅ Authenticator app shows code

---

### ✅ Test 3.4: Verify 2FA Code

**Steps:**
1. In modal, click "Lanjut" to Step 3
2. Enter the 6-digit code from authenticator app
3. Click "Verify" / "Verifikasi"

**Expected Result:**
- If code is correct:
  - Moves to Step 4 (Backup Codes)
- If code is wrong:
  - Error message: "Kode tidak valid"
  - Can try again

**Pass Criteria:** ✅ Correct code accepted

**Troubleshooting:**
- Code expires every 30 seconds, try fresh code
- Ensure phone time is synchronized

---

### ✅ Test 3.5: Backup Codes

**Steps:**
1. View backup codes (should be on Step 4)
2. Copy or download codes

**Expected Result:**
- Shows 10 backup codes
- Format: `XXXX-XXXX` (e.g., `1A2B-3C4D`)
- Copy button works
- Download button works (saves .txt file)

**Pass Criteria:** ✅ 10 backup codes displayed

**Important:** Save these codes! You'll need them if you lose your phone.

---

### ✅ Test 3.6: Complete Setup

**Steps:**
1. Click "Complete" / "Selesai"

**Expected Result:**
- Modal closes
- Profile page updates
- Status changes to: ✅ "Autentikasi dua faktor aktif"
- Shows green badge
- Button changes to "Nonaktifkan 2FA"

**Pass Criteria:** ✅ 2FA status shows as active

---

### ✅ Test 3.7: Login with 2FA

**Steps:**
1. Logout
2. Login with your email and password
3. After password is accepted, modal should appear

**Expected Result:**
- "Verify 2FA" modal opens
- Input field for 6-digit code
- Toggle option: "Use backup code instead"

**Pass Criteria:** ✅ 2FA verification modal appears

---

### ✅ Test 3.8: Complete 2FA Login

**Steps:**
1. Enter 6-digit code from authenticator app
2. Click "Verify" / "Verifikasi"

**Expected Result:**
- Code verified successfully
- Modal closes
- Redirected to Dashboard
- Logged in successfully

**Pass Criteria:** ✅ Login successful with 2FA

---

### ✅ Test 3.9: Login with Backup Code

**Steps:**
1. Logout
2. Login with email/password
3. In 2FA modal, click "Use backup code instead"
4. Enter one of your backup codes (format: XXXX-XXXX)
5. Click "Verify"

**Expected Result:**
- Backup code accepted
- Login successful
- **That backup code is now invalid** (can only use once)

**Pass Criteria:** ✅ Backup code works

---

### ✅ Test 3.10: Disable 2FA

**Steps:**
1. Go to Profile → Keamanan Akun
2. Click "Nonaktifkan 2FA"
3. Confirm in dialog
4. Enter 6-digit 2FA code for verification
5. Confirm

**Expected Result:**
- 2FA disabled successfully
- Status changes to: ⚠️ "Autentikasi dua faktor tidak aktif"
- Yellow warning badge
- Button changes to "Aktifkan 2FA"

**Pass Criteria:** ✅ 2FA disabled

---

## Test Suite 4: Password Strength Meter (5 min)

### ✅ Test 4.1: Open Password Change Modal

**Steps:**
1. Go to Profile page
2. Scroll to "Keamanan Akun" section
3. Click button: **Ubah Password**

**Expected Result:**
- Modal opens: "Ubah Password"
- Three input fields:
  - Password Saat Ini
  - Password Baru
  - Konfirmasi Password Baru

**Pass Criteria:** ✅ Modal opens with 3 fields

---

### ✅ Test 4.2: Very Weak Password (Red)

**Steps:**
1. Enter current password (any valid password)
2. In "Password Baru" field, type: `pass`
3. Observe strength meter

**Expected Result:**
- **Red bar** (1 segment filled)
- Label: **"Sangat Lemah"**
- Errors displayed:
  - ❌ "Minimal 8 karakter"
  - ❌ "Harus mengandung huruf besar"
  - ❌ "Harus mengandung angka"
  - ❌ "Harus mengandung simbol"

**Pass Criteria:** ✅ Red meter, multiple errors shown

---

### ✅ Test 4.3: Weak Password (Orange)

**Steps:**
1. Type: `Password`

**Expected Result:**
- **Orange bar** (2 segments filled)
- Label: **"Lemah"**
- Errors:
  - ❌ "Harus mengandung angka"
  - ❌ "Harus mengandung simbol"
- Warning:
  - ⚠️ "Password umum, gunakan kombinasi unik"

**Pass Criteria:** ✅ Orange meter, fewer errors

---

### ✅ Test 4.4: Fair Password (Yellow)

**Steps:**
1. Type: `Password123`

**Expected Result:**
- **Yellow bar** (3 segments filled)
- Label: **"Cukup"**
- Errors:
  - ❌ "Harus mengandung simbol"
- Suggestion:
  - 💡 "Tambahkan simbol untuk keamanan lebih baik"

**Pass Criteria:** ✅ Yellow meter, one error

---

### ✅ Test 4.5: Strong Password (Green)

**Steps:**
1. Type: `Password123!`

**Expected Result:**
- **Green bar** (4 segments filled)
- Label: **"Kuat"**
- No errors
- ✅ "Password memenuhi semua kriteria"
- Estimated crack time: e.g., "Butuh 5 tahun untuk diretas"

**Pass Criteria:** ✅ Green meter, no errors

---

### ✅ Test 4.6: Very Strong Password (Emerald)

**Steps:**
1. Type: `MyC0mpl3x!P@ss#2024`

**Expected Result:**
- **Emerald/Dark Green bar** (4 segments fully saturated)
- Label: **"Sangat Kuat"**
- ✅ "Password sangat aman"
- Estimated crack time: "Butuh 100+ tahun untuk diretas"

**Pass Criteria:** ✅ Emerald meter, "Sangat Kuat" label

---

### ✅ Test 4.7: Requirements Checklist

**Steps:**
1. Type: `pass` (weak password)
2. Click: **"Lihat persyaratan password"**

**Expected Result:**
- Checklist appears:
  - ✗ Minimal 8 karakter (gray)
  - ✗ Huruf besar (A-Z) (gray)
  - ✗ Huruf kecil (a-z) (green ✓)
  - ✗ Angka (0-9) (gray)
  - ✗ Simbol (!@#$...) (gray)

**Pass Criteria:** ✅ Checklist shows with correct status

---

### ✅ Test 4.8: Real-time Update

**Steps:**
1. Type password character by character: `P-a-s-s-w-o-r-d-1-2-3-!`
2. Watch meter update in real-time

**Expected Result:**
- Meter updates after each keystroke
- Color changes: Red → Orange → Yellow → Green
- Errors disappear as requirements are met
- Checklist items get checkmarks

**Pass Criteria:** ✅ Meter updates instantly

---

### ✅ Test 4.9: Common Password Detection

**Steps:**
1. Type: `password123`

**Expected Result:**
- Meter may show yellow or orange
- Warning appears:
  - ⚠️ "Password umum, gunakan kombinasi unik"
  - or "Dalam daftar password yang sering digunakan"

**Pass Criteria:** ✅ Common password warning shown

---

### ✅ Test 4.10: Pattern Detection

**Steps:**
1. Test repeating pattern: `aaaaaaaA1!`
2. Clear and test sequential: `abcdefghA1!`

**Expected Result:**
- **Repeating:** ⚠️ "Pola berulang terdeteksi"
- **Sequential:** ⚠️ "Pola sekuensial terdeteksi" or "Hindari urutan keyboard"

**Pass Criteria:** ✅ Pattern warnings appear

---

## Post-Testing: Cleanup

### 1. Reset Test Data

**Steps:**
1. Go to Firebase Console → Firestore
2. Delete test collections:
   - `securityEvents` (optional - or just test documents)
   - `accountLockouts` (test@example.com document)
3. Keep your test account or delete it

---

### 2. Reset Service Worker Cache Version

**Steps:**
1. If you changed `CACHE_VERSION` during testing
2. Change it back to: `const CACHE_VERSION = 'v1.0.0';`
3. Save file

---

### 3. Clear Browser Cache (Optional)

**Steps:**
1. DevTools → Application → Storage
2. Click "Clear site data"
3. Refresh page

---

## Test Results Summary

### Record Your Results:

| Test Suite | Tests Passed | Tests Failed | Notes |
|------------|--------------|--------------|-------|
| **1. Service Worker & PWA** | ___ / 5 | ___ | |
| **2. Rate Limiting** | ___ / 7 | ___ | |
| **3. 2FA Flow** | ___ / 10 | ___ | |
| **4. Password Strength** | ___ / 10 | ___ | |
| **TOTAL** | ___ / 32 | ___ | |

**Pass Rate:** _____%

---

## Common Issues & Troubleshooting

### Issue 1: Service Worker Not Registering

**Symptoms:** No message in console, no SW in Application tab

**Solutions:**
1. Check if running on `localhost` or `HTTPS` (required for SW)
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Hard refresh: `Ctrl+Shift+R`
4. Check console for errors
5. Ensure `public/service-worker.js` exists

---

### Issue 2: Rate Limiting Not Working

**Symptoms:** No delays, no lockout after 10 attempts

**Solutions:**
1. Check Firebase Firestore is connected
2. Verify collections exist: `securityEvents`, `accountLockouts`
3. Check browser console for errors
4. Ensure you're using the same email for all attempts
5. Clear Firestore test data and retry

---

### Issue 3: 2FA QR Code Not Scanning

**Symptoms:** Authenticator app can't read QR code

**Solutions:**
1. Try manual entry instead (copy the base32 key)
2. Ensure QR code is fully visible
3. Check phone camera focus
4. Try different authenticator app
5. Ensure phone time is synchronized

---

### Issue 4: Password Strength Meter Not Showing

**Symptoms:** Only input field visible, no meter/colors

**Solutions:**
1. Check browser console for import errors
2. Verify `PasswordStrengthMeter.tsx` exists
3. Hard refresh: `Ctrl+Shift+R`
4. Clear browser cache
5. Check if `passwordValidator.ts` is working

---

### Issue 5: Cannot Login After Testing

**Symptoms:** Account still locked or 2FA issues

**Solutions:**
1. **Account Locked:**
   - Go to Firestore → `accountLockouts`
   - Delete your email's document
   - Or wait 30 minutes

2. **2FA Issues:**
   - Use backup code to login
   - Or disable 2FA from Firestore:
     - Collection: `users` → Your UID
     - Set `twoFactorEnabled: false`

---

## Next Steps After Testing

### If All Tests Pass (28+/32)

✅ **System Ready for Production**

**Recommended Actions:**
1. Document any minor issues found
2. Create bug reports for failed tests
3. Proceed with staging deployment
4. Plan Phase 2 implementation

---

### If Tests Fail (< 28/32)

⚠️ **Needs Debugging**

**Priority Actions:**
1. Document all failures with screenshots
2. Check browser console for errors
3. Review integration code for issues
4. Fix critical bugs before proceeding
5. Re-run failed tests

---

## Testing Sign-off

**Tester Name:** ________________  
**Date:** ________________  
**Test Duration:** ________________  
**Overall Status:** ⬜ Pass  ⬜ Fail  ⬜ Pass with Minor Issues

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Ready for Production?** ⬜ Yes  ⬜ No  ⬜ Needs Review

---

## Additional Manual Testing (Optional)

### Performance Testing

1. **Lighthouse Audit:**
   ```
   - Open DevTools → Lighthouse tab
   - Select: Performance, Accessibility, Best Practices, PWA, SEO
   - Click "Generate report"
   - Target Score: 90+ for all categories
   ```

2. **Network Speed Test:**
   ```
   - DevTools → Network → Throttling
   - Select "Slow 3G"
   - Navigate app
   - Check: Pages should still load from cache
   ```

3. **Bundle Size Check:**
   ```powershell
   npm run build
   # Check dist/ folder size
   # Target: < 1MB initial load
   ```

---

### Security Testing

1. **Check Security Headers:**
   ```
   - DevTools → Network tab
   - Reload page
   - Click on document request
   - Headers tab
   - Verify: X-Content-Type-Options, X-Frame-Options, CSP
   ```

2. **Test XSS Prevention:**
   ```
   - Try entering <script>alert('XSS')</script> in forms
   - Should be sanitized and not execute
   ```

3. **Test CSRF Protection:**
   ```
   - Login
   - Check if auth tokens are present
   - Logout
   - Tokens should be cleared
   ```

---

**Testing Guide Version:** 1.0.0  
**Last Updated:** November 6, 2025  
**Contact:** GitHub Copilot / NataCarePM Team
