/**
 * Sentry Configuration for Error Tracking and Performance Monitoring
 *
 * Priority 2C: Monitoring & Analytics
 *
 * Features:
 * - Error tracking and reporting
 * - Performance monitoring (Web Vitals)
 * - User feedback collection
 * - Release tracking
 * - Environment-based configuration
 */

import * as Sentry from '@sentry/react';

/**
 * Sentry Configuration Interface
 */
export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enabled: boolean;
}

/**
 * Default Sentry Configuration
 */
const defaultConfig: SentryConfig = {
  // TODO: Replace with actual Sentry DSN from Sentry.io project
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE || 'development',

  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.2 : 1.0, // 20% in production, 100% in dev

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Enable only in production or when explicitly set
  enabled: import.meta.env.MODE === 'production' || import.meta.env.VITE_SENTRY_ENABLED === 'true',
};

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(config: Partial<SentryConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  // Skip initialization if disabled or no DSN provided
  if (!finalConfig.enabled || !finalConfig.dsn) {
    console.log(
      '[Sentry] Initialization skipped:',
      !finalConfig.enabled ? 'Disabled' : 'No DSN provided'
    );
    return;
  }

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,

    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Performance Monitoring
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/natacare-pm\.web\.app/,
          /^https:\/\/natacare-pm\.firebaseapp\.com/,
        ],
      }),
      new Sentry.Replay({
        // Privacy settings
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: finalConfig.tracesSampleRate,

    // Session Replay
    replaysSessionSampleRate: finalConfig.replaysSessionSampleRate,
    replaysOnErrorSampleRate: finalConfig.replaysOnErrorSampleRate,

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'development',

    // Before sending events
    beforeSend(event, hint) {
      // Filter out development errors
      if (finalConfig.environment === 'development') {
        console.log('[Sentry] Event captured:', event);
      }

      // Don't send events for network errors in development
      if (
        finalConfig.environment === 'development' &&
        event.exception?.values?.[0]?.type === 'NetworkError'
      ) {
        return null;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Random plugins/extensions
      "Can't find variable: ZiteReader",
      'jigsaw is not defined',
      'ComboSearch is not defined',

      // Facebook related
      'fb_xd_fragment',

      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
      'Load failed',

      // AbortError from fetch cancellations
      'AbortError',

      // ResizeObserver errors (common and harmless)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  });

  console.log('[Sentry] Initialized successfully:', {
    environment: finalConfig.environment,
    tracesSampleRate: finalConfig.tracesSampleRate,
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  category: string,
  message: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureSentryException(error: Error, context?: Record<string, any>): string {
  return Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Capture message manually
 */
export function captureSentryMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string {
  return Sentry.captureMessage(message, {
    level,
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Start a new transaction for performance monitoring
 */
export function startSentryTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({ name, op });
}

/**
 * Show user feedback dialog
 */
export function showSentryFeedbackDialog(eventId?: string): void {
  const id = eventId || Sentry.lastEventId();

  if (id) {
    Sentry.showReportDialog({
      eventId: id,
      title: "It looks like we're having issues.",
      subtitle: 'Our team has been notified.',
      subtitle2: "If you'd like to help, tell us what happened below.",
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit',
      errorGeneric: 'An error occurred while submitting your report. Please try again.',
      errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
      successMessage: 'Your feedback has been sent. Thank you!',
    });
  }
}

export default {
  initialize: initializeSentry,
  setUser: setSentryUser,
  clearUser: clearSentryUser,
  addBreadcrumb: addSentryBreadcrumb,
  captureException: captureSentryException,
  captureMessage: captureSentryMessage,
  startTransaction: startSentryTransaction,
  showFeedbackDialog: showSentryFeedbackDialog,
};
