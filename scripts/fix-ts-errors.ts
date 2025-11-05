/**
 * TypeScript Error Fixer - Uses TypeScript Compiler API
 * Safely fixes only errors explicitly reported by TypeScript
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TSError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

console.log('🚀 Starting TypeScript Error Fixes...\n');
if (DRY_RUN) {
  console.log('⚠️  DRY RUN MODE - No files will be modified\n');
}

// Get all TypeScript errors
console.log('📊 Analyzing TypeScript errors...\n');
let tscOutput: string;
try {
  execSync('npm run type-check', { encoding: 'utf-8', stdio: 'pipe' });
  tscOutput = '';
} catch (error: any) {
  tscOutput = error.stdout || error.stderr || '';
}

// Parse errors
const errorRegex = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm;
const errors: TSError[] = [];
let match;

while ((match = errorRegex.exec(tscOutput)) !== null) {
  errors.push({
    file: match[1].trim(),
    line: parseInt(match[2]),
    column: parseInt(match[3]),
    code: match[4],
    message: match[5],
  });
}

console.log(`Found ${errors.length} total errors\n`);

// Group errors by file
const errorsByFile = new Map<string, TSError[]>();
errors.forEach(error => {
  // Only process src/ production code
  if (error.file.includes('__tests__') || error.file.includes('__mocks__')) {
    return;
  }
  if (!error.file.startsWith('src/') || error.file.includes('functions/') || error.file.includes('mobile/')) {
    return;
  }
  
  if (!errorsByFile.has(error.file)) {
    errorsByFile.set(error.file, []);
  }
  errorsByFile.get(error.file)!.push(error);
});

console.log(`Processing ${errorsByFile.size} files with fixable errors\n`);

let filesFixed = 0;
let errorsFixed = 0;

// Process each file
for (const [filePath, fileErrors] of errorsByFile) {
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  
  // Sort errors by line number (descending) to avoid line number shifts
  const sortedErrors = [...fileErrors].sort((a, b) => b.line - a.line);
  
  for (const error of sortedErrors) {
    // Only fix safe, well-known errors
    if (error.code === 'TS6133' || error.code === 'TS6196' || error.code === 'TS6192') {
      // These are unused imports/variables
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        
        // TS6192: All imports are unused - remove entire import line
        if (error.code === 'TS6192' && line.trim().startsWith('import')) {
          if (VERBOSE) {
            console.log(`  Removing line ${error.line}: ${line.trim().substring(0, 60)}...`);
          }
          lines.splice(lineIndex, 1);
          modified = true;
          errorsFixed++;
        }
        // TS6133/TS6196: Specific import/variable is unused
        else if ((error.code === 'TS6133' || error.code === 'TS6196') && line.includes('import')) {
          // Extract the unused identifier from the message
          const match = error.message.match(/['"](.+?)['"]/);
          if (match) {
            const unusedName = match[1];
            
            // Remove from named imports { A, B, C }
            if (line.includes('{')) {
              const newLine = removeFromNamedImports(line, unusedName);
              if (newLine !== line) {
                lines[lineIndex] = newLine;
                modified = true;
                errorsFixed++;
                if (VERBOSE) {
                  console.log(`  Fixed line ${error.line}: removed '${unusedName}'`);
                }
              }
            }
            // Remove default import if unused
            else if (line.trim().startsWith('import ' + unusedName)) {
              lines.splice(lineIndex, 1);
              modified = true;
              errorsFixed++;
              if (VERBOSE) {
                console.log(`  Removed line ${error.line}: ${line.trim().substring(0, 60)}...`);
              }
            }
          }
        }
      }
    }
  }
  
  if (modified) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }
    filesFixed++;
    console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 Fix Summary:');
console.log('='.repeat(50));
console.log(`Files fixed:     ${filesFixed}`);
console.log(`Errors fixed:    ${errorsFixed}`);
console.log('='.repeat(50));

console.log('\n✅ Fixes completed!\n');
console.log('🔍 Next steps:');
console.log('   1. Review changes: git diff');
console.log('   2. Run type-check: npm run type-check');
console.log('   3. Test the app: npm run dev');

/**
 * Remove an identifier from named imports line
 * e.g., "import { A, B, C } from 'x'" -> "import { A, C } from 'x'" (removing B)
 */
function removeFromNamedImports(line: string, identifier: string): string {
  // Match named imports
  const match = line.match(/import\s+(\{[^}]+\})/);
  if (!match) return line;
  
  const imports = match[1];
  const items = imports
    .replace('{', '')
    .replace('}', '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s && s !== identifier);
  
  if (items.length === 0) {
    // All imports removed, remove entire line
    return '';
  }
  
  const newImports = `{ ${items.join(', ')} }`;
  return line.replace(/\{[^}]+\}/, newImports);
}
