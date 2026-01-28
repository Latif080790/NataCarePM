# P2 Testing Guide - Production Verification

**Deployment URL:** https://natacara-hns.web.app  
**Deployment Date:** December 16, 2025  
**Status:** ✅ Deployed Successfully

---

## Quick Verification Checklist

### 1. Service Worker (P2.3) - 2 minutes

**Open DevTools → Application Tab**

```
✓ Service Workers section shows:
  - Status: Activated and running
  - Scope: /
  - Source: /service-worker.js
  - Version: v1.2.0

✓ Cache Storage shows:
  - natacare-v1.2.0 cache exists
  - Contains 8 precached items:
    • /
    • /index.html
    • /manifest.json
    • /offline.html
    • /icons/icon-192x192.png
    • /icons/icon-512x512.png
    • /favicon-32x32.png
    • /favicon-16x16.png
```

**Console Output:**
```
[SW] Service worker registered: /
[SW] Precaching app shell
[SW] Service worker installed successfully
[SW] Service worker activated
```

**Test Offline Mode:**
```
1. Open Network tab in DevTools
2. Check "Offline" checkbox
3. Refresh page
4. Page should load from cache ✓
5. Navigate to /dashboard
6. Should show cached content or offline page ✓
```

---

### 2. PWA Installability (P2.4) - 1 minute

**Check Manifest:**

Open DevTools → Application → Manifest

```
✓ Name: NataCarePM - Construction Project Management System
✓ Short name: NataCarePM
✓ Start URL: /
✓ Display: standalone
✓ Theme color: #ea580c
✓ Background: #ffffff
✓ Language: id-ID
✓ Icons: 4 icons (16x16, 32x32, 192x192, 512x512)
✓ Shortcuts: 3 shortcuts (Dashboard, RAB, Daily Report)
```

**Test Install Prompt:**
```
1. Visit site 2-3 times or wait 5 minutes
2. Install prompt should appear bottom-right ✓
3. Click "Install" button
4. Native browser prompt appears ✓
5. Accept → App added to home screen ✓
```

**Verify Installed App:**
```
1. Close browser
2. Open app from home screen/start menu
3. Should open in standalone mode (no browser UI) ✓
4. Title bar shows "NataCarePM" ✓
```

---

### 3. Language Switcher (P2.5) - 1 minute

**UI Check:**

Header → Top Right → Flag icon 🇮🇩/🇬🇧

```
✓ Indonesian flag (🇮🇩) shows by default
✓ Click flag → Opens minimal switcher
✓ Click to switch → Changes to English 🇬🇧
✓ All UI text updates immediately
```

**Test Translations:**

| Location | Indonesian | English |
|----------|------------|---------|
| Header "Logout" | Keluar | Logout |
| Common "Save" | Simpan | Save |
| Common "Cancel" | Batal | Cancel |
| Dashboard "Welcome" | Selamat datang kembali | Welcome back |

**Persistence Check:**
```
1. Switch to English
2. Reload page
3. Should stay English ✓
4. Check localStorage: preferredLanguage = "en" ✓
```

---

### 4. Bundle Optimization (P2.1) - 2 minutes

**Network Tab Analysis:**

Reload page with Network tab open

```
✓ Initial JS chunks loaded:
  - react-vendor.js (~76KB gzipped)
  - firebase.js (~159KB gzipped)
  - vendor.js (~232KB gzipped)
  - contexts.js (~28KB gzipped)
  
✓ Total initial load: ~467KB (target: <500KB) ✓

✓ NOT loaded on initial:
  - exceljs.js (only on export action)
  - jspdf.js (only on PDF generation)
```

**Test Lazy Loading:**
```
1. Navigate to Audit Logs
2. Click "Export to Excel" button
3. Network tab shows exceljs.js loading (~272KB) ✓
4. Excel file downloads ✓

5. Click "Export to PDF" button
6. Network tab shows jspdf.js loading (~121KB) ✓
7. PDF file downloads ✓
```

**Cache Verification:**
```
1. Reload page (hard refresh: Ctrl+Shift+R)
2. Check Network tab for react-vendor.js
3. Status should be "200 (from service worker)" ✓
4. Size should show (from SW cache) ✓
5. Time should be <50ms ✓
```

---

### 5. Web Vitals (P2.2) - 2 minutes

**Open Performance Dashboard:**

Press `Ctrl+Shift+P` or click Performance menu

```
✓ Dashboard shows 5 metrics:
  1. LCP (Largest Contentful Paint)
  2. INP (Interaction to Next Paint)
  3. CLS (Cumulative Layout Shift)
  4. FCP (First Contentful Paint)
  5. TTFB (Time to First Byte)

✓ All metrics color-coded:
  - Green: Good (within target)
  - Yellow: Needs improvement
  - Red: Poor

✓ Target values displayed
✓ Current values displayed
✓ Percentage comparison shown
```

**Expected Values (Production):**
```
LCP:  < 2.5s  (Target: 2.5s)  ✓ Green
INP:  < 200ms (Target: 200ms) ✓ Green
CLS:  < 0.1   (Target: 0.1)   ✓ Green
FCP:  < 1.8s  (Target: 1.8s)  ✓ Green
TTFB: < 800ms (Target: 800ms) ✓ Green
```

**Google Analytics Verification:**
```
1. Open Network tab
2. Filter by "google-analytics.com/g/collect"
3. Should see events with:
   - event_name: web_vitals
   - metric_name: LCP, INP, CLS, FCP, TTFB
   - metric_value: <numeric>
```

---

## Detailed Testing Scenarios

### Scenario A: Field Worker (Offline Construction Site)

**User Story:** Site manager needs to create daily report with no internet

**Steps:**
1. Visit site with good internet → Cache loads ✓
2. Navigate to Daily Reports
3. Disable internet (airplane mode)
4. Create new daily report
5. Fill form with photos (camera access)
6. Click "Save"
7. Data saved to IndexedDB ✓
8. OfflineIndicator shows "1 item pending sync"
9. Enable internet
10. Wait 2-3 seconds → Auto-sync ✓
11. Toast notification: "Data synced successfully"
12. OfflineIndicator disappears ✓

**Expected Result:** Full offline functionality with auto-sync

---

### Scenario B: International User (English Speaker)

**User Story:** Expat project manager prefers English interface

**Steps:**
1. Visit site (first time)
2. Browser language: en-US
3. i18n detects English → Sets lang="en" ✓
4. All UI in English by default
5. Click language switcher → Shows 🇬🇧
6. Switch to Indonesian → UI updates
7. Reload page → Stays Indonesian (localStorage)
8. Switch back to English → Persists ✓

**Expected Result:** Seamless language switching with persistence

---

### Scenario C: Repeat Visitor (Performance Check)

**User Story:** Daily user expects fast loading

**Steps:**
1. Visit site (first time)
   - LCP: ~1.2s (downloading assets)
   - All files cached ✓
2. Close browser
3. Visit site again (same day)
   - LCP: ~0.8s (↓33% from cache) ✓
   - Network requests: 0 (all from SW) ✓
4. Navigate between pages
   - Instant transitions (<100ms) ✓
5. Open network tab
   - All assets show "(from service worker)" ✓

**Expected Result:** Sub-second repeat visits

---

### Scenario D: Mobile Installation (PWA)

**User Story:** Site engineer wants app on phone

**Steps (Android Chrome):**
1. Visit site 3 times over 2 days
2. Install prompt appears
3. Read benefits:
   - Bekerja offline tanpa koneksi internet ✓
   - Notifikasi real-time untuk update proyek ✓
   - Akses cepat dari home screen ✓
   - Loading lebih cepat dengan cache ✓
4. Click "Install"
5. Native prompt: "Add NataCarePM to Home screen?"
6. Click "Add"
7. App icon appears on home screen
8. Open app → Standalone mode (no browser UI) ✓
9. Use app shortcuts:
   - Long press icon → Shows Dashboard, RAB, Daily Report
   - Click "Dashboard" → Opens directly ✓

**Expected Result:** Native-like app experience

---

### Scenario E: Audit Export (Bundle Optimization)

**User Story:** Admin needs to export audit logs

**Steps:**
1. Open Audit Logs page
2. Check Network tab → No exceljs.js loaded yet ✓
3. Click "Export to Excel"
4. Network tab shows exceljs.js loading (~272KB)
5. Progress indicator shows "Generating..."
6. Excel file downloads ✓
7. Open file → All data correct ✓
8. Click "Export to PDF"
9. Network tab shows jspdf.js loading (~121KB)
10. PDF file downloads ✓

**Expected Result:** Heavy libraries only load when needed

---

## Performance Benchmarks

### Lighthouse Scores (Target)

Run Lighthouse audit in Chrome DevTools:

```bash
# Open DevTools → Lighthouse tab → Generate report
```

**Expected Scores:**
```
Performance:    ≥ 90  ✓
Accessibility:  ≥ 95  ✓
Best Practices: ≥ 95  ✓
SEO:            ≥ 90  ✓
PWA:            ✓ Installable
```

**Key Metrics:**
```
First Contentful Paint:     < 1.5s  ✓
Largest Contentful Paint:   < 2.5s  ✓
Time to Interactive:        < 3.0s  ✓
Speed Index:                < 3.5s  ✓
Total Blocking Time:        < 300ms ✓
Cumulative Layout Shift:    < 0.1   ✓
```

---

### Network Performance

**First Visit (No Cache):**
```
Requests:       ~45 requests
Transferred:    ~520KB gzipped
Resources:      ~1.2MB uncompressed
DOMContentLoaded: ~1.0s
Load:           ~1.5s
Finish:         ~2.0s
```

**Repeat Visit (With Cache):**
```
Requests:       ~10 requests (API only)
Transferred:    ~50KB (API responses)
Resources:      ~1.2MB (from cache)
DOMContentLoaded: ~0.5s
Load:           ~0.8s
Finish:         ~1.0s
```

**Improvement:** ~50% faster on repeat visits

---

## Troubleshooting

### Issue: Service Worker Not Registering

**Symptoms:** No cache in Application tab

**Debug Steps:**
```
1. Check Console for errors
2. Verify /service-worker.js exists (200 OK)
3. Check HTTPS (SW requires secure context)
4. Hard refresh: Ctrl+Shift+R
5. Unregister old SW: Application → Service Workers → Unregister
6. Clear cache: Application → Clear storage
7. Reload page
```

**Solution:** Service worker should register on next page load

---

### Issue: PWA Install Prompt Not Showing

**Symptoms:** No install button appears

**Causes:**
```
- Already installed
- Dismissed within last 7 days
- Browser doesn't support (Safari iOS)
- Manifest missing/invalid
- Not served over HTTPS
```

**Force Show:**
```javascript
// Run in Console
window.dispatchEvent(new Event('beforeinstallprompt'));
```

**Check Installability:**
```
DevTools → Application → Manifest
Look for "Add to home screen" warnings
```

---

### Issue: Language Not Persisting

**Symptoms:** Resets to Indonesian on reload

**Debug Steps:**
```
1. Open DevTools → Application → Local Storage
2. Check for key: preferredLanguage
3. Value should be "en" or "id"
4. If missing, localStorage might be blocked
5. Check browser settings → Cookies → Allow
```

**Manual Fix:**
```javascript
// Run in Console
localStorage.setItem('preferredLanguage', 'en');
location.reload();
```

---

### Issue: Bundle Not Optimized

**Symptoms:** Single large vendor.js file

**Debug Steps:**
```
1. Check dist/assets/ folder
2. Should see separate chunks:
   - react-vendor-*.js
   - firebase-*.js
   - vendor-*.js
   - exceljs-*.js
   - jspdf-*.js

3. If missing, rebuild:
   npm run build
```

**Verify Chunking:**
```powershell
ls dist/assets/*.js | Select-Object Name,Length | Sort-Object Length -Descending
```

---

## Automated Testing Commands

### Type Check
```powershell
npm run type-check
# Should show 0 errors in src/ files
```

### Build Test
```powershell
npm run build
# Should complete in <20s
# dist/ folder should contain:
#   - service-worker.js
#   - manifest.json
#   - assets/*.js (chunked)
```

### Bundle Analysis
```powershell
npm run build
# Open dist/stats.html in browser
# Verify chunk sizes match expectations
```

### E2E Tests (if implemented)
```powershell
npm run test:e2e
# Should test:
#   - PWA installation flow
#   - Offline mode functionality
#   - Language switching
#   - Service worker caching
```

---

## Performance Monitoring

### Daily Checks

**Google Analytics Dashboard:**
1. Login to GA4: https://analytics.google.com
2. Navigate to Reports → Engagement → Events
3. Filter by event_name: "web_vitals"
4. Check metric distributions:
   - 75th percentile should be in "Good" range
   - <10% users in "Poor" range

**Service Worker Analytics:**
```
Application → Service Workers → Console
Look for:
- Cache hit rate >80%
- Average response time <50ms
- Failed requests <1%
```

### Weekly Reviews

**Bundle Size Tracking:**
```powershell
# Track over time
npm run build 2>&1 | Select-String "dist/assets.*\.js.*gzip" > bundle-size-$(Get-Date -Format 'yyyy-MM-dd').log
```

**Performance Regression:**
```
1. Run Lighthouse audit weekly
2. Compare scores with previous week
3. Investigate any drops >5 points
4. Check for new heavy dependencies
```

---

## Success Criteria Summary

### P2.1 Bundle Optimization ✅
- [x] Initial bundle <500KB gzipped
- [x] React vendor chunk separate (76KB)
- [x] Firebase chunk separate (159KB)
- [x] Excel/PDF lazy loaded
- [x] Build visualizer shows optimal chunks

### P2.2 Web Vitals ✅
- [x] LCP <2.5s
- [x] INP <200ms
- [x] CLS <0.1
- [x] FCP <1.8s
- [x] TTFB <800ms
- [x] GA4 events firing
- [x] Performance dashboard accessible

### P2.3 Service Worker ✅
- [x] Registers on page load
- [x] Caches 8 precache assets
- [x] 30-day cache duration
- [x] Offline page loads
- [x] Cache strategies working
- [x] Old caches deleted on update

### P2.4 PWA ✅
- [x] Manifest valid and complete
- [x] Icons all sizes present
- [x] Shortcuts working
- [x] Install prompt shows
- [x] Installs successfully
- [x] Standalone mode works

### P2.5 i18n ✅
- [x] Indonesian default
- [x] English available
- [x] Language switcher in header
- [x] 379+ translations
- [x] Persists to localStorage
- [x] Auto-detects browser language

---

## Deployment Checklist

Before each deployment:

- [ ] Type check passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Service worker version bumped (if changed)
- [ ] Translations updated (if needed)
- [ ] Lighthouse score >90
- [ ] Manual smoke test passed
- [ ] Git commit with clear message
- [ ] Deploy: `.\deploy-nocache.ps1`
- [ ] Verify production URL loads
- [ ] Test one scenario from each P2 task

---

**Testing Guide Version:** 1.0  
**Last Updated:** December 16, 2025  
**Production URL:** https://natacara-hns.web.app
