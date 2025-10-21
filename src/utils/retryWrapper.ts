/**
 * 🔄 RETRY WRAPPER UTILITY
 * Automatic retry mechanism with exponential backoff
 * Handles transient failures gracefully
 */

// import { monitoringService } from '../monitoringService'; // File does not exist, import commented out

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoff?: 'linear' | 'exponential' | 'fibonacci';
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
  onFailure?: (error: Error, totalAttempts: number) => void;
  timeout?: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onFailure'>> =
  {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoff: 'exponential',
    timeout: 60000, // 60 seconds total timeout
  };

/**
 * Errors that should NOT be retried
 */
const NON_RETRYABLE_ERRORS = [
  'permission-denied',
  'unauthenticated',
  'invalid-argument',
  'not-found',
  'already-exists',
  'failed-precondition',
  'out-of-range',
  'unimplemented',
  'validation-error',
  'VALIDATION_FAILED',
  'INVALID_INPUT',
];

/**
 * Check if error should be retried
 */
const shouldRetryError = (error: Error): boolean => {
  const errorMessage = error.message.toLowerCase();

  // Don't retry validation errors
  if (NON_RETRYABLE_ERRORS.some((msg) => errorMessage.includes(msg))) {
    return false;
  }

  // Retry network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('unavailable') ||
    errorMessage.includes('deadline-exceeded') ||
    errorMessage.includes('aborted') ||
    errorMessage.includes('resource-exhausted') ||
    errorMessage.includes('internal')
  ) {
    return true;
  }

  return false;
};

/**
 * Calculate delay based on backoff strategy
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoff: 'linear' | 'exponential' | 'fibonacci'
): number => {
  let delay: number;

  switch (backoff) {
    case 'linear':
      delay = initialDelay * attempt;
      break;

    case 'exponential':
      delay = initialDelay * Math.pow(2, attempt - 1);
      break;

    case 'fibonacci':
      // Fibonacci sequence for delays
      const fib = (n: number): number => {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
      };
      delay = initialDelay * fib(attempt);
      break;

    default:
      delay = initialDelay * Math.pow(2, attempt - 1);
  }

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  delay = delay + jitter;

  return Math.min(delay, maxDelay);
};

/**
 * Delay utility
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Execute operation with retry mechanism
 *
 * @example
 * const result = await withRetry(
 *   async () => {
 *     const doc = await getDoc(docRef);
 *     return doc.data();
 *   },
 *   {
 *     maxAttempts: 3,
 *     backoff: 'exponential',
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms:`, error.message);
 *     }
 *   }
 * );
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const startTime = Date.now();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      // Check total timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > config.timeout) {
        throw new Error(`Operation timeout after ${elapsed}ms`);
      }

      // Execute operation
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(lastError, attempt)
        : shouldRetryError(lastError);

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt >= config.maxAttempts || !shouldRetry) {
        break;
      }

      // Calculate delay for next attempt
      const nextDelay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoff
      );

      // Log retry attempt
      console.warn(
        `⚠️ Operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${nextDelay}ms:`,
        lastError.message
      );

      // Call onRetry callback
      options.onRetry?.(attempt, lastError, nextDelay);

      // Log to monitoring
      monitoringService.logPerformanceMetric({
        metricName: 'retry_attempt',
        value: attempt,
        unit: 'count',
        timestamp: new Date(),
        context: {
          error: lastError.message,
          nextDelay,
          backoff: config.backoff,
        },
      });

      // Wait before retrying
      await delay(nextDelay);
    }
  }

  // All attempts failed
  console.error(`❌ Operation failed after ${config.maxAttempts} attempts:`, lastError);

  // Call onFailure callback
  options.onFailure?.(lastError!, config.maxAttempts);

  // Log final failure
  monitoringService.logError({
    message: `Operation failed after ${config.maxAttempts} retry attempts`,
    stack: lastError?.stack,
    severity: 'high',
    component: 'RetryWrapper',
    action: 'retry_exhausted',
  });

  throw lastError;
};

/**
 * Execute multiple operations with retry
 * Returns partial results even if some operations fail
 *
 * @example
 * const results = await retryBatch([
 *   () => getDoc(doc1Ref),
 *   () => getDoc(doc2Ref),
 *   () => getDoc(doc3Ref)
 * ], { maxAttempts: 2 });
 *
 * results.successful.forEach(result => console.log('Success:', result));
 * results.failed.forEach(error => console.error('Failed:', error));
 */
export const retryBatch = async <T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<{
  successful: T[];
  failed: Error[];
  successCount: number;
  failureCount: number;
}> => {
  const results = await Promise.allSettled(operations.map((op) => withRetry(op, options)));

  const successful: T[] = [];
  const failed: Error[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push(result.reason);
    }
  });

  return {
    successful,
    failed,
    successCount: successful.length,
    failureCount: failed.length,
  };
};

/**
 * Circuit breaker pattern
 * Prevents repeated attempts to a failing service
 */
export class CircuitBreaker<T> {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly operation: () => Promise<T>,
    private readonly options: {
      failureThreshold?: number;
      resetTimeout?: number;
      monitorInterval?: number;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitorInterval: 10000, // 10 seconds
      ...options,
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute(): Promise<T> {
    // Check if circuit should be reset
    if (
      this.state === 'OPEN' &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime > this.options.resetTimeout!
    ) {
      this.state = 'HALF_OPEN';
      this.failureCount = 0;
    }

    // Circuit is open, reject immediately
    if (this.state === 'OPEN') {
      throw new Error(
        `Circuit breaker is OPEN. Service unavailable. ` +
          `Will retry after ${this.options.resetTimeout! / 1000}s`
      );
    }

    try {
      const result = await this.operation();

      // Success, reset failure count
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
      }
      this.failureCount = 0;

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold reached
      if (this.failureCount >= this.options.failureThreshold!) {
        this.state = 'OPEN';

        console.error(
          `🔴 Circuit breaker OPENED after ${this.failureCount} failures. ` +
            `Will reset in ${this.options.resetTimeout! / 1000}s`
        );

        monitoringService.logError({
          message: 'Circuit breaker opened due to repeated failures',
          severity: 'critical',
          component: 'CircuitBreaker',
          action: 'circuit_opened',
        });
      }

      throw error;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): string {
    return this.state;
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Get failure statistics
   */
  getStats(): {
    state: string;
    failureCount: number;
    lastFailureTime: number | null;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Retry queue for offline operations
 * Stores failed operations and retries when connection is restored
 */
export class RetryQueue {
  private queue: Array<{
    id: string;
    operation: () => Promise<any>;
    timestamp: number;
    attempts: number;
    maxAttempts: number;
  }> = [];

  private isProcessing = false;
  private isOnline = navigator.onLine;

  constructor() {
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Add operation to queue
   */
  enqueue(operation: () => Promise<any>, maxAttempts = 3): string {
    const id = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.queue.push({
      id,
      operation,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts,
    });

    console.log(`📝 Operation queued: ${id} (${this.queue.length} in queue)`);

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process queued operations
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    console.log(`🔄 Processing ${this.queue.length} queued operations`);

    const operations = [...this.queue];
    this.queue = [];

    for (const item of operations) {
      try {
        await item.operation();
        console.log(`✅ Queued operation completed: ${item.id}`);
      } catch (error) {
        item.attempts++;

        if (item.attempts < item.maxAttempts) {
          // Re-queue for retry
          this.queue.push(item);
          console.warn(
            `⚠️ Queued operation failed (${item.attempts}/${item.maxAttempts}): ${item.id}`,
            error
          );
        } else {
          // Max attempts reached
          console.error(
            `❌ Queued operation failed permanently after ${item.attempts} attempts: ${item.id}`,
            error
          );

          monitoringService.logError({
            message: `Queued operation failed permanently: ${item.id}`,
            severity: 'high',
            component: 'RetryQueue',
            action: 'queue_exhausted',
          });
        }
      }
    }

    this.isProcessing = false;

    // Process remaining items if any
    if (this.queue.length > 0 && this.isOnline) {
      setTimeout(() => this.processQueue(), 5000);
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueLength: number;
    isProcessing: boolean;
    isOnline: boolean;
    oldestItem: number | null;
  } {
    const oldestItem =
      this.queue.length > 0 ? Math.min(...this.queue.map((item) => item.timestamp)) : null;

    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      isOnline: this.isOnline,
      oldestItem,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}

/**
 * Global retry queue instance
 */
export const globalRetryQueue = new RetryQueue();
