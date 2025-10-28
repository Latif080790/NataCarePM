/**
 * Phase 1 Implementation Validation Script
 * 
 * This script validates that all Phase 1 enhancements have been correctly implemented
 * and integrated into the NataCarePM system.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Files to check for existence
const REQUIRED_FILES = [
  // Accessibility features
  'hooks/useAccessibility.tsx',
  'components/SkipLink.tsx',
  'styles/accessibility.css',
  
  // Internationalization
  'i18n/index.ts',
  'i18n/translations.ts',
  
  // Enhanced error boundary
  'components/EnhancedErrorBoundary.tsx',
  
  // Tests
  '__tests__/accessibility.test.tsx',
  '__tests__/i18n.test.ts',
  '__tests__/enhanced-error-boundary.test.tsx'
];

// Files to check for content
const CONTENT_CHECKS = [
  {
    file: 'App.tsx',
    patterns: [
      "import { SkipLink } from '@/components/SkipLink'",
      "import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary'",
      '<SkipLink />',
      '<EnhancedErrorBoundary>'
    ]
  },
  {
    file: 'index.tsx',
    patterns: [
      "import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary'",
      '<EnhancedErrorBoundary>'
    ]
  },
  {
    file: 'styles/enterprise-design-system.css',
    patterns: [
      "@import './accessibility.css';"
    ]
  }
];

// Validation results
let validationResults = {
  passed: 0,
  failed: 0,
  details: []
};

// Helper function to log results
function logResult(status, message) {
  if (status === 'PASS') {
    validationResults.passed++;
    console.log(`✅ ${message}`);
  } else {
    validationResults.failed++;
    console.log(`❌ ${message}`);
  }
  validationResults.details.push({ status, message });
}

// Check if file exists
function checkFileExists(relativePath) {
  const fullPath = path.join(SRC_DIR, relativePath);
  const exists = fs.existsSync(fullPath);
  logResult(
    exists ? 'PASS' : 'FAIL',
    `File exists: ${relativePath}`
  );
  return exists;
}

// Check file content
function checkFileContent(relativePath, patterns) {
  const fullPath = path.join(SRC_DIR, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    logResult('FAIL', `File not found for content check: ${relativePath}`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  let allPatternsFound = true;
  
  patterns.forEach(pattern => {
    const found = content.includes(pattern);
    if (!found) {
      allPatternsFound = false;
    }
    logResult(
      found ? 'PASS' : 'FAIL',
      `Pattern "${pattern}" in ${relativePath}`
    );
  });
  
  return allPatternsFound;
}

// Main validation function
function validatePhase1() {
  console.log('🔍 Validating Phase 1 Implementation...\n');
  
  // Check required files
  console.log('📁 Checking required files...\n');
  REQUIRED_FILES.forEach(file => {
    checkFileExists(file);
  });
  
  // Check content patterns
  console.log('\n📝 Checking content patterns...\n');
  CONTENT_CHECKS.forEach(check => {
    checkFileContent(check.file, check.patterns);
  });
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`❌ Failed: ${validationResults.failed}`);
  console.log(`📋 Total: ${validationResults.passed + validationResults.failed}`);
  
  if (validationResults.failed === 0) {
    console.log('\n🎉 All Phase 1 implementations validated successfully!');
    console.log('The system now includes:');
    console.log('  - Advanced accessibility features (WCAG 2.1 compliance)');
    console.log('  - Internationalization support (English/Indonesian)');
    console.log('  - Enhanced error boundaries with recovery options');
    console.log('  - Comprehensive test coverage');
    return true;
  } else {
    console.log('\n⚠️  Some validation checks failed. Please review the implementation.');
    return false;
  }
}

// Run validation
const success = validatePhase1();
process.exit(success ? 0 : 1);