import React, { useState, lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import MobileNavigation from '@/components/MobileNavigation';
import Header from '@/components/Header';
import OnlineUsersDisplay from '@/components/OnlineUsersDisplay';
import { SkipLink } from '@/components/SkipLink';
import OfflineIndicator from '@/components/OfflineIndicator';
import LiveCursors from '@/components/LiveCursors';
import FailoverStatusIndicator from '@/components/FailoverStatusIndicator';
import PerformanceMonitor from '@/components/PerformanceMonitor';

// Lazy load heavy components
const CommandPalette = lazy(() =>
  import('@/components/CommandPalette').then((module) => ({ default: module.CommandPalette }))
);
const AiAssistantChat = lazy(() => import('@/components/AiAssistantChat'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt'));
const UserFeedbackWidget = lazy(() => import('@/components/UserFeedbackWidget'));

interface MainLayoutProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed,
  children 
}) => {
  const [currentView, setCurrentView] = useState('dashboard');

  const handleNavigate = (viewId: string) => {
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
    window.location.hash = route;
    setCurrentView(viewId);
  };

  return (
    <div id="app-container" className="flex h-screen bg-gray-100 font-sans">
      <SkipLink />
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
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
          {children || <Outlet />}
        </div>
      </main>

      {/* Lazy loaded components */}
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

      <OfflineIndicator />
      <LiveCursors containerId="app-container" showLabels />
      <FailoverStatusIndicator />
      <PerformanceMonitor />
    </div>
  );
};

export default MainLayout;