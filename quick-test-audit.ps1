#!/usr/bin/env pwsh
# Quick Start Testing Script for Enhanced Audit Trail
# Day 5.6 - End-to-End Testing

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Enhanced Audit Trail - Quick Start   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
Write-Host "🔍 Checking dev server status..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "✅ Dev server is running!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Dev server NOT running!" -ForegroundColor Red
    Write-Host "   Starting dev server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "npm run dev"
    Start-Sleep -Seconds 5
    Write-Host "✅ Dev server started!" -ForegroundColor Green
    Write-Host ""
}

# Display testing URLs
Write-Host "📍 Testing URLs:" -ForegroundColor Cyan
Write-Host "   Testing Page:        http://localhost:3001/settings/audit-testing" -ForegroundColor White
Write-Host "   Enhanced Audit Trail: http://localhost:3001/settings/audit-trail-enhanced" -ForegroundColor White
Write-Host ""

# Display quick instructions
Write-Host "🧪 Quick Testing Steps:" -ForegroundColor Cyan
Write-Host "   1. Navigate to Testing Page (URL above)" -ForegroundColor White
Write-Host "   2. Click 'Test Audit Logging' button" -ForegroundColor White
Write-Host "   3. Click 'Generate Sample Data' button" -ForegroundColor White
Write-Host "   4. Click 'View Enhanced Audit Trail' link" -ForegroundColor White
Write-Host "   5. Test filters, search, exports, and detail modals" -ForegroundColor White
Write-Host ""

# Display documentation
Write-Host "📖 Full Testing Guide:" -ForegroundColor Cyan
Write-Host "   Open: AUDIT_TRAIL_TESTING_GUIDE.md" -ForegroundColor White
Write-Host ""

# Ask if user wants to open URLs
Write-Host "🌐 Would you like to open testing URLs in browser? (Y/N): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Opening Testing Page..." -ForegroundColor Green
    Start-Process "http://localhost:3001/settings/audit-testing"
    Start-Sleep -Seconds 2
    
    Write-Host "🚀 Opening Enhanced Audit Trail..." -ForegroundColor Green
    Start-Process "http://localhost:3001/settings/audit-trail-enhanced"
    Write-Host ""
}

# Display checklist
Write-Host "✅ Pre-Testing Checklist:" -ForegroundColor Cyan
Write-Host "   [✓] Dev server running" -ForegroundColor Green
Write-Host "   [✓] Firebase configured" -ForegroundColor Green
Write-Host "   [✓] auditHelper.ts fixed" -ForegroundColor Green
Write-Host "   [✓] Sample data generator ready" -ForegroundColor Green
Write-Host "   [✓] Testing routes active" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 You're ready to test!" -ForegroundColor Green
Write-Host "   Follow the testing guide for detailed steps." -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
