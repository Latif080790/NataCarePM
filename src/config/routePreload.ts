/**
 * Route Preloading Configuration
 * Defines which components to preload for each route
 */


import { RoutePreloadConfig } from '@/utils/componentPreloader';

// Import lazy components (will be defined in App.tsx)
export const lazyViews = {
  // Core Views
  dashboard: () => import('@/views/DashboardView'),
  analytics: () => import('@/views/IntegratedAnalyticsView').then((m) => ({ default: m.IntegratedAnalyticsView })),
  rabAhsp: () => import('@/views/EnhancedRabAhspView'),
  rabApproval: () => import('@/views/RabApprovalWorkflowView'), // Adding RAB approval workflow view
  gantt: () => import('@/views/GanttChartView'),
  tasks: () => import('@/views/TasksView'),
  kanban: () => import('@/views/KanbanView'),
  dependencies: () => import('@/views/DependencyGraphView'),
  dailyReport: () => import('@/views/DailyReportView'),
  progress: () => import('@/views/ProgressView'),
  attendance: () => import('@/views/AttendanceView'),
  finance: () => import('@/views/FinanceView'),
  cashflow: () => import('@/views/CashflowView'),
  chartOfAccounts: () => import('@/views/ChartOfAccountsView'),
  journalEntries: () => import('@/views/JournalEntriesView'),
  accountsPayable: () => import('@/views/AccountsPayableView'),
  accountsReceivable: () => import('@/views/AccountsReceivableView'),
  logistics: () => import('@/views/LogisticsView'),
  goodsReceipt: () => import('@/views/GoodsReceiptView'),
  materialRequest: () => import('@/views/MaterialRequestView'),
  vendorManagement: () => import('@/views/VendorManagementView'),
  inventory: () => import('@/views/InventoryManagementView'),
  documents: () => import('@/views/IntelligentDocumentSystem'),
  reports: () => import('@/views/ReportView'),
  custom_report_builder: () => import('@/views/CustomReportBuilderView'),
  userManagement: () => import('@/views/UserManagementView'),
  masterData: () => import('@/views/MasterDataView'),
  auditTrail: () => import('@/views/AuditTrailView'),
  monitoring: () => import('@/views/MonitoringView'),
  profile: () => import('@/views/ProfileView'),

  notifications: () => import('@/views/NotificationCenterView')
};

/**
 * Route preload configuration
 * Defines preloading strategy for each route
 */
export const routePreloadConfig: RoutePreloadConfig[] = [
  {
    route: 'dashboard',
    components: [lazyViews.dashboard, lazyViews.analytics],
    preloadOn: 'immediate', // Critical - load immediately after login
  },
  {
    route: 'rab_ahsp',
    components: [
      lazyViews.rabAhsp,
      lazyViews.gantt, // Often accessed together
    ],
    preloadOn: 'idle',
  },
  {
    route: 'jadwal',
    components: [lazyViews.gantt, lazyViews.tasks, lazyViews.dependencies],
    preloadOn: 'idle',
  },
  {
    route: 'tasks',
    components: [lazyViews.tasks, lazyViews.kanban],
    preloadOn: 'idle',
  },
  {
    route: 'laporan_harian',
    components: [lazyViews.dailyReport, lazyViews.progress],
    preloadOn: 'idle',
  },
  {
    route: 'biaya_proyek',
    components: [lazyViews.finance, lazyViews.cashflow],
    preloadOn: 'idle',
  },
  {
    route: 'logistik',
    components: [lazyViews.logistics, lazyViews.inventory],
    preloadOn: 'idle',
  },
  {
    route: 'dokumen',
    components: [lazyViews.documents],
    preloadOn: 'hover',
  },
  {
    route: 'user_management',
    components: [lazyViews.userManagement, lazyViews.auditTrail],
    preloadOn: 'hover',
  },
];

/**
 * Critical components to preload immediately
 */
export const criticalComponents = [lazyViews.dashboard, lazyViews.profile, lazyViews.notifications];

/**
 * Heavy components to defer loading
 */
export const deferredComponents = [lazyViews.analytics, lazyViews.gantt, lazyViews.documents];

/**
 * Get components to preload based on user role
 */
export function getComponentsForRole(role: string): Array<() => Promise<any>> {
  const roleComponentMap: Record<string, Array<() => Promise<any>>> = {
    'super-admin': [
      lazyViews.dashboard,
      lazyViews.analytics,
      lazyViews.userManagement,
      lazyViews.auditTrail,
      lazyViews.monitoring,
    ],
    admin: [
      lazyViews.dashboard,
      lazyViews.rabAhsp,
      lazyViews.gantt,
      lazyViews.finance,
      lazyViews.userManagement,
    ],
    manager: [
      lazyViews.dashboard,
      lazyViews.analytics,
      lazyViews.rabAhsp,
      lazyViews.gantt,
      lazyViews.finance,
      lazyViews.reports,
    ],
    editor: [lazyViews.dashboard, lazyViews.dailyReport, lazyViews.progress, lazyViews.documents],
    viewer: [lazyViews.dashboard, lazyViews.reports],
  };

  return roleComponentMap[role] || [lazyViews.dashboard];
}

/**
 * Get components to preload based on time of day
 */
export function getComponentsForTimeOfDay(): Array<() => Promise<any>> {
  const hour = new Date().getHours();

  // Morning (6-12): Daily reports, attendance
  if (hour >= 6 && hour < 12) {
    return [lazyViews.dailyReport, lazyViews.attendance, lazyViews.tasks];
  }

  // Afternoon (12-18): Progress, finance
  if (hour >= 12 && hour < 18) {
    return [lazyViews.progress, lazyViews.finance, lazyViews.logistics];
  }

  // Evening/Night (18-6): Reports, analytics
  return [lazyViews.reports, lazyViews.analytics];
}
