/**
 * Web Vitals Monitoring Service
 * 
 * Enterprise-grade performance monitoring:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 - Custom metrics (API latency, render time)
 * - Real User Monitoring (RUM)
 * - Performance budgets
 * - Automated alerts
 * 
 * @module webVitalsMonitoring
 */

import { onCLS, onINP, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';
import { logger } from './logger.enhanced';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  device: 'mobile' | 'desktop';
  connection: string;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceBudget {
  metric: string;
  budget: number; // in milliseconds or unitless
  unit: 'ms' | 'score';
}

/**
 * Performance budgets (industry standards)
 */
const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { metric: 'LCP', budget: 2500, unit: 'ms' },      // Largest Contentful Paint
  { metric: 'FID', budget: 100, unit: 'ms' },       // First Input Delay
  { metric: 'CLS', budget: 0.1, unit: 'score' },    // Cumulative Layout Shift
  { metric: 'FCP', budget: 1800, unit: 'ms' },      // First Contentful Paint
  { metric: 'TTFB', budget: 600, unit: 'ms' },      // Time to First Byte
];

/**
 * Rating thresholds (Google's recommendations)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get rating for metric value
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Get device type
 */
function getDeviceType(): 'mobile' | 'desktop' {
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

/**
 * Get connection type
 */
function getConnectionType(): string {
  if (!('connection' in navigator)) return 'unknown';
  const conn = (navigator as any).connection;
  return conn?.effectiveType || 'unknown';
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: PerformanceMetric | CustomMetric): Promise<void> {
  try {
    // In production, send to your analytics service
    // For now, we'll use Google Analytics 4 if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        metric_rating: (metric as PerformanceMetric).rating,
        non_interaction: true,
      });
    }

    // Also log to our structured logger
    logger.info('Performance metric recorded', metric);

    // Check performance budget
    if ('rating' in metric) {
      checkPerformanceBudget(metric);
    }
  } catch (error) {
    logger.error('Failed to send performance metric', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Check if metric exceeds performance budget
 */
function checkPerformanceBudget(metric: PerformanceMetric): void {
  const budget = PERFORMANCE_BUDGETS.find(b => b.metric === metric.name);
  if (!budget) return;

  const exceeded = metric.value > budget.budget;
  
  if (exceeded) {
    logger.warn('Performance budget exceeded', {
      metric: metric.name,
      value: metric.value,
      budget: budget.budget,
      exceeded: metric.value - budget.budget,
      rating: metric.rating,
    });

    // In production, trigger alert/notification
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service (e.g., Sentry, Datadog)
      console.warn(`⚠️ Performance Budget Exceeded: ${metric.name} = ${metric.value}ms (budget: ${budget.budget}ms)`);
    }
  }
}

/**
 * Process Web Vitals metric
 */
function processMetric(metric: Metric): void {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    timestamp: Date.now(),
    url: window.location.href,
    device: getDeviceType(),
    connection: getConnectionType(),
  };

  sendToAnalytics(performanceMetric);
}

/**
 * Initialize Web Vitals monitoring
 */
export function initializeWebVitals(): void {
  try {
    // Core Web Vitals
    onCLS(processMetric);  // Cumulative Layout Shift
    onINP(processMetric);  // Interaction to Next Paint (replaces FID in web-vitals v4)
    onLCP(processMetric);  // Largest Contentful Paint

    // Other important metrics
    onFCP(processMetric);  // First Contentful Paint
    onTTFB(processMetric); // Time to First Byte

    logger.info('Web Vitals monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize Web Vitals', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track custom performance metric
 * 
 * @example
 * ```typescript
 * trackCustomMetric('api_latency', 250, 'ms', { endpoint: '/api/projects' });
 * trackCustomMetric('bundle_size', 850, 'bytes', { chunk: 'vendor' });
 * ```
 */
export function trackCustomMetric(
  name: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' = 'ms',
  metadata?: Record<string, any>
): void {
  const metric: CustomMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
    metadata,
  };

  sendToAnalytics(metric);
}

/**
 * Measure function execution time
 * 
 * @example
 * ```typescript
 * const result = await measurePerformance('fetchProjects', async () => {
 *   return await fetchProjectsFromAPI();
 * });
 * ```
 */
export async function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    trackCustomMetric(operationName, duration, 'ms', {
      status: 'success',
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    trackCustomMetric(operationName, duration, 'ms', {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
    
    throw error;
  }
}

/**
 * Track API request performance
 */
export function trackApiPerformance(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
): void {
  trackCustomMetric('api_request', duration, 'ms', {
    endpoint,
    method,
    statusCode,
    rating: duration < 500 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
  });
}

/**
 * Track component render time
 */
export function trackComponentRender(
  componentName: string,
  duration: number
): void {
  trackCustomMetric('component_render', duration, 'ms', {
    component: componentName,
    rating: duration < 16 ? 'good' : duration < 50 ? 'needs-improvement' : 'poor', // 16ms = 60fps
  });
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  navigation: PerformanceNavigationTiming | null;
  resources: PerformanceResourceTiming[];
  memory: any;
} {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming || null;
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  // Memory usage (Chrome only)
  const memory = (performance as any).memory ? {
    usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
    totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
    jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
  } : null;

  return { navigation, resources, memory };
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks(): void {
  try {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          logger.warn('Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });

          trackCustomMetric('long_task', entry.duration, 'ms', {
            taskName: entry.name,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    logger.info('Long task monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize long task monitoring', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Export performance data for debugging
 */
export function exportPerformanceData(): string {
  const summary = getPerformanceSummary();
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    device: getDeviceType(),
    connection: getConnectionType(),
    navigation: summary.navigation,
    resourceCount: summary.resources.length,
    memory: summary.memory,
    performance: {
      domContentLoaded: summary.navigation?.domContentLoadedEventEnd || 0,
      loadComplete: summary.navigation?.loadEventEnd || 0,
      responseTime: summary.navigation?.responseEnd ? summary.navigation.responseEnd - summary.navigation.requestStart : 0,
    },
  };

  return JSON.stringify(data, null, 2);
}
