import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger.enhanced';

/**
 * Enhanced Accessibility Hook
 * Provides comprehensive accessibility features including:
 * - Keyboard navigation
 * - Screen reader announcements
 * - Focus management
 * - High contrast mode
 * - Reduced motion support
 */
export const useAccessibility = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Check user preferences on mount
  useEffect(() => {
    // Check for high contrast preference
    const hasHighContrast = localStorage.getItem('highContrast') === 'true' || 
      window.matchMedia('(prefers-contrast: high)').matches;
    setIsHighContrast(hasHighContrast);

    // Check for reduced motion preference
    const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReducedMotion(hasReducedMotion);

    // Apply preferences to document
    if (hasHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }

    // Listen for system preference changes
    const highContrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('high-contrast');
        localStorage.setItem('highContrast', 'true');
      } else {
        document.documentElement.classList.remove('high-contrast');
        localStorage.setItem('highContrast', 'false');
      }
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    highContrastMediaQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionMediaQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastMediaQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionMediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Enhanced keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          // Focus search - announce to screen reader
          announceToScreenReader('Search activated');
          const searchElement = document.getElementById('global-search');
          if (searchElement) {
            searchElement.focus();
          }
          break;
        case 'n':
          e.preventDefault();
          announceToScreenReader('New project creation');
          // Navigate to new project page
          window.location.hash = '/projects/new';
          break;
        case 'd':
          e.preventDefault();
          // Toggle dark/high contrast mode
          toggleHighContrast();
          break;
        case '/':
          e.preventDefault();
          // Open command palette
          announceToScreenReader('Command palette opened');
          const commandPaletteTrigger = document.getElementById('command-palette-trigger');
          if (commandPaletteTrigger) {
            commandPaletteTrigger.click();
          }
          break;
      }
    }

    // Arrow key navigation for focusable elements
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      handleArrowNavigation(e);
    }

    // Skip to main content
    if (e.key === 'Tab' && e.altKey) {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        announceToScreenReader('Skipped to main content');
      }
    }
  }, []);

  // Handle arrow key navigation
  const handleArrowNavigation = (e: KeyboardEvent) => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"]'
    );
    
    const currentIndex = Array.from(focusableElements).findIndex(
      el => el === document.activeElement
    );

    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        break;
    }

    if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
      (focusableElements[nextIndex] as HTMLElement).focus();
      e.preventDefault();
    }
  };

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
    
    // Create live region if it doesn't exist
    if (!announcementRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'accessibility-announcer';
      document.body.appendChild(liveRegion);
      announcementRef.current = liveRegion;
    }

    // Update the live region
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }

    // Log the announcement
    logger.debug('Screen reader announcement', { message });
  }, []);

  // Focus management
  const focusElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      setFocusedElement(elementId);
      announceToScreenReader(`Focused on ${elementId}`);
    }
  }, [announceToScreenReader]);

  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    const newHighContrast = !isHighContrast;
    setIsHighContrast(newHighContrast);
    
    if (newHighContrast) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrast', 'true');
      announceToScreenReader('High contrast mode enabled');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('highContrast', 'false');
      announceToScreenReader('High contrast mode disabled');
    }
  }, [isHighContrast, announceToScreenReader]);

  // Enhanced focus trap for modals/dialogs
  const useFocusTrap = (isActive: boolean) => {
    useEffect(() => {
      if (!isActive) return;

      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTab);
      };
    }, [isActive]);
  };

  // Set up global keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // State
    isHighContrast,
    prefersReducedMotion,
    focusedElement,
    announcements,

    // Actions
    announceToScreenReader,
    focusElement,
    toggleHighContrast,
    useFocusTrap,

    // Utilities
    handleKeyDown,
  };
};

// Helper component for screen reader only content
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Helper component for focusable divs
export const FocusableDiv: React.FC<React.HTMLAttributes<HTMLDivElement> & { className?: string }> = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <div 
    tabIndex={0}
    className={`focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${className}`}
    {...props}
  >
    {children}
  </div>
);
