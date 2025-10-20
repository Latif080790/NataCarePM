# ============================================================================
# Firebase Storage Rules Deployment Script
# ============================================================================
# This script helps initialize Firebase Storage and deploy security rules
# Author: NataCarePM Team
# Date: 2025-01-20
# ============================================================================

param(
    [string]$ProjectId = "natacara-hns",
    [switch]$SkipCheck,
    [switch]$Help
)

# Display help
if ($Help) {
    Write-Host ""
    Write-Host "Firebase Storage Rules Deployment Script" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-storage-rules.ps1 [-ProjectId <project-id>] [-SkipCheck] [-Help]"
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor Yellow
    Write-Host "  -ProjectId    Firebase project ID (default: natacara-hns)"
    Write-Host "  -SkipCheck    Skip initialization check and deploy directly"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\deploy-storage-rules.ps1"
    Write-Host "  .\deploy-storage-rules.ps1 -ProjectId my-project"
    Write-Host "  .\deploy-storage-rules.ps1 -SkipCheck"
    Write-Host ""
    exit 0
}

# ============================================================================
# CONFIGURATION
# ============================================================================
$ErrorActionPreference = "Stop"
$ConsoleUrl = "https://console.firebase.google.com/project/$ProjectId/storage"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor White
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] $Text" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Text)
    Write-Host "[ERROR] $Text" -ForegroundColor Red
}

function Write-WarningMsg {
    param([string]$Text)
    Write-Host "[WARNING] $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

function Write-Step {
    param([string]$Text)
    Write-Host "[STEP] $Text" -ForegroundColor Magenta
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Write-Header "Firebase Storage Rules Deployment"

# Check if Firebase CLI is installed
Write-Step "Checking Firebase CLI installation..."
try {
    $firebaseVersion = firebase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Firebase CLI is installed: $firebaseVersion"
    } else {
        throw "Firebase CLI not found"
    }
} catch {
    Write-ErrorMsg "Firebase CLI is not installed!"
    Write-Info "Install it with: npm install -g firebase-tools"
    exit 1
}

# Check if storage.rules file exists
Write-Step "Checking storage.rules file..."
if (Test-Path "storage.rules") {
    Write-Success "storage.rules file found"
} else {
    Write-ErrorMsg "storage.rules file not found!"
    Write-Info "Make sure you are running this script from the project root directory"
    exit 1
}

# Check if user wants to skip initialization check
if ($SkipCheck) {
    Write-WarningMsg "Skipping initialization check as requested"
} else {
    Write-Step "Checking if Firebase Storage is initialized..."
    
    # Try to deploy storage rules
    $deployOutput = firebase deploy --only storage --project $ProjectId 2>&1 | Out-String
    
    if ($deployOutput -match "Storage has not been set up") {
        Write-WarningMsg "Firebase Storage is NOT initialized yet!"
        Write-Host ""
        Write-Host "=============================================================" -ForegroundColor Yellow
        Write-Host "  MANUAL ACTION REQUIRED" -ForegroundColor Yellow
        Write-Host "=============================================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You need to initialize Firebase Storage first:" -ForegroundColor White
        Write-Host ""
        Write-Host "1. Open Firebase Console:" -ForegroundColor Cyan
        Write-Host "   $ConsoleUrl" -ForegroundColor Blue
        Write-Host ""
        Write-Host "2. Click the 'Get Started' button" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3. Choose your storage location:" -ForegroundColor Cyan
        Write-Host "   - Recommended: asia-southeast2 (Jakarta)" -ForegroundColor White
        Write-Host ""
        Write-Host "4. Click 'Done'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "5. Run this script again to deploy storage rules" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "=============================================================" -ForegroundColor Yellow
        Write-Host ""
        
        # Ask if user wants to open the console
        $openConsole = Read-Host "Open Firebase Console now? (y/n)"
        if ($openConsole -eq "y" -or $openConsole -eq "Y") {
            Write-Step "Opening Firebase Console..."
            Start-Process $ConsoleUrl
            Write-Success "Console opened in your default browser"
        }
        
        exit 0
    }
}

# Deploy storage rules
Write-Header "Deploying Storage Rules"

Write-Step "Deploying storage.rules to Firebase..."
try {
    firebase deploy --only storage --project $ProjectId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Storage rules deployed successfully!"
        Write-Host ""
        Write-Info "Your storage security rules are now active"
        Write-Info "File uploads will be validated according to the rules in storage.rules"
        Write-Host ""
    } else {
        throw "Deployment failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-ErrorMsg "Failed to deploy storage rules!"
    Write-Host ""
    Write-Host "Error details: $_" -ForegroundColor Red
    Write-Host ""
    Write-Info "Common issues:"
    Write-Info "1. Make sure Firebase Storage is initialized in the console"
    Write-Info "2. Check that you are logged in: firebase login"
    Write-Info "3. Verify the project ID is correct: $ProjectId"
    Write-Host ""
    exit 1
}

Write-Header "Deployment Complete"
Write-Success "All done! Your Firebase Storage is now secured."
Write-Host ""
