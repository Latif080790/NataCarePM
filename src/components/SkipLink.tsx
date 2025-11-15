import React from 'react';

/**
 * SkipLink Component
 * Provides keyboard navigation skip link for screen readers and keyboard users
 */
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-500 focus:text-white focus:px-4 focus:py-2 focus:rounded"
    >
      Skip to main content
    </a>
  );
};
