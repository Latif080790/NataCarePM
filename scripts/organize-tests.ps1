$sourceDir = "C:\Users\latie\Documents\GitHub\NataCarePM\src\components"
$destDir = "C:\Users\latie\Documents\GitHub\NataCarePM\src\components\__tests__"

# Ensure destination exists
if (-not (Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force
}

# Get all .test.tsx files in the source directory (not recursive)
$files = Get-ChildItem -Path $sourceDir -Filter "*.test.tsx"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    
    # Read content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Replace imports
    # Simple regex to replace './' with '../' in import statements
    # This handles import { X } from './X' -> import { X } from '../X'
    $newContent = $content -replace "from\s+['`"]\./", "from '../"
    $newContent = $newContent -replace 'from\s+[""]\./', 'from "../'
    
    # Write to new location
    $newPath = Join-Path -Path $destDir -ChildPath $file.Name
    Set-Content -Path $newPath -Value $newContent
    
    # Verify file exists before deleting source
    if (Test-Path -Path $newPath) {
        Remove-Item -Path $file.FullName -Force
        Write-Host "Moved $($file.Name) to __tests__"
    } else {
        Write-Error "Failed to move $($file.Name)"
    }
}
