/**
 * FAB - Floating Action Button
 * 
 * Mobile-optimized floating action button for primary actions.
 * 
 * @component
 */

import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

export interface FABProps {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

/**
 * Floating Action Button
 */
export function FAB({
  icon: Icon,
  onClick,
  label,
  variant = 'primary',
  position = 'bottom-right',
  className = '',
}: FABProps) {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/50',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-600/50',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/50',
  };

  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionStyles[position]} z-50
        w-14 h-14 rounded-full
        ${variantStyles[variant]}
        shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200
        active:scale-95
        md:hidden
        ${className}
      `}
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </button>
  );
}

/**
 * Extended FAB with menu options
 */
export interface FABMenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export interface FABMenuProps {
  mainIcon: LucideIcon;
  mainLabel: string;
  items: FABMenuItem[];
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function FABMenu({
  mainIcon: MainIcon,
  mainLabel,
  items,
  variant = 'primary',
  position = 'bottom-right',
}: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/50',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-600/50',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/50',
  };

  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  const menuPositionStyles = {
    'bottom-right': 'right-0 bottom-16',
    'bottom-left': 'left-0 bottom-16',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-16',
  };

  return (
    <div className={`fixed ${positionStyles[position]} z-50 md:hidden`}>
      {/* Menu Items */}
      {isOpen && (
        <div className={`absolute ${menuPositionStyles[position]} flex flex-col gap-3 mb-2`}>
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className="
                    w-12 h-12 rounded-full
                    bg-white hover:bg-gray-100
                    shadow-lg
                    flex items-center justify-center
                    transition-all duration-200
                    active:scale-95
                  "
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5 text-gray-700" />
                </button>
                <span className="text-sm font-medium text-gray-900 bg-white px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full
          ${variantStyles[variant]}
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-200
          active:scale-95
          ${isOpen ? 'rotate-45' : ''}
        `}
        aria-label={mainLabel}
        aria-expanded={isOpen}
      >
        <MainIcon className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * // Simple FAB
 * <FAB
 *   icon={Plus}
 *   label="Add new item"
 *   onClick={() => console.log('clicked')}
 *   variant="primary"
 * />
 * 
 * // FAB with menu
 * <FABMenu
 *   mainIcon={Plus}
 *   mainLabel="Create new"
 *   items={[
 *     { icon: FileText, label: 'New Report', onClick: () => {} },
 *     { icon: Users, label: 'New Task', onClick: () => {} },
 *     { icon: Calendar, label: 'New Event', onClick: () => {} },
 *   ]}
 * />
 */

