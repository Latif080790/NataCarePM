# P1 Testing Guide untuk QA Team

## 🎯 Tujuan Testing

Memverifikasi bahwa semua implementasi P1 berfungsi dengan baik:
- ✅ Layout mobile vs desktop berfungsi otomatis
- ✅ Kompresi gambar menghemat storage
- ✅ RBAC mencegah Site Manager akses data finansial
- ✅ Mode offline tetap bisa input data
- ✅ Aksesibilitas WCAG AA terpenuhi

---

## 📱 Test 1: Layout Mobile vs Desktop

### Objective
Verifikasi bahwa sistem menampilkan layout berbeda berdasarkan device.

### Steps (Desktop)
1. Buka browser desktop (Chrome/Firefox)
2. Login dengan akun test: `test@example.com` / `Test@123456`
3. Perhatikan sidebar di kiri dengan menu lengkap ✅
4. Tidak ada bottom navigation ✅

### Steps (Mobile)
1. Buka di smartphone atau emulator mobile
2. Login dengan akun yang sama
3. Perhatikan **bottom navigation** dengan 5 tab ✅
4. Header compact di atas ✅
5. Tap menu (kanan atas) → Sliding menu muncul ✅

### Expected Results
- Desktop: Sidebar + no bottom nav
- Mobile: Bottom nav + compact header
- Automatic switching tanpa manual setup

### Test in Chrome DevTools
1. Buka DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Pilih "iPhone 12" → Mobile layout muncul ✅
4. Pilih "Desktop" → Desktop layout muncul ✅

---

## 🖼️ Test 2: Kompresi Gambar Otomatis

### Objective
Verifikasi gambar otomatis dikompres sebelum upload, target < 500KB.

### Setup
Siapkan foto test:
- `test-large.jpg` (5 MB)
- `test-medium.jpg` (1.5 MB)
- `test-small.jpg` (200 KB)

### Steps
1. Login sebagai Site Manager
2. Buka halaman Daily Logs
3. Click "Buat Laporan" / "Create Report"
4. Upload `test-large.jpg` (5 MB)
5. Tunggu proses kompresi (progress bar muncul) ✅
6. Perhatikan info ukuran file:
   - Before: 5 MB
   - After: ~350 KB
   - Saved: ~93% ✅

### Expected Results
- **Large file (5 MB):** Dikompres ke ~350 KB (< 500 KB ✅)
- **Medium file (1.5 MB):** Dikompres ke ~400 KB
- **Small file (200 KB):** Skip kompresi (sudah kecil)
- **Progress bar:** Tampil saat kompresi
- **Stats:** Tampilkan before/after size

### Batch Upload Test
1. Upload 5 foto sekaligus (total 20 MB)
2. Semua terkompresi parallel ✅
3. Summary menampilkan total savings ✅

---

## 🔒 Test 3: RBAC - Site Manager NO Financial Access

### Objective
Verifikasi Site Manager **TIDAK BISA** akses data finansial (RAB, profit).

### Test Accounts
```
Owner:         owner@test.com / Owner@123
PM:            pm@test.com / PM@123
Site Manager:  sitemanager@test.com / Site@123
```

### Steps (Site Manager)
1. Login sebagai **Site Manager**
2. Buka dashboard
3. **Cek:** Tidak ada widget RAB/Budget ✅
4. **Cek:** Tidak ada angka profit margin ✅
5. Coba akses `/rab` langsung di URL
6. **Expected:** Redirect atau "Access Denied" ✅

### Steps (PM)
1. Login sebagai **PM**
2. Buka dashboard
3. **Cek:** Bisa lihat RAB ✅
4. **Cek:** Tidak bisa lihat profit margin (owner only) ✅

### Steps (Owner)
1. Login sebagai **Owner**
2. Buka dashboard
3. **Cek:** Semua data visible termasuk profit ✅

### Expected Results (Site Manager)
- ❌ **BLOCKED:** RAB page, Finance page
- ✅ **ALLOWED:** Daily Logs, Progress, Inventory
- ❌ **HIDDEN:** Profit widgets, financial stats

### Automated Test
```powershell
npm run test:rbac
# Verifikasi semua 15 permission test passing
```

---

## 📶 Test 4: Mode Offline - Save & Sync

### Objective
Verifikasi data bisa disimpan offline dan sync otomatis saat online.

### Setup
1. Login di Chrome
2. Buka DevTools (F12)
3. Tab **Network**

### Steps: Save Offline
1. Check "Offline" di Network tab ✅
2. Perhatikan indicator "Offline" muncul di UI ✅
3. Buka Daily Logs
4. Buat laporan baru:
   - Description: "Test offline report"
   - Click Submit
5. **Expected:** Success message "Data tersimpan lokal" ✅
6. **Cek:** Pending count: 1 ✅

### Steps: Sync Online
1. Uncheck "Offline" di Network tab
2. Tunggu 2-3 detik
3. **Expected:** Auto-sync triggered ✅
4. **Cek:** Pending count: 0 ✅
5. **Cek:** Data muncul di Firestore ✅

### Verify IndexedDB
1. DevTools → Application tab
2. IndexedDB → NataCarePMOffline
3. `pendingOperations` → Cek ada entry saat offline ✅
4. Setelah sync → Empty ✅

### Test Multiple Operations
1. Go offline
2. Create 3 daily logs
3. Pending count: 3 ✅
4. Go online
5. All 3 sync successfully ✅

---

## ♿ Test 5: Aksesibilitas WCAG AA

### Objective
Verifikasi semua halaman comply dengan WCAG AA.

### Test Keyboard Navigation
1. Login page (gunakan Tab key saja):
   - Tab → Email field focused ✅
   - Tab → Password field focused ✅
   - Tab → Submit button focused ✅
   - Enter → Login berhasil ✅

2. Dashboard (gunakan Tab):
   - Semua button bisa di-reach ✅
   - Focus indicator visible (outline) ✅

### Test Screen Reader (NVDA/JAWS)
1. Enable screen reader
2. Navigate login page
3. **Expected:** Email label dibaca ✅
4. **Expected:** Password label dibaca ✅
5. **Expected:** Button text dibaca ✅

### Test Color Contrast
1. Login page → Inspect text
2. Contrast ratio min: 4.5:1 (WCAG AA) ✅
3. Use Axe DevTools untuk verify

### Automated Test
```powershell
npm run test:accessibility
# Expected: 0 violations
```

### Manual Checklist
- [ ] All images have alt text
- [ ] All buttons have descriptive labels
- [ ] Form inputs have labels
- [ ] Heading hierarchy (h1 → h2 → h3)
- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

---

## 🧪 Test 6: Network-Aware Compression

### Objective
Verifikasi kompresi profile berubah berdasarkan kecepatan koneksi.

### Steps
1. Chrome DevTools → Network tab
2. Throttling: "Slow 3G"
3. Upload foto 3 MB
4. **Expected:** Compressed to ~250 KB (LOW_BANDWIDTH profile) ✅

5. Throttling: "Fast 3G"
6. Upload foto yang sama
7. **Expected:** Compressed to ~500 KB (BALANCED) ✅

8. Throttling: "No throttling" (WiFi)
9. Upload foto yang sama
10. **Expected:** Compressed to ~900 KB (HIGH_QUALITY) ✅

### Verify Profile Selection
```typescript
// Console log should show:
// "Network: slow-3g → Profile: LOW_BANDWIDTH"
// "Network: 4g → Profile: HIGH_QUALITY"
```

---

## 📊 Performance Benchmarks

### Target Metrics
| Device | Bundle Size | Load Time | LCP | CLS |
|--------|-------------|-----------|-----|-----|
| Desktop | < 1 MB | < 2s | < 2.5s | < 0.1 |
| Mobile | < 700 KB | < 3s | < 3.5s | < 0.1 |

### How to Measure
1. Chrome DevTools → Lighthouse tab
2. Select "Mobile" device
3. Click "Generate report"
4. **Verify:**
   - Performance: ≥ 90 ✅
   - Accessibility: 100 ✅
   - Best Practices: ≥ 90 ✅

---

## 🐛 Bug Report Template

Jika menemukan issue:

```
**Title:** [P1 Test] Brief description

**Priority:** High / Medium / Low

**Test Case:** (e.g., Test 3: RBAC)

**Steps to Reproduce:**
1. Login as Site Manager
2. Navigate to /rab
3. ...

**Expected Result:**
Access denied message

**Actual Result:**
Page loads successfully (WRONG)

**Environment:**
- Browser: Chrome 120
- Device: Desktop
- Network: WiFi

**Screenshots:**
[Attach screenshot]

**Additional Notes:**
IndexedDB shows...
```

---

## ✅ Final QA Checklist

### Before Approving P1
- [ ] Test 1: Layout switching (desktop/mobile) ✅
- [ ] Test 2: Image compression < 500KB ✅
- [ ] Test 3: RBAC - Site Manager blocked ✅
- [ ] Test 4: Offline mode save & sync ✅
- [ ] Test 5: Accessibility WCAG AA ✅
- [ ] Test 6: Network-aware compression ✅
- [ ] Performance: Bundle < 700KB mobile ✅
- [ ] E2E tests: All passing ✅
- [ ] No console errors ✅
- [ ] Cross-browser: Chrome/Firefox/Safari ✅

### Sign-Off
```
✅ QA Approved by: _____________
Date: December 16, 2025
Status: Ready for Production
```

---

## 📞 Contact

**Jika ada pertanyaan:**
- Developer: Check P1_IMPLEMENTATION_COMPLETE.md
- Quick help: Check P1_QUICK_REFERENCE.md
- Bug report: Use template di atas

**Testing Tools:**
```powershell
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:rbac
npm run test:offline
npm run test:accessibility

# Generate report
npm run test:e2e:report
```

---

**Last Updated:** December 16, 2025  
**QA Version:** 1.0  
**Status:** P1 Testing Complete ✅
