/**
 * useRoutePreload Hook
 * Handles intelligent component preloading based on route patterns
 */

import { useEffect, useRef } from 'react';
import { RoutePreloader } from '@/utils/componentPreloader';
import { routePreloadConfig, criticalComponents, getComponentsForRole } from '../config/routePreload';

export function useRoutePreload(currentRoute: string, userRole?: string) {
  const preloaderRef = useRef<RoutePreloader | null>(null);
  const hasPreloadedCritical = useRef(false);

  // Initialize preloader
  useEffect(() => {
    if (!preloaderRef.current) {
      preloaderRef.current = new RoutePreloader(routePreloadConfig);
    }
  }, []);

  // Preload critical components once
  useEffect(() => {
    if (!hasPreloadedCritical.current) {
      hasPreloadedCritical.current = true;
      
      // Preload critical components immediately
      import('../utils/componentPreloader').then(({ preloadComponents }) => {
        preloadComponents(criticalComponents);
      });

      // Preload role-specific components on idle
      if (userRole) {
        const roleComponents = getComponentsForRole(userRole);
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            import('../utils/componentPreloader').then(({ preloadComponents }) => {
              preloadComponents(roleComponents);
            });
          });
        }
      }
    }
  }, [userRole]);

  // Preload components for current route
  useEffect(() => {
    if (preloaderRef.current && currentRoute) {
      preloaderRef.current.preloadRoute(currentRoute);
    }
  }, [currentRoute]);

  return {
    preloader: preloaderRef.current,
  };
}

/**
 * usePreloadOnHover Hook
 * Preloads a component when user hovers over navigation item
 */
export function usePreloadOnHover(componentLoader: () => Promise<any>) {
  const hasPreloaded = useRef(false);

  const handlePreload = () => {
    if (!hasPreloaded.current) {
      hasPreloaded.current = true;
      componentLoader().catch(error => {
        console.error('Preload failed:', error);
        hasPreloaded.current = false; // Allow retry
      });
    }
  };

  return {
    onMouseEnter: handlePreload,
    onFocus: handlePreload,
  };
}
