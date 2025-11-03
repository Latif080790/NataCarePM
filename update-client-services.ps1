# PowerShell script to update client-side services to use secure implementations
# This script updates the client to use the new Firebase Functions-based services

Write-Host "🔄 Updating client-side services to use secure implementations" -ForegroundColor Green

# Backup original files
Write-Host "💾 Creating backups of original service files..." -ForegroundColor Yellow

# Backup AI service if it exists
if (Test-Path "src\api\aiResourceService.ts") {
    Copy-Item -Path "src\api\aiResourceService.ts" -Destination "src\api\aiResourceService.ts.backup"
    Write-Host "   Backed up aiResourceService.ts" -ForegroundColor White
}

# Backup OCR service if it exists
if (Test-Path "src\api\ocrService.ts") {
    Copy-Item -Path "src\api\ocrService.ts" -Destination "src\api\ocrService.ts.backup"
    Write-Host "   Backed up ocrService.ts" -ForegroundColor White
}

# Backup Digital Signatures service if it exists
if (Test-Path "src\api\digitalSignaturesService.ts") {
    Copy-Item -Path "src\api\digitalSignaturesService.ts" -Destination "src\api\digitalSignaturesService.ts.backup"
    Write-Host "   Backed up digitalSignaturesService.ts" -ForegroundColor White
}

Write-Host "✅ Backups completed!" -ForegroundColor Green

# Update imports in client code to use new secure services
Write-Host "🔄 Updating imports to use secure service implementations..." -ForegroundColor Yellow

# Find and replace imports in the codebase
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Update AI service imports
    if ($content -match "from\s+'@/api/aiResourceService'") {
        $content = $content -replace "from\s+'@/api/aiResourceService'", "from '@/api/aiService'"
        Set-Content $file $content
        Write-Host "   Updated AI service import in $($file.Name)" -ForegroundColor White
    }
    
    # Update OCR service imports
    if ($content -match "from\s+'@/api/ocrService'") {
        $content = $content -replace "from\s+'@/api/ocrService'", "from '@/api/ocrServiceFunctions'"
        Set-Content $file $content
        Write-Host "   Updated OCR service import in $($file.Name)" -ForegroundColor White
    }
    
    # Update Digital Signatures service imports
    if ($content -match "from\s+'@/api/digitalSignaturesService'") {
        $content = $content -replace "from\s+'@/api/digitalSignaturesService'", "from '@/api/digitalSignaturesServiceFunctions'"
        Set-Content $file $content
        Write-Host "   Updated Digital Signatures service import in $($file.Name)" -ForegroundColor White
    }
}

Write-Host "✅ Import updates completed!" -ForegroundColor Green

# Install new dependencies if needed
Write-Host "📦 Installing any new dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✅ Client-side service updates completed!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the backup files to ensure nothing important was lost" -ForegroundColor White
Write-Host "2. Test all functionality that uses AI, OCR, and Digital Signatures" -ForegroundColor White
Write-Host "3. Verify that the new secure implementations are working correctly" -ForegroundColor White
Write-Host "4. Remove backup files when you're confident everything is working properly" -ForegroundColor White