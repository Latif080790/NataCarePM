# 🔥 Firebase Deployment Scripts for NataCarePM
# Run these commands to deploy security rules

Write-Host "🔥 Firebase Security Rules Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI installation..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install Firebase CLI, run:" -ForegroundColor Yellow
    Write-Host "npm install -g firebase-tools" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase CLI found: $($firebaseInstalled.Version)" -ForegroundColor Green
Write-Host ""

# Check if user is logged in
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
firebase login:list 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logging in to Firebase..." -ForegroundColor Yellow
    firebase login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Authenticated with Firebase" -ForegroundColor Green
Write-Host ""

# List available projects
Write-Host "Available Firebase projects:" -ForegroundColor Yellow
firebase projects:list

Write-Host ""
Write-Host "Current project:" -ForegroundColor Yellow
firebase use

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 Deployment Options:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Deploy Firestore Rules only" -ForegroundColor White
Write-Host "2. Deploy Storage Rules only" -ForegroundColor White
Write-Host "3. Deploy Both Rules (Recommended)" -ForegroundColor Green
Write-Host "4. Test Firestore Rules locally" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying Firestore Rules..." -ForegroundColor Cyan
        firebase deploy --only firestore:rules
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Firestore Rules deployed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Verifying deployment..." -ForegroundColor Yellow
            firebase firestore:rules:get
        } else {
            Write-Host "❌ Deployment failed!" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying Storage Rules..." -ForegroundColor Cyan
        firebase deploy --only storage:rules
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Storage Rules deployed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Verifying deployment..." -ForegroundColor Yellow
            firebase storage:rules:get
        } else {
            Write-Host "❌ Deployment failed!" -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "🚀 Deploying All Security Rules..." -ForegroundColor Cyan
        Write-Host ""
        
        # Deploy Firestore rules
        Write-Host "📦 Deploying Firestore Rules..." -ForegroundColor Yellow
        firebase deploy --only firestore:rules
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Firestore Rules deployed!" -ForegroundColor Green
        } else {
            Write-Host "❌ Firestore Rules deployment failed!" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        
        # Deploy Storage rules
        Write-Host "📦 Deploying Storage Rules..." -ForegroundColor Yellow
        firebase deploy --only storage:rules
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Storage Rules deployed!" -ForegroundColor Green
        } else {
            Write-Host "❌ Storage Rules deployment failed!" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ ALL SECURITY RULES DEPLOYED!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        # Verify both deployments
        Write-Host "📋 Verification:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Firestore Rules:" -ForegroundColor Yellow
        firebase firestore:rules:get
        Write-Host ""
        Write-Host "Storage Rules:" -ForegroundColor Yellow
        firebase storage:rules:get
    }
    
    "4" {
        Write-Host ""
        Write-Host "🧪 Testing Firestore Rules locally..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Note: You need to set up emulators first with:" -ForegroundColor Yellow
        Write-Host "firebase init emulators" -ForegroundColor White
        Write-Host ""
        Write-Host "Then create test files in tests/ directory" -ForegroundColor Yellow
        Write-Host ""
        firebase emulators:start --only firestore
    }
    
    "5" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "❌ Invalid option!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Test the security rules in your app" -ForegroundColor White
Write-Host "2. Verify unauthorized access is blocked" -ForegroundColor White
Write-Host "3. Check Firebase Console for rule errors" -ForegroundColor White
Write-Host "4. Monitor Firebase usage and logs" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Firebase Console:" -ForegroundColor Cyan
Write-Host "https://console.firebase.google.com" -ForegroundColor Blue
Write-Host ""
