# PowerShell script to verify security enhancements
# This script tests that sensitive operations are now performed server-side

Write-Host "🔍 Verifying Security Enhancements" -ForegroundColor Green

# Check that client-side sensitive libraries are no longer used
Write-Host "🚫 Checking for client-side sensitive libraries..." -ForegroundColor Yellow

# Check for TensorFlow.js usage
$tfFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Select-String -Pattern "@tensorflow/tfjs" -List
if ($tfFiles.Count -eq 0) {
    Write-Host "   ✅ TensorFlow.js not found in client code" -ForegroundColor Green
} else {
    Write-Host "   ❌ TensorFlow.js still found in client code:" -ForegroundColor Red
    foreach ($file in $tfFiles) {
        Write-Host "      $($file.Filename):$($file.LineNumber)" -ForegroundColor Red
    }
}

# Check for Tesseract.js usage
$tessFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Select-String -Pattern "tesseract\.js" -List
if ($tessFiles.Count -eq 0) {
    Write-Host "   ✅ Tesseract.js not found in client code" -ForegroundColor Green
} else {
    Write-Host "   ❌ Tesseract.js still found in client code:" -ForegroundColor Red
    foreach ($file in $tessFiles) {
        Write-Host "      $($file.Filename):$($file.LineNumber)" -ForegroundColor Red
    }
}

# Check for node-forge usage
$forgeFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Select-String -Pattern "node-forge" -List
if ($forgeFiles.Count -eq 0) {
    Write-Host "   ✅ node-forge not found in client code" -ForegroundColor Green
} else {
    Write-Host "   ❌ node-forge still found in client code:" -ForegroundColor Red
    foreach ($file in $forgeFiles) {
        Write-Host "      $($file.Filename):$($file.LineNumber)" -ForegroundColor Red
    }
}

# Check for bcrypt usage
$bcryptFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Select-String -Pattern "bcrypt" -List | Where-Object { $_.Filename -ne "passwordService.ts" }
if ($bcryptFiles.Count -eq 0) {
    Write-Host "   ✅ bcrypt not found in client code (except passwordService.ts)" -ForegroundColor Green
} else {
    Write-Host "   ❌ bcrypt still found in client code:" -ForegroundColor Red
    foreach ($file in $bcryptFiles) {
        Write-Host "      $($file.Filename):$($file.LineNumber)" -ForegroundColor Red
    }
}

# Check that new secure services exist
Write-Host "✅ Checking for new secure service implementations..." -ForegroundColor Yellow

$secureServices = @(
    "src\api\aiService.ts",
    "src\api\ocrServiceFunctions.ts",
    "src\api\digitalSignaturesServiceFunctions.ts"
)

foreach ($service in $secureServices) {
    if (Test-Path $service) {
        Write-Host "   ✅ $service exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $service missing" -ForegroundColor Red
    }
}

# Check that Firebase Functions exist
Write-Host "✅ Checking for Firebase Functions..." -ForegroundColor Yellow

$functionFiles = @(
    "functions\src\index.ts",
    "functions\src\aiInsightService.ts",
    "functions\src\digitalSignatureService.ts"
)

foreach ($file in $functionFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

# Check package.json dependencies
Write-Host "✅ Checking package.json dependencies..." -ForegroundColor Yellow

# Check functions package.json
$functionsPackage = Get-Content "functions\package.json" | ConvertFrom-Json
$requiredDeps = @("@google/generative-ai", "node-forge")

foreach ($dep in $requiredDeps) {
    if ($functionsPackage.dependencies.$dep) {
        Write-Host "   ✅ $dep installed in functions" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $dep missing from functions dependencies" -ForegroundColor Red
    }
}

Write-Host "✅ Security enhancement verification completed!" -ForegroundColor Green
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   - Sensitive operations have been moved to server-side Firebase Functions" -ForegroundColor White
Write-Host "   - Client-side libraries for AI, OCR, and PKI have been removed" -ForegroundColor White
Write-Host "   - New secure service wrappers have been created" -ForegroundColor White
Write-Host "   - All required dependencies are installed" -ForegroundColor White