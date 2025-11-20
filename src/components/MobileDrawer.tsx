/**
 * MobileDrawer Component
 *
 * Slide-in navigation drawer for mobile devices
 * Features:
 * - Smooth slide animation from left
 * - Swipe-to-close gesture support
 * - Backdrop overlay with tap-to-close
 * - iOS safe area support
 * - Grouped navigation items
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { navLinksConfig, hasPermission } from '@/constants';
import {
  detectSwipe,
  triggerHapticFeedback,
  disableBodyScroll,
  enableBodyScroll,
} from '@/constants/responsive';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['project-management']);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      onClose();
      triggerHapticFeedback(10);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  // Handle touch events for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const swipe = detectSwipe(
      touchStartRef.current.x,
      touchStartRef.current.y,
      touch.clientX,
      touch.clientY,
      touchStartRef.current.time,
      Date.now(),
      50
    );

    // Close drawer on swipe left
    if (swipe?.direction === 'left' && swipe.distance > 100) {
      onClose();
      triggerHapticFeedback(10);
    }

    touchStartRef.current = null;
  };

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      disableBodyScroll();
    } else {
      enableBodyScroll();
    }

    return () => {
      enableBodyScroll();
    };
  }, [isOpen]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Helper function for NavLink className
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center space-x-3 p-3 rounded-xl 
    transition-all duration-300 text-left relative overflow-hidden
    ${
      isActive
        ? 'bg-persimmon text-white shadow-lg font-medium'
        : 'text-palladium hover:bg-night-black-800 hover:text-white border border-transparent'
    }`;

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer container */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 left-0 h-full w-80 bg-night-black
          border-r border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-drawer-title"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-night-black-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-persimmon flex items-center justify-center text-white text-lg font-bold shadow-lg">
              NC
            </div>
            <div>
              <h2 id="mobile-drawer-title" className="text-base font-bold text-white leading-tight">
                Nata Cara
              </h2>
              <p className="text-[10px] text-palladium font-medium tracking-wide uppercase">
                Project Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar space-y-0.5 h-[calc(100%-140px)]">
          {navLinksConfig.map((group, groupIndex) => (
            <div key={group.id || groupIndex} className="mb-4 last:mb-0">
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
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300">
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

              {expandedGroups.includes(group.id) && (
                <div className="space-y-0.5">
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
                          title={item.name}
                          onClick={onClose}
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

                              <span
                                className={`text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}
                              >
                                {item.name}
                              </span>
                            </>
                          )}
                        </NavLink>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User profile section */}
        <div className="border-t border-gray-800 p-3 bg-night-black-800">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`
                w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg 
                bg-night-black hover:bg-gray-800 
                text-white transition-all duration-200
                border border-gray-700 hover:border-gray-600
                group/profile
              `}
            >
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-persimmon to-orange-600 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                  {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-night-black rounded-full"></div>
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-[13px] font-bold text-white truncate">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[10px] text-gray-400 truncate font-medium">
                  {currentUser?.roleId || 'Viewer'}
                </p>
              </div>
              <ChevronDown
                size={12}
                className="text-gray-500 group-hover/profile:text-white transition-colors flex-shrink-0"
              />
            </button>

            {showUserMenu && (
              <div
                className="
                absolute bottom-full left-0 right-0 mb-2 
                bg-night-black border border-gray-700 rounded-lg shadow-2xl 
                overflow-hidden
              "
              >
                <div className="p-1.5 space-y-0.5">
                  <NavLink
                    to="/profile"
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 text-left text-[13px] font-medium"
                    onClick={() => {
                      setShowUserMenu(false);
                      onClose();
                    }}
                  >
                    <User size={14} />
                    <span>Profile</span>
                  </NavLink>

                  <NavLink
                    to="/settings/master-data"
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 text-left text-[13px] font-medium"
                    onClick={() => {
                      setShowUserMenu(false);
                      onClose();
                    }}
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </NavLink>

                  <div className="border-t border-gray-700 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="
                      w-full flex items-center space-x-2.5 px-3 py-2 rounded-md 
                      text-red-400 hover:bg-red-500/10 hover:text-red-300 
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
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
