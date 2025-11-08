import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
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
  Zap,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navLinksConfig, hasPermission } from '@/constants';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

// Helper function for NavLink className
const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `w-full flex items-center space-x-3 p-3 rounded-lg 
  transition-all duration-300 text-left relative overflow-hidden
  ${
    isActive
      ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm font-medium'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200'
  }`;

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  // Expand all groups by default for better UX
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'main-group',
    'ai-analytics-group',
    'monitoring-group',
    'keuangan-group',
    'lainnya-group',
    'pengaturan-group',
  ]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getIconForView = (viewId: string) => {
    const iconMap: { [key: string]: any } = {
      dashboard: BarChart3,
      analytics: TrendingUp,
      rab_ahsp: FileText,
      jadwal: Calendar,
      tasks: CheckSquare,
      kanban: CheckSquare,
      dependencies: BarChart3,
      resources: Users,
      timeline: Calendar,
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
      documents: Brain, // Intelligent Document System
      laporan: FileText,
      profile: User,
      user_management: Users,
      master_data: Settings,
      audit_trail: History,
    };
    return iconMap[viewId] || Activity;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  return (
    <aside
      className={`
      ${isCollapsed ? 'w-20' : 'w-80'} 
      h-full bg-white
      border-r border-gray-200 shadow-sm
      transition-all duration-500 ease-out
      relative z-30 flex flex-col
      md:static md:translate-x-0
      ${isCollapsed ? 'fixed -translate-x-full md:translate-x-0' : 'fixed inset-y-0 left-0 md:static'}
    `}
    >
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Enhanced Logo & Brand Section */}
      <div
        className={`
        flex flex-col ${isCollapsed ? 'items-center px-3' : 'px-5'} 
        py-4 border-b border-gray-200 bg-gray-50
      `}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
          {!isCollapsed && (
            <>
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                NC
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  Nata Cara
                </h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wide">
                  Project Management
                </p>
              </div>
            </>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              NC
            </div>
          )}
        </div>

        {/* Collapse Button Below Logo */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            ${isCollapsed ? 'w-8' : 'w-full'} mt-3
            p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 
            text-gray-600 hover:text-gray-900 transition-all duration-200
            border border-gray-200 hover:border-gray-300
            group flex items-center justify-center
          `}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronsRight size={12} className="group-hover:scale-110 transition-transform" />
          ) : (
            <div className="flex items-center space-x-2">
              <ChevronsLeft size={12} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium">Collapse</span>
            </div>
          )}
        </button>
      </div>

      {/* Enhanced Navigation Menu */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar space-y-0.5">
        {navLinksConfig.map((group, groupIndex) => (
          <div key={group.id || groupIndex} className="mb-4 last:mb-0">
            {!isCollapsed && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="
                  w-full flex items-center justify-between mb-2 px-2 py-1.5
                  rounded-md hover:bg-gray-100 transition-all duration-200
                  group cursor-pointer
                "
                aria-label={`Toggle ${group.name} section`}
                aria-expanded={expandedGroups.includes(group.id)}
              >
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-700">
                  {group.name}
                </h3>
                <div className="p-1 rounded-md text-gray-400 group-hover:text-gray-600 transition-colors">
                  {expandedGroups.includes(group.id) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </div>
              </button>
            )}

            {(isCollapsed || expandedGroups.includes(group.id)) && (
              <div className="space-y-0.5">
                {(() => {
                  const allChildren = group.children || [];
                  const filteredChildren = allChildren.filter((item: any) =>
                    hasPermission(currentUser, item.requiredPermission)
                  );

                  console.log(`📋 Group "${group.name}":`, {
                    totalChildren: allChildren.length,
                    filteredChildren: filteredChildren.length,
                    expanded: expandedGroups.includes(group.id),
                    userRole: currentUser?.roleId,
                    allChildrenIds: allChildren.map((c: any) => c.id),
                  });

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
                    resources: '/resources',
                    timeline: '/timeline',
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
                        title={isCollapsed ? item.name : undefined}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                            )}

                            <Icon
                              size={16}
                              className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover/item:text-gray-700'}`}
                            />

                            {!isCollapsed && (
                              <span
                                className={`text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}
                              >
                                {item.name}
                              </span>
                            )}

                            {isActive && !isCollapsed && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></div>
                            )}
                          </>
                        )}
                      </NavLink>

                      {isCollapsed && (
                        <div
                          className="
                            absolute left-full ml-2 top-1/2 -translate-y-1/2 
                            px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded-lg shadow-xl
                            opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-50 
                            whitespace-nowrap text-xs font-medium text-white
                            pointer-events-none
                          "
                        >
                          {item.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Enhanced User Profile Section */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`
              w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-2.5 px-3'} py-2.5 rounded-lg 
              bg-white hover:bg-gray-100 
              text-gray-900 transition-all duration-200
              border border-gray-200 hover:border-gray-300
              group/profile
            `}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
            </div>

            {!isCollapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[13px] font-semibold text-gray-900 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate whitespace-nowrap overflow-hidden text-ellipsis font-medium max-w-[140px]">
                    {currentUser?.email || 'user@example.com'}
                  </p>
                </div>
                <ChevronDown
                  size={12}
                  className="text-gray-400 group-hover/profile:text-gray-600 transition-colors flex-shrink-0"
                />
              </>
            )}
          </button>

          {showUserMenu && !isCollapsed && (
            <div
              className="
              absolute bottom-full left-0 right-0 mb-2 
              bg-white border border-gray-200 rounded-lg shadow-xl 
              overflow-hidden
            "
            >
              <div className="p-1.5 space-y-0.5">
                <NavLink
                  to="/profile"
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-left text-[13px] font-medium"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={14} />
                  <span>Profile</span>
                </NavLink>

                <NavLink
                  to="/settings/master-data"
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 text-left text-[13px] font-medium"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </NavLink>

                <div className="border-t border-gray-200 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="
                    w-full flex items-center space-x-2.5 px-3 py-2 rounded-md 
                    text-gray-700 hover:bg-red-50 hover:text-red-600 
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

        {!isCollapsed && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-gray-500 font-medium">Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap size={11} className="text-blue-600" />
              <span className="text-[10px] text-blue-600 font-semibold">Pro</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}