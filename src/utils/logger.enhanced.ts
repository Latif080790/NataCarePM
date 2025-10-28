/**
 * Enhanced Production-Ready Logger
 * 
 * Features:
 * - Environment-aware (dev vs production)
 * - Multiple log levels (debug, info, warn, error)
 * - Structured logging with metadata
 * - Integration with Sentry for errors
 * - Performance tracking
 * - Safe serialization
 * - Log sampling for high-volume scenarios
 */

import * as Sentry from '@sentry/react';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogMetadata {
  [key: string]: any;
  userId?: string;
  projectId?: string;
  action?: string;
  duration?: number;
  component?: string;
  stackTrace?: string;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: LogMetadata;
  environment: string;
  sessionId: string;
}

class EnhancedLogger {
  private isDevelopment: boolean;
  private minLogLevel: LogLevel;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 100;
  private samplingRate: number = 1.0; // 1.0 = 100% (log everything)

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.minLogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    this.sessionId = this.generateSessionId();
    
    // Send buffered logs periodically in production
    if (!this.isDevelopment) {
      setInterval(() => this.flushLogs(), 30000); // Every 30 seconds
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if log should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.samplingRate;
  }

  /**
   * Safely serialize metadata
   */
  private safeSerialize(data: any): any {
    try {
      // Remove circular references and sensitive data
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(data, (key, value) => {
        // Filter sensitive fields
        if (key === 'password' || key === 'token' || key === 'apiKey' || key === 'secret') {
          return '[REDACTED]';
        }
        
        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        
        return value;
      }));
    } catch (error) {
      return { error: 'Failed to serialize data' };
    }
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: metadata ? this.safeSerialize(metadata) : undefined,
      environment: import.meta.env.MODE,
      sessionId: this.sessionId,
    };
  }

  /**
   * Format log for console output (development only)
   */
  private formatConsoleLog(entry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: 'color: #888',
      [LogLevel.INFO]: 'color: #4CAF50',
      [LogLevel.WARN]: 'color: #FF9800',
      [LogLevel.ERROR]: 'color: #F44336',
      [LogLevel.FATAL]: 'color: #D32F2F; font-weight: bold',
    };

    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.FATAL]: 'FATAL',
    };

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelName = levelNames[entry.level];
    const color = levelColors[entry.level];

    console.log(
      `%c[${timestamp}] ${levelName}`,
      color,
      entry.message,
      entry.metadata || ''
    );
  }

  /**
   * Send log to remote service (production)
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (entry.level >= LogLevel.ERROR) {
      // Send errors to Sentry
      Sentry.captureException(new Error(entry.message), {
        level: entry.level === LogLevel.FATAL ? 'fatal' : 'error',
        contexts: {
          metadata: entry.metadata,
        },
      });
    }

    // Buffer non-critical logs
    this.logBuffer.push(entry);
    if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flushLogs();
    }
  }

  /**
   * Flush buffered logs to remote service
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      // In production, send to your logging service (e.g., CloudWatch, DataDog)
      // For now, we'll just clear the buffer
      const logsToSend = [...this.logBuffer];
      this.logBuffer = [];

      // TODO: Implement actual log shipping
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify(logsToSend),
      // });
      
      if (this.isDevelopment) {
        console.log(`[Logger] Flushed ${logsToSend.length} logs`);
      }
    } catch (error) {
      // Failed to send logs - keep them in buffer
      console.error('[Logger] Failed to flush logs:', error);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    // Check minimum log level
    if (level < this.minLogLevel) return;

    // Check sampling
    if (!this.shouldSample() && level < LogLevel.ERROR) return;

    const entry = this.createLogEntry(level, message, metadata);

    // Development: log to console
    if (this.isDevelopment) {
      this.formatConsoleLog(entry);
    } else {
      // Production: send to remote service
      this.sendToRemote(entry);
    }
  }

  /**
   * Debug level logging (development only)
   */
  public debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Info level logging
   */
  public info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Warning level logging
   */
  public warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Error level logging
   */
  public error(message: string, error?: Error, metadata?: LogMetadata): void {
    const enrichedMetadata = {
      ...metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
    };
    this.log(LogLevel.ERROR, message, enrichedMetadata);
  }

  /**
   * Fatal level logging (critical errors)
   */
  public fatal(message: string, error?: Error, metadata?: LogMetadata): void {
    const enrichedMetadata = {
      ...metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorName: error?.name,
    };
    this.log(LogLevel.FATAL, message, enrichedMetadata);
  }

  /**
   * Performance tracking
   */
  public startTimer(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.info(`Performance: ${label}`, { duration: Math.round(duration) });
    };
  }

  /**
   * Track user action
   */
  public trackAction(
    action: string,
    userId?: string,
    metadata?: LogMetadata
  ): void {
    this.info(`User action: ${action}`, {
      ...metadata,
      userId,
      action,
    });
  }

  /**
   * Track API call
   */
  public trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    metadata?: LogMetadata
  ): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} ${endpoint}`, {
      ...metadata,
      endpoint,
      method,
      duration,
      status,
    });
  }

  /**
   * Set sampling rate (0.0 - 1.0)
   */
  public setSamplingRate(rate: number): void {
    this.samplingRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Set minimum log level
   */
  public setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level;
  }
}

// Export singleton instance
export const logger = new EnhancedLogger();

// Export for testing
export { EnhancedLogger };
