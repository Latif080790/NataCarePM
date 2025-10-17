/**
 * MobileNavigation Component
 * 
 * Main mobile navigation system that combines:
 * - Hamburger button
 * - Slide-in drawer
 * - Bottom navigation bar
 * 
 * Usage:
 * <MobileNavigation
 *   currentView={currentView}
 *   onNavigate={handleNavigate}
 * />
 */

import React, { useState } from 'react';
import HamburgerButton from './HamburgerButton';
import MobileDrawer from './MobileDrawer';
import BottomNav from './BottomNav';
import { useIsMobile } from '../constants/responsive';

interface MobileNavigationProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  showBottomNav?: boolean;
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onNavigate,
  showBottomNav = true,
  className = '',
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className={className}>
      {/* Hamburger Button - Fixed position in header */}
      <HamburgerButton
        isOpen={isDrawerOpen}
        onClick={handleDrawerToggle}
        className="fixed top-4 left-4 z-1001 text-slate-700 hover:text-slate-900"
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        currentView={currentView}
        onNavigate={onNavigate}
      />

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <BottomNav
          currentView={currentView}
          onNavigate={onNavigate}
          onMenuClick={handleDrawerToggle}
        />
      )}
    </div>
  );
};

export default MobileNavigation;
