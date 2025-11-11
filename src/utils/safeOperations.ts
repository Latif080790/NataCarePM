/**
 * Safe Operations Utility
 * Defensive programming helpers to prevent "Cannot read properties of undefined" errors
 * 
 * @module safeOperations
 * @author NataCarePM Team
 * @date 2025-11-12
 */

/**
 * Safely map over an array with fallback
 * Prevents crashes when array is undefined/null
 * 
 * @example
 * ```tsx
 * // BEFORE (❌ UNSAFE):
 * items.map(item => <div>{item.name}</div>)
 * 
 * // AFTER (✅ SAFE):
 * safeMap(items, item => <div>{item.name}</div>)
 * ```
 */
export function safeMap<T, R>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => R,
  fallback: R[] = []
): R[] {
  if (!array || !Array.isArray(array)) return fallback;
  if (array.length === 0) return fallback;
  
  try {
    return array.map(callback);
  } catch (error) {
    console.error('[safeMap] Error during map operation:', error);
    return fallback;
  }
}

/**
 * Safely filter an array
 * 
 * @example
 * ```tsx
 * const activeUsers = safeFilter(users, user => user.active);
 * ```
 */
export function safeFilter<T>(
  array: T[] | undefined | null,
  callback: (item: T, index: number, array: T[]) => boolean,
  fallback: T[] = []
): T[] {
  if (!array || !Array.isArray(array)) return fallback;
  if (array.length === 0) return fallback;
  
  try {
    return array.filter(callback);
  } catch (error) {
    console.error('[safeFilter] Error during filter operation:', error);
    return fallback;
  }
}

/**
 * Safely reduce an array
 * 
 * @example
 * ```tsx
 * const total = safeReduce(expenses, (sum, expense) => sum + expense.amount, 0);
 * ```
 */
export function safeReduce<T, R>(
  array: T[] | undefined | null,
  callback: (accumulator: R, item: T, index: number, array: T[]) => R,
  initialValue: R
): R {
  if (!array || !Array.isArray(array) || array.length === 0) return initialValue;
  
  try {
    return array.reduce(callback, initialValue);
  } catch (error) {
    console.error('[safeReduce] Error during reduce operation:', error);
    return initialValue;
  }
}

/**
 * Safely get a property from an object using dot notation
 * 
 * @example
 * ```tsx
 * // BEFORE (❌ UNSAFE):
 * const name = user.profile.name;
 * 
 * // AFTER (✅ SAFE):
 * const name = safeGet(user, 'profile.name', 'Unknown');
 * ```
 */
export function safeGet<T>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    
    return result !== undefined && result !== null ? result : defaultValue;
  } catch (error) {
    console.error('[safeGet] Error accessing path:', path, error);
    return defaultValue;
  }
}

/**
 * Safely get array length
 * 
 * @example
 * ```tsx
 * const count = safeLength(items); // Returns 0 if undefined
 * ```
 */
export function safeLength(array: any[] | undefined | null): number {
  if (!array || !Array.isArray(array)) return 0;
  return array.length;
}

/**
 * Check if array is empty or undefined
 * 
 * @example
 * ```tsx
 * if (isEmpty(items)) {
 *   return <EmptyState />;
 * }
 * ```
 */
export function isEmpty(array: any[] | undefined | null): boolean {
  return !array || !Array.isArray(array) || array.length === 0;
}

/**
 * Check if array has items
 * 
 * @example
 * ```tsx
 * if (hasItems(purchaseOrders)) {
 *   return <POTable data={purchaseOrders} />;
 * }
 * ```
 */
export function hasItems(array: any[] | undefined | null): boolean {
  return Boolean(array && Array.isArray(array) && array.length > 0);
}

/**
 * Safely get first item from array
 */
export function safeFirst<T>(array: T[] | undefined | null, fallback?: T): T | undefined {
  if (!hasItems(array)) return fallback;
  return array![0];
}

/**
 * Safely get last item from array
 */
export function safeLast<T>(array: T[] | undefined | null, fallback?: T): T | undefined {
  if (!hasItems(array)) return fallback;
  return array![array!.length - 1];
}

/**
 * Safely find item in array
 */
export function safeFind<T>(
  array: T[] | undefined | null,
  predicate: (item: T, index: number, array: T[]) => boolean,
  fallback?: T
): T | undefined {
  if (!hasItems(array)) return fallback;
  
  try {
    return array!.find(predicate) || fallback;
  } catch (error) {
    console.error('[safeFind] Error during find operation:', error);
    return fallback;
  }
}

/**
 * Safely sort array (returns new array, doesn't mutate original)
 */
export function safeSort<T>(
  array: T[] | undefined | null,
  compareFn?: (a: T, b: T) => number,
  fallback: T[] = []
): T[] {
  if (!hasItems(array)) return fallback;
  
  try {
    return [...array!].sort(compareFn);
  } catch (error) {
    console.error('[safeSort] Error during sort operation:', error);
    return fallback;
  }
}

/**
 * Type guard to check if value is an array
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: any): value is T[] {
  return Array.isArray(value) && value.length > 0;
}
