# Firestore Backup Deployment Script
# Run this script to setup automated backups

$PROJECT_ID = "natacare-pm"
$BUCKET_NAME = "natacare-backups"
$REGION = "asia-southeast2"
$SERVICE_ACCOUNT = "firebase-adminsdk@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Firestore Backup Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
Write-Host "[1/8] Checking prerequisites..." -ForegroundColor Yellow
try {
    $gcloudVersion = gcloud --version 2>&1
    Write-Host "✓ gcloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "✗ gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Set active project
Write-Host ""
Write-Host "[2/8] Setting active project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Project set to $PROJECT_ID" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set project" -ForegroundColor Red
    exit 1
}

# Create storage bucket
Write-Host ""
Write-Host "[3/8] Creating storage bucket..." -ForegroundColor Yellow
$bucketExists = gsutil ls gs://$BUCKET_NAME 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Bucket already exists: gs://$BUCKET_NAME" -ForegroundColor Green
} else {
    gsutil mb -l $REGION gs://$BUCKET_NAME
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Created bucket: gs://$BUCKET_NAME" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create bucket" -ForegroundColor Red
        exit 1
    }
}

# Set lifecycle policy
Write-Host ""
Write-Host "[4/8] Setting lifecycle policy..." -ForegroundColor Yellow
gsutil lifecycle set backup-lifecycle.json gs://$BUCKET_NAME
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Lifecycle policy applied (30-day retention)" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set lifecycle policy" -ForegroundColor Red
    exit 1
}

# Set IAM permissions
Write-Host ""
Write-Host "[5/8] Configuring IAM permissions..." -ForegroundColor Yellow
gsutil iam ch "serviceAccount:$SERVICE_ACCOUNT:objectAdmin" gs://$BUCKET_NAME
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ IAM permissions configured" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set IAM permissions" -ForegroundColor Red
    exit 1
}

# Deploy Cloud Functions
Write-Host ""
Write-Host "[6/8] Deploying backup Cloud Functions..." -ForegroundColor Yellow
Push-Location functions
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

firebase deploy --only functions:scheduledFirestoreBackup,functions:incrementalBackup,functions:criticalBackup,functions:cleanupOldBackups,functions:manualBackup
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Cloud Functions deployed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to deploy Cloud Functions" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Setup Cloud Scheduler jobs
Write-Host ""
Write-Host "[7/8] Creating Cloud Scheduler jobs..." -ForegroundColor Yellow

# Daily full backup
$jobExists = gcloud scheduler jobs describe firestore-daily-backup --location=$REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  • Daily backup job already exists" -ForegroundColor Gray
} else {
    gcloud scheduler jobs create http firestore-daily-backup `
        --location=$REGION `
        --schedule="0 2 * * *" `
        --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/scheduledFirestoreBackup" `
        --http-method=POST `
        --time-zone="Asia/Jakarta" `
        --oidc-service-account-email=$SERVICE_ACCOUNT
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Daily backup job created" -ForegroundColor Green
    }
}

# Incremental backup
$jobExists = gcloud scheduler jobs describe firestore-incremental-backup --location=$REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  • Incremental backup job already exists" -ForegroundColor Gray
} else {
    gcloud scheduler jobs create http firestore-incremental-backup `
        --location=$REGION `
        --schedule="0 */6 * * *" `
        --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/incrementalBackup" `
        --http-method=POST `
        --time-zone="Asia/Jakarta" `
        --oidc-service-account-email=$SERVICE_ACCOUNT
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Incremental backup job created" -ForegroundColor Green
    }
}

# Critical backup
$jobExists = gcloud scheduler jobs describe firestore-critical-backup --location=$REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  • Critical backup job already exists" -ForegroundColor Gray
} else {
    gcloud scheduler jobs create http firestore-critical-backup `
        --location=$REGION `
        --schedule="0 * * * *" `
        --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/criticalBackup" `
        --http-method=POST `
        --time-zone="Asia/Jakarta" `
        --oidc-service-account-email=$SERVICE_ACCOUNT
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Critical backup job created" -ForegroundColor Green
    }
}

# Weekly cleanup
$jobExists = gcloud scheduler jobs describe firestore-cleanup --location=$REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  • Cleanup job already exists" -ForegroundColor Gray
} else {
    gcloud scheduler jobs create http firestore-cleanup `
        --location=$REGION `
        --schedule="0 3 * * 0" `
        --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/cleanupOldBackups" `
        --http-method=POST `
        --time-zone="Asia/Jakarta" `
        --oidc-service-account-email=$SERVICE_ACCOUNT
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Cleanup job created" -ForegroundColor Green
    }
}

# Test backup
Write-Host ""
Write-Host "[8/8] Running test backup..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
gcloud firestore export "gs://$BUCKET_NAME/firestore/test-$timestamp" --project=$PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Test backup completed successfully!" -ForegroundColor Green
    Write-Host "  Location: gs://$BUCKET_NAME/firestore/test-$timestamp" -ForegroundColor Gray
} else {
    Write-Host "✗ Test backup failed" -ForegroundColor Red
    Write-Host "Check permissions and try again" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Backup Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scheduled Backups:" -ForegroundColor Yellow
Write-Host "  • Full backup:        Daily at 02:00 UTC" -ForegroundColor Gray
Write-Host "  • Incremental:        Every 6 hours" -ForegroundColor Gray
Write-Host "  • Critical:           Every hour" -ForegroundColor Gray
Write-Host "  • Cleanup:            Weekly on Sunday" -ForegroundColor Gray
Write-Host ""
Write-Host "Storage Bucket:       gs://$BUCKET_NAME" -ForegroundColor Yellow
Write-Host "Retention Policy:     30 days" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify backup jobs: gcloud scheduler jobs list --location=$REGION" -ForegroundColor Gray
Write-Host "  2. Test manual backup: Invoke manualBackup Cloud Function" -ForegroundColor Gray
Write-Host "  3. Setup monitoring alerts in Firebase Console" -ForegroundColor Gray
Write-Host "  4. Review BACKUP_STRATEGY.md for recovery procedures" -ForegroundColor Gray
Write-Host ""
