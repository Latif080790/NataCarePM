/**
 * Mobile Responsive Constants and Utilities
 *
 * TypeScript utilities for responsive design including:
 * - Breakpoint constants
 * - Media query strings
 * - React hooks for responsive behavior
 * - Device detection utilities
 */

// ============================================
// BREAKPOINT CONSTANTS
// ============================================

export const BREAKPOINTS = {
  mobileXS: 320, // iPhone SE
  mobileSM: 375, // iPhone 12/13
  mobileMD: 390, // iPhone 14
  mobileLG: 430, // iPhone 14 Pro Max
  tablet: 768, // iPad
  tabletLG: 1024, // iPad Pro
  desktop: 1440, // Desktop
  desktopXL: 1920, // Large desktop
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// ============================================
// MEDIA QUERY STRINGS
// ============================================

export const MEDIA_QUERIES = {
  // Mobile breakpoints
  mobileXS: `(max-width: ${BREAKPOINTS.mobileXS}px)`,
  mobileSM: `(max-width: ${BREAKPOINTS.mobileSM}px)`,
  mobileMD: `(max-width: ${BREAKPOINTS.mobileMD}px)`,
  mobileLG: `(max-width: ${BREAKPOINTS.mobileLG}px)`,
  mobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,

  // Tablet breakpoints
  tablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.tabletLG - 1}px)`,
  tabletUp: `(min-width: ${BREAKPOINTS.tablet}px)`,
  tabletDown: `(max-width: ${BREAKPOINTS.tabletLG - 1}px)`,

  // Desktop breakpoints
  desktop: `(min-width: ${BREAKPOINTS.tabletLG}px)`,
  desktopLG: `(min-width: ${BREAKPOINTS.desktop}px)`,
  desktopXL: `(min-width: ${BREAKPOINTS.desktopXL}px)`,

  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',

  // Special queries
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  highContrast: '(prefers-contrast: high)',
} as const;

// ============================================
// DEVICE TYPE DETECTION
// ============================================

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

/**
 * Get device type based on window width
 * Server-side safe (returns null if window is undefined)
 */
export const getDeviceType = (): DeviceType | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const width = window.innerWidth;

  if (width < BREAKPOINTS.tablet) {
    return DeviceType.MOBILE;
  } else if (width < BREAKPOINTS.tabletLG) {
    return DeviceType.TABLET;
  } else {
    return DeviceType.DESKTOP;
  }
};

/**
 * Check if device has touch capability
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Legacy IE support
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Check if device is in portrait orientation
 */
export const isPortrait = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerHeight > window.innerWidth;
};

/**
 * Check if device is in landscape orientation
 */
export const isLandscape = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth > window.innerHeight;
};

/**
 * Get device pixel ratio for retina displays
 */
export const getDevicePixelRatio = (): number => {
  if (typeof window === 'undefined') {
    return 1;
  }

  return window.devicePixelRatio || 1;
};

// ============================================
// REACT HOOKS
// ============================================

import { useState, useEffect } from 'react';

/**
 * Hook to detect media query match
 *
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if media query matches
 *
 * @example
 * const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
 * if (isMobile) {
 *   return <MobileView />;
 * }
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Update state if query match changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else {
      // @ts-ignore
      mediaQuery.addListener(handleChange);
      // @ts-ignore
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
};

/**
 * Hook to detect if device is mobile
 *
 * @returns boolean indicating if viewport is mobile size
 *
 * @example
 * const isMobile = useIsMobile();
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     {content}
 *   </div>
 * );
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery(MEDIA_QUERIES.mobile);
};

/**
 * Hook to detect if device is tablet
 *
 * @returns boolean indicating if viewport is tablet size
 */
export const useIsTablet = (): boolean => {
  return useMediaQuery(MEDIA_QUERIES.tablet);
};

/**
 * Hook to detect if device is desktop
 *
 * @returns boolean indicating if viewport is desktop size
 */
export const useIsDesktop = (): boolean => {
  return useMediaQuery(MEDIA_QUERIES.desktop);
};

/**
 * Hook to detect if device is tablet or larger
 * Useful for showing/hiding mobile-only features
 *
 * @returns boolean indicating if viewport is tablet or larger
 */
export const useIsTabletUp = (): boolean => {
  return useMediaQuery(MEDIA_QUERIES.tabletUp);
};

/**
 * Hook to get current device type
 *
 * @returns DeviceType enum value
 *
 * @example
 * const deviceType = useDeviceType();
 *
 * switch (deviceType) {
 *   case DeviceType.MOBILE:
 *     return <MobileNav />;
 *   case DeviceType.TABLET:
 *     return <TabletNav />;
 *   case DeviceType.DESKTOP:
 *     return <DesktopNav />;
 * }
 */
export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    const type = getDeviceType();
    return type || DeviceType.DESKTOP;
  });

  useEffect(() => {
    const handleResize = () => {
      const type = getDeviceType();
      if (type) {
        setDeviceType(type);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};

/**
 * Hook to detect if device has touch capability
 *
 * @returns boolean indicating if device supports touch
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState<boolean>(() => isTouchDevice());

  useEffect(() => {
    // Recheck on mount in case SSR/hydration mismatch
    setIsTouch(isTouchDevice());
  }, []);

  return isTouch;
};

/**
 * Hook to detect device orientation
 *
 * @returns 'portrait' | 'landscape'
 *
 * @example
 * const orientation = useOrientation();
 *
 * if (orientation === 'portrait') {
 *   return <PortraitLayout />;
 * }
 */
export const useOrientation = (): 'portrait' | 'landscape' => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    return isPortrait() ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(isPortrait() ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

/**
 * Hook to detect if user prefers reduced motion
 * Important for accessibility
 *
 * @returns boolean indicating if reduced motion is preferred
 */
export const usePrefersReducedMotion = (): boolean => {
  return useMediaQuery(MEDIA_QUERIES.reducedMotion);
};

/**
 * Hook to detect if user prefers dark mode
 *
 * @returns boolean indicating if dark mode is preferred
 */
export const usePrefersDarkMode = (): boolean => {
  return useMediaQuery(MEDIA_QUERIES.darkMode);
};

/**
 * Hook to get window dimensions
 * Useful for responsive calculations
 *
 * @returns { width: number; height: number }
 *
 * @example
 * const { width, height } = useWindowSize();
 * const cardWidth = width < 768 ? '100%' : '50%';
 */
export const useWindowSize = (): { width: number; height: number } => {
  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
};

// ============================================
// RESPONSIVE UTILITIES
// ============================================

/**
 * Get responsive value based on current breakpoint
 *
 * @param values - Object with breakpoint keys and values
 * @returns Value for current breakpoint
 *
 * @example
 * const columns = getResponsiveValue({
 *   mobile: 1,
 *   tablet: 2,
 *   desktop: 4,
 * });
 */
export const getResponsiveValue = <T>(
  values: Partial<Record<'mobile' | 'tablet' | 'desktop', T>>
): T | undefined => {
  const deviceType = getDeviceType();

  if (!deviceType) {
    return values.desktop || values.tablet || values.mobile;
  }

  switch (deviceType) {
    case DeviceType.MOBILE:
      return values.mobile || values.tablet || values.desktop;
    case DeviceType.TABLET:
      return values.tablet || values.mobile || values.desktop;
    case DeviceType.DESKTOP:
      return values.desktop || values.tablet || values.mobile;
    default:
      return values.desktop;
  }
};

/**
 * Calculate responsive font size
 * Uses fluid typography with clamp()
 *
 * @param minSize - Minimum font size (px)
 * @param maxSize - Maximum font size (px)
 * @param minWidth - Minimum viewport width (px, default: 320)
 * @param maxWidth - Maximum viewport width (px, default: 1440)
 * @returns CSS clamp() string
 *
 * @example
 * const fontSize = getFluidFontSize(16, 24);
 * // Returns: 'clamp(16px, 1.6vw + 10.88px, 24px)'
 */
export const getFluidFontSize = (
  minSize: number,
  maxSize: number,
  minWidth: number = BREAKPOINTS.mobileXS,
  maxWidth: number = BREAKPOINTS.desktop
): string => {
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  const yAxisIntersection = -minWidth * slope + minSize;

  return `clamp(${minSize}px, ${yAxisIntersection.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw, ${maxSize}px)`;
};

/**
 * Calculate responsive spacing
 *
 * @param mobileSpacing - Spacing on mobile (px)
 * @param desktopSpacing - Spacing on desktop (px)
 * @returns CSS calc() string
 */
export const getFluidSpacing = (mobileSpacing: number, desktopSpacing: number): string => {
  return getFluidFontSize(mobileSpacing, desktopSpacing);
};

// ============================================
// VIEWPORT UTILITIES
// ============================================

/**
 * Get viewport height accounting for mobile browser UI
 * Uses CSS custom property --vh for accurate mobile height
 */
export const setViewportHeight = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

/**
 * Initialize viewport height listener
 * Call this once in your app initialization
 */
export const initViewportHeight = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Set initial value
  setViewportHeight();

  // Update on resize
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', setViewportHeight);
    window.removeEventListener('orientationchange', setViewportHeight);
  };
};

// ============================================
// TOUCH UTILITIES
// ============================================

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  velocity: number;
}

/**
 * Detect swipe gesture
 * Returns null if no swipe detected, or SwipeEvent object
 */
export const detectSwipe = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startTime: number,
  endTime: number,
  threshold: number = 50
): SwipeEvent | null => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const duration = endTime - startTime;

  const distanceX = Math.abs(deltaX);
  const distanceY = Math.abs(deltaY);

  // Not enough distance for swipe
  if (distanceX < threshold && distanceY < threshold) {
    return null;
  }

  // Determine direction
  let direction: SwipeEvent['direction'];
  let distance: number;

  if (distanceX > distanceY) {
    // Horizontal swipe
    direction = deltaX > 0 ? 'right' : 'left';
    distance = distanceX;
  } else {
    // Vertical swipe
    direction = deltaY > 0 ? 'down' : 'up';
    distance = distanceY;
  }

  const velocity = distance / duration;

  return {
    direction,
    distance,
    duration,
    velocity,
  };
};

/**
 * Trigger haptic feedback (vibration)
 * Useful for touch interactions on mobile
 *
 * @param pattern - Vibration pattern (ms) or single duration
 *
 * @example
 * // Single vibration
 * triggerHapticFeedback(10);
 *
 * // Pattern: vibrate 50ms, pause 100ms, vibrate 50ms
 * triggerHapticFeedback([50, 100, 50]);
 */
export const triggerHapticFeedback = (pattern: number | number[] = 10): void => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.warn('Haptic feedback not supported:', error);
  }
};

// ============================================
// SCROLL UTILITIES
// ============================================

/**
 * Disable body scroll (useful for modals)
 */
export const disableBodyScroll = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
};

/**
 * Enable body scroll
 */
export const enableBodyScroll = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

/**
 * Scroll to element with smooth behavior
 * Works better on mobile than native scrollIntoView
 */
export const scrollToElement = (
  element: HTMLElement | null,
  offset: number = 0,
  behavior: ScrollBehavior = 'smooth'
): void => {
  if (!element || typeof window === 'undefined') {
    return;
  }

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });
};

// ============================================
// TYPE EXPORTS
// ============================================

export type MediaQueryKey = keyof typeof MEDIA_QUERIES;
export type Breakpoint = (typeof BREAKPOINTS)[BreakpointKey];
