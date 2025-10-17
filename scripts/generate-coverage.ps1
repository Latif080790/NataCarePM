# Test Coverage Report Generator
# Generates HTML coverage reports and updates README badge

Write-Host "🧪 Running tests with coverage..." -ForegroundColor Cyan

# Run tests with coverage
npm run test:coverage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Tests passed!" -ForegroundColor Green

# Check if coverage directory exists
if (Test-Path "coverage/coverage-summary.json") {
    Write-Host ""
    Write-Host "📊 Coverage Summary:" -ForegroundColor Yellow
    
    # Read coverage summary
    $coverageSummary = Get-Content "coverage/coverage-summary.json" | ConvertFrom-Json
    $total = $coverageSummary.total
    
    # Display coverage metrics
    Write-Host "  Lines:      $($total.lines.pct)%" -ForegroundColor $(if ($total.lines.pct -ge 60) { "Green" } else { "Red" })
    Write-Host "  Statements: $($total.statements.pct)%" -ForegroundColor $(if ($total.statements.pct -ge 60) { "Green" } else { "Red" })
    Write-Host "  Functions:  $($total.functions.pct)%" -ForegroundColor $(if ($total.functions.pct -ge 60) { "Green" } else { "Red" })
    Write-Host "  Branches:   $($total.branches.pct)%" -ForegroundColor $(if ($total.branches.pct -ge 60) { "Green" } else { "Red" })
    
    Write-Host ""
    
    # Check if meets threshold
    if ($total.lines.pct -lt 60) {
        Write-Host "⚠️  Coverage is below 60% threshold!" -ForegroundColor Yellow
        Write-Host "   Current: $($total.lines.pct)%" -ForegroundColor Red
        Write-Host "   Target:  60%" -ForegroundColor Green
    } else {
        Write-Host "✅ Coverage meets 60% threshold!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📁 HTML Report: coverage/index.html" -ForegroundColor Cyan
    Write-Host "📁 LCOV Report: coverage/lcov.info" -ForegroundColor Cyan
    
    # Open HTML report in browser (optional)
    $openReport = Read-Host "Open HTML report in browser? (y/n)"
    if ($openReport -eq 'y') {
        Start-Process "coverage/index.html"
    }
} else {
    Write-Host "❌ Coverage summary not found!" -ForegroundColor Red
}
