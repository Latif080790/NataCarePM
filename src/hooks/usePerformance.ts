/**
 * Performance Hook
 * 
 * Provides React hook for performance monitoring in components
 */

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/utils/performance/performanceMonitor';

export interface UsePerformanceOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackMount?: boolean;
  trackUnmount?: boolean;
}

export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    componentName = 'UnknownComponent',
    trackRenders = true,
    trackMount = true,
    trackUnmount = false,
  } = options;
  
  const renderCount = useRef(0);
  const mountTimeRef = useRef<string | null>(null);

  // Track component mount
  useEffect(() => {
    if (trackMount) {
      mountTimeRef.current = performanceMonitor.startTiming(`${componentName}_mount`);
      
      // Record mount as a metric
      performanceMonitor.recordMetric({
        componentName: `${componentName}_mount`,
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    }

    // Cleanup on unmount
    return () => {
      if (trackUnmount && mountTimeRef.current) {
        performanceMonitor.endTiming(mountTimeRef.current, `${componentName}_unmount`);
      }
      
      // Log render count on unmount
      if (renderCount.current > 0) {
        performanceMonitor.recordMetric({
          componentName: `${componentName}_total_renders`,
          renderTime: renderCount.current,
          timestamp: Date.now(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        });
      }
    };
  }, []);

  // Track component renders
  useEffect(() => {
    if (trackRenders && renderCount.current > 0) {
      const renderTime = performanceMonitor.startTiming(`${componentName}_render_${renderCount.current}`);
      
      // End timing in a microtask to capture the full render
      Promise.resolve().then(() => {
        performanceMonitor.endTiming(renderTime, `${componentName}_render`);
      });
    }
    
    renderCount.current += 1;
  });

  // Manual timing functions
  const startTiming = (name: string) => {
    return performanceMonitor.startTiming(`${componentName}_${name}`);
  };

  const endTiming = (mark: string, name?: string) => {
    performanceMonitor.endTiming(mark, name ? `${componentName}_${name}` : undefined);
  };

  return {
    startTiming,
    endTiming,
    renderCount: renderCount.current,
  };
};

export default usePerformance;