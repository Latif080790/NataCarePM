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
import { useNavigate, NavLink } from 'react-router-dom';
import { BarChart3, CheckSquare, FileArchive, Bell, Menu } from 'lucide-react';

interface BottomNavItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
}

interface BottomNavProps {
  onMenuClick: () => void;
}

const NAV_ITEMS: BottomNavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'tasks', name: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { id: 'dokumen', name: 'Documents', icon: FileArchive, path: '/documents' },
  { id: 'notifications', name: 'Alerts', icon: Bell, path: '/notifications' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick }) => {
  // Helper function for NavLink className
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `mobile-bottom-nav-item ${isActive ? 'active' : ''}`;

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Bottom navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={getNavLinkClass}
            aria-label={`Navigate to ${item.name}`}
          >
            <Icon size={24} className="mobile-bottom-nav-icon" />
            <span className="mobile-bottom-nav-label">{item.name}</span>
          </NavLink>
        );
      })}

      {/* Menu Button */}
      <button onClick={onMenuClick} className="mobile-bottom-nav-item" aria-label="Open menu">
        <Menu size={24} className="mobile-bottom-nav-icon" />
        <span className="mobile-bottom-nav-label">More</span>
      </button>
    </nav>
  );
};

export default BottomNav;