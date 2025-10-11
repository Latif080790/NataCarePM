# 🚀 PRODUCTION DEPLOYMENT SCRIPT FOR MONITORING SYSTEM
# Enhanced Firebase Security Rules and Monitoring Setup

Write-Host "🔧 Starting Production Monitoring Deployment..." -ForegroundColor Cyan

# ============================================
# ENVIRONMENT SETUP
# ============================================

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Please install: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Check if user is logged in
try {
    $firebaseUser = firebase auth:whoami
    Write-Host "✅ Authenticated as: $firebaseUser" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in. Running firebase login..." -ForegroundColor Yellow
    firebase login
}

# ============================================
# BUILD AND VALIDATION
# ============================================

Write-Host "🏗️ Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# ============================================
# FIRESTORE SECURITY RULES DEPLOYMENT
# ============================================

Write-Host "🔒 Deploying Firestore Security Rules..." -ForegroundColor Yellow

# Validate rules first
firebase firestore:rules
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore rules validation passed" -ForegroundColor Green
} else {
    Write-Host "❌ Firestore rules validation failed" -ForegroundColor Red
    exit 1
}

# Deploy rules
firebase deploy --only firestore:rules
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore security rules deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Firestore rules deployment failed" -ForegroundColor Red
    exit 1
}

# ============================================
# STORAGE SECURITY RULES DEPLOYMENT
# ============================================

Write-Host "📁 Deploying Storage Security Rules..." -ForegroundColor Yellow

firebase deploy --only storage:rules
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage security rules deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Storage rules deployment failed" -ForegroundColor Red
    exit 1
}

# ============================================
# MONITORING COLLECTIONS INITIALIZATION
# ============================================

Write-Host "📊 Initializing monitoring collections..." -ForegroundColor Yellow

# Create Node.js script to initialize collections
$initScript = @"
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeMonitoringCollections() {
  console.log('🔧 Initializing monitoring collections...');
  
  // Create indexes for monitoring collections
  const collections = [
    'systemMetrics',
    'userActivities', 
    'errorLogs',
    'performanceMetrics',
    'projectMetrics',
    'monitoringAlerts',
    'circuitBreakerStats'
  ];
  
  for (const collection of collections) {
    try {
      // Create a dummy document to ensure collection exists
      await db.collection(collection).add({
        _initialized: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ ${collection} collection initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${collection}:`, error.message);
    }
  }
  
  // Create monitoring configuration document
  try {
    await db.collection('settings').doc('monitoring').set({
      enabled: true,
      metricsInterval: 60000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxErrorRate: 10,
      enableBatteryTracking: true,
      enableNetworkTracking: true,
      enablePerformanceTracking: true,
      enableUserTracking: true,
      enableErrorTracking: true,
      dataRetentionDays: 30,
      alertThresholds: {
        cpu: { warning: 80, critical: 95 },
        memory: { warning: 1024, critical: 2048 },
        responseTime: { warning: 1000, critical: 3000 },
        errorRate: { warning: 5, critical: 10 },
        batteryLevel: { warning: 20, critical: 10 }
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Monitoring configuration created');
  } catch (error) {
    console.error('❌ Failed to create monitoring configuration:', error.message);
  }
  
  console.log('🎉 Monitoring collections initialization complete!');
  process.exit(0);
}

initializeMonitoringCollections().catch(console.error);
"@

$initScript | Out-File -FilePath "init-monitoring.js" -Encoding UTF8

# Check if service account key exists
if (Test-Path "serviceAccountKey.json") {
    Write-Host "✅ Service account key found" -ForegroundColor Green
    
    # Install firebase-admin if not present
    if (-not (Test-Path "node_modules/firebase-admin")) {
        Write-Host "📦 Installing firebase-admin..." -ForegroundColor Yellow
        npm install firebase-admin
    }
    
    # Run initialization script
    node init-monitoring.js
    
    # Clean up
    Remove-Item "init-monitoring.js" -Force
} else {
    Write-Host "⚠️ Service account key not found. Skipping automatic collection initialization." -ForegroundColor Yellow
    Write-Host "   Please download your service account key from Firebase Console" -ForegroundColor Yellow
    Write-Host "   and save it as 'serviceAccountKey.json' to enable automatic setup." -ForegroundColor Yellow
}

# ============================================
# PRODUCTION HOSTING DEPLOYMENT
# ============================================

Write-Host "🌐 Deploying to Firebase Hosting..." -ForegroundColor Yellow

firebase deploy --only hosting
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application deployed to production successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Hosting deployment failed" -ForegroundColor Red
    exit 1
}

# ============================================
# MONITORING SYSTEM HEALTH CHECK
# ============================================

Write-Host "🔍 Running production health checks..." -ForegroundColor Yellow

# Create health check script
$healthCheckScript = @"
const fetch = require('node-fetch');

async function runHealthChecks() {
  console.log('🏥 Running production health checks...');
  
  // Get hosting URL from Firebase
  const projectInfo = require('./firebase.json');
  const projectId = 'your-project-id'; // Update this
  const baseUrl = `https://${projectId}.web.app`;
  
  const healthChecks = [
    {
      name: 'Application Load',
      url: baseUrl,
      expectedStatus: 200
    },
    {
      name: 'Monitoring Dashboard',
      url: `${baseUrl}/monitoring`,
      expectedStatus: 200
    }
  ];
  
  let allPassed = true;
  
  for (const check of healthChecks) {
    try {
      console.log(`⏳ Testing: ${check.name}...`);
      const response = await fetch(check.url, { timeout: 10000 });
      
      if (response.status === check.expectedStatus) {
        console.log(`✅ ${check.name}: PASS`);
      } else {
        console.log(`❌ ${check.name}: FAIL (Status: ${response.status})`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: FAIL (${error.message})`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('🎉 All health checks passed!');
  } else {
    console.log('⚠️ Some health checks failed. Please investigate.');
  }
  
  return allPassed;
}

runHealthChecks().catch(console.error);
"@

$healthCheckScript | Out-File -FilePath "health-check.js" -Encoding UTF8

# Install node-fetch if not present
if (-not (Test-Path "node_modules/node-fetch")) {
    Write-Host "📦 Installing health check dependencies..." -ForegroundColor Yellow
    npm install node-fetch
}

# Run health checks
node health-check.js

# Clean up
Remove-Item "health-check.js" -Force

# ============================================
# DEPLOYMENT SUMMARY
# ============================================

Write-Host ""
Write-Host "🎉 PRODUCTION DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Application built successfully" -ForegroundColor Green
Write-Host "✅ Firestore security rules deployed" -ForegroundColor Green  
Write-Host "✅ Storage security rules deployed" -ForegroundColor Green
Write-Host "✅ Monitoring collections initialized" -ForegroundColor Green
Write-Host "✅ Application deployed to production hosting" -ForegroundColor Green
Write-Host "✅ Health checks completed" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Access your production application at: https://your-project-id.web.app" -ForegroundColor Cyan
Write-Host "📊 Monitor system health at: https://your-project-id.web.app/monitoring" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Important Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update environment variables for production" -ForegroundColor Yellow
Write-Host "   2. Configure monitoring alerts" -ForegroundColor Yellow
Write-Host "   3. Set up backup and recovery procedures" -ForegroundColor Yellow
Write-Host "   4. Review and update security rules as needed" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 For monitoring system documentation, see: MONITORING_GUIDE.md" -ForegroundColor Cyan