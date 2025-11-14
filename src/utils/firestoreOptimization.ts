/**
 * Firestore Query Optimization Utilities
 * 
 * Utilities for optimizing Firestore queries including:
 * - Batch reads
 * - Query pagination
 * - Result caching with TTL
 * - Query deduplication
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  startAfter,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { logger } from './logger.enhanced';

/**
 * Batch read multiple documents by IDs
 * More efficient than individual getDoc calls
 */
export async function batchGetDocuments<T = DocumentData>(
  collectionPath: string,
  documentIds: string[]
): Promise<Map<string, T | null>> {
  const results = new Map<string, T | null>();

  if (documentIds.length === 0) {
    return results;
  }

  try {
    // Firestore limits: max 10 docs per batch efficiently
    const batchSize = 10;
    const batches: string[][] = [];

    for (let i = 0; i < documentIds.length; i += batchSize) {
      batches.push(documentIds.slice(i, i + batchSize));
    }

    // Execute batches in parallel
    await Promise.all(
      batches.map(async (batch) => {
        const promises = batch.map((id) =>
          getDoc(doc(db, collectionPath, id))
        );

        const snapshots = await Promise.all(promises);

        snapshots.forEach((snapshot, index) => {
          const id = batch[index];
          results.set(id, snapshot.exists() ? (snapshot.data() as T) : null);
        });
      })
    );

    logger.info('Batch read completed', {
      collectionPath,
      count: documentIds.length,
      batches: batches.length,
    });

    return results;
  } catch (error) {
    logger.error('Batch read failed', error as Error, {
      collectionPath,
      documentIds,
    });
    throw error;
  }
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Execute paginated query
 * Returns data + cursor for next page
 */
export async function paginatedQuery<T = DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[],
  pageSize: number = 50,
  lastDocument?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<T>> {
  try {
    const queryConstraints = [...constraints];

    // Add pagination
    if (lastDocument) {
      queryConstraints.push(startAfter(lastDocument));
    }
    queryConstraints.push(firestoreLimit(pageSize + 1)); // +1 to check hasMore

    const q = query(collection(db, collectionPath), ...queryConstraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > pageSize;
    const data = snapshot.docs
      .slice(0, pageSize)
      .map((doc) => ({ id: doc.id, ...doc.data() } as T));

    const lastDoc = hasMore ? snapshot.docs[pageSize - 1] : null;

    logger.debug('Paginated query executed', {
      collectionPath,
      pageSize,
      returned: data.length,
      hasMore,
    });

    return {
      data,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    logger.error('Paginated query failed', error as Error, {
      collectionPath,
      pageSize,
    });
    throw error;
  }
}

/**
 * Query result cache with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Max cached queries

  /**
   * Get cached result if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    // 5 min default
    // Enforce max size (LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear cache by pattern
   */
  clearPattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()),
    };
  }
}

export const queryCache = new QueryCache();

/**
 * Execute query with caching
 */
export async function cachedQuery<T = DocumentData>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl: number = 300000 // 5 minutes default
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(cacheKey);
  if (cached !== null) {
    logger.debug('Query cache hit', { cacheKey });
    return cached;
  }

  // Execute query
  logger.debug('Query cache miss', { cacheKey });
  const result = await queryFn();

  // Cache result
  queryCache.set(cacheKey, result, ttl);

  return result;
}

/**
 * Batch query with deduplication
 * Prevents multiple simultaneous identical queries
 */
class QueryDeduplicator {
  private pending = new Map<string, Promise<any>>();

  async execute<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    // Check if query already in flight
    const existing = this.pending.get(key);
    if (existing) {
      logger.debug('Query deduplicated', { key });
      return existing as Promise<T>;
    }

    // Execute query
    const promise = queryFn()
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pending.clear();
  }
}

export const queryDeduplicator = new QueryDeduplicator();

/**
 * Optimized query with caching and deduplication
 */
export async function optimizedQuery<T = DocumentData>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    deduplicate?: boolean;
  } = {}
): Promise<T> {
  const { ttl = 300000, deduplicate = true } = options;

  if (deduplicate) {
    return queryDeduplicator.execute(cacheKey, () =>
      cachedQuery(cacheKey, queryFn, ttl)
    );
  }

  return cachedQuery(cacheKey, queryFn, ttl);
}

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(
  collectionPath: string,
  filters: Record<string, any>
): string {
  const sortedFilters = Object.keys(filters)
    .sort()
    .map((key) => `${key}:${JSON.stringify(filters[key])}`)
    .join('|');

  return `${collectionPath}::${sortedFilters}`;
}
