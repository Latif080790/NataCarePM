/**
 * Performance Optimization Utilities
 *
 * Utilities for performance monitoring and optimization helpers
 */

import { useEffect, useRef } from 'react';

/**
 * Custom comparison function for React.memo
 * Deep comparison for complex props
 */
export function deepCompareProps<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keysToCompare?: (keyof T)[]
): boolean {
  const keys = keysToCompare || (Object.keys(prevProps) as (keyof T)[]);

  for (const key of keys) {
    if (prevProps[key] !== nextProps[key]) {
      // For arrays and objects, do shallow comparison
      if (Array.isArray(prevProps[key]) && Array.isArray(nextProps[key])) {
        if (prevProps[key].length !== nextProps[key].length) return false;
        if (JSON.stringify(prevProps[key]) !== JSON.stringify(nextProps[key])) return false;
      } else if (typeof prevProps[key] === 'object' && typeof nextProps[key] === 'object') {
        if (JSON.stringify(prevProps[key]) !== JSON.stringify(nextProps[key])) return false;
      } else {
        return false;
      }
    }
  }

  return true;
}

/**
 * Performance monitoring hook
 * Logs render count and render time in development
 */
export function useRenderMonitor(
  componentName: string,
  enabled = process.env.NODE_ENV === 'development'
) {
  const renderCount = useRef(0);
  const lastRender = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const renderTime = Date.now() - lastRender.current;
    lastRender.current = Date.now();

    // Performance monitoring in development
    // Log render count and render time
  });
}

/**
 * Debounce function for expensive operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for high-frequency events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure component render performance
 */
export function measureRenderTime(componentName: string) {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16) {
      // > 16ms = may cause frame drop
      // Log performance warning
    }
  };
}
