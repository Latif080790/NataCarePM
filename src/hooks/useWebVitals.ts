/**
 * Additional Performance Monitoring Hooks
 * Web Vitals and Route tracking
 */

import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';

/**
 * Hook to track route/page load time
 */
export const usePageLoadTime = (routeName: string) => {
  const startTime = useRef(Date.now());

  useEffect(() => {
    const loadTime = Date.now() - startTime.current;
    performanceMonitor.trackRouteLoad(routeName, loadTime);
    performanceMonitor.mark(`${routeName}-loaded`);
  }, [routeName]);
};

/**
 * Hook to track API call performance
 */
export const useAPIPerformance = () => {
  const trackAPICall = useCallback((endpoint: string, startTime: number) => {
    const duration = Date.now() - startTime;
    performanceMonitor.trackAPICall(endpoint, duration);
    return duration;
  }, []);

  return { trackAPICall };
};

/**
 * Hook to get current performance metrics
 */
export const usePerformanceMetrics = () => {
  const getMetrics = useCallback(() => {
    return performanceMonitor.getMetrics();
  }, []);

  const getReport = useCallback(() => {
    return performanceMonitor.getReport();
  }, []);

  return { getMetrics, getReport };
};

/**
 * Hook to track user interactions
 */
export const useInteractionTracking = (interactionName: string) => {
  const trackInteraction = useCallback(() => {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      if (duration > 100) { // Log interactions slower than 100ms
        console.warn(`⚠️ [Performance] Slow interaction "${interactionName}": ${duration}ms`);
      }
    };
  }, [interactionName]);

  return { trackInteraction };
};
