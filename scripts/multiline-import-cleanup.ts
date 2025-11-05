/**
 * Multi-line import cleaner
 * Specifically handles multi-line import statements
 */

import { Project } from 'ts-morph';
import { execSync } from 'child_process';

console.log('🔧 Multi-line Import Cleanup\n');

// Get errors
let output: string;
try {
  execSync('npm run type-check', { encoding: 'utf-8', stdio: 'pipe' });
  output = '';
} catch (e: any) {
  output = e.stdout || e.stderr || '';
}

// Parse TS6133/TS6196 errors in src production code
const unusedMap = new Map<string, Set<string>>();
const lines = output.split('\n');

for (const line of lines) {
  const match = line.match(/^(src[\\/](?:api|components|views|hooks|contexts|utils|services|middleware|security|config)[\\/][^:]+)[\\/\(]\d+,\d+[\):].* error TS(6133|6196): ['"](.+?)['"] is declared but/);
  
  if (match) {
    const file = match[1];
    const name = match[3];
    
    if (!unusedMap.has(file)) {
      unusedMap.set(file, new Set());
    }
    unusedMap.get(file)!.add(name);
  }
}

console.log(`Found ${unusedMap.size} files with unused imports\n`);

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true
});

let totalFixed = 0;
let filesFixed = 0;

for (const [filePath, unusedNames] of unusedMap) {
  const sourceFile = project.addSourceFileAtPath(filePath);
  let modified = false;
  
  // Get all imports
  const imports = sourceFile.getImportDeclarations();
  
  for (const importDecl of imports) {
    // Check named imports
    const namedImports = importDecl.getNamedImports();
    const toRemove: any[] = [];
    
    for (const namedImport of namedImports) {
      const name = namedImport.getName();
      if (unusedNames.has(name)) {
        toRemove.push(namedImport);
      }
    }
    
    if (toRemove.length > 0) {
      toRemove.forEach(imp => imp.remove());
      modified = true;
      totalFixed += toRemove.length;
    }
    
    // If all named imports removed, remove entire declaration
    if (importDecl.getNamedImports().length === 0 && !importDecl.getDefaultImport()) {
      importDecl.remove();
    }
  }
  
  if (modified) {
    sourceFile.saveSync();
    filesFixed++;
    console.log(`✅ ${filePath.replace(/\\/g, '/')} (${unusedNames.size} items checked)`);
  }
  
  project.removeSourceFile(sourceFile);
}

console.log(`\n${'='.repeat(50)}`);
console.log(`✅ Cleanup Complete`);
console.log(`${'='.repeat(50)}`);
console.log(`Files fixed: ${filesFixed}`);
console.log(`Items removed: ${totalFixed}`);
console.log(`${'='.repeat(50)}\n`);
