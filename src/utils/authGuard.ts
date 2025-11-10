/**
 * Authentication Guard Utility
 * Ensures user is properly authenticated before Firestore operations
 * Fixes 400 Bad Request errors caused by auth state timing issues
 */

import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { logger } from '@/utils/logger';

/**
 * Wait for authentication state to be ready
 * @param timeout Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves with the current user or null
 */
export async function waitForAuth(timeout: number = 5000): Promise<FirebaseUser | null> {
  // If user is already authenticated, return immediately
  if (auth.currentUser) {
    logger.debug('authGuard:waitForAuth', 'User already authenticated', {
      uid: auth.currentUser.uid,
    });
    return auth.currentUser;
  }

  // Otherwise, wait for auth state to be determined
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      logger.warn('authGuard:waitForAuth', 'Auth state check timeout');
      resolve(null); // Resolve with null instead of rejecting
    }, timeout);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(timeoutId);
        unsubscribe();
        
        if (user) {
          logger.info('authGuard:waitForAuth', 'User authenticated', {
            uid: user.uid,
            email: user.email,
          });
        } else {
          logger.info('authGuard:waitForAuth', 'No user authenticated');
        }
        
        resolve(user);
      },
      (error) => {
        clearTimeout(timeoutId);
        unsubscribe();
        logger.error('authGuard:waitForAuth', 'Auth state check error', error);
        reject(error);
      }
    );
  });
}

/**
 * Ensure user is authenticated before executing operation
 * Throws error if user is not authenticated
 * @param operationName Name of the operation for logging
 * @returns The authenticated user
 * @throws Error if user is not authenticated
 */
export async function requireAuth(operationName: string): Promise<FirebaseUser> {
  const user = await waitForAuth();
  
  if (!user) {
    const error = new Error('User must be authenticated to perform this operation');
    logger.error(`authGuard:requireAuth:${operationName}`, 'Authentication required', error);
    throw error;
  }
  
  logger.debug(`authGuard:requireAuth:${operationName}`, 'Auth check passed', {
    uid: user.uid,
  });
  
  return user;
}

/**
 * Check if user is authenticated (non-blocking)
 * @returns true if user is authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Get current user synchronously
 * @returns Current user or null
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Get current user's ID token for API requests
 * @param forceRefresh Whether to force token refresh
 * @returns ID token string
 * @throws Error if user is not authenticated
 */
export async function getIdToken(forceRefresh: boolean = false): Promise<string> {
  const user = await requireAuth('getIdToken');
  return user.getIdToken(forceRefresh);
}

/**
 * Retry wrapper for Firestore operations with auth check
 * @param operation The async operation to execute
 * @param operationName Name for logging
 * @param maxRetries Maximum number of retries (default: 3)
 * @returns Result of the operation
 */
export async function withAuthRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure auth state is ready before operation
      await requireAuth(operationName);
      
      // Execute operation
      const result = await operation();
      
      if (attempt > 1) {
        logger.info(`authGuard:withAuthRetry:${operationName}`, 'Operation succeeded after retry', {
          attempt,
        });
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      logger.warn(`authGuard:withAuthRetry:${operationName}`, 'Operation failed', {
        attempt,
        maxRetries,
        error: lastError.message,
      });
      
      // Don't retry on certain errors
      if (
        lastError.message.includes('permission-denied') ||
        lastError.message.includes('not-found') ||
        lastError.message.includes('already-exists')
      ) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.debug(`authGuard:withAuthRetry:${operationName}`, 'Waiting before retry', {
          delay,
          nextAttempt: attempt + 1,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error(`authGuard:withAuthRetry:${operationName}`, 'All retry attempts failed', lastError!);
  throw lastError!;
}
