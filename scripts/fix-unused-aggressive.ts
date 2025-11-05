/**
 * Aggressive unused import/variable remover
 * Handles multi-line imports and various patterns
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

console.log('🔧 Removing all unused imports/variables...\n');

let errors: string;
try {
  execSync('npm run type-check', { encoding: 'utf-8', stdio: 'pipe' });
  errors = '';
} catch (e: any) {
  errors = e.stdout || e.stderr || '';
}

// Parse unused errors (TS6133, TS6196)
const unusedRegex = /^(src[\\/][^:]+)[\\/\(](\d+),\d+[\):].* error TS(6133|6196): ['"](.+?)['"] is declared but/gm;
const fileIssues = new Map<string, Array<{line: number, name: string}>>();

let match;
while ((match = unusedRegex.exec(errors)) !== null) {
  const file = match[1];
  const line = parseInt(match[2]);
  const name = match[4];
  
  // Skip test files, functions, mobile
  if (file.includes('__tests__') || file.includes('__mocks__') || 
      file.includes('.test.') || file.includes('.spec.') ||
      file.includes('functions/') || file.includes('mobile/')) {
    continue;
  }
  
  if (!fileIssues.has(file)) {
    fileIssues.set(file, []);
  }
  fileIssues.get(file)!.push({line, name});
}

console.log(`Found ${fileIssues.size} files with unused code\n`);

let totalFixed = 0;
let filesFixed = 0;

for (const [filePath, issues] of fileIssues) {
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let lines = content.split('\n');
  let modified = false;
  
  // Group by line number
  const lineMap = new Map<number, string[]>();
  for (const issue of issues) {
    if (!lineMap.has(issue.line)) {
      lineMap.set(issue.line, []);
    }
    lineMap.get(issue.line)!.push(issue.name);
  }
  
  // Process in reverse order to avoid line shifts
  const sortedLines = Array.from(lineMap.keys()).sort((a, b) => b - a);
  
  for (const lineNum of sortedLines) {
    const names = lineMap.get(lineNum)!;
    const lineIndex = lineNum - 1;
    
    if (lineIndex < 0 || lineIndex >= lines.length) continue;
    
    const line = lines[lineIndex].trim();
    
    // Check if this is an import line
    if (line.startsWith('import ') || (lineIndex > 0 && lines[lineIndex-1].trim().startsWith('import '))) {
      // Remove each unused name from imports
      for (const name of names) {
        // Pattern 1: Single line import with this name
        if (line.includes(`import ${name}`) || line.includes(`{ ${name} }`)) {
          const result = removeFromImport(lines, lineIndex, name);
          if (result.modified) {
            lines = result.lines;
            modified = true;
            totalFixed++;
          }
        }
        // Pattern 2: Multi-line import - name on this line
        else if (line === name || line === name + ',') {
          lines.splice(lineIndex, 1);
          modified = true;
          totalFixed++;
        }
      }
    }
  }
  
  if (modified) {
    // Clean up empty import blocks
    lines = cleanupImports(lines);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    filesFixed++;
    console.log(`✅ ${filePath.replace(/\\/g, '/')} (${issues.length} items)`);
  }
}

console.log(`\n✅ Fixed ${filesFixed} files, removed ${totalFixed} unused items\n`);

function removeFromImport(lines: string[], startIndex: number, name: string): {lines: string[], modified: boolean} {
  let modified = false;
  
  // Check current line
  let line = lines[startIndex];
  
  // Single-line import: import { A, B, C } from 'x'
  if (line.includes('{') && line.includes('}')) {
    const newLine = line.replace(new RegExp(`\\b${name}\\s*,?\\s*|,\\s*${name}\\b`), '');
    // Clean up double commas and spaces
    const cleaned = newLine.replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}').replace(/{\s*}/g, '');
    
    if (cleaned.includes('import') && !cleaned.includes('{')) {
      // All imports removed
      lines.splice(startIndex, 1);
      modified = true;
    } else if (cleaned !== line) {
      lines[startIndex] = cleaned;
      modified = true;
    }
  }
  // Multi-line or partial line
  else {
    // Just remove the identifier if it's alone on the line
    if (line.trim() === name || line.trim() === name + ',') {
      lines.splice(startIndex, 1);
      modified = true;
    }
  }
  
  return {lines, modified};
}

function cleanupImports(lines: string[]): string[] {
  const result: string[] = [];
  let skipNext = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    const line = lines[i].trim();
    
    // Skip empty import statements
    if (line === 'import {  } from' || line === 'import {} from' || 
        (line.startsWith('import {') && line.includes('}') && !line.includes(','))) {
      // Check if next line is the from clause
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith('} from')) {
        skipNext = true;
        continue;
      }
    }
    
    result.push(lines[i]);
  }
  
  return result;
}
