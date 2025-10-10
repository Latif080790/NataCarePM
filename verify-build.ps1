# NataCarePM Build Verification Script
# This script verifies the project structure and configuration

Write-Host "NataCarePM Build Verification" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "Project directory verified" -ForegroundColor Green

# Check key files
$requiredFiles = @(
    "package.json",
    "tsconfig.json", 
    "vite.config.ts",
    "index.html",
    "App.tsx"
)

Write-Host ""
Write-Host "Checking required files:" -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $file" -ForegroundColor Red
    }
}

# Check key directories
$requiredDirs = @(
    "components",
    "views", 
    "contexts",
    "hooks",
    "api"
)

Write-Host ""
Write-Host "Checking required directories:" -ForegroundColor Yellow
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        $fileCount = (Get-ChildItem $dir -File).Count
        Write-Host "  OK: $dir ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Magenta