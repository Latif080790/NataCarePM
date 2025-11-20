import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  User,
  Zap,
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
      ? 'bg-persimmon text-white shadow-md font-medium'
      : 'text-palladium hover:bg-night-black-800 hover:text-white border border-transparent'
  }`;

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  // Expand all groups by default for better UX
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'project-management',
    'field-operations',
    'finance-cost',
    'logistics-assets',
    'documents-reports',
    'system-settings',
  ]);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      h-full bg-night-black
      border-r border-gray-800 shadow-xl
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
        py-6 border-b border-gray-800 bg-night-black-800
      `}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} w-full`}>
          {!isCollapsed && (
            <>
              <div className="w-10 h-10 rounded-lg bg-persimmon flex items-center justify-center text-white text-lg font-bold shadow-lg">
                NC
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
                  Nata Cara
                </h1>
                <p className="text-[11px] text-palladium font-medium tracking-wide uppercase">
                  Project Management
                </p>
              </div>
            </>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-persimmon flex items-center justify-center text-white text-sm font-bold shadow-lg">
              NC
            </div>
          )}
        </div>

        {/* Collapse Button Below Logo */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            ${isCollapsed ? 'w-8' : 'w-full'} mt-4
            p-1.5 rounded-md bg-night-black hover:bg-gray-800 
            text-palladium hover:text-white transition-all duration-200
            border border-gray-700 hover:border-gray-600
            group flex items-center justify-center
          `}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <ChevronsRight size={14} className="group-hover:scale-110 transition-transform" />
          ) : (
            <div className="flex items-center space-x-2">
              <ChevronsLeft size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Collapse Menu</span>
            </div>
          )}
        </button>
      </div>

      {/* Enhanced Navigation Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-1">
        {navLinksConfig.map((group, groupIndex) => (
          <div key={group.id || groupIndex} className="mb-6 last:mb-0">
            {!isCollapsed && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="
                  w-full flex items-center justify-between mb-2 px-2 py-1.5
                  rounded-md hover:bg-white/5 transition-all duration-200
                  group cursor-pointer
                "
                aria-label={`Toggle ${group.name} section`}
                aria-expanded={expandedGroups.includes(group.id)}
              >
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300">
                  {group.name}
                </h3>
                <div className="p-1 rounded-md text-gray-600 group-hover:text-gray-400 transition-colors">
                  {expandedGroups.includes(group.id) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </div>
              </button>
            )}

            {(isCollapsed || expandedGroups.includes(group.id)) && (
              <div className="space-y-1">
                {(() => {
                  const allChildren = group.children || [];
                  const filteredChildren = allChildren.filter((item: any) =>
                    hasPermission(currentUser, item.requiredPermission)
                  );

                  return filteredChildren;
                })().map((item: any, itemIndex: number) => {
                  const Icon = item.icon;
                  
                  return (
                    <div key={item.id || itemIndex} className="relative group/item">
                      <NavLink
                        to={item.path || '#'}
                        className={getNavLinkClass}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 rounded-r"></div>
                            )}

                            <Icon
                              size={18}
                              className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover/item:text-white transition-colors'}`}
                            />

                            {!isCollapsed && (
                              <span
                                className={`text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}
                              >
                                {item.name}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>

                      {isCollapsed && (
                        <div
                          className="
                            absolute left-full ml-2 top-1/2 -translate-y-1/2 
                            px-3 py-2 bg-night-black-800 border border-gray-700 rounded-lg shadow-xl
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
      <div className="border-t border-gray-800 p-4 bg-night-black-800">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`
              w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-3'} py-2.5 rounded-xl 
              bg-night-black hover:bg-gray-800 
              text-white transition-all duration-200
              border border-gray-700 hover:border-gray-600
              group/profile shadow-sm
            `}
          >
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-persimmon to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-night-black rounded-full"></div>
            </div>

            {!isCollapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[13px] font-bold text-white truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate font-medium">
                    {currentUser?.roleId || 'Viewer'}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className="text-gray-500 group-hover/profile:text-white transition-colors flex-shrink-0"
                />
              </>
            )}
          </button>

          {showUserMenu && !isCollapsed && (
            <div
              className="
              absolute bottom-full left-0 right-0 mb-3 
              bg-night-black border border-gray-700 rounded-xl shadow-2xl 
              overflow-hidden ring-1 ring-black/5
            "
            >
              <div className="p-2 space-y-1">
                <NavLink
                  to="/profile"
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 text-left text-[13px] font-medium"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={16} />
                  <span>Profile Saya</span>
                </NavLink>

                <NavLink
                  to="/settings/master-data"
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 text-left text-[13px] font-medium"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  <span>Pengaturan</span>
                </NavLink>

                <div className="border-t border-gray-700 my-1.5"></div>

                <button
                  onClick={handleLogout}
                  className="
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg 
                    text-red-400 hover:bg-red-500/10 hover:text-red-300 
                    transition-all duration-200 text-left text-[13px] font-medium
                  "
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">SYSTEM ONLINE</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <Zap size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] text-white font-bold tracking-wide">PRO v2.0</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
