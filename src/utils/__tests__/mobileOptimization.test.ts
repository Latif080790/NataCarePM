/**
 * Mobile Optimization Utilities - Unit Tests
 * Comprehensive testing for mobile-responsive hooks and utilities
 * 
 * Coverage:
 * - Breakpoint detection
 * - Touch device detection
 * - Viewport management
 * - Responsive utilities
 * - Touch gestures
 * 
 * Created: November 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useIsMobile,
  useBreakpoint,
  useIsTouchDevice,
  useViewport,
  useTouchGesture,
  usePrefersReducedMotion,
  BREAKPOINTS,
  TOUCH_TARGET,
  getMobileButtonSize,
  getMobileSpacing,
  getResponsiveColumns,
  isTouchTargetAccessible,
  getResponsiveFontSize,
  getMobileTableConfig,
  getMobileModalStyles,
  getMobileActionLayout,
} from '../mobileOptimization';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

describe('Mobile Optimization Utilities', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalMatchMedia = window.matchMedia;

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  // ============================================================================
  // BREAKPOINT DETECTION
  // ============================================================================

  describe('useIsMobile', () => {
    it('should return true when width is below tablet breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false when width is above tablet breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should update when window resizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: 500,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toBe(true);
    });

    it('should support custom breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 600,
      });

      const { result } = renderHook(() => useIsMobile(650));
      expect(result.current).toBe(true);
    });
  });

  describe('useBreakpoint', () => {
    it('should return mobile for small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 400, // 400px is between 320-425, so 'mobile'
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('mobile'); // Fixed: 400px < 425 = mobile
    });

    it('should return tablet for medium screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 800,
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('tablet');
    });

    it('should return desktop for large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1200,
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('desktop');
    });

    it('should return desktopLarge for extra large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1600,
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('desktopLarge');
    });
  });

  // ============================================================================
  // TOUCH DEVICE DETECTION
  // ============================================================================

  describe('useIsTouchDevice', () => {
    it('should detect touch support', () => {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: {},
      });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);
    });

    it('should detect maxTouchPoints', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 2,
      });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);
    });
  });

  // ============================================================================
  // VIEWPORT MANAGEMENT
  // ============================================================================

  describe('useViewport', () => {
    it('should return current viewport dimensions', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 768,
      });

      const { result } = renderHook(() => useViewport(0));
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
      });
    });

    it('should debounce resize events', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useViewport(150));

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          value: 500,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Should not update immediately
      expect(result.current.width).not.toBe(500);

      // Fast forward timers
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Should update after debounce
      expect(result.current.width).toBe(500);

      vi.useRealTimers();
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('getMobileButtonSize', () => {
    it('should upgrade sm to md on mobile for touch targets', () => {
      expect(getMobileButtonSize(true, 'sm')).toBe('md');
    });

    it('should keep md size on mobile', () => {
      expect(getMobileButtonSize(true, 'md')).toBe('md');
    });

    it('should keep lg size on mobile', () => {
      expect(getMobileButtonSize(true, 'lg')).toBe('lg');
    });

    it('should return default size on desktop', () => {
      expect(getMobileButtonSize(false, 'sm')).toBe('sm');
      expect(getMobileButtonSize(false, 'md')).toBe('md');
      expect(getMobileButtonSize(false, 'lg')).toBe('lg');
    });
  });

  describe('getMobileSpacing', () => {
    it('should return reduced spacing for mobile', () => {
      const spacing = getMobileSpacing(true);
      expect(spacing.padding).toBe('p-3');
      expect(spacing.margin).toBe('m-2');
      expect(spacing.gap).toBe('gap-2');
    });

    it('should return normal spacing for desktop', () => {
      const spacing = getMobileSpacing(false);
      expect(spacing.padding).toBe('p-6');
      expect(spacing.margin).toBe('m-4');
      expect(spacing.gap).toBe('gap-4');
    });
  });

  describe('getResponsiveColumns', () => {
    it('should return 1 column for mobile', () => {
      expect(getResponsiveColumns('mobile')).toBe(1);
      expect(getResponsiveColumns('mobileLarge')).toBe(1);
    });

    it('should return 2 columns for tablet', () => {
      expect(getResponsiveColumns('tablet')).toBe(2);
    });

    it('should return 3 columns for desktop', () => {
      expect(getResponsiveColumns('desktop')).toBe(3);
    });

    it('should return 4 columns for large desktop', () => {
      expect(getResponsiveColumns('desktopLarge')).toBe(4);
    });
  });

  describe('isTouchTargetAccessible', () => {
    it('should return true for minimum WCAG size', () => {
      expect(isTouchTargetAccessible(TOUCH_TARGET.minimum)).toBe(true);
    });

    it('should return false for sizes below minimum', () => {
      expect(isTouchTargetAccessible(40)).toBe(false);
      expect(isTouchTargetAccessible(30)).toBe(false);
    });

    it('should return true for sizes above minimum', () => {
      expect(isTouchTargetAccessible(48)).toBe(true);
      expect(isTouchTargetAccessible(56)).toBe(true);
    });
  });

  describe('getResponsiveFontSize', () => {
    it('should return mobile-optimized font sizes', () => {
      expect(getResponsiveFontSize(true, 'title')).toBe('text-xl');
      expect(getResponsiveFontSize(true, 'heading')).toBe('text-lg');
      expect(getResponsiveFontSize(true, 'body')).toBe('text-sm');
      expect(getResponsiveFontSize(true, 'caption')).toBe('text-xs');
    });

    it('should return desktop font sizes', () => {
      expect(getResponsiveFontSize(false, 'title')).toBe('text-3xl');
      expect(getResponsiveFontSize(false, 'heading')).toBe('text-2xl');
      expect(getResponsiveFontSize(false, 'body')).toBe('text-base');
      expect(getResponsiveFontSize(false, 'caption')).toBe('text-sm');
    });
  });

  describe('getMobileTableConfig', () => {
    it('should return mobile-optimized table config', () => {
      const config = getMobileTableConfig(true);
      expect(config.pageSize).toBe(10);
      expect(config.cardView).toBe(true);
      expect(config.enableHorizontalScroll).toBe(false);
    });

    it('should return desktop table config', () => {
      const config = getMobileTableConfig(false);
      expect(config.pageSize).toBe(20);
      expect(config.cardView).toBe(false);
      expect(config.enableHorizontalScroll).toBe(true);
    });
  });

  describe('getMobileModalStyles', () => {
    it('should return fullscreen styles for mobile', () => {
      const styles = getMobileModalStyles(true);
      expect(styles.position).toBe('fixed');
      expect(styles.top).toBe(0);
      expect(styles.left).toBe(0);
      expect(styles.maxWidth).toBe('100%');
      expect(styles.borderRadius).toBe(0);
    });

    it('should return centered styles for desktop', () => {
      const styles = getMobileModalStyles(false);
      expect(styles.position).toBe('fixed');
      expect(styles.top).toBe('50%');
      expect(styles.left).toBe('50%');
      expect(styles.transform).toBe('translate(-50%, -50%)');
      expect(styles.borderRadius).toBe('12px');
    });
  });

  describe('getMobileActionLayout', () => {
    it('should return vertical layout for mobile', () => {
      expect(getMobileActionLayout(true)).toBe('vertical');
    });

    it('should return horizontal layout for desktop', () => {
      expect(getMobileActionLayout(false)).toBe('horizontal');
    });
  });

  // ============================================================================
  // TOUCH GESTURES
  // ============================================================================

  describe('useTouchGesture', () => {
    it('should detect left swipe', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const { result } = renderHook(() => useTouchGesture(onSwipeLeft, onSwipeRight));

      // Simulate touch start
      act(() => {
        result.current.onTouchStart({
          targetTouches: [{ clientX: 200 }],
        } as any);
      });

      // Simulate touch move
      act(() => {
        result.current.onTouchMove({
          targetTouches: [{ clientX: 100 }],
        } as any);
      });

      // Simulate touch end
      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeLeft).toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });

    it('should detect right swipe', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const { result } = renderHook(() => useTouchGesture(onSwipeLeft, onSwipeRight));

      // Simulate touch start
      act(() => {
        result.current.onTouchStart({
          targetTouches: [{ clientX: 100 }],
        } as any);
      });

      // Simulate touch move
      act(() => {
        result.current.onTouchMove({
          targetTouches: [{ clientX: 200 }],
        } as any);
      });

      // Simulate touch end
      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeRight).toHaveBeenCalled();
      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should not trigger callbacks for small movements', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();

      const { result } = renderHook(() => useTouchGesture(onSwipeLeft, onSwipeRight));

      act(() => {
        result.current.onTouchStart({
          targetTouches: [{ clientX: 150 }],
        } as any);
      });

      act(() => {
        result.current.onTouchMove({
          targetTouches: [{ clientX: 140 }],
        } as any);
      });

      act(() => {
        result.current.onTouchEnd();
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('usePrefersReducedMotion', () => {
    it('should detect reduced motion preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(true);
    });

    it('should return false when no reduced motion preference', () => {
      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);
    });
  });

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  describe('BREAKPOINTS', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.mobile).toBe(320);
      expect(BREAKPOINTS.mobileLarge).toBe(425);
      expect(BREAKPOINTS.tablet).toBe(768);
      expect(BREAKPOINTS.desktop).toBe(1024);
      expect(BREAKPOINTS.desktopLarge).toBe(1440);
    });
  });

  describe('TOUCH_TARGET', () => {
    it('should have correct touch target values', () => {
      expect(TOUCH_TARGET.minimum).toBe(44);
      expect(TOUCH_TARGET.recommended).toBe(48);
      expect(TOUCH_TARGET.comfortable).toBe(56);
    });

    it('should meet WCAG 2.5.5 standards', () => {
      expect(TOUCH_TARGET.minimum).toBeGreaterThanOrEqual(44);
    });
  });
});
