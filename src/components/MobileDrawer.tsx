/**
 * MobileDrawer Component
 *
 * Slide-in navigation drawer for mobile devices
 * Features:
 * - Smooth slide animation from left
 * - Swipe-to-close gesture support
 * - Backdrop overlay with tap-to-close
 * - iOS safe area support
 * - Grouped navigation items
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Users,
  FileText,
  DollarSign,
  Shield,
  CheckSquare,
  TrendingUp,
  Truck,
  FileArchive,
  History,
  Monitor,
  Calendar,
  Activity,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Bell,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navLinksConfig, hasPermission } from '@/constants';
import {
  detectSwipe,
  triggerHapticFeedback,
  disableBodyScroll,
  enableBodyScroll,
} from '@/constants/responsive';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onNavigate: (viewId: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
}) => {
  const { currentUser, logout } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['main-group']);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Icon mapping
  const getIconForView = (viewId: string) => {
    const iconMap: { [key: string]: any } = {
      dashboard: BarChart3,
      analytics: TrendingUp,
      rab_ahsp: FileText,
      jadwal: Calendar,
      tasks: CheckSquare,
      kanban: CheckSquare,
      dependencies: BarChart3,
      notifications: Bell,
      monitoring: Monitor,
      laporan_harian: FileText,
      progres: TrendingUp,
      absensi: Users,
      arus_kas: DollarSign,
      biaya_proyek: DollarSign,
      strategic_cost: Shield,
      logistik: Truck,
      dokumen: FileArchive,
      documents: Brain,
      laporan: FileText,
      profile: User,
      user_management: Users,
      master_data: Settings,
      audit_trail: History,
    };
    return iconMap[viewId] || Activity;
  };

  // Handle navigation
  const handleNavigate = (viewId: string) => {
    onNavigate(viewId);
    onClose();
    triggerHapticFeedback(10);
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  // Handle touch events for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const swipe = detectSwipe(
      touchStartRef.current.x,
      touchStartRef.current.y,
      touch.clientX,
      touch.clientY,
      touchStartRef.current.time,
      Date.now(),
      50
    );

    // Close drawer on swipe left
    if (swipe?.direction === 'left' && swipe.distance > 100) {
      onClose();
      triggerHapticFeedback(10);
    }

    touchStartRef.current = null;
  };

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }

    return () => {
      enableBodyScroll();
    };
  }, [isOpen]);

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`mobile-nav-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer mobile-nav-drawer-dark ${isOpen ? 'open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Mobile navigation"
        role="navigation"
      >
        {/* Drawer Header */}
        <div className="safe-area-top sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                NC
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Nata Cara</h2>
                <p className="text-xs text-slate-400">Project Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="touch-target-md p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch px-3 py-4">
          {navLinksConfig.map((group, groupIndex) => {
            const filteredChildren = (group.children || []).filter((item: any) =>
              hasPermission(currentUser, item.requiredPermission)
            );

            if (filteredChildren.length === 0) return null;

            return (
              <div key={group.id || groupIndex} className="mb-4">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/30 transition-colors"
                  aria-expanded={expandedGroups.includes(group.id)}
                >
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {group.name}
                  </h3>
                  {expandedGroups.includes(group.id) ? (
                    <ChevronDown size={16} className="text-slate-500" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-500" />
                  )}
                </button>

                {/* Group Items */}
                {expandedGroups.includes(group.id) && (
                  <div className="mt-1 space-y-1">
                    {filteredChildren.map((item: any, itemIndex: number) => {
                      const isActive = currentView === item.id;
                      const Icon = getIconForView(item.id);

                      return (
                        <button
                          key={item.id || itemIndex}
                          onClick={() => handleNavigate(item.id)}
                          className={`
                            w-full flex items-center space-x-3 px-3 py-3 rounded-xl
                            transition-all duration-200 touch-target-md
                            ${
                              isActive
                                ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 text-white'
                                : 'text-slate-300 hover:bg-slate-700/30 hover:text-white border border-transparent'
                            }
                          `}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon
                            size={18}
                            className={isActive ? 'text-orange-400' : 'text-slate-500'}
                          />
                          <span
                            className={`text-sm flex-1 text-left ${isActive ? 'font-semibold' : 'font-medium'}`}
                          >
                            {item.name}
                          </span>
                          {isActive && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="safe-area-bottom sticky bottom-0 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-md p-3">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/30"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {currentUser?.email || 'user@example.com'}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {/* User Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden">
                <div className="p-1 space-y-1">
                  <button
                    onClick={() => {
                      handleNavigate('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-sm touch-target-md"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      handleNavigate('master_data');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-sm touch-target-md"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-slate-700/30 my-1" />
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      onClose();
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors text-sm touch-target-md"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
