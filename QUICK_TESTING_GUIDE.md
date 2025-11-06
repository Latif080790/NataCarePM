# Quick Testing Guide - Phase 1 Integration

## Status: Dev Server Running ✅
**URL:** http://localhost:3000

## Issue Found
App shows "Gagal Memuat Proyek" / "No projects found" karena:
- User belum login
- Aplikasi memerlukan authentication sebelum testing

---

## Quick Testing Steps

### Option 1: Test dengan Login (Recommended)

1. **Buka Browser DevTools** (F12)
2. **Navigate ke Login Page**
   - Klik tombol "Muat Ulang" atau refresh
   - App akan redirect ke login page

3. **Test Rate Limiting (Suite 2)**
   ```
   ✅ TEST: Rate Limiting & Brute Force Protection
   
   a. Normal Login (Baseline)
      - Enter correct email/password
      - Should login immediately (no delay)
   
   b. Failed Attempts (3x)
      - Enter wrong password 3 times
      - First 3 attempts: No delay
      - Check console for rate limit logs
   
   c. Exponential Backoff (4-6 attempts)
      - Try wrong password again (4th, 5th, 6th time)
      - Should see delays: ~2s, ~4s, ~8s
      - UI should show "Please wait X seconds"
   
   d. Warning Phase (7-9 attempts)
      - Continue with wrong passwords
      - Should see warnings: "2 attempts remaining before lockout"
   
   e. Account Lockout (10th attempt)
      - Try wrong password 10th time
      - Should see: "Account locked for 30 minutes"
      - Cannot login even with correct password
   
   f. Check Firestore Security Events
      - Open Firebase Console
      - Go to Firestore → securityEvents collection
      - Verify events logged: failed_login, account_locked
   ```

4. **Test 2FA Flow (Suite 3)**
   ```
   After successful login:
   
   ✅ TEST: 2FA Management
   
   a. Navigate to Profile page
   b. Find "Two-Factor Authentication" section
   c. Click "Enable 2FA"
   d. Scan QR code with authenticator app (Google Authenticator, Authy)
   e. Enter 6-digit code from app
   f. Save backup codes
   g. Logout
   h. Login again → Should prompt for 2FA code
   i. Enter code from authenticator app
   j. Test backup code (optional)
   ```

5. **Test Password Strength (Suite 4)**
   ```
   While logged in:
   
   ✅ TEST: Password Strength Meter
   
   a. Go to Profile page
   b. Click "Change Password"
   c. Test weak password:
      - Type: "123456"
      - Bar should be RED
      - Message: "Weak"
   
   d. Test medium password:
      - Type: "Pass123"
      - Bar should be ORANGE/YELLOW
      - Message: "Fair" or "Good"
   
   e. Test strong password:
      - Type: "MyP@ssw0rd2024!Secure"
      - Bar should be EMERALD GREEN
      - Message: "Excellent"
      - All requirements ✓ checked
   
   f. Verify real-time updates as you type
   ```

---

### Option 2: Test Service Worker (No Login Required)

```
✅ TEST: Service Worker & PWA Features

a. Check Service Worker Registration
   - Open DevTools (F12)
   - Go to Application tab → Service Workers
   - Should see: "dev-dist/sw.js" registered and activated
   
b. Check Cache Storage
   - Still in Application tab → Cache Storage
   - Should see caches created:
     - workbox-precache-v2-... 
     - runtime-cache-...
   
c. Check Console Logs
   - Go to Console tab
   - Should see: "Service Worker registered successfully"
   - Should see: "PWA v1.1.0"
   
d. Test Offline Mode (Optional - requires login first)
   - In Network tab, check "Offline"
   - Refresh page
   - Should show offline indicator
   - Cached pages should still work
```

---

### Option 3: Cek Implementation Code (No Browser)

```
✅ VERIFY: Integration Code Correctness

Jika tidak bisa login, kita bisa verify implementasi code:

1. Service Worker Registration
   File: src/index.tsx
   Check: registerServiceWorker() called
   ✅ Already verified: Code complete

2. Rate Limiting Logic
   File: src/contexts/AuthContext.tsx
   Check: 
   - checkAccountLockout() before login
   - recordLoginAttempt() after failed login
   - calculateLoginDelay() for exponential backoff
   ✅ Already verified: Code complete

3. Password Strength Meter
   File: src/components/PasswordChangeModal.tsx
   Check: PasswordStrengthMeter component integrated
   ✅ Already verified: Code complete

4. 2FA Management UI
   File: src/views/ProfileView.tsx
   Check: 2FA enable/disable/regenerate codes
   ✅ Already verified: Already present

All integration code is correct. Testing requires login access.
```

---

## Troubleshooting

### "Gagal Memuat Proyek" / "No projects found"

**Cause:** Normal behavior - no workspace/project loaded yet

**Solution:** 
- Login dengan akun yang sudah ada
- Atau create new account
- Atau create new workspace after login

### Cannot Login - Account Not Found

**Solution:**
1. Check Firebase Authentication is configured
2. Check `.env.local` has correct Firebase config
3. Or create new account via "Register" link

### Firebase Not Configured

If you see Firebase errors in console:

```bash
# Check .env.local file exists
Get-Content .env.local

# Should contain:
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
# etc.
```

---

## Recommended Testing Approach

**Since you're seeing "No projects found" screen:**

### Fastest Path to Test Phase 1 Features:

1. **Login Required Tests (Priority):**
   - ✅ Test Rate Limiting (just need login page - no projects needed!)
   - ✅ Test 2FA Enable/Disable (just need profile page)
   - ✅ Test Password Strength (just need password change modal)

2. **No Login Tests:**
   - ✅ Service Worker (can verify in DevTools now)

### Action Plan:

**RIGHT NOW - You can test:**
```bash
# Open DevTools → Application tab
# Check Service Workers section
# Should see sw.js registered ✅
```

**After Login - Test these:**
```bash
# 1. Try wrong password 10 times → Test rate limiting ✅
# 2. Go to Profile → Enable 2FA → Test 2FA flow ✅
# 3. Change Password → Test strength meter ✅
```

---

## Next Steps

1. **If you can login:** Follow Option 1 testing steps above
2. **If you cannot login:** Let me know, I'll help setup test account or mock auth
3. **If Firebase not configured:** Let me know, I'll help configure it

**Current Status:**
- ✅ Dev server running
- ✅ Service Worker active (verify in DevTools)
- ⏳ Waiting for login to test other features

---

**Question:** Apakah Anda:
- A) Punya akun login yang bisa digunakan?
- B) Perlu setup Firebase/test account?
- C) Ingin saya mock authentication untuk testing?

Berikan tahu pilihan Anda, dan saya akan bantu lanjutkan testing! 🚀
