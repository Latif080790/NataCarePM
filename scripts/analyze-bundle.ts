#!/usr/bin/env tsx

/**
 * Bundle Analyzer Script
 * Analyzes the production build to identify optimization opportunities
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Building production bundle...\n');

try {
  // Build the project
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Build complete!');
  console.log('\n📊 Analyzing bundle...\n');
  
  // Read the dist folder
  const distPath = path.join(process.cwd(), 'dist');
  const assetsPath = path.join(distPath, 'assets');
  
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ No assets folder found. Build may have failed.');
    process.exit(1);
  }
  
  const files = fs.readdirSync(assetsPath);
  
  let totalSize = 0;
  const fileStats: { name: string; size: number; type: string }[] = [];
  
  files.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    totalSize += sizeKB;
    
    let type = 'other';
    if (file.includes('vendor')) type = 'vendor';
    else if (file.includes('firebase')) type = 'firebase';
    else if (file.includes('tensorflow')) type = 'tensorflow';
    else if (file.includes('react')) type = 'react';
    else if (file.includes('views')) type = 'views';
    else if (file.includes('index')) type = 'main';
    else if (file.endsWith('.css')) type = 'css';
    
    fileStats.push({ name: file, size: sizeKB, type });
  });
  
  // Sort by size
  fileStats.sort((a, b) => b.size - a.size);
  
  // Print results
  console.log('📦 Bundle Analysis:');
  console.log('=' .repeat(80));
  console.log(`${'File'.padEnd(50)} ${'Size'.padStart(15)} ${'Type'.padStart(15)}`);
  console.log('-'.repeat(80));
  
  fileStats.forEach(({ name, size, type }) => {
    const displayName = name.length > 47 ? name.substring(0, 44) + '...' : name;
    const sizeStr = size < 1024 
      ? `${size.toFixed(2)} KB`
      : `${(size / 1024).toFixed(2)} MB`;
    
    // Color coding
    let color = '';
    if (size > 500) color = '\x1b[31m'; // Red for > 500KB
    else if (size > 200) color = '\x1b[33m'; // Yellow for > 200KB
    else color = '\x1b[32m'; // Green
    
    console.log(
      `${displayName.padEnd(50)} ${color}${sizeStr.padStart(15)}\x1b[0m ${type.padStart(15)}`
    );
  });
  
  console.log('-'.repeat(80));
  console.log(`${'TOTAL'.padEnd(50)} ${(totalSize / 1024).toFixed(2)} MB`);
  console.log('=' .repeat(80));
  
  // Summary by type
  const typeStats = fileStats.reduce((acc, file) => {
    if (!acc[file.type]) acc[file.type] = 0;
    acc[file.type] += file.size;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📊 Size by Type:');
  Object.entries(typeStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, size]) => {
      const sizeStr = size < 1024 
        ? `${size.toFixed(2)} KB`
        : `${(size / 1024).toFixed(2)} MB`;
      const percentage = ((size / totalSize) * 100).toFixed(1);
      console.log(`  ${type.padEnd(15)}: ${sizeStr.padStart(12)} (${percentage}%)`);
    });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (totalSize > 2048) {
    console.log('  ⚠️  Total bundle size > 2MB. Consider:');
    console.log('     - Implementing more aggressive code splitting');
    console.log('     - Lazy loading heavy components');
    console.log('     - Removing unused dependencies');
  }
  
  const largeFiles = fileStats.filter(f => f.size > 500);
  if (largeFiles.length > 0) {
    console.log(`  ⚠️  ${largeFiles.length} files > 500KB:`);
    largeFiles.forEach(f => {
      console.log(`     - ${f.name}: ${(f.size / 1024).toFixed(2)} MB`);
    });
  }
  
  console.log('\n✅ Analysis complete!');
  console.log(`📁 Detailed report: ${path.join(distPath, 'stats.html')}`);
  
} catch (error) {
  console.error('❌ Error during analysis:', error);
  process.exit(1);
}
