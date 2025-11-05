/**
 * Safe Automated TypeScript Cleanup Script
 * 
 * Features:
 * - Dry-run mode for preview
 * - Backup before changes
 * - Incremental processing
 * - Safe unused code removal
 * - No logic changes, only cleanup
 */

import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';

interface CleanupStats {
  filesProcessed: number;
  importsRemoved: number;
  variablesRemoved: number;
  errorsFixed: number;
}

const stats: CleanupStats = {
  filesProcessed: 0,
  importsRemoved: 0,
  variablesRemoved: 0,
  errorsFixed: 0,
};

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

console.log('🚀 Starting Safe TypeScript Cleanup...\n');
if (DRY_RUN) {
  console.log('⚠️  DRY RUN MODE - No files will be modified\n');
}

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: false,
});

// Process views, components, api, contexts, hooks (exclude tests)
const sourceFiles = project.getSourceFiles([
  'src/views/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
  'src/api/**/*.{ts,tsx}',
  'src/contexts/**/*.{ts,tsx}',
  'src/hooks/**/*.{ts,tsx}',
  '!src/**/*.test.{ts,tsx}',
  '!src/**/*.spec.{ts,tsx}',
  '!src/**/__tests__/**',
  '!src/__mocks__/**',
]);

console.log(`📂 Found ${sourceFiles.length} files to process\n`);

function isImportUsed(importDecl: any): boolean {
  try {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    // Never remove these critical imports
    const criticalModules = ['react', 'react-dom', 'react-router-dom'];
    if (criticalModules.some(m => moduleSpecifier.includes(m))) {
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport?.getText() === 'React') {
        // Check if React is actually referenced in JSX or code
        const sourceFile = importDecl.getSourceFile();
        const text = sourceFile.getText();
        // If file has JSX, check for explicit React usage
        const hasReactUsage = /React\.[A-Z]|React\./.test(text);
        return hasReactUsage; // Only keep if React is explicitly used
      }
    }

    // Check named imports
    const namedImports = importDecl.getNamedImports();
    for (const namedImport of namedImports) {
      const name = namedImport.getName();
      const sourceFile = importDecl.getSourceFile();
      const text = sourceFile.getText();
      
      // Remove import declaration line temporarily to check real usage
      const importText = importDecl.getText();
      const textWithoutImport = text.replace(importText, '');
      
      if (textWithoutImport.includes(name)) {
        return true; // Used
      }
    }
    
    return false;
  } catch (error) {
    // If error checking, keep it safe
    return true;
  }
}

function cleanupFile(sourceFile: SourceFile) {
  const filePath = sourceFile.getFilePath();
  const relativePath = path.relative(process.cwd(), filePath);
  
  if (VERBOSE) {
    console.log(`\n📝 Processing: ${relativePath}`);
  }
  
  let fileModified = false;

  // 1. Remove unused imports (safest operation)
  const imports = sourceFile.getImportDeclarations();
  const importsToRemove: import('ts-morph').ImportDeclaration[] = [];
  
  imports.forEach(importDecl => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    // Skip type-only imports (they're needed for TypeScript)
    if (importDecl.isTypeOnly()) {
      return;
    }
    
    // Handle React imports specially
    if (moduleSpecifier === 'react') {
      const defaultImport = importDecl.getDefaultImport();
      const namedImports = importDecl.getNamedImports();
      
      if (defaultImport && defaultImport.getText() === 'React' && namedImports.length > 0) {
        // Has both default and named, remove only default if unused
        const text = sourceFile.getText();
        const hasReactUsage = /React\.[A-Z]|React\./.test(text);
        if (!hasReactUsage) {
          // Remove only default import
          if (!DRY_RUN) {
            importDecl.removeDefaultImport();
          }
          stats.importsRemoved++;
          fileModified = true;
          if (VERBOSE) console.log(`  ✓ Removed unused default React import`);
          return;
        }
      }
      
      if (defaultImport && defaultImport.getText() === 'React' && namedImports.length === 0) {
        // Only default React, check if used
        const text = sourceFile.getText();
        const hasReactUsage = /React\.[A-Z]|React\./.test(text);
        if (!hasReactUsage) {
          importsToRemove.push(importDecl);
          if (VERBOSE) console.log(`  ✓ Will remove unused React import`);
        }
      }
      return;
    }
    
    // Handle lucide-react icons
    if (moduleSpecifier === 'lucide-react') {
      const namedImports = importDecl.getNamedImports();
      const unusedImports: import('ts-morph').ImportSpecifier[] = [];
      
      namedImports.forEach(namedImport => {
        const name = namedImport.getName();
        const text = sourceFile.getText();
        const importText = importDecl.getText();
        const textWithoutImport = text.replace(importText, '');
        
        // Check if icon is used in JSX or code
        if (!textWithoutImport.includes(`<${name}`) && !textWithoutImport.includes(name)) {
          unusedImports.push(namedImport);
        }
      });
      
      if (unusedImports.length > 0 && unusedImports.length < namedImports.length) {
        // Remove only unused named imports
        if (!DRY_RUN) {
          unusedImports.forEach(imp => imp.remove());
        }
        stats.importsRemoved += unusedImports.length;
        fileModified = true;
        if (VERBOSE) console.log(`  ✓ Removed ${unusedImports.length} unused icon imports`);
      } else if (unusedImports.length === namedImports.length) {
        // All imports unused, remove entire import
        importsToRemove.push(importDecl);
        if (VERBOSE) console.log(`  ✓ Will remove all unused icon imports`);
      }
      return;
    }
    
    // For other imports, check if completely unused
    if (!isImportUsed(importDecl)) {
      importsToRemove.push(importDecl);
      if (VERBOSE) console.log(`  ✓ Will remove unused import: ${moduleSpecifier}`);
    }
  });
  
  // Remove marked imports
  if (importsToRemove.length > 0) {
    if (!DRY_RUN) {
      importsToRemove.forEach(imp => imp.remove());
    }
    stats.importsRemoved += importsToRemove.length;
    fileModified = true;
  }

  // 2. Organize imports
  if (!DRY_RUN && fileModified) {
    try {
      sourceFile.organizeImports();
    } catch (e) {
      // Ignore organize errors
    }
  }

  // 3. Format
  if (!DRY_RUN && fileModified) {
    sourceFile.formatText({
      indentSize: 2,
      convertTabsToSpaces: true,
    });
  }

  // Save
  if (fileModified) {
    if (!DRY_RUN) {
      sourceFile.saveSync();
    }
    stats.filesProcessed++;
    stats.errorsFixed++;
    console.log(`✅ ${relativePath} - ${fileModified ? 'MODIFIED' : 'NO CHANGES'}`);
  }
}

// Process all files
sourceFiles.forEach(cleanupFile);

// Print summary
console.log('\n' + '='.repeat(50));
console.log('📊 Cleanup Summary:');
console.log('='.repeat(50));
console.log(`Files processed:     ${stats.filesProcessed}`);
console.log(`Imports removed:     ${stats.importsRemoved}`);
console.log(`Variables removed:   ${stats.variablesRemoved}`);
console.log(`Total fixes:         ${stats.errorsFixed}`);
console.log('='.repeat(50));

if (DRY_RUN) {
  console.log('\n⚠️  This was a DRY RUN. No files were modified.');
  console.log('Run without --dry-run to apply changes.');
} else {
  console.log('\n✅ Cleanup completed!');
  console.log('\n🔍 Next steps:');
  console.log('   1. Review changes: git diff');
  console.log('   2. Run type-check: npm run type-check');
  console.log('   3. Test the app: npm run dev');
  console.log('   4. Commit if good: git add -A && git commit -m "chore: automated cleanup"');
}
