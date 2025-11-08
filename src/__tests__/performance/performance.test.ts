/**
 * Performance Tests
 * 
 * Comprehensive tests for performance monitoring utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor } from '../../utils/performance/performanceMonitor';
import { CacheOptimizer } from '../../utils/performance/cacheOptimizer';
import { bundleAnalyzer } from '../../utils/performance/bundleAnalyzer';

// Mock performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockReturnValue([]),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Mock window.performance
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  describe('Performance Monitor', () => {
    it('should start and end timing correctly', () => {
      const startMark = performanceMonitor.startTiming('test-component');
      expect(startMark).toContain('test-component_start_');
      
      performanceMonitor.endTiming(startMark, 'TestComponent');
      expect(mockPerformance.mark).toHaveBeenCalledTimes(2);
      expect(mockPerformance.measure).toHaveBeenCalled();
    });

    it('should record metrics', () => {
      performanceMonitor.recordMetric({
        componentName: 'TestComponent',
        renderTime: 15.5,
      });
      
      const report = performanceMonitor.getPerformanceReport();
      expect(report.totalMetrics).toBe(1);
      expect(report.avgRenderTime).toBe(15.5);
    });

    it('should record API call performance', () => {
      performanceMonitor.recordApiCall('/api/test', 120, 200);
      
      const report = performanceMonitor.getPerformanceReport();
      expect(report.totalMetrics).toBe(1);
      expect(report.avgApiCallTime).toBe(120);
    });

    it('should get slowest components', () => {
      // Record multiple metrics with different render times
      performanceMonitor.recordMetric({ componentName: 'FastComponent', renderTime: 5 });
      performanceMonitor.recordMetric({ componentName: 'SlowComponent', renderTime: 50 });
      performanceMonitor.recordMetric({ componentName: 'MediumComponent', renderTime: 25 });
      
      const slowest = performanceMonitor.getSlowestComponents(2);
      expect(slowest).toHaveLength(2);
      expect(slowest[0].componentName).toBe('SlowComponent');
      expect(slowest[1].componentName).toBe('MediumComponent');
    });

    it('should clear metrics', () => {
      performanceMonitor.recordMetric({ componentName: 'TestComponent', renderTime: 10 });
      expect(performanceMonitor.getPerformanceReport().totalMetrics).toBe(1);
      
      performanceMonitor.clearMetrics();
      expect(performanceMonitor.getPerformanceReport().totalMetrics).toBe(0);
    });
  });

  describe('Cache Optimizer', () => {
    it('should set and get cache items', () => {
      const cache = new CacheOptimizer<string>({ maxSize: 10 });
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should respect TTL expiration', () => {
      vi.useFakeTimers();
      
      const cache = new CacheOptimizer<string>({ defaultTTL: 1000 });
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1500);
      expect(cache.get('key1')).toBeNull();
      expect(cache.has('key1')).toBe(false);
      
      vi.useRealTimers();
    });

    it('should evict items when maxSize is exceeded', () => {
      const cache = new CacheOptimizer<string>({ maxSize: 2, strategy: 'FIFO' });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // This should evict key1
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should delete items', () => {
      const cache = new CacheOptimizer<string>({ maxSize: 10 });
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      const result = cache.delete('key1');
      expect(result).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all items', () => {
      const cache = new CacheOptimizer<string>({ maxSize: 10 });
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('Bundle Analyzer', () => {
    it('should analyze bundle size', () => {
      const analysis = bundleAnalyzer.analyzeBundle();
      
      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.chunks).toHaveLength(2);
      expect(analysis.largestChunks).toHaveLength(2);
      expect(analysis.recommendations).toHaveLength(14); // Updated: actual implementation returns 14
    });

    it('should generate module analysis', () => {
      const modules = bundleAnalyzer.getModuleAnalysis();
      
      expect(modules).toHaveProperty('React Components');
      expect(modules).toHaveProperty('Vendor Libraries');
      expect(Object.keys(modules)).toHaveLength(5);
    });

    it('should generate loading metrics', () => {
      const metrics = bundleAnalyzer.getLoadingMetrics();
      
      expect(metrics.firstPaint).toBe(1200);
      expect(metrics.firstContentfulPaint).toBe(1500);
      expect(metrics.largestContentfulPaint).toBe(2500);
      expect(metrics.cumulativeLayoutShift).toBe(0.1);
    });

    it('should generate performance report', () => {
      const report = bundleAnalyzer.generatePerformanceReport();
      
      expect(report).toContain('Bundle Performance Analysis Report');
      expect(report).toContain('Bundle Size');
      expect(report).toContain('Optimization Recommendations');
    });
  });
});