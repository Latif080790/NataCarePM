/**
 * BottomNav Component
 * 
 * Bottom navigation bar for mobile devices
 * Features:
 * - 5 main navigation items
 * - Active state highlighting
 * - Icon + label layout
 * - iOS safe area support
 * - Touch-friendly targets (48px minimum)
 */

import React from 'react';
import { BarChart3, CheckSquare, FileArchive, Bell, Menu } from 'lucide-react';

interface BottomNavItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface BottomNavProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onMenuClick: () => void;
}

const NAV_ITEMS: BottomNavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'tasks', name: 'Tasks', icon: CheckSquare },
  { id: 'dokumen', name: 'Documents', icon: FileArchive },
  { id: 'notifications', name: 'Alerts', icon: Bell },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onMenuClick,
}) => {
  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Bottom navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={`Navigate to ${item.name}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={24} className="mobile-bottom-nav-icon" />
            <span className="mobile-bottom-nav-label">{item.name}</span>
          </button>
        );
      })}

      {/* Menu Button */}
      <button
        onClick={onMenuClick}
        className="mobile-bottom-nav-item"
        aria-label="Open menu"
      >
        <Menu size={24} className="mobile-bottom-nav-icon" />
        <span className="mobile-bottom-nav-label">More</span>
      </button>
    </nav>
  );
};

export default BottomNav;
