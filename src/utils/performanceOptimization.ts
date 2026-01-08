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
//     const renderTime = Date.now() - lastRender.current;
 // Unused variable
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
export function measureRenderTime(_componentName: string) {
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

// ============================================================================
// REACT HOOKS FOR PERFORMANCE (Phase 1.3)
// ============================================================================

import { useState, useCallback, useMemo } from 'react';

/**
 * useDebounce - Debounced value hook
 * Delays updating the value until after wait milliseconds have elapsed
 * since the last time the value changed.
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // This effect only runs 300ms after the user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - Debounced callback hook
 * Returns a memoized callback that delays invoking func
 * until after wait milliseconds have elapsed since the last invocation.
 *
 * @example
 * const handleSearch = useDebouncedCallback((term: string) => {
 *   fetchResults(term);
 * }, 300);
 *
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * useThrottledCallback - Throttled callback hook
 * Returns a memoized callback that only invokes func at most once per limit ms.
 *
 * @example
 * const handleScroll = useThrottledCallback(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', handleScroll);
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= limit) {
        callback(...args);
        lastRan.current = now;
      } else {
        // Schedule trailing call
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, limit - (now - lastRan.current));
      }
    },
    [callback, limit]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * usePrevious - Returns the previous value of a variable
 * Useful for comparing current vs previous values in effects
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * // prevCount is the value of count from the previous render
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * useMemoizedCallback - Enhanced useCallback with deep comparison
 * Prevents callback recreation when dependencies are deeply equal
 *
 * @example
 * const handleSubmit = useMemoizedCallback((data) => {
 *   submitForm(data, config);
 * }, [config]); // Only recreates if config deeply changes
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: readonly unknown[]
): T {
  const callbackRef = useRef<T>(callback);
  const depsRef = useRef<readonly unknown[]>(deps);

  // Update callback ref if deps changed deeply
  const depsChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, i) => {
      const prev = depsRef.current[i];
      if (typeof dep === 'object' && typeof prev === 'object') {
        return JSON.stringify(dep) !== JSON.stringify(prev);
      }
      return dep !== prev;
    });
  }, [deps]);

  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}

/**
 * useDeepMemo - useMemo with deep comparison
 * Only recomputes when value deeply changes
 *
 * @example
 * const processedData = useDeepMemo(() => {
 *   return expensiveCalculation(data);
 * }, [data]); // Only recalculates if data deeply changes
 */
export function useDeepMemo<T>(factory: () => T, deps: readonly unknown[]): T {
  const depsRef = useRef<readonly unknown[]>(deps);
  const valueRef = useRef<T>();
  const isFirstRender = useRef(true);

  const depsChanged = useMemo(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return true;
    }
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, i) => {
      const prev = depsRef.current[i];
      if (typeof dep === 'object' && typeof prev === 'object') {
        return JSON.stringify(dep) !== JSON.stringify(prev);
      }
      return dep !== prev;
    });
  }, [deps]);

  if (depsChanged) {
    valueRef.current = factory();
    depsRef.current = deps;
  }

  return valueRef.current as T;
}

/**
 * useStableCallback - Returns a stable callback reference
 * The callback is always stable but always calls the latest function
 *
 * @example
 * const handleClick = useStableCallback(() => {
 *   // This function can reference latest state without causing re-renders
 *   doSomething(currentState);
 * });
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef<T>(callback);

  // Update ref synchronously
  callbackRef.current = callback;

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * useIntersectionObserver - Lazy loading hook
 * Returns whether an element is visible in viewport
 *
 * @example
 * const [ref, isVisible] = useIntersectionObserver({
 *   threshold: 0.1,
 *   rootMargin: '100px'
 * });
 *
 * return <div ref={ref}>{isVisible && <HeavyComponent />}</div>;
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(([entry]) => {
          setIsVisible(entry.isIntersecting);
        }, options);
        observerRef.current.observe(node);
      }
    },
    [options]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [ref, isVisible];
}
