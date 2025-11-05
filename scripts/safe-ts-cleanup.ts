/**
 * SAFE TypeScript Cleanup - Phase 1
 * Only removes completely unused imports (no function/variable modifications)
 */

import { Project } from 'ts-morph';
import { execSync } from 'child_process';

console.log('🔧 SAFE TypeScript Cleanup - Phase 1\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Strategy: Remove ONLY unused imports (safe, automated)\n');
console.log('Will NOT modify: variables, parameters, or function bodies\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create ts-morph project
const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: false
});

console.log('📂 Analyzing project files...\n');

// Get all source files in src/ directory
const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');

console.log(`Found ${sourceFiles.length} source files\n`);
console.log('🔍 Scanning for unused imports...\n');

let filesModified = 0;
let importsRemoved = 0;
const modifiedFiles: string[] = [];

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  
  // Skip test files and config files
  if (filePath.includes('.test.') || filePath.includes('.spec.') ||
      filePath.includes('__tests__') || filePath.includes('__mocks__')) {
    continue;
  }
  
  let fileModified = false;
  let fileImportsRemoved = 0;
  
  // Get all import declarations
  const importDeclarations = sourceFile.getImportDeclarations();
  
  for (const importDecl of importDeclarations) {
    // Get named imports
    const namedImports = importDecl.getNamedImports();
    const unusedImports: typeof namedImports = [];
    
    for (const namedImport of namedImports) {
      const importName = namedImport.getName();
      
      // Find all references to this import
      const fullText = sourceFile.getFullText();
      const importNamePattern = new RegExp(`\\b${importName}\\b`, 'g');
      const matches = fullText.match(importNamePattern) || [];
      
      // If only 1 match (the import itself), it's unused
      if (matches.length <= 1) {
        unusedImports.push(namedImport);
      }
    }
    
    // Remove unused imports
    if (unusedImports.length > 0) {
      for (const unusedImport of unusedImports) {
        unusedImport.remove();
        fileModified = true;
        fileImportsRemoved++;
        importsRemoved++;
      }
      
      // Check if we should remove the entire import declaration
      // (do this AFTER removing unused imports)
      if (!importDecl.wasForgotten() &&
          importDecl.getNamedImports().length === 0 &&
          !importDecl.getDefaultImport() &&
          !importDecl.getNamespaceImport()) {
        importDecl.remove();
      }
    }
    
    // Handle default imports (only if import decl still exists)
    if (!importDecl.wasForgotten()) {
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport) {
        const defaultName = defaultImport.getText();
        const fullText = sourceFile.getFullText();
        const defaultPattern = new RegExp(`\\b${defaultName}\\b`, 'g');
        const matches = fullText.match(defaultPattern) || [];
        
        if (matches.length <= 1) {
          // Default import is unused
          if (importDecl.getNamedImports().length === 0 &&
              !importDecl.getNamespaceImport()) {
            importDecl.remove();
            fileModified = true;
            fileImportsRemoved++;
            importsRemoved++;
          }
        }
      }
    }
  }
  
  if (fileModified) {
    // Organize imports (remove duplicates, sort)
    sourceFile.organizeImports();
    
    // Save the file
    sourceFile.saveSync();
    
    filesModified++;
    modifiedFiles.push(filePath);
    console.log(`✅ ${sourceFile.getBaseName()} (${fileImportsRemoved} imports removed)`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Cleanup Complete\n');
console.log(`   Files modified:   ${filesModified}`);
console.log(`   Imports removed:  ${importsRemoved}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (filesModified > 0) {
  console.log('📋 Modified files:\n');
  modifiedFiles.forEach((file, idx) => {
    const relativePath = file.replace(process.cwd(), '').replace(/\\/g, '/');
    console.log(`   ${idx + 1}. ${relativePath}`);
  });
  console.log('');
}

console.log('🔄 Running type check to verify...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Run type check
try {
  execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
  console.log('✅ No TypeScript errors!\n');
} catch (e: any) {
  const output = e.stdout || '';
  const errorLines = output.split('\n').filter((line: string) => line.includes('error TS'));
  console.log(`⚠️  ${errorLines.length} TypeScript errors remaining\n`);
  
  // Count by type
  const ts6133 = errorLines.filter((line: string) => line.includes('TS6133') || line.includes('TS6196'));
  const ts2304 = errorLines.filter((line: string) => line.includes('TS2304'));
  
  console.log(`   TS6133 (unused): ${ts6133.length}`);
  console.log(`   TS2304 (not found): ${ts2304.length}`);
  console.log(`   Other: ${errorLines.length - ts6133.length - ts2304.length}\n`);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 Next Steps:\n');
console.log('   1. Review changes: git diff');
console.log('   2. Test application: npm run dev');
console.log('   3. Run cleanup again if needed');
console.log('   4. For remaining errors, manual review required\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
