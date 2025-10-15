/**
 * 📦 RESPONSE WRAPPER UTILITY
 * Standardizes API responses across all services
 * Ensures consistent error handling and logging
 */

import { monitoringService } from '../monitoringService';

/**
 * Standard API Response Interface
 * All API methods should return this format
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId?: string;
    executionTime?: number;
  };
}

/**
 * Custom API Error Class
 * Extends Error with additional context
 */
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}

/**
 * Standard Error Codes
 */
export const ErrorCodes = {
  // Client Errors (400-499)
  INVALID_INPUT: 'INVALID_INPUT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DUPLICATE: 'DUPLICATE',
  INVALID_OPERATION: 'INVALID_OPERATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors (500-599)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Custom Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
} as const;

/**
 * Wrap successful response with metadata
 * @param data - The data to return
 * @param metadata - Optional metadata
 * @returns Standardized success response
 */
export const wrapResponse = <T>(
  data: T,
  metadata?: Partial<APIResponse<T>['metadata']>
): APIResponse<T> => ({
  success: true,
  data,
  metadata: {
    timestamp: new Date(),
    ...metadata
  }
});

/**
 * Wrap error with standardized format and logging
 * @param error - The error to wrap
 * @param context - Context for logging (service name, method name)
 * @param userId - Optional user ID for error tracking
 * @returns Standardized error response
 */
export const wrapError = (
  error: Error | APIError | unknown,
  context?: string,
  userId?: string
): APIResponse => {
  // Convert to APIError if not already
  let apiError: APIError;
  
  if (error instanceof APIError) {
    apiError = error;
  } else if (error instanceof Error) {
    // Handle specific Firebase errors
    if (error.message.includes('permission-denied')) {
      apiError = new APIError(
        ErrorCodes.PERMISSION_DENIED,
        'You do not have permission to access this resource',
        403,
        { originalError: error.message }
      );
    } else if (error.message.includes('not-found')) {
      apiError = new APIError(
        ErrorCodes.NOT_FOUND,
        'The requested resource was not found',
        404,
        { originalError: error.message }
      );
    } else if (error.message.includes('network')) {
      apiError = new APIError(
        ErrorCodes.NETWORK_ERROR,
        'Network error occurred. Please check your connection.',
        503,
        { originalError: error.message }
      );
    } else {
      apiError = new APIError(
        ErrorCodes.INTERNAL_ERROR,
        error.message || 'An internal error occurred',
        500,
        { originalError: error.message, stack: error.stack }
      );
    }
  } else {
    // Unknown error type
    apiError = new APIError(
      ErrorCodes.UNKNOWN_ERROR,
      'An unknown error occurred',
      500,
      { originalError: String(error) }
    );
  }

  // Log to monitoring service
  monitoringService.logError({
    message: `${context ? `[${context}] ` : ''}${apiError.message}`,
    stack: apiError.stack,
    severity: apiError.statusCode >= 500 ? 'critical' : 
              apiError.statusCode >= 400 ? 'medium' : 'low',
    component: context || 'UnknownService',
    action: 'operation',
    userId: userId,
    userName: userId ? `User ${userId}` : undefined
  });

  // Return standardized error response
  return {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
      details: apiError.details
    },
    metadata: {
      timestamp: new Date()
    }
  };
};

/**
 * Safe async operation wrapper
 * Automatically wraps operation in try-catch and returns APIResponse
 * 
 * @example
 * const result = await safeAsync(
 *   async () => {
 *     const doc = await getDoc(docRef);
 *     return doc.data();
 *   },
 *   'projectService.getProject',
 *   currentUser?.id
 * );
 * 
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  context: string,
  userId?: string
): Promise<APIResponse<T>> => {
  const startTime = performance.now();
  
  try {
    const data = await operation();
    const executionTime = performance.now() - startTime;
    
    // Log performance
    if (executionTime > 1000) {
      console.warn(`⚠️ Slow operation: ${context} took ${executionTime.toFixed(2)}ms`);
    }
    
    return wrapResponse(data, { executionTime });
  } catch (error) {
    return wrapError(error, context, userId);
  }
};

/**
 * Validate and execute operation
 * Combines validation with safe execution
 * 
 * @example
 * const result = await validateAndExecute(
 *   () => projectId && projectId.length > 0,
 *   () => getDoc(doc(db, 'projects', projectId)),
 *   'Invalid project ID',
 *   'projectService.getProject'
 * );
 */
export const validateAndExecute = async <T>(
  validator: () => boolean,
  operation: () => Promise<T>,
  validationError: string,
  context: string,
  userId?: string
): Promise<APIResponse<T>> => {
  try {
    if (!validator()) {
      throw new APIError(
        ErrorCodes.VALIDATION_FAILED,
        validationError,
        400
      );
    }
    
    return await safeAsync(operation, context, userId);
  } catch (error) {
    return wrapError(error, context, userId);
  }
};

/**
 * Batch operation wrapper
 * Executes multiple operations and returns combined results
 * Continues execution even if some operations fail
 * 
 * @example
 * const results = await batchAsync([
 *   () => getProject('proj1'),
 *   () => getProject('proj2'),
 *   () => getProject('proj3')
 * ], 'projectService.batchGetProjects');
 * 
 * results.forEach((result, index) => {
 *   if (result.success) {
 *     console.log(`Project ${index + 1}:`, result.data);
 *   } else {
 *     console.error(`Project ${index + 1} failed:`, result.error);
 *   }
 * });
 */
export const batchAsync = async <T>(
  operations: Array<() => Promise<T>>,
  context: string,
  userId?: string
): Promise<APIResponse<T>[]> => {
  const results = await Promise.allSettled(
    operations.map(op => safeAsync(op, context, userId))
  );
  
  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : wrapError(result.reason, context, userId)
  );
};

/**
 * Timeout wrapper
 * Rejects operation if it takes longer than specified timeout
 * 
 * @example
 * const result = await withTimeout(
 *   async () => fetchDataFromExternalAPI(),
 *   5000, // 5 seconds
 *   'externalService.fetchData'
 * );
 */
export const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  context: string,
  userId?: string
): Promise<APIResponse<T>> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new APIError(
        ErrorCodes.TIMEOUT_ERROR,
        `Operation timed out after ${timeoutMs}ms`,
        408
      ));
    }, timeoutMs);
  });
  
  try {
    const data = await Promise.race([operation(), timeoutPromise]);
    return wrapResponse(data);
  } catch (error) {
    return wrapError(error, context, userId);
  }
};

/**
 * Cache wrapper with error handling
 * Caches successful results for specified duration
 * 
 * @example
 * const result = await withCache(
 *   'project_123',
 *   async () => getDoc(projectRef),
 *   60000, // 1 minute
 *   'projectService.getProject'
 * );
 */
const cache = new Map<string, { data: any; timestamp: number }>();

export const withCache = async <T>(
  cacheKey: string,
  operation: () => Promise<T>,
  cacheDurationMs: number,
  context: string,
  userId?: string
): Promise<APIResponse<T>> => {
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheDurationMs) {
    return wrapResponse(cached.data, {
      requestId: `cached_${cacheKey}`
    });
  }
  
  // Execute operation
  const result = await safeAsync(operation, context, userId);
  
  // Cache if successful
  if (result.success && result.data !== undefined) {
    cache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });
  }
  
  return result;
};

/**
 * Clear cache for specific key or all keys
 */
export const clearCache = (key?: string): void => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

/**
 * Deprecation notice wrapper
 * Logs deprecation warning and calls new method
 */
export const deprecated = <T>(
  oldMethod: string,
  newMethod: string,
  operation: () => Promise<T>,
  context: string
): Promise<APIResponse<T>> => {
  console.warn(
    `⚠️ DEPRECATION WARNING: ${oldMethod} is deprecated. Use ${newMethod} instead.`
  );
  
  return safeAsync(operation, context);
};
