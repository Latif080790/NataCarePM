/**
 * Dependency Vulnerability Scanner
 * 
 * This script scans the project dependencies for known vulnerabilities
 * using various security databases and tools.
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Security databases and sources
const VULN_SOURCES = [
  'npm audit',
  'snyk test',
  'ossindex audit',
  'retire.js'
];

// OWASP Top 10 categories
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

// Vulnerability severity levels
const SEVERITY_LEVELS = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  INFO: 0
};

/**
 * Run npm audit
 */
function runNpmAudit() {
  try {
    console.log('Running npm audit...');
    const result = execSync('npm audit --json', { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    // npm audit exits with code 1 when vulnerabilities are found
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

/**
 * Check for outdated dependencies
 */
function checkOutdatedDependencies() {
  try {
    console.log('Checking for outdated dependencies...');
    const result = execSync('npm outdated --json', { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    // npm outdated exits with code 1 when dependencies are outdated
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    return {};
  }
}

/**
 * Scan for known vulnerable packages
 */
function scanVulnerablePackages() {
  const vulnerabilities = [];
  
  // Check package.json for known vulnerable packages
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Check dependencies
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Known vulnerable packages (this would be a more comprehensive list in reality)
  const knownVulnerable = {
    'lodash': '<4.17.19',
    'jquery': '<3.5.0',
    'serialize-javascript': '<3.1.0',
    'kind-of': '<6.0.3',
    'minimist': '<1.2.3'
  };
  
  for (const [pkg, version] of Object.entries(dependencies)) {
    if (knownVulnerable[pkg]) {
      vulnerabilities.push({
        package: pkg,
        version: version,
        severity: 'HIGH',
        recommendation: `Update ${pkg} to version ${knownVulnerable[pkg]} or later`,
        owaspCategory: 'A06:2021-Vulnerable and Outdated Components'
      });
    }
  }
  
  return vulnerabilities;
}

/**
 * Check for security misconfigurations
 */
function checkSecurityMisconfigurations() {
  const misconfigurations = [];
  
  // Check if environment variables are properly configured
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'SENTRY_DSN'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      misconfigurations.push({
        issue: `Missing environment variable: ${envVar}`,
        severity: 'MEDIUM',
        recommendation: `Set ${envVar} in your environment configuration`,
        owaspCategory: 'A05:2021-Security Misconfiguration'
      });
    }
  }
  
  // Check Firebase configuration
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('./src/firebaseConfig.ts', 'utf8'));
    if (firebaseConfig.apiKey && firebaseConfig.apiKey.includes('YOUR_')) {
      misconfigurations.push({
        issue: 'Firebase API key not configured',
        severity: 'HIGH',
        recommendation: 'Set proper Firebase API key in configuration',
        owaspCategory: 'A05:2021-Security Misconfiguration'
      });
    }
  } catch (error) {
    // Firebase config file not found or invalid
    misconfigurations.push({
      issue: 'Firebase configuration file not found or invalid',
      severity: 'HIGH',
      recommendation: 'Ensure Firebase is properly configured',
      owaspCategory: 'A05:2021-Security Misconfiguration'
    });
  }
  
  return misconfigurations;
}

/**
 * Generate security report
 */
function generateSecurityReport(auditResults, outdatedPackages, vulnerablePackages, misconfigurations) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalVulnerabilities: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    details: {
      npmAudit: auditResults,
      outdatedPackages: outdatedPackages,
      vulnerablePackages: vulnerablePackages,
      misconfigurations: misconfigurations
    }
  };
  
  // Count vulnerabilities
  if (auditResults && auditResults.vulnerabilities) {
    report.summary.totalVulnerabilities += auditResults.vulnerabilities.total;
    report.summary.critical += auditResults.vulnerabilities.critical || 0;
    report.summary.high += auditResults.vulnerabilities.high || 0;
    report.summary.medium += auditResults.vulnerabilities.moderate || 0;
    report.summary.low += auditResults.vulnerabilities.low || 0;
  }
  
  report.summary.totalVulnerabilities += vulnerablePackages.length;
  report.summary.totalVulnerabilities += misconfigurations.length;
  
  // Count severity levels in additional checks
  vulnerablePackages.forEach(vuln => {
    if (vuln.severity === 'CRITICAL') report.summary.critical++;
    if (vuln.severity === 'HIGH') report.summary.high++;
    if (vuln.severity === 'MEDIUM') report.summary.medium++;
    if (vuln.severity === 'LOW') report.summary.low++;
  });
  
  misconfigurations.forEach(misconfig => {
    if (misconfig.severity === 'CRITICAL') report.summary.critical++;
    if (misconfig.severity === 'HIGH') report.summary.high++;
    if (misconfig.severity === 'MEDIUM') report.summary.medium++;
    if (misconfig.severity === 'LOW') report.summary.low++;
  });
  
  return report;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting dependency vulnerability scan...');
  
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
    
    // Save report to file
    fs.writeFileSync(
      './security-reports/dependency-vulnerability-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('Dependency vulnerability scan completed.');
    console.log(`Found ${report.summary.totalVulnerabilities} issues:`);
    console.log(`  Critical: ${report.summary.critical}`);
    console.log(`  High: ${report.summary.high}`);
    console.log(`  Medium: ${report.summary.medium}`);
    console.log(`  Low: ${report.summary.low}`);
    
    // Exit with appropriate code
    if (report.summary.critical > 0 || report.summary.high > 0) {
      process.exit(1); // Fail build for critical/high issues
    }
    
    process.exit(0); // Success
  } catch (error) {
    console.error('Error during dependency scan:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runNpmAudit,
  checkOutdatedDependencies,
  scanVulnerablePackages,
  checkSecurityMisconfigurations,
  generateSecurityReport
};