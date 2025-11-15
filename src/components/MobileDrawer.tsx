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
import { useNavigate, NavLink } from 'react-router-dom';
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
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      onClose();
      triggerHapticFeedback(10);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
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

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Helper function for NavLink className
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center space-x-3 p-3 rounded-xl 
    transition-all duration-300 text-left relative overflow-hidden
    ${
      isActive
        ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 text-white shadow-lg'
        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent hover:border-slate-600/30'
    }`;

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer container */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-slate-700/50 shadow-2xl z-50 transform transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-drawer-title"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-lg font-bold shadow-lg ring-1 ring-orange-500/30">
              NC
            </div>
            <div>
              <h2 id="mobile-drawer-title" className="text-base font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent leading-tight">
                Nata Cara
              </h2>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                Project Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar space-y-0.5 h-[calc(100%-140px)]">
          {navLinksConfig.map((group, groupIndex) => (
            <div key={group.id || groupIndex} className="mb-4 last:mb-0">
              <button
                onClick={() => toggleGroup(group.id)}
                className="
                  w-full flex items-center justify-between mb-2 px-2 py-1.5
                  rounded-md hover:bg-slate-700/30 transition-all duration-200
                  group cursor-pointer
                "
                aria-label={`Toggle ${group.name} section`}
                aria-expanded={expandedGroups.includes(group.id)}
              >
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-400">
                  {group.name}
                </h3>
                <div className="p-1 rounded-md text-slate-400 group-hover:text-slate-200 transition-colors">
                  {expandedGroups.includes(group.id) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </div>
              </button>

              {expandedGroups.includes(group.id) && (
                <div className="space-y-0.5">
                  {(() => {
                    const allChildren = group.children || [];
                    const filteredChildren = allChildren.filter((item: any) =>
                      hasPermission(currentUser, item.requiredPermission)
                    );

                    return filteredChildren;
                  })().map((item: any, itemIndex: number) => {
                    const Icon = getIconForView(item.id);
                    
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

                    const path = routeMap[item.id] || '/';

                    return (
                      <div key={item.id || itemIndex} className="relative group/item">
                        <NavLink
                          to={path}
                          className={getNavLinkClass}
                          title={item.name}
                          onClick={onClose}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 to-red-500"></div>
                              )}

                              <Icon
                                size={16}
                                className={`flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-500 group-hover/item:text-slate-300'}`}
                              />

                              <span
                                className={`text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}
                              >
                                {item.name}
                              </span>

                              {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </>
                          )}
                        </NavLink>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User profile section */}
        <div className="border-t border-slate-700/20 p-3 bg-slate-800/20">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`
                w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg 
                bg-slate-700/30 hover:bg-slate-700/50 
                text-slate-200 transition-all duration-200
                border border-slate-600/20 hover:border-slate-500/30
                group/profile
              `}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-slate-900 rounded-full"></div>
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-[13px] font-semibold text-slate-200 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 truncate whitespace-nowrap overflow-hidden text-ellipsis font-medium max-w-[140px]">
                  {currentUser?.email || 'user@example.com'}
                </p>
              </div>
              <ChevronDown
                size={12}
                className="text-slate-400 group-hover/profile:text-slate-300 transition-colors flex-shrink-0"
              />
            </button>

            {showUserMenu && (
              <div
                className="
                absolute bottom-full left-0 right-0 mb-2 
                bg-slate-800 border border-slate-600/50 rounded-lg shadow-2xl 
                overflow-hidden backdrop-blur-sm
              "
              >
                <div className="p-1.5 space-y-0.5">
                  <NavLink
                    to="/profile"
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 text-left text-[13px] font-medium"
                    onClick={() => {
                      setShowUserMenu(false);
                      onClose();
                    }}
                  >
                    <User size={14} />
                    <span>Profile</span>
                  </NavLink>

                  <NavLink
                    to="/settings/master-data"
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 text-left text-[13px] font-medium"
                    onClick={() => {
                      setShowUserMenu(false);
                      onClose();
                    }}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </NavLink>

                  <div className="border-t border-slate-600/20 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="
                      w-full flex items-center space-x-2.5 px-3 py-2 rounded-md 
                      text-slate-300 hover:bg-red-600/20 hover:text-red-400 
                      transition-all duration-200 text-left text-[13px] font-medium
                    "
                  >
                    <LogOut size={14} />
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
