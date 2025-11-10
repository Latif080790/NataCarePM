# Setup Cloud Storage for NataCarePM
# This script creates storage buckets and configures lifecycle rules

Write-Host "🔧 Setting up Cloud Storage for NataCarePM..." -ForegroundColor Cyan

# Check if gsutil is available
try {
    gsutil version | Out-Null
    Write-Host "✅ gsutil is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ gsutil not found. Installing Google Cloud SDK..." -ForegroundColor Red
    Write-Host "Please download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set project
$PROJECT_ID = "natacara-hns"
$REGION = "asia-southeast2"
$MAIN_BUCKET = "natacara-hns.appspot.com"
$BACKUP_BUCKET = "natacare-backups"

Write-Host "`n📦 Configuring project: $PROJECT_ID" -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

# Check if main bucket exists
Write-Host "`n🔍 Checking main storage bucket..." -ForegroundColor Cyan
$mainBucketExists = gsutil ls -b "gs://$MAIN_BUCKET" 2>$null
if ($mainBucketExists) {
    Write-Host "✅ Main bucket exists: $MAIN_BUCKET" -ForegroundColor Green
} else {
    Write-Host "⚠️  Main bucket not found. Creating..." -ForegroundColor Yellow
    gsutil mb -c STANDARD -l $REGION -p $PROJECT_ID "gs://$MAIN_BUCKET"
    Write-Host "✅ Main bucket created" -ForegroundColor Green
}

# Create backup bucket
Write-Host "`n📦 Creating backup bucket..." -ForegroundColor Cyan
$backupBucketExists = gsutil ls -b "gs://$BACKUP_BUCKET" 2>$null
if ($backupBucketExists) {
    Write-Host "✅ Backup bucket already exists: $BACKUP_BUCKET" -ForegroundColor Green
} else {
    gsutil mb -c STANDARD -l $REGION -p $PROJECT_ID "gs://$BACKUP_BUCKET"
    if ($?) {
        Write-Host "✅ Backup bucket created: $BACKUP_BUCKET" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create backup bucket" -ForegroundColor Red
        exit 1
    }
}

# Configure CORS for main bucket
Write-Host "`n🌐 Configuring CORS for main bucket..." -ForegroundColor Cyan
$corsConfig = @"
[
  {
    "origin": ["https://natacara-hns.web.app", "https://natacara-hns.firebaseapp.com", "http://localhost:3001", "http://localhost:4173"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
"@
$corsConfig | Out-File -FilePath "cors-config.json" -Encoding UTF8
gsutil cors set cors-config.json "gs://$MAIN_BUCKET"
Remove-Item "cors-config.json"
Write-Host "✅ CORS configured" -ForegroundColor Green

# Configure lifecycle rules for temp files (auto-delete after 1 day)
Write-Host "`n♻️  Configuring lifecycle rules for temp files..." -ForegroundColor Cyan
$lifecycleConfig = @"
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 1,
          "matchesPrefix": ["temp/"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 90,
          "matchesPrefix": ["backups/"]
        }
      }
    ]
  }
}
"@
$lifecycleConfig | Out-File -FilePath "lifecycle-config.json" -Encoding UTF8
gsutil lifecycle set lifecycle-config.json "gs://$MAIN_BUCKET"
Remove-Item "lifecycle-config.json"
Write-Host "✅ Lifecycle rules configured" -ForegroundColor Green

# Configure backup bucket lifecycle (retain for 365 days)
Write-Host "`n♻️  Configuring lifecycle rules for backup bucket..." -ForegroundColor Cyan
$backupLifecycleConfig = @"
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 365
        }
      }
    ]
  }
}
"@
$backupLifecycleConfig | Out-File -FilePath "backup-lifecycle-config.json" -Encoding UTF8
gsutil lifecycle set backup-lifecycle-config.json "gs://$BACKUP_BUCKET"
Remove-Item "backup-lifecycle-config.json"
Write-Host "✅ Backup lifecycle rules configured (365 days retention)" -ForegroundColor Green

# Set uniform bucket-level access
Write-Host "`n🔒 Setting uniform bucket-level access..." -ForegroundColor Cyan
gsutil uniformbucketlevelaccess set on "gs://$MAIN_BUCKET"
gsutil uniformbucketlevelaccess set on "gs://$BACKUP_BUCKET"
Write-Host "✅ Uniform access enabled" -ForegroundColor Green

# Deploy storage rules
Write-Host "`n📜 Deploying storage security rules..." -ForegroundColor Cyan
firebase deploy --only storage:rules
if ($?) {
    Write-Host "✅ Storage rules deployed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Storage rules deployment failed (bucket may need initialization)" -ForegroundColor Yellow
}

Write-Host "`n✅ Cloud Storage setup complete!" -ForegroundColor Green
Write-Host "📦 Main bucket: gs://$MAIN_BUCKET" -ForegroundColor Cyan
Write-Host "💾 Backup bucket: gs://$BACKUP_BUCKET" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Verify buckets in Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID/storage" -ForegroundColor White
Write-Host "2. Test file upload functionality in the application" -ForegroundColor White
Write-Host "3. Monitor storage usage and costs" -ForegroundColor White
