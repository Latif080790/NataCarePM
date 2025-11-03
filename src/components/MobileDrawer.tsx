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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    navigate(route);
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
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
          {/* Navigation Groups */}
          {navLinksConfig.map((group, groupIndex) => (
            <div key={group.id || groupIndex} className="mb-4 last:mb-0">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/30 transition-colors touch-target-md"
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
                  {(() => {
                    const allChildren = group.children || [];
                    const filteredChildren = allChildren.filter((item: any) =>
                      hasPermission(currentUser, item.requiredPermission)
                    );

                    return filteredChildren;
                  })().map((item: any, itemIndex: number) => {
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
                              ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          size={18}
                          className={isActive ? 'text-orange-400' : 'text-slate-500'}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-orange-400"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="safe-area-bottom border-t border-slate-700/50 p-3 bg-slate-800/20">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-200 transition-colors touch-target-md"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-slate-900 rounded-full"></div>
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{currentUser?.email || 'user@example.com'}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl overflow-hidden backdrop-blur-sm z-10">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      handleNavigate('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left text-sm font-medium touch-target-md"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNavigate('master_data');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors text-left text-sm font-medium touch-target-md"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-slate-600/20 my-1"></div>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors text-left text-sm font-medium touch-target-md"
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