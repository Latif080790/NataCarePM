import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { Select } from './FormControls';
import { LogOut } from 'lucide-react';
import { LiveActivityFeed } from './LiveActivityFeed';

interface HeaderProps {
    isSidebarCollapsed: boolean;
}

export default function Header({ isSidebarCollapsed }: HeaderProps) {
    const { currentUser, logout } = useAuth();
    const { workspaces, currentProject, setCurrentProjectId, loading, notifications, handleMarkNotificationsRead } = useProject();

    if (!currentUser || !workspaces) {
        return null; // or a loading state
    }
    
    return (
        <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0 h-[65px]">
             <div className="flex-1 flex items-center gap-4">
                {/* Project Switcher */}
                <div className="w-64">
                    <Select 
                        value={currentProject?.id || ''} 
                        onChange={e => setCurrentProjectId(e.target.value)}
                        disabled={loading}
                        className="font-semibold text-night-black"
                    >
                        {workspaces.map(ws => (
                            <optgroup label={ws.name} key={ws.id}>
                                {ws.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </optgroup>
                        ))}
                    </Select>
                </div>
                 <p className="text-sm text-palladium hidden md:block">{currentProject?.location}</p>
             </div>
             <div className="flex items-center gap-4">
                 <LiveActivityFeed notifications={notifications} onReadAll={handleMarkNotificationsRead} />
                 {/* User Menu */}
                 <div className="flex items-center gap-2">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-9 h-9 rounded-full" />
                    <div className="hidden sm:block">
                        <p className="font-semibold text-sm text-night-black">{currentUser.name}</p>
                        <p className="text-xs text-palladium">{workspaces[0]?.name}</p>
                    </div>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-violet-essence/50 text-palladium" title="Logout">
                         <LogOut size={18} />
                    </button>
                 </div>
             </div>
        </header>
    );
}