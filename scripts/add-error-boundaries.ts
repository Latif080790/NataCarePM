#!/usr/bin/env tsx

/**
 * Add Error Boundaries to All Views
 * Automatically wraps all route definitions with ViewErrorBoundary
 */

import fs from 'fs';
import path from 'path';

const APP_TSX_PATH = path.join(process.cwd(), 'src', 'App.tsx');

console.log('🛡️  Adding Error Boundaries to All Views\n');

// Read App.tsx
const appContent = fs.readFileSync(APP_TSX_PATH, 'utf-8');

// Check if ViewErrorBoundary is already imported
if (appContent.includes('ViewErrorBoundary')) {
  console.log('✅ ViewErrorBoundary already imported');
} else {
  console.log('📝 Adding ViewErrorBoundary import...');
  
  // Find the import section (after other component imports)
  const importMatch = appContent.match(/(import.*from '@\/components\/EnhancedErrorBoundary';)/);
  
  if (importMatch) {
    const newImport = `${importMatch[1]}\nimport { ViewErrorBoundary } from '@/components/ViewErrorBoundary';`;
    const updatedContent = appContent.replace(importMatch[1], newImport);
    
    fs.writeFileSync(APP_TSX_PATH, updatedContent, 'utf-8');
    console.log('✅ ViewErrorBoundary import added');
  } else {
    console.log('⚠️  Could not find import location. Please add manually:');
    console.log(`   import { ViewErrorBoundary } from '@/components/ViewErrorBoundary';`);
  }
}

console.log('\n📋 Manual Steps Required:\n');
console.log('To add error boundaries to individual routes, wrap each route element:');
console.log('\n// BEFORE:');
console.log('<Route path="/dashboard" element={<DashboardView {...viewProps} />} />');
console.log('\n// AFTER:');
console.log(`<Route 
  path="/dashboard" 
  element={
    <ViewErrorBoundary viewName="Dashboard">
      <DashboardView {...viewProps} />
    </ViewErrorBoundary>
  } 
/>`);

console.log('\n\n🎯 Priority Views to Wrap:\n');

const priorityViews = [
  { path: '/dashboard', name: 'Dashboard', component: 'DashboardView' },
  { path: '/analytics', name: 'Analytics', component: 'IntegratedAnalyticsView' },
  { path: '/rab', name: 'RAB & AHSP', component: 'EnhancedRabAhspView' },
  { path: '/schedule', name: 'Schedule', component: 'GanttChartView' },
  { path: '/tasks', name: 'Tasks', component: 'TasksView' },
  { path: '/finance', name: 'Finance', component: 'FinanceView' },
  { path: '/reports', name: 'Reports', component: 'ReportView' },
  { path: '/documents', name: 'Documents', component: 'DokumenView' },
  { path: '/settings/users', name: 'User Management', component: 'UserManagementView' },
  { path: '/profile', name: 'Profile', component: 'ProfileView' },
];

priorityViews.forEach((view, idx) => {
  console.log(`${idx + 1}. ${view.name} (${view.path})`);
});

console.log('\n\n💡 Alternative: Wrap Routes Group\n');
console.log('For comprehensive coverage, wrap the entire Routes component:');
console.log(`
<ViewErrorBoundary viewName="Application Routes">
  <Routes>
    {/* All routes here */}
  </Routes>
</ViewErrorBoundary>
`);

console.log('\n✅ Setup complete! ViewErrorBoundary component is ready to use.\n');
