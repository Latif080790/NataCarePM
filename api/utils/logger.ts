/**
 * 📝 LOGGER UTILITY
 * Comprehensive logging system with monitoring integration
 * Provides structured logging for all API operations
 */

import { monitoringService } from '../monitoringService';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

/**
 * Log context interface
 */
export interface LogContext {
  userId?: string;
  projectId?: string;
  component: string;
  action: string;
  metadata?: Record<string, any>;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableMonitoring: boolean;
  enablePerformanceTracking: boolean;
  includeStackTrace: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableMonitoring: true,
  enablePerformanceTracking: true,
  includeStackTrace: true
};

/**
 * Main Logger Class
 */
export class Logger {
  private config: LoggerConfig;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Format log message with context
   */
  private formatMessage(
    level: string,
    context: LogContext,
    message: string,
    data?: any
  ): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    
    return `${emoji} [${timestamp}] [${level}] [${context.component}.${context.action}]${dataStr} ${message}`;
  }
  
  /**
   * Get emoji for log level
   */
  private getEmoji(level: string): string {
    switch (level) {
      case 'DEBUG': return '🐛';
      case 'INFO': return 'ℹ️';
      case 'WARN': return '⚠️';
      case 'ERROR': return '❌';
      case 'CRITICAL': return '🔥';
      case 'SUCCESS': return '✅';
      case 'PERFORMANCE': return '⚡';
      default: return '📝';
    }
  }
  
  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.minLevel;
  }
  
  /**
   * Debug log (development only)
   */
  debug(context: LogContext, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formatted = this.formatMessage('DEBUG', context, message, data);
    
    if (this.config.enableConsole) {
      console.debug(formatted);
    }
  }
  
  /**
   * Info log
   */
  info(context: LogContext, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formatted = this.formatMessage('INFO', context, message, data);
    
    if (this.config.enableConsole) {
      console.log(formatted);
    }
    
    if (this.config.enableMonitoring) {
      monitoringService.logPerformanceMetric({
        metricName: `${context.component}.${context.action}`,
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        context: { message, ...data }
      });
    }
  }
  
  /**
   * Warning log
   */
  warn(context: LogContext, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formatted = this.formatMessage('WARN', context, message, data);
    
    if (this.config.enableConsole) {
      console.warn(formatted);
    }
    
    if (this.config.enableMonitoring) {
      monitoringService.logError({
        message: `${context.component}.${context.action}: ${message}`,
        severity: 'low',
        component: context.component,
        action: context.action,
        userId: context.userId
      });
    }
  }
  
  /**
   * Error log
   */
  error(context: LogContext, message: string, error?: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formatted = this.formatMessage('ERROR', context, message, data);
    
    if (this.config.enableConsole) {
      console.error(formatted);
      if (error && this.config.includeStackTrace) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    if (this.config.enableMonitoring) {
      monitoringService.logError({
        message: `${context.component}.${context.action}: ${message}`,
        stack: error?.stack,
        severity: 'high',
        component: context.component,
        action: context.action,
        userId: context.userId
      });
    }
  }
  
  /**
   * Critical error log
   */
  critical(context: LogContext, message: string, error?: Error, data?: any): void {
    const formatted = this.formatMessage('CRITICAL', context, message, data);
    
    if (this.config.enableConsole) {
      console.error(formatted);
      if (error && this.config.includeStackTrace) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    if (this.config.enableMonitoring) {
      monitoringService.logError({
        message: `${context.component}.${context.action}: ${message}`,
        stack: error?.stack,
        severity: 'critical',
        component: context.component,
        action: context.action,
        userId: context.userId
      });
    }
  }
  
  /**
   * Success log
   */
  success(context: LogContext, message: string, data?: any): void {
    const formatted = this.formatMessage('SUCCESS', context, message, data);
    
    if (this.config.enableConsole) {
      console.log(formatted);
    }
    
    if (this.config.enableMonitoring) {
      monitoringService.logPerformanceMetric({
        metricName: `${context.component}.${context.action}.success`,
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        context: { message, ...data }
      });
    }
  }
  
  /**
   * Performance tracking
   */
  async performance<T>(
    context: LogContext,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.config.enablePerformanceTracking) {
      return await operation();
    }
    
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDelta = endMemory - startMemory;
      
      const formatted = this.formatMessage(
        'PERFORMANCE',
        context,
        `Completed in ${duration.toFixed(2)}ms`,
        { duration, memoryDelta: (memoryDelta / 1024 / 1024).toFixed(2) + 'MB' }
      );
      
      if (this.config.enableConsole) {
        if (duration > 1000) {
          console.warn(formatted); // Slow operation
        } else {
          console.log(formatted);
        }
      }
      
      if (this.config.enableMonitoring) {
        monitoringService.logPerformanceMetric({
          metricName: `${context.component}.${context.action}.duration`,
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          context: { memoryDelta }
        });
        
        // Log slow operations as warnings
        if (duration > 2000) {
          monitoringService.logError({
            message: `Slow operation detected: ${context.component}.${context.action} took ${duration.toFixed(2)}ms`,
            severity: 'low',
            component: context.component,
            action: context.action
          });
        }
      }
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.error(
        context,
        `Failed after ${duration.toFixed(2)}ms`,
        error instanceof Error ? error : undefined,
        { duration }
      );
      
      throw error;
    }
  }
  
  /**
   * Group related logs
   */
  group(label: string, fn: () => void): void {
    if (this.config.enableConsole) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }
  
  /**
   * Table log (useful for arrays)
   */
  table(data: any[]): void {
    if (this.config.enableConsole) {
      console.table(data);
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create scoped logger for specific component
 * 
 * @example
 * const projectLogger = createScopedLogger('projectService');
 * 
 * projectLogger.info('getProject', 'Fetching project data', { projectId: '123' });
 * projectLogger.error('updateProject', 'Failed to update', error, { projectId: '123' });
 */
export const createScopedLogger = (component: string) => {
  return {
    debug: (action: string, message: string, data?: any) => {
      logger.debug({ component, action }, message, data);
    },
    
    info: (action: string, message: string, data?: any) => {
      logger.info({ component, action }, message, data);
    },
    
    warn: (action: string, message: string, data?: any) => {
      logger.warn({ component, action }, message, data);
    },
    
    error: (action: string, message: string, error?: Error, data?: any) => {
      logger.error({ component, action }, message, error, data);
    },
    
    critical: (action: string, message: string, error?: Error, data?: any) => {
      logger.critical({ component, action }, message, error, data);
    },
    
    success: (action: string, message: string, data?: any) => {
      logger.success({ component, action }, message, data);
    },
    
    performance: async <T>(action: string, operation: () => Promise<T>): Promise<T> => {
      return await logger.performance({ component, action }, operation);
    }
  };
};

/**
 * Utility function to log API call
 * 
 * @example
 * await logApiCall(
 *   'projectService',
 *   'getProject',
 *   async () => {
 *     const doc = await getDoc(docRef);
 *     return doc.data();
 *   },
 *   { projectId: '123' }
 * );
 */
export const logApiCall = async <T>(
  component: string,
  action: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const context: LogContext = { component, action, metadata };
  
  logger.info(context, 'Starting operation', metadata);
  
  try {
    const result = await logger.performance(context, operation);
    logger.success(context, 'Operation completed successfully', metadata);
    return result;
  } catch (error) {
    logger.error(
      context,
      'Operation failed',
      error instanceof Error ? error : undefined,
      metadata
    );
    throw error;
  }
};

/**
 * Structured logging for user activities
 * 
 * @example
 * logUserActivity(
 *   'user123',
 *   'CREATE_PROJECT',
 *   'projectService',
 *   { projectName: 'New Project' }
 * );
 */
export const logUserActivity = (
  userId: string,
  action: string,
  component: string,
  metadata?: Record<string, any>
): void => {
  logger.info(
    { userId, component, action },
    `User activity: ${action}`,
    metadata
  );
  
  // Also log to monitoring service for analytics
  monitoringService.logUserActivity({
    userId,
    userName: metadata?.userName || `User ${userId}`,
    action,
    resource: component,
    resourceId: metadata?.resourceId,
    success: true,
    userAgent: navigator.userAgent
  });
};

/**
 * Log security events
 * 
 * @example
 * logSecurityEvent(
 *   'user123',
 *   'UNAUTHORIZED_ACCESS',
 *   'Attempted to access restricted resource',
 *   { resource: '/admin/settings' }
 * );
 */
export const logSecurityEvent = (
  userId: string | undefined,
  eventType: string,
  message: string,
  metadata?: Record<string, any>
): void => {
  logger.critical(
    {
      userId,
      component: 'Security',
      action: eventType
    },
    message,
    undefined,
    metadata
  );
};

/**
 * Log business metrics
 * 
 * @example
 * logMetric('project_created', 1, 'count', { projectType: 'construction' });
 * logMetric('task_duration', 125, 'minutes', { taskId: 'task123' });
 */
export const logMetric = (
  metricName: string,
  value: number,
  unit: string,
  context?: Record<string, any>
): void => {
  monitoringService.logPerformanceMetric({
    metricName,
    value,
    unit,
    timestamp: new Date(),
    context
  });
  
  logger.info(
    { component: 'Metrics', action: metricName },
    `Metric recorded: ${metricName} = ${value} ${unit}`,
    context
  );
};

/**
 * Configure logger for production environment
 */
export const configureProductionLogger = (): void => {
  logger.configure({
    minLevel: LogLevel.INFO, // Hide debug logs
    enableConsole: false, // Disable console in production
    enableMonitoring: true,
    enablePerformanceTracking: true,
    includeStackTrace: true
  });
};

/**
 * Configure logger for development environment
 */
export const configureDevelopmentLogger = (): void => {
  logger.configure({
    minLevel: LogLevel.DEBUG, // Show all logs
    enableConsole: true,
    enableMonitoring: true,
    enablePerformanceTracking: true,
    includeStackTrace: true
  });
};

/**
 * Log batch operations
 */
export const logBatchOperation = <T>(
  component: string,
  action: string,
  items: T[],
  operation: (item: T) => Promise<void>
): Promise<{
  successful: T[];
  failed: { item: T; error: Error }[];
}> => {
  return logger.performance(
    { component, action },
    async () => {
      const successful: T[] = [];
      const failed: { item: T; error: Error }[] = [];
      
      logger.info(
        { component, action },
        `Starting batch operation with ${items.length} items`
      );
      
      for (const item of items) {
        try {
          await operation(item);
          successful.push(item);
        } catch (error) {
          failed.push({
            item,
            error: error instanceof Error ? error : new Error(String(error))
          });
        }
      }
      
      logger.info(
        { component, action },
        `Batch operation completed`,
        {
          total: items.length,
          successful: successful.length,
          failed: failed.length
        }
      );
      
      return { successful, failed };
    }
  );
};
