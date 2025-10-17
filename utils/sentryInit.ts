/**
 * Sentry Error Tracking Initialization
 * 
 * Initialize Sentry for production error tracking
 * Only loads in production environment
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
        environment: import.meta.env.MODE || 'production',
        
        // Release tracking
        release: `natacare-pm@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
        
        // Performance Monitoring
        tracesSampleRate: 0.1, // 10% of transactions
        
        // Session Replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        
        // Integrations
        integrations: [
          new Sentry.BrowserTracing({
            // Set sampling rate for performance monitoring
            tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
          }),
          new Sentry.Replay({
            // Mask all text and input content
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        
        // Filter out certain errors
        beforeSend(event, hint) {
          // Filter out network errors
          if (event.exception?.values?.[0]?.type === 'NetworkError') {
            return null;
          }
          
          // Filter out Firebase auth errors (handled by app)
          if (hint.originalException && 
              String(hint.originalException).includes('Firebase')) {
            return null;
          }
          
          return event;
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
          // ISP optimizing proxy - `Cache-Control: no-transform` seems to reduce this. (thanks @acdha)
          'bmi_SafeAddOnload',
          'EBCallBackMessageReceived',
          // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
          'conduitPage',
          // Generic error messages
          'Script error',
          'ResizeObserver loop limit exceeded'
        ],
        
        // Ignore certain URLs
        denyUrls: [
          // Chrome extensions
          /extensions\//i,
          /^chrome:\/\//i,
          /^chrome-extension:\/\//i,
        ],
      });
      
      console.log('[Sentry] Error tracking initialized');
      
    } catch (error) {
      console.warn('[Sentry] Failed to initialize error tracking:', error);
    }
  }
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
