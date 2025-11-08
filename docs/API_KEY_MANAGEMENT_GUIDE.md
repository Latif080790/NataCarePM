# API Key Management & Security Guide

## Overview

This document outlines API key management, rotation procedures, Firebase App Check implementation, and security best practices for NataCarePM.

## Executive Summary

✅ **Implemented Security Measures:**
- All API keys moved to environment variables
- Firebase App Check with reCAPTCHA v3
- Comprehensive `.env.example` template
- Automatic key sanitization in logs
- Development/Production key separation

## API Keys Inventory

### 1. Firebase Configuration Keys

| Key | Purpose | Sensitivity | Rotation Frequency |
|-----|---------|-------------|-------------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web SDK | Public (restricted by domain) | Annually or if compromised |
| `VITE_FIREBASE_AUTH_DOMAIN` | Authentication domain | Public | N/A (project setting) |
| `VITE_FIREBASE_PROJECT_ID` | Project identifier | Public | N/A (immutable) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage | Public | N/A (project setting) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging | Public | N/A (project setting) |
| `VITE_FIREBASE_APP_ID` | Firebase app identifier | Public | N/A (immutable) |

**Security Notes:**
- Firebase Web API keys are safe to include in client code
- Security is enforced by:
  - Firestore Security Rules
  - Firebase App Check
  - Domain restrictions in Firebase Console
- Keys are still kept in `.env.local` for easy rotation

### 2. reCAPTCHA (Firebase App Check)

| Key | Purpose | Sensitivity | Rotation Frequency |
|-----|---------|-------------|-------------------|
| `VITE_RECAPTCHA_SITE_KEY` | App Check verification | Public | Every 12 months |
| `VITE_APP_CHECK_DEBUG_TOKEN` | Development testing | Private (dev only) | Per developer |

**Security Notes:**
- Site key is public, secret key stays server-side
- Debug tokens only for local development
- Production uses real reCAPTCHA verification

### 3. AI & External Services

| Key | Purpose | Sensitivity | Rotation Frequency |
|-----|---------|-------------|-------------------|
| `VITE_GEMINI_API_KEY` | Google Gemini AI | **SECRET** | Every 90 days |
| `VITE_SENTRY_DSN` | Error monitoring | Public (limited by project) | Every 180 days |
| `VITE_GA4_MEASUREMENT_ID` | Analytics | Public | N/A |
| `VITE_VAPID_PUBLIC_KEY` | Push notifications | Public | Every 12 months |

**Security Notes:**
- **Gemini API Key**: Most sensitive, restrict by referrer in Google Cloud Console
- **Sentry DSN**: Public but project-scoped, sensitive data filtered
- Never log or expose these keys in error messages

### 4. Third-Party Integrations (Optional)

| Key | Purpose | Sensitivity | Rotation Frequency |
|-----|---------|-------------|-------------------|
| `ACCOUNTING_API_KEY` | Accounting software | **SECRET** | Every 90 days |
| `CRM_API_KEY` | CRM integration | **SECRET** | Every 90 days |

**Security Notes:**
- Only needed if integrations are enabled
- Store in backend environment (Cloud Functions)
- Never expose in client-side code

## Firebase App Check Implementation

### What is Firebase App Check?

Firebase App Check protects your Firebase resources (Firestore, Storage, Functions) from abuse by verifying that requests come from your authentic app.

### How It Works

```
┌─────────────┐
│   Client    │
│  (Web App)  │
└──────┬──────┘
       │
       │ 1. Request
       ▼
┌─────────────────┐
│  reCAPTCHA v3   │  2. Verify user is human
│  (Invisible)    │
└──────┬──────────┘
       │
       │ 3. Token
       ▼
┌─────────────────┐
│  App Check SDK  │  4. Generate App Check token
└──────┬──────────┘
       │
       │ 5. Request + Token
       ▼
┌─────────────────┐
│    Firebase     │  6. Verify token
│   (Firestore,   │  7. Allow/Deny request
│   Storage, etc) │
└─────────────────┘
```

### Setup Instructions

#### 1. Enable reCAPTCHA v3

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **+** to create new site
3. Configure:
   - **Label**: NataCarePM App Check
   - **reCAPTCHA type**: reCAPTCHA v3
   - **Domains**: 
     - `localhost` (for development)
     - `your-domain.com` (for production)
     - `your-app.netlify.app` (if using Netlify)
4. Click **Submit**
5. Copy the **Site Key** (public)
6. Add to `.env.local`:
   ```bash
   VITE_RECAPTCHA_SITE_KEY=6LeYourSiteKeyHere
   ```

#### 2. Enable Firebase App Check

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Build** → **App Check**
4. Click **Get Started**
5. Select your web app
6. Choose **reCAPTCHA v3** as provider
7. Enter your reCAPTCHA Site Key
8. Click **Save**

#### 3. Configure Enforcement

1. In App Check dashboard, click **APIs** tab
2. Enable enforcement for:
   - ✅ **Firestore Database** - Required
   - ✅ **Cloud Storage** - Required
   - ✅ **Cloud Functions** - Required
   - ⚠️ **Firebase Authentication** - Optional (may cause issues)

**Recommended Enforcement Settings:**
- **Metrics only** for 7 days (monitor traffic)
- **Enforced** after validating all legitimate traffic passes

#### 4. Development Setup

For local development, use debug tokens:

1. Run app in development mode
2. Check browser console for debug token:
   ```
   [App Check] Debug token: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   ```
3. Copy the token
4. In Firebase Console → App Check → Apps → Debug tokens
5. Click **Add debug token**
6. Paste token and add description (e.g., "John's Dev Machine")
7. Add to `.env.local`:
   ```bash
   VITE_APP_CHECK_DEBUG_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   ```

### Code Integration

App Check is automatically initialized in `src/index.tsx`:

```typescript
import { initAppCheck, enableAppCheckDebugMode } from '@/appCheckConfig';

// Development: Enable debug mode
if (import.meta.env.DEV) {
  enableAppCheckDebugMode();
}

// Initialize App Check
initAppCheck();
```

### Verification

To verify App Check is working:

```typescript
import { verifyAppCheckToken } from '@/appCheckConfig';

const isValid = await verifyAppCheckToken();
console.log('App Check:', isValid ? '✅ Valid' : '❌ Invalid');
```

## API Key Rotation Procedures

### Emergency Rotation (Key Compromised)

**Timeline: Immediate (within 1 hour)**

1. **Disable compromised key**
   ```bash
   # Firebase: Console → Project Settings → Service Accounts → Disable key
   # Gemini: Google Cloud Console → APIs & Services → Credentials → Delete key
   ```

2. **Generate new key**
   ```bash
   # Follow setup instructions for specific service
   ```

3. **Update environment variables**
   ```bash
   # Update .env.local immediately
   VITE_GEMINI_API_KEY=new_key_here
   ```

4. **Deploy to production**
   ```bash
   # Update production environment variables
   # Netlify: Site settings → Environment variables
   # Vercel: Project settings → Environment Variables
   
   # Trigger new deployment
   git commit -m "Emergency: Rotate API key"
   git push origin main
   ```

5. **Monitor for issues**
   - Check Sentry for errors
   - Monitor Firebase Console for auth failures
   - Verify app functionality

6. **Document incident**
   - Record when key was compromised
   - How it was discovered
   - Actions taken
   - Lessons learned

### Scheduled Rotation (Every 90 days)

**Timeline: Planned maintenance window**

1. **Generate new keys**
   - Create new Gemini API key (keep old active)
   - Create new reCAPTCHA site key
   - Create new third-party integration keys

2. **Test new keys in staging**
   ```bash
   # Update .env.staging
   VITE_GEMINI_API_KEY=new_staging_key
   
   # Deploy to staging
   npm run deploy:staging
   
   # Run integration tests
   npm run test:integration
   ```

3. **Update production**
   - Schedule deployment during low-traffic period
   - Update production environment variables
   - Deploy new version
   - Monitor for 24 hours

4. **Deactivate old keys**
   - Wait 48 hours after successful deployment
   - Disable old keys
   - Document rotation in changelog

### Rotation Checklist

```markdown
## API Key Rotation Checklist

**Service:** _________________
**Date:** _________________
**Operator:** _________________

- [ ] Backup current configuration
- [ ] Generate new API key
- [ ] Test new key in development
- [ ] Update .env.local
- [ ] Update .env.production (deployment platform)
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor for errors (24 hours)
- [ ] Disable old key (after 48 hours)
- [ ] Update documentation
- [ ] Notify team

**Notes:**
_________________________________
```

## Security Best Practices

### ✅ DO

1. **Use Environment Variables**
   ```typescript
   // ✅ GOOD
   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
   
   // ❌ BAD
   const apiKey = 'AIzaSyHardcodedKey123456';
   ```

2. **Separate Dev/Prod Keys**
   ```bash
   # .env.local (development)
   VITE_GEMINI_API_KEY=dev_key_here
   
   # .env.production (production)
   VITE_GEMINI_API_KEY=prod_key_here
   ```

3. **Restrict Keys by Referrer**
   - Google Cloud Console → Credentials → Edit API key
   - Application restrictions → HTTP referrers
   - Add: `your-domain.com/*`

4. **Monitor API Usage**
   - Set up billing alerts
   - Monitor Firebase usage dashboard
   - Check for unusual spikes

5. **Sanitize Logs**
   ```typescript
   // Already implemented in logger.enhanced.ts
   if (key === 'password' || key === 'token' || key === 'apiKey') {
     sanitized[key] = '[REDACTED]';
   }
   ```

6. **Use Firebase App Check**
   - Prevents unauthorized API access
   - Reduces abuse and costs

### ❌ DON'T

1. **Commit Secrets to Git**
   ```bash
   # ❌ NEVER DO THIS
   git add .env.local
   git commit -m "Add API keys"
   ```

2. **Expose Keys in Client Code**
   ```typescript
   // ❌ BAD
   console.log('API Key:', import.meta.env.VITE_GEMINI_API_KEY);
   ```

3. **Use Production Keys in Development**
   ```bash
   # ❌ BAD
   # .env.local
   VITE_GEMINI_API_KEY=production_key_that_costs_money
   ```

4. **Share .env Files**
   - Don't email .env.local files
   - Don't paste keys in Slack/Discord
   - Use secure password manager for team sharing

5. **Ignore Security Warnings**
   - Act immediately on Firebase security alerts
   - Review App Check metrics regularly
   - Monitor Sentry for suspicious activity

## Monitoring & Alerts

### Firebase Console

**Check Daily:**
- App Check → Metrics
  - Verification requests
  - Pass rate (should be >95%)
  - Suspicious activity

**Check Weekly:**
- Authentication → Usage
  - Sign-in attempts
  - Failed authentications
  - Account creations

**Check Monthly:**
- Firestore → Usage
  - Read/write operations
  - Cost estimates
  - Quota usage

### Google Cloud Console

**Setup Alerts:**

1. **API Usage Alerts**
   - Threshold: 80% of quota
   - Action: Email notification

2. **Cost Alerts**
   - Budget: Monthly API spend limit
   - Threshold: 50%, 90%, 100%
   - Action: Email + Slack notification

3. **Security Alerts**
   - Unusual API key usage
   - Unauthorized access attempts
   - Key compromise indicators

### Sentry Monitoring

**Filter Sensitive Data:**

```javascript
// In sentryInit.ts (already configured)
beforeSend(event) {
  if (event.request?.headers?.Authorization) {
    event.request.headers.Authorization = '[REDACTED]';
  }
  return event;
}
```

## Compliance & Audit

### Audit Log

Track all API key rotations:

```markdown
## API Key Audit Log

| Date | Service | Action | Operator | Reason |
|------|---------|--------|----------|--------|
| 2025-01-15 | Gemini API | Rotated | John Doe | Scheduled 90-day rotation |
| 2025-01-10 | reCAPTCHA | Created | Jane Smith | App Check setup |
```

### Compliance Checklist

- [ ] All API keys stored in environment variables
- [ ] .env.local added to .gitignore
- [ ] Production keys separate from development
- [ ] Firebase API keys restricted by domain
- [ ] Gemini API key restricted by HTTP referrer
- [ ] App Check enabled and enforced
- [ ] Rotation schedule documented
- [ ] Team trained on security procedures
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled

## Troubleshooting

### App Check Issues

**Problem:** "App Check token validation failed"

**Solutions:**
1. Check reCAPTCHA site key is correct
2. Verify domain is whitelisted in reCAPTCHA console
3. In development, ensure debug token is added to Firebase Console
4. Clear browser cache and cookies

**Problem:** "reCAPTCHA failed to load"

**Solutions:**
1. Check internet connection
2. Verify VITE_RECAPTCHA_SITE_KEY is set
3. Check browser console for CORS errors
4. Disable browser extensions that block Google services

### API Key Issues

**Problem:** "Invalid API key"

**Solutions:**
1. Verify key is copied correctly (no spaces/newlines)
2. Check key hasn't been disabled in Google Cloud Console
3. Ensure correct environment (.env.local vs .env.production)
4. Regenerate key and try again

**Problem:** "API quota exceeded"

**Solutions:**
1. Check usage in Google Cloud Console
2. Increase quota or upgrade billing plan
3. Implement caching to reduce API calls
4. Review code for unnecessary API requests

## Cost Estimation

### Firebase App Check

- **Free Tier**: 50,000 verifications/month
- **Paid Tier**: $0.10 per 1,000 verifications

**Example Costs (1,000 users, 10 requests/day):**
- Monthly verifications: 1,000 × 10 × 30 = 300,000
- Cost: (300,000 - 50,000) × $0.10 / 1,000 = **$25/month**

### Gemini API

- **Free Tier**: 60 requests/minute, limited quota
- **Paid Tier**: Varies by model and usage

**Example Costs (100 users, 5 AI queries/day):**
- Monthly queries: 100 × 5 × 30 = 15,000
- Cost: Depends on model, ~**$10-30/month**

### Total Estimated Costs

| Service | Monthly Cost |
|---------|-------------|
| Firebase App Check | $25 |
| Gemini API | $20 |
| Firebase (Firestore, Storage) | $50 |
| **Total** | **~$95/month** |

## References

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

**Last Updated**: Phase 2 Implementation (Task #5 Complete)
**Status**: ✅ Production Ready
**Next**: Content Security Policy (CSP) Implementation (Task #6)
