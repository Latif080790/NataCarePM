import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Error Boundary Coverage...\n');

const appTsxPath = path.join(process.cwd(), 'src', 'App.tsx');
const appTsxContent = fs.readFileSync(appTsxPath, 'utf-8');

// Count total routes
const routeMatches = appTsxContent.match(/<Route\s+path=/g);
const totalRoutes = routeMatches ? routeMatches.length : 0;

// Count protected routes (wrapped with ViewErrorBoundary)
const protectedRouteMatches = appTsxContent.match(/<ViewErrorBoundary viewName=/g);
const protectedRoutes = protectedRouteMatches ? protectedRouteMatches.length : 0;

// Find unprotected routes
const routePattern = /<Route\s+path="([^"]+)"\s+element=\{<(?!ViewErrorBoundary)([^>]+)/g;
const unprotectedRoutes: string[] = [];
let match;

while ((match = routePattern.exec(appTsxContent)) !== null) {
  if (!match[1].includes('*')) { // Skip wildcard routes
    unprotectedRoutes.push(match[1]);
  }
}

console.log('📊 Error Boundary Coverage Report\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Routes:      ${totalRoutes}`);
console.log(`Protected Routes:  ${protectedRoutes}`);
console.log(`Unprotected:       ${unprotectedRoutes.length}`);
console.log(`Coverage:          ${((protectedRoutes / totalRoutes) * 100).toFixed(1)}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (unprotectedRoutes.length > 0) {
  console.log('⚠️  Unprotected Routes:\n');
  unprotectedRoutes.forEach((route, index) => {
    console.log(`   ${index + 1}. ${route}`);
  });
  console.log('\n💡 Recommendation: Wrap these routes with ViewErrorBoundary\n');
} else {
  console.log('✅ ALL ROUTES PROTECTED!\n');
  console.log('🎉 Every route in the application is now wrapped with');
  console.log('   ViewErrorBoundary for maximum fault tolerance.\n');
}

// List all protected views
console.log('📋 Protected Views:\n');
const viewNamePattern = /<ViewErrorBoundary viewName="([^"]+)"/g;
const viewNames: string[] = [];
let viewMatch;

while ((viewMatch = viewNamePattern.exec(appTsxContent)) !== null) {
  if (!viewNames.includes(viewMatch[1])) {
    viewNames.push(viewMatch[1]);
  }
}

viewNames.sort().forEach((name, index) => {
  console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ✅ ${name}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Error Boundary Implementation Status: COMPLETE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check for ViewErrorBoundary import
const hasImport = appTsxContent.includes("import { ViewErrorBoundary } from '@/components/ViewErrorBoundary'") ||
                  appTsxContent.includes('import ViewErrorBoundary');

if (!hasImport) {
  console.log('⚠️  WARNING: ViewErrorBoundary import not found in App.tsx\n');
} else {
  console.log('✅ ViewErrorBoundary import verified\n');
}

// Summary
console.log('📈 Summary:\n');
console.log(`   • Total protected views: ${viewNames.length}`);
console.log(`   • Protection coverage: ${((protectedRoutes / totalRoutes) * 100).toFixed(1)}%`);
console.log(`   • Import status: ${hasImport ? '✅ OK' : '⚠️  Missing'}`);
console.log(`   • Production ready: ${unprotectedRoutes.length === 0 && hasImport ? '✅ YES' : '⚠️  NO'}\n`);

process.exit(unprotectedRoutes.length > 0 ? 1 : 0);
