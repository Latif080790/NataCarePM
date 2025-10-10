import React, { useState, useMemo } from 'react';
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
import OfflineIndicator from './components/OfflineIndicator'; // New

import { useProjectCalculations } from './hooks/useProjectCalculations';
import { Spinner } from './components/Spinner';
import { CommandPalette } from './components/CommandPalette';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';
import { useProject } from './contexts/ProjectContext';
import AiAssistantChat from './components/AiAssistantChat';

const viewComponents: { [key: string]: React.ComponentType<any> } = {
  dashboard: DashboardView,
  rab_ahsp: RabAhspView,
  jadwal: GanttChartView,
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
};

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { currentUser, loading: authLoading } = useAuth();
  const { currentProject, loading: projectLoading, error, ...projectActions } = useProject();

  const { projectMetrics } = useProjectCalculations(currentProject);

  const handleNavigate = (viewId: string) => {
    if (viewComponents[viewId]) {
      setCurrentView(viewId);
    }
  };

  const itemsWithProgress = useMemo(() => {
    if (!currentProject) return [];
    const completedVolumeMap = new Map<number, number>();
    currentProject.dailyReports.forEach(report => {
        report.workProgress.forEach(progress => {
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
    return (
      <div className="flex items-center justify-center h-screen bg-alabaster">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }
  
  if (projectLoading || (!currentProject && !error)) {
    return (
       <div className="flex items-center justify-center h-screen bg-alabaster">
         <Spinner size="lg" />
         <p className="ml-4">Memuat data proyek...</p>
       </div>
    );
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
  const viewProps: any = {
      dashboard: { projectMetrics, recentReports: currentProject.dailyReports, notifications: projectActions.notifications, project: currentProject, updateAiInsight: projectActions.handleUpdateAiInsight },
      rab_ahsp: { items: currentProject.items, ahspData: projectActions.ahspData },
      jadwal: { items: currentProject.items, startDate: currentProject.startDate },
      laporan_harian: { dailyReports: currentProject.dailyReports, rabItems: currentProject.items, workers: projectActions.workers, onAddReport: projectActions.handleAddDailyReport },
      progres: { itemsWithProgress, onUpdateProgress: projectActions.handleUpdateProgress },
      absensi: { attendances: currentProject.attendances, workers: projectActions.workers, onUpdateAttendance: projectActions.handleUpdateAttendance },
      biaya_proyek: { expenses: currentProject.expenses, projectMetrics },
      arus_kas: { termins: currentProject.termins, expenses: currentProject.expenses },
      strategic_cost: { projectMetrics },
      logistik: { purchaseOrders: currentProject.purchaseOrders, inventory: currentProject.inventory, onUpdatePOStatus: projectActions.handleUpdatePOStatus, ahspData: projectActions.ahspData, onAddPO: projectActions.handleAddPO },
      dokumen: { documents: currentProject.documents },
      laporan: { projectMetrics, project: currentProject },
      user_management: { users: currentProject.members },
      master_data: { workers: projectActions.workers },
      audit_trail: { auditLog: currentProject.auditLog }
  };

  return (
      <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar 
            currentView={currentView} 
            onNavigate={handleNavigate}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
            <Header isSidebarCollapsed={isSidebarCollapsed}/>
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-alabaster">
                {CurrentViewComponent ? <CurrentViewComponent {...viewProps[currentView]} /> : <div>View not found</div>}
            </div>
        </main>
        <CommandPalette onNavigate={handleNavigate} />
        <AiAssistantChat />
        <OfflineIndicator />
      </div>
  );
}

export default App;