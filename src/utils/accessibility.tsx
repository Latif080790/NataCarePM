/**
 * Accessibility Utilities & Components
 * 
 * WCAG 2.1 AA Compliance Tools:
 * - Keyboard navigation helpers
 * - Screen reader utilities
 * - Focus management
 * - ARIA label generators
 * - Color contrast checkers
 * - Skip links
 * - Accessible forms
 * 
 * @module AccessibilityUtils
 */

import React, { useEffect, useRef, useState, KeyboardEvent, ReactNode } from 'react';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  role?: string;
  tabIndex?: number;
}

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  global?: boolean;
}

// ============================================================================
// Skip Link Component
// ============================================================================

export interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className = '' }) => {
  return (
    <a
      href={href}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-xl ${className}`}
    >
      {children}
    </a>
  );
};

// ============================================================================
// Screen Reader Only Component
// ============================================================================

export interface ScreenReaderOnlyProps {
  children: ReactNode;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ children }) => {
  return <span className="sr-only">{children}</span>;
};

// ============================================================================
// Live Region for Dynamic Content Announcements
// ============================================================================

export interface LiveRegionProps {
  children: ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'additions text' | 'all';
  role?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  role = 'status',
}) => {
  return (
    <div
      role={role}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
};

// ============================================================================
// Focus Trap Component
// ============================================================================

export interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  returnFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  returnFocus = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      // Restore focus on unmount
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, returnFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!active || e.key !== 'Tab') return;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};

// ============================================================================
// Keyboard Navigation Hook
// ============================================================================

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const modifiersMatch =
          (shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey) &&
          (shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey) &&
          (shortcut.altKey === undefined || shortcut.altKey === e.altKey) &&
          (shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey);

        if (e.key === shortcut.key && modifiersMatch) {
          e.preventDefault();
          shortcut.action();
        }
      }
    };

    const hasGlobalShortcuts = shortcuts.some((s) => s.global);
    
    if (hasGlobalShortcuts) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    
    return undefined;
  }, [shortcuts]);
}

// ============================================================================
// Focus Management Hook
// ============================================================================

export function useFocusManagement() {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleArrowKeys = (
    e: KeyboardEvent,
    itemCount: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ) => {
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

    if (e.key === nextKey) {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % itemCount);
    } else if (e.key === prevKey) {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(itemCount - 1);
    }
  };

  return { focusedIndex, setFocusedIndex, handleArrowKeys };
}

// ============================================================================
// ARIA Label Generators
// ============================================================================

export function generateAriaLabel(
  element: string,
  state?: Record<string, any>
): string {
  if (!state) return element;

  const parts = [element];
  
  if (state.required) parts.push('required');
  if (state.disabled) parts.push('disabled');
  if (state.error) parts.push('invalid');
  if (state.loading) parts.push('loading');
  if (state.selected) parts.push('selected');
  if (state.expanded !== undefined) {
    parts.push(state.expanded ? 'expanded' : 'collapsed');
  }

  return parts.join(', ');
}

export function generateAriaDescription(
  description?: string,
  error?: string,
  hint?: string
): string | undefined {
  const parts = [];
  
  if (description) parts.push(description);
  if (hint) parts.push(hint);
  if (error) parts.push(`Error: ${error}`);

  return parts.length > 0 ? parts.join('. ') : undefined;
}

// ============================================================================
// Color Contrast Checker
// ============================================================================

export interface ContrastRatio {
  ratio: number;
  passesAA: boolean;
  passesAALarge: boolean;
  passesAAA: boolean;
  passesAAALarge: boolean;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check color contrast ratio
 */
export function checkColorContrast(
  foreground: string,
  background: string
): ContrastRatio {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return {
      ratio: 0,
      passesAA: false,
      passesAALarge: false,
      passesAAA: false,
      passesAAALarge: false,
    };
  }

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3,
    passesAAA: ratio >= 7,
    passesAAALarge: ratio >= 4.5,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(
  container: HTMLElement | null
): HTMLElement[] {
  if (!container) return [];

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Trap focus within an element
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = getFocusableElements(element);
  
  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: globalThis.KeyboardEvent) => {
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

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Create unique ID for accessibility
 */
let idCounter = 0;
export function generateA11yId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

// ============================================================================
// Accessible Button Component
// ============================================================================

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'left',
  disabled,
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-label={loading ? loadingText : ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          {loadingText}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </span>
      )}
    </button>
  );
};

// ============================================================================
// Accessible Form Field
// ============================================================================

export interface AccessibleFieldProps {
  id?: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  hideLabel?: boolean;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id: providedId,
  label,
  error,
  hint,
  required = false,
  children,
  hideLabel = false,
}) => {
  const id = providedId || generateA11yId('field');
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'block text-body-small visual-primary font-medium'}
      >
        {label}
        {required && <span aria-label="required"> *</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-caption visual-secondary">
          {hint}
        </p>
      )}

      {React.isValidElement(children) &&
        React.cloneElement(children, {
          id,
          'aria-describedby': describedBy || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
        } as any)}

      {error && (
        <p id={errorId} className="text-caption text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  SkipLink,
  ScreenReaderOnly,
  LiveRegion,
  FocusTrap,
  AccessibleButton,
  AccessibleField,
  useKeyboardShortcuts,
  useFocusManagement,
  generateAriaLabel,
  generateAriaDescription,
  checkColorContrast,
  getFocusableElements,
  trapFocus,
  announceToScreenReader,
  generateA11yId,
};
