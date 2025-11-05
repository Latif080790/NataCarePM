import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  getDoc,
  doc,
  Query,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { logger } from '@/utils/logger.enhanced';
import { withRetry } from '@/utils/retryWrapper';

/**
 * Firestore Query Optimization Utilities
 * 
 * Provides optimized querying patterns for better performance:
 * - Pagination support
 * - Index optimization hints
 * - Caching strategies
 * - Batch operations
 * - Query result caching
 */

// Cache for query results
const queryCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Batch size for pagination
const DEFAULT_BATCH_SIZE = 50;

export class FirestoreOptimizer {
  /**
   * Paginated query with automatic batching
   */
  static async paginatedQuery<T>(
    collectionPath: string,
    filters: Array<{ field: string; operator: any; value: any }>,
    orderByField: string,
    orderByDirection: 'asc' | 'desc' = 'asc',
    batchSize: number = DEFAULT_BATCH_SIZE,
    lastDocument?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ data: T[]; lastDocument: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }> {
    try {
      logger.debug('Executing paginated query', { 
        collectionPath, 
        filters, 
        orderByField, 
        batchSize 
      });

      // Build base query
      let baseQuery: Query<DocumentData> = collection(db, collectionPath);
      
      // Apply filters
      for (const filter of filters) {
        baseQuery = query(baseQuery, where(filter.field, filter.operator, filter.value));
      }
      
      // Apply ordering
      baseQuery = query(baseQuery, orderBy(orderByField, orderByDirection));
      
      // Apply pagination
      baseQuery = query(baseQuery, limit(batchSize));
      
      // Apply cursor if provided
      if (lastDocument) {
        baseQuery = query(baseQuery, startAfter(lastDocument));
      }

      // Execute query with retry
      const querySnapshot = await withRetry(() => getDocs(baseQuery), { maxAttempts: 3 });

      // Convert to typed array
      const data: T[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));

      // Determine if there are more results
      const hasMore = querySnapshot.docs.length === batchSize;
      const lastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

      logger.debug('Paginated query completed', { 
        collectionPath, 
        resultCount: data.length, 
        hasMore 
      });

      return {
        data,
        lastDocument: lastDoc,
        hasMore
      };
    } catch (error) {
      logger.error('Paginated query failed', error as Error, { collectionPath });
      throw error;
    }
  }

  /**
   * Cached query with automatic cache management
   */
  static async cachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T[]>,
    ttl: number = CACHE_TTL
  ): Promise<T[]> {
    try {
      // Check cache first
      const cached = queryCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < ttl) {
        logger.debug('Returning cached query result', { cacheKey });
        return cached.data as T[];
      }

      // Execute query
      logger.debug('Executing cached query', { cacheKey });
      const data = await queryFn();

      // Store in cache
      queryCache.set(cacheKey, {
        data,
        timestamp: now
      });

      return data;
    } catch (error) {
      logger.error('Cached query failed', error as Error, { cacheKey });
      throw error;
    }
  }

  /**
   * Multi-collection query with parallel execution
   */
  static async parallelQueries<T>(
    queries: Array<{ collectionPath: string; filters: Array<{ field: string; operator: any; value: any }> }>
  ): Promise<T[]> {
    try {
      logger.debug('Executing parallel queries', { queryCount: queries.length });

      // Execute all queries in parallel
      const queryPromises = queries.map(async (q) => {
        let baseQuery: Query<DocumentData> = collection(db, q.collectionPath);
        
        // Apply filters
        for (const filter of q.filters) {
          baseQuery = query(baseQuery, where(filter.field, filter.operator, filter.value));
        }
        
        // Limit results to prevent memory issues
        baseQuery = query(baseQuery, limit(100));
        
        return withRetry(() => getDocs(baseQuery), { maxAttempts: 3 });
      });

      // Wait for all queries to complete
      const snapshots = await Promise.all(queryPromises);

      // Combine results
      const combinedData: T[] = [];
      for (const snapshot of snapshots) {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        combinedData.push(...data);
      }

      logger.debug('Parallel queries completed', { 
        queryCount: queries.length, 
        resultCount: combinedData.length 
      });

      return combinedData;
    } catch (error) {
      logger.error('Parallel queries failed', error as Error);
      throw error;
    }
  }

  /**
   * Optimized single document fetch with caching
   */
  static async fetchDocument<T>(
    collectionPath: string,
    documentId: string,
    useCache: boolean = true
  ): Promise<T | null> {
    try {
      const cacheKey = `${collectionPath}/${documentId}`;
      const now = Date.now();

      // Check cache if enabled
      if (useCache) {
        const cached = queryCache.get(cacheKey);
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          logger.debug('Returning cached document', { cacheKey });
          return cached.data as T;
        }
      }

      // Fetch document
      logger.debug('Fetching document', { collectionPath, documentId });
      const docRef = doc(db, collectionPath, documentId);
      const docSnap = await withRetry(() => getDoc(docRef), { maxAttempts: 3 });

      if (!docSnap.exists()) {
        return null;
      }

      const data = {
        id: docSnap.id,
        ...docSnap.data()
      } as T;

      // Cache result if enabled
      if (useCache) {
        queryCache.set(cacheKey, {
          data,
          timestamp: now
        });
      }

      return data;
    } catch (error) {
      logger.error('Document fetch failed', error as Error, { collectionPath, documentId });
      throw error;
    }
  }

  /**
   * Clear query cache
   */
  static clearCache(): void {
    queryCache.clear();
    logger.info('Query cache cleared');
  }

  /**
   * Clear specific cache entry
   */
  static clearCacheEntry(cacheKey: string): boolean {
    const result = queryCache.delete(cacheKey);
    if (result) {
      logger.debug('Cache entry cleared', { cacheKey });
    }
    return result;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: queryCache.size,
      keys: Array.from(queryCache.keys())
    };
  }
}

// Export optimized query functions
export const {
  paginatedQuery,
  cachedQuery,
  parallelQueries,
  fetchDocument,
  clearCache,
  clearCacheEntry,
  getCacheStats
} = FirestoreOptimizer;

// Periodically clean up expired cache entries
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of queryCache.entries()) {
    if ((now - value.timestamp) >= CACHE_TTL) {
      queryCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug('Cleaned expired cache entries', { cleanedCount });
  }
}, 60000); // Check every minute