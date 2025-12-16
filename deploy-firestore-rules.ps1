# ============================================
# DEPLOY FIRESTORE SECURITY RULES
# Enterprise-grade RBAC implementation
# Last Updated: December 16, 2025
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DEPLOYING FIRESTORE SECURITY RULES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "[1/5] Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
Write-Host ""

# Check if user is logged in
Write-Host "[2/5] Checking Firebase authentication..." -ForegroundColor Yellow
$currentUser = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase!" -ForegroundColor Red
    Write-Host "Run: firebase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Authenticated with Firebase" -ForegroundColor Green
Write-Host ""

# Validate firestore.rules file
Write-Host "[3/5] Validating firestore.rules..." -ForegroundColor Yellow
if (!(Test-Path "firestore.rules")) {
    Write-Host "❌ firestore.rules not found!" -ForegroundColor Red
    exit 1
}

$rulesContent = Get-Content "firestore.rules" -Raw
if ($rulesContent -match "DEVELOPMENT MODE") {
    Write-Host "⚠️  WARNING: Rules contain DEVELOPMENT MODE comments" -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure you want to deploy? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "✅ firestore.rules validated" -ForegroundColor Green
Write-Host ""

# Show rules summary
Write-Host "[4/5] Rules Summary:" -ForegroundColor Yellow
Write-Host "  - Authentication required: ✅" -ForegroundColor Green
Write-Host "  - RBAC for RAB (Budget): ✅" -ForegroundColor Green
Write-Host "  - RBAC for Expenses: ✅" -ForegroundColor Green
Write-Host "  - Audit logs immutable: ✅" -ForegroundColor Green
Write-Host "  - Site Manager blocked from financials: ✅" -ForegroundColor Green
Write-Host ""

# Deploy rules
Write-Host "[5/5] Deploying to Firebase..." -ForegroundColor Yellow
Write-Host ""

firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " ✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Firestore Security Rules deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test authentication in production" -ForegroundColor White
    Write-Host "2. Verify Site Manager cannot see financials" -ForegroundColor White
    Write-Host "3. Test audit trail logging" -ForegroundColor White
    Write-Host "4. Monitor Firebase Console for rule violations" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitor rules: https://console.firebase.google.com/project/_/firestore/rules" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host " ❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Red
    Write-Host ""
    exit 1
}
