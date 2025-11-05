/**
 * Comprehensive TypeScript Cleanup
 * Handles unused variables, imports, and parameters across ALL source files
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('🔧 Comprehensive TypeScript Cleanup\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Run type check
let output: string;
try {
  execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
  output = '';
  console.log('✅ No TypeScript errors found!\n');
  process.exit(0);
} catch (e: any) {
  output = e.stdout || '';
}

// Parse errors
const lines = output.split('\n');
const errorMap = new Map<string, Array<{
  line: number;
  col: number;
  name: string;
  code: string;
  fullLine: string;
}>>();

let totalErrors = 0;
let ts6133Count = 0;
let ts2304Count = 0;
let otherCount = 0;

for (const line of lines) {
  // Match: filepath(line,col): error TSXXXX: message
  const match = line.match(/^([^(]+)\((\d+),(\d+)\): error (TS\d+): ['"]?([^'"]+?)['"]? is declared but/);
  
  if (match) {
    const filePath = match[1].trim();
    const lineNum = parseInt(match[2]);
    const col = parseInt(match[3]);
    const code = match[4];
    const name = match[5];
    
    if (!errorMap.has(filePath)) {
      errorMap.set(filePath, []);
    }
    
    errorMap.get(filePath)!.push({
      line: lineNum,
      col,
      name,
      code,
      fullLine: line
    });
    
    totalErrors++;
    if (code === 'TS6133' || code === 'TS6196' || code === 'TS6192') {
      ts6133Count++;
    }
  } else if (line.includes('error TS2304')) {
    ts2304Count++;
    totalErrors++;
  } else if (line.includes('error TS')) {
    otherCount++;
    totalErrors++;
  }
}

console.log('📊 Error Analysis:\n');
console.log(`   Total errors:     ${totalErrors}`);
console.log(`   TS6133 (unused):  ${ts6133Count} ⚡ Can be fixed`);
console.log(`   TS2304 (not found): ${ts2304Count} ⚠️  Need review`);
console.log(`   Other errors:     ${otherCount}\n`);
console.log(`   Files to clean:   ${errorMap.size}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (errorMap.size === 0) {
  console.log('✅ No fixable errors found!\n');
  process.exit(0);
}

console.log('🔧 Starting cleanup...\n');

let filesModified = 0;
let itemsRemoved = 0;
const modifiedFiles: string[] = [];

for (const [filePath, errors] of errorMap) {
  // Skip if file doesn't exist or is not in our project
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    continue;
  }
  
  // Skip test files and config files for now
  if (filePath.includes('.test.') || filePath.includes('.spec.') || 
      filePath.includes('vite.config') || filePath.includes('eslint.config')) {
    console.log(`⏭️  Skipping ${filePath} (test/config file)`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let modified = false;
  let removedCount = 0;
  
  // Group errors by line for better handling
  const errorsByLine = new Map<number, typeof errors>();
  for (const error of errors) {
    if (!errorsByLine.has(error.line)) {
      errorsByLine.set(error.line, []);
    }
    errorsByLine.get(error.line)!.push(error);
  }
  
  // Sort lines in descending order to avoid index shifts
  const sortedLines = Array.from(errorsByLine.keys()).sort((a, b) => b - a);
  
  for (const lineNum of sortedLines) {
    const lineErrors = errorsByLine.get(lineNum)!;
    const lines = content.split('\n');
    const lineIdx = lineNum - 1;
    
    if (lineIdx < 0 || lineIdx >= lines.length) continue;
    
    const line = lines[lineIdx];
    
    for (const error of lineErrors) {
      const name = error.name;
      
      // Handle import statements
      if (line.includes('import')) {
        // Case 1: import { X } from 'y'
        if (line.includes('{') && line.includes('}')) {
          const beforeBrace = line.indexOf('{');
          const afterBrace = line.indexOf('}');
          const imports = line.substring(beforeBrace + 1, afterBrace);
          const importList = imports.split(',').map(s => s.trim()).filter(s => s && s !== name);
          
          if (importList.length === 0) {
            // Remove entire import line
            lines.splice(lineIdx, 1);
            modified = true;
            removedCount++;
          } else {
            // Remove just this import
            lines[lineIdx] = line.substring(0, beforeBrace + 1) + ' ' + importList.join(', ') + ' ' + line.substring(afterBrace);
            modified = true;
            removedCount++;
          }
        }
        // Case 2: import X from 'y'
        else if (line.includes(`import ${name}`)) {
          lines.splice(lineIdx, 1);
          modified = true;
          removedCount++;
        }
      }
      // Handle variable declarations
      else if (line.includes('const ') || line.includes('let ') || line.includes('var ')) {
        // Try to comment out the line instead of removing (safer)
        if (!line.trim().startsWith('//')) {
          lines[lineIdx] = '// ' + line + ' // Unused variable';
          modified = true;
          removedCount++;
        }
      }
      // Handle function parameters
      else if (line.includes('=>') || line.includes('function') || line.includes('(')) {
        // Prefix with underscore to indicate intentionally unused
        const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'g');
        if (!name.startsWith('_')) {
          lines[lineIdx] = line.replace(regex, `_${name}`);
          modified = true;
          removedCount++;
        }
      }
    }
    
    content = lines.join('\n');
  }
  
  // Clean up multiple blank lines
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    filesModified++;
    itemsRemoved += removedCount;
    modifiedFiles.push(filePath);
    console.log(`✅ ${path.relative(process.cwd(), filePath)} (${removedCount} fixes)`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Cleanup Complete\n');
console.log(`   Files modified:   ${filesModified}`);
console.log(`   Items fixed:      ${itemsRemoved}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (filesModified > 0) {
  console.log('📋 Modified files:\n');
  modifiedFiles.forEach((file, idx) => {
    console.log(`   ${idx + 1}. ${path.relative(process.cwd(), file)}`);
  });
  console.log('');
}

console.log('🔄 Running type check again to verify...\n');

try {
  execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'inherit' });
  console.log('\n✅ Type check passed!\n');
} catch (e) {
  console.log('\n⚠️  Some errors remain. Run again or fix manually.\n');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
