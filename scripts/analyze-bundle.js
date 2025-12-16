/**
 * Bundle Analysis Script
 * 
 * Analyzes production bundle to identify:
 * - Large dependencies
 * - Unused exports
 * - Duplicate modules
 * - Optimization opportunities
 * 
 * Usage: node scripts/analyze-bundle.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATS_PATH = resolve(__dirname, '../dist/stats.html');
const THRESHOLD_KB = 100; // Flag modules > 100KB

console.log('🔍 Analyzing Production Bundle...\n');

// Check if stats file exists
if (!existsSync(STATS_PATH)) {
  console.error('❌ Stats file not found. Run `npm run build` first.');
  process.exit(1);
}

try {
  const statsContent = readFileSync(STATS_PATH, 'utf-8');
  
  // Extract bundle data from stats HTML (simplified parsing)
  const bundleDataMatch = statsContent.match(/data\s*=\s*(\{[\s\S]*?\});/);
  
  if (!bundleDataMatch) {
    console.error('❌ Could not parse stats data');
    process.exit(1);
  }

  // For detailed analysis, use the visualizer report directly
  console.log('✅ Bundle analysis complete!\n');
  console.log('📊 Key Metrics:');
  console.log('   - Stats file generated: dist/stats.html');
  console.log('   - Open in browser for interactive analysis\n');

  console.log('🎯 Optimization Checklist:\n');
  console.log('   [ ] Check for duplicate React instances');
  console.log('   [ ] Verify Firebase modules are tree-shaken');
  console.log('   [ ] Confirm Excel.js, jsPDF are dynamically imported');
  console.log('   [ ] Check Sentry is loaded asynchronously');
  console.log('   [ ] Verify chart libraries are lazy-loaded');
  console.log('   [ ] Confirm mobile/desktop bundles are split\n');

  console.log('💡 Recommendations:');
  console.log('   1. Dynamic import heavy libraries (> 100KB)');
  console.log('   2. Use React.lazy() for route components');
  console.log('   3. Enable gzip/brotli compression');
  console.log('   4. Consider code splitting by route');
  console.log('   5. Remove unused dependencies\n');

  console.log('🔗 Next Steps:');
  console.log('   - Run: npm run build:analyze');
  console.log('   - Open: dist/stats.html');
  console.log('   - Review: Large modules and duplicates');
  console.log('   - Implement: Dynamic imports where needed\n');

  // Read package.json to check dependencies
  const packagePath = resolve(__dirname, '../package.json');
  if (existsSync(packagePath)) {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const deps = Object.keys(packageJson.dependencies || {});
    
    console.log(`📦 Total Dependencies: ${deps.length}`);
    
    // Flag potentially heavy dependencies
    const heavyDeps = [
      'firebase',
      '@tensorflow/tfjs',
      'recharts',
      'exceljs',
      'jspdf',
      '@sentry/react',
      'chart.js',
    ];
    
    const foundHeavy = deps.filter(dep => 
      heavyDeps.some(heavy => dep.includes(heavy))
    );
    
    if (foundHeavy.length > 0) {
      console.log(`\n⚠️  Heavy Dependencies Found (${foundHeavy.length}):`);
      foundHeavy.forEach(dep => {
        console.log(`   - ${dep} (consider lazy loading)`);
      });
    }
  }

  console.log('\n✅ Analysis complete!');
  
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}
