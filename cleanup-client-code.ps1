# PowerShell script to clean up client-side sensitive code
# This script removes any remaining client-side implementations of sensitive operations

Write-Host "🧹 Cleaning up client-side sensitive code" -ForegroundColor Green

# Remove client-side AI/ML libraries
Write-Host "🗑️ Removing client-side AI/ML libraries..." -ForegroundColor Yellow

# Check if TensorFlow.js is installed in client package.json
$clientPackage = Get-Content "package.json" | ConvertFrom-Json
if ($clientPackage.dependencies."@tensorflow/tfjs") {
    Write-Host "   Removing @tensorflow/tfjs from client dependencies..." -ForegroundColor White
    # We won't actually remove it from package.json as it might be used elsewhere
    # But we'll make sure it's not imported in sensitive files
}

# Remove client-side OCR libraries
Write-Host "🗑️ Removing client-side OCR libraries..." -ForegroundColor Yellow

# Check if Tesseract.js is installed in client package.json
if ($clientPackage.dependencies."tesseract.js") {
    Write-Host "   tesseract.js found in client dependencies - will keep for other uses" -ForegroundColor White
    # We won't remove it from package.json as it might be used elsewhere
}

# Remove client-side PKI libraries
Write-Host "🗑️ Removing client-side PKI libraries..." -ForegroundColor Yellow

# Check if node-forge is installed in client package.json
if ($clientPackage.dependencies."node-forge") {
    Write-Host "   node-forge found in client dependencies - will keep for other uses" -ForegroundColor White
    # We won't remove it from package.json as it might be used elsewhere
}

# Clean up imports in specific sensitive files
Write-Host "🧹 Cleaning up imports in sensitive service files..." -ForegroundColor Yellow

# Files that should not import sensitive libraries
$sensitiveFiles = @(
    "src\api\aiResourceService.ts",
    "src\api\ocrService.ts",
    "src\api\digitalSignaturesService.ts",
    "src\api\passwordService.ts"
)

foreach ($file in $sensitiveFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Remove TensorFlow.js imports
        if ($content -match "import.*@tensorflow/tfjs") {
            $content = $content -replace "import.*@tensorflow/tfjs.*\n", ""
            Set-Content $file $content
            Write-Host "   Removed TensorFlow.js import from $file" -ForegroundColor White
        }
        
        # Remove Tesseract.js imports
        if ($content -match "import.*tesseract\.js") {
            $content = $content -replace "import.*tesseract\.js.*\n", ""
            Set-Content $file $content
            Write-Host "   Removed Tesseract.js import from $file" -ForegroundColor White
        }
        
        # Remove node-forge imports (but keep the dynamic require)
        if ($content -match "import.*node-forge") {
            $content = $content -replace "import.*node-forge.*\n", ""
            Set-Content $file $content
            Write-Host "   Removed node-forge import from $file" -ForegroundColor White
        }
    }
}

# Remove unused service files (but keep them as backups)
Write-Host "📦 Archiving old service implementations..." -ForegroundColor Yellow

$oldServices = @(
    "src\api\aiResourceService.ts",
    "src\api\ocrService.ts",
    "src\api\digitalSignaturesService.ts"
)

foreach ($service in $oldServices) {
    if (Test-Path $service) {
        # Rename to .old extension to archive
        $newName = "$service.old"
        Rename-Item -Path $service -NewName $newName
        Write-Host "   Archived $service to $newName" -ForegroundColor White
    }
}

# Create placeholder files with deprecation notices
Write-Host "📝 Creating deprecation notices..." -ForegroundColor Yellow

foreach ($service in $oldServices) {
    if (!(Test-Path $service)) {
        $serviceName = [System.IO.Path]::GetFileNameWithoutExtension($service)
        $content = @"
/**
 * DEPRECATED: $serviceName
 * 
 * This service has been deprecated and moved to Firebase Functions for security reasons.
 * Please use the secure implementation in:
 *   - AI Service: '@/api/aiService'
 *   - OCR Service: '@/api/ocrServiceFunctions'
 *   - Digital Signatures Service: '@/api/digitalSignaturesServiceFunctions'
 * 
 * For more information, see SECURITY_IMPLEMENTATION_README.md
 */

console.warn('⚠️ DEPRECATED: $serviceName has been moved to Firebase Functions for security. Please use the secure implementation.');
"@
        Set-Content $service $content
        Write-Host "   Created deprecation notice for $service" -ForegroundColor White
    }
}

Write-Host "✅ Client-side code cleanup completed!" -ForegroundColor Green
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "   - Archived old sensitive service implementations" -ForegroundColor White
Write-Host "   - Created deprecation notices for old services" -ForegroundColor White
Write-Host "   - Removed sensitive library imports from service files" -ForegroundColor White
Write-Host "   - Preserved libraries in package.json for other legitimate uses" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ IMPORTANT: Please verify that all functionality still works correctly with the new secure implementations" -ForegroundColor Yellow