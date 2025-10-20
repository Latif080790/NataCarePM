/**
 * 🛡️ COMPREHENSIVE DATA VALIDATION SYSTEM
 * Enterprise-grade validation middleware with sanitization and security
 */

import { SystemMetrics, UserActivity, ErrorLog, PerformanceMetric } from '../../types/monitoring';

// ============================================
// VALIDATION RESULT INTERFACES
// ============================================

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedData?: any;
}

export interface SanitizationOptions {
    stripHtml: boolean;
    trimWhitespace: boolean;
    removeSpecialChars: boolean;
    maxLength?: number;
    allowedChars?: RegExp;
}

// ============================================
// SECURITY VALIDATION PATTERNS
// ============================================

export const SECURITY_PATTERNS = {
    SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    XSS_BASIC: /<script[^>]*>.*?<\/script>/gi,
    XSS_ADVANCED: /javascript:|vbscript:|onload|onerror|onclick|onmouseover/i,
    PATH_TRAVERSAL: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=[\]{}|;:'"<>\/\\]*$/,
    NUMERIC: /^-?\d+(\.\d+)?$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

// ============================================
// DATA SANITIZATION UTILITIES
// ============================================

class DataSanitizer {
    /**
     * Sanitize string input with configurable options
     */
    static sanitizeString(input: string, options: Partial<SanitizationOptions> = {}): string {
        const defaultOptions: SanitizationOptions = {
            stripHtml: true,
            trimWhitespace: true,
            removeSpecialChars: false,
            maxLength: 1000,
            allowedChars: SECURITY_PATTERNS.SAFE_STRING
        };

        const opts = { ...defaultOptions, ...options };
        let sanitized = input;

        // Trim whitespace
        if (opts.trimWhitespace) {
            sanitized = sanitized.trim();
        }

        // Strip HTML tags
        if (opts.stripHtml) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }

        // Remove special characters
        if (opts.removeSpecialChars && opts.allowedChars) {
            sanitized = sanitized.replace(new RegExp(`[^${opts.allowedChars.source.slice(1, -1)}]`, 'g'), '');
        }

        // Limit length
        if (opts.maxLength && sanitized.length > opts.maxLength) {
            sanitized = sanitized.substring(0, opts.maxLength);
        }

        return sanitized;
    }

    /**
     * Sanitize numeric input
     */
    static sanitizeNumber(input: any): number | null {
        if (typeof input === 'number' && !isNaN(input) && isFinite(input)) {
            return input;
        }

        if (typeof input === 'string' && SECURITY_PATTERNS.NUMERIC.test(input)) {
            const parsed = parseFloat(input);
            return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
        }

        return null;
    }

    /**
     * Sanitize array input
     */
    static sanitizeArray<T>(input: any[], validator: (item: any) => T | null): T[] {
        if (!Array.isArray(input)) {
            return [];
        }

        return input
            .map(validator)
            .filter((item): item is T => item !== null)
            .slice(0, 100); // Limit array size
    }

    /**
     * Sanitize object recursively
     */
    static sanitizeObject(obj: any, maxDepth: number = 5): any {
        if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
        }

        const sanitized: any = {};
        const keys = Object.keys(obj).slice(0, 50); // Limit object properties

        for (const key of keys) {
            const sanitizedKey = this.sanitizeString(key, { maxLength: 100 });
            if (sanitizedKey) {
                sanitized[sanitizedKey] = this.sanitizeObject(obj[key], maxDepth - 1);
            }
        }

        return sanitized;
    }
}

// ============================================
// SECURITY VALIDATORS
// ============================================

class SecurityValidator {
    /**
     * Check for SQL injection patterns
     */
    static detectSQLInjection(input: string): boolean {
        return SECURITY_PATTERNS.SQL_INJECTION.test(input);
    }

    /**
     * Check for XSS patterns
     */
    static detectXSS(input: string): boolean {
        return SECURITY_PATTERNS.XSS_BASIC.test(input) || SECURITY_PATTERNS.XSS_ADVANCED.test(input);
    }

    /**
     * Check for path traversal patterns
     */
    static detectPathTraversal(input: string): boolean {
        return SECURITY_PATTERNS.PATH_TRAVERSAL.test(input);
    }

    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        return SECURITY_PATTERNS.EMAIL.test(email);
    }

    /**
     * Validate IP address format
     */
    static isValidIP(ip: string): boolean {
        return SECURITY_PATTERNS.IP_ADDRESS.test(ip);
    }

    /**
     * Validate URL format
     */
    static isValidURL(url: string): boolean {
        return SECURITY_PATTERNS.URL.test(url);
    }

    /**
     * Comprehensive security check
     */
    static performSecurityCheck(input: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (this.detectSQLInjection(input)) {
            errors.push('Potential SQL injection detected');
        }

        if (this.detectXSS(input)) {
            errors.push('Potential XSS payload detected');
        }

        if (this.detectPathTraversal(input)) {
            errors.push('Potential path traversal attack detected');
        }

        if (input.length > 10000) {
            warnings.push('Input exceeds recommended length');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sanitizedData: DataSanitizer.sanitizeString(input)
        };
    }
}

// ============================================
// MONITORING DATA VALIDATORS
// ============================================

class MonitoringDataValidator {
    /**
     * Validate and sanitize SystemMetrics
     */
    static validateSystemMetrics(metrics: Partial<SystemMetrics>): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const sanitized: Partial<SystemMetrics> = {};

        // Validate timestamp
        if (!metrics.timestamp || !(metrics.timestamp instanceof Date)) {
            errors.push('Valid timestamp is required');
        } else {
            sanitized.timestamp = metrics.timestamp;
        }

        // Validate CPU usage
        const cpu = DataSanitizer.sanitizeNumber(metrics.cpu);
        if (cpu === null) {
            errors.push('CPU usage must be a valid number');
        } else if (cpu < 0 || cpu > 100) {
            errors.push('CPU usage must be between 0 and 100');
        } else {
            sanitized.cpu = cpu;
        }

        // Validate memory usage
        const memory = DataSanitizer.sanitizeNumber(metrics.memory);
        if (memory === null) {
            errors.push('Memory usage must be a valid number');
        } else if (memory < 0) {
            errors.push('Memory usage cannot be negative');
        } else {
            sanitized.memory = memory;
            if (memory > 8192) { // 8GB
                warnings.push('High memory usage detected');
            }
        }

        // Validate active users
        const activeUsers = DataSanitizer.sanitizeNumber(metrics.activeUsers);
        if (activeUsers === null) {
            errors.push('Active users must be a valid number');
        } else if (activeUsers < 0) {
            errors.push('Active users cannot be negative');
        } else if (activeUsers > 10000) {
            warnings.push('Very high user count detected');
        } else {
            sanitized.activeUsers = activeUsers;
        }

        // Validate response time
        const responseTime = DataSanitizer.sanitizeNumber(metrics.responseTime);
        if (responseTime === null) {
            errors.push('Response time must be a valid number');
        } else if (responseTime < 0) {
            errors.push('Response time cannot be negative');
        } else {
            sanitized.responseTime = responseTime;
            if (responseTime > 5000) {
                warnings.push('High response time detected');
            }
        }

        // Validate error rate
        const errorRate = DataSanitizer.sanitizeNumber(metrics.errorRate);
        if (errorRate === null) {
            errors.push('Error rate must be a valid number');
        } else if (errorRate < 0) {
            errors.push('Error rate cannot be negative');
        } else {
            sanitized.errorRate = errorRate;
            if (errorRate > 0.1) {
                warnings.push('High error rate detected');
            }
        }

        // Validate network status
        if (metrics.networkStatus) {
            const validStatuses = ['online', 'offline', 'slow'];
            if (!validStatuses.includes(metrics.networkStatus)) {
                errors.push('Network status must be one of: online, offline, slow');
            } else {
                sanitized.networkStatus = metrics.networkStatus;
            }
        }

        // Validate battery level
        if (metrics.batteryLevel !== undefined) {
            const batteryLevel = DataSanitizer.sanitizeNumber(metrics.batteryLevel);
            if (batteryLevel === null) {
                warnings.push('Invalid battery level format');
            } else if (batteryLevel < 0 || batteryLevel > 100) {
                warnings.push('Battery level should be between 0 and 100');
            } else {
                sanitized.batteryLevel = batteryLevel;
            }
        }

        // Validate connection type
        if (metrics.connectionType) {
            const connectionType = DataSanitizer.sanitizeString(metrics.connectionType, { maxLength: 50 });
            if (connectionType) {
                sanitized.connectionType = connectionType;
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sanitizedData: sanitized
        };
    }

    /**
     * Validate and sanitize UserActivity
     */
    static validateUserActivity(activity: Partial<UserActivity>): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const sanitized: Partial<UserActivity> = {};

        // Validate user ID
        if (!activity.userId || typeof activity.userId !== 'string') {
            errors.push('Valid user ID is required');
        } else {
            const securityCheck = SecurityValidator.performSecurityCheck(activity.userId);
            if (!securityCheck.isValid) {
                errors.push(...securityCheck.errors);
            } else {
                sanitized.userId = DataSanitizer.sanitizeString(activity.userId, { maxLength: 100 });
            }
        }

        // Validate user name
        if (!activity.userName || typeof activity.userName !== 'string') {
            errors.push('Valid user name is required');
        } else {
            sanitized.userName = DataSanitizer.sanitizeString(activity.userName, { maxLength: 200 });
        }

        // Validate action
        if (!activity.action || typeof activity.action !== 'string') {
            errors.push('Valid action is required');
        } else {
            sanitized.action = DataSanitizer.sanitizeString(activity.action, { maxLength: 100 });
        }

        // Validate resource
        if (!activity.resource || typeof activity.resource !== 'string') {
            errors.push('Valid resource is required');
        } else {
            const securityCheck = SecurityValidator.performSecurityCheck(activity.resource);
            if (!securityCheck.isValid) {
                errors.push(`Resource: ${securityCheck.errors.join(', ')}`);
            } else {
                sanitized.resource = DataSanitizer.sanitizeString(activity.resource, { maxLength: 500 });
            }
        }

        // Validate timestamp
        if (!activity.timestamp || !(activity.timestamp instanceof Date)) {
            errors.push('Valid timestamp is required');
        } else {
            sanitized.timestamp = activity.timestamp;
        }

        // Validate success flag
        if (typeof activity.success !== 'boolean') {
            errors.push('Success flag must be a boolean');
        } else {
            sanitized.success = activity.success;
        }

        // Validate optional IP address
        if (activity.ipAddress) {
            if (!SecurityValidator.isValidIP(activity.ipAddress)) {
                errors.push('Invalid IP address format');
            } else {
                sanitized.ipAddress = activity.ipAddress;
            }
        }

        // Validate optional session ID
        if (activity.sessionId) {
            const securityCheck = SecurityValidator.performSecurityCheck(activity.sessionId);
            if (!securityCheck.isValid) {
                warnings.push(`Session ID: ${securityCheck.errors.join(', ')}`);
            } else {
                sanitized.sessionId = DataSanitizer.sanitizeString(activity.sessionId, { maxLength: 100 });
            }
        }

        // Validate optional metadata
        if (activity.metadata) {
            sanitized.metadata = DataSanitizer.sanitizeObject(activity.metadata, 3);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sanitizedData: sanitized
        };
    }

    /**
     * Validate and sanitize ErrorLog
     */
    static validateErrorLog(error: Partial<ErrorLog>): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const sanitized: Partial<ErrorLog> = {};

        // Validate error ID
        if (!error.errorId || typeof error.errorId !== 'string') {
            errors.push('Valid error ID is required');
        } else {
            sanitized.errorId = DataSanitizer.sanitizeString(error.errorId, { maxLength: 100 });
        }

        // Validate message
        if (!error.message || typeof error.message !== 'string') {
            errors.push('Valid error message is required');
        } else {
            const securityCheck = SecurityValidator.performSecurityCheck(error.message);
            if (!securityCheck.isValid) {
                warnings.push(`Message: ${securityCheck.errors.join(', ')}`);
            }
            sanitized.message = DataSanitizer.sanitizeString(error.message, { maxLength: 2000 });
        }

        // Validate severity
        if (!error.severity) {
            errors.push('Severity is required');
        } else {
            const validSeverities = ['low', 'medium', 'high', 'critical'];
            if (!validSeverities.includes(error.severity)) {
                errors.push('Severity must be one of: low, medium, high, critical');
            } else {
                sanitized.severity = error.severity;
            }
        }

        // Validate timestamp
        if (!error.timestamp || !(error.timestamp instanceof Date)) {
            errors.push('Valid timestamp is required');
        } else {
            sanitized.timestamp = error.timestamp;
        }

        // Validate environment
        if (!error.environment) {
            errors.push('Environment is required');
        } else {
            const validEnvironments = ['development', 'staging', 'production'];
            if (!validEnvironments.includes(error.environment)) {
                errors.push('Environment must be one of: development, staging, production');
            } else {
                sanitized.environment = error.environment;
            }
        }

        // Validate resolved flag
        if (typeof error.resolved !== 'boolean') {
            errors.push('Resolved flag must be a boolean');
        } else {
            sanitized.resolved = error.resolved;
        }

        // Validate optional stack trace
        if (error.stack) {
            const securityCheck = SecurityValidator.performSecurityCheck(error.stack);
            if (!securityCheck.isValid) {
                warnings.push(`Stack trace: ${securityCheck.errors.join(', ')}`);
            }
            sanitized.stack = DataSanitizer.sanitizeString(error.stack, { maxLength: 5000 });
        }

        // Validate optional component
        if (error.component) {
            sanitized.component = DataSanitizer.sanitizeString(error.component, { maxLength: 200 });
        }

        // Validate optional user ID
        if (error.userId) {
            const securityCheck = SecurityValidator.performSecurityCheck(error.userId);
            if (!securityCheck.isValid) {
                warnings.push(`User ID: ${securityCheck.errors.join(', ')}`);
            } else {
                sanitized.userId = DataSanitizer.sanitizeString(error.userId, { maxLength: 100 });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sanitizedData: sanitized
        };
    }

    /**
     * Validate and sanitize PerformanceMetric
     */
    static validatePerformanceMetric(metric: Partial<PerformanceMetric>): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const sanitized: Partial<PerformanceMetric> = {};

        // Validate metric name
        if (!metric.metricName || typeof metric.metricName !== 'string') {
            errors.push('Valid metric name is required');
        } else {
            sanitized.metricName = DataSanitizer.sanitizeString(metric.metricName, { maxLength: 100 });
        }

        // Validate value
        const value = DataSanitizer.sanitizeNumber(metric.value);
        if (value === null) {
            errors.push('Metric value must be a valid number');
        } else {
            sanitized.value = value;
        }

        // Validate unit
        if (!metric.unit || typeof metric.unit !== 'string') {
            errors.push('Valid unit is required');
        } else {
            sanitized.unit = DataSanitizer.sanitizeString(metric.unit, { maxLength: 50 });
        }

        // Validate timestamp
        if (!metric.timestamp || !(metric.timestamp instanceof Date)) {
            errors.push('Valid timestamp is required');
        } else {
            sanitized.timestamp = metric.timestamp;
        }

        // Validate optional context
        if (metric.context) {
            sanitized.context = DataSanitizer.sanitizeObject(metric.context, 3);
        }

        // Validate optional tags
        if (metric.tags) {
            sanitized.tags = DataSanitizer.sanitizeArray(metric.tags, (tag) => {
                if (typeof tag === 'string') {
                    return DataSanitizer.sanitizeString(tag, { maxLength: 50 });
                }
                return null;
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            sanitizedData: sanitized
        };
    }
}

// ============================================
// FIREBASE ERROR HANDLER
// ============================================

class FirebaseErrorHandler {
    /**
     * Handle Firebase errors with retry logic
     */
    static async handleFirebaseError(error: any, operation: string): Promise<never> {
        let errorMessage = 'Unknown Firebase error';
        let shouldRetry = false;

        if (error?.code) {
            switch (error.code) {
                case 'permission-denied':
                    errorMessage = 'Permission denied - insufficient privileges';
                    break;
                case 'unavailable':
                    errorMessage = 'Service temporarily unavailable';
                    shouldRetry = true;
                    break;
                case 'deadline-exceeded':
                    errorMessage = 'Request timeout';
                    shouldRetry = true;
                    break;
                case 'resource-exhausted':
                    errorMessage = 'Resource limit exceeded';
                    break;
                case 'failed-precondition':
                    errorMessage = 'Failed precondition';
                    break;
                case 'aborted':
                    errorMessage = 'Operation aborted';
                    shouldRetry = true;
                    break;
                case 'out-of-range':
                    errorMessage = 'Operation out of range';
                    break;
                case 'unimplemented':
                    errorMessage = 'Operation not implemented';
                    break;
                case 'internal':
                    errorMessage = 'Internal server error';
                    shouldRetry = true;
                    break;
                case 'data-loss':
                    errorMessage = 'Data loss detected';
                    break;
                default:
                    errorMessage = `Firebase error: ${error.code}`;
            }
        }

        // Log the error with context
        console.error(`Firebase Error in ${operation}:`, {
            code: error?.code,
            message: errorMessage,
            originalError: error?.message,
            shouldRetry,
            timestamp: new Date().toISOString()
        });

        throw new Error(`${operation} failed: ${errorMessage}${shouldRetry ? ' (retryable)' : ''}`);
    }

    /**
     * Check if error is retryable
     */
    static isRetryableError(error: any): boolean {
        const retryableCodes = [
            'unavailable',
            'deadline-exceeded',
            'aborted',
            'internal'
        ];

        return error?.code && retryableCodes.includes(error.code);
    }
}

// Export all validators and utilities
export {
    DataSanitizer,
    SecurityValidator,
    MonitoringDataValidator,
    FirebaseErrorHandler
};