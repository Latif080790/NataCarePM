/**
 * Firebase App Check Configuration
 * Protects Firebase resources from abuse by verifying requests come from your app
 * 
 * Setup Instructions:
 * 1. Enable App Check in Firebase Console
 * 2. Register your app with reCAPTCHA Enterprise or v3
 * 3. Add site key to .env.local as VITE_RECAPTCHA_SITE_KEY
 */

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { app } from './firebaseConfig';
import { logger } from './utils/logger.enhanced';

/**
 * Initialize Firebase App Check
 * Uses reCAPTCHA v3 for web applications
 */
export function initAppCheck() {
  try {
    // Only initialize in production or if explicitly enabled
    const isProduction = import.meta.env.PROD;
    const forceEnable = import.meta.env.VITE_APP_CHECK_ENABLED === 'true';
    
    if (!isProduction && !forceEnable) {
      logger.info('[App Check] Skipped in development mode');
      return undefined;
    }

    // Check if reCAPTCHA site key is configured
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    
    if (!recaptchaSiteKey) {
      logger.warn('[App Check] VITE_RECAPTCHA_SITE_KEY not configured - App Check disabled');
      return undefined;
    }

    // Initialize App Check with reCAPTCHA v3
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      
      // Optional: Set to true during development to use debug tokens
      isTokenAutoRefreshEnabled: true,
    });

    logger.info('[App Check] Initialized successfully with reCAPTCHA v3');
    
    return appCheck;
  } catch (error) {
    logger.error('[App Check] Initialization failed', error instanceof Error ? error : new Error(String(error)));
    // Don't throw - allow app to continue without App Check
    // Firebase will fallback to standard security rules
    return undefined;
  }
}

/**
 * Configure App Check debug token for local development
 * 
 * Usage:
 * 1. Call this function in development mode
 * 2. Copy the debug token from console
 * 3. Add it to Firebase Console → App Check → Apps → Debug tokens
 * 4. Set VITE_APP_CHECK_DEBUG_TOKEN in .env.local
 */
export function enableAppCheckDebugMode() {
  if (import.meta.env.DEV) {
    const debugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
    
    if (debugToken) {
      // @ts-ignore - Firebase App Check debug mode
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      logger.info('[App Check] Debug mode enabled with token');
    } else {
      // @ts-ignore - Firebase App Check debug mode
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      logger.warn('[App Check] Debug mode enabled - check console for debug token');
    }
  }
}

/**
 * Verify App Check token is valid
 * Can be called before sensitive operations
 */
export async function verifyAppCheckToken(): Promise<boolean> {
  try {
    const firebaseAppCheck = await import('firebase/app-check');
    const { app } = await import('./firebaseConfig');
    
    // Try to get the existing App Check instance or create one
    let appCheckInstance;
    try {
      // @ts-ignore - getAppCheck might not be in types
      appCheckInstance = firebaseAppCheck.getAppCheck?.(app) || initAppCheck();
    } catch {
      // If App Check not initialized, skip verification
      return false;
    }
    
    if (!appCheckInstance) {
      return false;
    }
    
    // Try to get a valid App Check token
    const appCheckTokenResponse = await firebaseAppCheck.getToken(appCheckInstance);
    
    return !!appCheckTokenResponse.token;
  } catch (error) {
    logger.error('[App Check] Token verification failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}
