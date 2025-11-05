/**
 * Simple unused import remover
 * Just removes lines that TypeScript reports as unused imports
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

console.log('🔧 Removing unused imports...\n');

// Get TypeScript errors
let errors: string;
try {
  execSync('npm run type-check', { encoding: 'utf-8', stdio: 'pipe' });
  errors = '';
} catch (e: any) {
  errors = e.stdout || e.stderr || '';
}

// Parse TS6133 and TS6196 errors (unused)
const unusedImportRegex = /^(src[\\/][^:]+)[\\/\(](\d+)[,:]\d+[\):].* error TS(6133|6196): ['"](.+?)['"] is declared but/gm;
const fixes = new Map<string, Set<number>>();
const names = new Map<string, Map<number, string>>();

let match;
while ((match = unusedImportRegex.exec(errors)) !== null) {
  const file = match[1];
  const line = parseInt(match[2]);
  const identifier = match[4];
  
  // Skip test files
  if (file.includes('__tests__') || file.includes('__mocks__') || file.includes('.test.') || file.includes('.spec.')) {
    continue;
  }
  
  if (!fixes.has(file)) {
    fixes.set(file, new Set());
    names.set(file, new Map());
  }
  fixes.get(file)!.add(line);
  names.get(file)!.set(line, identifier);
}

console.log(`Found ${fixes.size} files with unused imports\n`);

let totalFixed = 0;

// Process each file
for (const [filePath, lineNumbers] of fixes) {
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const sortedLines = Array.from(lineNumbers).sort((a, b) => b - a); // Descending
  let modified = false;
  
  for (const lineNum of sortedLines) {
    const lineIndex = lineNum - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) continue;
    
    const line = lines[lineIndex];
    const identifier = names.get(filePath)!.get(lineNum) || '';
    
    // If entire line is just this import, remove it
    if (line.trim() === `import ${identifier};` || 
        line.trim() === `import { ${identifier} } from`) {
      lines.splice(lineIndex, 1);
      modified = true;
      totalFixed++;
      continue;
    }
    
    // If it's in a named import list
    if (line.includes('{') && line.includes('}') && line.includes(identifier)) {
      // Single line named imports
      const newLine = removeFromImports(line, identifier);
      if (newLine !== line) {
        if (newLine.trim() === '') {
          lines.splice(lineIndex, 1);
        } else {
          lines[lineIndex] = newLine;
        }
        modified = true;
        totalFixed++;
      }
    }
    // If it's a simple identifier in a multi-line import or destructure
    else if (line.trim() === identifier + ',' || line.trim() === identifier) {
      // Check if next line exists and previous line has 'import' or '{'
      const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : '';
      if (prevLine.includes('import') || prevLine.includes('{')) {
        lines.splice(lineIndex, 1);
        modified = true;
        totalFixed++;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`✅ ${filePath.replace(/\\/g, '/')} (${lineNumbers.size} fixes)`);
  }
}

console.log(`\n✅ Total: ${totalFixed} unused imports removed\n`);

function removeFromImports(line: string, identifier: string): string {
  // Remove identifier from { A, B, C }
  const importMatch = line.match(/\{([^}]+)\}/);
  if (!importMatch) return line;
  
  const imports = importMatch[1]
    .split(',')
    .map(s => s.trim())
    .filter(s => s && s !== identifier);
  
  if (imports.length === 0) {
    return ''; // Remove entire line
  }
  
  const newImports = `{ ${imports.join(', ')} }`;
  return line.replace(/\{[^}]+\}/, newImports);
}
