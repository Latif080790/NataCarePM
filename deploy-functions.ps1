# PowerShell script to deploy Firebase Functions
# This script builds and deploys the updated Firebase Functions

Write-Host "🚀 Deploying Firebase Functions for NataCarePM" -ForegroundColor Green

# Navigate to functions directory
Set-Location -Path "functions"

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build TypeScript files
Write-Host "⚙️ Building TypeScript files..." -ForegroundColor Yellow
npm run build

# Deploy functions
Write-Host "🚀 Deploying functions to Firebase..." -ForegroundColor Yellow
firebase deploy --only functions

# Return to root directory
Set-Location -Path ".."

Write-Host "✅ Firebase Functions deployment completed!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify functions are deployed successfully in Firebase Console" -ForegroundColor White
Write-Host "2. Test client-side integration with new secure services" -ForegroundColor White
Write-Host "3. Monitor logs for any errors or warnings" -ForegroundColor White