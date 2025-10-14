/**
 * Centralized Logging Utility
 * 
 * Provides conditional logging based on environment
 * - Development: Full logging to console
 * - Production: Error/warn only, can integrate with external services
 */

/// <reference types="vite/client" />

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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
            prefix: '[NataCarePM]'
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
        
        // TODO: In production, send to error tracking service (Sentry, etc.)
        // if (!this.isDevelopment) {
        //     this.sendToErrorTracking(args);
        // }
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
     * Private method for sending errors to tracking service
     * Implement based on your error tracking solution (Sentry, LogRocket, etc.)
     */
    private sendToErrorTracking(error: any[]): void {
        // Implementation for production error tracking
        // Example: Sentry.captureException(error);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };

// Convenience exports
export const { debug, info, warn, error, group, groupEnd, table, time, timeEnd, trace } = logger;
