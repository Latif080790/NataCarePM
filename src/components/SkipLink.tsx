import React from 'react';

/**
 * SkipLink Component
 * Provides keyboard navigation skip link for screen readers and keyboard users
 * 
 * WCAG 2.1 AA: Bypass Blocks (2.4.1)
 * Allows keyboard users to skip repetitive navigation
 */
export const SkipLink: React.FC = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="
        sr-only 
        focus:not-sr-only 
        focus:absolute 
        focus:top-4 
        focus:left-4 
        focus:z-[100] 
        focus:bg-blue-600 
        focus:text-white 
        focus:px-4 
        focus:py-2 
        focus:rounded-lg 
        focus:shadow-lg
        focus:font-medium
        focus:outline-none
        focus:ring-2
        focus:ring-blue-300
        focus:ring-offset-2
      "
    >
      Skip to main content
    </a>
  );
};
