# Production Infrastructure Setup Scripts

Automated scripts untuk Day 1-2 manual configuration tasks.

## Scripts Available

### 1. PowerShell Script (Windows)
```powershell
.\scripts\setup-production-infrastructure.ps1
```

**Features:**
- ✅ Create Cloud Storage bucket for backups
- ✅ Configure Firebase App Check with reCAPTCHA v3
- ✅ Setup Sentry error tracking
- ✅ Configure Google Analytics 4
- ✅ Interactive prompts for API keys
- ✅ Automatic .env.local updates

**Options:**
```powershell
# Skip specific tasks
.\scripts\setup-production-infrastructure.ps1 -SkipBucket
.\scripts\setup-production-infrastructure.ps1 -SkipAppCheck
.\scripts\setup-production-infrastructure.ps1 -SkipSentry
.\scripts\setup-production-infrastructure.ps1 -SkipGA4

# Run without interactive prompts
.\scripts\setup-production-infrastructure.ps1 -Interactive:$false
```

### 2. Node.js Script (Cross-platform)
```bash
node scripts/setup-production-infrastructure.mjs
```

**Features:**
- ✅ Same functionality as PowerShell script
- ✅ Works on Windows, macOS, Linux
- ✅ Color-coded console output
- ✅ Interactive mode with prompts

**Options:**
```bash
# Skip specific tasks
node scripts/setup-production-infrastructure.mjs --skip-bucket
node scripts/setup-production-infrastructure.mjs --skip-appcheck
node scripts/setup-production-infrastructure.mjs --skip-sentry
node scripts/setup-production-infrastructure.mjs --skip-ga4

# Run without interactive prompts
node scripts/setup-production-infrastructure.mjs --non-interactive
```

## Prerequisites

Before running the scripts, ensure you have:

1. **Firebase CLI** installed and logged in:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **gcloud CLI** (optional, for bucket creation):
   - Download: https://cloud.google.com/sdk/docs/install
   - Login: `gcloud auth login`
   - Set project: `gcloud config set project natacara-hns`

3. **Node.js** v18 or higher

## What the Scripts Do

### Task 1: Create Cloud Storage Bucket ✅
- Creates `natacare-backups` bucket in `asia-southeast2`
- Sets uniform bucket-level access
- Applies 30-day retention lifecycle policy
- Configures public access prevention

**Automatic via gcloud CLI** or **Manual fallback** with console instructions.

### Task 2: Firebase App Check ⚠️ Manual Steps
The script guides you through:
1. Creating reCAPTCHA v3 site key in Google Cloud Console
2. Enabling App Check in Firebase Console
3. Enforcing App Check for Firestore, Storage, Functions
4. Creating debug token for development
5. Updating `.env.local` with keys

**Interactive prompts** collect your keys and update environment variables automatically.

### Task 3: Sentry Setup ⚠️ Manual Steps
The script guides you through:
1. Creating Sentry account and project
2. Getting Sentry DSN
3. Configuring project settings (data scrubbing, performance, replay)
4. Setting up alerts
5. Updating `.env.local` with DSN

**Interactive prompts** collect your DSN and update environment variables.

### Task 4: Google Analytics 4 ⚠️ Manual Steps
The script guides you through:
1. Creating GA4 property and data stream
2. Getting Measurement ID
3. Creating custom dimensions (11 total)
4. Creating custom metrics (6 total)
5. Configuring conversions (6 events)
6. Updating `.env.local` with Measurement ID

**Interactive prompts** collect your Measurement ID and update environment variables.

## Usage Examples

### Full Setup (Interactive)
```bash
# PowerShell
.\scripts\setup-production-infrastructure.ps1

# Node.js
node scripts/setup-production-infrastructure.mjs
```

This will:
1. Check prerequisites
2. Create Cloud Storage bucket (if gcloud available)
3. Display step-by-step instructions for App Check
4. Prompt for reCAPTCHA Site Key and update .env.local
5. Display step-by-step instructions for Sentry
6. Prompt for Sentry DSN and update .env.local
7. Display step-by-step instructions for GA4
8. Prompt for GA4 Measurement ID and update .env.local
9. Verify .env.local configuration
10. Display next steps

### Bucket Creation Only
```bash
# PowerShell
.\scripts\setup-production-infrastructure.ps1 -SkipAppCheck -SkipSentry -SkipGA4

# Node.js
node scripts/setup-production-infrastructure.mjs --skip-appcheck --skip-sentry --skip-ga4
```

### App Check Configuration Only
```bash
# PowerShell
.\scripts\setup-production-infrastructure.ps1 -SkipBucket -SkipSentry -SkipGA4

# Node.js
node scripts/setup-production-infrastructure.mjs --skip-bucket --skip-sentry --skip-ga4
```

### Non-Interactive Mode
```bash
# PowerShell
.\scripts\setup-production-infrastructure.ps1 -Interactive:$false

# Node.js
node scripts/setup-production-infrastructure.mjs --non-interactive
```

Displays all instructions without prompts. Useful for:
- CI/CD pipelines
- Documentation generation
- Quick reference

## Environment Variables Updated

The scripts automatically update `.env.local` with:

```bash
# App Check
VITE_RECAPTCHA_SITE_KEY=6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_APP_CHECK_ENABLED=true
VITE_APP_CHECK_DEBUG_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX

# Sentry
VITE_SENTRY_DSN=https://PUBLIC_KEY@o123456.ingest.sentry.io/789
VITE_SENTRY_ENVIRONMENT=production

# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_ENABLED=true
```

## Manual Steps Required

Even with the scripts, you still need to:

### App Check
1. ✅ Create reCAPTCHA v3 key (script provides link)
2. ✅ Enable App Check in Firebase Console (script provides link)
3. ✅ Enforce App Check for services (script provides instructions)
4. ✅ Create debug token (script provides link)

### Sentry
1. ✅ Create Sentry account (script provides link)
2. ✅ Create project (script provides instructions)
3. ✅ Get DSN (script provides location)
4. ✅ Configure settings (script provides checklist)

### GA4
1. ✅ Create GA4 property (script provides link)
2. ✅ Setup data stream (script provides instructions)
3. ✅ Get Measurement ID (script provides format)
4. ✅ Create custom dimensions/metrics (script provides list)
5. ✅ Configure conversions (script provides events)

## Verification

After running the scripts, verify your setup:

```bash
# Check .env.local
cat .env.local | grep -E "VITE_(RECAPTCHA|APP_CHECK|SENTRY|GA4)"

# Build the app
npm run build

# Test in production mode
npm run preview
```

**Expected results:**
- ✅ No build errors
- ✅ Console shows: `[App Check] Initialized successfully`
- ✅ Console shows: `[Sentry] Initialized`
- ✅ Console shows: `[GA4] Tracking initialized`
- ✅ Network tab shows `X-Firebase-AppCheck` header

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
firebase login
```

### "Not logged in to Firebase"
```bash
firebase login
firebase projects:list
```

### "gcloud CLI not found"
- Install from: https://cloud.google.com/sdk/docs/install
- Or create bucket manually via Firebase Console

### "Bucket creation failed"
Manual creation:
1. Go to https://console.firebase.google.com/project/natacara-hns/storage
2. Click "Get Started" or "Create Bucket"
3. Name: `natacare-backups`
4. Location: `asia-southeast2`
5. Access: Uniform

### ".env.local not updated"
- Check file permissions
- Ensure `.env.local` exists (copy from `.env.example`)
- Run script with appropriate permissions

## Documentation

For detailed manual configuration steps, see:

- **Deployment Checklist**: `docs/DAY_1_2_DEPLOYMENT_CHECKLIST.md`
- **Completion Report**: `DAY_1_2_COMPLETE_DEPLOYMENT_SUCCESS.md`
- **Sentry Guide**: `docs/SENTRY_SETUP_GUIDE.md`
- **GA4 Guide**: `docs/GA4_SETUP_GUIDE.md`
- **General Deployment**: `docs/DEPLOYMENT_GUIDE.md`

## Cost Estimation

Running these scripts will result in:

| Service | Cost/Month |
|---------|-----------|
| Cloud Storage (63 GB backups) | ~$1.26 |
| Firestore Export Operations | ~$0.87 |
| Cloud Functions Invocations | ~$0.01 |
| Firebase App Check | Free |
| reCAPTCHA v3 (1M assessments) | Free |
| Sentry (5K events) | Free tier |
| Google Analytics 4 | Free |
| **TOTAL** | **~$2.14/month** |

## Support

If you encounter issues:

1. Check prerequisites
2. Review error messages
3. Consult documentation links above
4. Open GitHub issue with error logs

---

**Last Updated**: November 9, 2025  
**NataCarePM Production Infrastructure Setup**
