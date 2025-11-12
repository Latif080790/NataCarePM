import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { EnterpriseProjectLoader } from '@/components/EnterpriseLoaders';
import LiveCursors from '@/components/LiveCursors';
import MainLayout from '@/components/MainLayout';
import OfflineIndicator from '@/components/OfflineIndicator';
import { ViewErrorBoundary } from '@/components/ViewErrorBoundary';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import '@/styles/enterprise-design-system.css';
import '@/styles/mobile-responsive.css';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, Outlet } from 'react-router-dom';

import FailoverStatusIndicator from '@/components/FailoverStatusIndicator';


// Priority 2C: Monitoring & Analytics initialization
import { initializeGA4, setGA4UserId, trackPageView } from '@/config/ga4.config';
import { clearSentryUser, initializeSentry, setSentryUser } from '@/config/sentry.config';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { trackPushNotification } from '@/utils/mobileAnalytics';

// Eager-loaded components (critical for initial render)
import ModernLoginView from '@/views/ModernLoginView';

// Context providers

import { ProjectProvider } from '@/contexts/ProjectContext';


// Lazy-loaded Views (loaded on demand)
const DashboardView = lazy(() => import('@/views/DashboardWrapper'));
const RabAhspView = lazy(() => import('@/views/RabAhspView'));
const EnhancedRabAhspView = lazy(() => import('@/views/EnhancedRabAhspView'));
const GanttChartView = lazy(() => import('@/views/GanttChartView'));
const DailyReportView = lazy(() => import('@/views/DailyReportView'));
const ProgressView = lazy(() => import('@/views/ProgressView'));
const AttendanceView = lazy(() => import('@/views/AttendanceView'));
const FinanceView = lazy(() => import('@/views/FinanceView'));
const CashflowView = lazy(() => import('@/views/CashflowView'));
const StrategicCostView = lazy(() => import('@/views/StrategicCostView'));
const CostControlDashboardView = lazy(() => import('@/views/CostControlDashboardView'));
const LogisticsView = lazy(() => import('@/views/LogisticsView'));
const DokumenView = lazy(() => import('@/views/DokumenView'));
const ReportView = lazy(() => import('@/views/ReportView'));
const UserManagementView = lazy(() => import('@/views/UserManagementView'));
const MasterDataView = lazy(() => import('@/views/MasterDataView'));
const AuditTrailView = lazy(() => import('@/views/AuditTrailView'));
const EnhancedAuditLogView = lazy(() => import('@/views/EnhancedAuditLogView'));
const AuditTestingView = lazy(() => import('@/views/AuditTestingView'));
// const AuditDashboardView = lazy(() => import('@/views/AuditDashboardView'));
const ProfileView = lazy(() => import('@/views/ProfileView'));
const TaskListView = lazy(() => import('@/views/TaskListView'));
const TasksView = lazy(() => import('@/views/TasksView'));
const KanbanView = lazy(() => import('@/views/KanbanView'));
const DependencyGraphView = lazy(() => import('@/views/DependencyGraphView'));
const ResourceAllocationView = lazy(() => import('@/views/ResourceAllocationView'));
const TimelineTrackingView = lazy(() => import('@/views/TimelineTrackingView'));
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
const VendorTestView = lazy(() => import('@/views/VendorTestView'));
const IPRestrictionTestView = lazy(() => import('@/views/IPRestrictionTestView'));
const InventoryManagementView = lazy(() => import('@/views/InventoryManagementView'));
const IntegrationDashboardView = lazy(() => import('@/views/IntegrationDashboardView'));

// Phase 4: AI & Analytics Views (lazy-loaded)
const AIResourceOptimizationView = lazy(() => import('@/views/AIResourceOptimizationView'));
const PredictiveAnalyticsView = lazy(() => import('@/views/PredictiveAnalyticsView'));

// Unauthorized View
const UnauthorizedView = lazy(() => import('@/views/UnauthorizedView'));

import { monitoringService } from '@/api/monitoringService';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import { Spinner } from '@/components/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectCalculations } from '@/hooks/useProjectCalculations';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { failoverManager } from '@/utils/failoverManager';
import { healthMonitor } from '@/utils/healthCheck';
console.log('🔧 monitoringService imported in App.tsx:', monitoringService);

import { logger } from '@/utils/logger.enhanced';

// Lazy-loaded heavy components
const CommandPalette = lazy(() =>
  import('@/components/CommandPalette').then((module) => ({ default: module.CommandPalette }))
);
const AiAssistantChat = lazy(() => import('@/components/AiAssistantChat'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const UserFeedbackWidget = lazy(() => import('@/components/UserFeedbackWidget'));
const SentryTestPanel = lazy(() => import('@/components/SentryTestButton').then((module) => ({ default: module.SentryTestPanel })));
const AdvancedAnalyticsView = lazy(() => import('@/views/AdvancedAnalyticsView'));
const ChatView = lazy(() => import('@/views/ChatView'));
const CustomReportBuilderView = lazy(() => import('@/views/CustomReportBuilderView'));
const RabApprovalWorkflowView = lazy(() => import('@/views/RabApprovalWorkflowView'));

// Error Boundary Fallback Component
function _ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
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

  // 📊 Initialize monitoring hooks

  const { projectMetrics } = useProjectCalculations(currentProject);

  // 📊 Initialize monitoring service
  // TEMPORARILY DISABLED - Monitoring causes re-render issues
  useEffect(() => {
    if (currentUser) {
      console.log('[Monitoring] DISABLED for debugging');
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
    try {
      // Initialize Sentry (Error Tracking)
      initializeSentry();
      logger.info('Sentry error tracking initialized');

      // Initialize Google Analytics 4
      initializeGA4();
      logger.info('Google Analytics 4 initialized');

      // Initialize Performance Monitoring (Web Vitals)
      console.log('📊 [Performance] Monitoring initialized - tracking Core Web Vitals');
      
      // Optional: Configure performance reporting endpoint
      // performanceMonitor.configureReporting('/api/performance', 60000);
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
  const getViewProps = (): any => ({
    project: currentProject,
    projectId: currentProject?.id,  // ✅ Add projectId for views that need it
    projectMetrics: projectMetrics,
    recentReports: currentProject?.dailyReports || [],
    notifications: [],
    updateAiInsight: async () => {
      // Placeholder for AI insight update
      console.log('Update AI insight');
    },
    loading: projectLoading,
    error: projectError,
    user: currentUser,
  });

  const viewProps = getViewProps();

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
          <Outlet />
        </Suspense>
      </EnhancedErrorBoundary>
      
      <Suspense fallback={null}>
        <CommandPalette />
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
      <Suspense fallback={null}>
        <SentryTestPanel />
      </Suspense>
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

  return (
    <Routes>
      {!currentUser ? (
        // --- Rute Publik (Belum Login) ---
        <>
          <Route path="/login" element={
            <ViewErrorBoundary viewName="Login" key="modern-login-final-v1">
              <ModernLoginView key={Date.now()} />
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