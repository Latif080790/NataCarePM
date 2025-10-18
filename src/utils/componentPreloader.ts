/**
 * Component Preloader Utility
 * Preloads critical components for faster navigation
 */

import { ComponentType } from 'react';

type LazyComponent = () => Promise<{ default: ComponentType<any> }>;

/**
 * Preload a lazy component
 */
export function preloadComponent(lazyComponent: LazyComponent): Promise<void> {
  return lazyComponent()
    .then(() => {
      console.log('Component preloaded successfully');
    })
    .catch((error) => {
      console.error('Failed to preload component:', error);
    });
}

/**
 * Preload multiple components
 */
export function preloadComponents(lazyComponents: LazyComponent[]): Promise<void[]> {
  return Promise.all(lazyComponents.map(preloadComponent));
}

/**
 * Preload components on idle
 */
export function preloadOnIdle(lazyComponents: LazyComponent[]): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponents(lazyComponents);
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      preloadComponents(lazyComponents);
    }, 1000);
  }
}

/**
 * Preload components on hover
 */
export function createPreloadOnHover(lazyComponent: LazyComponent) {
  return {
    onMouseEnter: () => preloadComponent(lazyComponent),
    onFocus: () => preloadComponent(lazyComponent),
  };
}

/**
 * Preload based on route patterns
 */
export interface RoutePreloadConfig {
  route: string;
  components: LazyComponent[];
  preloadOn?: 'idle' | 'hover' | 'immediate';
}

export class RoutePreloader {
  private preloadedRoutes = new Set<string>();
  private config: RoutePreloadConfig[];

  constructor(config: RoutePreloadConfig[]) {
    this.config = config;
  }

  /**
   * Preload components for a specific route
   */
  preloadRoute(route: string): void {
    if (this.preloadedRoutes.has(route)) {
      return; // Already preloaded
    }

    const routeConfig = this.config.find(c => c.route === route);
    if (!routeConfig) {
      return;
    }

    this.preloadedRoutes.add(route);
    
    switch (routeConfig.preloadOn) {
      case 'immediate':
        preloadComponents(routeConfig.components);
        break;
      case 'idle':
        preloadOnIdle(routeConfig.components);
        break;
      case 'hover':
        // Will be triggered by user interaction
        break;
      default:
        preloadOnIdle(routeConfig.components);
    }
  }

  /**
   * Preload all routes marked as immediate
   */
  preloadImmediate(): void {
    this.config
      .filter(c => c.preloadOn === 'immediate')
      .forEach(c => this.preloadRoute(c.route));
  }

  /**
   * Preload all routes on idle
   */
  preloadAll(): void {
    preloadOnIdle(
      this.config.flatMap(c => c.components)
    );
  }
}

/**
 * Cache status for lazy components
 */
export function isComponentCached(lazyComponent: LazyComponent): boolean {
  try {
    // Check if the component module is already loaded
    const module = lazyComponent as any;
    return module._result !== undefined;
  } catch {
    return false;
  }
}
