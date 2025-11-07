/**
 * Mobile Bottom Navigation Component
 * Thumb-friendly navigation for mobile devices
 */

import { Home, FileText, Users, BarChart3, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isMobile } from '@/utils/mobile';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/projects', icon: FileText, label: 'Projects' },
  { path: '/workers', icon: Users, label: 'Workers' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only show on mobile
  if (!isMobile()) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full touch-target ${
                isActive 
                  ? 'text-emerald-500' 
                  : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-2' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
