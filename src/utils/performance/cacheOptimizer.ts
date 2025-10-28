/**
 * Cache Optimizer
 * 
 * Provides intelligent caching strategies for optimal performance
 */

import { logger } from '@/utils/logger.enhanced';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number; // Time to live in milliseconds
  strategy?: 'LRU' | 'LFU' | 'FIFO'; // Eviction strategy
}

export class CacheOptimizer<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: Required<CacheConfig>;
  private accessLog: Map<string, number> = new Map(); // For LFU strategy

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 100,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes default
      strategy: config.strategy || 'LRU',
    };
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessLog.delete(key);
      return null;
    }
    
    // Update access count for LFU
    entry.accessCount += 1;
    this.accessLog.set(key, entry.accessCount);
    
    logger.debug('Cache hit', { key, accessCount: entry.accessCount });
    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }
    
    const expiresAt = Date.now() + (ttl || this.config.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
      accessCount: 0,
    });
    
    this.accessLog.set(key, 0);
    
    logger.debug('Cache set', { key, ttl: ttl || this.config.defaultTTL });
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.accessLog.delete(key);
    return result;
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
    this.accessLog.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Check if cache has item
   */
  has(key: string): boolean {
    return this.cache.has(key) && (this.cache.get(key)?.expiresAt || 0) > Date.now();
  }

  /**
   * Get cache size
   */
  size(): number {
    // Filter out expired items
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt > Date.now()) {
        count++;
      } else {
        // Clean up expired items
        this.cache.delete(key);
        this.accessLog.delete(key);
      }
    }
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
  } {
    // In a real implementation, we would track hits/misses
    // For now, we'll just return basic stats
    return {
      size: this.size(),
      maxSize: this.config.maxSize,
      hitRate: 0,
      missRate: 0,
    };
  }

  /**
   * Evict items based on strategy
   */
  private evict(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string | null = null;
    
    switch (this.config.strategy) {
      case 'LRU': // Least Recently Used
        // Since we don't track access order directly, we'll evict the oldest item
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;
        
        for (const [key, entry] of this.cache.entries()) {
          if (entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
            oldestKey = key;
          }
        }
        
        keyToEvict = oldestKey;
        break;
        
      case 'LFU': // Least Frequently Used
        let leastUsedKey: string | null = null;
        let leastUsedCount = Infinity;
        
        for (const [key, count] of this.accessLog.entries()) {
          if (count < leastUsedCount) {
            leastUsedCount = count;
            leastUsedKey = key;
          }
        }
        
        keyToEvict = leastUsedKey;
        break;
        
      case 'FIFO': // First In, First Out
        // Evict the oldest item (same as LRU in our simple implementation)
        let firstKey: string | null = null;
        let firstTimestamp = Infinity;
        
        for (const [key, entry] of this.cache.entries()) {
          if (entry.timestamp < firstTimestamp) {
            firstTimestamp = entry.timestamp;
            firstKey = key;
          }
        }
        
        keyToEvict = firstKey;
        break;
    }
    
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.accessLog.delete(keyToEvict);
      logger.debug('Cache evicted item', { key: keyToEvict, strategy: this.config.strategy });
    }
  }

  /**
   * Preload items into cache
   */
  async preload(keys: string[], loader: (key: string) => Promise<T>): Promise<void> {
    const promises = keys.map(async (key) => {
      try {
        if (!this.has(key)) {
          const data = await loader(key);
          this.set(key, data);
        }
      } catch (error) {
        logger.error('Cache preload failed', error instanceof Error ? error : new Error(String(error)));
      }
    });
    
    await Promise.all(promises);
  }
}

// Export default cache instance
export const defaultCache = new CacheOptimizer<any>({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  strategy: 'LRU',
});

export default CacheOptimizer;