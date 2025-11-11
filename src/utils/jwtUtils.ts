/**
 * JWT Token Utilities
 * Handles JWT token validation, refresh, and expiry management
 */

import { auth } from '@/firebaseConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenInfo {
  token: string;
  expiresAt: number;
  isExpired: boolean;
  timeUntilExpiry: number; // milliseconds
}

export interface TokenRefreshConfig {
  refreshThreshold: number; // milliseconds before expiry to trigger refresh
  maxRetries: number;
  retryDelay: number; // milliseconds
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_REFRESH_CONFIG: TokenRefreshConfig = {
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

const TOKEN_STORAGE_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
const REFRESH_TOKEN_KEY = 'refresh_token';

// ============================================================================
// TOKEN STORAGE
// ============================================================================

/**
 * Store token in localStorage with expiry
 */
export function storeToken(token: string, expiresIn: number): void {
  const expiryTime = Date.now() + (expiresIn * 1000);
  
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Failed to store token:', error);
  }
}

/**
 * Get stored token
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get stored token:', error);
    return null;
  }
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(): number | null {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    console.error('Failed to get token expiry:', error);
    return null;
  }
}

/**
 * Clear stored token
 */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear stored token:', error);
  }
}

/**
 * Store refresh token
 */
export function storeRefreshToken(refreshToken: string): void {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
  }
}

/**
 * Get stored refresh token
 */
export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Check if token is expired
 */
export function isTokenExpired(expiryTime?: number): boolean {
  const expiry = expiryTime || getTokenExpiry();
  if (!expiry) return true;
  
  return Date.now() >= expiry;
}

/**
 * Check if token needs refresh (close to expiry)
 */
export function shouldRefreshToken(
  config: TokenRefreshConfig = DEFAULT_REFRESH_CONFIG
): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return false;
  
  const timeUntilExpiry = expiry - Date.now();
  return timeUntilExpiry <= config.refreshThreshold && timeUntilExpiry > 0;
}

/**
 * Get token information
 */
export function getTokenInfo(): TokenInfo | null {
  const token = getStoredToken();
  const expiresAt = getTokenExpiry();
  
  if (!token || !expiresAt) return null;
  
  const now = Date.now();
  const isExpired = now >= expiresAt;
  const timeUntilExpiry = Math.max(0, expiresAt - now);
  
  return {
    token,
    expiresAt,
    isExpired,
    timeUntilExpiry,
  };
}

/**
 * Validate token format (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Each part should be base64 encoded
  try {
    parts.forEach(part => {
      if (!part) throw new Error('Empty token part');
      // Basic base64 validation
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

let refreshPromise: Promise<string> | null = null;

/**
 * Refresh access token
 * Implements singleton pattern to prevent multiple simultaneous refreshes
 */
export async function refreshToken(
  config: TokenRefreshConfig = DEFAULT_REFRESH_CONFIG
): Promise<string> {
  // If refresh is already in progress, return the same promise
  if (refreshPromise) {
    return refreshPromise;
  }
  
  refreshPromise = performTokenRefresh(config);
  
  try {
    const newToken = await refreshPromise;
    return newToken;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Perform actual token refresh with retry logic
 */
async function performTokenRefresh(
  config: TokenRefreshConfig,
  retryCount = 0
): Promise<string> {
  try {
    // Get new token from Firebase directly
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const newToken = await user.getIdToken(true); // Force refresh
    
    // Store new token with default expiry (1 hour)
    storeToken(newToken, 3600);
    
    console.log('✅ Token refreshed successfully');
    return newToken;
  } catch (error: any) {
    console.error(`Token refresh failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < config.maxRetries) {
      console.log(`Retrying token refresh in ${config.retryDelay}ms...`);
      await delay(config.retryDelay);
      return performTokenRefresh(config, retryCount + 1);
    }
    
    // Max retries reached, clear tokens and throw
    console.error('❌ Token refresh failed after max retries');
    clearStoredToken();
    throw new Error('Token refresh failed. Please login again.');
  }
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// AUTO REFRESH
// ============================================================================

let refreshInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic token refresh
 */
export function startAutoRefresh(
  config: TokenRefreshConfig = DEFAULT_REFRESH_CONFIG
): void {
  // Clear existing interval
  stopAutoRefresh();
  
  // Check every minute
  refreshInterval = setInterval(async () => {
    try {
      if (shouldRefreshToken(config)) {
        console.log('🔄 Auto-refreshing token...');
        await refreshToken(config);
      }
    } catch (error) {
      console.error('Auto-refresh error:', error);
      // Stop auto-refresh on error
      stopAutoRefresh();
    }
  }, 60 * 1000); // Check every minute
  
  console.log('✅ Auto-refresh started');
}

/**
 * Stop automatic token refresh
 */
export function stopAutoRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('⏹️ Auto-refresh stopped');
  }
}

// ============================================================================
// TOKEN DECODER
// ============================================================================

/**
 * Decode JWT token payload (without verification)
 * Note: This does NOT validate the token signature!
 */
export function decodeToken(token: string): any | null {
  try {
    if (!isValidTokenFormat(token)) return null;
    
    const parts = token.split('.');
    const payload = parts[1];
    
    // Decode base64
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Get token expiry from JWT payload
 */
export function getTokenExpiryFromPayload(token: string): number | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;
  
  // JWT exp is in seconds, convert to milliseconds
  return payload.exp * 1000;
}

/**
 * Get user ID from token
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeToken(token);
  if (!payload) return null;
  
  // Firebase tokens use 'user_id' or 'sub'
  return payload.user_id || payload.sub || null;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize JWT utilities
 * Should be called on app startup
 */
export function initializeJWT(): void {
  console.log('🔐 Initializing JWT utilities...');
  
  // Check if we have a valid stored token
  const tokenInfo = getTokenInfo();
  
  if (tokenInfo) {
    if (tokenInfo.isExpired) {
      console.log('⚠️ Stored token is expired, clearing...');
      clearStoredToken();
    } else {
      console.log(`✅ Valid token found, expires in ${Math.round(tokenInfo.timeUntilExpiry / 1000)}s`);
      
      // Start auto-refresh
      startAutoRefresh();
    }
  } else {
    console.log('ℹ️ No stored token found');
  }
}

/**
 * Cleanup JWT utilities
 * Should be called on logout
 */
export function cleanupJWT(): void {
  console.log('🧹 Cleaning up JWT utilities...');
  stopAutoRefresh();
  clearStoredToken();
}

// ============================================================================
// EXPORTS
// ============================================================================

export const jwtUtils = {
  // Storage
  storeToken,
  getStoredToken,
  getTokenExpiry,
  clearStoredToken,
  storeRefreshToken,
  getStoredRefreshToken,
  
  // Validation
  isTokenExpired,
  shouldRefreshToken,
  getTokenInfo,
  isValidTokenFormat,
  
  // Refresh
  refreshToken,
  startAutoRefresh,
  stopAutoRefresh,
  
  // Decoder
  decodeToken,
  getTokenExpiryFromPayload,
  getUserIdFromToken,
  
  // Lifecycle
  initializeJWT,
  cleanupJWT,
};
