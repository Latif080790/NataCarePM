/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals and custom performance metrics
 */

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

// Performance metrics storage
interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  FCP: number | null; // First Contentful Paint
  TTFB: number | null; // Time to First Byte
  INP: number | null; // Interaction to Next Paint
  
  // Custom metrics
  routeLoadTime: Record<string, number[]>;
  apiResponseTime: Record<string, number[]>;
  errorCount: number;
  sessionStart: number;
  pageViews: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private reportEndpoint: string | null = null;
  private reportInterval: number = 30000; // 30 seconds
  private intervalId: number | null = null;

  constructor() {
    this.metrics = {
      LCP: null,
      FID: null,
      CLS: null,
      FCP: null,
      TTFB: null,
      INP: null,
      routeLoadTime: {},
      apiResponseTime: {},
      errorCount: 0,
      sessionStart: Date.now(),
      pageViews: 0
    };

    this.initWebVitals();
    this.initNavigationTracking();
    this.initErrorTracking();
  }

  /**
   * Initialize Core Web Vitals tracking
   */
  private initWebVitals(): void {
    // Track Largest Contentful Paint
    onLCP((metric: Metric) => {
      this.metrics.LCP = metric.value;
      this.logMetric('LCP', metric.value, this.getRating(metric.value, 2500, 4000));
    });

    // Track First Input Delay
    onFID((metric: Metric) => {
      this.metrics.FID = metric.value;
      this.logMetric('FID', metric.value, this.getRating(metric.value, 100, 300));
    });

    // Track Cumulative Layout Shift
    onCLS((metric: Metric) => {
      this.metrics.CLS = metric.value;
      this.logMetric('CLS', metric.value, this.getRating(metric.value, 0.1, 0.25));
    });

    // Track First Contentful Paint
    onFCP((metric: Metric) => {
      this.metrics.FCP = metric.value;
      this.logMetric('FCP', metric.value, this.getRating(metric.value, 1800, 3000));
    });

    // Track Time to First Byte
    onTTFB((metric: Metric) => {
      this.metrics.TTFB = metric.value;
      this.logMetric('TTFB', metric.value, this.getRating(metric.value, 800, 1800));
    });

    // Track Interaction to Next Paint
    onINP((metric: Metric) => {
      this.metrics.INP = metric.value;
      this.logMetric('INP', metric.value, this.getRating(metric.value, 200, 500));
    });
  }

  /**
   * Get rating for a metric value
   */
  private getRating(value: number, good: number, poor: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Log metric to console and potentially to backend
   */
  private logMetric(name: string, value: number, rating: string): void {
    const formattedValue = name === 'CLS' ? value.toFixed(3) : Math.round(value);
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
    
    console.log(`${emoji} [Performance] ${name}: ${formattedValue}${name === 'CLS' ? '' : 'ms'} (${rating})`);

    // Send to backend if configured
    if (this.reportEndpoint) {
      this.sendMetric({ name, value, rating, timestamp: Date.now() });
    }
  }

  /**
   * Initialize navigation/route tracking
   */
  private initNavigationTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.metrics.pageViews++;
      }
    });

    // Track initial page load
    if (document.readyState === 'complete') {
      this.trackPageLoad();
    } else {
      window.addEventListener('load', () => this.trackPageLoad());
    }
  }

  /**
   * Track page load performance
   */
  private trackPageLoad(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      if (pageLoadTime > 0) {
        console.log(`📄 [Performance] Page Load Time: ${pageLoadTime}ms`);
        this.trackRouteLoad(window.location.pathname, pageLoadTime);
      }
    }
  }

  /**
   * Initialize error tracking
   */
  private initErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.metrics.errorCount++;
      console.error('❌ [Performance] Error detected:', event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errorCount++;
      console.error('❌ [Performance] Unhandled rejection:', event.reason);
    });
  }

  /**
   * Track route navigation time
   */
  public trackRouteLoad(route: string, loadTime: number): void {
    if (!this.metrics.routeLoadTime[route]) {
      this.metrics.routeLoadTime[route] = [];
    }
    this.metrics.routeLoadTime[route].push(loadTime);

    const avg = this.getAverage(this.metrics.routeLoadTime[route]);
    console.log(`🔀 [Performance] Route ${route}: ${loadTime}ms (avg: ${Math.round(avg)}ms)`);
  }

  /**
   * Track API response time
   */
  public trackAPICall(endpoint: string, duration: number): void {
    if (!this.metrics.apiResponseTime[endpoint]) {
      this.metrics.apiResponseTime[endpoint] = [];
    }
    this.metrics.apiResponseTime[endpoint].push(duration);

    // Only log slow API calls
    if (duration > 1000) {
      const avg = this.getAverage(this.metrics.apiResponseTime[endpoint]);
      console.warn(`⚠️ [Performance] Slow API ${endpoint}: ${duration}ms (avg: ${Math.round(avg)}ms)`);
    }
  }

  /**
   * Get average of an array of numbers
   */
  private getAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Configure reporting endpoint
   */
  public configureReporting(endpoint: string, interval: number = 30000): void {
    this.reportEndpoint = endpoint;
    this.reportInterval = interval;
    this.startReporting();
  }

  /**
   * Start periodic reporting
   */
  private startReporting(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      this.sendReport();
    }, this.reportInterval);
  }

  /**
   * Send metric to backend
   */
  private async sendMetric(metric: any): Promise<void> {
    if (!this.reportEndpoint) return;

    try {
      await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true
      });
    } catch (error) {
      console.error('[Performance] Failed to send metric:', error);
    }
  }

  /**
   * Send full performance report
   */
  private async sendReport(): Promise<void> {
    if (!this.reportEndpoint) return;

    const report = this.getReport();
    
    try {
      await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
        keepalive: true
      });
      console.log('📊 [Performance] Report sent successfully');
    } catch (error) {
      console.error('[Performance] Failed to send report:', error);
    }
  }

  /**
   * Get current performance report
   */
  public getReport(): any {
    const sessionDuration = Date.now() - this.metrics.sessionStart;

    // Calculate averages for routes
    const routeAverages: Record<string, number> = {};
    Object.entries(this.metrics.routeLoadTime).forEach(([route, times]) => {
      routeAverages[route] = Math.round(this.getAverage(times));
    });

    // Calculate averages for API calls
    const apiAverages: Record<string, number> = {};
    Object.entries(this.metrics.apiResponseTime).forEach(([endpoint, times]) => {
      apiAverages[endpoint] = Math.round(this.getAverage(times));
    });

    return {
      // Core Web Vitals
      webVitals: {
        LCP: this.metrics.LCP,
        FID: this.metrics.FID,
        CLS: this.metrics.CLS,
        FCP: this.metrics.FCP,
        TTFB: this.metrics.TTFB,
        INP: this.metrics.INP
      },
      
      // Custom metrics
      routePerformance: routeAverages,
      apiPerformance: apiAverages,
      errorCount: this.metrics.errorCount,
      
      // Session info
      sessionDuration,
      pageViews: this.metrics.pageViews,
      
      // Browser info
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      
      // Timestamp
      timestamp: Date.now()
    };
  }

  /**
   * Get network connection information
   */
  private getConnectionInfo(): any {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  /**
   * Get metrics for dashboard display
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = {
      LCP: null,
      FID: null,
      CLS: null,
      FCP: null,
      TTFB: null,
      INP: null,
      routeLoadTime: {},
      apiResponseTime: {},
      errorCount: 0,
      sessionStart: Date.now(),
      pageViews: 0
    };
    console.log('🧹 [Performance] Metrics cleared');
  }

  /**
   * Stop monitoring and cleanup
   */
  public stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 [Performance] Monitoring stopped');
  }

  /**
   * Mark custom performance measure
   */
  public mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  public measure(name: string, startMark: string, endMark: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0] as PerformanceEntry;
        return measure.duration;
      } catch (error) {
        console.error('[Performance] Measure failed:', error);
        return null;
      }
    }
    return null;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for direct access in components
export default performanceMonitor;

// Helper hook for React components
export const usePerformanceMonitor = () => {
  return performanceMonitor;
};
