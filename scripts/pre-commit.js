#!/usr/bin/env node

// Pre-commit hook for NataCarePM
// Runs quality checks before allowing commits

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running pre-commit quality checks...\n');

const checks = [
  {
    name: 'TypeScript Type Check',
    command: 'npm run type-check',
    description: 'Checking TypeScript types...',
  },
  {
    name: 'ESLint Code Quality',
    command: 'npm run lint:check',
    description: 'Checking code quality and style...',
  },
  {
    name: 'Unit Tests',
    command: 'npm test -- --passWithNoTests',
    description: 'Running unit tests...',
  },
];

let allPassed = true;

for (const check of checks) {
  try {
    console.log(`⏳ ${check.description}`);
    execSync(check.command, { 
      stdio: 'inherit', 
      cwd: path.resolve(__dirname),
      timeout: 120000 // 2 minutes timeout
    });
    console.log(`✅ ${check.name} passed\n`);
  } catch (error) {
    console.error(`❌ ${check.name} failed`);
    console.error(`Command: ${check.command}`);
    console.error(`Exit code: ${error.status}\n`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('🎉 All pre-commit checks passed! Ready to commit.');
  process.exit(0);
} else {
  console.log('🚫 Some checks failed. Please fix the issues before committing.');
  console.log('\nTip: You can run the following commands to fix issues:');
  console.log('  npm run lint:fix    # Fix auto-fixable ESLint issues');
  console.log('  npm run type-check  # Check TypeScript types');
  console.log('  npm test            # Run tests');
  process.exit(1);
}