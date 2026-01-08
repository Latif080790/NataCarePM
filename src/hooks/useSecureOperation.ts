/**
 * useSecureOperation Hook
 * 
 * React hook for performing secure operations with built-in:
 * - Rate limiting
 * - Input sanitization
 * - Audit logging
 * - Error handling
 * - Loading states
 * 
 * @module useSecureOperation
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext.minimal';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import {
  executeSecureOperation,
  sanitizeTextInput,
  sanitizeObjectInput,
  checkRateLimit,
  resetRateLimit,
  SecureOperationOptions,
} from '@/utils/securityMiddleware';
import { logger } from '@/utils/logger.enhanced';

// ============================================================================
// Types
// ============================================================================

export interface UseSecureOperationOptions {
  /** Operation type for rate limiting */
  operationType: SecureOperationOptions['operationType'];
  /** Operation description for audit logs */
  operationDescription: string;
  /** Show toast on success */
  showSuccessToast?: boolean;
  /** Show toast on error */
  showErrorToast?: boolean;
  /** Success toast message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Reset rate limit on success */
  resetOnSuccess?: boolean;
  /** Include project ID in audit */
  includeProjectId?: boolean;
}

export interface SecureOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isRateLimited: boolean;
  rateLimitInfo: {
    remainingAttempts: number;
    blockedUntil?: Date;
  } | null;
}

export interface UseSecureOperationReturn<T> {
  /** Current state */
  state: SecureOperationState<T>;
  /** Execute the secure operation */
  execute: (operation: () => Promise<T>, metadata?: Record<string, unknown>) => Promise<boolean>;
  /** Check if operation is allowed (rate limit check) */
  checkAllowed: () => boolean;
  /** Reset state */
  reset: () => void;
  /** Clear rate limit */
  clearRateLimit: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for executing secure operations
 * 
 * @example
 * ```tsx
 * const { state, execute } = useSecureOperation<RABItem>({
 *   operationType: 'budget-change',
 *   operationDescription: 'Update RAB item',
 *   showSuccessToast: true,
 *   successMessage: 'RAB item updated successfully',
 * });
 * 
 * const handleUpdate = async () => {
 *   const success = await execute(
 *     () => rabService.updateItem(itemId, data),
 *     { itemId, changes: data }
 *   );
 *   
 *   if (success) {
 *     // Handle success
 *   }
 * };
 * ```
 */
export function useSecureOperation<T = unknown>(
  options: UseSecureOperationOptions
): UseSecureOperationReturn<T> {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [state, setState] = useState<SecureOperationState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isRateLimited: false,
    rateLimitInfo: null,
  });

  const {
    operationType,
    operationDescription,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    errorMessage,
    resetOnSuccess = true,
    includeProjectId = true,
  } = options;

  /**
   * Check if operation is allowed (rate limit check without incrementing)
   */
  const checkAllowed = useCallback((): boolean => {
    if (!currentUser?.id) return false;
    
    const result = checkRateLimit(currentUser.id, operationType);
    
    if (!result.allowed) {
      setState(prev => ({
        ...prev,
        isRateLimited: true,
        rateLimitInfo: {
          remainingAttempts: result.remainingAttempts,
          blockedUntil: result.blockedUntil,
        },
      }));
    }
    
    return result.allowed;
  }, [currentUser?.id, operationType]);

  /**
   * Execute secure operation
   */
  const execute = useCallback(async (
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    if (!currentUser?.id) {
      logger.error('[useSecureOperation] No user ID available');
      setState(prev => ({
        ...prev,
        error: 'Authentication required',
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isRateLimited: false,
    }));

    try {
      const result = await executeSecureOperation<T>(
        {
          userId: currentUser.id,
          operationType,
          operationDescription,
          projectId: includeProjectId ? currentProject?.id : undefined,
          metadata,
        },
        operation
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          data: result.data ?? null,
          error: null,
        }));

        // Reset rate limit on success
        if (resetOnSuccess) {
          resetRateLimit(currentUser.id, operationType);
        }

        // Show success toast
        if (showSuccessToast) {
          addToast({
            type: 'success',
            message: successMessage || `${operationDescription} completed successfully`,
          });
        }

        return true;
      } else {
        // Check if rate limited
        const isRateLimited = result.error?.includes('Too many attempts') || 
                             result.error?.includes('Maximum attempts');
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Operation failed',
          isRateLimited,
        }));

        // Show error toast
        if (showErrorToast) {
          addToast({
            type: 'error',
            message: errorMessage || result.error || 'Operation failed',
          });
        }

        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));

      if (showErrorToast) {
        addToast({
          type: 'error',
          message: errorMessage || errorMsg,
        });
      }

      logger.error('[useSecureOperation] Operation failed', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [
    currentUser?.id,
    currentProject?.id,
    operationType,
    operationDescription,
    includeProjectId,
    resetOnSuccess,
    showSuccessToast,
    showErrorToast,
    successMessage,
    errorMessage,
    addToast,
  ]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isRateLimited: false,
      rateLimitInfo: null,
    });
  }, []);

  /**
   * Clear rate limit for current user
   */
  const clearRateLimit = useCallback(() => {
    if (currentUser?.id) {
      resetRateLimit(currentUser.id, operationType);
      setState(prev => ({
        ...prev,
        isRateLimited: false,
        rateLimitInfo: null,
      }));
    }
  }, [currentUser?.id, operationType]);

  return {
    state,
    execute,
    checkAllowed,
    reset,
    clearRateLimit,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for sanitizing form inputs
 * 
 * @example
 * ```tsx
 * const { sanitize, sanitizeObject } = useSanitize();
 * 
 * const handleSubmit = (data) => {
 *   const cleanData = sanitizeObject(data, {
 *     strictFields: ['name', 'email'],
 *     basicFields: ['description'],
 *   });
 *   
 *   // Use cleanData.sanitized
 * };
 * ```
 */
export function useSanitize() {
  const sanitize = useCallback((input: string) => {
    return sanitizeTextInput(input);
  }, []);

  const sanitizeObj = useCallback(<T extends Record<string, unknown>>(
    input: T,
    options?: {
      strictFields?: string[];
      basicFields?: string[];
      urlFields?: string[];
      skipFields?: string[];
    }
  ) => {
    return sanitizeObjectInput(input, options);
  }, []);

  return {
    sanitize,
    sanitizeObject: sanitizeObj,
  };
}

/**
 * Hook for checking rate limit status
 * 
 * @example
 * ```tsx
 * const { isAllowed, remainingAttempts, checkLimit } = useRateLimit('login');
 * 
 * if (!isAllowed) {
 *   return <div>Too many attempts. Please wait.</div>;
 * }
 * ```
 */
export function useRateLimit(operationType: string) {
  const { currentUser } = useAuth();
  const [limitInfo, setLimitInfo] = useState<{
    isAllowed: boolean;
    remainingAttempts: number;
    blockedUntil?: Date;
  }>({
    isAllowed: true,
    remainingAttempts: Infinity,
  });

  const checkLimit = useCallback(() => {
    if (!currentUser?.id) {
      return { isAllowed: false, remainingAttempts: 0 };
    }

    const result = checkRateLimit(currentUser.id, operationType);
    
    const info = {
      isAllowed: result.allowed,
      remainingAttempts: result.remainingAttempts,
      blockedUntil: result.blockedUntil,
    };

    setLimitInfo(info);
    return info;
  }, [currentUser?.id, operationType]);

  const resetLimit = useCallback(() => {
    if (currentUser?.id) {
      resetRateLimit(currentUser.id, operationType);
      setLimitInfo({
        isAllowed: true,
        remainingAttempts: Infinity,
      });
    }
  }, [currentUser?.id, operationType]);

  return {
    ...limitInfo,
    checkLimit,
    resetLimit,
  };
}

export default useSecureOperation;
