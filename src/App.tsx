import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { EnterpriseProjectLoader } from '@/components/EnterpriseLoaders';
import LiveCursors from '@/components/LiveCursors';
import MainLayout from '@/components/MainLayout';
import OfflineIndicator from '@/components/OfflineIndicator';
import { ViewErrorBoundary } from '@/components/ViewErrorBoundary';
import '@/styles/enterprise-design-system.css';
import '@/styles/mobile-responsive.css';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, Outlet } from 'react-router-dom';

import FailoverStatusIndicator from '@/components/FailoverStatusIndicator';
import { SuspenseWithErrorBoundary } from '@/components/SuspenseWithErrorBoundary';

// Priority 2C: Monitoring & Analytics initialization
import { initializeGA4, setGA4UserId, trackPageView } from '@/config/ga4.config';
// Sentry loaded dynamically to reduce initial bundle size
// import { clearSentryUser, initializeSentry, setSentryUser } from '@/config/sentry.config';
import { trackPushNotification } from '@/utils/mobileAnalytics';

// Eager-loaded components (critical for initial render)
import EnterpriseLoginView from '@/views/EnterpriseLoginView';

// Context providers

import { ProjectProvider } from '@/contexts/ProjectContext';


// Lazy-loaded Views (loaded on demand) - Only views actually used in Routes
const DashboardView = lazy(() => import('@/views/DashboardWrapper'));
const EnhancedAuditLogView = lazy(() => import('@/views/EnhancedAuditLogView'));
const AuditTestingView = lazy(() => import('@/views/AuditTestingView'));
const IPRestrictionTestView = lazy(() => import('@/views/IPRestrictionTestView'));

// Logistics & Supply Chain Views
const VendorManagementView = lazy(() => import('@/views/VendorManagementView'));
const MaterialRequestView = lazy(() => import('@/views/MaterialRequestView'));
const GoodsReceiptView = lazy(() => import('@/views/GoodsReceiptView'));
const InventoryManagementView = lazy(() => import('@/views/InventoryManagementView'));

// Planning & Scheduling Views
const WBSManagementView = lazy(() => import('@/views/WBSManagementView'));
const GanttChartView = lazy(() => import('@/views/GanttChartView'));
const TasksView = lazy(() => import('@/views/TasksViewPro'));
const KanbanView = lazy(() => import('@/views/KanbanView'));
const DependencyGraphView = lazy(() => import('@/views/DependencyGraphView'));
const ResourceAllocationView = lazy(() => import('@/views/ResourceAllocationView'));

// Cost & Finance Views
const EnhancedRabAhspView = lazy(() => import('@/views/EnhancedRabAhspView'));
const RabApprovalWorkflowView = lazy(() => import('@/views/RabApprovalWorkflowView'));
const CostControlDashboardView = lazy(() => import('@/views/CostControlDashboardView'));
const ChartOfAccountsView = lazy(() => import('@/views/ChartOfAccountsView'));
const JournalEntriesView = lazy(() => import('@/views/JournalEntriesView'));
const AccountsPayableView = lazy(() => import('@/views/AccountsPayableView'));
const AccountsReceivableView = lazy(() => import('@/views/AccountsReceivableView'));

// Analytics & AI Views
const AdvancedAnalyticsView = lazy(() => import('@/views/AdvancedAnalyticsView'));
const PredictiveAnalyticsView = lazy(() => import('@/views/PredictiveAnalyticsView'));
const AIResourceOptimizationView = lazy(() => import('@/views/AIResourceOptimizationView'));
const IntegratedAnalyticsView = lazy(() => 
  import('@/views/IntegratedAnalyticsView').then(module => ({
    default: module.IntegratedAnalyticsView
  }))
);

// Monitoring & Reports Views
const MonitoringView = lazy(() => import('@/views/MonitoringViewPro'));
const ReportsViewPro = lazy(() => import('@/views/ReportsViewPro'));
const DailyReportView = lazy(() => import('@/views/DailyReportView'));
const CustomReportBuilderView = lazy(() => import('@/views/CustomReportBuilderView'));
const ProgressView = lazy(() => import('@/views/ProgressView'));

// Timeline & Resource Views
const TimelineTrackingView = lazy(() => import('@/views/TimelineTrackingView'));

// Finance Views
const FinanceViewPro = lazy(() => import('@/views/FinanceViewPro'));
const CashflowView = lazy(() => import('@/views/CashflowView'));
const StrategicCostView = lazy(() => import('@/views/StrategicCostView'));

// Logistics Views
const LogisticsViewPro = lazy(() => import('@/views/LogisticsViewPro'));
const IntegrationDashboardView = lazy(() => import('@/views/IntegrationDashboardView'));

// Settings Views
const MasterDataView = lazy(() => import('@/views/MasterDataView'));
const AttendanceViewPro = lazy(() => import('@/views/AttendanceViewPro'));

// Documents & Communication Views
const IntelligentDocumentSystem = lazy(() => import('@/views/IntelligentDocumentSystem'));
const ChatView = lazy(() => import('@/views/ChatView'));
const NotificationCenterView = lazy(() => import('@/views/NotificationCenterView'));

// Settings & User Management Views
const UserManagementView = lazy(() => import('@/views/UserManagementView'));
const ProfileView = lazy(() => import('@/views/ProfileView'));
const AdminSettingsView = lazy(() => 
  import('@/views/AdminSettingsView').then(module => ({
    default: module.AdminSettingsView
  }))
);
const AuditTrailView = lazy(() => import('@/views/AuditTrailView'));
const Setup2FAView = lazy(() => import('@/views/Setup2FAView'));

import { monitoringService } from '@/api/monitoringService';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { PredictiveAnalyticsProvider } from '@/contexts/PredictiveAnalyticsContext';
import { AIResourceProvider } from '@/contexts/AIResourceContext';
// import { useProjectCalculations } from '@/hooks/useProjectCalculations'; // Currently unused
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { failoverManager } from '@/utils/failoverManager';
import { healthMonitor } from '@/utils/healthCheck';
import { logger } from '@/utils/logger.enhanced';

logger.debug('monitoringService imported in App.tsx', { monitoringService });

// Lazy-loaded heavy components
const CommandPalette = lazy(() =>
  import('@/components/CommandPalette').then((module) => ({ default: module.CommandPalette }))
);
const AiAssistantChat = lazy(() => import('@/components/AiAssistantChat'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const UserFeedbackWidget = lazy(() => import('@/components/UserFeedbackWidget'));
const SentryTestPanel = lazy(() => import('@/components/SentryTestButton').then((module) => ({ default: module.SentryTestPanel })));

// Wrapper components that inject context data into views requiring props
function WBSWrapper() {
  const { currentProject } = useProject();
  return <WBSManagementView projectId={currentProject?.id || ''} projectName={currentProject?.name || ''} />;
}

function GanttWrapper() {
  const { currentProject } = useProject();
  return <GanttChartView projectId={currentProject?.id || ''} />;
}

function TasksWrapper() {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  useEffect(() => {
    // Tasks will be fetched by the component itself
    setTasks([]);
    setUsers([]);
  }, [currentProject?.id]);
  
  return <TasksView tasks={tasks} users={users} />;
}

function KanbanWrapper() {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  useEffect(() => {
    // Tasks will be fetched by the component itself
    setTasks([]);
    setUsers([]);
  }, [currentProject?.id]);
  
  return <KanbanView tasks={tasks} users={users} />;
}

function DependencyWrapper() {
  const { currentProject } = useProject();
  return <DependencyGraphView projectId={currentProject?.id || ''} />;
}

function AnalyticsWrapper() {
  return <IntegratedAnalyticsView />;
}

function PredictiveAnalyticsWrapper() {
  return (
    <PredictiveAnalyticsProvider>
      <PredictiveAnalyticsView />
    </PredictiveAnalyticsProvider>
  );
}

function AIResourceWrapper() {
  return (
    <AIResourceProvider>
      <AIResourceOptimizationView />
    </AIResourceProvider>
  );
}

function TimelineWrapper() {
  const { currentProject } = useProject();
  return <TimelineTrackingView projectId={currentProject?.id || ''} />;
}

function DailyReportWrapper() {
  return <DailyReportView dailyReports={[]} rabItems={[]} workers={[]} onAddReport={() => {}} />;
}

function ProgressWrapper() {
  const itemsWithProgress: any[] = [];
  return <ProgressView itemsWithProgress={itemsWithProgress} onUpdateProgress={() => {}} />;
}

function FinanceWrapper() {
  return <FinanceViewPro expenses={[]} projectMetrics={undefined as any} />;
}

function CashflowWrapper() {
  return <CashflowView termins={[]} expenses={[]} />;
}

function StrategicCostWrapper() {
  return <StrategicCostView projectMetrics={undefined as any} />;
}

function LogisticsWrapper() {
  return <LogisticsViewPro />;
}

function ReportsWrapper() {
  return <ReportsViewPro reports={[]} />;
}

function MasterDataWrapper() {
  return <MasterDataView workers={[]} />;
}

/**
 * Komponen ini menangani rute yang dilindungi (setelah login)
 * dan memastikan data proyek dimuat.
 */
function ProtectedApp() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // Toggle with Ctrl+Shift+D
  const { currentUser } = useAuth();
  const { currentProject, loading: projectLoading, error: projectError } = useProject();

  // 🔒 Initialize session timeout hook
  useSessionTimeout();

  // 📊 Initialize monitoring hooks (currently disabled)
  // const { projectMetrics } = useProjectCalculations(currentProject);

  // 📊 Initialize monitoring service
  // TEMPORARILY DISABLED - Monitoring causes re-render issues
  useEffect(() => {
    if (currentUser) {
      logger.debug('Monitoring DISABLED for debugging', { userId: currentUser.id });
      /* DISABLED
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
      */
    }

    return undefined;
  }, [currentUser]);

  // 🔒 Priority 2C: Initialize Sentry & GA4 on app start
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        // Initialize Sentry (Error Tracking) - Dynamic import to reduce initial bundle
        const { initializeSentry } = await import('@/config/sentry.config');
        initializeSentry();
        logger.info('Sentry error tracking initialized (lazy loaded)');

        // Initialize Google Analytics 4
        initializeGA4();
        logger.info('Google Analytics 4 initialized');

        // Initialize Performance Monitoring (Web Vitals)
        logger.info('[Performance] Monitoring initialized - tracking Core Web Vitals');
        
        // Optional: Configure performance reporting endpoint
        // performanceMonitor.configureReporting('/api/performance', 60000);
      } catch (err) {
        logger.error('Failed to initialize monitoring services', err instanceof Error ? err : new Error(String(err)));
      }
    };

    // Load monitoring services after a short delay to prioritize app rendering
    const timer = setTimeout(() => {
      initializeMonitoring();
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

  // 👤 Priority 2C: Set user context for Sentry & GA4
  useEffect(() => {
    const setUserContext = async () => {
      if (currentUser) {
        try {
          // Set Sentry user context (dynamic import)
          const { setSentryUser } = await import('@/config/sentry.config');
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
          const { clearSentryUser } = await import('@/config/sentry.config');
          clearSentryUser();
          logger.debug('User context cleared');
        } catch (err) {
          logger.error('Failed to clear user context', err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    setUserContext();
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

  // 📱 Priority 2C Mobile: Listen for push notification click events from Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          const payload = event.data.payload;
          trackPushNotification(payload);
          logger.info('Push notification click tracked', { type: payload.notificationType });
        }
      };

      navigator.serviceWorker.addEventListener('message', messageHandler);

      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
    return undefined;
  }, []);

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

  if (projectLoading || (!currentProject && !projectError)) {
    return <EnterpriseProjectLoader />;
  }

  if (projectError || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4 text-center">
        <p className="font-bold text-lg mb-2">Gagal Memuat Proyek</p>
        <p>{projectError?.message || 'Tidak dapat memuat data proyek.'}</p>
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
  // Note: getViewProps() is kept for potential future use but not currently needed
  // since views fetch their own data via contexts
  // const getViewProps = (): any => ({
  //   project: currentProject,
  //   projectId: currentProject?.id,
  //   projectMetrics: projectMetrics,
  //   recentReports: currentProject?.dailyReports || [],
  //   notifications: [],
  //   updateAiInsight: async () => {
  //     console.log('Update AI insight');
  //   },
  //   loading: projectLoading,
  //   error: projectError,
  //   user: currentUser,
  // });

  return (
    <MainLayout isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}>
      <EnhancedErrorBoundary>
        <SuspenseWithErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-700">Loading view...</p>
              </div>
            </div>
          }
        >
          <Outlet />
        </SuspenseWithErrorBoundary>
      </EnhancedErrorBoundary>
      
      <SuspenseWithErrorBoundary fallback={null}>
        <CommandPalette />
      </SuspenseWithErrorBoundary>
      <SuspenseWithErrorBoundary fallback={null}>
        <AiAssistantChat />
      </SuspenseWithErrorBoundary>
      <SuspenseWithErrorBoundary fallback={null}>
        <PWAInstallPrompt />
      </SuspenseWithErrorBoundary>
      <SuspenseWithErrorBoundary fallback={null}>
        <UserFeedbackWidget position="bottom-right" />
      </SuspenseWithErrorBoundary>
      <SuspenseWithErrorBoundary fallback={null}>
        <SentryTestPanel />
      </SuspenseWithErrorBoundary>
      <OfflineIndicator />
      <LiveCursors containerId="app-container" showLabels />
      <FailoverStatusIndicator />
      {/* <PerformanceMonitor /> */}
      {/* <PerformanceDashboard /> */}
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
      logger.error('App error occurred', error instanceof Error ? error : new Error(String(error)));
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

  return (
    <Routes>
      {!currentUser ? (
        // --- Rute Publik (Belum Login) ---
        <>
          <Route path="/login" element={
            <ViewErrorBoundary viewName="Login" key="enterprise-login-v1">
              <EnterpriseLoginView key={Date.now()} />
            </ViewErrorBoundary>
          } />
          {/* Paksa semua rute lain ke halaman login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        // --- Rute Privat (Sudah Login) ---
        // Kita bungkus dengan ProjectProvider di sini agar hanya aktif setelah login
        <Route
          path="*" // Gunakan "*" untuk menangani semua rute turunan
          element={
            <ProjectProvider>
              <ProtectedApp />
            </ProjectProvider>
          }
        >
          {/* Nested routes - akan di-render di <Outlet /> di ProtectedApp */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <ViewErrorBoundary viewName="Dashboard">
              <DashboardView />
            </ViewErrorBoundary>
          } />
          <Route path="security/ip-restriction-test" element={
            <ViewErrorBoundary viewName="IP Restriction Test">
              <IPRestrictionTestView />
            </ViewErrorBoundary>
          } />
          <Route path="settings/audit-trail-enhanced" element={
            <ViewErrorBoundary viewName="Enhanced Audit Trail">
              <EnhancedAuditLogView />
            </ViewErrorBoundary>
          } />
          <Route path="settings/audit-testing" element={
            <ViewErrorBoundary viewName="Audit Testing">
              <AuditTestingView />
            </ViewErrorBoundary>
          } />
          
          {/* Planning & Scheduling Routes */}
          <Route path="wbs" element={
            <ViewErrorBoundary viewName="WBS Management">
              <WBSWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="schedule" element={
            <ViewErrorBoundary viewName="Schedule">
              <GanttWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="tasks" element={
            <ViewErrorBoundary viewName="Tasks">
              <TasksWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="tasks/kanban" element={
            <ViewErrorBoundary viewName="Kanban Board">
              <KanbanWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="tasks/dependencies" element={
            <ViewErrorBoundary viewName="Dependency Graph">
              <DependencyWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="resources" element={
            <ViewErrorBoundary viewName="Resource Allocation">
              <ResourceAllocationView />
            </ViewErrorBoundary>
          } />

          {/* Cost & Finance Routes */}
          <Route path="rab" element={
            <ViewErrorBoundary viewName="RAB & AHSP">
              <EnhancedRabAhspView />
            </ViewErrorBoundary>
          } />
          <Route path="rab/approval" element={
            <ViewErrorBoundary viewName="RAB Approval">
              <RabApprovalWorkflowView />
            </ViewErrorBoundary>
          } />
          <Route path="finance" element={
            <ViewErrorBoundary viewName="Finance">
              <FinanceWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="finance/cashflow" element={
            <ViewErrorBoundary viewName="Cashflow">
              <CashflowWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="finance/strategic" element={
            <ViewErrorBoundary viewName="Strategic Cost">
              <StrategicCostWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="finance/cost-control" element={
            <ViewErrorBoundary viewName="Cost Control">
              <CostControlDashboardView />
            </ViewErrorBoundary>
          } />
          <Route path="finance/chart-of-accounts" element={
            <ViewErrorBoundary viewName="Chart of Accounts">
              <ChartOfAccountsView />
            </ViewErrorBoundary>
          } />
          <Route path="finance/journal-entries" element={
            <ViewErrorBoundary viewName="Journal Entries">
              <JournalEntriesView />
            </ViewErrorBoundary>
          } />
          <Route path="finance/accounts-payable" element={
            <ViewErrorBoundary viewName="Accounts Payable">
              <AccountsPayableView />
            </ViewErrorBoundary>
          } />
          <Route path="finance/accounts-receivable" element={
            <ViewErrorBoundary viewName="Accounts Receivable">
              <AccountsReceivableView />
            </ViewErrorBoundary>
          } />

          {/* Analytics & AI Routes */}
          <Route path="analytics" element={
            <ViewErrorBoundary viewName="Analytics">
              <AnalyticsWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="analytics/advanced" element={
            <ViewErrorBoundary viewName="Advanced Analytics">
              <AdvancedAnalyticsView />
            </ViewErrorBoundary>
          } />
          <Route path="ai/predictive-analytics" element={
            <ViewErrorBoundary viewName="Predictive Analytics">
              <PredictiveAnalyticsWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="ai/resource-optimization" element={
            <ViewErrorBoundary viewName="AI Resource Optimization">
              <AIResourceWrapper />
            </ViewErrorBoundary>
          } />

          {/* Monitoring & Reports Routes */}
          <Route path="monitoring" element={
            <ViewErrorBoundary viewName="Monitoring">
              <MonitoringView />
            </ViewErrorBoundary>
          } />
          <Route path="reports" element={
            <ViewErrorBoundary viewName="Reports">
              <ReportsWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="reports/daily" element={
            <ViewErrorBoundary viewName="Daily Report">
              <DailyReportWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="reports/progress" element={
            <ViewErrorBoundary viewName="Progress Report">
              <ProgressWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="reports/custom-builder" element={
            <ViewErrorBoundary viewName="Custom Report Builder">
              <CustomReportBuilderView />
            </ViewErrorBoundary>
          } />

          {/* Timeline & Resource Routes */}
          <Route path="timeline" element={
            <ViewErrorBoundary viewName="Timeline Tracking">
              <TimelineWrapper />
            </ViewErrorBoundary>
          } />

          {/* Documents & Communication Routes */}
          <Route path="documents" element={
            <ViewErrorBoundary viewName="Documents">
              <IntelligentDocumentSystem />
            </ViewErrorBoundary>
          } />
          <Route path="chat" element={
            <ViewErrorBoundary viewName="Chat">
              <ChatView />
            </ViewErrorBoundary>
          } />
          <Route path="notifications" element={
            <ViewErrorBoundary viewName="Notifications">
              <NotificationCenterView />
            </ViewErrorBoundary>
          } />

          {/* Logistics & Supply Chain Routes */}
          <Route path="logistics" element={
            <ViewErrorBoundary viewName="Logistics">
              <LogisticsWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="logistics/vendor-management" element={
            <ViewErrorBoundary viewName="Vendor Management">
              <VendorManagementView />
            </ViewErrorBoundary>
          } />
          <Route path="logistics/material-request" element={
            <ViewErrorBoundary viewName="Material Request">
              <MaterialRequestView />
            </ViewErrorBoundary>
          } />
          <Route path="logistics/goods-receipt" element={
            <ViewErrorBoundary viewName="Goods Receipt">
              <GoodsReceiptView />
            </ViewErrorBoundary>
          } />
          <Route path="logistics/inventory" element={
            <ViewErrorBoundary viewName="Inventory Management">
              <InventoryManagementView />
            </ViewErrorBoundary>
          } />
          <Route path="logistics/integration" element={
            <ViewErrorBoundary viewName="Integration Dashboard">
              <IntegrationDashboardView />
            </ViewErrorBoundary>
          } />

          {/* Settings & User Management Routes */}
          <Route path="settings" element={
            <ViewErrorBoundary viewName="Settings">
              <AdminSettingsView />
            </ViewErrorBoundary>
          } />
          <Route path="settings/users" element={
            <ViewErrorBoundary viewName="User Management">
              <UserManagementView />
            </ViewErrorBoundary>
          } />
          <Route path="settings/master-data" element={
            <ViewErrorBoundary viewName="Master Data">
              <MasterDataWrapper />
            </ViewErrorBoundary>
          } />
          <Route path="settings/audit-trail" element={
            <ViewErrorBoundary viewName="Audit Trail">
              <AuditTrailView auditLog={[]} />
            </ViewErrorBoundary>
          } />
          <Route path="settings/2fa" element={
            <ViewErrorBoundary viewName="Two-Factor Authentication">
              <Setup2FAView />
            </ViewErrorBoundary>
          } />
          <Route path="attendance" element={
            <ViewErrorBoundary viewName="Attendance">
              <AttendanceViewPro />
            </ViewErrorBoundary>
          } />
          <Route path="profile" element={
            <ViewErrorBoundary viewName="Profile">
              <ProfileView />
            </ViewErrorBoundary>
          } />
          
          {/* <Route path="settings/audit-dashboard" element={
            <ViewErrorBoundary viewName="Audit Dashboard">
              <AuditDashboardView />
            </ViewErrorBoundary>
          } /> */}
          <Route path="*" element={
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
          } />
        </Route>
      )}
    </Routes>
  );
}

export default App;
