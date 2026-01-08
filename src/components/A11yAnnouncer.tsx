/**
 * A11yAnnouncer - Global Accessibility Announcer Component
 * 
 * Provides a global live region for screen reader announcements.
 * Use via the exported announce() function or useAnnounce hook.
 * 
 * Features:
 * - ARIA live region for dynamic content
 * - Polite and assertive announcement modes
 * - Singleton pattern for global access
 * - Auto-clear after announcement
 * 
 * @component
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

type AnnouncementPoliteness = 'polite' | 'assertive';

interface Announcement {
  message: string;
  politeness: AnnouncementPoliteness;
  timestamp: number;
}

interface A11yAnnouncerContextType {
  announce: (message: string, politeness?: AnnouncementPoliteness) => void;
}

// ============================================================================
// Context
// ============================================================================

const A11yAnnouncerContext = createContext<A11yAnnouncerContextType | null>(null);

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the announcer
 * 
 * @example
 * const { announce } = useAnnounce();
 * 
 * // Polite announcement (default)
 * announce('Items loaded successfully');
 * 
 * // Assertive announcement (for errors/urgent)
 * announce('Error saving data', 'assertive');
 */
export function useAnnounce(): A11yAnnouncerContextType {
  const context = useContext(A11yAnnouncerContext);
  if (!context) {
    // Return a no-op if context not available (for SSR or tests)
    return {
      announce: (message: string) => {
        console.debug('A11yAnnouncer not available:', message);
      },
    };
  }
  return context;
}

// ============================================================================
// Global announce function (for use outside React components)
// ============================================================================

let globalAnnounce: ((message: string, politeness?: AnnouncementPoliteness) => void) | null = null;

/**
 * Global announce function for use outside React components
 * 
 * @example
 * import { announce } from '@/components/A11yAnnouncer';
 * 
 * announce('Data saved successfully');
 * announce('Error occurred', 'assertive');
 */
export function announce(message: string, politeness: AnnouncementPoliteness = 'polite'): void {
  if (globalAnnounce) {
    globalAnnounce(message, politeness);
  } else {
    console.debug('A11yAnnouncer not mounted:', message);
  }
}

// ============================================================================
// Provider Component
// ============================================================================

interface A11yAnnouncerProviderProps {
  children: React.ReactNode;
}

export function A11yAnnouncerProvider({ children }: A11yAnnouncerProviderProps) {
  const [politeAnnouncement, setPoliteAnnouncement] = useState<Announcement | null>(null);
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<Announcement | null>(null);
  
  const politeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const assertiveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleAnnounce = useCallback((message: string, politeness: AnnouncementPoliteness = 'polite') => {
    const announcement: Announcement = {
      message,
      politeness,
      timestamp: Date.now(),
    };

    if (politeness === 'assertive') {
      setAssertiveAnnouncement(announcement);
      
      // Clear after 3 seconds
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current);
      }
      assertiveTimeoutRef.current = setTimeout(() => {
        setAssertiveAnnouncement(null);
      }, 3000);
    } else {
      setPoliteAnnouncement(announcement);
      
      // Clear after 3 seconds
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current);
      }
      politeTimeoutRef.current = setTimeout(() => {
        setPoliteAnnouncement(null);
      }, 3000);
    }
  }, []);

  // Register global function
  useEffect(() => {
    globalAnnounce = handleAnnounce;
    return () => {
      globalAnnounce = null;
      if (politeTimeoutRef.current) clearTimeout(politeTimeoutRef.current);
      if (assertiveTimeoutRef.current) clearTimeout(assertiveTimeoutRef.current);
    };
  }, [handleAnnounce]);

  return (
    <A11yAnnouncerContext.Provider value={{ announce: handleAnnounce }}>
      {children}
      
      {/* Polite Live Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncement?.message || ''}
      </div>
      
      {/* Assertive Live Region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncement?.message || ''}
      </div>
    </A11yAnnouncerContext.Provider>
  );
}

// ============================================================================
// Common Announcement Helpers
// ============================================================================

export const announceHelpers = {
  /** Announce loading state */
  loading: (item: string) => announce(`Loading ${item}...`),
  
  /** Announce successful action */
  success: (action: string) => announce(`${action} completed successfully`),
  
  /** Announce error */
  error: (message: string) => announce(message, 'assertive'),
  
  /** Announce navigation */
  navigate: (page: string) => announce(`Navigated to ${page}`),
  
  /** Announce form validation error */
  validationError: (field: string, error: string) => announce(`${field}: ${error}`, 'assertive'),
  
  /** Announce item count change */
  itemCount: (count: number, item: string) => announce(`${count} ${item}${count !== 1 ? 's' : ''} found`),
  
  /** Announce modal opened */
  modalOpened: (title: string) => announce(`Dialog opened: ${title}`),
  
  /** Announce modal closed */
  modalClosed: () => announce('Dialog closed'),
};

export default A11yAnnouncerProvider;
