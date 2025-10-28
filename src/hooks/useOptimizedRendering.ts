/**
 * Optimized Rendering Hook
 * 
 * Provides performance optimizations for React components
 */

import { useMemo, useCallback, useRef } from 'react';
import { CacheOptimizer } from '@/utils/performance/cacheOptimizer';

// Create a cache for expensive computations
const computationCache = new CacheOptimizer<any>({ 
  maxSize: 50, 
  defaultTTL: 10 * 60 * 1000 // 10 minutes
});

interface UseOptimizedRenderingOptions {
  enableMemoization?: boolean;
  enableCache?: boolean;
  cacheKey?: string;
}

export const useOptimizedRendering = <T,>(
  factory: () => T,
  deps: React.DependencyList,
  options: UseOptimizedRenderingOptions = {}
): T => {
  const {
    enableMemoization = true,
    enableCache = false,
    cacheKey,
  } = options;
  
  const lastResult = useRef<T | null>(null);
  const lastDeps = useRef<React.DependencyList | null>(null);
  
  // Simple dependency comparison
  const depsChanged = useMemo(() => {
    if (!lastDeps.current) return true;
    if (lastDeps.current.length !== deps.length) return true;
    
    return deps.some((dep, index) => dep !== lastDeps.current![index]);
  }, [deps]);
  
  // Memoized computation
  const memoizedResult = useMemo(() => {
    if (enableMemoization && !depsChanged) {
      return lastResult.current;
    }
    
    const result = factory();
    lastResult.current = result;
    lastDeps.current = deps;
    
    return result;
  }, [depsChanged, ...deps]);
  
  // Cached computation
  const cachedResult = useMemo(() => {
    if (!enableCache || !cacheKey) {
      return memoizedResult;
    }
    
    // Check cache first
    const cached = computationCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Compute and cache result
    const result = memoizedResult;
    computationCache.set(cacheKey, result);
    
    return result;
  }, [memoizedResult, enableCache, cacheKey]);
  
  return cachedResult;
};

// Hook for preventing unnecessary re-renders
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = useRef<T>(callback);
  
  // Update ref when callback changes
  callbackRef.current = callback;
  
  // Return stable function
  return useCallback(((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T, []);
};

// Hook for stable object references
export const useStableObject = <T extends object>(obj: T): T => {
  const ref = useRef<T>(obj);
  
  // Only update if object actually changed
  if (JSON.stringify(ref.current) !== JSON.stringify(obj)) {
    ref.current = obj;
  }
  
  return ref.current;
};

// Hook for virtualized lists
export const useVirtualization = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Add buffer
  const endIndex = Math.min(startIndex + visibleCount, items.length);
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);
  
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight,
  };
};

export default {
  useOptimizedRendering,
  useStableCallback,
  useStableObject,
  useVirtualization,
};