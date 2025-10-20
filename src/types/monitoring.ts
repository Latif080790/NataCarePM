/**
 * 📊 MONITORING TYPES - COMPREHENSIVE TYPE DEFINITIONS
 * Complete TypeScript interfaces for enterprise monitoring system
 */

// ============================================
// CORE MONITORING TYPES
// ============================================

export interface MonitoringConfig {
    metricsInterval: number;        // Milliseconds between metric collections
    retryAttempts: number;          // Number of retry attempts for failed operations
    retryDelay: number;            // Base delay for retry mechanism (ms)
    maxErrorRate: number;          // Maximum acceptable errors per minute
    enableBatteryTracking: boolean; // Track device battery level
    enableNetworkTracking: boolean; // Track network connection status
    enablePerformanceTracking: boolean; // Track performance metrics
    enableUserTracking: boolean;    // Track user activities
    enableErrorTracking: boolean;   // Track application errors
    dataRetentionDays: number;      // Days to retain monitoring data
    alertThresholds: AlertThresholds;
}

export interface AlertThresholds {
    cpu: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    responseTime: { warning: number; critical: number };
    errorRate: { warning: number; critical: number };
    batteryLevel: { warning: number; critical: number };
}

export interface SystemMetrics {
    timestamp: Date;
    cpu: number;                    // 0-100 percentage
    memory: number;                 // MB
    activeUsers: number;            // Count of active users
    responseTime: number;           // Average response time in ms
    errorRate: number;              // Errors per minute
    networkStatus: 'online' | 'offline' | 'slow';
    batteryLevel?: number;          // 0-100 percentage (if available)
    connectionType?: string;        // Connection type (4g, wifi, etc.)
    serverTimestamp?: any;          // Firebase server timestamp
}

export interface DeviceInfo {
    platform: string;              // Operating system
    browser: string;               // Browser name
    version: string;               // Browser version
    isMobile: boolean;             // Mobile device flag
    screenResolution?: string;      // Screen resolution
    timezone?: string;             // User timezone
    language?: string;             // Browser language
}

export interface UserActivity {
    userId: string;
    userName: string;
    action: string;                // Action performed
    resource: string;              // Resource accessed
    resourceId?: string;           // Specific resource ID
    timestamp: Date;
    duration?: number;             // Action duration in ms
    success: boolean;              // Action success status
    ipAddress?: string;            // User IP address
    userAgent?: string;            // Browser user agent
    sessionId?: string;            // Session identifier
    deviceInfo?: DeviceInfo;       // Device information
    metadata?: Record<string, any>; // Additional metadata
    serverTimestamp?: any;          // Firebase server timestamp
}

export interface PerformanceMetric {
    metricName: string;            // Name of the metric
    value: number;                 // Metric value
    unit: string;                  // Unit of measurement
    timestamp: Date;
    context?: Record<string, any>; // Additional context
    threshold?: {                  // Performance thresholds
        warning: number;
        critical: number;
    };
    tags?: string[];               // Metric tags for categorization
    source?: string;               // Source of the metric
    serverTimestamp?: any;         // Firebase server timestamp
}

export interface ErrorLog {
    errorId: string;
    message: string;               // Error message
    stack?: string;                // Stack trace
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;               // User who encountered the error
    userName?: string;             // User name
    component?: string;            // Component where error occurred
    action?: string;               // Action being performed
    timestamp: Date;
    resolved: boolean;             // Resolution status
    resolvedBy?: string;           // Who resolved the error
    resolvedAt?: Date;             // When error was resolved
    tags?: string[];               // Error tags
    environment: 'development' | 'staging' | 'production';
    userAgent?: string;            // Browser user agent
    url?: string;                  // URL where error occurred
    reproductionSteps?: string[];  // Steps to reproduce
    relatedErrors?: string[];      // Related error IDs
    serverTimestamp?: any;         // Firebase server timestamp
}

export interface ProjectMetrics {
    projectId: string;
    projectName: string;
    tasksTotal: number;
    tasksCompleted: number;
    tasksInProgress: number;
    tasksPending: number;
    tasksOverdue: number;
    progressPercentage: number;    // 0-100
    budgetTotal: number;
    budgetSpent: number;
    budgetRemaining: number;
    budgetUtilization: number;     // 0-100 percentage
    teamSize: number;
    activeMembers: number;
    lastActivity: Date;
    healthScore: number;           // 0-100 project health
    performanceScore: number;      // 0-100 performance score
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    timelineAdherence: number;     // 0-100 percentage
    qualityScore: number;          // 0-100 quality metrics
    clientSatisfaction?: number;   // 0-100 if available
}

// ============================================
// ANALYTICS & REPORTING TYPES
// ============================================

export interface DashboardAnalytics {
    metrics: SystemMetrics[];
    activities: UserActivity[];
    errors: ErrorLog[];
    summary: AnalyticsSummary;
    timeRange: 'hour' | 'day' | 'week' | 'month';
    generatedAt: Date;
    trends: AnalyticsTrends;
}

export interface AnalyticsSummary {
    totalActivities: number;
    totalErrors: number;
    criticalErrors: number;
    averageResponseTime: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    uniqueUsers: number;
    errorRate: number;
    uptime: number;                // Percentage
}

export interface AnalyticsTrends {
    cpuTrend: 'increasing' | 'decreasing' | 'stable';
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    errorTrend: 'increasing' | 'decreasing' | 'stable';
    activityTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
}

export interface ChartDataPoint {
    timestamp: Date;
    value: number;
    label?: string;
    category?: string;
}

export interface TimeSeriesData {
    name: string;
    data: ChartDataPoint[];
    color?: string;
    unit?: string;
}

// ============================================
// SYSTEM HEALTH TYPES
// ============================================

export interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical';
    metrics: SystemMetrics | null;
    issues: HealthIssue[];
    recommendations: string[];
    lastCheck: Date;
    score: number;                 // 0-100 overall health score
    components: ComponentHealth[];
}

export interface HealthIssue {
    id: string;
    type: 'performance' | 'error' | 'resource' | 'network';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    description?: string;
    detectedAt: Date;
    affectedComponents: string[];
    suggestedActions: string[];
}

export interface ComponentHealth {
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    score: number;                 // 0-100
    metrics: Record<string, number>;
    lastCheck: Date;
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    score?: number;                // 0-100 validation score
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
    expectedType?: string;
    constraint?: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
    value?: any;
    suggestion?: string;
}

// ============================================
// ALERT & NOTIFICATION TYPES
// ============================================

export interface Alert {
    id: string;
    type: 'system' | 'performance' | 'error' | 'security';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
    actions?: AlertAction[];
}

export interface AlertAction {
    id: string;
    label: string;
    action: string;
    parameters?: Record<string, any>;
}

export interface NotificationChannel {
    type: 'email' | 'sms' | 'slack' | 'webhook' | 'browser';
    enabled: boolean;
    configuration: Record<string, any>;
    filters: NotificationFilter[];
}

export interface NotificationFilter {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: any;
}

// ============================================
// MONITORING SERVICE TYPES
// ============================================

export interface MonitoringServiceState {
    isRunning: boolean;
    startTime: Date | null;
    config: MonitoringConfig;
    stats: MonitoringStats;
    health: SystemHealth;
    lastError?: Error;
}

export interface MonitoringStats {
    uptime: number;                // Milliseconds
    metricsCollected: number;
    errorsLogged: number;
    activitiesLogged: number;
    queuedOperations: number;
    networkStatus: string;
    collectionRate: number;        // Collections per minute
    errorRate: number;             // Errors per minute
    successRate: number;           // Percentage
}

export interface RetryableOperation {
    id: string;
    operation: () => Promise<void>;
    attempts: number;
    maxAttempts: number;
    lastAttempt: Date;
    nextAttempt: Date;
    context: string;
}

// ============================================
// CHART & VISUALIZATION TYPES
// ============================================

export interface ChartConfig {
    type: 'line' | 'bar' | 'area' | 'pie' | 'gauge';
    data: TimeSeriesData[];
    options: ChartOptions;
    responsive: boolean;
    height?: number;
    width?: number;
}

export interface ChartOptions {
    title?: string;
    subtitle?: string;
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    legend: LegendConfig;
    colors: string[];
    animations: boolean;
    tooltips: boolean;
    zoom: boolean;
    export: boolean;
}

export interface AxisConfig {
    label: string;
    type: 'time' | 'linear' | 'category';
    min?: number;
    max?: number;
    format?: string;
    grid: boolean;
}

export interface LegendConfig {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
    orientation: 'horizontal' | 'vertical';
}

// ============================================
// USER INTERFACE TYPES
// ============================================

export interface MonitoringDashboardProps {
    className?: string;
    compact?: boolean;
    showControls?: boolean;
    timeRange?: 'hour' | 'day' | 'week' | 'month';
    refreshInterval?: number;
    theme?: 'light' | 'dark' | 'auto';
}

export interface MonitoringViewState {
    timeRange: 'hour' | 'day' | 'week' | 'month';
    showAdvanced: boolean;
    selectedMetrics: string[];
    filters: DashboardFilters;
    loading: boolean;
    error: string | null;
    lastUpdate: Date | null;
}

export interface DashboardFilters {
    severity?: ('low' | 'medium' | 'high' | 'critical')[];
    components?: string[];
    users?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    keywords?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface MonitoringApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
    requestId: string;
    metadata?: Record<string, any>;
}

export interface PaginatedResponse<T = any> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// ============================================
// EXPORT TYPES
// ============================================

export interface ExportConfig {
    format: 'json' | 'csv' | 'excel' | 'pdf';
    dateRange: {
        start: Date;
        end: Date;
    };
    includeMetrics: boolean;
    includeErrors: boolean;
    includeActivities: boolean;
    compression: boolean;
    encryption: boolean;
}

export interface ExportResult {
    filename: string;
    size: number;
    downloadUrl: string;
    expiresAt: Date;
    checksum: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export const isSystemMetrics = (obj: any): obj is SystemMetrics => {
    return obj &&
        typeof obj.timestamp === 'object' &&
        typeof obj.cpu === 'number' &&
        typeof obj.memory === 'number' &&
        typeof obj.activeUsers === 'number' &&
        typeof obj.responseTime === 'number' &&
        typeof obj.errorRate === 'number' &&
        typeof obj.networkStatus === 'string';
};

export const isErrorLog = (obj: any): obj is ErrorLog => {
    return obj &&
        typeof obj.errorId === 'string' &&
        typeof obj.message === 'string' &&
        ['low', 'medium', 'high', 'critical'].includes(obj.severity) &&
        typeof obj.timestamp === 'object' &&
        typeof obj.resolved === 'boolean' &&
        ['development', 'staging', 'production'].includes(obj.environment);
};

export const isUserActivity = (obj: any): obj is UserActivity => {
    return obj &&
        typeof obj.userId === 'string' &&
        typeof obj.userName === 'string' &&
        typeof obj.action === 'string' &&
        typeof obj.resource === 'string' &&
        typeof obj.timestamp === 'object' &&
        typeof obj.success === 'boolean';
};

// ============================================
// UTILITY TYPES
// ============================================

export type MonitoringEventType = 'metric' | 'error' | 'activity' | 'alert' | 'health';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export type NetworkStatus = 'online' | 'offline' | 'slow';

export type Environment = 'development' | 'staging' | 'production';

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
    metricsInterval: 60000,
    retryAttempts: 3,
    retryDelay: 1000,
    maxErrorRate: 10,
    enableBatteryTracking: true,
    enableNetworkTracking: true,
    enablePerformanceTracking: true,
    enableUserTracking: true,
    enableErrorTracking: true,
    dataRetentionDays: 30,
    alertThresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 500, critical: 1000 },
        responseTime: { warning: 2000, critical: 5000 },
        errorRate: { warning: 5, critical: 10 },
        batteryLevel: { warning: 20, critical: 10 }
    }
};

export const METRIC_UNITS = {
    PERCENTAGE: '%',
    MEGABYTES: 'MB',
    MILLISECONDS: 'ms',
    COUNT: 'count',
    BYTES: 'bytes',
    SECONDS: 's',
    REQUESTS_PER_MINUTE: 'req/min',
    ERRORS_PER_MINUTE: 'err/min'
} as const;

export const CHART_COLORS = {
    PRIMARY: '#3B82F6',
    SECONDARY: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#6B7280',
    SUCCESS: '#059669'
} as const;