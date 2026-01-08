import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import MobileNavigation from '@/components/MobileNavigation';
import Header from '@/components/Header';
import OnlineUsersDisplay from '@/components/OnlineUsersDisplay';
import { SkipLink } from '@/components/SkipLink';
import OfflineIndicator from '@/components/OfflineIndicator';
import LiveCursors from '@/components/LiveCursors'; // Phase 3: Re-enabled with safe DOM access
import FailoverStatusIndicator from '@/components/FailoverStatusIndicator';
// import PerformanceMonitor from '@/components/PerformanceMonitor';

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
  return (
    <div id="app-container" className="flex h-screen bg-gray-100 font-sans">
      <SkipLink />
      {/* Desktop Sidebar - Show on all screens for testing */}
      <div className="block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Mobile Navigation - Only shown on mobile */}
      <MobileNavigation
        showBottomNav={true}
      />

      <main className="flex-1 flex flex-col overflow-hidden" role="main">
        <Header isSidebarCollapsed={isSidebarCollapsed}>
          <OnlineUsersDisplay compact showActivity={false} />
        </Header>
        <div id="main-content" className="flex-1 overflow-x-hidden overflow-y-auto p-6 mobile-p-4 glass-bg relative pb-20 md:pb-6" tabIndex={-1}>
          {children || <Outlet />}
        </div>
      </main>

      <OfflineIndicator />
      <LiveCursors containerId="app-container" showLabels enabled />
      <FailoverStatusIndicator />
      {/* <PerformanceMonitor /> */}
    </div>
  );
};

export default MainLayout;
