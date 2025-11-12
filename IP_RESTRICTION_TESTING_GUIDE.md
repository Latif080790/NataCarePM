# 🧪 IP Restriction Testing Guide

## Quick Start

1. **Access Test Page:**
   - Navigate to: http://localhost:3001/security/ip-restriction-test
   - Or add link to sidebar (optional)

2. **View Your Current IP:**
   - Page will automatically detect your IP on load
   - Shows geo-location info (country, city, ISP, timezone)

---

## Test Scenarios

### ✅ Test 1: Normal Access (Default Allow)

**Steps:**
1. Open test page
2. Click "✅ Test Access" button
3. **Expected Result:**
   - ✅ ALLOWED
   - Reason: "No restrictions apply" or "Access from [Country] is allowed"
   - Action: "allow"

**Why:** By default, IP restrictions are disabled in development mode.

---

### 🔓 Test 2: Enable IP Restrictions

**Steps:**
1. Open `src/config/security.ts`
2. Find line: `enabled: import.meta.env.VITE_IP_RESTRICTION_ENABLED === 'true' || false,`
3. Change to: `enabled: true,` (force enable)
4. Save file
5. Refresh test page
6. Click "✅ Test Access"

**Expected Result:**
- ✅ ALLOWED (still allowed because localhost is whitelisted by default)
- Reason: "IP is whitelisted"
- Action: "whitelist"

---

### ⚪ Test 3: Whitelist Override

**Steps:**
1. Ensure IP restrictions enabled (Test 2)
2. Click "➕ Add to Blacklist" (add your IP to blacklist)
3. Click "✅ Test Access"
4. **Expected Result:** Still ✅ ALLOWED (whitelist overrides blacklist)
5. Click "➕ Add to Whitelist" (add your IP to whitelist)
6. Click "✅ Test Access"
7. **Expected Result:** ✅ ALLOWED with "IP is whitelisted"

---

### ❌ Test 4: Blacklist Block

**Steps:**
1. Click "Remove from Whitelist" button
2. Your IP should still be in blacklist from Test 3
3. Click "✅ Test Access"

**Expected Result:**
- ❌ BLOCKED
- Reason: "IP is blacklisted"
- Action: "blacklist"

**What Happens:**
- Access denied
- Logged to Firestore `blockedIPs` collection
- If you try 5+ times, auto-blacklisted

**To Reset:**
- Click "Remove from Blacklist"
- Click "✅ Test Access" → Should be ✅ ALLOWED again

---

### 🌍 Test 5: Geo-Location Restrictions

**Enable Geo-Restrictions:**
1. Open `src/config/security.ts`
2. Find: `enabled: import.meta.env.VITE_GEO_RESTRICTION_ENABLED === 'true' || false,`
3. Change to: `enabled: true,`
4. Save file

**Test A: Your Country is Allowed**
1. Check your country code in geo info panel (e.g., "ID" for Indonesia)
2. Verify it's in `allowedCountries` array in `security.ts`
3. Click "✅ Test Access"
4. **Expected:** ✅ ALLOWED with "Access from [Country] is allowed"

**Test B: Block Your Country**
1. Open `src/config/security.ts`
2. Find `allowedCountries` array
3. Remove your country code (e.g., remove 'ID')
4. Save file
5. Refresh test page
6. Click "✅ Test Access"

**Expected Result:**
- ❌ BLOCKED
- Reason: "Access from [Country] is not allowed"
- Action: "block"
- Logged to Firestore

**To Reset:**
- Add your country code back to `allowedCountries`
- Refresh page
- Should be ✅ ALLOWED again

---

### 🚨 Test 6: Auto-Blacklist (Suspicious Activity)

**Setup:**
1. Remove your IP from whitelist
2. Add a fake blocked country to `blockedCountries` (to trigger blocks)

**Steps:**
1. Disable whitelist protection (remove your IP from whitelist)
2. Manually trigger 5+ blocked attempts:
   - Method A: Add/remove from blacklist and test 6 times
   - Method B: Block your country and test 6 times
3. Check browser console for: "🚨 Auto-blacklisting [IP]"
4. Check Firestore `blockedIPs` collection for logs

**Expected:**
- After 5 blocks in 5 minutes: Auto-blacklisted
- Security event logged
- Subsequent tests: ❌ BLOCKED with "IP is blacklisted"

**To Reset:**
- Click "Remove from Blacklist"
- Or wait 5 minutes for window to expire

---

### 🔍 Test 7: Test Custom IP

**Steps:**
1. In "Test Custom IP" card, enter: `8.8.8.8` (Google DNS, USA)
2. Click "Test IP"

**Expected Result:**
- Shows geo info for 8.8.8.8
- Country: United States (US)
- If US is in `allowedCountries`: ✅ ALLOWED
- If US is in `blockedCountries`: ❌ BLOCKED

**Other IPs to Test:**
- `1.1.1.1` - Cloudflare (Australia)
- `114.114.114.114` - China DNS
- `203.0.113.1` - Reserved (documentation use)

---

### 📊 Test 8: View Blocked IP Logs

**Steps:**
1. Trigger some blocked attempts (Tests 4, 5, or 6)
2. Click "📋 Load Logs" button
3. **Expected:** Table shows recent blocked IPs with:
   - IP address
   - Block reason
   - Country
   - Timestamp

**Note:** Logs are stored in Firestore `blockedIPs` collection.

---

## Troubleshooting

### Problem: "IP: unknown"
**Solution:**
- Check internet connection
- IP detection services might be blocked by firewall
- Try VPN or different network

### Problem: Geo-location not loading
**Solution:**
- Check browser console for errors
- ip-api.com might be rate-limited (45 req/min free tier)
- Wait 1 minute and try again
- Cache expires after 60 minutes

### Problem: Changes not taking effect
**Solution:**
- Clear Vite cache: Delete `node_modules/.vite`
- Hard refresh browser: Ctrl+Shift+R
- Restart dev server: `npm run dev`

### Problem: Not being blacklisted after 5 attempts
**Solution:**
- Check Firestore `blockedIPs` collection exists
- Check Firestore rules allow writes to `blockedIPs`
- Check browser console for errors
- Firestore query might need index (create via console)

---

## Firestore Setup

### Required Collection:
```
blockedIPs/
  - ip: string
  - reason: string
  - timestamp: Timestamp
  - userAgent: string
  - url: string
  - geoInfo?: object
```

### Required Index:
```javascript
Collection: blockedIPs
Fields:
  - ip (Ascending)
  - timestamp (Descending)
```

**Create Index:**
1. Go to Firebase Console → Firestore
2. Click "Indexes" tab
3. Click "Create Index"
4. Collection: `blockedIPs`
5. Add field: `ip` (Ascending)
6. Add field: `timestamp` (Descending)
7. Click "Create"

---

## Quick Reference

### Default Configuration (Dev Mode):
- ✅ IP Restrictions: **Disabled**
- ✅ Geo-Restrictions: **Disabled**
- ✅ Whitelist: localhost, 127.0.0.1, ::1
- ✅ Allowed Countries: ID, SG, MY, TH, PH, VN, US, GB, AU
- ✅ Max Login Attempts: 10
- ✅ Rate Limit: 120 req/min

### Production Mode:
- ✅ IP Restrictions: **Enabled**
- ✅ Geo-Restrictions: **Enabled**
- ✅ Max Login Attempts: 3
- ✅ Lockout: 30 minutes
- ✅ Rate Limit: 60 req/min

---

## Next Steps After Testing

1. **Fix React Hooks Error** (from Day 2)
   - Re-enable JWT implementation
   - Fix "Invalid hook call" issues

2. **Proceed to Day 4**: Audit Trail Enhancement
   - Enhanced logging with change tracking
   - Audit log UI improvements
   - Export functionality

3. **Production Checklist:**
   - Add your office/home IP to whitelist
   - Configure allowed countries for your users
   - Set up Firestore indexes
   - Test auto-blacklist in production
   - Configure admin notifications

---

**Last Updated:** November 12, 2025  
**Status:** Ready for Testing ✅
