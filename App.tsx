import React, { useState, useMemo, useEffect } from 'react';
import './styles/enterprise-design-system.css';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import RabAhspView from './views/RabAhspView';
import GanttChartView from './views/GanttChartView';
import DailyReportView from './views/DailyReportView';
import ProgressView from './views/ProgressView';
import AttendanceView from './views/AttendanceView';
import FinanceView from './views/FinanceView';
import CashflowView from './views/CashflowView';
import StrategicCostView from './views/StrategicCostView';
import LogisticsView from './views/LogisticsView';
import DokumenView from './views/DokumenView';
import ReportView from './views/ReportView';
import UserManagementView from './views/UserManagementView';
import MasterDataView from './views/MasterDataView';
import AuditTrailView from './views/AuditTrailView';
import LoginView from './views/LoginView';
import EnterpriseLoginView from './views/EnterpriseLoginView';
import ProfileView from './views/ProfileView';
import TaskListView from './views/TaskListView';
import TasksView from './views/TasksView';
import KanbanBoardView from './views/KanbanBoardView';
import KanbanView from './views/KanbanView';
import DependencyGraphView from './views/DependencyGraphView';
import NotificationCenterView from './views/NotificationCenterView';
import MonitoringView from './views/MonitoringView';
import OfflineIndicator from './components/OfflineIndicator';
import LiveCursors from './components/LiveCursors';
import OnlineUsersDisplay from './components/OnlineUsersDisplay';
import FallbackView from './components/FallbackView';
import { EnterpriseAuthLoader, EnterpriseProjectLoader } from './components/EnterpriseLoaders';
import EnterpriseErrorBoundary from './components/EnterpriseErrorBoundary';

import { useProjectCalculations } from './hooks/useProjectCalculations';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useActivityTracker } from './hooks/useMonitoring';
import { Spinner } from './components/Spinner';
import { CommandPalette } from './components/CommandPalette';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { RealtimeCollaborationProvider, useRealtimeCollaboration } from './contexts/RealtimeCollaborationContext';
import AiAssistantChat from './components/AiAssistantChat';
import { monitoringService } from './api/monitoringService';

const viewComponents: { [key: string]: React.ComponentType<any> } = {
  dashboard: DashboardView,
  rab_ahsp: RabAhspView,
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
  logistik: LogisticsView,
  dokumen: DokumenView,
  laporan: ReportView,
  user_management: UserManagementView,
  master_data: MasterDataView,
  audit_trail: AuditTrailView,
  profile: ProfileView,
};

// Views that show fallback "coming soon" page
const comingSoonViews: { [key: string]: { name: string; features: string[] } } = {
  // All views have been moved to viewComponents
};

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { currentUser, loading: authLoading } = useAuth();
  const { currentProject, loading: projectLoading, error, ...projectActions } = useProject();
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

  const handleNavigate = (viewId: string) => {
    if (viewComponents[viewId]) {
      setCurrentView(viewId);
      // Update presence when navigating to different views
      updatePresence(viewId);
      
      // 📊 Track navigation activity
      trackActivity('navigate', 'view', viewId, true);
    }
  };

  const itemsWithProgress = useMemo(() => {
    if (!currentProject?.items || !currentProject?.dailyReports) return [];
    
    const completedVolumeMap = new Map<number, number>();
    currentProject.dailyReports.forEach(report => {
        report.workProgress?.forEach(progress => {
            const currentVolume = completedVolumeMap.get(progress.rabItemId) || 0;
            completedVolumeMap.set(progress.rabItemId, currentVolume + progress.completedVolume);
        });
    });
    
    return currentProject.items.map(item => ({
        ...item,
        completedVolume: completedVolumeMap.get(item.id) || 0,
    }));
  }, [currentProject]);

  if (authLoading && !currentUser) {
    return <EnterpriseAuthLoader />;
  }

  if (!currentUser) {
    return <EnterpriseLoginView />;
  }
  
  if (projectLoading || (!currentProject && !error)) {
    return <EnterpriseProjectLoader />;
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4 text-center">
        <p className="font-bold text-lg mb-2">Gagal Memuat Aplikasi</p>
        <p>{error?.message || 'Tidak dapat memuat data proyek yang diperlukan. Coba muat ulang halaman.'}</p>
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
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-3">Modul Tidak Ditemukan</h2>
          <p className="text-violet-essence-200 mb-6 leading-relaxed">Modul "{currentView}" sedang dalam pengembangan atau belum tersedia.</p>
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
    const safeProject = currentProject as any || {};
    const safeActions = projectActions as any || {};
    
    // Common safe props for all views
    const commonProps = {
      project: currentProject,
      projectMetrics: projectMetrics,
      loading: projectLoading,
      error: error
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
        notifications: safeActions.notifications || [],
        updateAiInsight: safeActions.handleUpdateAiInsight || (() => {}),
        onNavigate: handleNavigate
      },
      enhanced_dashboard: { 
        ...commonProps,
        projectMetrics: projectMetrics, 
        recentReports: safeProject.dailyReports || [], 
        notifications: safeActions.notifications || [], 
        updateAiInsight: safeActions.handleUpdateAiInsight || (() => {})
      },
      rab_ahsp: { 
        ...commonProps,
        items: safeProject.items || [], 
        ahspData: safeActions.ahspData || []
      },
      jadwal: { 
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || [],
        timeline: safeProject.timeline || {}
      },
      tasks: { 
        ...commonProps,
        tasks: safeProject.tasks || [],
        users: safeProject.members || [], 
        onCreateTask: safeActions.handleCreateTask || (() => console.log('Create task feature coming soon')),
        onUpdateTask: safeActions.handleUpdateTask || (() => console.log('Update task feature coming soon')),
        onDeleteTask: safeActions.handleDeleteTask || (() => console.log('Delete task feature coming soon'))
      },
      task_list: { 
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || []
      },
      kanban: { 
        ...commonProps,
        tasks: safeProject.tasks || [],
        users: safeProject.members || [], 
        onCreateTask: safeActions.handleCreateTask || (() => console.log('Create task feature coming soon')),
        onUpdateTask: safeActions.handleUpdateTask || (() => console.log('Update task feature coming soon')),
        onDeleteTask: safeActions.handleDeleteTask || (() => console.log('Delete task feature coming soon'))
      },
      kanban_board: { 
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || []
      },
      dependencies: { 
        ...commonProps,
        projectId: safeProject.id || '',
        tasks: safeProject.tasks || [],
        dependencies: safeProject.dependencies || []
      },
      notifications: { 
        ...commonProps,
        projectId: safeProject.id || '',
        notifications: safeActions.notifications || []
      },
      laporan_harian: { 
        ...commonProps,
        dailyReports: safeProject.dailyReports || [], 
        rabItems: safeProject.items || [], 
        workers: safeActions.workers || [], 
        onAddReport: safeActions.handleAddDailyReport || (() => console.log('Add report feature coming soon'))
      },
      progres: { 
        ...commonProps,
        itemsWithProgress: itemsWithProgress || [], 
        onUpdateProgress: safeActions.handleUpdateProgress || (() => console.log('Update progress feature coming soon'))
      },
      absensi: { 
        ...commonProps,
        attendances: safeProject.attendances || [], 
        workers: safeActions.workers || [], 
        onUpdateAttendance: safeActions.handleUpdateAttendance || (() => console.log('Update attendance feature coming soon'))
      },
      biaya_proyek: { 
        ...commonProps,
        expenses: safeProject.expenses || [],
        budget: safeProject.budget || {},
        costs: safeProject.costs || []
      },
      arus_kas: { 
        ...commonProps,
        termins: safeProject.termins || [], 
        expenses: safeProject.expenses || [],
        cashflow: safeProject.cashflow || []
      },
      strategic_cost: { 
        ...commonProps,
        strategicCosts: safeProject.strategicCosts || []
      },
      logistik: { 
        ...commonProps,
        purchaseOrders: safeProject.purchaseOrders || [], 
        inventory: safeProject.inventory || [], 
        onUpdatePOStatus: safeActions.handleUpdatePOStatus || (() => console.log('Update PO status feature coming soon')), 
        ahspData: safeActions.ahspData || [], 
        onAddPO: safeActions.handleAddPO || (() => console.log('Add PO feature coming soon'))
      },
      dokumen: { 
        ...commonProps,
        documents: safeProject.documents || [],
        folders: safeProject.folders || []
      },
      laporan: { 
        ...commonProps,
        reports: safeProject.reports || []
      },
      user_management: { 
        ...commonProps,
        users: safeProject.members || [],
        roles: safeProject.roles || []
      },
      master_data: { 
        ...commonProps,
        workers: safeActions.workers || [],
        materials: safeProject.materials || [],
        equipment: safeProject.equipment || []
      },
      audit_trail: { 
        ...commonProps,
        auditLog: safeProject.auditLog || [],
        activities: safeProject.activities || []
      },
      profile: {
        ...commonProps,
        user: currentUser,
        preferences: (currentUser as any)?.preferences || {}
      }
    };

    return viewPropsMap[viewId] || commonProps;
  };

  const viewProps = getViewProps(currentView);

  return (
      <div id="app-container" className="flex h-screen bg-gray-100 font-sans">
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
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 glass-bg">
                <EnterpriseErrorBoundary>
                    {CurrentViewComponent ? <CurrentViewComponent {...viewProps} /> : <div>View not found</div>}
                </EnterpriseErrorBoundary>
            </div>
        </main>
        <CommandPalette onNavigate={handleNavigate} />
        <AiAssistantChat />
        <OfflineIndicator />
        <LiveCursors containerId="app-container" showLabels />
      </div>
  );
}

function App() {
  const { currentUser, loading: authLoading } = useAuth();

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
      <AppContent />
    </RealtimeCollaborationProvider>
  );
}

export default App;