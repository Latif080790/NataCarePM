# Deploy Cloud Functions with Security Fixes
# Deploys generateAiInsight function with environment variable configuration

Write-Host "🚀 Deploying Cloud Functions - CRITICAL Security Fix" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if GEMINI_API_KEY is set in environment
$envFile = "functions\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  Warning: functions\.env not found" -ForegroundColor Yellow
    Write-Host "Creating .env file template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# Gemini API Key for AI Assistant
# Get your key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
"@
    
    Set-Content -Path $envFile -Value $envTemplate
    
    Write-Host "✅ Created functions\.env template" -ForegroundColor Green
    Write-Host "❌ ERROR: Please set GEMINI_API_KEY in functions\.env before deploying" -ForegroundColor Red
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Get API key from: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    Write-Host "2. Edit functions\.env and replace 'your_gemini_api_key_here'" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    exit 1
}

# Verify API key is set (not the placeholder)
$envContent = Get-Content $envFile -Raw
if ($envContent -match "your_gemini_api_key_here") {
    Write-Host "❌ ERROR: GEMINI_API_KEY not set in functions\.env" -ForegroundColor Red
    Write-Host "Please edit functions\.env and replace 'your_gemini_api_key_here' with your actual API key" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment configuration found" -ForegroundColor Green
Write-Host ""

# Navigate to functions directory
Write-Host "📁 Navigating to functions directory..." -ForegroundColor Cyan
Push-Location functions

try {
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
    }
    
    # Build TypeScript
    Write-Host "🔨 Building TypeScript..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript build failed"
    }
    Write-Host "✅ Build complete" -ForegroundColor Green
    Write-Host ""
    
    # Deploy to Firebase
    Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Cyan
    Write-Host "Function: generateAiInsight" -ForegroundColor Yellow
    Write-Host "Project: natacara-hns" -ForegroundColor Yellow
    Write-Host ""
    
    firebase deploy --only functions:generateAiInsight --project natacara-hns
    
    if ($LASTEXITCODE -ne 0) {
        throw "Firebase deployment failed"
    }
    
    Write-Host ""
    Write-Host "✅ Cloud Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Show function URL
    Write-Host "📍 Function Details:" -ForegroundColor Cyan
    Write-Host "Name: generateAiInsight" -ForegroundColor White
    Write-Host "Type: Callable (HTTPS)" -ForegroundColor White
    Write-Host "Auth: Required" -ForegroundColor White
    Write-Host "Runtime: Node.js 20" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🔐 Security Improvements:" -ForegroundColor Green
    Write-Host "  ✅ API key stored in environment variables (not client bundle)" -ForegroundColor White
    Write-Host "  ✅ Authentication enforced by Cloud Functions" -ForegroundColor White
    Write-Host "  ✅ Conversation history managed server-side" -ForegroundColor White
    Write-Host "  ✅ Rate limiting possible" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🧪 Testing Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open application: https://natacara-hns.web.app" -ForegroundColor White
    Write-Host "2. Login and navigate to project dashboard" -ForegroundColor White
    Write-Host "3. Click AI Assistant icon (sparkles)" -ForegroundColor White
    Write-Host "4. Send test message: 'Ringkas progres proyek minggu ini'" -ForegroundColor White
    Write-Host "5. Verify AI response generated" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📊 View Logs:" -ForegroundColor Cyan
    Write-Host "firebase functions:log --only generateAiInsight --project natacara-hns" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🎉 CRITICAL Security Fix 3/3 - DEPLOYMENT COMPLETE" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Firebase CLI is logged in: firebase login" -ForegroundColor White
    Write-Host "2. Verify project exists: firebase projects:list" -ForegroundColor White
    Write-Host "3. Check functions/.env has valid GEMINI_API_KEY" -ForegroundColor White
    Write-Host "4. Review build errors above" -ForegroundColor White
    exit 1
} finally {
    Pop-Location
}
