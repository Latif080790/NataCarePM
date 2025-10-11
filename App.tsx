import React, { useState, useMemo } from 'react';
import './styles/enterprise-design-system.css';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import EnterpriseAdvancedDashboardView from './views/EnterpriseAdvancedDashboardView';
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
import OfflineIndicator from './components/OfflineIndicator';
import LiveCursors from './components/LiveCursors';
import OnlineUsersDisplay from './components/OnlineUsersDisplay';
import { EnterpriseAuthLoader, EnterpriseProjectLoader } from './components/EnterpriseLoaders';
import EnterpriseErrorBoundary from './components/EnterpriseErrorBoundary';
import SafeViewWrapper from './components/SafeViewWrapper';

import { useProjectCalculations } from './hooks/useProjectCalculations';
import { Spinner } from './components/Spinner';
import { CommandPalette } from './components/CommandPalette';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import { RealtimeCollaborationProvider, useRealtimeCollaboration } from './contexts/RealtimeCollaborationContext';
import AiAssistantChat from './components/AiAssistantChat';

const viewComponents: { [key: string]: React.ComponentType<any> } = {
  dashboard: EnterpriseAdvancedDashboardView,
  enhanced_dashboard: DashboardView,
  rab_ahsp: RabAhspView,
  jadwal: GanttChartView,
  tasks: TasksView,
  task_list: TaskListView,
  kanban: KanbanView,
  kanban_board: KanbanBoardView,
  dependencies: DependencyGraphView,
  notifications: NotificationCenterView,
  laporan_harian: DailyReportView,
  progres: ProgressView,
  absensi: AttendanceView,
  biaya_proyek: FinanceView,
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

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { currentUser, loading: authLoading } = useAuth();
  const { currentProject, loading: projectLoading, error, ...projectActions } = useProject();
  const { updatePresence } = useRealtimeCollaboration();

  const { projectMetrics } = useProjectCalculations(currentProject);

  const handleNavigate = (viewId: string) => {
    if (viewComponents[viewId]) {
      setCurrentView(viewId);
      // Update presence when navigating to different views
      updatePresence(viewId);
    }
  };

  const itemsWithProgress = useMemo(() => {
    if (!currentProject || !currentProject.items || !currentProject.dailyReports) return [];
    
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
  
  // Enhanced error handling for missing views
  if (!CurrentViewComponent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-50 to-pink-50 text-red-700 p-8 text-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">View Not Found</h2>
          <p className="text-red-600 mb-6">The requested view "{currentView}" is not available.</p>
          <button 
            onClick={() => handleNavigate('dashboard')}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Safe view props with null safety
  const viewProps: any = {
      dashboard: { 
        projectMetrics, 
        recentReports: currentProject?.dailyReports || [], 
        notifications: projectActions.notifications || [], 
        project: currentProject, 
        updateAiInsight: projectActions.handleUpdateAiInsight 
      },
      enhanced_dashboard: { 
        projectMetrics, 
        recentReports: currentProject?.dailyReports || [], 
        notifications: projectActions.notifications || [], 
        project: currentProject, 
        updateAiInsight: projectActions.handleUpdateAiInsight 
      },
      rab_ahsp: { 
        items: currentProject?.items || [], 
        ahspData: projectActions.ahspData 
      },
      jadwal: { projectId: currentProject?.id || '' },
      tasks: { 
        tasks: [], // Mock empty tasks array 
        users: currentProject?.members || [], 
        onCreateTask: () => {},
        onUpdateTask: () => {},
        onDeleteTask: () => {}
      },
      task_list: { projectId: currentProject?.id || '' },
      kanban: { 
        tasks: [], // Mock empty tasks array 
        users: currentProject?.members || [], 
        onCreateTask: () => {},
        onUpdateTask: () => {},
        onDeleteTask: () => {}
      },
      kanban_board: { projectId: currentProject?.id || '' },
      dependencies: { projectId: currentProject?.id || '' },
      notifications: { projectId: currentProject?.id || '' },
      laporan_harian: { 
        dailyReports: currentProject?.dailyReports || [], 
        rabItems: currentProject?.items || [], 
        workers: projectActions.workers || [], 
        onAddReport: projectActions.handleAddDailyReport 
      },
      progres: { 
        itemsWithProgress: itemsWithProgress || [], 
        onUpdateProgress: projectActions.handleUpdateProgress 
      },
      absensi: { 
        attendances: currentProject?.attendances || [], 
        workers: projectActions.workers || [], 
        onUpdateAttendance: projectActions.handleUpdateAttendance 
      },
      biaya_proyek: { 
        expenses: currentProject?.expenses || [], 
        projectMetrics 
      },
      arus_kas: { 
        termins: currentProject?.termins || [], 
        expenses: currentProject?.expenses || [] 
      },
      strategic_cost: { projectMetrics },
      logistik: { 
        purchaseOrders: currentProject?.purchaseOrders || [], 
        inventory: currentProject?.inventory || [], 
        onUpdatePOStatus: projectActions.handleUpdatePOStatus, 
        ahspData: projectActions.ahspData, 
        onAddPO: projectActions.handleAddPO 
      },
      dokumen: { documents: currentProject?.documents || [] },
      laporan: { projectMetrics, project: currentProject },
      user_management: { users: currentProject?.members || [] },
      master_data: { workers: projectActions.workers || [] },
      audit_trail: { auditLog: currentProject?.auditLog || [] },
      profile: {}
  };

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
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-alabaster">
                <EnterpriseErrorBoundary>
                    <SafeViewWrapper onRetry={() => window.location.reload()}>
                        {CurrentViewComponent ? <CurrentViewComponent {...viewProps[currentView]} /> : <div>View not found</div>}
                    </SafeViewWrapper>
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