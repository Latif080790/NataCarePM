/**
 * Super aggressive cleanup - removes ALL unused imports/variables
 * Production code only (src/api, src/components, src/views, etc.)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

console.log('⚡ SUPER AGGRESSIVE CLEANUP - Production Code Only\n');

let output: string;
try {
  execSync('npm run type-check', { encoding: 'utf-8', stdio: 'pipe' });
  output = '';
} catch (e: any) {
  output = e.stdout || e.stderr || '';
}

// Parse ALL unused (TS6133, TS6196, TS6192)
const lines = output.split('\n');
const fileMap = new Map<string, Array<{line: number, col: number, name: string, type: string}>>();

for (const line of lines) {
  const match = line.match(/^(src[\\/](?:api|components|views|hooks|contexts|utils|services|middleware|security|config)[\\/][^:]+)[\\/\(](\d+),(\d+)[\):].* error (TS6133|TS6196|TS6192): ['"](.+?)['"] is declared but/);
  
  if (match) {
    const file = match[1];
    const lineNum = parseInt(match[2]);
    const col = parseInt(match[3]);
    const type = match[4];
    const name = match[5];
    
    if (!fileMap.has(file)) {
      fileMap.set(file, []);
    }
    fileMap.get(file)!.push({line: lineNum, col, name, type});
  }
}

console.log(`Found ${fileMap.size} files to clean\n`);

let totalRemoved = 0;
let filesModified = 0;

for (const [filePath, issues] of fileMap) {
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let removedCount = 0;
  
  // Sort by line descending to avoid index shifts
  const sorted = [...issues].sort((a, b) => b.line - a.line);
  
  for (const issue of sorted) {
    const lines = content.split('\n');
    const lineIdx = issue.line - 1;
    
    if (lineIdx < 0 || lineIdx >= lines.length) continue;
    
    const line = lines[lineIdx];
    
    // TS6192 - entire import unused
    if (issue.type === 'TS6192' && line.includes('import')) {
      // Remove entire import statement (may span multiple lines)
      let endIdx = lineIdx;
      while (endIdx < lines.length && !lines[endIdx].includes(';') && !lines[endIdx].includes("from")) {
        endIdx++;
      }
      if (lines[endIdx].includes("from")) {
        while (endIdx < lines.length && !lines[endIdx].includes(';')) {
          endIdx++;
        }
      }
      lines.splice(lineIdx, endIdx - lineIdx + 1);
      content = lines.join('\n');
      modified = true;
      removedCount++;
      continue;
    }
    
    // Check if import line
    const isImportContext = line.includes('import') || 
                           (lineIdx > 0 && lines[lineIdx - 1].includes('import')) ||
                           (lineIdx > 1 && lines[lineIdx - 2].includes('import'));
    
    if (isImportContext) {
      // Try to remove from import statement
      const name = issue.name;
      
      // Pattern: import { A, B, C } from 'x'
      if (line.includes('{') && line.includes('}')) {
        const regex = new RegExp(`\\b${escapeRegex(name)}\\s*,?\\s*|,\\s*\\b${escapeRegex(name)}\\b`, 'g');
        const newLine = line.replace(regex, '');
        const cleaned = newLine.replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
        
        // Check if empty
        if (cleaned.match(/{\s*}/)) {
          lines.splice(lineIdx, 1);
        } else if (cleaned !== line) {
          lines[lineIdx] = cleaned;
        }
        content = lines.join('\n');
        modified = true;
        removedCount++;
      }
      // Pattern: just the name on a line (multi-line import)
      else if (line.trim() === name || line.trim() === name + ',' || line.trim().startsWith(name + ',')) {
        lines.splice(lineIdx, 1);
        content = lines.join('\n');
        modified = true;
        removedCount++;
      }
      // Pattern: import X from 'y' (default import)
      else if (line.includes(`import ${name}`)) {
        lines.splice(lineIdx, 1);
        content = lines.join('\n');
        modified = true;
        removedCount++;
      }
    }
  }
  
  if (modified) {
    // Clean up empty lines between imports
    content = content.replace(/\n\n\n+/g, '\n\n');
    fs.writeFileSync(filePath, content, 'utf-8');
    filesModified++;
    totalRemoved += removedCount;
    console.log(`✅ ${filePath.replace(/\\/g, '/')} (${removedCount} removed)`);
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(`⚡ CLEANUP COMPLETE`);
console.log(`${'='.repeat(50)}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Items removed:  ${totalRemoved}`);
console.log(`${'='.repeat(50)}\n`);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
