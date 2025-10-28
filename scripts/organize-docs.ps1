# Script to organize markdown files into appropriate directories
# Based on file content and creation dates

# Define file mappings
$phase1Files = @(
    "PHASE_1_*",
    "FEATURE_1*",
    "TODO_1*"
)

$phase2Files = @(
    "PHASE_2*",
    "TODO_2*"
)

$phase3Files = @(
    "PHASE_3*",
    "TODO_3*",
    "PHASE_3.5*"
)

$phase4Files = @(
    "PHASE_4*",
    "TODO_4*",
    "INTEGRATION*"
)

$securityFiles = @(
    "*SECURITY*",
    "*CSP_*",
    "*XSS_*",
    "RBAC_*",
    "SENTRY_*"
)

$testingFiles = @(
    "*TEST*",
    "*_TEST_*",
    "VITEST_*",
    "PLAYWRIGHT_*",
    "k6_*",
    "*PERFORMANCE*"
)

# Move files to appropriate directories
Write-Host "Organizing documentation files..." -ForegroundColor Green

# Move Phase 1 files
foreach ($pattern in $phase1Files) {
    Get-ChildItem -Path "*.md" | Where-Object { $_.Name -like $pattern } | ForEach-Object {
        Move-Item $_.FullName -Destination "docs\phase1\" -Force
        Write-Host "Moved $($_.Name) to docs/phase1/" -ForegroundColor Yellow
    }
}

# Move Phase 2 files
foreach ($pattern in $phase2Files) {
    Get-ChildItem -Path "*.md" | Where-Object { $_.Name -like $pattern } | ForEach-Object {
        Move-Item $_.FullName -Destination "docs\phase2\" -Force
        Write-Host "Moved $($_.Name) to docs/phase2/" -ForegroundColor Yellow
    }
}

# Move Phase 3 files
foreach ($pattern in $phase3Files) {
    Get-ChildItem -Path "*.md" | Where-Object { $_.Name -like $pattern } | ForEach-Object {
        Move-Item $_.FullName -Destination "docs\phase3\" -Force
        Write-Host "Moved $($_.Name) to docs/phase3/" -ForegroundColor Yellow
    }
}

# Move Phase 4 files
foreach ($pattern in $phase4Files) {
    Get-ChildItem -Path "*.md" | Where-Object { $_.Name -like $pattern } | ForEach-Object {
        Move-Item $_.FullName -Destination "docs\phase4\" -Force
        Write-Host "Moved $($_.Name) to docs/phase4/" -ForegroundColor Yellow
    }
}

# Move Security files
foreach ($pattern in $securityFiles) {
    Get-ChildItem -Path "*.md" | Where-Object { $_.Name -like $pattern } | ForEach-Object {
        Move-Item $_.FullName -Destination "docs\security\" -Force
        Write-Host "Moved $($_.Name) to docs/security/" -ForegroundColor Yellow
    }
}

# Move Testing files
foreach ($pattern in $testingFiles) {
    Get-ChildItem -Path "*.md" | Where-Object { $_.Name -like $pattern } | ForEach-Object {
        Move-Item $_.FullName -Destination "docs\testing\" -Force
        Write-Host "Moved $($_.Name) to docs/testing/" -ForegroundColor Yellow
    }
}

# Move remaining files to general
Get-ChildItem -Path "*.md" | ForEach-Object {
    Move-Item $_.FullName -Destination "docs\general\" -Force
    Write-Host "Moved $($_.Name) to docs/general/" -ForegroundColor Cyan
}

Write-Host "Documentation organization complete!" -ForegroundColor Green