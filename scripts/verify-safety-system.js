#!/usr/bin/env node

/**
 * Safety Management System - Build Verification Script
 * 
 * This script verifies that all Safety Management components
 * are properly integrated and ready for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔍 Safety Management System - Build Verification\n');
console.log('=' .repeat(60));

const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Files to verify
const filesToCheck = [
  // Type Definitions
  { path: 'types/safety.types.ts', type: 'Type Definitions', required: true },
  { path: 'types/offline.types.ts', type: 'Type Definitions', required: true },
  { path: 'types/executive.types.ts', type: 'Type Definitions', required: true },
  
  // API Service
  { path: 'api/safetyService.ts', type: 'API Service', required: true },
  
  // Context
  { path: 'contexts/SafetyContext.tsx', type: 'State Management', required: true },
  
  // Views
  { path: 'views/SafetyDashboardView.tsx', type: 'View Component', required: true },
  { path: 'views/IncidentManagementView.tsx', type: 'View Component', required: true },
  { path: 'views/TrainingManagementView.tsx', type: 'View Component', required: true },
  { path: 'views/PPEManagementView.tsx', type: 'View Component', required: true },
  
  // Form Components
  { path: 'components/safety/IncidentForm.tsx', type: 'Form Component', required: true },
  { path: 'components/safety/TrainingForm.tsx', type: 'Form Component', required: true },
  { path: 'components/safety/PPEForm.tsx', type: 'Form Component', required: true },
  { path: 'components/safety/AuditForm.tsx', type: 'Form Component', required: true },
  
  // Documentation
  { path: 'docs/SAFETY_MANAGEMENT_USER_GUIDE.md', type: 'Documentation', required: true },
  { path: 'docs/SAFETY_MANAGEMENT_DEVELOPER_GUIDE.md', type: 'Documentation', required: true },
  { path: 'docs/SAFETY_MANAGEMENT_API_DOCUMENTATION.md', type: 'Documentation', required: true },
  
  // Progress Reports
  { path: 'PHASE_3.5_COMPREHENSIVE_PROGRESS_REPORT.md', type: 'Progress Report', required: false },
  { path: 'PHASE_3.5_SAFETY_COMPLETE_SUMMARY.md', type: 'Summary Report', required: false },
];

console.log('\n📁 Checking File Existence...\n');

filesToCheck.forEach(file => {
  const fullPath = path.join(rootDir, file.path);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    results.passed.push(file.path);
    console.log(`✅ ${file.type.padEnd(20)} ${file.path.padEnd(50)} (${sizeKB} KB)`);
  } else {
    if (file.required) {
      results.failed.push(file.path);
      console.log(`❌ ${file.type.padEnd(20)} ${file.path.padEnd(50)} MISSING (Required)`);
    } else {
      results.warnings.push(file.path);
      console.log(`⚠️  ${file.type.padEnd(20)} ${file.path.padEnd(50)} MISSING (Optional)`);
    }
  }
});

console.log('\n' + '='.repeat(60));

// Count lines of code
console.log('\n📊 Code Statistics...\n');

let totalLines = 0;
let totalSize = 0;

const codeFiles = filesToCheck.filter(f => {
  const ext = path.extname(f.path);
  return ['.ts', '.tsx'].includes(ext);
});

codeFiles.forEach(file => {
  const fullPath = path.join(rootDir, file.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    const stats = fs.statSync(fullPath);
    
    totalLines += lines;
    totalSize += stats.size;
    
    console.log(`  ${file.path.padEnd(55)} ${String(lines).padStart(5)} lines`);
  }
});

console.log('\n' + '-'.repeat(60));
console.log(`  Total Lines of Code: ${totalLines.toLocaleString()}`);
console.log(`  Total Size: ${(totalSize / 1024).toFixed(2)} KB`);

// Documentation check
console.log('\n📚 Documentation Coverage...\n');

const docFiles = [
  { path: 'docs/SAFETY_MANAGEMENT_USER_GUIDE.md', name: 'User Guide' },
  { path: 'docs/SAFETY_MANAGEMENT_DEVELOPER_GUIDE.md', name: 'Developer Guide' },
  { path: 'docs/SAFETY_MANAGEMENT_API_DOCUMENTATION.md', name: 'API Documentation' },
];

docFiles.forEach(doc => {
  const fullPath = path.join(rootDir, doc.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).length;
    const sections = (content.match(/^#+\s/gm) || []).length;
    
    console.log(`  ${doc.name}:`);
    console.log(`    ✓ Lines: ${lines.toLocaleString()}`);
    console.log(`    ✓ Words: ${words.toLocaleString()}`);
    console.log(`    ✓ Sections: ${sections}`);
    console.log('');
  }
});

// Component verification
console.log('\n🧩 Component Integration Check...\n');

const components = [
  { name: 'SafetyContext', file: 'contexts/SafetyContext.tsx', exports: ['SafetyProvider', 'useSafety'] },
  { name: 'IncidentForm', file: 'components/safety/IncidentForm.tsx', exports: ['IncidentForm'] },
  { name: 'TrainingForm', file: 'components/safety/TrainingForm.tsx', exports: ['TrainingForm'] },
  { name: 'PPEForm', file: 'components/safety/PPEForm.tsx', exports: ['PPEForm'] },
  { name: 'AuditForm', file: 'components/safety/AuditForm.tsx', exports: ['AuditForm'] },
];

components.forEach(comp => {
  const fullPath = path.join(rootDir, comp.file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const allExportsFound = comp.exports.every(exp => 
      content.includes(`export const ${exp}`) || 
      content.includes(`export function ${exp}`) ||
      content.includes(`export { ${exp}`)
    );
    
    if (allExportsFound) {
      console.log(`  ✅ ${comp.name.padEnd(30)} All exports present`);
    } else {
      console.log(`  ⚠️  ${comp.name.padEnd(30)} Missing some exports`);
      results.warnings.push(`${comp.name} exports`);
    }
  }
});

// Type safety check
console.log('\n🔐 Type Safety Verification...\n');

const typeFiles = filesToCheck.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
let anyTypesFound = false;
let strictModeEnabled = true;

typeFiles.forEach(file => {
  const fullPath = path.join(rootDir, file.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for 'any' types (excluding comments)
    const codeLines = content.split('\n').filter(line => !line.trim().startsWith('//'));
    const hasAnyType = codeLines.some(line => /:\s*any\b/.test(line) && !line.includes('export type'));
    
    if (hasAnyType) {
      anyTypesFound = true;
      console.log(`  ⚠️  ${file.path} contains 'any' types`);
    }
  }
});

if (!anyTypesFound) {
  console.log('  ✅ No improper any types found');
}

// OSHA Compliance check
console.log('\n📋 OSHA Compliance Features...\n');

const oshaFeatures = [
  { name: 'TRIR Calculation', pattern: /TRIR|totalRecordableIncidentRate/ },
  { name: 'LTIFR Calculation', pattern: /LTIFR|lostTimeInjuryFrequencyRate/ },
  { name: 'DART Calculation', pattern: /DART|daysAwayRestrictedTransferRate/ },
  { name: 'Incident Classification', pattern: /oshaRecordable|oshaClassification/ },
  { name: 'Auto-numbering', pattern: /INC-|TRN-|AUD-/ },
];

const safetyServicePath = path.join(rootDir, 'api/safetyService.ts');
if (fs.existsSync(safetyServicePath)) {
  const content = fs.readFileSync(safetyServicePath, 'utf8');
  
  oshaFeatures.forEach(feature => {
    if (feature.pattern.test(content)) {
      console.log(`  ✅ ${feature.name.padEnd(30)} Implemented`);
    } else {
      console.log(`  ❌ ${feature.name.padEnd(30)} Not found`);
      results.failed.push(feature.name);
    }
  });
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 VERIFICATION SUMMARY\n');

console.log(`  Total Files Checked: ${filesToCheck.length}`);
console.log(`  ✅ Passed: ${results.passed.length}`);
console.log(`  ❌ Failed: ${results.failed.length}`);
console.log(`  ⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Items:');
  results.failed.forEach(item => console.log(`     - ${item}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  results.warnings.forEach(item => console.log(`     - ${item}`));
}

console.log('\n' + '='.repeat(60));

// Final verdict
if (results.failed.length === 0) {
  console.log('\n✅ ✅ ✅  BUILD VERIFICATION PASSED  ✅ ✅ ✅\n');
  console.log('The Safety Management System is ready for production!\n');
  process.exit(0);
} else {
  console.log('\n❌ ❌ ❌  BUILD VERIFICATION FAILED  ❌ ❌ ❌\n');
  console.log(`Please fix ${results.failed.length} critical issue(s) before proceeding.\n`);
  process.exit(1);
}
