import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { Select } from './FormControls';
import { LogOut } from 'lucide-react';
import LiveActivityFeed from './LiveActivityFeed';
import ChatIcon from './ChatIcon';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  children?: React.ReactNode;
}

export default function Header({ children, isSidebarCollapsed }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const { workspaces, currentProject, setCurrentProjectId, loading } = useProject();

  if (!currentUser || !workspaces) {
    return null; // or a loading state
  }

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 glass border-b border-violet-essence/20 flex-shrink-0 min-h-[80px] sticky top-0 z-40 backdrop-blur-xl gap-4">
      <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
        {/* Enhanced Project Switcher */}
        <div className="w-full md:w-72">
          <div className="relative">
            <Select
              value={currentProject?.id || ''}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              disabled={loading}
              className="font-semibold text-night-black bg-brilliance/50 border-violet-essence/30 rounded-xl px-4 py-3 glass-subtle backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 focus:ring-2 focus:ring-precious-persimmon/20 focus:border-precious-persimmon/50 w-full"
              aria-label="Select project"
            >
              {workspaces.map((ws) => (
                <optgroup label={ws.name} key={ws.id}>
                  {ws.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 rounded-full border-2 border-precious-persimmon/20 border-t-precious-persimmon animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Project Location */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl glass-subtle border border-violet-essence/20">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <p className="text-sm text-palladium font-medium">
            {currentProject?.location || 'No location set'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 flex-wrap md:flex-nowrap">
        {children}
        
        {/* Chat Icon */}
        <ChatIcon onClick={() => {
          // Dispatch a custom event to navigate to chat view
          window.dispatchEvent(new CustomEvent('navigateToView', { detail: 'chat' }));
        }} />

        {/* Enhanced Live Activity Feed */}
        <div className="hidden xl:block">
          <LiveActivityFeed limit={5} compact={true} />
        </div>

        {/* Enhanced User Menu */}
        <div className="flex items-center gap-3 p-2 rounded-2xl glass-subtle border border-violet-essence/20 hover:border-violet-essence/40 transition-all duration-300">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl shadow-md border-2 border-violet-essence/20 hover:border-precious-persimmon/50 transition-all duration-300"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-brilliance animate-pulse"></div>
          </div>

          <div className="hidden lg:block min-w-0">
            <p className="font-semibold text-sm text-night-black truncate">{currentUser.name}</p>
            <p className="text-xs text-palladium truncate">{workspaces[0]?.name}</p>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-red-500/10 text-palladium hover:text-red-400 transition-all duration-300 group border border-transparent hover:border-red-400/20"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}