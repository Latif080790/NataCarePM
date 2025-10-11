import React from 'react';
import { navLinksConfig, hasPermission } from '../constants';
import { LogOut, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export default function Sidebar({ currentView, onNavigate, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  
  return (
    <aside className={`flex flex-col glass-dark border-r border-white/10 text-white transition-all duration-500 ease-out ${isCollapsed ? 'w-20' : 'w-72'} relative z-30`}>
      {/* Logo & Brand */}
      <div className={`flex items-center p-6 border-b border-white/10 h-[80px] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-coral to-accent-coral-dark flex items-center justify-center text-white text-xl font-bold floating">
              🏗️
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">NATA'CARA</h1>
              <p className="text-xs text-white/60">Project Management</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 rounded-xl glass hover:bg-white/20 transition-all duration-300 group"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronsRight size={20} className="group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronsLeft size={20} className="group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navLinksConfig.map((group, groupIndex) => (
          <div key={group.id} className={`space-y-2 animate-slideIn`} style={{ animationDelay: `${groupIndex * 100}ms` }}>
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-2 py-1">
                <h2 className="text-xs font-bold text-white/70 uppercase tracking-wider">{group.name}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
            )}
            <div className="space-y-1">
              {group.children.map((link, linkIndex) => (
                hasPermission(currentUser, link.requiredPermission) && (
                  <button
                    key={link.id}
                    onClick={() => onNavigate(link.id)}
                    title={link.name}
                    className={`group w-full flex items-center p-3 rounded-xl text-sm transition-all duration-300 hover:scale-105 ${
                      currentView === link.id
                        ? 'bg-gradient-to-r from-accent-coral to-accent-coral-dark text-white shadow-coral transform scale-105'
                        : 'text-white/70 hover:bg-white/10 hover:text-white glass'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    style={{ animationDelay: `${(groupIndex * 100) + (linkIndex * 50)}ms` }}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`}>
                      <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        currentView === link.id ? 'text-white' : 'text-white/70 group-hover:text-white'
                      }`} />
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <span className="font-medium truncate block">{link.name}</span>
                        {link.id === 'dashboard' && (
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Enterprise
                          </span>
                        )}
                      </div>
                    )}
                    {!isCollapsed && currentView === link.id && (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    )}
                  </button>
                )
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {!isCollapsed && currentUser && (
          <div className="glass rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-blue-dark flex items-center justify-center text-white text-sm font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-white/60 truncate">{currentUser.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={logout} 
          title="Logout" 
          className={`group w-full flex items-center p-3 rounded-xl text-sm text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 hover:scale-105 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className={`h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform ${!isCollapsed ? 'mr-3' : ''}`} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.6s ease-out forwards;
        }
      `}</style>
    </aside>
  );
}