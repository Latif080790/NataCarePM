# Sentry Setup - Quick Start Guide

## Step 1: Create Sentry Account (5 minutes)

1. **Go to Sentry**: https://sentry.io/signup/
2. **Sign up** with:
   - GitHub account (recommended) OR
   - Email/password
3. **Verify email** if using email signup

## Step 2: Create Project (3 minutes)

1. After login, click **"Create Project"**
2. **Select Platform**: `React`
3. **Project Settings**:
   - **Alert Frequency**: Alert me on every new issue
   - **Project Name**: `NataCarePM Production`
4. Click **"Create Project"**

## Step 3: Get DSN (1 minute)

After project creation, you'll see setup instructions with your DSN.

**Alternative way to find DSN**:
1. Go to **Settings** → **Projects**
2. Click **"NataCarePM Production"**
3. Go to **Client Keys (DSN)**
4. **Copy the DSN** (format: `https://xxxxxx@oxxxxxx.ingest.sentry.io/xxxxxx`)

## Step 4: Update .env.local (1 minute)

Open `.env.local` and update:

```bash
# Replace this line:
VITE_SENTRY_DSN=your_sentry_dsn_here

# With your actual DSN:
VITE_SENTRY_DSN=https://YOUR_PUBLIC_KEY@oYOUR_ORG.ingest.sentry.io/YOUR_PROJECT
```

**Example**:
```bash
VITE_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012
```

## Step 5: Configure Sentry Project (Optional - 10 minutes)

### General Settings
1. Go to **Settings** → **General**
2. **Default Environment**: `production`
3. **Enable**: Data Scrubbing (automatically enabled)

### Performance Monitoring
1. Go to **Settings** → **Performance**
2. **Enable Performance Monitoring**: ON
3. **Transaction Sample Rate**: `0.1` (10%)

### Session Replay
1. Go to **Settings** → **Session Replay**
2. **Enable Session Replay**: ON
3. **Session Sample Rate**: `0.1` (10%)
4. **Error Sample Rate**: `1.0` (100%)

### Alerts (Recommended)
1. Go to **Alerts** → **Create Alert**
2. **Alert Name**: "High Error Rate"
3. **Conditions**:
   - Metric: Error count
   - Threshold: Greater than `10`
   - Time period: `1 minute`
4. **Actions**:
   - Send notification to: Your email
5. **Save**

## Step 6: Test Sentry Integration

After updating `.env.local`:

1. **Rebuild the app**:
   ```bash
   npm run build
   ```

2. **Run in production mode**:
   ```bash
   npm run preview
   ```

3. **Open browser console** and check for:
   ```
   [Sentry] Initialized successfully
   ```

4. **Test error capture**:
   - Open browser console
   - Type: `Sentry.captureMessage('Test error from NataCarePM');`
   - Press Enter

5. **Verify in Sentry Dashboard**:
   - Go to https://sentry.io/organizations/YOUR_ORG/issues/
   - You should see the test message appear!

## Step 7: Optional - Source Maps Upload

For better error stack traces, configure source maps upload:

1. **Get Sentry Auth Token**:
   - Go to https://sentry.io/settings/account/api/auth-tokens/
   - Click "Create New Token"
   - Scopes: `project:releases`, `project:write`
   - Copy the token

2. **Update package.json**:
   ```json
   "scripts": {
     "build": "tsc && vite build --sourcemap",
     "sentry:sourcemaps": "sentry-cli sourcemaps upload --org YOUR_ORG --project natacarepm-production ./dist"
   }
   ```

3. **Set environment variable**:
   ```bash
   SENTRY_AUTH_TOKEN=your_auth_token_here
   ```

---

## Quick Reference

### Your Sentry URLs
- **Dashboard**: https://sentry.io/organizations/YOUR_ORG/issues/
- **Performance**: https://sentry.io/organizations/YOUR_ORG/performance/
- **Settings**: https://sentry.io/settings/YOUR_ORG/projects/natacarepm-production/

### Environment Variables Needed
```bash
VITE_SENTRY_DSN=https://PUBLIC_KEY@oORG_ID.ingest.sentry.io/PROJECT_ID
VITE_SENTRY_ENVIRONMENT=production
```

### Testing Commands
```bash
# Test in browser console
Sentry.captureMessage('Test message');
Sentry.captureException(new Error('Test error'));

# Check initialization
console.log(Sentry.getCurrentHub().getClient());
```

---

## Troubleshooting

### "Sentry not initialized"
- Check VITE_SENTRY_DSN is set correctly in .env.local
- Rebuild the app: `npm run build`
- Clear browser cache

### "DSN not found"
- Go to Sentry → Settings → Projects → Client Keys (DSN)
- Make sure you copied the full URL including `https://`

### "Errors not appearing in Sentry"
- Check internet connection
- Verify DSN is correct
- Check browser console for Sentry errors
- Wait 1-2 minutes for events to appear

---

**Total Setup Time**: ~10-15 minutes  
**Result**: Real-time error tracking for production! 🎉
