/**
 * Performance Monitoring Utility
 * 
 * Provides comprehensive performance monitoring capabilities including:
 * - Component render timing
 * - API call performance tracking
 * - Memory usage monitoring
 * - Bundle size analysis integration
 */

import { logger } from '@/utils/logger.enhanced';

export interface PerformanceMetrics {
  componentName?: string;
  renderTime?: number;
  apiCallTime?: number;
  memoryUsage?: number;
  bundleSize?: number;
  timestamp: number;
  userAgent: string;
}

export interface PerformanceReport {
  avgRenderTime: number;
  avgApiCallTime: number;
  totalMetrics: number;
  slowestComponent?: string;
  fastestComponent?: string;
  memoryUsageTrend: 'increasing' | 'decreasing' | 'stable';
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializePerformanceObserver();
  }

  /**
   * Initialize Performance Observer for detailed web vitals
   */
  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              logger.debug('Performance measurement', {
                name: entry.name,
                duration: entry.duration,
              });
            }
          }
        });
        
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        logger.warn('Performance Observer initialization failed', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Start timing a component render or operation
   */
  startTiming(name: string): string {
    const markName = `${name}_start_${Date.now()}`;
    if (typeof performance !== 'undefined') {
      performance.mark(markName);
    }
    return markName;
  }

  /**
   * End timing and record metrics
   */
  endTiming(startMark: string, componentName?: string): void {
    if (typeof performance === 'undefined') return;
    
    const endMark = startMark.replace('_start_', '_end_');
    performance.mark(endMark);
    
    try {
      performance.measure(componentName || startMark, startMark, endMark);
      
      const measure = performance.getEntriesByName(componentName || startMark).pop();
      if (measure) {
        this.recordMetric({
          componentName,
          renderTime: measure.duration,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        });
      }
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(componentName || startMark);
    } catch (error) {
      logger.warn('Performance timing measurement failed', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Record performance metrics
   */
  recordMetric(metric: Partial<PerformanceMetrics>): void {
    const fullMetric: PerformanceMetrics = {
      ...metric,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
    
    this.metrics.push(fullMetric);
    logger.debug('Performance metric recorded', fullMetric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Record API call performance
   */
  recordApiCall(url: string, duration: number, status: number): void {
    this.recordMetric({
      componentName: `API_${url}`,
      apiCallTime: duration,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });
    
    // Log slow API calls
    if (duration > 1000) {
      logger.warn('Slow API call detected', { url, duration, status });
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        avgRenderTime: 0,
        avgApiCallTime: 0,
        totalMetrics: 0,
        memoryUsageTrend: 'stable',
      };
    }
    
    const renderTimes = this.metrics
      .filter(m => m.renderTime !== undefined)
      .map(m => m.renderTime!);
    
    const apiCallTimes = this.metrics
      .filter(m => m.apiCallTime !== undefined)
      .map(m => m.apiCallTime!);
    
    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0;
    
    const avgApiCallTime = apiCallTimes.length > 0 
      ? apiCallTimes.reduce((sum, time) => sum + time, 0) / apiCallTimes.length 
      : 0;
    
    // Simple memory trend analysis (in a real implementation, we'd use memory API)
    const memoryUsageTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    return {
      avgRenderTime,
      avgApiCallTime,
      totalMetrics: this.metrics.length,
      memoryUsageTrend,
    };
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(limit: number = 5): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.renderTime !== undefined)
      .sort((a, b) => (b.renderTime || 0) - (a.renderTime || 0))
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    logger.debug('Performance metrics cleared');
  }

  /**
   * Get current memory usage (if available)
   */
  getMemoryUsage(): { used: number; total: number } | null {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore - performance.memory is non-standard
      const memory: any = performance.memory;
      if (memory) {
        return {
          used: memory.usedJSHeapSize,
          total: memory.jsHeapSizeLimit,
        };
      }
    }
    return null;
  }

  /**
   * Destroy performance monitor
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy();
  });
}

export default PerformanceMonitor;