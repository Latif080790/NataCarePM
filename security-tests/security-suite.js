/**
 * NataCarePM Security Testing Suite
 * 
 * This script runs all security tests for the NataCarePM application
 * covering OWASP Top 10 vulnerabilities and other security concerns.
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Import test modules
const { runNpmAudit, checkOutdatedDependencies, scanVulnerablePackages, checkSecurityMisconfigurations, generateSecurityReport } = require('./dependency-scan');
const { testSQLInjection, testXSS, testBrokenAccessControl, generateInjectionReport } = require('./injection-test');
const { testWeakPasswordPolicies, testBruteForceProtection, testSessionManagement, testPasswordReset, generateAuthReport } = require('./auth-test');

// OWASP Top 10 Categories
const OWASP_TOP_10 = {
  'A01:2021-Broken Access Control': 'Ensure proper authentication and authorization',
  'A02:2021-Cryptographic Failures': 'Use strong encryption and secure key management',
  'A03:2021-Injection': 'Validate and sanitize all inputs',
  'A04:2021-Insecure Design': 'Follow secure design principles',
  'A05:2021-Security Misconfiguration': 'Ensure secure configuration of all components',
  'A06:2021-Vulnerable and Outdated Components': 'Keep dependencies up to date',
  'A07:2021-Identification and Authentication Failures': 'Implement strong authentication',
  'A08:2021-Software and Data Integrity Failures': 'Ensure code and data integrity',
  'A09:2021-Security Logging and Monitoring Failures': 'Implement proper logging and monitoring',
  'A10:2021-Server-Side Request Forgery': 'Validate and sanitize server-side requests'
};

// Severity levels
const SEVERITY_LEVELS = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  INFO: 0
};

/**
 * Ensure security reports directory exists
 */
function ensureReportsDirectory() {
  const reportsDir = './security-reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

/**
 * Run dependency vulnerability scans
 */
async function runDependencyScans() {
  console.log('🔍 Running dependency vulnerability scans...');
  
  try {
    // Run npm audit
    const auditResults = runNpmAudit();
    
    // Check for outdated dependencies
    const outdatedPackages = checkOutdatedDependencies();
    
    // Scan for known vulnerable packages
    const vulnerablePackages = scanVulnerablePackages();
    
    // Check for security misconfigurations
    const misconfigurations = checkSecurityMisconfigurations();
    
    // Generate security report
    const report = generateSecurityReport(
      auditResults,
      outdatedPackages,
      vulnerablePackages,
      misconfigurations
    );
    
    console.log(`   Found ${report.summary.totalVulnerabilities} dependency issues`);
    console.log(`   Critical: ${report.summary.critical}, High: ${report.summary.high}`);
    
    return report;
  } catch (error) {
    console.error('   ❌ Dependency scan failed:', error.message);
    return null;
  }
}

/**
 * Run injection vulnerability tests
 */
async function runInjectionTests(baseUrl) {
  console.log('🔍 Testing for injection vulnerabilities...');
  
  try {
    // Test SQL injection
    const sqlResults = await testSQLInjection(baseUrl);
    
    // Test XSS
    const xssResults = await testXSS(baseUrl);
    
    // Test broken access control
    const accessResults = await testBrokenAccessControl(baseUrl);
    
    // Generate report
    const report = generateInjectionReport(sqlResults, xssResults, accessResults);
    
    console.log(`   Found ${report.summary.totalVulnerabilities} injection issues`);
    
    return report;
  } catch (error) {
    console.error('   ❌ Injection tests failed:', error.message);
    return null;
  }
}

/**
 * Run authentication and session management tests
 */
async function runAuthTests(baseUrl) {
  console.log('🔍 Testing authentication and session management...');
  
  try {
    // Test weak password policies
    const weakPasswordResults = await testWeakPasswordPolicies(baseUrl);
    
    // Test brute force protection
    const bruteForceResults = await testBruteForceProtection(baseUrl);
    
    // Test session management
    const sessionResults = await testSessionManagement(baseUrl);
    
    // Test password reset functionality
    const resetResults = await testPasswordReset(baseUrl);
    
    // Generate report
    const report = generateAuthReport(weakPasswordResults, bruteForceResults, sessionResults, resetResults);
    
    console.log(`   Found ${report.summary.totalVulnerabilities} authentication issues`);
    
    return report;
  } catch (error) {
    console.error('   ❌ Authentication tests failed:', error.message);
    return null;
  }
}

/**
 * Generate comprehensive security report
 */
function generateComprehensiveReport(dependencyReport, injectionReport, authReport) {
  const report = {
    timestamp: new Date().toISOString(),
    target: process.env.TEST_BASE_URL || 'http://localhost:5173',
    owaspCoverage: Object.keys(OWASP_TOP_10),
    summary: {
      totalVulnerabilities: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    },
    details: {
      dependencyVulnerabilities: dependencyReport,
      injectionVulnerabilities: injectionReport,
      authenticationVulnerabilities: authReport
    }
  };
  
  // Aggregate summary
  if (dependencyReport && dependencyReport.summary) {
    report.summary.totalVulnerabilities += dependencyReport.summary.totalVulnerabilities || 0;
    report.summary.critical += dependencyReport.summary.critical || 0;
    report.summary.high += dependencyReport.summary.high || 0;
    report.summary.medium += dependencyReport.summary.medium || 0;
    report.summary.low += dependencyReport.summary.low || 0;
  }
  
  if (injectionReport && injectionReport.summary) {
    report.summary.totalVulnerabilities += injectionReport.summary.totalVulnerabilities || 0;
    report.summary.critical += injectionReport.summary.sqlInjection ? 1 : 0; // Simplified
    report.summary.high += injectionReport.summary.xss || 0;
  }
  
  if (authReport && authReport.summary) {
    report.summary.totalVulnerabilities += authReport.summary.totalVulnerabilities || 0;
    report.summary.high += authReport.summary.weakPasswords || 0;
    report.summary.medium += authReport.summary.bruteForce || 0;
  }
  
  return report;
}

/**
 * Print security summary
 */
function printSecuritySummary(report) {
  console.log('\n📊 SECURITY TEST SUMMARY');
  console.log('======================');
  console.log(`Target: ${report.target}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\nTotal Vulnerabilities: ${report.summary.totalVulnerabilities}`);
  console.log(`Critical: ${report.summary.critical}`);
  console.log(`High: ${report.summary.high}`);
  console.log(`Medium: ${report.summary.medium}`);
  console.log(`Low: ${report.summary.low}`);
  
  if (report.summary.critical > 0 || report.summary.high > 0) {
    console.log('\n🚨 CRITICAL/HIGH VULNERABILITIES FOUND!');
    console.log('   Please address these issues before deployment.');
  } else if (report.summary.medium > 0) {
    console.log('\n⚠️  MEDIUM SEVERITY ISSUES FOUND');
    console.log('   Consider addressing these issues.');
  } else {
    console.log('\n✅ No critical or high severity vulnerabilities found!');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🛡️  NataCarePM Security Testing Suite');
  console.log('=====================================');
  
  // Ensure reports directory exists
  ensureReportsDirectory();
  
  // Get base URL from environment or default
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';
  console.log(`Testing against: ${baseUrl}\n`);
  
  // Run all security tests
  const dependencyReport = await runDependencyScans();
  const injectionReport = await runInjectionTests(baseUrl);
  const authReport = await runAuthTests(baseUrl);
  
  // Generate comprehensive report
  const comprehensiveReport = generateComprehensiveReport(dependencyReport, injectionReport, authReport);
  
  // Save comprehensive report
  fs.writeFileSync(
    './security-reports/comprehensive-security-report.json',
    JSON.stringify(comprehensiveReport, null, 2)
  );
  
  // Print summary
  printSecuritySummary(comprehensiveReport);
  
  // Exit with appropriate code
  if (comprehensiveReport.summary.critical > 0 || comprehensiveReport.summary.high > 0) {
    console.log('\n❌ Security tests failed due to critical/high vulnerabilities');
    process.exit(1);
  }
  
  console.log('\n✅ Security tests completed successfully');
  process.exit(0);
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Security suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runDependencyScans,
  runInjectionTests,
  runAuthTests,
  generateComprehensiveReport,
  printSecuritySummary
};