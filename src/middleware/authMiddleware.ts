/**
 * Authentication Middleware
 * HTTP request/response interceptors for token management
 */

import { jwtUtils } from '@/utils/jwtUtils';
import { authService } from '@/api/authService';

// ============================================================================
// TYPES
// ============================================================================

export interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface InterceptorContext {
  isRefreshing: boolean;
  failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const interceptorContext: InterceptorContext = {
  isRefreshing: false,
  failedQueue: [],
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Add authentication token to request headers
 */
export async function addAuthHeader(config: RequestConfig): Promise<RequestConfig> {
  try {
    // Check if token needs refresh
    if (jwtUtils.shouldRefreshToken()) {
      await handleTokenRefresh();
    }
    
    // Get current token
    const token = jwtUtils.getStoredToken();
    
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    
    return config;
  } catch (error) {
    console.error('Failed to add auth header:', error);
    return config;
  }
}

/**
 * Handle token refresh
 */
async function handleTokenRefresh(): Promise<void> {
  if (interceptorContext.isRefreshing) {
    // If refresh is already in progress, wait for it
    return new Promise((resolve, reject) => {
      interceptorContext.failedQueue.push({ resolve: () => resolve(), reject });
    });
  }
  
  interceptorContext.isRefreshing = true;
  
  try {
    const newToken = await jwtUtils.refreshToken();
    
    // Process queued requests
    interceptorContext.failedQueue.forEach(({ resolve }) => resolve(newToken));
    interceptorContext.failedQueue = [];
  } catch (error) {
    // Reject all queued requests
    interceptorContext.failedQueue.forEach(({ reject }) => 
      reject(error instanceof Error ? error : new Error('Token refresh failed'))
    );
    interceptorContext.failedQueue = [];
    throw error;
  } finally {
    interceptorContext.isRefreshing = false;
  }
}

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Handle 401 Unauthorized responses
 */
export async function handleUnauthorized(
  _response: Response,
  originalRequest: RequestConfig
): Promise<Response> {
  // Only attempt refresh once
  if ((originalRequest as any)._retry) {
    // Already retried, logout user
    console.log('❌ Token refresh failed, logging out...');
    await authService.logout();
    throw new Error('Session expired. Please login again.');
  }
  
  // Mark as retried
  (originalRequest as any)._retry = true;
  
  try {
    // Refresh token
    await jwtUtils.refreshToken();
    
    // Retry original request with new token
    return retryRequest(originalRequest);
  } catch (error) {
    console.error('Failed to refresh token on 401:', error);
    await authService.logout();
    throw error;
  }
}

/**
 * Retry failed request with new token
 */
async function retryRequest(config: RequestConfig): Promise<Response> {
  // Add new token to headers
  const newConfig = await addAuthHeader(config);
  
  // Retry request
  return fetch(newConfig.url, {
    method: newConfig.method,
    headers: newConfig.headers,
    body: newConfig.body ? JSON.stringify(newConfig.body) : undefined,
  });
}

// ============================================================================
// FETCH WRAPPER
// ============================================================================

/**
 * Enhanced fetch with automatic token management
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Prepare request config
    const config: RequestConfig = {
      url,
      method: options.method || 'GET',
      headers: (options.headers as Record<string, string>) || {},
      body: options.body,
    };
    
    // Add auth header
    const configWithAuth = await addAuthHeader(config);
    
    // Make request
    const response = await fetch(url, {
      ...options,
      headers: configWithAuth.headers,
    });
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      return handleUnauthorized(response, config);
    }
    
    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
}

// ============================================================================
// AXIOS INTERCEPTORS (if using Axios)
// ============================================================================

/**
 * Setup Axios request interceptor
 * Call this if you're using Axios instead of fetch
 */
export function setupAxiosInterceptors(axiosInstance: any): void {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    async (config: any) => {
      try {
        // Check if token needs refresh
        if (jwtUtils.shouldRefreshToken()) {
          await handleTokenRefresh();
        }
        
        // Get token and add to headers
        const token = jwtUtils.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    (error: any) => Promise.reject(error)
  );
  
  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;
      
      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          await jwtUtils.refreshToken();
          
          // Retry with new token
          const token = jwtUtils.getStoredToken();
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          await authService.logout();
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
}

// ============================================================================
// FIRESTORE INTERCEPTOR
// ============================================================================

/**
 * Get headers for Firestore requests
 */
export async function getFirestoreHeaders(): Promise<Record<string, string>> {
  const token = jwtUtils.getStoredToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Validate session before Firestore operation
 */
export async function validateSessionBeforeOperation(): Promise<boolean> {
  try {
    // Check if session is valid
    const isValid = await authService.validateSession();
    
    if (!isValid) {
      console.warn('⚠️ Session invalid, attempting refresh...');
      
      // Try to refresh token
      try {
        await jwtUtils.refreshToken();
        return true;
      } catch (error) {
        console.error('❌ Session validation failed:', error);
        await authService.logout();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const authMiddleware = {
  // Request interceptors
  addAuthHeader,
  authenticatedFetch,
  
  // Response handlers
  handleUnauthorized,
  
  // Setup functions
  setupAxiosInterceptors,
  
  // Firestore helpers
  getFirestoreHeaders,
  validateSessionBeforeOperation,
};
