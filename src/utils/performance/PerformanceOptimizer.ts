/**
 * ⚡ PERFORMANCE OPTIMIZATION UTILITIES
 * Memory leak prevention, caching, and optimization tools for monitoring system
 */

// ============================================
// MEMORY MANAGEMENT
// ============================================

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryUsagePercent: number;
  timestamp: Date;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private readonly memoryThreshold = 0.8; // 80% memory usage threshold
  private readonly checkInterval = 30000; // 30 seconds
  private intervalId?: NodeJS.Timeout;
  private listeners: ((stats: MemoryStats) => void)[] = [];

  private constructor() {
    this.startMemoryMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const memory = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };

    const memoryUsagePercent =
      memory.jsHeapSizeLimit > 0 ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryUsagePercent,
      timestamp: new Date(),
    };
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.intervalId = setInterval(() => {
      const stats = this.getMemoryStats();

      // Notify listeners
      this.listeners.forEach((listener) => listener(stats));

      // Check for memory threshold
      if (stats.memoryUsagePercent > this.memoryThreshold * 100) {
        console.warn('⚠️ High memory usage detected:', {
          usagePercent: stats.memoryUsagePercent.toFixed(2) + '%',
          usedMB: (stats.usedJSHeapSize / (1024 * 1024)).toFixed(2) + 'MB',
          limitMB: (stats.jsHeapSizeLimit / (1024 * 1024)).toFixed(2) + 'MB',
        });

        this.triggerGarbageCollection();
      }
    }, this.checkInterval);
  }

  /**
   * Add memory monitoring listener
   */
  addMemoryListener(listener: (stats: MemoryStats) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove memory monitoring listener
   */
  removeMemoryListener(listener: (stats: MemoryStats) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Trigger garbage collection (if available)
   */
  triggerGarbageCollection(): void {
    if ((window as any).gc) {
      (window as any).gc();
      console.log('🗑️ Garbage collection triggered');
    }
  }

  /**
   * Clean up memory manager
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.listeners = [];
  }
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

export interface PerformanceMetrics {
  renderTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  navigationTiming: PerformanceNavigationTiming | null;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initializePerformanceObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance observers
   */
  private initializePerformanceObservers(): void {
    try {
      // Observe paint timings
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.startTime);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Observe layout shift
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.recordMetric('cumulative-layout-shift', (entry as any).value);
          }
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutShiftObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largest-contentful-paint', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('first-input-delay', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  /**
   * Record performance metric
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary(): Record<
    string,
    { average: number; min: number; max: number; count: number }
  > {
    const summary: Record<string, { average: number; min: number; max: number; count: number }> =
      {};

    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        summary[name] = {
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }

    return summary;
  }

  /**
   * Get navigation timing
   */
  getNavigationTiming(): PerformanceNavigationTiming | null {
    const entries = performance.getEntriesByType('navigation');
    return entries.length > 0 ? (entries[0] as PerformanceNavigationTiming) : null;
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.recordMetric(`function-${name}`, end - start);
    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.recordMetric(`async-function-${name}`, end - start);
    return result;
  }

  /**
   * Clean up performance monitor
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// ============================================
// CACHING SYSTEM
// ============================================

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  strategy: 'lru' | 'fifo'; // Eviction strategy
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class PerformanceCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];

  constructor(
    private options: CacheOptions = {
      ttl: 300000, // 5 minutes
      maxSize: 1000,
      strategy: 'lru',
    }
  ) {}

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Update LRU order
    if (this.options.strategy === 'lru') {
      this.removeFromAccessOrder(key);
      this.accessOrder.push(key);
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    const now = Date.now();

    // If key exists, update it
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = now;
      entry.lastAccessed = now;
      return;
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.options.maxSize) {
      this.evictEntries();
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
    });

    this.accessOrder.push(key);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const totalAccesses = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );

    const hits = Array.from(this.cache.values()).filter((entry) => entry.accessCount > 0).length;

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: totalAccesses > 0 ? (hits / totalAccesses) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.options.ttl) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(): void {
    const toEvict = Math.ceil(this.options.maxSize * 0.1); // Evict 10%

    if (this.options.strategy === 'lru') {
      // Remove least recently used
      for (let i = 0; i < toEvict && this.accessOrder.length > 0; i++) {
        const key = this.accessOrder.shift()!;
        this.cache.delete(key);
      }
    } else if (this.options.strategy === 'fifo') {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      for (let i = 0; i < toEvict; i++) {
        const [key] = entries[i];
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
      }
    }
  }

  /**
   * Remove key from access order array
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Rough estimation in bytes
    return this.cache.size * 100; // Assume ~100 bytes per entry
  }
}

// ============================================
// REQUEST DEBOUNCING & THROTTLING
// ============================================

export class RequestOptimizer {
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private throttleTimers = new Map<string, number>();
  private requestQueue = new Map<string, Promise<any>>();

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        // Clear existing timer
        const existingTimer = this.debounceTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.debounceTimers.delete(key);
          }
        }, delay);

        this.debounceTimers.set(key, timer);
      });
    };
  }

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> | null {
    return (...args: Parameters<T>): Promise<ReturnType<T>> | null => {
      const now = Date.now();
      const lastCall = this.throttleTimers.get(key) || 0;

      if (now - lastCall >= delay) {
        this.throttleTimers.set(key, now);
        return Promise.resolve(fn(...args));
      }

      return null; // Call was throttled
    };
  }

  /**
   * Deduplicate identical requests
   */
  deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If there's already a pending request for this key, return it
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    // Create new request
    const request = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, request);
    return request;
  }

  /**
   * Clean up optimizer
   */
  cleanup(): void {
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    this.requestQueue.clear();
  }
}

// ============================================
// EXPORT PERFORMANCE UTILITIES
// ============================================

export const memoryManager = MemoryManager.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const requestOptimizer = new RequestOptimizer();

// Create global performance cache instances
export const systemMetricsCache = new PerformanceCache({
  ttl: 60000,
  maxSize: 100,
  strategy: 'lru',
});
export const userActivityCache = new PerformanceCache({
  ttl: 300000,
  maxSize: 500,
  strategy: 'lru',
});
export const projectMetricsCache = new PerformanceCache({
  ttl: 600000,
  maxSize: 50,
  strategy: 'lru',
});

// Start automatic cleanup
setInterval(() => {
  systemMetricsCache.cleanup();
  userActivityCache.cleanup();
  projectMetricsCache.cleanup();
}, 60000); // Clean up every minute
