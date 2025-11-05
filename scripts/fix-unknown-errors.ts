/**
 * Fix TS18046: 'error' is of type 'unknown'
 * Adds type assertion to error variables in catch blocks
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

console.log('🔧 Fixing unknown error types...\n');

// Get TypeScript errors
let errors: string;
try {
  execSync('npm run type-check', { encoding: 'utf-8', stdio: 'pipe' });
  errors = '';
} catch (e: any) {
  errors = e.stdout || e.stderr || '';
}

// Parse TS18046 errors
const errorRegex = /^(src[\\/][^:]+)[\\/\(](\d+),(\d+)[\):].* error TS18046: ['"]error['"] is of type ['"]unknown['"]/gm;
const fixes = new Map<string, Set<number>>();

let match;
while ((match = errorRegex.exec(errors)) !== null) {
  const file = match[1];
  const line = parseInt(match[2]);
  
  // Skip test files
  if (file.includes('__tests__') || file.includes('__mocks__') || file.includes('.test.') || file.includes('.spec.')) {
    continue;
  }
  
  if (!fixes.has(file)) {
    fixes.set(file, new Set());
  }
  fixes.get(file)!.add(line);
}

console.log(`Found ${fixes.size} files with unknown error types\n`);

let totalFixed = 0;

// Process each file
for (const [filePath, lineNumbers] of fixes) {
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  
  for (const lineNum of lineNumbers) {
    const lineIndex = lineNum - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) continue;
    
    const line = lines[lineIndex];
    
    // Pattern: error.message or error.stack or (error as any)
    // Replace with (error as Error)
    if (line.includes('error.message') || line.includes('error.stack')) {
      // Find catch block and add type
      // Look backwards for catch block
      let catchIndex = -1;
      for (let i = lineIndex; i >= Math.max(0, lineIndex - 10); i--) {
        if (lines[i].includes('catch') && lines[i].includes('error')) {
          catchIndex = i;
          break;
        }
      }
      
      if (catchIndex >= 0) {
        const catchLine = lines[catchIndex];
        // catch (error) -> catch (error: any)
        if (catchLine.includes('catch (error)') || catchLine.includes('catch(error)')) {
          lines[catchIndex] = catchLine.replace(/catch\s*\(\s*error\s*\)/, 'catch (error: any)');
          modified = true;
          totalFixed++;
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`✅ ${filePath.replace(/\\/g, '/')}`);
  }
}

console.log(`\n✅ Total: ${totalFixed} error types fixed\n`);
