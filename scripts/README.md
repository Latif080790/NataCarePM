# Firebase Storage Rules Deployment Scripts

This directory contains automation scripts to help deploy Firebase Storage security rules.

## Quick Start

### Windows (PowerShell)

```powershell
.\scripts\deploy-storage-rules.ps1
```

### Linux/Mac (Bash)

```bash
./scripts/deploy-storage-rules.sh
```

## What This Script Does

1. **Checks Firebase CLI** - Verifies Firebase CLI is installed
2. **Validates Files** - Ensures storage.rules file exists
3. **Checks Initialization** - Detects if Firebase Storage is initialized
4. **Guides Setup** - If not initialized, provides step-by-step instructions
5. **Deploys Rules** - Automatically deploys 244 lines of security rules once initialized

## Script Options

### PowerShell Options

```powershell
# Show help
.\scripts\deploy-storage-rules.ps1 -Help

# Use different project
.\scripts\deploy-storage-rules.ps1 -ProjectId your-project-id

# Skip initialization check and deploy directly
.\scripts\deploy-storage-rules.ps1 -SkipCheck
```

### Bash Options

```bash
# Show help
./scripts/deploy-storage-rules.sh --help

# Use different project
./scripts/deploy-storage-rules.sh --project your-project-id

# Skip initialization check
./scripts/deploy-storage-rules.sh --skip-check
```

## First Time Setup

If Firebase Storage is not initialized, the script will:

1. Detect the issue
2. Display clear instructions
3. Offer to open the Firebase Console automatically
4. Wait for you to complete manual setup
5. Allow you to re-run the script after setup

### Manual Setup Steps

When prompted, you need to:

1. Open Firebase Console: https://console.firebase.google.com/project/natacara-hns/storage
2. Click the "Get Started" button
3. Choose Production mode (recommended)
4. Select storage location:
   - **Recommended**: `asia-southeast2 (Jakarta)` - Closest to Indonesia
   - Alternative: `us-central1 (Iowa)` - If you need US location
5. Click "Done"
6. Re-run the deployment script

## Troubleshooting

### Error: Firebase CLI not found

**Solution**: Install Firebase CLI globally

```bash
npm install -g firebase-tools
```

### Error: storage.rules not found

**Solution**: Make sure you're running the script from the project root directory

```bash
cd c:\Users\latie\Documents\GitHub\NataCarePM
.\scripts\deploy-storage-rules.ps1
```

### Error: Storage has not been set up

**Solution**: Follow the manual setup steps above to initialize Firebase Storage in the console

### Error: Permission denied (Linux/Mac)

**Solution**: Make the script executable

```bash
chmod +x scripts/deploy-storage-rules.sh
./scripts/deploy-storage-rules.sh
```

### Error: Deployment failed

**Solutions**:

1. Check you're logged in: `firebase login`
2. Verify project ID: `firebase projects:list`
3. Re-authenticate: `firebase login --reauth`

## What Gets Deployed

The `storage.rules` file (244 lines) includes:

### Security Features

- ✅ File type validation (images, PDFs, documents)
- ✅ Size limits (5MB - 100MB depending on file type)
- ✅ Access control (authenticated users only)
- ✅ Project member verification
- ✅ Role-based permissions

### Protected Paths

- User profile photos
- Project documents
- Daily report photos
- Incident photos and documents
- Training materials
- Purchase order attachments
- Goods receipt photos
- OCR processed documents
- And more...

## Verification

After successful deployment, verify the rules at:
https://console.firebase.google.com/project/natacara-hns/storage/rules

## Additional Resources

- **Comprehensive Guide**: See `FIREBASE_STORAGE_SETUP_GUIDE.md` in the project root
- **Firebase Documentation**: https://firebase.google.com/docs/storage/security
- **Storage Rules Reference**: https://firebase.google.com/docs/storage/security/rules-reference

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review `FIREBASE_STORAGE_SETUP_GUIDE.md`
3. Check Firebase console for error messages
4. Verify your Firebase project settings

---

**Last Updated**: 2025-01-20  
**Project**: NataCarePM (natacara-hns)
