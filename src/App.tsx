import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import '@/styles/enterprise-design-system.css';
import MainLayout from '@/components/MainLayout';
import OfflineIndicator from '@/components/OfflineIndicator';
import LiveCursors from '@/components/LiveCursors';
import OnlineUsersDisplay from '@/components/OnlineUsersDisplay';
import FallbackView from '@/components/FallbackView';
import { EnterpriseAuthLoader, EnterpriseProjectLoader } from '@/components/EnterpriseLoaders';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { NavigationDebug } from '@/components/NavigationDebug';
import FailoverStatusIndicator from '@/components/FailoverStatusIndicator';
import { SkipLink } from '@/components/SkipLink';

// Priority 2C: Monitoring & Analytics initialization
import { initializeSentry, setSentryUser, clearSentryUser } from '@/config/sentry.config';
import { initializeGA4, setGA4UserId, trackPageView } from '@/config/ga4.config';

// Eager-loaded components (critical for initial render)
import LoginView from '@/views/LoginView';
import EnterpriseLoginView from '@/views/EnterpriseLoginView';

// Context providers
import { AuthProvider } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { MessageProvider } from '@/contexts/MessageContext';

// Lazy-loaded Views (loaded on demand)
const DashboardView = lazy(() => import('@/views/DashboardView'));
const RabAhspView = lazy(() => import('@/views/RabAhspView'));
const EnhancedRabAhspView = lazy(() => import('@/views/EnhancedRabAhspView'));
const GanttChartView = lazy(() => import('@/views/GanttChartView'));
const DailyReportView = lazy(() => import('@/views/DailyReportView'));
const ProgressView = lazy(() => import('@/views/ProgressView'));
const AttendanceView = lazy(() => import('@/views/AttendanceView'));
const FinanceView = lazy(() => import('@/views/FinanceView'));
const CashflowView = lazy(() => import('@/views/CashflowView'));
const StrategicCostView = lazy(() => import('@/views/StrategicCostView'));
const LogisticsView = lazy(() => import('@/views/LogisticsView'));
const DokumenView = lazy(() => import('@/views/DokumenView'));
const ReportView = lazy(() => import('@/views/ReportView'));
const UserManagementView = lazy(() => import('@/views/UserManagementView'));
const MasterDataView = lazy(() => import('@/views/MasterDataView'));
const AuditTrailView = lazy(() => import('@/views/AuditTrailView'));
const ProfileView = lazy(() => import('@/views/ProfileView'));
const TaskListView = lazy(() => import('@/views/TaskListView'));
const TasksView = lazy(() => import('@/views/TasksView'));
const KanbanBoardView = lazy(() => import('@/views/KanbanBoardView'));
const KanbanView = lazy(() => import('@/views/KanbanView'));
const DependencyGraphView = lazy(() => import('@/views/DependencyGraphView'));
const NotificationCenterView = lazy(() => import('@/views/NotificationCenterView'));
const MonitoringView = lazy(() => import('@/views/MonitoringView'));
const IntegratedAnalyticsView = lazy(() =>
  import('@/views/IntegratedAnalyticsView').then((module) => ({
    default: module.IntegratedAnalyticsView,
  }))
);
const IntelligentDocumentSystem = lazy(() => import('@/views/IntelligentDocumentSystem'));

// Finance & Accounting Module Views (lazy-loaded)
const ChartOfAccountsView = lazy(() => import('@/views/ChartOfAccountsView'));
const JournalEntriesView = lazy(() => import('@/views/JournalEntriesView'));
const AccountsPayableView = lazy(() => import('@/views/AccountsPayableView'));
const AccountsReceivableView = lazy(() => import('@/views/AccountsReceivableView'));

// WBS Module (lazy-loaded)
const WBSManagementView = lazy(() => import('@/views/WBSManagementView'));

// Logistics Module (lazy-loaded)
const GoodsReceiptView = lazy(() => import('@/views/GoodsReceiptView'));
const MaterialRequestView = lazy(() => import('@/views/MaterialRequestView'));
const VendorManagementView = lazy(() => import('@/views/VendorManagementView'));
const InventoryManagementView = lazy(() => import('@/views/InventoryManagementView'));
const IntegrationDashboardView = lazy(() => import('@/views/IntegrationDashboardView'));
const CostControlDashboardView = lazy(() => import('@/views/CostControlDashboardView'));

// Phase 4: AI & Analytics Views (lazy-loaded)
const AIResourceOptimizationView = lazy(() => import('@/views/AIResourceOptimizationView'));
const PredictiveAnalyticsView = lazy(() => import('@/views/PredictiveAnalyticsView'));

// Unauthorized View
const UnauthorizedView = lazy(() => import('@/views/UnauthorizedView'));

import { useProjectCalculations } from '@/hooks/useProjectCalculations';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useActivityTracker } from '@/hooks/useMonitoring';
import { Spinner } from '@/components/Spinner';
import Header from '@/components/Header';
import { IntegrationProvider } from '@/contexts/IntegrationContext';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import {
  RealtimeCollaborationProvider,
  useRealtimeCollaboration,
} from '@/contexts/RealtimeCollaborationContext';
import { monitoringService } from '@/api/monitoringService';
console.log('🔧 monitoringService imported in App.tsx:', monitoringService);
import { failoverManager } from '@/utils/failoverManager';
import { healthMonitor } from '@/utils/healthCheck';
import { useRoutePreload } from '@/hooks/useRoutePreload';
import { logger } from '@/utils/logger.enhanced';

// Lazy-loaded heavy components
const CommandPalette = lazy(() =>
  import('@/components/CommandPalette').then((module) => ({ default: module.CommandPalette }))
);
const AiAssistantChat = lazy(() => import('@/components/AiAssistantChat'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const UserFeedbackWidget = lazy(() => import('@/components/UserFeedbackWidget'));
const AdvancedAnalyticsView = lazy(() => import('@/views/AdvancedAnalyticsView'));
const ChatView = lazy(() => import('@/views/ChatView'));
const CustomReportBuilderView = lazy(() => import('@/views/CustomReportBuilderView'));
const RabApprovalWorkflowView = lazy(() => import('@/views/RabApprovalWorkflowView'));

// Error Boundary Fallback Component
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
        <p className="text-gray-700 mb-4">
          An error occurred while loading the application. This has been reported to our team.
        </p>
        <details className="bg-gray-100 p-4 rounded mb-4 text-sm">
          <summary className="font-medium cursor-pointer">Error details</summary>
          <p className="mt-2 text-red-500">{error.message}</p>
        </details>
        <div className="flex gap-2">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // Toggle with Ctrl+Shift+D
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  // Accessibility features
  // const accessibility = useAccessibility();
  // const { announceToScreenReader } = accessibility;

  const { currentUser, loading: authLoading } = useAuth();
  const { currentProject, loading: projectLoading, error: projectError } = useProject();
  const { updatePresence } = useRealtimeCollaboration();

  // 🔒 Initialize session timeout hook
  useSessionTimeout();

  // 📊 Initialize monitoring hooks
  const { trackActivity } = useActivityTracker();

  const { projectMetrics } = useProjectCalculations(currentProject);

  // 📊 Initialize monitoring service
  useEffect(() => {
    if (currentUser) {
      try {
        logger.info('System monitoring started', {
          userId: currentUser.id,
          interval: 60000,
        });
        monitoringService.startMonitoring(60000); // 1 minute interval

        return () => {
          try {
            monitoringService.stopMonitoring();
            logger.info('System monitoring stopped');
          } catch (err) {
            logger.error('Failed to stop monitoring service', err instanceof Error ? err : new Error(String(err)));
          }
        };
      } catch (err) {
        logger.error('Failed to start monitoring service', err instanceof Error ? err : new Error(String(err)));
      }
    }

    return undefined;
  }, [currentUser]);

  // 🔒 Priority 2C: Initialize Sentry & GA4 on app start
  useEffect(() => {
    try {
      // Initialize Sentry (Error Tracking)
      initializeSentry();
      logger.info('Sentry error tracking initialized');

      // Initialize Google Analytics 4
      initializeGA4();
      logger.info('Google Analytics 4 initialized');
    } catch (err) {
      logger.error('Failed to initialize monitoring services', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  // 👤 Priority 2C: Set user context for Sentry & GA4
  useEffect(() => {
    if (currentUser) {
      try {
        // Set Sentry user context
        setSentryUser({
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.name,
          role: currentUser.roleId,
        });

        // Set GA4 user ID
        setGA4UserId(currentUser.id);

        logger.info('User context set for monitoring', { userId: currentUser.id });
      } catch (err) {
        logger.error('Failed to set user context', err instanceof Error ? err : new Error(String(err)));
      }
    } else {
      // Clear user context on logout
      try {
        clearSentryUser();
        logger.debug('User context cleared');
      } catch (err) {
        logger.error('Failed to clear user context', err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [currentUser]);

  // 📊 Priority 2C: Track page views in GA4
  useEffect(() => {
    if (currentUser) {
      try {
        trackPageView(window.location.pathname, `NataCarePM - ${window.location.pathname}`);
        logger.debug('Page view tracked', { path: window.location.pathname });
      } catch (err) {
        logger.error('Failed to track page view', err instanceof Error ? err : new Error(String(err)), { path: window.location.pathname });
      }
    }
  }, [currentUser]);

  // 🐛 Debug panel keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug((prev) => !prev);
        logger.debug('Debug panel toggled', { enabled: !showDebug });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebug]);

  // Initialize Failover Manager
  useEffect(() => {
    failoverManager.initialize().catch((error) => {
      logger.error('Failover manager initialization failed', error);
    });

    // Start health monitoring (every 60 seconds)
    healthMonitor.start(60000);

    return () => {
      failoverManager.stopHealthMonitoring();
      healthMonitor.stop();
    };
  }, []);

  // Error boundary reset function
  const resetError = () => {
    setHasError(false);
    setError(null);
  };

  // Handle errors
  useEffect(() => {
    if (projectError) {
      logger.error('Project loading error', projectError);
      setError(projectError);
      setHasError(true);
    }
  }, [projectError]);

  // Show error boundary if there's an error
  if (hasError && error) {
    return <ErrorFallback error={error} resetError={resetError} />;
  }

  if (authLoading && !currentUser) {
    return <EnterpriseAuthLoader />;
  }

  if (!currentUser) {
    return <EnterpriseLoginView />;
  }

  if (projectLoading || (!currentProject && !projectError)) {
    return <EnterpriseProjectLoader />;
  }

  if (projectError || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4 text-center">
        <p className="font-bold text-lg mb-2">Gagal Memuat Aplikasi</p>
        <p>
          {projectError?.message ||
            'Tidak dapat memuat data proyek yang diperlukan. Coba muat ulang halaman.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  // Simplified view props - each view will fetch its own data
  const getViewProps = (): any => ({
    project: currentProject,
    projectMetrics: projectMetrics,
    loading: projectLoading,
    error: projectError,
    user: currentUser,
  });

  const viewProps = getViewProps();

  // Wrapper function for CommandPalette navigation
  const handleCommandPaletteNavigate = (viewId: string) => {
    // Map view IDs to routes
    const routeMap: Record<string, string> = {
      dashboard: '/',
      analytics: '/analytics',
      rab_ahsp: '/rab',
      rab_basic: '/rab/basic',
      rab_approval: '/rab/approval',
      jadwal: '/schedule',
      tasks: '/tasks',
      task_list: '/tasks/list',
      kanban: '/tasks/kanban',
      kanban_board: '/tasks/kanban/board',
      dependencies: '/tasks/dependencies',
      notifications: '/notifications',
      monitoring: '/monitoring',
      laporan_harian: '/reports/daily',
      progres: '/reports/progress',
      absensi: '/attendance',
      biaya_proyek: '/finance',
      arus_kas: '/finance/cashflow',
      strategic_cost: '/finance/strategic',
      chart_of_accounts: '/finance/chart-of-accounts',
      journal_entries: '/finance/journal-entries',
      accounts_payable: '/finance/accounts-payable',
      accounts_receivable: '/finance/accounts-receivable',
      wbs_management: '/wbs',
      goods_receipt: '/logistics/goods-receipt',
      material_request: '/logistics/material-request',
      vendor_management: '/logistics/vendor-management',
      inventory_management: '/logistics/inventory',
      integration_dashboard: '/logistics/integration',
      cost_control: '/finance/cost-control',
      logistik: '/logistics',
      dokumen: '/documents',
      documents: '/documents/intelligent',
      laporan: '/reports',
      user_management: '/settings/users',
      master_data: '/settings/master-data',
      audit_trail: '/settings/audit-trail',
      profile: '/profile',
      ai_resource_optimization: '/ai/resource-optimization',
      predictive_analytics: '/ai/predictive-analytics',
      advanced_analytics: '/analytics/advanced',
      chat: '/chat',
      custom_report_builder: '/reports/custom-builder',
    };

    const route = routeMap[viewId] || '/';
    navigate(route);
  };

  return (
    <MainLayout isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}>
      <EnhancedErrorBoundary>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-700">Loading view...</p>
              </div>
            </div>
          }
        >
          <Routes>
            <Route index element={<DashboardView {...viewProps} />} />
            <Route path="/analytics" element={<IntegratedAnalyticsView {...viewProps} />} />
            <Route path="/rab" element={<EnhancedRabAhspView {...viewProps} />} />
            <Route path="/rab/basic" element={<RabAhspView {...viewProps} />} />
            <Route path="/rab/approval" element={<RabApprovalWorkflowView {...viewProps} />} />
            <Route path="/schedule" element={<GanttChartView {...viewProps} />} />
            <Route path="/tasks" element={<TasksView {...viewProps} />} />
            <Route path="/tasks/list" element={<TaskListView {...viewProps} />} />
            <Route path="/tasks/kanban" element={<KanbanView {...viewProps} />} />
            <Route path="/tasks/kanban/board" element={<KanbanBoardView {...viewProps} />} />
            <Route path="/tasks/dependencies" element={<DependencyGraphView {...viewProps} />} />
            <Route path="/notifications" element={<NotificationCenterView {...viewProps} />} />
            <Route path="/monitoring" element={<MonitoringView {...viewProps} />} />
            <Route path="/reports/daily" element={<DailyReportView {...viewProps} />} />
            <Route path="/reports/progress" element={<ProgressView {...viewProps} />} />
            <Route path="/attendance" element={<AttendanceView {...viewProps} />} />
            <Route path="/finance" element={<FinanceView {...viewProps} />} />
            <Route path="/finance/cashflow" element={<CashflowView {...viewProps} />} />
            <Route path="/finance/strategic" element={<StrategicCostView {...viewProps} />} />
            <Route path="/finance/chart-of-accounts" element={<ChartOfAccountsView {...viewProps} />} />
            <Route path="/finance/journal-entries" element={<JournalEntriesView {...viewProps} />} />
            <Route path="/finance/accounts-payable" element={<AccountsPayableView {...viewProps} />} />
            <Route path="/finance/accounts-receivable" element={<AccountsReceivableView {...viewProps} />} />
            <Route path="/wbs" element={<WBSManagementView {...viewProps} />} />
            <Route path="/logistics/goods-receipt" element={<GoodsReceiptView {...viewProps} />} />
            <Route path="/logistics/material-request" element={<MaterialRequestView {...viewProps} />} />
            <Route path="/logistics/vendor-management" element={<VendorManagementView {...viewProps} />} />
            <Route path="/logistics/inventory" element={<InventoryManagementView {...viewProps} />} />
            <Route path="/logistics/integration" element={<IntegrationDashboardView {...viewProps} />} />
            <Route path="/finance/cost-control" element={<CostControlDashboardView {...viewProps} />} />
            <Route path="/logistics" element={<LogisticsView {...viewProps} />} />
            <Route path="/documents" element={<DokumenView {...viewProps} />} />
            <Route path="/documents/intelligent" element={<IntelligentDocumentSystem {...viewProps} />} />
            <Route path="/reports" element={<ReportView {...viewProps} />} />
            <Route path="/settings/users" element={<UserManagementView {...viewProps} />} />
            <Route path="/settings/master-data" element={<MasterDataView {...viewProps} />} />
            <Route path="/settings/audit-trail" element={<AuditTrailView {...viewProps} />} />
            <Route path="/profile" element={<ProfileView {...viewProps} />} />
            <Route path="/ai/resource-optimization" element={<AIResourceOptimizationView {...viewProps} />} />
            <Route path="/ai/predictive-analytics" element={<PredictiveAnalyticsView {...viewProps} />} />
            <Route path="/analytics/advanced" element={<AdvancedAnalyticsView {...viewProps} />} />
            <Route path="/chat" element={<ChatView {...viewProps} />} />
            <Route path="/reports/custom-builder" element={<CustomReportBuilderView {...viewProps} />} />
            
            {/* Unauthorized route */}
            <Route path="/unauthorized" element={<UnauthorizedView />} />
            
            {/* Fallback route for 404s */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500">Page not found</p>
                    <button
                      onClick={() => (window.location.href = '/')}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </EnhancedErrorBoundary>
      
      <Suspense fallback={null}>
        <CommandPalette onNavigate={handleCommandPaletteNavigate} />
      </Suspense>
      <Suspense fallback={null}>
        <AiAssistantChat />
      </Suspense>
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>
      <Suspense fallback={null}>
        <UserFeedbackWidget position="bottom-right" />
      </Suspense>
      <OfflineIndicator />
      <LiveCursors containerId="app-container" showLabels />
      <FailoverStatusIndicator />
      <PerformanceMonitor />

      {/* Debug Panel (Ctrl+Shift+D to toggle) */}
      {showDebug && (
        <NavigationDebug
          currentView={window.location.pathname}
          availableViews={[]} // Will be populated by the route configuration
          userPermissions={currentUser?.roleId ? ['view_dashboard', 'view_rab', 'view_gantt'] : []}
        />
      )}

      {/* Debug Toggle Hint */}
      <div className="fixed bottom-4 left-4 z-40 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs opacity-50 hover:opacity-100 transition-opacity">
        Press <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">Ctrl+Shift+D</kbd> for debug panel
      </div>
    </MainLayout>
  );
}

function App() {
  const { currentUser, loading: authLoading } = useAuth();

  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Error boundary reset function
  const resetError = () => {
    setHasError(false);
    setError(null);
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('App error:', error);
    }
  }, [error]);

  // Show error boundary if there's an error
  if (hasError && error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
          <p className="text-gray-700 mb-4">
            An error occurred while initializing the application.
          </p>
          <details className="bg-gray-100 p-4 rounded mb-4 text-sm">
            <summary className="font-medium cursor-pointer">Error details</summary>
            <p className="mt-2 text-red-500">{error.message}</p>
          </details>
          <div className="flex gap-2">
            <button
              onClick={resetError}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading && !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <RealtimeCollaborationProvider>
      <AuthProvider>
        <ProjectProvider>
          <IntegrationProvider>
            <MessageProvider>
              <EnhancedErrorBoundary>
                <AppContent />
              </EnhancedErrorBoundary>
            </MessageProvider>
          </IntegrationProvider>
        </ProjectProvider>
      </AuthProvider>
    </RealtimeCollaborationProvider>
  );
}

export default App;