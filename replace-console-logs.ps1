# PowerShell Script to Replace console.log with logger in API Services
# Created: November 12, 2025
# Purpose: Systematically replace all console statements with structured logger

Write-Host "🔍 Starting console.log replacement process..." -ForegroundColor Cyan

# List of files to process (top 10 critical files)
$files = @(
    "src\api\vendorService.ts",
    "src\api\materialRequestService.ts",
    "src\api\notificationService.ts",
    "src\api\ocrService.ts",
    "src\api\authService.ts",
    "src\api\changeOrderService.ts",
    "src\api\costControlService.ts",
    "src\api\aiService.ts",
    "src\api\executiveService.ts"
)

$totalFilesProcessed = 0
$totalReplacements = 0

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
        continue
    }

    Write-Host "`n📝 Processing: $file" -ForegroundColor Green
    
    # Read file content
    $content = Get-Content $filePath -Raw
    
    # Check if logger is already imported
    $hasLoggerImport = $content -match "import.*logger.*from.*@/utils/logger"
    
    # Count console statements
    $consoleMatches = [regex]::Matches($content, "console\.(log|error|warn|debug)")
    $count = $consoleMatches.Count
    
    if ($count -eq 0) {
        Write-Host "  ✅ No console statements found - skipping" -ForegroundColor Gray
        continue
    }
    
    Write-Host "  Found $count console statements" -ForegroundColor Cyan
    
    # Add logger import if not present
    if (-not $hasLoggerImport) {
        Write-Host "  📦 Adding logger import..." -ForegroundColor Cyan
        
        # Find last import statement
        $importPattern = "(?ms)^(import .+?;)\s*$"
        $matches = [regex]::Matches($content, $importPattern)
        
        if ($matches.Count -gt 0) {
            $lastImport = $matches[$matches.Count - 1]
            $insertPosition = $lastImport.Index + $lastImport.Length
            
            $loggerImport = "`nimport { logger } from '@/utils/logger.enhanced';"
            $content = $content.Insert($insertPosition, $loggerImport)
        }
    }
    
    # Replace console.error patterns
    $content = $content -replace "console\.error\('([^']+)',\s*error\);", "logger.error('`$1', error as Error);"
    $content = $content -replace 'console\.error\("([^"]+)",\s*error\);', 'logger.error("$1", error as Error);'
    $content = $content -replace 'console\.error\(`([^`]+)`,\s*error\);', 'logger.error(`$1`, error as Error);'
    
    # Replace console.log patterns
    $content = $content -replace "console\.log\('([^']+)',", "logger.info('`$1',"
    $content = $content -replace 'console\.log\("([^"]+)",', 'logger.info("$1",'
    $content = $content -replace 'console\.log\(`([^`]+)`,', 'logger.info(`$1`,'
    
    # Replace console.warn patterns  
    $content = $content -replace "console\.warn\('([^']+)',", "logger.warn('`$1',"
    $content = $content -replace 'console\.warn\("([^"]+)",', 'logger.warn("$1",'
    $content = $content -replace 'console\.warn\(`([^`]+)`,', 'logger.warn(`$1`,'
    
    # Replace console.debug patterns
    $content = $content -replace "console\.debug\('([^']+)',", "logger.debug('`$1',"
    $content = $content -replace 'console\.debug\("([^"]+)",', 'logger.debug("$1",'
    
    # Write back to file
    $content | Set-Content $filePath -NoNewline
    
    # Verify replacements
    $newContent = Get-Content $filePath -Raw
    $remainingConsole = [regex]::Matches($newContent, "console\.(log|error|warn|debug)").Count
    $replaced = $count - $remainingConsole
    
    Write-Host "  ✅ Replaced $replaced/$count console statements" -ForegroundColor Green
    
    if ($remainingConsole -gt 0) {
        Write-Host "  ⚠️  $remainingConsole console statements remaining (may need manual review)" -ForegroundColor Yellow
    }
    
    $totalFilesProcessed++
    $totalReplacements += $replaced
}

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ COMPLETE!" -ForegroundColor Green
Write-Host "   Files processed: $totalFilesProcessed" -ForegroundColor White
Write-Host "   Total replacements: $totalReplacements" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n🔧 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review changes with: git diff src/api/" -ForegroundColor White
Write-Host "   2. Test build: npm run build" -ForegroundColor White
Write-Host "   3. Fix any TypeScript errors if needed" -ForegroundColor White
