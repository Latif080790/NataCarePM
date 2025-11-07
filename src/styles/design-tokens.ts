/**
 * 🎨 Design Tokens - Enterprise Design System
 * NataCarePM - Consistent, Professional, Scalable
 * 
 * Usage:
 * import { designTokens } from '@/styles/design-tokens';
 * const primaryColor = designTokens.colors.primary[600];
 */

export const designTokens = {
  /**
   * Color Palette - Carefully selected for enterprise use
   * Based on accessibility standards (WCAG AA minimum)
   */
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // Main primary
      600: '#2563eb',  // Primary interactive (buttons, links)
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },

    // Semantic Colors - For status, alerts, feedback
    semantic: {
      success: '#10b981',      // Green - positive actions, completed
      successLight: '#d1fae5',
      warning: '#f59e0b',      // Amber - warnings, attention needed
      warningLight: '#fef3c7',
      error: '#ef4444',        // Red - errors, critical issues
      errorLight: '#fee2e2',
      info: '#3b82f6',         // Blue - information, tips
      infoLight: '#dbeafe',
    },

    // Neutral/Gray Scale - For text, backgrounds, borders
    neutral: {
      0: '#ffffff',           // Pure white
      50: '#f9fafb',         // Lightest gray - backgrounds
      100: '#f3f4f6',        // Light gray - hover states
      200: '#e5e7eb',        // Border color light
      300: '#d1d5db',        // Border color
      400: '#9ca3af',        // Placeholder text
      500: '#6b7280',        // Secondary text
      600: '#4b5563',        // Primary text secondary
      700: '#374151',        // Primary text
      800: '#1f2937',        // Headings
      900: '#111827',        // Darkest text
    },

    // Accent Colors - For highlights, special elements (use sparingly)
    accent: {
      coral: '#F87941',      // Original brand color
      coralLight: '#FEE8E0',
      purple: '#8b5cf6',
      purpleLight: '#ede9fe',
      emerald: '#10b981',
      emeraldLight: '#d1fae5',
    }
  },

  /**
   * Spacing Scale - 8px base grid system
   * Consistent spacing throughout the application
   */
  spacing: {
    0: '0',
    xs: '4px',      // Tiny gaps
    sm: '8px',      // Small gaps, icon margins
    md: '16px',     // Default spacing
    lg: '24px',     // Section spacing
    xl: '32px',     // Large section spacing
    '2xl': '48px',  // Major section breaks
    '3xl': '64px',  // Page-level spacing
    '4xl': '96px',  // Hero spacing
  },

  /**
   * Typography System - Clear hierarchy
   */
  typography: {
    // Font Families
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'Monaco, Courier, monospace',
    },

    // Font Sizes & Weights
    heading1: {
      size: '36px',
      lineHeight: '44px',
      weight: 700,
      letterSpacing: '-0.02em',
    },
    heading2: {
      size: '30px',
      lineHeight: '38px',
      weight: 700,
      letterSpacing: '-0.01em',
    },
    heading3: {
      size: '24px',
      lineHeight: '32px',
      weight: 600,
      letterSpacing: '0',
    },
    heading4: {
      size: '20px',
      lineHeight: '28px',
      weight: 600,
      letterSpacing: '0',
    },
    heading5: {
      size: '18px',
      lineHeight: '26px',
      weight: 600,
      letterSpacing: '0',
    },
    body: {
      size: '16px',
      lineHeight: '24px',
      weight: 400,
      letterSpacing: '0',
    },
    bodyMedium: {
      size: '16px',
      lineHeight: '24px',
      weight: 500,
      letterSpacing: '0',
    },
    small: {
      size: '14px',
      lineHeight: '20px',
      weight: 400,
      letterSpacing: '0',
    },
    smallMedium: {
      size: '14px',
      lineHeight: '20px',
      weight: 500,
      letterSpacing: '0',
    },
    tiny: {
      size: '12px',
      lineHeight: '16px',
      weight: 400,
      letterSpacing: '0',
    },
    tinyMedium: {
      size: '12px',
      lineHeight: '16px',
      weight: 500,
      letterSpacing: '0',
    },
  },

  /**
   * Shadow System - Subtle depth
   */
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  /**
   * Border Radius - Consistent rounding
   */
  borderRadius: {
    none: '0',
    sm: '4px',      // Small elements
    md: '8px',      // Cards, buttons
    lg: '12px',     // Large cards
    xl: '16px',     // Modals
    full: '9999px', // Pills, badges
  },

  /**
   * Border Width
   */
  borderWidth: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },

  /**
   * Animation/Transition - Subtle, purposeful
   */
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slowest: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  /**
   * Z-Index Scale - Layering system
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
    toast: 1500,
  },

  /**
   * Breakpoints - Responsive design
   */
  breakpoints: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px', // Extra large
  },
};

/**
 * Helper Functions for Design Tokens
 */

// Get color by path
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

// Get spacing value
export const getSpacing = (size: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[size];
};

// Get typography style object
export const getTypography = (variant: keyof typeof designTokens.typography) => {
  return designTokens.typography[variant];
};

// Export individual categories for convenience
export const colors = designTokens.colors;
export const spacing = designTokens.spacing;
export const typography = designTokens.typography;
export const shadows = designTokens.shadows;
export const borderRadius = designTokens.borderRadius;
export const transitions = designTokens.transitions;
