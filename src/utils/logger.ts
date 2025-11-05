/**
 * Factory for creating a logger with a custom prefix (scope).
 * Used for service-level logging context.
 */
export function createScopedLogger(scope: string) {
  const scoped = new Logger();
  scoped.setConfig({ prefix: `[NataCarePM][${scope}]` });
  return scoped;
}
/**
 * Centralized Logging Utility
 *
 * Provides conditional logging based on environment
 * - Development: Full logging to console
 * - Production: Error/warn only, can integrate with external services
 */

/// <reference types="vite/client" />

// type LogLevel = 'debug' | 'info' | 'warn' | 'error'; // Disabled: unused

interface LogConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  prefix?: string;
}

class Logger {
  private config: LogConfig;
  private isDevelopment: boolean;

  constructor() {
    // Use Vite's environment variables
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

    this.config = {
      enableDebug: this.isDevelopment,
      enableInfo: this.isDevelopment,
      enableWarn: true, // Always enable warnings
      enableError: true, // Always enable errors
      prefix: '[NataCarePM]',
    };
  }

  /**
   * Debug level logging - only in development
   */
  debug(...args: any[]): void {
    if (this.config.enableDebug) {
      console.log(`${this.config.prefix} [DEBUG]`, ...args);
    }
  }

  /**
   * Info level logging - only in development
   */
  info(...args: any[]): void {
    if (this.config.enableInfo) {
      console.info(`${this.config.prefix} [INFO]`, ...args);
    }
  }

  /**
   * Success level logging - only in development
   */
  success(...args: any[]): void {
    if (this.config.enableInfo) {
      console.info(`${this.config.prefix} [SUCCESS]`, ...args);
    }
  }

  /**
   * Warning level logging - always enabled
   */
  warn(...args: any[]): void {
    if (this.config.enableWarn) {
      console.warn(`${this.config.prefix} [WARN]`, ...args);
    }
  }

  /**
   * Error level logging - always enabled
   */
  error(...args: any[]): void {
    if (this.config.enableError) {
      console.error(`${this.config.prefix} [ERROR]`, ...args);
    }

    // In production, send to error tracking service
    if (!this.isDevelopment) {
      this.sendToErrorTracking(args);
    }
  }

  /**
   * Group logging for better organization
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(`${this.config.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Table logging for structured data
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Performance timing
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }

  /**
   * Trace logging for debugging call stacks
   */
  trace(...args: any[]): void {
    if (this.isDevelopment) {
      console.trace(`${this.config.prefix} [TRACE]`, ...args);
    }
  }

  /**
   * Update logger configuration
   */
  setConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Capture exception with Sentry
   */
  captureException(error: Error, context?: Record<string, any>): void {
    this.error('Exception captured:', error);

    if (!this.isDevelopment) {
      this.sendToErrorTracking([error], context);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error'): void {
    if (!this.isDevelopment) {
      // In production, send breadcrumb to Sentry
      try {
        // Dynamic import to avoid loading Sentry in development
        // @ts-ignore - Sentry is optional dependency
        import('@sentry/react')
          .then((Sentry: any) => {
            Sentry.addBreadcrumb({
              message,
              category: category || 'default',
              level: level || 'info',
              timestamp: Date.now(),
            });
          })
          .catch(() => {
            // Sentry not available
          });
      } catch (e) {
        // Ignore if Sentry is not installed
      }
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isDevelopment) {
      try {
        // @ts-ignore - Sentry is optional dependency
        import('@sentry/react')
          .then((Sentry: any) => {
            Sentry.setUser({
              id: user.id,
              email: user.email,
              username: user.username,
            });
          })
          .catch(() => {
            // Sentry not available
          });
      } catch (e) {
        // Ignore if Sentry is not installed
      }
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isDevelopment) {
      try {
        // @ts-ignore - Sentry is optional dependency
        import('@sentry/react')
          .then((Sentry: any) => {
            Sentry.setUser(null);
          })
          .catch(() => {
            // Sentry not available
          });
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Private method for sending errors to tracking service
   * Implements Sentry error tracking for production
   */
  private sendToErrorTracking(errorArgs: any[], context?: Record<string, any>): void {
    try {
      // Dynamic import Sentry only in production
      // @ts-ignore - Sentry is optional dependency
      import('@sentry/react')
        .then((Sentry: any) => {
          // Extract the actual Error object if present
          const error = errorArgs.find((arg) => arg instanceof Error);

          if (error) {
            // Capture with context
            Sentry.captureException(error, {
              extra: {
                context,
                args: errorArgs.filter((arg) => !(arg instanceof Error)),
              },
            });
          } else {
            // Capture as message if no Error object
            Sentry.captureMessage(
              errorArgs
                .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
                .join(' '),
              {
                level: 'error',
                extra: context,
              }
            );
          }
        })
        .catch(() => {
          // Sentry not installed or failed to load - fail silently
          console.warn('Sentry error tracking not available');
        });
    } catch (e) {
      // Fail silently if Sentry is not installed
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };

// Convenience exports
export const { debug, info, success, warn, error, group, groupEnd, table, time, timeEnd, trace } = logger;
