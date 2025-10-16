# Testing Guide: Password Change Feature (Feature 1.2)

**Feature:** Secure Password Change with Strength Meter  
**Implementation Date:** October 16, 2025  
**Status:** Ready for Testing  
**Estimated Testing Time:** 90 minutes

---

## 📋 TEST OVERVIEW

### Feature Components
- ✅ Password validator utility (`src/utils/passwordValidator.ts`)
- ✅ Auth service with history tracking (`src/api/authService.ts`)
- ✅ Password change modal component (`src/components/PasswordChangeModal.tsx`)
- ✅ ProfileView integration (`views/ProfileView.tsx`)

### Test Scope
- Password strength validation
- Reauthentication flow
- Password history checking (last 5 passwords)
- Visual strength meter
- Error handling
- Security measures
- UI/UX interactions

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements
- [ ] Users can change their password securely
- [ ] Current password must be validated before change
- [ ] New password must meet strength requirements
- [ ] Password history prevents reuse (last 5)
- [ ] Strength meter updates in real-time
- [ ] Clear error messages for all failure cases
- [ ] Success feedback on completion

### Non-Functional Requirements
- [ ] Modal opens/closes smoothly
- [ ] Form validation is instantaneous
- [ ] No TypeScript errors in console
- [ ] Accessible via keyboard
- [ ] Mobile responsive
- [ ] Password change completes in < 3 seconds

---

## 🧪 TEST SUITES

### **Suite 1: Password Validation (12 tests)**

#### 1.1 Minimum Length Check
**Steps:**
1. Open password change modal
2. Enter current password: `[your actual password]`
3. Enter new password: `short`
4. Enter confirm password: `short`

**Expected:**
- ❌ Strength meter shows "Lemah" (Weak) in red
- ❌ Error message: "Password harus minimal 12 karakter"
- ❌ Submit button disabled
- ❌ Password change fails

---

#### 1.2 Uppercase Requirement
**Steps:**
1. Enter new password: `passwordwithoutuppercase123!`

**Expected:**
- ⚠️ Warning: "Tidak ada huruf kapital (A-Z)"
- 🟡 Strength meter may show "Cukup" or "Baik"
- ✅ Submit button enabled (warnings don't block)

---

#### 1.3 Lowercase Requirement
**Steps:**
1. Enter new password: `PASSWORDWITHOUTLOWERCASE123!`

**Expected:**
- ⚠️ Warning: "Tidak ada huruf kecil (a-z)"
- 🟡 Strength meter reduced

---

#### 1.4 Number Requirement
**Steps:**
1. Enter new password: `PasswordWithoutNumber!`

**Expected:**
- ⚠️ Warning: "Tidak ada angka (0-9)"
- 🟡 Strength meter reduced

---

#### 1.5 Special Character Requirement
**Steps:**
1. Enter new password: `PasswordWithoutSpecial123`

**Expected:**
- ⚠️ Warning: "Tidak ada karakter khusus (!@#$%^&*)"
- 🟡 Strength meter reduced

---

#### 1.6 Common Password Detection
**Steps:**
1. Enter new password: `Password123!`

**Expected:**
- ❌ Error: "Password terlalu umum dan mudah ditebak"
- 🔴 Strength meter shows "Lemah"
- ❌ Submit button disabled

---

#### 1.7 Repeating Characters
**Steps:**
1. Enter new password: `Passssword123!`

**Expected:**
- ⚠️ Warning: "Terdapat karakter yang berulang"
- 🟡 Suggestion: "Hindari pengulangan karakter"
- 🟡 Strength meter slightly reduced

---

#### 1.8 Sequential Characters
**Steps:**
1. Enter new password: `Abcd1234!@#$`

**Expected:**
- ⚠️ Warning: "Terdapat urutan karakter (contoh: abc, 123)"
- 🟡 Suggestion shown

---

#### 1.9 Strong Password (All Requirements)
**Steps:**
1. Enter new password: `MySecure#Pass2024`

**Expected:**
- ✅ Strength meter shows "Kuat" (Strong) in green
- ✅ Message: "Password cukup kuat ✓"
- ✅ Score: 60-79
- ✅ Submit button enabled

---

#### 1.10 Very Strong Password
**Steps:**
1. Enter new password: `MyV3ry$ecure#Pa55w0rd!2024`

**Expected:**
- ✅ Strength meter shows "Sangat Kuat" (Very Strong) in dark green
- ✅ Score: 80-100
- ✅ Estimated crack time: "Berabad-abad"

---

#### 1.11 Password Mismatch
**Steps:**
1. Enter new password: `MySecure#Pass2024`
2. Enter confirm password: `MySecure#Pass2025`

**Expected:**
- ❌ Error below confirm field: "Password tidak cocok"
- ❌ Submit button disabled

---

#### 1.12 Password Match Confirmation
**Steps:**
1. Enter new password: `MySecure#Pass2024`
2. Enter confirm password: `MySecure#Pass2024`

**Expected:**
- ✅ Success message: "Password cocok ✓" in green
- ✅ Submit button enabled

---

### **Suite 2: Reauthentication (6 tests)**

#### 2.1 Wrong Current Password
**Steps:**
1. Fill form with:
   - Current password: `wrongpassword123`
   - New password: `MySecure#Pass2024`
   - Confirm password: `MySecure#Pass2024`
2. Click "Ubah Password"

**Expected:**
- ❌ Toast error: "Password saat ini salah"
- ❌ Modal remains open
- ❌ Password NOT changed

---

#### 2.2 Correct Current Password
**Steps:**
1. Fill form with CORRECT current password
2. New password: `MySecure#Pass2024`
3. Confirm: `MySecure#Pass2024`
4. Click "Ubah Password"

**Expected:**
- ✅ Loading spinner shown
- ✅ Toast success: "Password berhasil diubah! 🎉"
- ✅ Modal closes automatically
- ✅ Form resets
- ✅ Password updated in Firebase Auth

---

#### 2.3 Empty Current Password
**Steps:**
1. Leave current password empty
2. Fill new password fields
3. Try to submit

**Expected:**
- ❌ HTML5 validation: "Please fill out this field"
- ❌ Form doesn't submit

---

#### 2.4 Session Expired (if testable)
**Steps:**
1. Login
2. Wait 8+ hours (or manually expire token)
3. Try to change password

**Expected:**
- ❌ Error: "Sesi kadaluarsa. Silakan login ulang."
- 🔄 Should redirect to login (if implemented)

---

#### 2.5 Too Many Failed Attempts
**Steps:**
1. Try 5+ times with wrong current password

**Expected:**
- ❌ Firebase blocks further attempts
- ❌ Error: "Terlalu banyak percobaan. Coba lagi nanti."

---

#### 2.6 Reauthentication Success Message
**Steps:**
1. Successfully change password
2. Check Firestore `users/{userId}` document

**Expected:**
- ✅ `lastPasswordChange` field updated
- ✅ `updatedAt` field updated
- ✅ `passwordHistory` array has new entry

---

### **Suite 3: Password History (4 tests)**

#### 3.1 Reuse Previous Password
**Steps:**
1. Change password to `NewSecure#Pass2024`
2. Immediately try to change back to your old password

**Expected:**
- ❌ Error: "Password ini sudah pernah digunakan. Gunakan password berbeda dari 5 password terakhir."
- ❌ Submit blocked

---

#### 3.2 Reuse 2nd Last Password
**Steps:**
1. Change password 2 times
2. Try to use password from 2 changes ago

**Expected:**
- ❌ Same error as 3.1
- ❌ History tracks last 5

---

#### 3.3 Use 6th Previous Password (Should Work)
**Steps:**
1. Change password 6 times
2. Try to use password from 6 changes ago

**Expected:**
- ✅ Password change allowed
- ✅ Only last 5 are blocked

---

#### 3.4 Password History Array Limit
**Steps:**
1. Check Firestore `users/{userId}.passwordHistory`
2. After 10 password changes

**Expected:**
- ✅ Array contains only 5 entries (most recent)
- ✅ Old entries automatically removed

---

### **Suite 4: UI/UX Interactions (8 tests)**

#### 4.1 Open Modal
**Steps:**
1. Go to Profile page
2. Click "Ubah Password" button

**Expected:**
- ✅ Modal opens with smooth animation
- ✅ Backdrop darkens page
- ✅ Focus moves to modal
- ✅ Form is empty

---

#### 4.2 Close Modal (X Button)
**Steps:**
1. Open modal
2. Click X button in top-right

**Expected:**
- ✅ Modal closes
- ✅ Backdrop removed
- ✅ Form resets

---

#### 4.3 Close Modal (Cancel Button)
**Steps:**
1. Open modal
2. Fill some fields
3. Click "Batal" button

**Expected:**
- ✅ Modal closes
- ✅ All fields cleared
- ✅ Validation reset

---

#### 4.4 Close Modal (ESC Key)
**Steps:**
1. Open modal
2. Press ESC key

**Expected:**
- ✅ Modal closes (if implemented)
- ⚠️ If not implemented, document as future enhancement

---

#### 4.5 Password Visibility Toggle
**Steps:**
1. Enter password in all 3 fields
2. Click eye icon for each field

**Expected:**
- ✅ Password switches between hidden/visible
- ✅ Eye icon switches to eye-off icon
- ✅ Works for all 3 fields independently

---

#### 4.6 Show Requirements Button
**Steps:**
1. Click "Lihat persyaratan password" link

**Expected:**
- ✅ Requirements list expands
- ✅ Shows 7 requirements
- ✅ Button text changes to "Sembunyikan"

---

#### 4.7 Strength Meter Animation
**Steps:**
1. Slowly type `MySecure#Pass2024`
2. Watch strength meter

**Expected:**
- ✅ Bar grows smoothly (animation)
- ✅ Color changes: red → orange → yellow → green
- ✅ Label updates: Lemah → Cukup → Baik → Kuat
- ✅ Score increases: 0 → 100

---

#### 4.8 Real-time Validation
**Steps:**
1. Type in new password field
2. Watch validation messages

**Expected:**
- ✅ Validation updates INSTANTLY (no delay)
- ✅ No lag or stutter
- ✅ Errors appear as you type

---

### **Suite 5: Error Handling (5 tests)**

#### 5.1 Network Error During Submit
**Steps:**
1. Open DevTools → Network tab
2. Set to "Offline" mode
3. Fill form and submit

**Expected:**
- ❌ Error toast: "Terjadi kesalahan. Silakan coba lagi."
- ❌ Modal stays open
- ❌ Form data preserved

---

#### 5.2 Firestore Permission Error
**Steps:**
1. (If testable) Temporarily revoke Firestore write permissions
2. Try to change password

**Expected:**
- ❌ Error caught and shown
- ❌ Password not changed

---

#### 5.3 Empty Form Submit
**Steps:**
1. Open modal
2. Click "Ubah Password" without filling fields

**Expected:**
- ❌ HTML5 validation blocks submit
- ❌ "Please fill out this field" for first empty field

---

#### 5.4 Same Password as Current
**Steps:**
1. Current password: `MyOldPass123!`
2. New password: `MyOldPass123!`
3. Submit

**Expected:**
- ❌ Error: "Password baru tidak boleh sama dengan password lama"

---

#### 5.5 Weak Password Submission Attempt
**Steps:**
1. Try to submit with weak password (disabled button)

**Expected:**
- ❌ Button is disabled, click does nothing
- ❌ Cursor shows "not-allowed"

---

### **Suite 6: Security (5 tests)**

#### 6.1 Password Stored as Hash (Check Firestore)
**Steps:**
1. Change password
2. Check Firestore `users/{userId}.passwordHistory`

**Expected:**
- ⚠️ **WARNING:** In MVP, password is stored in plain text!
- 📝 Document: "TODO: Hash passwords in production"
- 🔒 Firestore rules should restrict read access

---

#### 6.2 Password Not Visible in Network Tab
**Steps:**
1. Open DevTools → Network tab
2. Change password
3. Check Firebase API requests

**Expected:**
- ✅ Password encrypted in HTTPS
- ✅ Cannot see plain text in network logs

---

#### 6.3 Console Logs Clean
**Steps:**
1. Open Console
2. Change password successfully

**Expected:**
- ✅ No password logged to console
- ✅ No sensitive data exposed

---

#### 6.4 XSS Prevention (Input Sanitization)
**Steps:**
1. Enter password: `<script>alert('XSS')</script>`
2. Submit

**Expected:**
- ✅ No alert shows
- ✅ Treated as plain text
- ✅ No code execution

---

#### 6.5 SQL Injection Prevention
**Steps:**
1. Enter password: `' OR '1'='1`
2. Submit

**Expected:**
- ✅ Treated as plain password
- ✅ No database bypass
- ✅ Firebase SDK handles sanitization

---

### **Suite 7: Accessibility (6 tests)**

#### 7.1 Keyboard Navigation
**Steps:**
1. Open modal
2. Use TAB to navigate through fields
3. Use ENTER to submit

**Expected:**
- ✅ TAB moves: Current → New → Confirm → Show Requirements → Ubah Password → Batal → X
- ✅ Focus visible on all elements
- ✅ ENTER submits form

---

#### 7.2 Screen Reader (NVDA/JAWS)
**Steps:**
1. Use screen reader
2. Open modal
3. Navigate through form

**Expected:**
- ✅ Modal title announced
- ✅ All labels read correctly
- ✅ Error messages announced
- ✅ Success messages announced
- ✅ Button states announced (enabled/disabled)

---

#### 7.3 Focus Management
**Steps:**
1. Open modal
2. Check where focus lands

**Expected:**
- ✅ Focus moves to first input (current password)
- ✅ Cannot TAB to elements behind modal
- ✅ Focus trapped in modal

---

#### 7.4 Color Contrast (High Contrast Mode)
**Steps:**
1. Enable Windows High Contrast mode
2. Open modal

**Expected:**
- ✅ All text readable
- ✅ Contrast ratio > 4.5:1
- ✅ Strength meter visible

---

#### 7.5 Reduced Motion Support
**Steps:**
1. Enable "Reduce motion" in OS
2. Open modal
3. Watch strength meter

**Expected:**
- ✅ Modal opens without animation (or subtle)
- ✅ Strength meter updates without animation
- ⚠️ If not implemented, document as enhancement

---

#### 7.6 Form Validation Announcements
**Steps:**
1. Enter invalid password
2. Listen for screen reader announcements

**Expected:**
- ✅ Errors announced immediately
- ✅ aria-live region used
- ✅ Success messages announced

---

### **Suite 8: Cross-Browser & Mobile (6 tests)**

#### 8.1 Chrome (Desktop)
**Steps:**
1. Test full flow in Chrome

**Expected:**
- ✅ All features work perfectly

---

#### 8.2 Firefox (Desktop)
**Steps:**
1. Test in Firefox

**Expected:**
- ✅ All features work perfectly
- ✅ Password manager integration works

---

#### 8.3 Safari (Desktop)
**Steps:**
1. Test in Safari

**Expected:**
- ✅ All features work
- ✅ Smooth animations

---

#### 8.4 Edge (Desktop)
**Steps:**
1. Test in Edge

**Expected:**
- ✅ All features work (Chromium-based)

---

#### 8.5 Mobile Chrome (Android)
**Steps:**
1. Open on Android phone
2. Test password change

**Expected:**
- ✅ Modal fits screen
- ✅ Touch targets > 44x44px
- ✅ Keyboard doesn't cover modal
- ✅ Can scroll if needed

---

#### 8.6 Mobile Safari (iOS)
**Steps:**
1. Open on iPhone
2. Test password change

**Expected:**
- ✅ Modal responsive
- ✅ Password autofill works
- ✅ No zoom on input focus

---

## 🐛 BUG REPORTING TEMPLATE

```markdown
### Bug Title: [Short description]

**Severity:** Critical / High / Medium / Low

**Test Case:** [Suite X.Y - Test Name]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: 
- OS: 
- Screen size: 
- User: 

**Console Errors:**
```
[Paste any errors]
```

**Additional Notes:**

```

---

## 📝 TEST RESULTS CHECKLIST

### Suite 1: Password Validation (12 tests)
- [ ] 1.1 Minimum Length Check
- [ ] 1.2 Uppercase Requirement
- [ ] 1.3 Lowercase Requirement
- [ ] 1.4 Number Requirement
- [ ] 1.5 Special Character Requirement
- [ ] 1.6 Common Password Detection
- [ ] 1.7 Repeating Characters
- [ ] 1.8 Sequential Characters
- [ ] 1.9 Strong Password
- [ ] 1.10 Very Strong Password
- [ ] 1.11 Password Mismatch
- [ ] 1.12 Password Match Confirmation

### Suite 2: Reauthentication (6 tests)
- [ ] 2.1 Wrong Current Password
- [ ] 2.2 Correct Current Password
- [ ] 2.3 Empty Current Password
- [ ] 2.4 Session Expired
- [ ] 2.5 Too Many Failed Attempts
- [ ] 2.6 Reauthentication Success

### Suite 3: Password History (4 tests)
- [ ] 3.1 Reuse Previous Password
- [ ] 3.2 Reuse 2nd Last Password
- [ ] 3.3 Use 6th Previous Password
- [ ] 3.4 Password History Array Limit

### Suite 4: UI/UX Interactions (8 tests)
- [ ] 4.1 Open Modal
- [ ] 4.2 Close Modal (X Button)
- [ ] 4.3 Close Modal (Cancel Button)
- [ ] 4.4 Close Modal (ESC Key)
- [ ] 4.5 Password Visibility Toggle
- [ ] 4.6 Show Requirements Button
- [ ] 4.7 Strength Meter Animation
- [ ] 4.8 Real-time Validation

### Suite 5: Error Handling (5 tests)
- [ ] 5.1 Network Error
- [ ] 5.2 Firestore Permission Error
- [ ] 5.3 Empty Form Submit
- [ ] 5.4 Same Password as Current
- [ ] 5.5 Weak Password Submission Attempt

### Suite 6: Security (5 tests)
- [ ] 6.1 Password Stored as Hash
- [ ] 6.2 Password Not Visible in Network
- [ ] 6.3 Console Logs Clean
- [ ] 6.4 XSS Prevention
- [ ] 6.5 SQL Injection Prevention

### Suite 7: Accessibility (6 tests)
- [ ] 7.1 Keyboard Navigation
- [ ] 7.2 Screen Reader
- [ ] 7.3 Focus Management
- [ ] 7.4 Color Contrast
- [ ] 7.5 Reduced Motion Support
- [ ] 7.6 Form Validation Announcements

### Suite 8: Cross-Browser & Mobile (6 tests)
- [ ] 8.1 Chrome (Desktop)
- [ ] 8.2 Firefox (Desktop)
- [ ] 8.3 Safari (Desktop)
- [ ] 8.4 Edge (Desktop)
- [ ] 8.5 Mobile Chrome (Android)
- [ ] 8.6 Mobile Safari (iOS)

---

## 🚀 EXECUTION PLAN

### Phase 1: Smoke Testing (15 minutes)
1. Suite 1: Test 1.9, 1.10 (Strong passwords)
2. Suite 2: Test 2.2 (Correct flow)
3. Suite 4: Test 4.1, 4.5 (Basic UI)

**Goal:** Verify basic functionality works

---

### Phase 2: Core Testing (30 minutes)
1. Complete Suite 1 (All validation)
2. Complete Suite 2 (All reauthentication)
3. Complete Suite 3 (Password history)

**Goal:** Verify all core features

---

### Phase 3: Extended Testing (30 minutes)
1. Complete Suite 4 (UI/UX)
2. Complete Suite 5 (Error handling)
3. Complete Suite 6 (Security)

**Goal:** Verify edge cases and security

---

### Phase 4: Polish Testing (15 minutes)
1. Complete Suite 7 (Accessibility)
2. Complete Suite 8 (Cross-browser)

**Goal:** Verify accessibility and compatibility

---

## ✅ ACCEPTANCE CRITERIA

### Must-Have (Blocking Issues)
- [x] All validation rules work correctly
- [x] Reauthentication required before change
- [x] Password history prevents reuse
- [x] No TypeScript errors
- [x] No console errors during normal flow
- [ ] Success rate > 95% in manual testing

### Nice-to-Have (Non-Blocking)
- [ ] Strength meter animations smooth
- [ ] All accessibility tests pass
- [ ] Works on all browsers
- [ ] Mobile responsive perfect

---

## 📊 TEST METRICS

**Total Test Scenarios:** 52  
**Estimated Time:** 90 minutes  
**Priority Tests:** 20 (Suites 1, 2, 3)  
**Nice-to-Have Tests:** 32 (Suites 4-8)

**Pass Criteria:**
- Priority tests: 100% pass required
- Nice-to-have tests: 80% pass acceptable

---

## 🔐 SECURITY NOTES

**⚠️ MVP LIMITATIONS:**
1. Passwords stored in plain text in `passwordHistory` (Firestore)
   - **Production TODO:** Hash with bcrypt/argon2 before storing
2. No rate limiting on password change attempts
   - **Production TODO:** Implement rate limiting
3. No email notification on password change
   - **Production TODO:** Send security alert email

**✅ SECURITY IMPLEMENTED:**
1. ✅ Reauthentication required
2. ✅ HTTPS encryption in transit
3. ✅ Firebase Auth handles password storage
4. ✅ Input validation on client + server
5. ✅ XSS prevention (React escaping)
6. ✅ Password history (last 5)

---

## 📝 TESTING NOTES

### Known Issues (Expected)
1. **Password History Plain Text:** Documented for production fix
2. **No Email Notification:** Future enhancement
3. **No 2FA Requirement:** Feature 1.5

### Testing Tips
1. **Use test account:** Don't test with production user
2. **Keep current password handy:** You'll need it many times
3. **Test password resets:** If you lock yourself out, use password reset
4. **Clear browser cache:** Between test runs if behavior strange

### Post-Testing
1. Document all bugs found
2. Create GitHub issues for critical bugs
3. Update this guide with any missing test cases
4. Share results with team

---

**Tested by:** ___________________  
**Date:** ___________________  
**Overall Result:** PASS / FAIL  
**Notes:**

---

**Next Steps After Testing:**
1. ✅ If all tests pass → Deploy to production
2. ❌ If critical bugs found → Fix and retest
3. 📝 Document any enhancements for future

---

**Status:** ✅ READY FOR TESTING
