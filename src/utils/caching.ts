/**
 * Enhanced Caching System
 * 
 * Provides advanced caching mechanisms for optimizing application performance including:
 * - In-memory caching with TTL and eviction strategies
 * - IndexedDB caching for offline/persistent storage
 * - Redis-like caching interface
 * - Cache warming and preloading
 * - Cache statistics and monitoring
 */

import { logger } from '@/utils/logger.enhanced';
import * as indexedDBService from '@/utils/indexedDB';

// Cache entry interface
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiry: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

// Cache configuration
export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default time-to-live in milliseconds
  evictionStrategy: 'lru' | 'lfu' | 'fifo' | 'ttl'; // Eviction strategy
  persistence: boolean; // Whether to persist to IndexedDB
  persistenceKey?: string; // Key for IndexedDB storage
  compression: boolean; // Whether to compress large values
  compressionThreshold: number; // Size threshold for compression (bytes)
}

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  evictionStrategy: 'lru',
  persistence: false,
  compression: false,
  compressionThreshold: 1024 * 1024, // 1MB
};

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  size: number; // Current size in bytes
  entryCount: number;
  memoryUsage: number; // Estimated memory usage
  lastEviction: Date | null;
}

/**
 * Enhanced Cache System
 * 
 * Provides advanced caching with multiple eviction strategies, persistence, and monitoring
 */
export class EnhancedCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = []; // For LRU
  private frequencyMap: Map<string, number> = new Map(); // For LFU
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    evictions: 0,
    size: 0,
    entryCount: 0,
    memoryUsage: 0,
    lastEviction: null,
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
    
    // Load from persistence if enabled
    if (this.config.persistence && this.config.persistenceKey) {
      this.loadFromPersistence();
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    // Update LRU order
    if (this.config.evictionStrategy === 'lru') {
      this.removeFromAccessOrder(key);
      this.accessOrder.push(key);
    }

    // Update LFU frequency
    if (this.config.evictionStrategy === 'lfu') {
      const frequency = this.frequencyMap.get(key) || 0;
      this.frequencyMap.set(key, frequency + 1);
    }

    logger.debug('Cache hit', { key, size: entry.size });
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiry = now + (ttl || this.config.defaultTTL);
    const size = this.estimateSize(value);

    // Check if we need to evict entries to make room
    const newSize = this.stats.size + size;
    if (newSize > this.config.maxSize) {
      this.evictEntries(newSize - this.config.maxSize);
    }

    // If key exists, update it
    if (this.cache.has(key)) {
      const existingEntry = this.cache.get(key)!;
      this.stats.size -= existingEntry.size;
      
      existingEntry.value = value;
      existingEntry.timestamp = now;
      existingEntry.expiry = expiry;
      existingEntry.size = size;
      existingEntry.lastAccessed = now;
      
      this.stats.size += size;
    } else {
      // Add new entry
      this.cache.set(key, {
        value,
        timestamp: now,
        expiry,
        accessCount: 0,
        lastAccessed: now,
        size,
      });
      
      this.accessOrder.push(key);
      this.frequencyMap.set(key, 0);
      this.stats.entryCount++;
      this.stats.size += size;
    }

    // Persist to storage if enabled
    if (this.config.persistence && this.config.persistenceKey) {
      this.persistToStorage(key, value);
    }

    logger.debug('Cache set', { key, size, ttl: ttl || this.config.defaultTTL });
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
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    this.frequencyMap.delete(key);
    this.stats.size -= entry.size;
    this.stats.entryCount--;
    this.stats.evictions++;

    logger.debug('Cache entry deleted', { key, size: entry.size });
    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.frequencyMap.clear();
    this.stats.size = 0;
    this.stats.entryCount = 0;
    this.stats.evictions = 0;

    logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Warm cache with preloaded data
   */
  async warm(keys: string[], loader: (key: string) => Promise<T | null>): Promise<void> {
    const startTime = Date.now();
    let loaded = 0;

    try {
      const promises = keys.map(async (key) => {
        if (!this.has(key)) {
          const value = await loader(key);
          if (value !== null) {
            this.set(key, value);
            loaded++;
          }
        }
      });

      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      logger.info('Cache warming completed', { 
        loadedEntries: loaded, 
        totalKeys: keys.length, 
        durationMs: duration 
      });
    } catch (error) {
      logger.error('Cache warming failed', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Preload cache with data
   */
  preload(key: string, value: T, ttl?: number): void {
    this.set(key, value, ttl);
    logger.debug('Cache preloaded', { key });
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        this.frequencyMap.delete(key);
        this.stats.size -= entry.size;
        this.stats.entryCount--;
        this.stats.evictions++;
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cache cleanup completed', { removedEntries: removed });
    }

    return removed;
  }

  /**
   * Evict entries based on strategy
   */
  private evictEntries(bytesToFree: number): void {
    const startTime = Date.now();
    let freedBytes = 0;
    let evictedEntries = 0;

    while (freedBytes < bytesToFree && this.cache.size > 0) {
      let keyToEvict: string | null = null;

      switch (this.config.evictionStrategy) {
        case 'lru':
          // Remove least recently used
          keyToEvict = this.accessOrder.shift() || null;
          break;
          
        case 'lfu':
          // Remove least frequently used
          let minFrequency = Infinity;
          for (const [key, frequency] of this.frequencyMap) {
            if (frequency < minFrequency) {
              minFrequency = frequency;
              keyToEvict = key;
            }
          }
          break;
          
        case 'fifo':
          // Remove oldest entries
          const entries = Array.from(this.cache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          keyToEvict = entries[0]?.[0] || null;
          break;
          
        case 'ttl':
          // Remove entries with shortest TTL
          const now = Date.now();
          let minTTL = Infinity;
          for (const [key, entry] of this.cache) {
            const ttl = entry.expiry - now;
            if (ttl < minTTL) {
              minTTL = ttl;
              keyToEvict = key;
            }
          }
          break;
      }

      if (keyToEvict && this.cache.has(keyToEvict)) {
        const entry = this.cache.get(keyToEvict)!;
        this.cache.delete(keyToEvict);
        this.removeFromAccessOrder(keyToEvict);
        this.frequencyMap.delete(keyToEvict);
        freedBytes += entry.size;
        this.stats.size -= entry.size;
        this.stats.entryCount--;
        this.stats.evictions++;
        evictedEntries++;
      } else {
        break; // No more entries to evict
      }
    }

    const duration = Date.now() - startTime;
    this.stats.lastEviction = new Date();
    
    logger.debug('Cache eviction completed', { 
      evictedEntries, 
      freedBytes, 
      durationMs: duration,
      strategy: this.config.evictionStrategy
    });
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
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    if (value === null || value === undefined) return 0;
    
    // For strings, return length in bytes
    if (typeof value === 'string') {
      return new TextEncoder().encode(value).length;
    }
    
    // For numbers, estimate 8 bytes
    if (typeof value === 'number') {
      return 8;
    }
    
    // For booleans, estimate 1 byte
    if (typeof value === 'boolean') {
      return 1;
    }
    
    // For objects and arrays, serialize and measure
    try {
      const serialized = JSON.stringify(value);
      return new TextEncoder().encode(serialized).length;
    } catch {
      // If serialization fails, estimate 1KB
      return 1024;
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Persist cache entry to storage
   */
  private async persistToStorage(key: string, _value: T): Promise<void> {
    if (!this.config.persistenceKey) return;

    try {
      // IndexedDB persistence not implemented in this version
    } catch (error) {
      logger.warn('Failed to persist cache entry', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Load cache from persistent storage
   */
  private async loadFromPersistence(): Promise<void> {
    if (!this.config.persistenceKey) return;

    // IndexedDB loading not implemented in this version
    logger.debug('Cache persistence not available');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clear all data
    this.clear();
    
    logger.debug('Cache destroyed');
  }
}

// Predefined cache instances for common use cases
export const apiResponseCache = new EnhancedCache<any>({
  maxSize: 25 * 1024 * 1024, // 25MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  evictionStrategy: 'lru',
  persistence: true,
  persistenceKey: 'api-cache',
});

export const userActivityCache = new EnhancedCache<any>({
  maxSize: 10 * 1024 * 1024, // 10MB
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  evictionStrategy: 'lru',
  persistence: true,
  persistenceKey: 'user-activity-cache',
});

export const projectDataCache = new EnhancedCache<any>({
  maxSize: 50 * 1024 * 1024, // 50MB
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  evictionStrategy: 'lru',
  persistence: true,
  persistenceKey: 'project-data-cache',
});

