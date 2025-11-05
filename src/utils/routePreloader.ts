/**
 * Route Preloading Utility
 * Preloads critical routes during idle time to improve perceived performance
 */

// Map of route paths to their dynamic imports
const ROUTE_IMPORTS = {
  '/dashboard': () => import('@/views/DashboardView'),
  '/analytics': () => import('@/views/IntegratedAnalyticsView'),
  '/rab': () => import('@/views/EnhancedRabAhspView'),
  '/schedule': () => import('@/views/GanttChartView'),
  '/tasks': () => import('@/views/TasksView'),
  '/finance': () => import('@/views/FinanceView'),
  '/reports': () => import('@/views/ReportView'),
  '/documents': () => import('@/views/DokumenView'),
} as const;

type RoutePath = keyof typeof ROUTE_IMPORTS;

/**
 * Preload cache to track loaded modules
 */
const preloadCache = new Map<string, Promise<any>>();

/**
 * Preload a specific route
 */
export const preloadRoute = (path: RoutePath): Promise<any> => {
  // Return cached promise if already loading/loaded
  if (preloadCache.has(path)) {
    return preloadCache.get(path)!;
  }

  // Start preloading
  const importFn = ROUTE_IMPORTS[path];
  if (!importFn) {
    console.warn(`No import function found for route: ${path}`);
    return Promise.resolve();
  }

  const promise = importFn()
    .then(module => {
      console.log(`✅ Preloaded route: ${path}`);
      return module;
    })
    .catch(error => {
      console.error(`❌ Failed to preload route: ${path}`, error);
      // Remove from cache so it can be retried
      preloadCache.delete(path);
      throw error;
    });

  preloadCache.set(path, promise);
  return promise;
};

/**
 * Preload multiple routes
 */
export const preloadRoutes = (paths: RoutePath[]): Promise<any[]> => {
  return Promise.all(paths.map(preloadRoute));
};

/**
 * Preload critical routes during idle time
 * Uses requestIdleCallback for better performance
 */
export const preloadCriticalRoutes = (): void => {
  const criticalRoutes: RoutePath[] = ['/dashboard', '/rab', '/tasks', '/finance'];

  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        preloadRoutes(criticalRoutes).catch(error => {
          console.error('Failed to preload critical routes:', error);
        });
      },
      { timeout: 2000 } // Fallback after 2s
    );
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadRoutes(criticalRoutes).catch(error => {
        console.error('Failed to preload critical routes:', error);
      });
    }, 1000);
  }
};

/**
 * Preload route on hover (predictive preloading)
 */
export const preloadOnHover = (path: RoutePath) => {
  return () => {
    preloadRoute(path).catch(() => {
      // Silently fail on hover preloading
    });
  };
};

/**
 * Hook for preloading on mount
 */
export const usePreloadRoute = (path: RoutePath): void => {
  if (typeof window !== 'undefined') {
    preloadRoute(path);
  }
};

/**
 * Get preload status
 */
export const isRoutePreloaded = (path: RoutePath): boolean => {
  return preloadCache.has(path);
};

/**
 * Clear preload cache (useful for development)
 */
export const clearPreloadCache = (): void => {
  preloadCache.clear();
  console.log('🗑️ Preload cache cleared');
};

/**
 * Get cache statistics
 */
export const getPreloadStats = () => {
  return {
    cachedRoutes: Array.from(preloadCache.keys()),
    cacheSize: preloadCache.size,
    totalRoutes: Object.keys(ROUTE_IMPORTS).length,
  };
};

/**
 * Preload based on user navigation patterns (ML-based prediction)
 */
interface NavigationPattern {
  from: string;
  to: string;
  count: number;
}

class NavigationPredictor {
  private patterns: Map<string, NavigationPattern[]> = new Map();

  recordNavigation(from: string, to: string): void {
    const patterns = this.patterns.get(from) || [];
    const existing = patterns.find(p => p.to === to);

    if (existing) {
      existing.count++;
    } else {
      patterns.push({ from, to, count: 1 });
    }

    this.patterns.set(from, patterns);

    // Save to localStorage
    this.savePatterns();
  }

  predictNext(currentPath: string): RoutePath[] {
    const patterns = this.patterns.get(currentPath) || [];
    
    // Sort by frequency and return top 3
    return patterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(p => p.to)
      .filter(path => path in ROUTE_IMPORTS) as RoutePath[];
  }

  preloadPredicted(currentPath: string): void {
    const predicted = this.predictNext(currentPath);
    if (predicted.length > 0) {
      console.log(`🔮 Predicting navigation from ${currentPath}, preloading:`, predicted);
      preloadRoutes(predicted).catch(() => {
        // Silently fail on prediction preloading
      });
    }
  }

  private savePatterns(): void {
    try {
      const data = Array.from(this.patterns.entries());
      localStorage.setItem('nav_patterns', JSON.stringify(data));
    } catch {
      // Ignore localStorage errors
    }
  }

  loadPatterns(): void {
    try {
      const data = localStorage.getItem('nav_patterns');
      if (data) {
        const parsed = JSON.parse(data);
        this.patterns = new Map(parsed);
        console.log('📊 Loaded navigation patterns:', this.patterns.size, 'routes');
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  clearPatterns(): void {
    this.patterns.clear();
    localStorage.removeItem('nav_patterns');
    console.log('🗑️ Navigation patterns cleared');
  }
}

export const navigationPredictor = new NavigationPredictor();

/**
 * Initialize predictive preloading
 */
export const initializePredictivePreloading = (): void => {
  navigationPredictor.loadPatterns();
  
  // Listen to route changes
  if (typeof window !== 'undefined') {
    let lastPath = window.location.pathname;
    
    setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        navigationPredictor.recordNavigation(lastPath, currentPath);
        navigationPredictor.preloadPredicted(currentPath);
        lastPath = currentPath;
      }
    }, 100);
  }
};
