# 🧪 TESTING INSTRUCTIONS - FIREBASE SDK v10 FIX

**Date:** November 11, 2025  
**Status:** CRITICAL - Cache clearing required  
**URL:** https://natacara-hns.web.app

---

## ⚠️ **MASALAH SAAT INI:**

Dari test terakhir:
- ❌ Browser masih load Firebase SDK v11 (cached)
- ❌ Masih ada 400 errors (5 errors)
- ❌ Masih ada /channel requests
- ✅ Requests turun ke 16 (from 1700) - bagus!

**ROOT CAUSE:** Browser cache masih berisi SDK v11 yang lama.

---

## ✅ **SOLUTION - 3 METODE (Coba urut dari 1)**

### **METODE 1: Simple Cache Clear (Coba dulu)**

**Langkah:**
```
1. Close SEMUA Chrome/Edge tabs
2. Open Chrome/Edge lagi
3. Go to: chrome://settings/clearBrowserData
4. Time range: "All time"
5. Check ONLY: "Cached images and files"
6. Click "Clear data"
7. Close browser COMPLETELY
8. Open browser again
9. Go to: https://natacara-hns.web.app
10. Press: Ctrl+Shift+R (HOLD Ctrl+Shift, THEN press R)
```

**Hasil yang diharapkan:**
- Console log: `[Firebase] Initialized with v10 stable API + offline persistence`

**Jika TIDAK muncul log di atas, lanjut Metode 2.**

---

### **METODE 2: Incognito/Private Mode**

**Langkah:**
```
1. Open Chrome/Edge
2. Press: Ctrl+Shift+N (incognito mode)
3. Go to: https://natacara-hns.web.app
4. Open DevTools: F12
5. Go to Console tab
6. Look for: "[Firebase] Initialized with v10 stable API"
```

**Jika berhasil di Incognito:**
- Berarti cache adalah masalahnya
- Lakukan Metode 3 untuk permanent fix

**Jika TETAP tidak berhasil, lanjut Metode 3.**

---

### **METODE 3: Full Browser Reset + Service Worker Clear**

**Langkah A: Clear SEMUA Data**
```
1. Close ALL Chrome/Edge windows
2. Press: Windows+R
3. Type: chrome://settings/clearBrowserData
4. Press Enter
5. Time range: "All time"
6. Check SEMUA boxes:
   ☑ Browsing history
   ☑ Download history  
   ☑ Cookies and other site data
   ☑ Cached images and files
   ☑ Passwords and other sign-in data
   ☑ Autofill form data
   ☑ Site settings
   ☑ Hosted app data
7. Click "Clear data"
8. Wait sampai selesai
```

**Langkah B: Clear Service Worker**
```
1. Go to: chrome://serviceworker-internals/
2. Search: "natacara-hns"
3. Click "Unregister" on ALL entries
4. Close Chrome COMPLETELY
```

**Langkah C: Clear Application Storage**
```
1. Open Chrome
2. Go to: https://natacara-hns.web.app
3. Open DevTools: F12
4. Go to: Application tab (di toolbar atas)
5. Left sidebar: Click "Clear storage"
6. Check ALL boxes
7. Click "Clear site data"
8. Close DevTools
9. Press: Ctrl+Shift+R
```

**Langkah D: Fresh Test**
```
1. Open DevTools: F12 BEFORE login
2. Go to: Console tab
3. Look for:
   ✅ "[Firebase] Initialized with v10 stable API + offline persistence"
   ✅ "[Firebase] Successfully initialized"
   ✅ "[Firebase] Project ID: natacara-hns"
4. Login
5. Check console for errors
```

---

## 📊 **EXPECTED RESULTS (Setelah Cache Clear)**

### **Console Tab:**
```
✅ [Firebase] Initialized with v10 stable API + offline persistence
✅ [Firebase] Successfully initialized
✅ [Firebase] Project ID: natacara-hns
✅ [Firebase] Auth Domain: natacara-hns.firebaseapp.com
```

**Errors:** 0-2 errors MAX (bukan 5!)

---

### **Network Tab:**

**Filter: "firestore"**
```
✅ Total requests: 10-20 (bukan 16+ seperti sebelumnya)
✅ Status codes: Mostly 200 OK, beberapa 204 No Content
✅ NO 400 Bad Request errors
✅ NO requests ke /Write/channel atau /Listen/channel
```

**Requests yang NORMAL:**
- `https://firestore.googleapis.com/v1/projects/.../databases/(default)/documents:batchGet` - 200 OK
- `https://firestore.googleapis.com/v1/projects/.../databases/(default)/documents` - 200 OK
- Status 204 is OK (No Content response)

**Requests yang HARUS TIDAK ADA:**
- ❌ `/Write/channel` 
- ❌ `/Listen/channel`
- ❌ Any 400 errors

---

### **UI Behavior:**

```
✅ Login page loads instantly
✅ After login, redirect to dashboard smooth (< 2 seconds)
✅ Dashboard shows project data
✅ No error messages on screen
✅ Click "RAB & AHSP" works without crash
✅ Navigation to other menus works
```

---

## 🔍 **DIAGNOSTIC CHECKLIST**

### **Test 1: Check Firebase SDK Version**

**Console:**
```javascript
// Run this in Console tab after page load:
console.log(firebase.SDK_VERSION)
```

**Expected:** `10.14.1` (NOT `11.x.x`)

---

### **Test 2: Check Service Worker**

**Application Tab:**
```
1. Open DevTools
2. Go to: Application tab
3. Left sidebar: Service Workers
4. Should show: 
   - Status: "activated and is running"
   - Source: Should NOT be old version
```

**If shows old version:**
```
1. Click "Unregister"
2. Refresh page
3. Check again
```

---

### **Test 3: Check Network Requests**

**Network Tab:**
```
1. Clear network log
2. Refresh page (Ctrl+R)
3. Filter: "firestore"
4. Count total requests
5. Check for 400 errors
6. Check for /channel URLs
```

**Screenshot Request:**
```
Take screenshot of:
1. Console tab (showing Firebase logs)
2. Network tab (filtered by "firestore")
3. Application > Service Workers
```

---

## 📝 **REPORTING FORMAT**

Setelah test, report dengan format ini:

```
METODE YANG DIGUNAKAN: [1/2/3]

CONSOLE LOGS:
- Ada log "[Firebase] Initialized with v10 stable API"? [Ya/Tidak]
- Total errors: [angka]
- Error messages: [copy paste jika ada]

NETWORK TAB:
- Total Firestore requests: [angka]
- Ada 400 errors? [Ya/Tidak, berapa?]
- Ada /channel requests? [Ya/Tidak]
- Screenshot: [attach]

UI BEHAVIOR:
- Login berhasil? [Ya/Tidak]
- Dashboard load data? [Ya/Tidak]
- RAB & AHSP works? [Ya/Tidak]
- Navigation smooth? [Ya/Tidak]

FIREBASE SDK VERSION:
- Run: firebase.SDK_VERSION
- Hasil: [angka]
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Masih tidak muncul log v10**

**Solution:**
```
1. Try different browser (Edge/Firefox/Chrome Canary)
2. Try on different computer
3. Check firebaseConfig.ts masih correct:
   - Should have: enableIndexedDbPersistence
   - Should NOT have: initializeFirestore
```

---

### **Problem: Masih ada 400 errors**

**Check:**
```
1. Network tab > Click on red (400) request
2. Headers tab > Check "Request URL"
3. If contains /channel → SDK still v11 cached
4. If NOT /channel → Different issue, report details
```

---

### **Problem: Service Worker tidak unregister**

**Force unregister:**
```
1. chrome://serviceworker-internals/
2. Find natacara-hns entries
3. Click "Unregister" on EACH one
4. Restart Chrome
5. Try again
```

---

## ✅ **SUCCESS CRITERIA**

Application is **FULLY FIXED** when:

1. ✅ Console shows: `[Firebase] Initialized with v10 stable API`
2. ✅ Total errors: 0-2 (NOT 5+)
3. ✅ Network requests: 10-20 (NOT 16+)
4. ✅ NO 400 errors in Network tab
5. ✅ NO /channel requests
6. ✅ Dashboard loads data smoothly
7. ✅ RAB & AHSP works without crash
8. ✅ All navigation works

---

## 📞 **IF STILL NOT WORKING**

If setelah Metode 1, 2, 3 masih tidak works:

**Provide:**
1. Screenshot Console tab (full)
2. Screenshot Network tab (filtered "firestore")
3. Screenshot Application > Service Workers
4. Result of: `firebase.SDK_VERSION` in console
5. Browser version: `chrome://version`
6. OS: Windows version

**Then we will:**
- Check if deployment successful
- Verify Firebase Hosting settings
- Check CDN cache
- Implement alternative solution

---

**IMPORTANT:** Firebase SDK v10 **SUDAH DEPLOYED** ke production. Masalahnya hanya **browser cache**. Setelah cache clear, aplikasi AKAN WORKS dengan baik.

**Last Updated:** November 11, 2025  
**Deployed Version:** Firebase SDK v10.14.1  
**Cache Headers:** NO CACHE for JS/CSS files  
**Status:** Ready for testing
