# Mobile Features Testing Guide - Week 1-2

**Testing Period:** November 7-21, 2025  
**Live URL:** https://natacara-hns.web.app  
**Status:** Ready for Real Device Testing 📱

---

## Overview

Test semua mobile features yang sudah deployed di production untuk collect metrics dan validasi functionality. Target: 100+ samples per feature dalam 2 minggu.

## Success Metrics Target

| Feature | Target | Current Status |
|---------|--------|----------------|
| Camera Upload Success | ≥95% | 🔄 Collecting data |
| GPS Geofence Compliance | ≥95% | 🔄 Collecting data |
| Push Notification Opens | ≥40% | 🔄 Collecting data |

---

## 1. CAMERA CAPTURE TESTING

### Prerequisites
- Device dengan camera (rear/front)
- Browser: Chrome (Android) atau Safari (iOS)
- Internet connection: 4G/WiFi
- Login ke app sebagai user dengan akses dokumen

### Test Scenarios

#### A. Basic Camera Upload
**Steps:**
1. Buka app → Login → Menu "Dokumen"
2. Klik tombol "Tambah Dokumen" atau upload button
3. Pilih "Ambil Foto" (bukan "Pilih File")
4. Allow camera permission jika diminta
5. Ambil foto dokumen/objek
6. Confirm foto
7. Wait upload complete

**Expected Results:**
- ✅ Camera opens tanpa error
- ✅ Photo preview muncul setelah capture
- ✅ Upload progress indicator tampil
- ✅ Success notification muncul
- ✅ Foto muncul di list dokumen

**Metrics Tracked:**
- Success/failure status
- File size (bytes)
- Compression ratio
- Upload duration (ms)
- Error messages (if any)

#### B. Multiple Photos
**Steps:**
1. Upload 5 foto berbeda secara berurutan
2. Test dengan berbagai kondisi:
   - Indoor (low light)
   - Outdoor (bright light)
   - Document close-up
   - Object from distance
   - Different orientations (portrait/landscape)

**Check:**
- Semua foto berhasil upload
- No memory issues
- Consistent compression quality

#### C. Error Scenarios
**Test:**
1. Turn off WiFi/data saat upload → Check offline handling
2. Cancel upload mid-process → Check cleanup
3. Upload very large file (>10MB) → Check file size limit
4. Deny camera permission → Check error message

**Expected:**
- Error messages jelas dan actionable
- No app crash
- Graceful degradation

### Testing Checklist

**Android Testing:**
- [ ] Chrome browser (latest)
- [ ] Samsung Galaxy (One UI)
- [ ] Google Pixel (Stock Android)
- [ ] Mid-range device (<4GB RAM)
- [ ] Test camera permissions
- [ ] Test storage permissions
- [ ] Verify metrics in dashboard

**iOS Testing:**
- [ ] Safari browser (latest)
- [ ] iPhone 12/13/14
- [ ] iPad (if available)
- [ ] Test camera permissions
- [ ] Test storage permissions
- [ ] Verify metrics in dashboard

---

## 2. GPS TRACKING TESTING

### Prerequisites
- Device dengan GPS/Location services
- Outdoor testing area
- Known work site location dengan geofence configured
- Login sebagai user dengan akses attendance

### Test Scenarios

#### A. Basic GPS Capture
**Steps:**
1. Buka app → Login → Menu "Attendance"
2. Pastikan GPS/Location enabled
3. Klik "Capture Location" atau check-in button
4. Allow location permission jika diminta
5. Wait untuk GPS lock (max 10 detik)
6. Verify location captured

**Expected Results:**
- ✅ GPS acquires location dalam <10s
- ✅ Accuracy ≤20 meters (outdoor)
- ✅ Coordinates displayed correctly
- ✅ Geofence status shown (inside/outside)
- ✅ Distance from site calculated

**Metrics Tracked:**
- Latitude/longitude
- Accuracy (meters)
- Within geofence (true/false)
- Distance from site (meters)
- Acquisition time (ms)

#### B. Geofence Testing
**Test Locations:**
1. **Inside Geofence** (radius 100m from site center)
   - Stand at site entrance
   - Capture location
   - Verify "Within Geofence: Yes"
   
2. **Outside Geofence** (>100m from site)
   - Walk to location luar radius
   - Capture location
   - Verify "Within Geofence: No"
   - Check distance calculation accurate

3. **Boundary Testing**
   - Test tepat di edge radius (90-110m)
   - Verify consistent behavior

#### C. Accuracy Testing
**Conditions:**
1. **Optimal:** Outdoor, clear sky
2. **Challenging:** Under tree cover
3. **Difficult:** Indoor near window
4. **Impossible:** Deep indoor/basement

**Record:**
- Accuracy values per condition
- Acquisition time per condition
- Success rate per condition

### Testing Checklist

**Android Testing:**
- [ ] GPS enabled
- [ ] Test at actual work site
- [ ] Test inside geofence (5 samples)
- [ ] Test outside geofence (5 samples)
- [ ] Test accuracy variations
- [ ] Verify metrics in dashboard

**iOS Testing:**
- [ ] Location services enabled
- [ ] Test "Precise Location" ON
- [ ] Test "Precise Location" OFF
- [ ] Same geofence tests as Android
- [ ] Verify metrics in dashboard

**Multi-Site Testing:**
- [ ] Test at Site A
- [ ] Test at Site B (different radius)
- [ ] Verify correct site detection
- [ ] Check distance calculations

---

## 3. PUSH NOTIFICATIONS TESTING

### Prerequisites
- Device dengan push notification support
- Browser dengan notification permission
- VAPID key configured (✅ Already set)
- Login dengan valid FCM token

### Test Scenarios

#### A. Basic Push Delivery
**Steps:**
1. Login ke app
2. Grant notification permission jika diminta
3. Subscribe to push (automatic on login)
4. Trigger notification (via admin/test tool)
5. Verify notification received

**Expected Results:**
- ✅ Permission prompt muncul sekali
- ✅ Notification delivered dalam <5s
- ✅ Title dan body correct
- ✅ Icon/badge tampil
- ✅ Click opens correct page

**Metrics Tracked:**
- Timestamp sent
- Notification type
- Delivered (true/false)
- Opened (true/false)
- Time to open (ms)

#### B. Notification Types
**Test Each Type:**
1. **Task Assignment**
   - Assign task ke user
   - Verify notification received
   - Click → Opens task detail

2. **Deadline Reminder**
   - Set task deadline near
   - Verify reminder sent
   - Check timing accuracy

3. **Approval Request**
   - Submit document for approval
   - Verify approver gets notification
   - Click → Opens approval page

4. **System Alert**
   - Trigger system event
   - Verify all users notified
   - Check broadcast delivery

#### C. Click Tracking
**Test:**
1. Receive notification
2. Wait 5 seconds
3. Click notification
4. Verify:
   - App opens correctly
   - Correct page loaded
   - Click tracked in analytics
   - Time-to-open recorded

#### D. Do Not Disturb
**Test:**
1. Enable DND on device
2. Send notification
3. Check if delivered after DND off
4. Verify no duplicate

### Testing Checklist

**Android Testing:**
- [ ] Chrome browser
- [ ] Test notification delivery (10 samples)
- [ ] Test each notification type
- [ ] Test click tracking
- [ ] Test with/without DND
- [ ] Verify open rate in dashboard

**iOS Testing:**
- [ ] Safari browser
- [ ] Test notification delivery (10 samples)
- [ ] Test each notification type
- [ ] Test click tracking
- [ ] Test with Focus modes
- [ ] Verify open rate in dashboard

**Cross-Device:**
- [ ] Test on tablet
- [ ] Test on desktop browser
- [ ] Test multiple devices same user
- [ ] Verify no duplicate notifications

---

## 4. MOBILE UI/UX TESTING

### A. Touch Targets
**Check:**
- [ ] All buttons ≥48x48px
- [ ] Tap response immediate (<100ms)
- [ ] No accidental taps
- [ ] Clear active state

### B. Responsive Layout
**Test Sizes:**
- [ ] Small phone (320px width)
- [ ] Medium phone (375px width)
- [ ] Large phone (428px width)
- [ ] Tablet portrait (768px)
- [ ] Tablet landscape (1024px)

**Verify:**
- No horizontal scroll
- Content readable
- Images scale properly
- Bottom nav tidak overlap content

### C. Safe Areas (iOS)
**On iPhone dengan notch:**
- [ ] Content tidak terpotong notch
- [ ] Bottom nav di atas home indicator
- [ ] Full-screen images respect safe area

### D. Performance
**Measure:**
- [ ] Page load time <3s (4G)
- [ ] Smooth scroll (60fps)
- [ ] Camera opens <1s
- [ ] GPS acquires <10s

---

## 5. MONITORING DASHBOARD TESTING

### Access Dashboard
**Steps:**
1. Login sebagai Admin/Manager
2. Navigate to dashboard/monitoring page
3. View mobile metrics cards

### Verify Metrics

#### Camera Metrics Card
**Check:**
- [ ] Total uploads counter updates
- [ ] Success rate percentage shown
- [ ] Progress bar represents target (95%)
- [ ] Green if ≥95%, yellow if <95%
- [ ] Status: "Excellent" or "Needs Attention"

#### GPS Metrics Card
**Check:**
- [ ] Total captures counter updates
- [ ] Average accuracy shown (meters)
- [ ] Geofence compliance rate shown
- [ ] Progress bar vs 95% target
- [ ] Status indicator correct

#### Push Metrics Card
**Check:**
- [ ] Total deliveries counter updates
- [ ] Delivery rate shown (should be ~100%)
- [ ] Open rate percentage shown
- [ ] Progress bar vs 40% target
- [ ] Average time to open (seconds)

### Auto-Refresh
**Test:**
- [ ] Dashboard refreshes every 30 seconds
- [ ] New data appears automatically
- [ ] No manual refresh needed
- [ ] Performance stays smooth

---

## 6. ERROR TRACKING

### Monitor Errors
**Check These Logs:**
1. **Browser Console** (F12)
   - Any red errors?
   - Stack traces?
   - Network failures?

2. **Firebase Console**
   - Navigate to: https://console.firebase.google.com/project/natacara-hns/crashlytics
   - Check crash reports
   - Review error trends

3. **Google Analytics**
   - Navigate to: https://console.firebase.google.com/project/natacara-hns/analytics
   - Check custom events:
     - mobile_camera_upload
     - mobile_gps_capture
     - mobile_push_notification

### Common Issues to Watch

**Camera:**
- "Permission denied" - User rejected
- "Device not supported" - Old browser
- "Upload failed" - Network issue
- "File too large" - Size limit

**GPS:**
- "Geolocation not supported" - Old device
- "Permission denied" - User rejected
- "Timeout" - Poor GPS signal
- "Accuracy too low" - Indoor/obstruction

**Push:**
- "Not supported" - Old browser/device
- "Permission denied" - User rejected
- "Token registration failed" - FCM issue
- "Delivery failed" - Network/FCM down

---

## 7. DATA COLLECTION GOALS

### Minimum Samples Required

| Feature | Goal | Status |
|---------|------|--------|
| Camera uploads | 100 samples | 0/100 |
| GPS captures | 100 samples | 0/100 |
| Push notifications | 50 samples | 0/50 |

### Daily Tracking
**Record in spreadsheet:**
```
Date | Camera Success | GPS Success | Push Opens | Notes
-----|----------------|-------------|------------|------
11/7 | 0/0 (0%)       | 0/0 (0%)    | 0/0 (0%)   | Testing started
11/8 | ?/?            | ?/?         | ?/?        |
...
```

### Weekly Review
**Every Monday:**
- Export metrics from dashboard
- Calculate success rates
- Identify failure patterns
- Document issues found
- Plan fixes/optimizations

---

## 8. TESTING SCHEDULE (2 Weeks)

### Week 1: Feature Validation
**Day 1-2 (Nov 7-8):**
- [ ] Setup test devices
- [ ] Basic functionality tests
- [ ] Initial metrics collection
- [ ] Document any blockers

**Day 3-4 (Nov 9-10):**
- [ ] Android device testing
- [ ] iOS device testing
- [ ] Cross-device comparison
- [ ] First metrics review

**Day 5-7 (Nov 11-13):**
- [ ] Edge case testing
- [ ] Error scenario testing
- [ ] Real-world usage simulation
- [ ] Week 1 summary report

### Week 2: Data Collection & Analysis
**Day 8-10 (Nov 14-16):**
- [ ] Increase sample size
- [ ] Test at multiple locations
- [ ] Varied network conditions
- [ ] Monitor error rates

**Day 11-12 (Nov 17-18):**
- [ ] Final metrics collection
- [ ] Dashboard verification
- [ ] Performance benchmarking
- [ ] Compile issues list

**Day 13-14 (Nov 19-21):**
- [ ] Data analysis
- [ ] Success rate calculation
- [ ] Optimization planning
- [ ] Week 2 completion report

---

## 9. ISSUE REPORTING

### When You Find an Issue

**Report Format:**
```markdown
## Issue: [Brief Description]

**Severity:** Critical / High / Medium / Low
**Feature:** Camera / GPS / Push / UI
**Device:** [Brand Model, OS Version, Browser]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots/Logs:**
[Attach if available]

**Error Messages:**
[Copy exact error text]

**Impact:**
[How many users affected? Does it block usage?]
```

**Submit To:**
- Create GitHub Issue
- Or document in `MOBILE_TESTING_ISSUES.md`
- Tag as `bug`, `mobile`, priority level

---

## 10. SUCCESS CRITERIA

### Week 1-2 Complete When:
- [x] ≥100 camera upload samples collected
- [x] ≥100 GPS capture samples collected
- [x] ≥50 push notification samples collected
- [x] Camera success rate calculated (target ≥95%)
- [x] GPS geofence compliance calculated (target ≥95%)
- [x] Push open rate calculated (target ≥40%)
- [x] All critical issues documented
- [x] Dashboard verified with real data
- [x] Android testing complete
- [x] iOS testing complete
- [x] Performance benchmarks recorded

### Red Flags (Stop & Fix)
🚨 **Stop testing dan fix immediately jika:**
- Camera success rate <80%
- GPS never acquires location
- Push notifications not delivered
- App crashes frequently (>5% sessions)
- Data not appearing in dashboard

### Green Light (Proceed to Week 3-4)
✅ **Proceed to optimization jika:**
- All success rates ≥90% (close to target)
- <5% error rate
- Dashboard showing accurate data
- No critical bugs
- Performance acceptable

---

## 11. NEXT PHASE PREVIEW

### Week 3-4: Performance Tuning
**Based on collected data, we will:**
1. **Optimize Camera**
   - Adjust compression if needed
   - Improve upload speed
   - Fix common errors

2. **Tune GPS**
   - Refine geofence radius per site
   - Optimize acquisition timeout
   - Improve accuracy handling

3. **Enhance Push**
   - A/B test notification copy
   - Optimize delivery timing
   - Improve open rates

4. **Bundle Optimization**
   - Code splitting
   - Lazy loading
   - Reduce bundle size

---

## QUICK START

**Untuk mulai testing HARI INI:**

1. **Open app on mobile device:**
   ```
   https://natacara-hns.web.app
   ```

2. **Login dengan test account**

3. **Test Camera:**
   - Go to Dokumen → Upload foto → Track in dashboard

4. **Test GPS:**
   - Go to Attendance → Capture location → Verify geofence

5. **Test Push:**
   - Subscribe to notifications → Trigger test → Click notification

6. **Check Dashboard:**
   - View metrics update in real-time
   - Verify success rates
   - Monitor for errors

---

## SUPPORT

**Jika ada masalah saat testing:**
- Check browser console (F12) for errors
- Review Firebase Console for crashes
- Check network tab for failed requests
- Document dan report semua findings

**Contact:**
- Development Team: [Your contact]
- Firebase Console: https://console.firebase.google.com/project/natacara-hns
- GitHub Issues: [Repo URL]/issues

---

**Happy Testing! 🚀📱**

Target: Collect 100+ samples per feature dalam 2 minggu untuk data-driven optimization di Week 3-4.
