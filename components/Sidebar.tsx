import React from 'react';
import { navLinksConfig, hasPermission } from '../constants';
import { LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
    <aside className={`flex flex-col bg-night-black text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center p-4 border-b border-violet-essence/50 h-[65px] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h1 className="text-xl font-bold text-persimmon">NATA'CARA</h1>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded hover:bg-violet-essence/50">
          {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        {navLinksConfig.map(group => (
            <div key={group.id}>
              {!isCollapsed && <h2 className="px-2 py-1 text-xs font-semibold text-palladium uppercase tracking-wider">{group.name}</h2>}
              {group.children.map(link => (
                hasPermission(currentUser, link.requiredPermission) && (
                  <button
                    key={link.id}
                    onClick={() => onNavigate(link.id)}
                    title={link.name}
                    className={`w-full flex items-center p-2 rounded-md text-sm transition-colors ${
                      currentView === link.id
                        ? 'bg-persimmon text-white'
                        : 'text-gray-300 hover:bg-violet-essence/50 hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <link.icon className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                    {!isCollapsed && <span className="truncate">{link.name}</span>}
                  </button>
                )
              ))}
            </div>
        ))}
      </nav>

      <div className="p-4 border-t border-violet-essence/50">
           <button onClick={logout} title="Logout" className={`w-full flex items-center p-2 rounded-md text-sm text-gray-300 hover:bg-violet-essence/50 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}>
                <LogOut className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
                 {!isCollapsed && <span className="truncate">Logout</span>}
           </button>
      </div>
    </aside>
  );
}
