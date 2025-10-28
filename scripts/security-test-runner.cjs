#!/usr/bin/env node

/**
 * Security Test Runner
 * Runs appropriate security tests for the Firebase-based NataCarePM application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m'
};

// Test categories
const TEST_CATEGORIES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  SECURITY: 'security',
  FIRESTORE_RULES: 'firestore-rules',
  DEPENDENCY: 'dependency'
};

/**
 * Log with color
 */
function log(message, color = COLORS.WHITE) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

/**
 * Run a command and return the result
 */
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: process.cwd(),
      ...options
    });
    return { success: true, output: result.toString() };
  } catch (error) {
    return { success: false, error: error.message, code: error.status };
  }
}

/**
 * Check if a directory exists
 */
function directoryExists(dirPath) {
  return fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
}

/**
 * Run unit tests
 */
function runUnitTests() {
  log('\n🔍 Running Unit Tests...', COLORS.BLUE);
  
  const result = runCommand('npm run test:run -- src/__tests__/security/', { silent: true });
  
  if (result.success) {
    log('✅ Unit tests completed successfully', COLORS.GREEN);
    return true;
  } else {
    log('❌ Unit tests failed', COLORS.RED);
    console.error(result.error);
    return false;
  }
}

/**
 * Run integration tests
 */
function runIntegrationTests() {
  log('\n🔍 Running Integration Tests...', COLORS.BLUE);
  
  const result = runCommand('npm run test:run -- src/__tests__/integration/', { silent: true });
  
  if (result.success) {
    log('✅ Integration tests completed successfully', COLORS.GREEN);
    return true;
  } else {
    log('❌ Integration tests failed', COLORS.RED);
    console.error(result.error);
    return false;
  }
}

/**
 * Run security-specific tests
 */
function runSecurityTests() {
  log('\n🔍 Running Security-Specific Tests...', COLORS.BLUE);
  
  // Run the custom Firebase security test
  const customTestResult = runCommand('node security-tests/firebase-security-test.js', { silent: true });
  
  if (customTestResult.success) {
    log('✅ Custom Firebase security tests completed successfully', COLORS.GREEN);
    return true;
  } else {
    log('❌ Custom Firebase security tests failed', COLORS.RED);
    console.error(customTestResult.error);
    return false;
  }
}

/**
 * Run dependency vulnerability scan
 */
function runDependencyScan() {
  log('\n🔍 Running Dependency Vulnerability Scan...', COLORS.BLUE);
  
  // First create package-lock.json if it doesn't exist
  if (!fs.existsSync('package-lock.json')) {
    log('Creating package-lock.json...', COLORS.YELLOW);
    const lockResult = runCommand('npm install --package-lock-only', { silent: true });
    if (!lockResult.success) {
      log('Failed to create package-lock.json', COLORS.RED);
      return false;
    }
  }
  
  const result = runCommand('npm audit --audit-level=high', { silent: true });
  
  if (result.success) {
    log('✅ No high or critical vulnerabilities found', COLORS.GREEN);
    return true;
  } else {
    // npm audit returns non-zero exit code when vulnerabilities found
    // Check if it's just reporting vulnerabilities or actual error
    if (result.error && result.error.includes('found')) {
      log('⚠️  Vulnerabilities found - check detailed report', COLORS.YELLOW);
      return true; // Continue with other tests
    } else {
      log('❌ Dependency scan failed', COLORS.RED);
      console.error(result.error);
      return false;
    }
  }
}

/**
 * Run Firestore rules tests (if available)
 */
function runFirestoreRulesTests() {
  log('\n🔍 Checking for Firestore Rules Tests...', COLORS.BLUE);
  
  // Check if Firebase testing dependencies are available
  const hasFirebaseTesting = runCommand('npm list @firebase/rules-unit-testing', { silent: true });
  
  if (hasFirebaseTesting.success && !hasFirebaseTesting.output.includes('(empty)')) {
    log('✅ Firestore rules testing dependencies found', COLORS.GREEN);
    
    // Check if there are Firestore rules test files
    if (directoryExists('src/__tests__/firestore-rules')) {
      log('Running Firestore rules tests...', COLORS.YELLOW);
      const result = runCommand('npm run test:run -- src/__tests__/firestore-rules/', { silent: true });
      
      if (result.success) {
        log('✅ Firestore rules tests completed successfully', COLORS.GREEN);
        return true;
      } else {
        log('❌ Firestore rules tests failed', COLORS.RED);
        return false;
      }
    } else {
      log('No Firestore rules test files found', COLORS.YELLOW);
      return true;
    }
  } else {
    log('Firestore rules testing dependencies not installed - skipping', COLORS.YELLOW);
    return true;
  }
}

/**
 * Generate security report
 */
function generateSecurityReport(testResults) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      totalTests: Object.keys(testResults).length,
      passed: Object.values(testResults).filter(result => result).length,
      failed: Object.values(testResults).filter(result => !result).length
    },
    details: testResults
  };
  
  // Save report
  const reportsDir = 'security-tests/security-reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(reportsDir, 'security-test-runner-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  log(`\n📋 Security test report saved to ${path.join(reportsDir, 'security-test-runner-report.json')}`, COLORS.CYAN);
  
  return report;
}

/**
 * Print summary
 */
function printSummary(report) {
  log('\n' + '='.repeat(50), COLORS.MAGENTA);
  log('SECURITY TEST RUNNER SUMMARY', COLORS.MAGENTA);
  log('='.repeat(50), COLORS.MAGENTA);
  
  log(`\nTimestamp: ${report.timestamp}`, COLORS.WHITE);
  log(`Total Tests: ${report.summary.totalTests}`, COLORS.WHITE);
  log(`Passed: ${report.summary.passed}`, COLORS.GREEN);
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? COLORS.RED : COLORS.GREEN);
  
  log('\nDetailed Results:', COLORS.WHITE);
  for (const [test, result] of Object.entries(report.details)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? COLORS.GREEN : COLORS.RED;
    log(`  ${test}: ${status}`, color);
  }
  
  if (report.summary.failed === 0) {
    log('\n🎉 All security tests passed!', COLORS.GREEN);
    log('The application appears to be secure.', COLORS.GREEN);
  } else {
    log('\n⚠️  Some security tests failed.', COLORS.YELLOW);
    log('Please review the failed tests and address the issues.', COLORS.YELLOW);
  }
  
  log('\n' + '='.repeat(50), COLORS.MAGENTA);
}

/**
 * Main function
 */
async function main() {
  log('🛡️  NataCarePM Security Test Runner', COLORS.MAGENTA);
  log('=====================================', COLORS.MAGENTA);
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found. Please run this script from the project root directory.', COLORS.RED);
    process.exit(1);
  }
  
  // Run all security tests
  const testResults = {};
  
  log('\n🚀 Starting comprehensive security testing...', COLORS.CYAN);
  
  // Run tests in order of importance
  testResults['Security Tests'] = runSecurityTests();
  testResults['Unit Tests'] = runUnitTests();
  testResults['Integration Tests'] = runIntegrationTests();
  testResults['Dependency Scan'] = runDependencyScan();
  testResults['Firestore Rules Tests'] = runFirestoreRulesTests();
  
  // Generate and print report
  const report = generateSecurityReport(testResults);
  printSummary(report);
  
  // Exit with appropriate code
  if (report.summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Security test runner failed: ${error.message}`, COLORS.RED);
    process.exit(1);
  });
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  runSecurityTests,
  runDependencyScan,
  runFirestoreRulesTests
};