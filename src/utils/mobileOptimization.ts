/**
 * Mobile Optimization Utilities
 * Provides hooks, utilities, and helpers for mobile-responsive design
 * 
 * Features:
 * - Responsive breakpoint detection
 * - Touch-friendly button sizing
 * - Mobile-first utilities
 * - Viewport detection
 * - Touch event handling
 * 
 * Created: November 2025
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// BREAKPOINTS (Following Tailwind CSS conventions)
// ============================================================================

export const BREAKPOINTS = {
  mobile: 320,
  mobileLarge: 425,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1440,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// ============================================================================
// TOUCH TARGET SIZES (WCAG 2.5.5 - Minimum 44x44px for touch targets)
// ============================================================================

export const TOUCH_TARGET = {
  minimum: 44, // WCAG minimum
  recommended: 48, // Better for accessibility
  comfortable: 56, // Most comfortable for average users
} as const;

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to detect if device is mobile
 * Updates on window resize
 */
export function useIsMobile(breakpoint: number = BREAKPOINTS.tablet): boolean {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint(): BreakpointKey {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>(() => {
    if (typeof window === 'undefined') return 'mobile';
    const width = window.innerWidth;
    if (width >= BREAKPOINTS.desktopLarge) return 'desktopLarge';
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    if (width >= BREAKPOINTS.mobileLarge) return 'mobileLarge';
    return 'mobile';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newBreakpoint: BreakpointKey = 'mobile';
      
      if (width >= BREAKPOINTS.desktopLarge) newBreakpoint = 'desktopLarge';
      else if (width >= BREAKPOINTS.desktop) newBreakpoint = 'desktop';
      else if (width >= BREAKPOINTS.tablet) newBreakpoint = 'tablet';
      else if (width >= BREAKPOINTS.mobileLarge) newBreakpoint = 'mobileLarge';
      
      setBreakpoint(newBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(() => 
    typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * Hook for viewport dimensions with debouncing
 */
export function useViewport(debounceMs: number = 150) {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [debounceMs]);

  return viewport;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get appropriate button size class for mobile
 */
export function getMobileButtonSize(isMobile: boolean, defaultSize: 'sm' | 'md' | 'lg' = 'md'): 'sm' | 'md' | 'lg' {
  if (!isMobile) return defaultSize;
  
  // Ensure minimum touch target on mobile
  if (defaultSize === 'sm') return 'md'; // Upgrade small to medium
  return defaultSize;
}

/**
 * Get mobile-friendly spacing classes
 */
export function getMobileSpacing(isMobile: boolean): {
  padding: string;
  margin: string;
  gap: string;
} {
  if (isMobile) {
    return {
      padding: 'p-3', // Reduced padding on mobile
      margin: 'm-2',
      gap: 'gap-2',
    };
  }
  
  return {
    padding: 'p-6',
    margin: 'm-4',
    gap: 'gap-4',
  };
}

/**
 * Get responsive grid columns
 */
export function getResponsiveColumns(breakpoint: BreakpointKey): number {
  switch (breakpoint) {
    case 'mobile':
      return 1;
    case 'mobileLarge':
      return 1;
    case 'tablet':
      return 2;
    case 'desktop':
      return 3;
    case 'desktopLarge':
      return 4;
    default:
      return 1;
  }
}

/**
 * Check if touch target meets WCAG standards
 */
export function isTouchTargetAccessible(size: number): boolean {
  return size >= TOUCH_TARGET.minimum;
}

/**
 * Get responsive font size classes
 */
export function getResponsiveFontSize(isMobile: boolean, element: 'title' | 'heading' | 'body' | 'caption'): string {
  const sizes = {
    title: isMobile ? 'text-xl' : 'text-3xl',
    heading: isMobile ? 'text-lg' : 'text-2xl',
    body: isMobile ? 'text-sm' : 'text-base',
    caption: isMobile ? 'text-xs' : 'text-sm',
  };
  
  return sizes[element];
}

/**
 * Detect if content should scroll horizontally or stack vertically
 */
export function shouldStackVertically(containerWidth: number, itemCount: number, minItemWidth: number): boolean {
  const totalMinWidth = itemCount * minItemWidth;
  return containerWidth < totalMinWidth;
}

/**
 * Get mobile-optimized table configuration
 */
export function getMobileTableConfig(isMobile: boolean) {
  return {
    pageSize: isMobile ? 10 : 20, // Fewer items on mobile
    showPagination: true,
    cardView: isMobile, // Use card view on mobile
    enableHorizontalScroll: !isMobile,
  };
}

/**
 * Convert px to rem (base 16px)
 */
export function pxToRem(px: number): string {
  return `${px / 16}rem`;
}

/**
 * Get safe area insets for notched devices (iOS)
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
  };
}

/**
 * Handle touch events with gesture detection
 */
export function useTouchGesture(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50; // Minimum distance for swipe

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

/**
 * Optimize images for mobile
 */
export function getResponsiveImageSrc(
  baseSrc: string,
  isMobile: boolean,
  options?: {
    mobileWidth?: number;
    desktopWidth?: number;
  }
): string {
  const { mobileWidth = 640, desktopWidth = 1200 } = options || {};
  
  // If using a service like Cloudinary, ImageKit, or similar
  // Modify URL to request appropriate size
  const targetWidth = isMobile ? mobileWidth : desktopWidth;
  
  // Example for query parameter approach
  if (baseSrc.includes('?')) {
    return `${baseSrc}&w=${targetWidth}`;
  }
  
  return `${baseSrc}?w=${targetWidth}`;
}

/**
 * Debounce resize events
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement>,
  callback: (entry: ResizeObserverEntry) => void,
  debounceMs: number = 150
) {
  useEffect(() => {
    if (!ref.current) return;

    let timeoutId: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(entries[0]);
      }, debounceMs);
    });

    resizeObserver.observe(ref.current);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [ref, callback, debounceMs]);
}

/**
 * Mobile-optimized modal positioning
 */
export function getMobileModalStyles(isMobile: boolean) {
  if (isMobile) {
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      maxWidth: '100%',
      maxHeight: '100vh',
      borderRadius: 0,
      margin: 0,
    };
  }
  
  return {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    borderRadius: '12px',
    margin: 'auto',
  };
}

/**
 * Get mobile-friendly action button layout
 */
export function getMobileActionLayout(isMobile: boolean): 'horizontal' | 'vertical' {
  return isMobile ? 'vertical' : 'horizontal';
}

/**
 * Check if device prefers reduced motion (accessibility)
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
