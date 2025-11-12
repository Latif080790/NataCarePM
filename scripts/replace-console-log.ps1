# Replace Console.log with Structured Logger
# Priority: App.tsx, Root.tsx, envValidation.ts (high-traffic files)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Starting console.log replacement with structured logger..." -ForegroundColor Cyan
Write-Host ""

# Define file mappings
$filesToReplace = @(
    @{
        Path = "src\App.tsx"
        Description = "Main application file"
    },
    @{
        Path = "src\Root.tsx"
        Description = "Root component with providers"
    },
    @{
        Path = "src\config\envValidation.ts"
        Description = "Environment variable validation"
    },
    @{
        Path = "src\api\ocrService.ts"
        Description = "OCR processing service"
    }
)

# Statistics
$totalFilesProcessed = 0
$totalReplacements = 0

foreach ($file in $filesToReplace) {
    $filePath = Join-Path $PSScriptRoot ".." $file.Path
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  Skipping $($file.Path) - File not found" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "📝 Processing: $($file.Description)" -ForegroundColor Green
    Write-Host "   Path: $($file.Path)" -ForegroundColor Gray
    
    # Read file content
    $content = Get-Content $filePath -Raw
    $originalContent = $content
    
    # Track replacements for this file
    $fileReplacements = 0
    
    # Pattern 1: console.log(...) → logger.info(...)
    $pattern1 = "console\.log\("
    $replacement1 = "logger.info("
    $content = $content -replace $pattern1, $replacement1
    $fileReplacements += ([regex]::Matches($originalContent, $pattern1)).Count
    
    # Pattern 2: console.warn(...) → logger.warn(...)
    $pattern2 = "console\.warn\("
    $replacement2 = "logger.warn("
    $content = $content -replace $pattern2, $replacement2
    $fileReplacements += ([regex]::Matches($originalContent, $pattern2)).Count
    
    # Pattern 3: console.error(...) → logger.error(...)
    $pattern3 = "console\.error\("
    $replacement3 = "logger.error("
    $content = $content -replace $pattern3, $replacement3
    $fileReplacements += ([regex]::Matches($originalContent, $pattern3)).Count
    
    # Pattern 4: console.debug(...) → logger.debug(...)
    $pattern4 = "console\.debug\("
    $replacement4 = "logger.debug("
    $content = $content -replace $pattern4, $replacement4
    $fileReplacements += ([regex]::Matches($originalContent, $pattern4)).Count
    
    # Pattern 5: console.info(...) → logger.info(...)
    $pattern5 = "console\.info\("
    $replacement5 = "logger.info("
    $content = $content -replace $pattern5, $replacement5
    $fileReplacements += ([regex]::Matches($originalContent, $pattern5)).Count
    
    # Check if logger import exists
    if ($content -notmatch "import.*logger.*from.*@/utils/logger") {
        # Find the import section (after existing imports)
        $importPattern = "(import.*from.*['\`"];?\s*\n)"
        if ($content -match $importPattern) {
            # Add logger import after last import
            $lastImportIndex = $content.LastIndexOf("import")
            $nextNewlineIndex = $content.IndexOf("`n", $lastImportIndex) + 1
            
            $beforeImports = $content.Substring(0, $nextNewlineIndex)
            $afterImports = $content.Substring($nextNewlineIndex)
            
            $loggerImport = "import { logger } from '@/utils/logger.enhanced';`n"
            $content = $beforeImports + $loggerImport + $afterImports
            
            Write-Host "   ✅ Added logger import" -ForegroundColor Green
        }
    }
    
    # Write back to file
    Set-Content $filePath -Value $content -NoNewline
    
    $totalFilesProcessed++
    $totalReplacements += $fileReplacements
    
    Write-Host "   ✅ Replaced $fileReplacements console statements" -ForegroundColor Green
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Console.log Replacement Complete!" -ForegroundColor Green
Write-Host "   Files processed: $totalFilesProcessed" -ForegroundColor White
Write-Host "   Total replacements: $totalReplacements" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Run 'npm run type-check' to verify TypeScript" -ForegroundColor Gray
Write-Host "   2. Run 'npm run lint' to verify code quality" -ForegroundColor Gray
Write-Host "   3. Run 'npm test' to ensure tests still pass" -ForegroundColor Gray
Write-Host "   4. Manually review edge cases (multiline logs, complex arguments)" -ForegroundColor Gray
Write-Host ""
