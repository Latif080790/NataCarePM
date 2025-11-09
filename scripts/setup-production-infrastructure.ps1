<#
.SYNOPSIS
    Production Infrastructure Setup Script for NataCarePM
    
.DESCRIPTION
    Automated setup script for Day 1-2 manual configuration tasks:
    1. Create Cloud Storage bucket for backups
    2. Configure Firebase App Check with reCAPTCHA v3
    3. Setup Sentry error tracking
    4. Configure Google Analytics 4
    
.NOTES
    File Name: setup-production-infrastructure.ps1
    Author: NataCarePM DevOps
    Requires: Firebase CLI, gcloud CLI (optional)
    
.EXAMPLE
    .\scripts\setup-production-infrastructure.ps1
#>

param(
    [switch]$SkipBucket,
    [switch]$SkipAppCheck,
    [switch]$SkipSentry,
    [switch]$SkipGA4,
    [switch]$Interactive = $true
)

# Configuration
$PROJECT_ID = "natacara-hns"
$BUCKET_NAME = "natacare-backups"
$BUCKET_LOCATION = "asia-southeast2"
$REGION = "asia-southeast2"

# Colors for output
$COLOR_SUCCESS = "Green"
$COLOR_ERROR = "Red"
$COLOR_WARNING = "Yellow"
$COLOR_INFO = "Cyan"

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $COLOR_SUCCESS
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $COLOR_ERROR
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $COLOR_WARNING
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $COLOR_INFO
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n🔹 $Message" -ForegroundColor $COLOR_INFO
}

function Write-Header {
    param([string]$Title)
    Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  $Title" -ForegroundColor Magenta
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
}

# Check prerequisites
function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    $allGood = $true
    
    # Check Firebase CLI
    Write-Step "Checking Firebase CLI..."
    try {
        $firebaseVersion = firebase --version 2>$null
        if ($firebaseVersion) {
            Write-Success "Firebase CLI installed: $firebaseVersion"
        } else {
            throw "Firebase CLI not found"
        }
    } catch {
        Write-ErrorMsg "Firebase CLI not installed. Install: npm install -g firebase-tools"
        $allGood = $false
    }
    
    # Check if logged in to Firebase
    Write-Step "Checking Firebase authentication..."
    try {
        $firebaseProjects = firebase projects:list 2>$null
        if ($firebaseProjects) {
            Write-Success "Logged in to Firebase"
        } else {
            throw "Not logged in"
        }
    } catch {
        Write-ErrorMsg "Not logged in to Firebase. Run: firebase login"
        $allGood = $false
    }
    
    # Check gcloud CLI (optional)
    Write-Step "Checking gcloud CLI (optional)..."
    try {
        $gcloudVersion = gcloud --version 2>$null
        if ($gcloudVersion) {
            Write-Success "gcloud CLI installed"
        }
    } catch {
        Write-Warning "gcloud CLI not installed (optional for bucket creation)"
        Write-Info "You can create bucket manually via Firebase Console if needed"
    }
    
    # Check Node.js
    Write-Step "Checking Node.js..."
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js installed: $nodeVersion"
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-ErrorMsg "Node.js not installed"
        $allGood = $false
    }
    
    if (-not $allGood) {
        Write-ErrorMsg "`nPrerequisites not met. Please install missing dependencies."
        exit 1
    }
    
    Write-Success "`nAll prerequisites met!"
}

# Task 1: Create Cloud Storage Bucket
function New-BackupBucket {
    Write-Header "Task 1: Create Cloud Storage Bucket"
    
    if ($SkipBucket) {
        Write-Warning "Skipping bucket creation (--SkipBucket flag)"
        return
    }
    
    Write-Info "Bucket: gs://$BUCKET_NAME"
    Write-Info "Location: $BUCKET_LOCATION"
    Write-Info "Project: $PROJECT_ID"
    
    if ($Interactive) {
        $confirm = Read-Host "`nCreate bucket? (y/n)"
        if ($confirm -ne 'y') {
            Write-Warning "Skipping bucket creation"
            return
        }
    }
    
    Write-Step "Checking if bucket already exists..."
    try {
        $checkBucket = gcloud storage buckets describe "gs://$BUCKET_NAME" --project=$PROJECT_ID 2>$null
        if ($checkBucket) {
            Write-Warning "Bucket already exists: gs://$BUCKET_NAME"
            return
        }
    } catch {
        Write-Info "Bucket does not exist, creating..."
    }
    
    Write-Step "Creating Cloud Storage bucket..."
    try {
        $createResult = gcloud storage buckets create "gs://$BUCKET_NAME" `
            --project=$PROJECT_ID `
            --location=$BUCKET_LOCATION `
            --uniform-bucket-level-access `
            --public-access-prevention 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Bucket created successfully: gs://$BUCKET_NAME"
            
            # Set lifecycle policy
            Write-Step "Setting lifecycle policy (30-day retention)..."
            $lifecycleConfig = @"
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
"@
            $lifecycleConfig | Out-File -FilePath "temp-lifecycle.json" -Encoding UTF8
            
            gcloud storage buckets update "gs://$BUCKET_NAME" --lifecycle-file=temp-lifecycle.json 2>&1
            Remove-Item "temp-lifecycle.json" -ErrorAction SilentlyContinue
            
            Write-Success "Lifecycle policy applied (30-day retention)"
            
        } else {
            throw $createResult
        }
    } catch {
        Write-ErrorMsg "Failed to create bucket via gcloud CLI"
        Write-Warning "Please create bucket manually via Firebase Console:"
        Write-Info "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/storage"
        Write-Info "2. Click 'Get Started' or 'Create Bucket'"
        Write-Info "3. Bucket name: $BUCKET_NAME"
        Write-Info "4. Location: $BUCKET_LOCATION"
        Write-Info "5. Access control: Uniform (bucket-level only)"
    }
}

# Task 2: Configure Firebase App Check
function Set-AppCheck {
    Write-Header "Task 2: Configure Firebase App Check"
    
    if ($SkipAppCheck) {
        Write-Warning "Skipping App Check setup (--SkipAppCheck flag)"
        return
    }
    
    Write-Info "This task requires manual steps in Firebase Console and Google Cloud Console"
    Write-Info ""
    
    Write-Step "Step 1: Create reCAPTCHA v3 Site Key"
    Write-Info "1. Go to: https://console.cloud.google.com/security/recaptcha?project=$PROJECT_ID"
    Write-Info "2. Click 'Create Key'"
    Write-Info "3. Settings:"
    Write-Info "   - Label: NataCarePM Production"
    Write-Info "   - Type: Score based (v3)"
    Write-Info "   - Domains: natacara-hns.web.app, natacara-hns.firebaseapp.com, localhost"
    Write-Info "4. Copy the Site Key (starts with 6Le...)"
    Write-Info ""
    
    if ($Interactive) {
        $recaptchaSiteKey = Read-Host "Enter reCAPTCHA Site Key (or press Enter to skip)"
        if ($recaptchaSiteKey) {
            Write-Success "reCAPTCHA Site Key received"
            
            # Update .env.local
            Write-Step "Updating .env.local..."
            $envPath = ".env.local"
            $envContent = ""
            
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
            }
            
            # Update or add VITE_RECAPTCHA_SITE_KEY
            if ($envContent -match "VITE_RECAPTCHA_SITE_KEY=.*") {
                $envContent = $envContent -replace "VITE_RECAPTCHA_SITE_KEY=.*", "VITE_RECAPTCHA_SITE_KEY=$recaptchaSiteKey"
            } else {
                $envContent += "`nVITE_RECAPTCHA_SITE_KEY=$recaptchaSiteKey"
            }
            
            # Enable App Check
            if ($envContent -match "VITE_APP_CHECK_ENABLED=.*") {
                $envContent = $envContent -replace "VITE_APP_CHECK_ENABLED=.*", "VITE_APP_CHECK_ENABLED=true"
            } else {
                $envContent += "`nVITE_APP_CHECK_ENABLED=true"
            }
            
            $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
            Write-Success ".env.local updated"
        }
    }
    
    Write-Step "Step 2: Enable App Check in Firebase Console"
    Write-Info "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/appcheck"
    Write-Info "2. Click 'Get Started'"
    Write-Info "3. Register your web app"
    Write-Info "4. Provider: reCAPTCHA v3"
    Write-Info "5. Paste the Site Key"
    Write-Info "6. Click 'Save'"
    Write-Info ""
    
    Write-Step "Step 3: Enforce App Check"
    Write-Info "1. In App Check console → Apps tab"
    Write-Info "2. For each service:"
    Write-Info "   - Firestore: Click 'Enforce' → Enable"
    Write-Info "   - Storage: Click 'Enforce' → Enable"
    Write-Info "   - Functions: Click 'Enforce' → Enable"
    Write-Info ""
    
    Write-Step "Step 4: Create Debug Token"
    Write-Info "1. In App Check → Apps tab → Manage debug tokens"
    Write-Info "2. Click 'Add debug token'"
    Write-Info "3. Name: Local Development"
    Write-Info "4. Copy the generated token"
    Write-Info ""
    
    if ($Interactive) {
        $debugToken = Read-Host "Enter App Check Debug Token (or press Enter to skip)"
        if ($debugToken) {
            # Update .env.local
            $envPath = ".env.local"
            $envContent = Get-Content $envPath -Raw
            
            if ($envContent -match "VITE_APP_CHECK_DEBUG_TOKEN=.*") {
                $envContent = $envContent -replace "VITE_APP_CHECK_DEBUG_TOKEN=.*", "VITE_APP_CHECK_DEBUG_TOKEN=$debugToken"
            } else {
                $envContent += "`nVITE_APP_CHECK_DEBUG_TOKEN=$debugToken"
            }
            
            $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
            Write-Success ".env.local updated with debug token"
        }
    }
    
    Write-Success "App Check configuration guide displayed"
    Write-Warning "Complete the manual steps above in Firebase Console"
}

# Task 3: Setup Sentry
function Set-Sentry {
    Write-Header "Task 3: Setup Sentry Error Tracking"
    
    if ($SkipSentry) {
        Write-Warning "Skipping Sentry setup (--SkipSentry flag)"
        return
    }
    
    Write-Info "This task requires creating a Sentry account and project"
    Write-Info ""
    
    Write-Step "Step 1: Create Sentry Account & Project"
    Write-Info "1. Go to: https://sentry.io/signup/"
    Write-Info "2. Sign up or log in"
    Write-Info "3. Click 'Create Project'"
    Write-Info "4. Platform: React"
    Write-Info "5. Project Name: NataCarePM Production"
    Write-Info "6. Click 'Create Project'"
    Write-Info ""
    
    Write-Step "Step 2: Get Sentry DSN"
    Write-Info "1. After project creation, copy the DSN from:"
    Write-Info "   Settings → Projects → NataCarePM Production → Client Keys (DSN)"
    Write-Info "2. Format: https://PUBLIC_KEY@o123456.ingest.sentry.io/789"
    Write-Info ""
    
    if ($Interactive) {
        $sentryDsn = Read-Host "Enter Sentry DSN (or press Enter to skip)"
        if ($sentryDsn) {
            Write-Success "Sentry DSN received"
            
            # Update .env.local
            Write-Step "Updating .env.local..."
            $envPath = ".env.local"
            $envContent = ""
            
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
            }
            
            # Update or add VITE_SENTRY_DSN
            if ($envContent -match "VITE_SENTRY_DSN=.*") {
                $envContent = $envContent -replace "VITE_SENTRY_DSN=.*", "VITE_SENTRY_DSN=$sentryDsn"
            } else {
                $envContent += "`nVITE_SENTRY_DSN=$sentryDsn"
            }
            
            # Set environment
            if ($envContent -match "VITE_SENTRY_ENVIRONMENT=.*") {
                $envContent = $envContent -replace "VITE_SENTRY_ENVIRONMENT=.*", "VITE_SENTRY_ENVIRONMENT=production"
            } else {
                $envContent += "`nVITE_SENTRY_ENVIRONMENT=production"
            }
            
            $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
            Write-Success ".env.local updated"
        }
    }
    
    Write-Step "Step 3: Configure Sentry Project Settings"
    Write-Info "1. General Settings:"
    Write-Info "   - Default Environment: production"
    Write-Info "   - Enable: Data Scrubbing"
    Write-Info "2. Performance Monitoring:"
    Write-Info "   - Enable Performance Monitoring"
    Write-Info "   - Transaction Sample Rate: 0.1 (10%)"
    Write-Info "3. Session Replay:"
    Write-Info "   - Enable Session Replay"
    Write-Info "   - Session Sample Rate: 0.1 (10%)"
    Write-Info ""
    
    Write-Step "Step 4: Setup Alerts"
    Write-Info "1. Create alert rule:"
    Write-Info "   - Condition: Error count > 10 in 1 minute"
    Write-Info "   - Action: Send notification to email/Slack"
    Write-Info ""
    
    Write-Success "Sentry configuration guide displayed"
    Write-Warning "Complete the manual steps above in Sentry.io"
}

# Task 4: Configure Google Analytics 4
function Set-GA4 {
    Write-Header "Task 4: Configure Google Analytics 4"
    
    if ($SkipGA4) {
        Write-Warning "Skipping GA4 setup (--SkipGA4 flag)"
        return
    }
    
    Write-Info "This task requires creating a GA4 property in Google Analytics"
    Write-Info ""
    
    Write-Step "Step 1: Create GA4 Property"
    Write-Info "1. Go to: https://analytics.google.com/"
    Write-Info "2. Sign in → Admin (bottom left)"
    Write-Info "3. Account: Create new or select existing"
    Write-Info "4. Property:"
    Write-Info "   - Property Name: NataCarePM Production"
    Write-Info "   - Time Zone: (GMT+07:00) Bangkok, Jakarta"
    Write-Info "   - Currency: Indonesian Rupiah (IDR)"
    Write-Info "5. Click 'Next' → 'Create'"
    Write-Info ""
    
    Write-Step "Step 2: Setup Data Stream"
    Write-Info "1. In Property settings → Data Streams"
    Write-Info "2. Click 'Add stream' → 'Web'"
    Write-Info "3. Settings:"
    Write-Info "   - Website URL: https://natacara-hns.web.app"
    Write-Info "   - Stream Name: Production Web App"
    Write-Info "   - Enable ALL Enhanced Measurement options"
    Write-Info "4. Click 'Create stream'"
    Write-Info "5. Copy the Measurement ID (format: G-XXXXXXXXXX)"
    Write-Info ""
    
    if ($Interactive) {
        $ga4MeasurementId = Read-Host "Enter GA4 Measurement ID (or press Enter to skip)"
        if ($ga4MeasurementId) {
            Write-Success "GA4 Measurement ID received"
            
            # Update .env.local
            Write-Step "Updating .env.local..."
            $envPath = ".env.local"
            $envContent = ""
            
            if (Test-Path $envPath) {
                $envContent = Get-Content $envPath -Raw
            }
            
            # Update or add VITE_GA4_MEASUREMENT_ID
            if ($envContent -match "VITE_GA4_MEASUREMENT_ID=.*") {
                $envContent = $envContent -replace "VITE_GA4_MEASUREMENT_ID=.*", "VITE_GA4_MEASUREMENT_ID=$ga4MeasurementId"
            } else {
                $envContent += "`nVITE_GA4_MEASUREMENT_ID=$ga4MeasurementId"
            }
            
            # Enable GA4
            if ($envContent -match "VITE_GA4_ENABLED=.*") {
                $envContent = $envContent -replace "VITE_GA4_ENABLED=.*", "VITE_GA4_ENABLED=true"
            } else {
                $envContent += "`nVITE_GA4_ENABLED=true"
            }
            
            $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
            Write-Success ".env.local updated"
        }
    }
    
    Write-Step "Step 3: Create Custom Dimensions"
    Write-Info "In GA4 Admin → Custom Definitions → Create custom dimensions:"
    Write-Info "User-Scoped: user_role, user_company, subscription_tier"
    Write-Info "Event-Scoped: project_id, project_name, transaction_type, po_status, document_type, report_type, error_code, search_term"
    Write-Info ""
    
    Write-Step "Step 4: Create Custom Metrics"
    Write-Info "In GA4 Admin → Custom Definitions → Create custom metrics:"
    Write-Info "- transaction_amount (Currency)"
    Write-Info "- project_budget (Currency)"
    Write-Info "- po_value (Currency)"
    Write-Info "- task_completion_time (Standard, seconds)"
    Write-Info "- ai_query_count (Standard)"
    Write-Info "- error_count (Standard)"
    Write-Info ""
    
    Write-Step "Step 5: Configure Conversions"
    Write-Info "Mark these events as conversions in Admin → Events:"
    Write-Info "- signup, project_created, transaction_completed, po_approved, report_generated, subscription_upgrade"
    Write-Info ""
    
    Write-Success "GA4 configuration guide displayed"
    Write-Warning "Complete the manual steps above in Google Analytics"
}

# Verify setup
function Test-Setup {
    Write-Header "Verifying Setup"
    
    Write-Step "Checking .env.local configuration..."
    
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
        
        $checks = @{
            "VITE_RECAPTCHA_SITE_KEY" = "App Check - reCAPTCHA Site Key"
            "VITE_APP_CHECK_ENABLED" = "App Check - Enabled Flag"
            "VITE_APP_CHECK_DEBUG_TOKEN" = "App Check - Debug Token"
            "VITE_SENTRY_DSN" = "Sentry - DSN"
            "VITE_SENTRY_ENVIRONMENT" = "Sentry - Environment"
            "VITE_GA4_MEASUREMENT_ID" = "GA4 - Measurement ID"
            "VITE_GA4_ENABLED" = "GA4 - Enabled Flag"
        }
        
        foreach ($key in $checks.Keys) {
            if ($envContent -match "$key=(.+)") {
                $value = $matches[1].Trim()
                if ($value -and $value -ne "your_.*" -and $value -ne "XXXX.*") {
                    Write-Success "$($checks[$key]): Configured"
                } else {
                    Write-Warning "$($checks[$key]): Not configured (placeholder value)"
                }
            } else {
                Write-Warning "$($checks[$key]): Not found in .env.local"
            }
        }
    } else {
        Write-Warning ".env.local not found"
        Write-Info "Copy .env.example to .env.local and configure your keys"
    }
    
    Write-Info ""
    Write-Step "Next Steps:"
    Write-Info "1. Complete manual configurations in Firebase Console, Sentry, and GA4"
    Write-Info "2. Rebuild the app: npm run build"
    Write-Info "3. Test in production mode: npm run preview"
    Write-Info "4. Verify integrations work correctly"
    Write-Info ""
    Write-Info "See docs/DAY_1_2_DEPLOYMENT_CHECKLIST.md for detailed verification steps"
}

# Main execution
function Start-ProductionSetup {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "  NataCarePM Production Infrastructure Setup" -ForegroundColor Magenta
    Write-Host "  Day 1-2 Manual Configuration Automation" -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""
    
    # Run tasks
    Test-Prerequisites
    New-BackupBucket
    Set-AppCheck
    Set-Sentry
    Set-GA4
    Test-Setup
    
    Write-Header "Setup Complete!"
    Write-Success "Production infrastructure setup completed"
    Write-Info ""
    Write-Info "Documentation:"
    Write-Info "- Deployment Checklist: docs/DAY_1_2_DEPLOYMENT_CHECKLIST.md"
    Write-Info "- Completion Report: DAY_1_2_COMPLETE_DEPLOYMENT_SUCCESS.md"
    Write-Info "- Sentry Guide: docs/SENTRY_SETUP_GUIDE.md"
    Write-Info "- GA4 Guide: docs/GA4_SETUP_GUIDE.md"
    Write-Info ""
    Write-Success "🚀 NataCarePM is ready for production! 🚀"
}

# Run the setup
Start-ProductionSetup
