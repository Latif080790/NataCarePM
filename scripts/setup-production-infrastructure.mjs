#!/usr/bin/env node

/**
 * Production Infrastructure Setup Script for NataCarePM
 * 
 * Automated setup for Day 1-2 manual configuration tasks:
 * 1. Create Cloud Storage bucket for backups
 * 2. Configure Firebase App Check with reCAPTCHA v3
 * 3. Setup Sentry error tracking
 * 4. Configure Google Analytics 4
 * 
 * Usage: node scripts/setup-production-infrastructure.mjs [options]
 * Options:
 *   --skip-bucket      Skip Cloud Storage bucket creation
 *   --skip-appcheck    Skip App Check configuration
 *   --skip-sentry      Skip Sentry setup
 *   --skip-ga4         Skip GA4 configuration
 *   --non-interactive  Run without prompts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import readline from 'readline';

// Configuration
const CONFIG = {
  projectId: 'natacara-hns',
  bucketName: 'natacare-backups',
  bucketLocation: 'asia-southeast2',
  region: 'asia-southeast2',
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipBucket: args.includes('--skip-bucket'),
  skipAppCheck: args.includes('--skip-appcheck'),
  skipSentry: args.includes('--skip-sentry'),
  skipGA4: args.includes('--skip-ga4'),
  interactive: !args.includes('--non-interactive'),
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`\n${colors.blue}🔹 ${msg}${colors.reset}`),
  header: (title) => {
    console.log(`\n${colors.magenta}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}║  ${title}${colors.reset}`);
    console.log(`${colors.magenta}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  },
};

// Prompt user for input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Execute shell command
function exec(command, ignoreError = false) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    if (!ignoreError) {
      throw error;
    }
    return null;
  }
}

// Check if command exists
function commandExists(command) {
  try {
    if (process.platform === 'win32') {
      execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

// Check prerequisites
async function checkPrerequisites() {
  log.header('Checking Prerequisites');

  let allGood = true;

  // Check Firebase CLI
  log.step('Checking Firebase CLI...');
  if (commandExists('firebase')) {
    const version = exec('firebase --version', true);
    log.success(`Firebase CLI installed: ${version.trim()}`);
  } else {
    log.error('Firebase CLI not installed. Install: npm install -g firebase-tools');
    allGood = false;
  }

  // Check Firebase login
  log.step('Checking Firebase authentication...');
  const projects = exec('firebase projects:list', true);
  if (projects) {
    log.success('Logged in to Firebase');
  } else {
    log.error('Not logged in to Firebase. Run: firebase login');
    allGood = false;
  }

  // Check gcloud CLI (optional)
  log.step('Checking gcloud CLI (optional)...');
  if (commandExists('gcloud')) {
    log.success('gcloud CLI installed');
  } else {
    log.warning('gcloud CLI not installed (optional for bucket creation)');
    log.info('You can create bucket manually via Firebase Console if needed');
  }

  // Check Node.js
  log.step('Checking Node.js...');
  const nodeVersion = process.version;
  log.success(`Node.js installed: ${nodeVersion}`);

  if (!allGood) {
    log.error('\nPrerequisites not met. Please install missing dependencies.');
    process.exit(1);
  }

  log.success('\nAll prerequisites met!');
}

// Task 1: Create Cloud Storage Bucket
async function createBackupBucket() {
  log.header('Task 1: Create Cloud Storage Bucket');

  if (options.skipBucket) {
    log.warning('Skipping bucket creation (--skip-bucket flag)');
    return;
  }

  log.info(`Bucket: gs://${CONFIG.bucketName}`);
  log.info(`Location: ${CONFIG.bucketLocation}`);
  log.info(`Project: ${CONFIG.projectId}`);

  if (options.interactive) {
    const confirm = await prompt('\nCreate bucket? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      log.warning('Skipping bucket creation');
      return;
    }
  }

  log.step('Checking if bucket already exists...');
  const bucketExists = exec(
    `gcloud storage buckets describe gs://${CONFIG.bucketName} --project=${CONFIG.projectId}`,
    true
  );

  if (bucketExists) {
    log.warning(`Bucket already exists: gs://${CONFIG.bucketName}`);
    return;
  }

  log.step('Creating Cloud Storage bucket...');
  try {
    exec(
      `gcloud storage buckets create gs://${CONFIG.bucketName} ` +
      `--project=${CONFIG.projectId} ` +
      `--location=${CONFIG.bucketLocation} ` +
      `--uniform-bucket-level-access ` +
      `--public-access-prevention`
    );

    log.success(`Bucket created successfully: gs://${CONFIG.bucketName}`);

    // Set lifecycle policy
    log.step('Setting lifecycle policy (30-day retention)...');
    const lifecycleConfig = {
      lifecycle: {
        rule: [
          {
            action: { type: 'Delete' },
            condition: { age: 30 },
          },
        ],
      },
    };

    writeFileSync('temp-lifecycle.json', JSON.stringify(lifecycleConfig, null, 2));

    exec(`gcloud storage buckets update gs://${CONFIG.bucketName} --lifecycle-file=temp-lifecycle.json`);

    // Clean up temp file
    if (existsSync('temp-lifecycle.json')) {
      execSync('rm temp-lifecycle.json');
    }

    log.success('Lifecycle policy applied (30-day retention)');
  } catch (error) {
    log.error('Failed to create bucket via gcloud CLI');
    log.warning('Please create bucket manually via Firebase Console:');
    log.info(`1. Go to: https://console.firebase.google.com/project/${CONFIG.projectId}/storage`);
    log.info('2. Click "Get Started" or "Create Bucket"');
    log.info(`3. Bucket name: ${CONFIG.bucketName}`);
    log.info(`4. Location: ${CONFIG.bucketLocation}`);
    log.info('5. Access control: Uniform (bucket-level only)');
  }
}

// Task 2: Configure Firebase App Check
async function setupAppCheck() {
  log.header('Task 2: Configure Firebase App Check');

  if (options.skipAppCheck) {
    log.warning('Skipping App Check setup (--skip-appcheck flag)');
    return;
  }

  log.info('This task requires manual steps in Firebase Console and Google Cloud Console\n');

  log.step('Step 1: Create reCAPTCHA v3 Site Key');
  log.info(`1. Go to: https://console.cloud.google.com/security/recaptcha?project=${CONFIG.projectId}`);
  log.info('2. Click "Create Key"');
  log.info('3. Settings:');
  log.info('   - Label: NataCarePM Production');
  log.info('   - Type: Score based (v3)');
  log.info('   - Domains: natacara-hns.web.app, natacara-hns.firebaseapp.com, localhost');
  log.info('4. Copy the Site Key (starts with 6Le...)\n');

  if (options.interactive) {
    const recaptchaSiteKey = await prompt('Enter reCAPTCHA Site Key (or press Enter to skip): ');
    if (recaptchaSiteKey) {
      log.success('reCAPTCHA Site Key received');
      updateEnvFile('VITE_RECAPTCHA_SITE_KEY', recaptchaSiteKey);
      updateEnvFile('VITE_APP_CHECK_ENABLED', 'true');
      log.success('.env.local updated');
    }
  }

  log.step('Step 2: Enable App Check in Firebase Console');
  log.info(`1. Go to: https://console.firebase.google.com/project/${CONFIG.projectId}/appcheck`);
  log.info('2. Click "Get Started"');
  log.info('3. Register your web app');
  log.info('4. Provider: reCAPTCHA v3');
  log.info('5. Paste the Site Key');
  log.info('6. Click "Save"\n');

  log.step('Step 3: Enforce App Check');
  log.info('1. In App Check console → Apps tab');
  log.info('2. For each service:');
  log.info('   - Firestore: Click "Enforce" → Enable');
  log.info('   - Storage: Click "Enforce" → Enable');
  log.info('   - Functions: Click "Enforce" → Enable\n');

  log.step('Step 4: Create Debug Token');
  log.info('1. In App Check → Apps tab → Manage debug tokens');
  log.info('2. Click "Add debug token"');
  log.info('3. Name: Local Development');
  log.info('4. Copy the generated token\n');

  if (options.interactive) {
    const debugToken = await prompt('Enter App Check Debug Token (or press Enter to skip): ');
    if (debugToken) {
      updateEnvFile('VITE_APP_CHECK_DEBUG_TOKEN', debugToken);
      log.success('.env.local updated with debug token');
    }
  }

  log.success('App Check configuration guide displayed');
  log.warning('Complete the manual steps above in Firebase Console');
}

// Task 3: Setup Sentry
async function setupSentry() {
  log.header('Task 3: Setup Sentry Error Tracking');

  if (options.skipSentry) {
    log.warning('Skipping Sentry setup (--skip-sentry flag)');
    return;
  }

  log.info('This task requires creating a Sentry account and project\n');

  log.step('Step 1: Create Sentry Account & Project');
  log.info('1. Go to: https://sentry.io/signup/');
  log.info('2. Sign up or log in');
  log.info('3. Click "Create Project"');
  log.info('4. Platform: React');
  log.info('5. Project Name: NataCarePM Production');
  log.info('6. Click "Create Project"\n');

  log.step('Step 2: Get Sentry DSN');
  log.info('1. After project creation, copy the DSN from:');
  log.info('   Settings → Projects → NataCarePM Production → Client Keys (DSN)');
  log.info('2. Format: https://PUBLIC_KEY@o123456.ingest.sentry.io/789\n');

  if (options.interactive) {
    const sentryDsn = await prompt('Enter Sentry DSN (or press Enter to skip): ');
    if (sentryDsn) {
      log.success('Sentry DSN received');
      updateEnvFile('VITE_SENTRY_DSN', sentryDsn);
      updateEnvFile('VITE_SENTRY_ENVIRONMENT', 'production');
      log.success('.env.local updated');
    }
  }

  log.step('Step 3: Configure Sentry Project Settings');
  log.info('1. General Settings:');
  log.info('   - Default Environment: production');
  log.info('   - Enable: Data Scrubbing');
  log.info('2. Performance Monitoring:');
  log.info('   - Enable Performance Monitoring');
  log.info('   - Transaction Sample Rate: 0.1 (10%)');
  log.info('3. Session Replay:');
  log.info('   - Enable Session Replay');
  log.info('   - Session Sample Rate: 0.1 (10%)\n');

  log.step('Step 4: Setup Alerts');
  log.info('1. Create alert rule:');
  log.info('   - Condition: Error count > 10 in 1 minute');
  log.info('   - Action: Send notification to email/Slack\n');

  log.success('Sentry configuration guide displayed');
  log.warning('Complete the manual steps above in Sentry.io');
}

// Task 4: Configure Google Analytics 4
async function setupGA4() {
  log.header('Task 4: Configure Google Analytics 4');

  if (options.skipGA4) {
    log.warning('Skipping GA4 setup (--skip-ga4 flag)');
    return;
  }

  log.info('This task requires creating a GA4 property in Google Analytics\n');

  log.step('Step 1: Create GA4 Property');
  log.info('1. Go to: https://analytics.google.com/');
  log.info('2. Sign in → Admin (bottom left)');
  log.info('3. Account: Create new or select existing');
  log.info('4. Property:');
  log.info('   - Property Name: NataCarePM Production');
  log.info('   - Time Zone: (GMT+07:00) Bangkok, Jakarta');
  log.info('   - Currency: Indonesian Rupiah (IDR)');
  log.info('5. Click "Next" → "Create"\n');

  log.step('Step 2: Setup Data Stream');
  log.info('1. In Property settings → Data Streams');
  log.info('2. Click "Add stream" → "Web"');
  log.info('3. Settings:');
  log.info('   - Website URL: https://natacara-hns.web.app');
  log.info('   - Stream Name: Production Web App');
  log.info('   - Enable ALL Enhanced Measurement options');
  log.info('4. Click "Create stream"');
  log.info('5. Copy the Measurement ID (format: G-XXXXXXXXXX)\n');

  if (options.interactive) {
    const ga4MeasurementId = await prompt('Enter GA4 Measurement ID (or press Enter to skip): ');
    if (ga4MeasurementId) {
      log.success('GA4 Measurement ID received');
      updateEnvFile('VITE_GA4_MEASUREMENT_ID', ga4MeasurementId);
      updateEnvFile('VITE_GA4_ENABLED', 'true');
      log.success('.env.local updated');
    }
  }

  log.step('Step 3: Create Custom Dimensions');
  log.info('In GA4 Admin → Custom Definitions → Create custom dimensions:');
  log.info('User-Scoped: user_role, user_company, subscription_tier');
  log.info('Event-Scoped: project_id, project_name, transaction_type, po_status, document_type, report_type, error_code, search_term\n');

  log.step('Step 4: Create Custom Metrics');
  log.info('In GA4 Admin → Custom Definitions → Create custom metrics:');
  log.info('- transaction_amount (Currency)');
  log.info('- project_budget (Currency)');
  log.info('- po_value (Currency)');
  log.info('- task_completion_time (Standard, seconds)');
  log.info('- ai_query_count (Standard)');
  log.info('- error_count (Standard)\n');

  log.step('Step 5: Configure Conversions');
  log.info('Mark these events as conversions in Admin → Events:');
  log.info('- signup, project_created, transaction_completed, po_approved, report_generated, subscription_upgrade\n');

  log.success('GA4 configuration guide displayed');
  log.warning('Complete the manual steps above in Google Analytics');
}

// Update .env.local file
function updateEnvFile(key, value) {
  const envPath = '.env.local';
  let envContent = '';

  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  }

  const regex = new RegExp(`^${key}=.*$`, 'gm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }

  writeFileSync(envPath, envContent, 'utf8');
}

// Verify setup
function verifySetup() {
  log.header('Verifying Setup');

  log.step('Checking .env.local configuration...');

  if (!existsSync('.env.local')) {
    log.warning('.env.local not found');
    log.info('Copy .env.example to .env.local and configure your keys');
    return;
  }

  const envContent = readFileSync('.env.local', 'utf8');

  const checks = {
    VITE_RECAPTCHA_SITE_KEY: 'App Check - reCAPTCHA Site Key',
    VITE_APP_CHECK_ENABLED: 'App Check - Enabled Flag',
    VITE_APP_CHECK_DEBUG_TOKEN: 'App Check - Debug Token',
    VITE_SENTRY_DSN: 'Sentry - DSN',
    VITE_SENTRY_ENVIRONMENT: 'Sentry - Environment',
    VITE_GA4_MEASUREMENT_ID: 'GA4 - Measurement ID',
    VITE_GA4_ENABLED: 'GA4 - Enabled Flag',
  };

  for (const [key, description] of Object.entries(checks)) {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    if (match) {
      const value = match[1].trim();
      if (value && !value.startsWith('your_') && !value.startsWith('XXXX')) {
        log.success(`${description}: Configured`);
      } else {
        log.warning(`${description}: Not configured (placeholder value)`);
      }
    } else {
      log.warning(`${description}: Not found in .env.local`);
    }
  }

  console.log('');
  log.step('Next Steps:');
  log.info('1. Complete manual configurations in Firebase Console, Sentry, and GA4');
  log.info('2. Rebuild the app: npm run build');
  log.info('3. Test in production mode: npm run preview');
  log.info('4. Verify integrations work correctly');
  console.log('');
  log.info('See docs/DAY_1_2_DEPLOYMENT_CHECKLIST.md for detailed verification steps');
}

// Main execution
async function main() {
  console.log('');
  console.log(`${colors.magenta}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}  NataCarePM Production Infrastructure Setup${colors.reset}`);
  console.log(`${colors.magenta}  Day 1-2 Manual Configuration Automation${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log('');

  try {
    await checkPrerequisites();
    await createBackupBucket();
    await setupAppCheck();
    await setupSentry();
    await setupGA4();
    verifySetup();

    log.header('Setup Complete!');
    log.success('Production infrastructure setup completed');
    console.log('');
    log.info('Documentation:');
    log.info('- Deployment Checklist: docs/DAY_1_2_DEPLOYMENT_CHECKLIST.md');
    log.info('- Completion Report: DAY_1_2_COMPLETE_DEPLOYMENT_SUCCESS.md');
    log.info('- Sentry Guide: docs/SENTRY_SETUP_GUIDE.md');
    log.info('- GA4 Guide: docs/GA4_SETUP_GUIDE.md');
    console.log('');
    log.success('🚀 NataCarePM is ready for production! 🚀');
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the setup
main();
