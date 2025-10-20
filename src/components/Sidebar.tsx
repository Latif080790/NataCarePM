import React from 'react';
import { useState } from 'react';
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
  Brain
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navLinksConfig, hasPermission } from '@/constants';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export default function Sidebar({ currentView, onNavigate, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  // Expand all groups by default for better UX
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'main-group',
    'ai-analytics-group',
    'monitoring-group', 
    'keuangan-group',
    'lainnya-group',
    'pengaturan-group'
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
      audit_trail: History
    };
    return iconMap[viewId] || Activity;
  };

  const handleNavigate = (viewId: string) => {
    try {
      onNavigate(viewId);
      setShowUserMenu(false);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(g => g !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <aside className={`
      ${isCollapsed ? 'w-20' : 'w-80'} 
      h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
      border-r border-slate-700/50 shadow-2xl
      transition-all duration-500 ease-out
      relative z-30 flex flex-col
      md:static md:translate-x-0
      ${isCollapsed ? 'fixed -translate-x-full md:translate-x-0' : 'fixed inset-y-0 left-0 md:static'}
    `}>
      
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Enhanced Logo & Brand Section */}
      <div className={`
        flex flex-col ${isCollapsed ? 'items-center px-3' : 'px-5'} 
        py-4 border-b border-slate-700/20 bg-slate-800/40
      `}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
          {!isCollapsed && (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-lg font-bold shadow-lg ring-1 ring-orange-500/30">
                NC
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent leading-tight">
                  Nata Cara
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">Project Management</p>
              </div>
            </>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
              NC
            </div>
          )}
        </div>

        {/* Collapse Button Below Logo */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            ${isCollapsed ? 'w-8' : 'w-full'} mt-3
            p-1.5 rounded-md bg-slate-700/30 hover:bg-slate-600/40 
            text-slate-500 hover:text-slate-300 transition-all duration-200
            border border-slate-600/10 hover:border-slate-500/30
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
            )}

            {(isCollapsed || expandedGroups.includes(group.id)) && (
              <div className="space-y-0.5">
                {(() => {
                  const allChildren = group.children || [];
                  const filteredChildren = allChildren.filter((item: any) => hasPermission(currentUser, item.requiredPermission));
                  
                  console.log(`📋 Group "${group.name}":`, {
                    totalChildren: allChildren.length,
                    filteredChildren: filteredChildren.length,
                    expanded: expandedGroups.includes(group.id),
                    userRole: currentUser?.roleId,
                    allChildrenIds: allChildren.map((c: any) => c.id)
                  });
                  
                  return filteredChildren;
                })()
                  .map((item: any, itemIndex: number) => {
                    const isActive = currentView === item.id;
                    const Icon = getIconForView(item.id);

                    return (
                      <div key={item.id || itemIndex} className="relative group/item">
                        <button
                          onClick={() => handleNavigate(item.id)}
                          className={`
                            w-full flex items-center space-x-3 p-3 rounded-xl 
                            transition-all duration-300 text-left relative overflow-hidden
                            ${isActive
                              ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent hover:border-slate-600/30'
                            }
                          `}
                          title={isCollapsed ? item.name : undefined}
                          aria-label={`Navigate to ${item.name}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 to-red-500"></div>
                          )}

                          <Icon 
                            size={16} 
                            className={`flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-500 group-hover/item:text-slate-300'}`} 
                          />
                          
                          {!isCollapsed && (
                            <span className={`text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                              {item.name}
                            </span>
                          )}

                          {isActive && !isCollapsed && (
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </button>

                        {isCollapsed && (
                          <div className="
                            absolute left-full ml-2 top-1/2 -translate-y-1/2 
                            px-2.5 py-1.5 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl
                            opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-50 
                            whitespace-nowrap text-xs font-medium text-slate-200
                            pointer-events-none
                          ">
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
      <div className="border-t border-slate-700/20 p-3 bg-slate-800/20">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`
              w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-2.5 px-3'} py-2.5 rounded-lg 
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
            
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[13px] font-semibold text-slate-200 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate whitespace-nowrap overflow-hidden text-ellipsis font-medium max-w-[140px]">
                    {currentUser?.email || 'user@example.com'}
                  </p>
                </div>
                <ChevronDown size={12} className="text-slate-400 group-hover/profile:text-slate-300 transition-colors flex-shrink-0" />
              </>
            )}
          </button>

          {showUserMenu && !isCollapsed && (
            <div className="
              absolute bottom-full left-0 right-0 mb-2 
              bg-slate-800 border border-slate-600/50 rounded-lg shadow-2xl 
              overflow-hidden backdrop-blur-sm
            ">
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    handleNavigate('profile');
                    setShowUserMenu(false);
                  }}
                  className="
                    w-full flex items-center space-x-2.5 px-3 py-2 rounded-md 
                    text-slate-300 hover:bg-slate-700/50 hover:text-white 
                    transition-all duration-200 text-left text-[13px] font-medium
                  "
                >
                  <User size={14} />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => {
                    handleNavigate('master_data');
                    setShowUserMenu(false);
                  }}
                  className="
                    w-full flex items-center space-x-2.5 px-3 py-2 rounded-md 
                    text-slate-300 hover:bg-slate-700/50 hover:text-white 
                    transition-all duration-200 text-left text-[13px] font-medium
                  "
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                
                <div className="border-t border-slate-600/20 my-1"></div>
                
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
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

        {!isCollapsed && (
          <div className="mt-3 pt-3 border-t border-slate-700/20 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-slate-500 font-medium">Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap size={11} className="text-orange-400" />
              <span className="text-[10px] text-orange-400 font-semibold">Pro</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
