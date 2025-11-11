# ======================================
# DEPLOYMENT SCRIPT - Force Cache Bust
# ======================================
# This script forces browser to load fresh assets
# by adding timestamp query strings

Write-Host "`n=== NataCarePM - Force Cache Deployment ===" -ForegroundColor Cyan
Write-Host "This will force browsers to reload all assets`n" -ForegroundColor Yellow

# Get timestamp for cache busting
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
Write-Host "Build timestamp: $timestamp" -ForegroundColor Green

# Step 1: Build
Write-Host "`n[1/4] Building production bundle..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Add timestamp query string to index.html
Write-Host "`n[2/4] Adding cache-busting timestamp..." -ForegroundColor Cyan
$indexPath = "dist/index.html"
$content = Get-Content $indexPath -Raw

# Add ?v=timestamp to all JS/CSS imports
$content = $content -replace '(src|href)="(/assets/[^"]+\.(js|css))"', "`$1=`"`$2?v=$timestamp`""

Set-Content -Path $indexPath -Value $content
Write-Host "Timestamp added to all assets: ?v=$timestamp" -ForegroundColor Green

# Step 3: Deploy to Firebase Hosting
Write-Host "`n[3/4] Deploying to Firebase Hosting..." -ForegroundColor Cyan
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Instructions
Write-Host "`n[4/4] Deployment complete!" -ForegroundColor Green
Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Yellow
Write-Host "1. Open INCOGNITO window (Ctrl+Shift+N)"
Write-Host "2. Go to: https://natacara-hns.web.app?v=$timestamp"
Write-Host "3. Check Console for: '[Firebase] Initialized with v10 stable API'"
Write-Host "`nIf still not working, clear browser cache completely." -ForegroundColor Yellow
Write-Host "`n=== Deployment URL ===" -ForegroundColor Cyan
Write-Host "https://natacara-hns.web.app" -ForegroundColor Green
Write-Host ""
