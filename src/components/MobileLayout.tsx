/**
 * MobileLayout - Mobile-First Layout Component
 * 
 * Optimized layout for mobile devices with:
 * - Bottom navigation bar
 * - Compact header
 * - Touch-friendly spacing
 * - Reduced feature set for performance
 * 
 * @component
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  DollarSign, 
  Package, 
  Users, 
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.minimal';
import { useProject } from '@/contexts/ProjectContext';
import OfflineIndicator from '@/components/OfflineIndicator';

export interface MobileLayoutProps {
  children: React.ReactNode;
  
  // Page Info
  title?: string;
  showBottomNav?: boolean;
  showHeader?: boolean;
  
  // Layout Props
  padding?: 'none' | 'sm' | 'md';
  background?: 'white' | 'gray';
  className?: string;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

/**
 * Mobile Bottom Navigation Items
 */
const BOTTOM_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', icon: Home, label: 'Beranda' },
  { path: '/daily-logs', icon: FileText, label: 'Laporan' },
  { path: '/rab', icon: DollarSign, label: 'RAB' },
  { path: '/inventory', icon: Package, label: 'Inventori' },
  { path: '/menu', icon: Menu, label: 'Menu' },
];

/**
 * Mobile Layout Component
 */
export function MobileLayout({
  children,
  title,
  showBottomNav = true,
  showHeader = true,
  padding = 'md',
  background = 'gray',
  className = '',
}: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { currentProject } = useProject();
  const [showMenu, setShowMenu] = useState(false);

  const paddingClasses = {
    none: 'p-0',
    sm: 'px-3 py-3',
    md: 'px-4 py-4',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile Header */}
      {showHeader && (
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 safe-top">
          <div className="flex items-center justify-between">
            {/* Project Name / Title */}
            <div className="flex-1 min-w-0">
              {currentProject ? (
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-gray-900 truncate">
                    {currentProject.name}
                  </h1>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              ) : (
                <h1 className="text-sm font-semibold text-gray-900">
                  {title || 'NataCarePM'}
                </h1>
              )}
              {title && currentProject && (
                <p className="text-xs text-gray-500 truncate">{title}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Menu Toggle */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Sliding Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 overflow-y-auto">
            {/* User Profile */}
            <div className="p-4 bg-primary-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{currentUser?.name || 'User'}</p>
                  <p className="text-xs text-primary-100 truncate">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="py-2">
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Pengaturan</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 overflow-y-auto ${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}
        style={{ paddingBottom: showBottomNav ? '80px' : '16px' }}
      >
        {children}
      </main>

      {/* Offline Indicator */}
      <OfflineIndicator position="top" showSyncButton={true} />

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-30">
          <div className="flex items-center justify-around px-2 py-2">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1 max-w-[80px]
                    ${active 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* CSS for safe areas (iOS notch support) */}
      <style>{`
        .safe-top {
          padding-top: max(12px, env(safe-area-inset-top));
        }
        .safe-bottom {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}

/**
 * Mobile Card Component - Optimized for touch
 */
export interface MobileCardProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({
  children,
  title,
  action,
  onClick,
  className = '',
}: MobileCardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        ${onClick ? 'active:bg-gray-50 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Mobile Section - Content grouping for mobile
 */
export interface MobileSectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function MobileSection({
  children,
  title,
  className = '',
}: MobileSectionProps) {
  return (
    <section className={`mb-4 ${className}`}>
      {title && (
        <h2 className="text-sm font-semibold text-gray-700 mb-2 px-1">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
