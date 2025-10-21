import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import '@/styles/enterprise-design-system.css';
import Sidebar from '@/components/Sidebar';
import MobileNavigation from '@/components/MobileNavigation';
import OfflineIndicator from '@/components/OfflineIndicator';
import LiveCursors from '@/components/LiveCursors';
import OnlineUsersDisplay from '@/components/OnlineUsersDisplay';
import FallbackView from '@/components/FallbackView';
import { EnterpriseAuthLoader, EnterpriseProjectLoader } from '@/components/EnterpriseLoaders';
import EnterpriseErrorBoundary from '@/components/EnterpriseErrorBoundary';
import { NavigationDebug } from '@/components/NavigationDebug';
import FailoverStatusIndicator from '@/components/FailoverStatusIndicator';

// Priority 2C: Monitoring & Analytics initialization
import { initializeSentry, setSentryUser, clearSentryUser } from '@/config/sentry.config';
import { initializeGA4, setGA4UserId, trackPageView } from '@/config/ga4.config';

// Eager-loaded components (critical for initial render)
import LoginView from '@/views/LoginView';
import EnterpriseLoginView from '@/views/EnterpriseLoginView';

// Context providers
import { AuthProvider } from '@/contexts/AuthContext';
import { ProjectProvider } from '@/contexts/ProjectContext';

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

import { useProjectCalculations } from '@/hooks/useProjectCalculations';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useActivityTracker } from '@/hooks/useMonitoring';
import { Spinner } from '@/components/Spinner';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import {
  RealtimeCollaborationProvider,
  useRealtimeCollaboration,
} from '@/contexts/RealtimeCollaborationContext';
import { monitoringService } from '@/api/monitoringService';
import { failoverManager } from '@/utils/failoverManager';
import { healthMonitor } from '@/utils/healthCheck';
import { useRoutePreload } from '@/hooks/useRoutePreload';

// Lazy-loaded heavy components
const CommandPalette = lazy(() =>
  import('@/components/CommandPalette').then((module) => ({ default: module.CommandPalette }))
);
const AiAssistantChat = lazy(() => import('@/components/AiAssistantChat'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const UserFeedbackWidget = lazy(() => import('@/components/UserFeedbackWidget'));

const viewComponents: { [key: string]: React.ComponentType<any> } = {
  dashboard: DashboardView,
  analytics: IntegratedAnalyticsView, // Enhanced Analytics Dashboard
  rab_ahsp: EnhancedRabAhspView, // Using enhanced version
  rab_basic: RabAhspView, // Keep basic version available
  jadwal: GanttChartView,
  tasks: TasksView,
  task_list: TaskListView,
  kanban: KanbanView,
  kanban_board: KanbanBoardView,
  dependencies: DependencyGraphView,
  notifications: NotificationCenterView,
  monitoring: MonitoringView,
  laporan_harian: DailyReportView,
  progres: ProgressView,
  absensi: AttendanceView,
  biaya_proyek: FinanceView, // Remapped
  arus_kas: CashflowView,
  strategic_cost: StrategicCostView,

  // Finance & Accounting Module
  chart_of_accounts: ChartOfAccountsView,
  journal_entries: JournalEntriesView,
  accounts_payable: AccountsPayableView,
  accounts_receivable: AccountsReceivableView,

  // WBS Module
  wbs_management: WBSManagementView,

  // Logistics Module
  goods_receipt: GoodsReceiptView,
  material_request: MaterialRequestView,
  vendor_management: VendorManagementView,
  inventory_management: InventoryManagementView,
  integration_dashboard: IntegrationDashboardView,
  cost_control: CostControlDashboardView,

  logistik: LogisticsView,
  dokumen: DokumenView,
  documents: IntelligentDocumentSystem, // New Intelligent Document System
  laporan: ReportView,
  user_management: UserManagementView,
  master_data: MasterDataView,
  audit_trail: AuditTrailView,
  profile: ProfileView,

  // Phase 4: AI & Analytics
  ai_resource_optimization: AIResourceOptimizationView,
  predictive_analytics: PredictiveAnalyticsView,
};

// Views that show fallback "coming soon" page
const comingSoonViews: { [key: string]: { name: string; features: string[] } } = {
  // All views have been moved to viewComponents
};

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
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // Toggle with Ctrl+Shift+D
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
      console.log('🔍 Starting system monitoring...');
      monitoringService.startMonitoring(60000); // 1 minute interval

      return () => {
        monitoringService.stopMonitoring();
      };
    }

    return undefined;
  }, [currentUser]);

  // 🔒 Priority 2C: Initialize Sentry & GA4 on app start
  useEffect(() => {
    try {
      // Initialize Sentry (Error Tracking)
      initializeSentry();
      console.log('[Sentry] Error tracking initialized');

      // Initialize Google Analytics 4
      initializeGA4();
      console.log('[GA4] Analytics initialized');
    } catch (err) {
      console.error('Failed to initialize monitoring services:', err);
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

        console.log('[Monitoring] User context set:', currentUser.id);
      } catch (err) {
        console.error('Failed to set user context:', err);
      }
    } else {
      // Clear user context on logout
      try {
        clearSentryUser();
        console.log('[Monitoring] User context cleared');
      } catch (err) {
        console.error('Failed to clear user context:', err);
      }
    }
  }, [currentUser]);

  // 📊 Priority 2C: Track page views in GA4
  useEffect(() => {
    if (currentUser) {
      try {
        trackPageView(`/${currentView}`, `NataCarePM - ${currentView}`);
        console.log('[GA4] Page view tracked:', currentView);
      } catch (err) {
        console.error('Failed to track page view:', err);
      }
    }
  }, [currentView, currentUser]);

  // 🐛 Debug panel keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug((prev) => !prev);
        console.log('🐛 Debug panel:', !showDebug ? 'ON' : 'OFF');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebug]);

  const handleNavigate = (viewId: string) => {
    console.log('🔄 Navigation attempt:', viewId);
    console.log('📋 Available views:', Object.keys(viewComponents));
    console.log('✅ View exists:', viewComponents[viewId] ? 'YES' : 'NO');

    if (viewComponents[viewId]) {
      setIsNavigating(true);

      // Smooth transition
      setTimeout(() => {
        setCurrentView(viewId);
        setIsNavigating(false);
        console.log('✨ Navigated to:', viewId);
      }, 150);

      // Update presence when navigating to different views
      updatePresence(viewId);

      // 📊 Track navigation activity
      trackActivity('navigate', 'view', viewId, true);
    } else {
      console.error('❌ View not found:', viewId);
      console.log(
        '💡 Did you mean one of these?',
        Object.keys(viewComponents).filter((v) => v.includes(viewId.split('_')[0]))
      );
    }
  };

  const itemsWithProgress = useMemo(() => {
    if (!currentProject?.items || !currentProject?.dailyReports) return [];

    const completedVolumeMap = new Map<number, number>();
    currentProject.dailyReports.forEach((report) => {
      report.workProgress?.forEach((progress) => {
        const currentVolume = completedVolumeMap.get(progress.rabItemId) || 0;
        completedVolumeMap.set(progress.rabItemId, currentVolume + progress.completedVolume);
      });
    });

    return currentProject.items.map((item) => ({
      ...item,
      completedVolume: completedVolumeMap.get(item.id) || 0,
    }));
  }, [currentProject]);

  // Initialize Failover Manager
  useEffect(() => {
    failoverManager.initialize().catch((error) => {
      console.error('Failover manager initialization failed:', error);
    });

    // Start health monitoring (every 60 seconds)
    healthMonitor.start(60000);

    return () => {
      failoverManager.stopHealthMonitoring();
      healthMonitor.stop();
    };
  }, []);

  // Initialize Route Preloading
  useRoutePreload(currentView, currentUser?.roleId);

  // Error boundary reset function
  const resetError = () => {
    setHasError(false);
    setError(null);
  };

  // Handle errors
  useEffect(() => {
    if (projectError) {
      console.error('Project error:', projectError);
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

  const CurrentViewComponent = viewComponents[currentView];

  // Show coming soon view for views in development
  if (!CurrentViewComponent && comingSoonViews[currentView]) {
    const comingSoonInfo = comingSoonViews[currentView];
    return (
      <div id="app-container" className="flex h-screen glass-bg font-sans">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header isSidebarCollapsed={isSidebarCollapsed}>
            <OnlineUsersDisplay compact showActivity={false} />
          </Header>
          <div className="flex-1 overflow-hidden">
            <FallbackView
              type="coming-soon"
              viewName={comingSoonInfo.name}
              viewId={currentView}
              onNavigateBack={() => handleNavigate('dashboard')}
              comingSoonFeatures={comingSoonInfo.features}
              description={`Modul ${comingSoonInfo.name} sedang dalam tahap pengembangan final. Kami berkomitmen memberikan pengalaman terbaik dengan fitur-fitur canggih untuk mendukung operasional proyek Anda.`}
            />
          </div>
        </main>
        <CommandPalette onNavigate={handleNavigate} />
        <AiAssistantChat />
        <OfflineIndicator />
        <LiveCursors containerId="app-container" showLabels />
      </div>
    );
  }

  // Enhanced error handling for missing views
  if (!CurrentViewComponent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen glass-dark text-brilliance p-8 text-center">
        <div className="glass border border-violet-essence/30 p-8 rounded-3xl shadow-2xl backdrop-blur-xl max-w-md">
          <div className="w-20 h-20 gradient-bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 floating">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-3">Modul Tidak Ditemukan</h2>
          <p className="text-violet-essence-200 mb-6 leading-relaxed">
            Modul "{currentView}" sedang dalam pengembangan atau belum tersedia.
          </p>
          <button
            onClick={() => handleNavigate('dashboard')}
            className="w-full gradient-bg-primary hover:scale-105 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Safe view props with comprehensive null safety and error handling
  const getViewProps = (viewId: string): any => {
    const safeProject = (currentProject as any) || {};
    const safeActions = {} as any; // Simplified for now

    // Common safe props for all views
    const commonProps = {
      project: currentProject,
      projectMetrics: projectMetrics,
      loading: projectLoading,
      error: projectError,
    };

    // View-specific props with comprehensive safety checks
    const viewPropsMap: { [key: string]: any } = {
      dashboard: {
        ...commonProps,
        projects: currentProject ? [currentProject] : [],
        tasks: safeProject.tasks || [],
        expenses: safeProject.expenses || [],
        purchaseOrders: safeProject.purchaseOrders || [],
        users: safeProject.members || [],
        recentReports: safeProject.dailyReports?.slice(-5) || [],
        notifications: [], // Will be populated by the view
        updateAiInsight: () => console.log('AI Insight update feature coming soon'),
        onNavigate: handleNavigate,
      },
      enhanced_dashboard: {
        ...commonProps,
        projectMetrics: projectMetrics,
        recentReports: safeProject.dailyReports || [],
        notifications: [],
        updateAiInsight: () => console.log('AI Insight update feature coming soon'),
      },
      rab_ahsp: {
        ...commonProps,
        items: safeProject.items || [],
        ahspData: {}, // Will be populated by the view
        projectLocation: safeProject.location || 'Jakarta',
      },
      jadwal: {
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || [],
        timeline: safeProject.timeline || {},
      },
      tasks: {
        ...commonProps,
        tasks: safeProject.tasks || [],
        users: safeProject.members || [],
        onCreateTask: () => console.log('Create task feature coming soon'),
        onUpdateTask: () => console.log('Update task feature coming soon'),
        onDeleteTask: () => console.log('Delete task feature coming soon'),
      },
      task_list: {
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || [],
      },
      kanban: {
        ...commonProps,
        tasks: safeProject.tasks || [],
        users: safeProject.members || [],
        onCreateTask: () => console.log('Create task feature coming soon'),
        onUpdateTask: () => console.log('Update task feature coming soon'),
        onDeleteTask: () => console.log('Delete task feature coming soon'),
      },
      kanban_board: {
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || [],
      },
      dependencies: {
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || [],
        dependencies: safeProject.dependencies || [],
      },
      notifications: {
        ...commonProps,
        projectId: safeProject.id || '',
        notifications: [],
      },
      laporan_harian: {
        ...commonProps,
        dailyReports: safeProject.dailyReports || [],
        rabItems: safeProject.items || [],
        workers: [],
        onAddReport: () => console.log('Add report feature coming soon'),
      },
      progres: {
        ...commonProps,
        itemsWithProgress: itemsWithProgress || [],
        onUpdateProgress: () => console.log('Update progress feature coming soon'),
      },
      absensi: {
        ...commonProps,
        attendances: safeProject.attendances || [],
        workers: [],
        onUpdateAttendance: () => console.log('Update attendance feature coming soon'),
      },
      biaya_proyek: {
        ...commonProps,
        expenses: safeProject.expenses || [],
        budget: safeProject.budget || {},
        costs: safeProject.costs || [],
      },
      arus_kas: {
        ...commonProps,
        termins: safeProject.termins || [],
        expenses: safeProject.expenses || [],
        cashflow: safeProject.cashflow || [],
      },
      strategic_cost: {
        ...commonProps,
        strategicCosts: safeProject.strategicCosts || [],
      },
      logistik: {
        ...commonProps,
        purchaseOrders: safeProject.purchaseOrders || [],
        inventory: safeProject.inventory || [],
        onUpdatePOStatus: () => console.log('Update PO status feature coming soon'),
        ahspData: {},
        onAddPO: () => console.log('Add PO feature coming soon'),
      },
      dokumen: {
        ...commonProps,
        documents: safeProject.documents || [],
        folders: safeProject.folders || [],
      },
      laporan: {
        ...commonProps,
        reports: safeProject.reports || [],
      },
      user_management: {
        ...commonProps,
        users: safeProject.members || [],
        roles: safeProject.roles || [],
      },
      master_data: {
        ...commonProps,
        workers: [],
        materials: safeProject.materials || [],
        equipment: safeProject.equipment || [],
      },
      audit_trail: {
        ...commonProps,
        auditLog: safeProject.auditLog || [],
        activities: safeProject.activities || [],
      },
      profile: {
        ...commonProps,
        user: currentUser,
        preferences: (currentUser as any)?.preferences || {},
      },
    };

    return viewPropsMap[viewId] || commonProps;
  };

  const viewProps = getViewProps(currentView);

  return (
    <div id="app-container" className="flex h-screen bg-gray-100 font-sans">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Mobile Navigation - Only shown on mobile */}
      <MobileNavigation
        currentView={currentView}
        onNavigate={handleNavigate}
        showBottomNav={true}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header isSidebarCollapsed={isSidebarCollapsed}>
          <OnlineUsersDisplay compact showActivity={false} />
        </Header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 mobile-p-4 glass-bg relative pb-20 md:pb-6">
          {/* Navigation Loading Overlay */}
          {isNavigating && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-40 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-700">Loading {currentView}...</p>
              </div>
            </div>
          )}

          <EnterpriseErrorBoundary>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-slate-700">Loading {currentView}...</p>
                  </div>
                </div>
              }
            >
              {CurrentViewComponent ? (
                <CurrentViewComponent {...viewProps} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500">View component failed to load</p>
                    <button
                      onClick={() => handleNavigate('dashboard')}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </Suspense>
          </EnterpriseErrorBoundary>
        </div>
      </main>
      <Suspense fallback={null}>
        <CommandPalette onNavigate={handleNavigate} />
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

      {/* Debug Panel (Ctrl+Shift+D to toggle) */}
      {showDebug && (
        <NavigationDebug
          currentView={currentView}
          availableViews={Object.keys(viewComponents)}
          userPermissions={currentUser?.roleId ? ['view_dashboard', 'view_rab', 'view_gantt'] : []}
        />
      )}

      {/* Debug Toggle Hint */}
      <div className="fixed bottom-4 left-4 z-40 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs opacity-50 hover:opacity-100 transition-opacity">
        Press <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">Ctrl+Shift+D</kbd> for debug panel
      </div>
    </div>
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
          <EnterpriseErrorBoundary>
            <AppContent />
          </EnterpriseErrorBoundary>
        </ProjectProvider>
      </AuthProvider>
    </RealtimeCollaborationProvider>
  );
}

export default App;