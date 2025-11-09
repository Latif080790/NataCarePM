/**
 * Sentry Error Tracking Initialization
 *
 * Initialize Sentry for production error tracking
 * Features:
 * - Error tracking with source maps
 * - Performance monitoring
 * - Session replay
 * - User feedback
 * - Breadcrumbs for debugging
 */

/// <reference types="vite/client" />

export const initSentry = async (): Promise<void> => {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      // @ts-ignore - Sentry is optional dependency
      const Sentry = await import('@sentry/react');

      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,

        // Set environment
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'production',

        // Release tracking for source maps
        release: `natacare-pm@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

        // Performance Monitoring
        tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

        // Session Replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Max breadcrumbs to keep
        maxBreadcrumbs: 100,

        // Attach stack trace to all messages
        attachStacktrace: true,

        // Capture unhandled promise rejections
        autoSessionTracking: true,

        // Integrations
        integrations: [
          new Sentry.BrowserTracing({
            // Set sampling rate for performance monitoring
            tracePropagationTargets: [
              'localhost',
              /^https:\/\/.*\.firebaseio\.com/,
              /^https:\/\/.*\.googleapis\.com/,
              /^https:\/\/.*\.netlify\.app/,
            ],
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              // @ts-ignore
              React.useEffect,
              // @ts-ignore
              useLocation,
              // @ts-ignore
              useNavigationType,
              // @ts-ignore
              createRoutesFromChildren,
              // @ts-ignore
              matchRoutes
            ),
          }),
          new Sentry.Replay({
            // Mask all text and input content for privacy
            maskAllText: true,
            blockAllMedia: true,
            // Mask all inputs
            maskAllInputs: true,
          }),
          // Capture console errors
          new Sentry.CaptureConsole({
            levels: ['error', 'assert'],
          }),
        ],

        // Filter out certain errors
        beforeSend(event, hint) {
          // Sanitize sensitive data
          if (event.request?.headers) {
            delete event.request.headers['Authorization'];
            delete event.request.headers['Cookie'];
          }

          // Filter out network errors (handled by app)
          if (event.exception?.values?.[0]?.type === 'NetworkError') {
            return null;
          }

          // Filter out Firebase auth errors (handled by app)
          if (hint.originalException && String(hint.originalException).includes('Firebase')) {
            return null;
          }

          // Filter out expected errors
          if (event.exception?.values?.[0]?.value?.includes('User denied')) {
            return null;
          }

          return event;
        },

        // Sanitize breadcrumbs
        beforeBreadcrumb(breadcrumb) {
          // Remove sensitive data from breadcrumbs
          if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
            if (breadcrumb.data?.url?.includes('apiKey')) {
              breadcrumb.data.url = breadcrumb.data.url.replace(/apiKey=[^&]+/, 'apiKey=[REDACTED]');
            }
          }
          
          // Sanitize console breadcrumbs
          if (breadcrumb.category === 'console') {
            const message = breadcrumb.message || '';
            if (message.includes('apiKey') || message.includes('password')) {
              return null; // Don't capture sensitive console logs
            }
          }

          return breadcrumb;
        },

        // Ignore certain errors
        ignoreErrors: [
          // Browser extensions
          'top.GLOBALS',
          // Random plugins/extensions
          'originalCreateNotification',
          'canvas.contentDocument',
          'MyApp_RemoveAllHighlights',
          // Facebook borked
          'fb_xd_fragment',
          // ISP optimizing proxy
          'bmi_SafeAddOnload',
          'EBCallBackMessageReceived',
          // Conduit toolbar
          'conduitPage',
          // Generic error messages
          'Script error',
          'ResizeObserver loop limit exceeded',
          // React DevTools
          '__REACT_DEVTOOLS_GLOBAL_HOOK__',
          // Network errors (handled separately)
          'Failed to fetch',
          'NetworkError',
          'Network request failed',
          // User cancelled actions
          'User denied',
          'User cancelled',
          // Firebase expected errors
          'auth/popup-closed-by-user',
          'auth/cancelled-popup-request',
        ],

        // Ignore certain URLs
        denyUrls: [
          // Chrome extensions
          /extensions\//i,
          /^chrome:\/\//i,
          /^chrome-extension:\/\//i,
          // Firefox extensions
          /^moz-extension:\/\//i,
          // Edge extensions
          /^ms-browser-extension:\/\//i,
          // Safari extensions
          /^safari-extension:\/\//i,
        ],
      });

      // Set user context when available
      const user = getCurrentUser();
      if (user) {
        Sentry.setUser({
          id: user.uid,
          email: user.email,
          username: user.name,
        });
      }

      // Set custom tags
      Sentry.setTag('app_version', import.meta.env.VITE_APP_VERSION || '1.0.0');
      Sentry.setTag('environment', import.meta.env.MODE);

      console.log('[Sentry] ✅ Error tracking initialized');
      console.log('[Sentry] Environment:', import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE);
      console.log('[Sentry] Sample Rate:', parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'));
    } catch (error) {
      console.warn('[Sentry] ❌ Failed to initialize error tracking:', error);
    }
  } else {
    console.log('[Sentry] Skipped (development mode or DSN not configured)');
  }
};

/**
 * Get current user for Sentry context
 */
function getCurrentUser() {
  try {
    const { getAuth } = require('firebase/auth');
    const auth = getAuth();
    return auth.currentUser;
  } catch {
    return null;
  }
}

/**
 * Add breadcrumb to Sentry
 * Helps debugging by showing user actions before error
 */
export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      // @ts-ignore
      import('@sentry/react').then(({ addBreadcrumb }) => {
        addBreadcrumb({
          message,
          category,
          level: 'info',
          data,
          timestamp: Date.now() / 1000,
        });
      });
    } catch (error) {
      // Silently fail
    }
  }
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      // @ts-ignore
      import('@sentry/react').then(({ captureException, setContext }) => {
        if (context) {
          setContext('additional_context', context);
        }
        captureException(error);
      });
    } catch {
      // Silently fail
    }
  }
  
  // Always log to console
  console.error('[Error]', error, context);
};

/**
 * Capture message manually
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      // @ts-ignore
      import('@sentry/react').then(({ captureMessage }) => {
        captureMessage(message, level);
      });
    } catch {
      // Silently fail
    }
  }
  
  // Always log to console
  const logLevel = level === 'warning' ? 'warn' : level;
  console[logLevel]('[Message]', message);
};

/**
 * ErrorBoundary component for React
 * Catches React errors and sends to Sentry
 */
export const getSentryErrorBoundary = async () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    try {
      // @ts-ignore - Sentry is optional dependency
      const Sentry = await import('@sentry/react');
      return Sentry.ErrorBoundary;
    } catch (error) {
      // Return dummy component if Sentry not available
      return ({ children }: { children: React.ReactNode }) => children;
    }
  }

  // Return dummy component in development
  return ({ children }: { children: React.ReactNode }) => children;
};
