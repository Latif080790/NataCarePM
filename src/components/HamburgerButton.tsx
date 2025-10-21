/**
 * HamburgerButton Component
 *
 * Animated hamburger menu button for mobile navigation
 * Features smooth icon transformation animation
 */

import React from 'react';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const HamburgerButton: React.FC<HamburgerButtonProps> = ({
  isOpen,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        mobile-menu-button touch-target-lg
        relative z-1001
        ${className}
      `}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="mobile-nav-drawer"
    >
      <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
        <span className="sr-only">{isOpen ? 'Close' : 'Open'} navigation menu</span>
      </div>
    </button>
  );
};

export default HamburgerButton;
