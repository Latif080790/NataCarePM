# Quick Reference: Firebase Storage Setup

## Problem
Firebase Storage rules cannot be deployed because storage is not initialized.

## Solution Steps

### Step 1: Run the Deployment Script
```powershell
cd c:\Users\latie\Documents\GitHub\NataCarePM
.\scripts\deploy-storage-rules.ps1
```

### Step 2: When Prompted, Initialize Storage

The script will detect storage is not initialized and show:
```
[WARNING] Firebase Storage is NOT initialized yet!

MANUAL ACTION REQUIRED

Open Firebase Console now? (y/n):
```

Type `y` and press Enter.

### Step 3: In Firebase Console

1. **Click "Get Started"** button on the Storage page
2. **Choose "Production mode"** (recommended)
3. **Select location**: `asia-southeast2 (Jakarta)`
4. **Click "Done"**

### Step 4: Re-run the Script
```powershell
.\scripts\deploy-storage-rules.ps1
```

The script will now successfully deploy the 244 lines of storage security rules!

---

## Expected Output (After Successful Deployment)

```
=============================================================
  Deploying Storage Rules
=============================================================

[STEP] Deploying storage.rules to Firebase...

i  storage: deploying storage.rules
✔  storage: deployed storage.rules

[SUCCESS] Storage rules deployed successfully!

[INFO] Your storage security rules are now active
[INFO] File uploads will be validated according to the rules in storage.rules

=============================================================
  Deployment Complete
=============================================================
[SUCCESS] All done! Your Firebase Storage is now secured.
```

---

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Deploy storage rules | `.\scripts\deploy-storage-rules.ps1` |
| Show script help | `.\scripts\deploy-storage-rules.ps1 -Help` |
| Skip init check | `.\scripts\deploy-storage-rules.ps1 -SkipCheck` |
| Open console manually | https://console.firebase.google.com/project/natacara-hns/storage |
| Verify rules | https://console.firebase.google.com/project/natacara-hns/storage/rules |

---

## Troubleshooting One-Liners

```powershell
# Check Firebase CLI version
firebase --version

# Login to Firebase
firebase login

# List your projects
firebase projects:list

# Deploy storage rules manually
firebase deploy --only storage --project natacara-hns

# Check current project
firebase use
```

---

**TIP**: After setup, you can deploy storage rules anytime by running the script!
