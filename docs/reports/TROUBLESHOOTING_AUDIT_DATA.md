# 🔧 Troubleshooting - Sample Audit Data Tidak Masuk

**Date:** November 12, 2025  
**Issue:** Data sample 35 audit logs belum masuk ke Firestore

---

## ✅ Checklist Diagnosis

### 1. **Buka Browser Console**
```
1. Buka: http://localhost:3001/settings/audit-testing
2. Tekan F12 (Developer Tools)
3. Buka tab "Console"
4. Klik tombol "🔄 Generate Sample Data"
5. Lihat output console
```

**Expected Output:**
```
🔄 Generating sample audit data...
✅ 1/35 - Vendor creation logged
✅ 2/35 - Vendor approval logged
...
✅ 35/35 - Stock count approval logged
🎉 Sample audit data generation COMPLETE!
```

**Jika Ada Error:**
- Screenshot error message
- Cari error yang mengandung: `Firebase`, `permission`, `undefined`, `auth`

---

### 2. **Check Firebase Authentication**

**Apakah User Sudah Login?**
```javascript
// Paste di browser console:
firebase.auth().currentUser
```

**Expected:** Harus ada object dengan `uid`, `email`, dll.

**Jika null:**
```
1. Login ke aplikasi terlebih dahulu
2. Refresh halaman audit-testing
3. Coba generate lagi
```

---

### 3. **Check Firestore Rules**

**Verify Rules Deployed:**
```powershell
firebase deploy --only firestore:rules
```

**Check rules include:**
```javascript
match /enhancedAuditLogs/{auditId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated();
}
```

**Re-deploy if needed:**
```powershell
cd c:\Users\latie\Documents\GitHub\NataCarePM
firebase deploy --only firestore:rules
```

---

### 4. **Check Network Tab**

**Steps:**
```
1. F12 → Network tab
2. Filter: "firestore" or "googleapis"
3. Klik "Generate Sample Data"
4. Lihat request yang failed (red)
```

**Look for:**
- Status Code: `403` = Permission denied
- Status Code: `401` = Authentication failed
- Status Code: `400` = Bad request (data format error)

---

### 5. **Verify Collection Name**

**Check di auditService.enhanced.ts:**
```typescript
const AUDIT_COLLECTION = 'enhancedAuditLogs';
```

**Harus sama dengan Firestore rules:**
```javascript
match /enhancedAuditLogs/{auditId} { ... }
```

---

### 6. **Test Single Audit Log**

**Paste di browser console (after login):**
```javascript
import { auditHelper } from '@/utils/auditHelper';

auditHelper.logCreate({
  module: 'test',
  entityType: 'test_entity',
  entityId: 'test_001',
  entityName: 'Test Log',
  newData: { test: true },
  metadata: { source: 'manual_test' }
});
```

**Expected:** 
- Console: "Audit log created successfully"
- No errors

---

### 7. **Check Firestore Console**

**Manual Verification:**
```
1. Buka: https://console.firebase.google.com/
2. Pilih project: natacara-hns
3. Klik "Firestore Database"
4. Cari collection: "enhancedAuditLogs"
5. Lihat jumlah documents
```

**Expected:** 35 documents (atau lebih jika generate beberapa kali)

---

### 8. **Clear Browser Cache**

**Jika sudah generate sebelumnya tapi gagal:**
```
1. Ctrl + Shift + Delete
2. Clear: Cached images and files
3. Clear: Cookies and site data
4. Time range: Last hour
5. Klik "Clear data"
6. Refresh page (Ctrl + F5)
7. Login ulang
8. Generate sample data lagi
```

---

## 🐛 Common Errors & Solutions

### **Error: "Permission denied"**
```
❌ FirebaseError: Missing or insufficient permissions
```

**Solution:**
```powershell
# 1. Check Firestore rules
firebase deploy --only firestore:rules

# 2. Verify authentication
# Login ke aplikasi terlebih dahulu

# 3. Check console.firebase.google.com
# Pastikan rules sudah deployed
```

---

### **Error: "undefined userId"**
```
❌ FirebaseError: Unsupported field value: undefined
```

**Solution:**
✅ **ALREADY FIXED** di auditHelper.ts dengan getCurrentUserInfo()

Jika masih terjadi:
```typescript
// Check firebaseConfig.ts
const db: Firestore = initializeFirestore(app, { 
  ignoreUndefinedProperties: true 
});
```

---

### **Error: "Network request failed"**
```
❌ Failed to fetch
```

**Solution:**
```
1. Check internet connection
2. Verify Firebase project ID correct
3. Check firebaseConfig.ts credentials
4. Try restart dev server
```

---

### **No Error, But Data Tidak Muncul**

**Check:**
```javascript
// Browser console:
firebase.firestore().collection('enhancedAuditLogs').get()
  .then(snapshot => {
    console.log('Total docs:', snapshot.size);
    snapshot.forEach(doc => console.log(doc.data()));
  });
```

**If empty:**
- Data generation failed silently
- Check console for any warnings
- Try generate with single log first (Test Audit Logging button)

---

## 🧪 Step-by-Step Debugging

### **Method 1: Generate with Console Open**

```
1. F12 → Console tab
2. Click "🔄 Generate Sample Data"
3. Watch console output line by line
4. Note which log number fails (e.g., ✅ 5/35 then error)
5. Check generateSampleAuditData.ts line that corresponds
```

### **Method 2: Generate Single Module**

**Create test function:**
```typescript
// Paste in browser console or create test file
async function testFinanceOnly() {
  await auditHelper.logCreate({
    module: 'finance',
    entityType: 'journal_entry',
    entityId: 'je_test_001',
    entityName: 'JE-TEST-001',
    newData: {
      entryNumber: 'JE-TEST-001',
      description: 'Test journal entry',
      totalDebit: 1000000,
      totalCredit: 1000000,
    },
  });
  console.log('✅ Finance test passed');
}

testFinanceOnly();
```

**If this works:** Problem is in specific log in generateSampleAuditData.ts

---

## 📊 Verify Data Exists

### **Option 1: Firebase Console**
```
1. https://console.firebase.google.com/
2. Firestore Database
3. Collection: enhancedAuditLogs
4. Count documents
```

### **Option 2: Browser Console**
```javascript
firebase.firestore()
  .collection('enhancedAuditLogs')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()
  .then(snapshot => {
    console.log(`Found ${snapshot.size} logs`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${data.action} - ${data.module} - ${data.entityName}`);
    });
  });
```

### **Option 3: Enhanced Audit Trail Page**
```
1. Navigate to: /settings/audit-trail-enhanced
2. Check "Total Logs" card
3. Should show 35 (or more if generated multiple times)
```

---

## 🚀 Quick Fix Checklist

### **If Nothing Works:**

1. ✅ **Login to app**
   ```
   User must be authenticated
   ```

2. ✅ **Clear cache**
   ```
   Ctrl + Shift + Delete → Clear all
   ```

3. ✅ **Redeploy Firestore rules**
   ```powershell
   firebase deploy --only firestore:rules
   ```

4. ✅ **Restart dev server**
   ```powershell
   # Kill port 3001
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
   npm run dev
   ```

5. ✅ **Hard refresh**
   ```
   Ctrl + F5
   ```

6. ✅ **Test single log first**
   ```
   Click "🧪 Test Audit Logging" button
   Should show: ✅ Audit logging test passed!
   ```

7. ✅ **Then generate full dataset**
   ```
   Click "🔄 Generate Sample Data"
   Wait for: ✅ 35/35
   ```

---

## 📞 Need Help?

**If issue persists, provide:**
1. Screenshot of browser console errors
2. Screenshot of Network tab (filtered: firestore)
3. Output of: `firebase projects:list`
4. Result of: Click "Test Audit Logging" button

---

**Last Updated:** November 12, 2025  
**Related Files:**
- `src/utils/generateSampleAuditData.ts`
- `src/utils/auditHelper.ts`
- `src/api/auditService.enhanced.ts`
- `firestore.rules`
