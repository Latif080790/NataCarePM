#!/usr/bin/env tsx

/**
 * Enterprise Improvement Automation Script
 * Automates common improvement tasks
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface Task {
  id: string;
  name: string;
  execute: () => Promise<void>;
}

const tasks: Task[] = [
  {
    id: 'analyze-bundle',
    name: '📦 Analyze Bundle Size',
    execute: async () => {
      console.log('\n🔍 Building production bundle...');
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('\n📊 Analyzing bundle...');
      const distPath = path.join(process.cwd(), 'dist', 'assets');
      
      if (!fs.existsSync(distPath)) {
        console.error('❌ Build failed - no assets folder');
        return;
      }
      
      const files = fs.readdirSync(distPath);
      let totalSize = 0;
      
      console.log('\n📦 Bundle Files:');
      files.forEach(file => {
        const stats = fs.statSync(path.join(distPath, file));
        const sizeMB = stats.size / (1024 * 1024);
        totalSize += sizeMB;
        console.log(`  ${file}: ${sizeMB.toFixed(2)} MB`);
      });
      
      console.log(`\n💾 Total Bundle Size: ${totalSize.toFixed(2)} MB`);
      
      if (totalSize > 2) {
        console.log('⚠️  Bundle size exceeds 2MB target!');
      } else {
        console.log('✅ Bundle size within target');
      }
    },
  },
  
  {
    id: 'check-env',
    name: '🔐 Check Environment Variables',
    execute: async () => {
      console.log('\n🔍 Checking environment configuration...');
      
      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_GEMINI_API_KEY',
      ];
      
      const missing: string[] = [];
      
      requiredVars.forEach(varName => {
        if (!process.env[varName]) {
          missing.push(varName);
        }
      });
      
      if (missing.length > 0) {
        console.log('\n⚠️  Missing environment variables:');
        missing.forEach(v => console.log(`  - ${v}`));
        console.log('\n💡 Copy .env.example to .env.local and fill in values');
      } else {
        console.log('\n✅ All required environment variables set');
      }
    },
  },
  
  {
    id: 'count-errors',
    name: '🔧 Count TypeScript Errors',
    execute: async () => {
      console.log('\n🔍 Running TypeScript compiler...');
      
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        console.log('\n✅ No TypeScript errors!');
      } catch (error: any) {
        const output = error.stdout?.toString() || '';
        const lines = output.split('\n');
        const errorLines = lines.filter((line: string) => line.includes('error TS'));
        
        console.log(`\n⚠️  Found ${errorLines.length} TypeScript errors`);
        
        // Group by error type
        const errorTypes = new Map<string, number>();
        errorLines.forEach((line: string) => {
          const match = line.match(/error (TS\d+):/);
          if (match) {
            const type = match[1];
            errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
          }
        });
        
        console.log('\n📊 Error breakdown:');
        Array.from(errorTypes.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .forEach(([type, count]) => {
            console.log(`  ${type}: ${count} errors`);
          });
      }
    },
  },
  
  {
    id: 'check-mobile',
    name: '📱 Check Mobile Responsiveness',
    execute: async () => {
      console.log('\n🔍 Scanning for responsive issues...');
      
      const viewsPath = path.join(process.cwd(), 'src', 'views');
      const views = fs.readdirSync(viewsPath).filter(f => f.endsWith('.tsx'));
      
      let tablesWithoutResponsive = 0;
      
      views.forEach(viewFile => {
        const content = fs.readFileSync(path.join(viewsPath, viewFile), 'utf-8');
        
        // Check for table elements without responsive class
        if (content.includes('<table') && !content.includes('ResponsiveTable')) {
          tablesWithoutResponsive++;
        }
      });
      
      console.log(`\n📊 Mobile Responsiveness Status:`);
      console.log(`  Total views: ${views.length}`);
      console.log(`  Views with non-responsive tables: ${tablesWithoutResponsive}`);
      
      if (tablesWithoutResponsive > 0) {
        console.log(`\n💡 Consider using ResponsiveTable component for ${tablesWithoutResponsive} views`);
      } else {
        console.log('\n✅ All tables using responsive components');
      }
    },
  },
  
  {
    id: 'check-tests',
    name: '🧪 Check Test Coverage',
    execute: async () => {
      console.log('\n🔍 Running tests with coverage...');
      
      try {
        execSync('npm run test -- --coverage --reporter=json', { stdio: 'pipe' });
        
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        
        if (fs.existsSync(coveragePath)) {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
          const total = coverage.total;
          
          console.log('\n📊 Test Coverage:');
          console.log(`  Statements: ${total.statements.pct.toFixed(2)}%`);
          console.log(`  Branches: ${total.branches.pct.toFixed(2)}%`);
          console.log(`  Functions: ${total.functions.pct.toFixed(2)}%`);
          console.log(`  Lines: ${total.lines.pct.toFixed(2)}%`);
          
          if (total.statements.pct < 70) {
            console.log(`\n⚠️  Coverage below 70% target`);
          } else {
            console.log('\n✅ Coverage meets 70% target');
          }
        }
      } catch (error) {
        console.log('\n⚠️  No tests found or tests failed');
      }
    },
  },
  
  {
    id: 'check-security',
    name: '🔒 Security Audit',
    execute: async () => {
      console.log('\n🔍 Running security audit...');
      
      // Check for common security issues
      const issues: string[] = [];
      
      // Check 1: API keys in code
      console.log('\n1️⃣ Checking for hardcoded API keys...');
      const srcPath = path.join(process.cwd(), 'src');
      const checkFile = (filePath: string) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (content.match(/apiKey\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/)) {
          issues.push(`Possible hardcoded API key in ${filePath}`);
        }
      };
      
      const scanDir = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        entries.forEach(entry => {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            scanDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            checkFile(fullPath);
          }
        });
      };
      
      scanDir(srcPath);
      
      // Check 2: npm audit
      console.log('\n2️⃣ Running npm audit...');
      try {
        execSync('npm audit --json', { stdio: 'pipe' });
        console.log('  ✅ No vulnerabilities found');
      } catch (error: any) {
        const output = JSON.parse(error.stdout?.toString() || '{}');
        const vulns = output.metadata?.vulnerabilities || {};
        const total = vulns.total || 0;
        
        if (total > 0) {
          console.log(`  ⚠️  Found ${total} vulnerabilities`);
          console.log(`    Critical: ${vulns.critical || 0}`);
          console.log(`    High: ${vulns.high || 0}`);
          console.log(`    Moderate: ${vulns.moderate || 0}`);
          console.log(`    Low: ${vulns.low || 0}`);
        }
      }
      
      // Summary
      if (issues.length > 0) {
        console.log('\n⚠️  Security issues found:');
        issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('\n✅ No obvious security issues found');
      }
    },
  },
  
  {
    id: 'check-performance',
    name: '⚡ Performance Check',
    execute: async () => {
      console.log('\n🔍 Checking performance metrics...');
      
      // Check 1: Large components
      console.log('\n1️⃣ Scanning for large components...');
      const componentsPath = path.join(process.cwd(), 'src', 'components');
      const largeComponents: Array<{ name: string; lines: number }> = [];
      
      if (fs.existsSync(componentsPath)) {
        const components = fs.readdirSync(componentsPath).filter(f => f.endsWith('.tsx'));
        
        components.forEach(comp => {
          const content = fs.readFileSync(path.join(componentsPath, comp), 'utf-8');
          const lines = content.split('\n').length;
          
          if (lines > 300) {
            largeComponents.push({ name: comp, lines });
          }
        });
        
        if (largeComponents.length > 0) {
          console.log('  ⚠️  Large components (>300 lines):');
          largeComponents.forEach(c => console.log(`    - ${c.name}: ${c.lines} lines`));
        } else {
          console.log('  ✅ All components under 300 lines');
        }
      }
      
      // Check 2: Missing React.memo
      console.log('\n2️⃣ Checking for memoization...');
      const viewsPath = path.join(process.cwd(), 'src', 'views');
      let unmemoizedComponents = 0;
      
      if (fs.existsSync(viewsPath)) {
        const views = fs.readdirSync(viewsPath).filter(f => f.endsWith('.tsx'));
        
        views.forEach(view => {
          const content = fs.readFileSync(path.join(viewsPath, view), 'utf-8');
          
          // Simple check: has export default but no memo
          if (content.includes('export default') && !content.includes('memo(')) {
            unmemoizedComponents++;
          }
        });
        
        console.log(`  📊 ${unmemoizedComponents} views without memo`);
        
        if (unmemoizedComponents > 0) {
          console.log(`  💡 Consider adding React.memo for performance`);
        }
      }
    },
  },
  
  {
    id: 'summary',
    name: '📊 Generate Summary Report',
    execute: async () => {
      console.log('\n📊 ENTERPRISE IMPROVEMENT SUMMARY\n');
      console.log('='.repeat(60));
      
      console.log('\n✅ Completed Improvements:');
      console.log('  1. Bundle analysis & visualization setup');
      console.log('  2. Enhanced loading components');
      console.log('  3. Route preloading system');
      console.log('  4. Responsive table component');
      console.log('  5. Code splitting verified');
      
      console.log('\n🔄 In Progress:');
      console.log('  1. Context optimization (ProjectContext split)');
      
      console.log('\n📋 Remaining Tasks:');
      console.log('  1. TypeScript error cleanup (731 → <50)');
      console.log('  2. Error boundaries implementation');
      console.log('  3. Form validation standardization');
      console.log('  4. Testing coverage (30% → 70%)');
      console.log('  5. Performance monitoring setup');
      
      console.log('\n' + '='.repeat(60));
      console.log('\n💡 Run specific checks with: npx tsx scripts/enterprise-improve.ts <task-id>');
      console.log('   Available tasks: analyze-bundle, check-env, count-errors, check-mobile,');
      console.log('                    check-tests, check-security, check-performance\n');
    },
  },
];

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run summary by default
    const summaryTask = tasks.find(t => t.id === 'summary');
    if (summaryTask) {
      await summaryTask.execute();
    }
    return;
  }
  
  const taskId = args[0];
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    console.error(`\n❌ Unknown task: ${taskId}\n`);
    console.log('Available tasks:');
    tasks.forEach(t => console.log(`  - ${t.id}: ${t.name}`));
    process.exit(1);
  }
  
  console.log(`\n🚀 Running task: ${task.name}\n`);
  
  try {
    await task.execute();
    console.log(`\n✅ Task completed: ${task.name}\n`);
  } catch (error) {
    console.error(`\n❌ Task failed:`, error);
    process.exit(1);
  }
};

main().catch(console.error);
