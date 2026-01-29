/**
 * 📊 FIREBASE MONITORING MODULE - ENTERPRISE GRADE
 * Real-time monitoring system for NataCarePM
 * Features: Performance tracking, Error logging, User analytics, System health
 * Robustness: Retry mechanisms, Connection resilience, Data validation
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { logger } from '@/utils/logger.enhanced';

// ============================================
// ENHANCED TYPES & INTERFACES
// ============================================

export interface SystemMetrics {
  timestamp: Date;
  cpu: number; // 0-100 percentage
  memory: number; // MB
  activeUsers: number; // Count
  responseTime: number; // Milliseconds
  errorRate: number; // Errors per minute
  networkStatus: 'online' | 'offline' | 'slow';
  batteryLevel?: number; // 0-100 percentage (if available)
  connectionType?: string; // '4g', 'wifi', etc.
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MonitoringConfig {
  metricsInterval: number; // Milliseconds
  retryAttempts: number;
  retryDelay: number; // Milliseconds
  maxErrorRate: number; // Per minute
  enableBatteryTracking: boolean;
  enableNetworkTracking: boolean;
  enablePerformanceTracking: boolean;
}

export interface UserActivity {
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
    isMobile: boolean;
  };
}

export interface PerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, any>;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface ErrorLog {
  errorId: string;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userName?: string;
  component?: string;
  action?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  tags?: string[];
  environment: 'development' | 'staging' | 'production';
  userAgent?: string;
  url?: string;
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  progressPercentage: number;
  budgetTotal: number;
  budgetSpent: number;
  budgetRemaining: number;
  teamSize: number;
  lastActivity: Date;
  healthScore: number; // 0-100
  performanceScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// VALIDATION UTILITIES
// ============================================

export class MonitoringValidator {
  static validateSystemMetrics(metrics: Partial<SystemMetrics>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (typeof metrics.cpu !== 'number') errors.push('CPU must be a number');
    if (typeof metrics.memory !== 'number') errors.push('Memory must be a number');
    if (typeof metrics.activeUsers !== 'number') errors.push('Active users must be a number');
    if (typeof metrics.responseTime !== 'number') errors.push('Response time must be a number');
    if (typeof metrics.errorRate !== 'number') errors.push('Error rate must be a number');

    // Range validations
    if (metrics.cpu !== undefined && (metrics.cpu < 0 || metrics.cpu > 100)) {
      errors.push('CPU must be between 0 and 100');
    }
    if (metrics.memory !== undefined && metrics.memory < 0) {
      errors.push('Memory must be positive');
    }
    if (metrics.activeUsers !== undefined && metrics.activeUsers < 0) {
      errors.push('Active users must be positive');
    }
    if (metrics.responseTime !== undefined && metrics.responseTime < 0) {
      errors.push('Response time must be positive');
    }
    if (metrics.errorRate !== undefined && metrics.errorRate < 0) {
      errors.push('Error rate must be positive');
    }

    // Performance warnings
    if (metrics.cpu !== undefined && metrics.cpu > 80) {
      warnings.push('High CPU usage detected');
    }
    if (metrics.memory !== undefined && metrics.memory > 512) {
      warnings.push('High memory usage detected');
    }
    if (metrics.responseTime !== undefined && metrics.responseTime > 2000) {
      warnings.push('Slow response time detected');
    }
    if (metrics.errorRate !== undefined && metrics.errorRate > 10) {
      warnings.push('High error rate detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateUserActivity(activity: Partial<UserActivity>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!activity.userId || typeof activity.userId !== 'string') {
      errors.push('User ID is required and must be a string');
    }
    if (!activity.userName || typeof activity.userName !== 'string') {
      errors.push('User name is required and must be a string');
    }
    if (!activity.action || typeof activity.action !== 'string') {
      errors.push('Action is required and must be a string');
    }
    if (!activity.resource || typeof activity.resource !== 'string') {
      errors.push('Resource is required and must be a string');
    }

    // Validation patterns
    const validActions = [
      'create',
      'read',
      'update',
      'delete',
      'navigate',
      'login',
      'logout',
      'export',
      'import',
    ];
    if (activity.action && !validActions.includes(activity.action.toLowerCase())) {
      warnings.push(`Unknown action type: ${activity.action}`);
    }

    if (activity.duration !== undefined && activity.duration < 0) {
      errors.push('Duration must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  static validateErrorLog(error: Partial<ErrorLog>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!error.message || typeof error.message !== 'string') {
      errors.push('Error message is required and must be a string');
    }
    if (!error.severity || !['low', 'medium', 'high', 'critical'].includes(error.severity)) {
      errors.push('Severity must be one of: low, medium, high, critical');
    }

    // Environment validation
    if (
      error.environment &&
      !['development', 'staging', 'production'].includes(error.environment)
    ) {
      errors.push('Environment must be one of: development, staging, production');
    }

    // Critical error validation
    if (error.severity === 'critical' && !error.component) {
      warnings.push('Critical errors should include component information');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ============================================
// ENHANCED MONITORING SERVICE
// ============================================

export class MonitoringService {
  private static instance: MonitoringService;
  private metricsInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;
  private config: MonitoringConfig;
  private retryQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  private constructor() {
    this.config = {
      metricsInterval: 60000,
      retryAttempts: 3,
      retryDelay: 1000,
      maxErrorRate: 10,
      enableBatteryTracking: true,
      enableNetworkTracking: true,
      enablePerformanceTracking: true,
    };

    // Setup network monitoring
    this.initializeNetworkMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processRetryQueue();
      logger.info('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Network connection lost');
    });
  }

  /**
   * Get network status with enhanced detection
   */
  private getNetworkStatus(): 'online' | 'offline' | 'slow' {
    if (!this.isOnline) return 'offline';

    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const slowConnections = ['slow-2g', '2g'];
        if (slowConnections.includes(connection.effectiveType)) {
          return 'slow';
        }
      }
    }

    return 'online';
  }

  /**
   * Get battery level if available
   */
  private async getBatteryLevel(): Promise<number | undefined> {
    if (!this.config.enableBatteryTracking) return undefined;

    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (error) {
      // Battery API not available or permission denied
    }
    return undefined;
  }

  /**
   * Get connection type information
   */
  private getConnectionType(): string | undefined {
    if (!this.config.enableNetworkTracking) return undefined;

    try {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        return connection?.effectiveType || connection?.type || 'unknown';
      }
    } catch (error) {
      // Connection API not available
    }
    return undefined;
  }

  /**
   * Enhanced system metrics collection with validation
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      const batteryLevel = await this.getBatteryLevel();
      const connectionType = this.getConnectionType();

      const metricsData: SystemMetrics = {
        timestamp: new Date(),
        cpu: this.getCPUUsage(),
        memory: this.getMemoryUsage(),
        activeUsers: await this.getActiveUsersCount(),
        responseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        networkStatus: this.getNetworkStatus(),
        batteryLevel,
        connectionType,
      };

      // Validate metrics before saving
      const validation = MonitoringValidator.validateSystemMetrics(metricsData);

      if (!validation.isValid) {
        console.error('❌ Invalid metrics data:', validation.errors);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Metrics warnings:', validation.warnings);
      }

      await this.saveSystemMetricsWithRetry(metricsData);
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      await this.logError({
        message: 'Failed to collect system metrics',
        stack: error instanceof Error ? error.stack : undefined,
        severity: 'medium',
        component: 'MonitoringService',
        action: 'collectSystemMetrics',
      });
    }
  }

  /**
   * Save system metrics with retry mechanism
   */
  private async saveSystemMetricsWithRetry(metrics: SystemMetrics): Promise<void> {
    const operation = async () => {
      await addDoc(collection(db, 'systemMetrics'), {
        ...metrics,
        timestamp: serverTimestamp(),
      });
    };

    await this.executeWithRetry(operation, 'saveSystemMetrics');
  }

  /**
   * Enhanced error logging with validation
   */
  async logError(
    error: Omit<ErrorLog, 'errorId' | 'timestamp' | 'resolved' | 'environment'>
  ): Promise<void> {
    try {
      const errorData: ErrorLog = {
        ...error,
        errorId: '', // Will be set by Firestore
        timestamp: new Date(),
        resolved: false,
        environment: 'development' as const,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Validate error data
      const validation = MonitoringValidator.validateErrorLog(errorData);

      if (!validation.isValid) {
        console.error('❌ Invalid error data:', validation.errors);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Error warnings:', validation.warnings);
      }

      const operation = async () => {
        const errorDoc = await addDoc(collection(db, 'errorLogs'), {
          ...errorData,
          timestamp: serverTimestamp(),
        });

        // Auto-alert for critical errors
        if (error.severity === 'critical') {
          await this.sendCriticalErrorAlert(errorDoc.id, errorData);
        }
      };

      await this.executeWithRetry(operation, 'logError');
    } catch (err) {
      console.error('Error logging error:', err);
    }
  }

  /**
   * Enhanced user activity logging with validation
   */
  async logUserActivity(
    activity: Omit<UserActivity, 'timestamp' | 'deviceInfo' | 'sessionId'>
  ): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const sessionId = this.getSessionId();

      const activityData: UserActivity = {
        ...activity,
        timestamp: new Date(),
        deviceInfo,
        sessionId,
        ipAddress: activity.ipAddress || (await this.getClientIP()),
      };

      // Validate activity data
      const validation = MonitoringValidator.validateUserActivity(activityData);

      if (!validation.isValid) {
        console.error('❌ Invalid activity data:', validation.errors);
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Activity warnings:', validation.warnings);
      }

      const operation = async () => {
        await addDoc(collection(db, 'userActivities'), {
          ...activityData,
          timestamp: serverTimestamp(),
        });
      };

      await this.executeWithRetry(operation, 'logUserActivity');
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): UserActivity['deviceInfo'] {
    const userAgent = navigator.userAgent;

    return {
      platform: navigator.platform,
      browser: this.getBrowserName(userAgent),
      version: this.getBrowserVersion(userAgent),
      isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
    };
  }

  /**
   * Get browser name from user agent
   */
  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Get browser version from user agent
   */
  private getBrowserVersion(userAgent: string): string {
    const matches = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return matches ? matches[2] : 'Unknown';
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get client IP address (simplified)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      // In production, you might want to use a proper IP detection service
      return 'client-ip-detection-disabled';
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Execute operation with retry mechanism
   */
  private async executeWithRetry(
    operation: () => Promise<void>,
    operationName: string
  ): Promise<void> {
    if (!this.isOnline) {
      this.retryQueue.push(operation);
      console.log(`📝 ${operationName} queued for retry when online`);
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await operation();
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `⚠️ ${operationName} attempt ${attempt}/${this.config.retryAttempts} failed:`,
          error
        );

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All attempts failed
    console.error(
      `❌ ${operationName} failed after ${this.config.retryAttempts} attempts:`,
      lastError
    );

    // Queue for retry when online
    this.retryQueue.push(operation);
  }

  /**
   * Process retry queue when connection is restored
   */
  private async processRetryQueue(): Promise<void> {
    if (this.isProcessingQueue || this.retryQueue.length === 0) return;

    this.isProcessingQueue = true;

    logger.info(`Processing ${this.retryQueue.length} queued operations`);

    const operations = [...this.retryQueue];
    this.retryQueue = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        // Re-queue failed operations
        this.retryQueue.push(operation);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Delay utility for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Enhanced project metrics with health scoring
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics | null> {
    try {
      // Get project data
      const projectDoc = await getDocs(
        query(collection(db, 'projects'), where('__name__', '==', projectId))
      );

      if (projectDoc.empty) return null;

      const project = projectDoc.docs[0].data();

      // Get tasks
      const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
      const tasksSnapshot = await getDocs(tasksQuery);

      let tasksCompleted = 0;
      let tasksInProgress = 0;
      let tasksPending = 0;

      tasksSnapshot.forEach((doc) => {
        const task = doc.data();
        if (task.status === 'completed') tasksCompleted++;
        else if (task.status === 'in-progress') tasksInProgress++;
        else tasksPending++;
      });

      const tasksTotal = tasksSnapshot.size;
      const progressPercentage = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

      // Calculate budget
      const budgetTotal = project.budget || 0;
      const budgetSpent =
        project.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0;
      const budgetRemaining = budgetTotal - budgetSpent;

      // Team size
      const teamSize = project.members?.length || 0;

      // Last activity
      const lastActivity = project.updatedAt?.toDate() || new Date();

      // Calculate health score (0-100)
      const healthScore = this.calculateProjectHealthScore({
        progressPercentage,
        budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0,
        teamSize,
        tasksOverdue: 0, // Would need deadline analysis
      });

      // Calculate performance score
      const performanceScore = this.calculateProjectPerformanceScore({
        progressPercentage,
        timelineAdherence: 80, // Would need timeline analysis
        qualityMetrics: 85, // Would need quality metrics
      });

      // Determine risk level
      const riskLevel = this.calculateProjectRiskLevel(healthScore, performanceScore);

      return {
        projectId,
        projectName: project.name,
        tasksTotal,
        tasksCompleted,
        tasksInProgress,
        tasksPending,
        progressPercentage,
        budgetTotal,
        budgetSpent,
        budgetRemaining,
        teamSize,
        lastActivity,
        healthScore,
        performanceScore,
        riskLevel,
      };
    } catch (error) {
      console.error('Error getting project metrics:', error);
      return null;
    }
  }

  /**
   * Calculate project health score
   */
  private calculateProjectHealthScore(data: {
    progressPercentage: number;
    budgetUtilization: number;
    teamSize: number;
    tasksOverdue: number;
  }): number {
    let score = 100;

    // Progress factor
    if (data.progressPercentage < 20) score -= 20;
    else if (data.progressPercentage < 50) score -= 10;

    // Budget factor
    if (data.budgetUtilization > 90) score -= 15;
    else if (data.budgetUtilization > 75) score -= 5;

    // Team size factor
    if (data.teamSize < 2) score -= 10;

    // Overdue tasks factor
    score -= Math.min(data.tasksOverdue * 5, 30);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate project performance score
   */
  private calculateProjectPerformanceScore(data: {
    progressPercentage: number;
    timelineAdherence: number;
    qualityMetrics: number;
  }): number {
    const weights = { progress: 0.4, timeline: 0.3, quality: 0.3 };

    return Math.round(
      data.progressPercentage * weights.progress +
        data.timelineAdherence * weights.timeline +
        data.qualityMetrics * weights.quality
    );
  }

  /**
   * Calculate project risk level
   */
  private calculateProjectRiskLevel(
    healthScore: number,
    performanceScore: number
  ): ProjectMetrics['riskLevel'] {
    const averageScore = (healthScore + performanceScore) / 2;

    if (averageScore >= 80) return 'low';
    if (averageScore >= 60) return 'medium';
    if (averageScore >= 40) return 'high';
    return 'critical';
  }

  /**
   * Get CPU usage (simulated - in real app use actual system metrics)
   */
  private getCPUUsage(): number {
    // In production, use actual system metrics
    // For now, simulate based on performance.memory
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return Math.min(100, (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
    }
    return 0;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Get active users count
   */
  private async getActiveUsersCount(): Promise<number> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const q = query(
        collection(db, 'userSessions'),
        where('lastActivity', '>=', Timestamp.fromDate(fiveMinutesAgo)),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting active users:', error);
      return 0;
    }
  }

  /**
   * Get average response time
   */
  private async getAverageResponseTime(): Promise<number> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const q = query(
        collection(db, 'performanceMetrics'),
        where('metricName', '==', 'responseTime'),
        where('timestamp', '>=', Timestamp.fromDate(oneMinuteAgo))
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return 0;

      let total = 0;
      snapshot.forEach((doc) => {
        total += doc.data().value;
      });

      return total / snapshot.size;
    } catch (error) {
      console.error('Error getting response time:', error);
      return 0;
    }
  }

  /**
   * Get error rate (errors per minute)
   */
  private async getErrorRate(): Promise<number> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const q = query(
        collection(db, 'errorLogs'),
        where('timestamp', '>=', Timestamp.fromDate(oneMinuteAgo))
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting error rate:', error);
      return 0;
    }
  }

  /**
   * Log performance metric
   */
  async logPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      await addDoc(collection(db, 'performanceMetrics'), {
        ...metric,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging performance metric:', error);
    }
  }

  /**
   * Send critical error alert
   */
  private async sendCriticalErrorAlert(errorId: string, error: any): Promise<void> {
    try {
      // In production, send email/SMS/Slack notification
      console.error('🚨 CRITICAL ERROR:', error);

      // Create notification for admins
      await addDoc(collection(db, 'notifications'), {
        type: 'critical_error',
        title: 'Critical Error Detected',
        message: error.message,
        errorId: errorId,
        severity: 'critical',
        timestamp: serverTimestamp(),
        read: false,
      });
    } catch (err) {
      console.error('Error sending critical error alert:', err);
    }
  }

  /**
   * Subscribe to real-time system metrics with enhanced error handling
   */
  subscribeToSystemMetrics(callback: (metrics: SystemMetrics) => void): () => void {
    const q = query(collection(db, 'systemMetrics'), orderBy('timestamp', 'desc'), limit(1));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const metrics: SystemMetrics = {
            timestamp: data.timestamp.toDate(),
            cpu: data.cpu || 0,
            memory: data.memory || 0,
            activeUsers: data.activeUsers || 0,
            responseTime: data.responseTime || 0,
            errorRate: data.errorRate || 0,
            networkStatus: data.networkStatus || 'online',
            batteryLevel: data.batteryLevel,
            connectionType: data.connectionType,
          };
          callback(metrics);
        }
      },
      (error) => {
        console.error('Error in system metrics subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to real-time error logs with enhanced error handling
   */
  subscribeToErrorLogs(
    callback: (errors: ErrorLog[]) => void,
    limitCount: number = 10
  ): () => void {
    const q = query(
      collection(db, 'errorLogs'),
      where('resolved', '==', false),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const errors: ErrorLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          errors.push({
            errorId: doc.id,
            message: data.message || 'Unknown error',
            stack: data.stack,
            severity: data.severity || 'medium',
            userId: data.userId,
            userName: data.userName,
            component: data.component,
            action: data.action,
            timestamp: data.timestamp?.toDate() || new Date(),
            resolved: data.resolved || false,
            resolvedBy: data.resolvedBy,
            resolvedAt: data.resolvedAt?.toDate(),
            tags: data.tags || [],
            environment: data.environment || 'development',
            userAgent: data.userAgent,
            url: data.url,
          });
        });
        callback(errors);
      },
      (error) => {
        console.error('Error in error logs subscription:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Mark error as resolved with enhanced tracking
   */
  async resolveError(errorId: string, resolvedBy?: string): Promise<void> {
    try {
      const operation = async () => {
        const errorRef = doc(db, 'errorLogs', errorId);
        await updateDoc(errorRef, {
          resolved: true,
          resolvedAt: serverTimestamp(),
          resolvedBy: resolvedBy || 'unknown',
        });
      };

      await this.executeWithRetry(operation, 'resolveError');
    } catch (error) {
      console.error('Error resolving error:', error);
      throw error;
    }
  }

  /**
   * Get analytics dashboard data with enhanced time range support
   */
  async getDashboardAnalytics(timeRange: 'hour' | 'day' | 'week' | 'month') {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    try {
      const operations = [
        this.getMetricsInRange(startDate, now),
        this.getActivitiesInRange(startDate, now),
        this.getErrorsInRange(startDate, now),
      ];

      const [metrics, activities, errors] = await Promise.allSettled(operations);

      return {
        metrics: metrics.status === 'fulfilled' ? metrics.value : [],
        activities: activities.status === 'fulfilled' ? activities.value : [],
        errors: errors.status === 'fulfilled' ? errors.value : [],
        summary: {
          totalActivities: activities.status === 'fulfilled' ? activities.value.length : 0,
          totalErrors: errors.status === 'fulfilled' ? errors.value.length : 0,
          criticalErrors:
            errors.status === 'fulfilled'
              ? errors.value.filter((error: any) => error.severity === 'critical').length
              : 0,
        },
        timeRange,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get metrics in date range
   */
  private async getMetricsInRange(startDate: Date, endDate: Date) {
    const metricsQuery = query(
      collection(db, 'systemMetrics'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'asc')
    );
    const metricsSnapshot = await getDocs(metricsQuery);

    return metricsSnapshot.docs.map((doc) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  }

  /**
   * Get activities in date range
   */
  private async getActivitiesInRange(startDate: Date, endDate: Date) {
    const activitiesQuery = query(
      collection(db, 'userActivities'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);

    return activitiesSnapshot.docs.map((doc) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  }

  /**
   * Get errors in date range
   */
  private async getErrorsInRange(startDate: Date, endDate: Date) {
    const errorsQuery = query(
      collection(db, 'errorLogs'),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp', 'desc')
    );
    const errorsSnapshot = await getDocs(errorsQuery);

    return errorsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  }

  /**
   * Enhanced system health with detailed analysis
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: SystemMetrics | null;
    issues: string[];
    recommendations: string[];
    lastCheck: Date;
  }> {
    try {
      // Get latest metrics
      const q = query(collection(db, 'systemMetrics'), orderBy('timestamp', 'desc'), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          status: 'warning',
          metrics: null,
          issues: ['No metrics data available'],
          recommendations: ['Start monitoring to collect system metrics'],
          lastCheck: new Date(),
        };
      }

      const data = snapshot.docs[0].data();
      const metrics: SystemMetrics = {
        timestamp: data.timestamp.toDate(),
        cpu: data.cpu || 0,
        memory: data.memory || 0,
        activeUsers: data.activeUsers || 0,
        responseTime: data.responseTime || 0,
        errorRate: data.errorRate || 0,
        networkStatus: data.networkStatus || 'online',
        batteryLevel: data.batteryLevel,
        connectionType: data.connectionType,
      };

      const issues: string[] = [];
      const recommendations: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      // Enhanced health analysis
      const healthAnalysis = this.analyzeSystemHealth(metrics);
      issues.push(...healthAnalysis.issues);
      recommendations.push(...healthAnalysis.recommendations);

      if (healthAnalysis.criticalIssues > 0) {
        status = 'critical';
      } else if (healthAnalysis.warningIssues > 0) {
        status = 'warning';
      }

      return {
        status,
        metrics,
        issues,
        recommendations,
        lastCheck: new Date(),
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        status: 'critical',
        metrics: null,
        issues: ['Failed to fetch system health'],
        recommendations: ['Check Firebase connection and permissions'],
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Analyze system health with detailed recommendations
   */
  private analyzeSystemHealth(metrics: SystemMetrics): {
    issues: string[];
    recommendations: string[];
    criticalIssues: number;
    warningIssues: number;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let criticalIssues = 0;
    let warningIssues = 0;

    // CPU Analysis
    if (metrics.cpu > 90) {
      issues.push('CPU usage is critically high (>90%)');
      recommendations.push('Consider optimizing CPU-intensive operations or scaling resources');
      criticalIssues++;
    } else if (metrics.cpu > 70) {
      issues.push('CPU usage is high (>70%)');
      recommendations.push('Monitor CPU usage and consider optimization');
      warningIssues++;
    }

    // Memory Analysis
    if (metrics.memory > 1000) {
      issues.push('Memory usage is critically high (>1GB)');
      recommendations.push('Check for memory leaks and optimize memory usage');
      criticalIssues++;
    } else if (metrics.memory > 500) {
      issues.push('Memory usage is high (>500MB)');
      recommendations.push('Monitor memory usage patterns');
      warningIssues++;
    }

    // Response Time Analysis
    if (metrics.responseTime > 5000) {
      issues.push('Response time is critically slow (>5s)');
      recommendations.push('Investigate performance bottlenecks immediately');
      criticalIssues++;
    } else if (metrics.responseTime > 2000) {
      issues.push('Response time is slow (>2s)');
      recommendations.push('Optimize database queries and API responses');
      warningIssues++;
    }

    // Error Rate Analysis
    if (metrics.errorRate > 20) {
      issues.push('Error rate is critically high (>20 errors/min)');
      recommendations.push('Investigate and fix critical system errors');
      criticalIssues++;
    } else if (metrics.errorRate > 10) {
      issues.push('Error rate is elevated (>10 errors/min)');
      recommendations.push('Review and address recurring errors');
      warningIssues++;
    }

    // Network Status Analysis
    if (metrics.networkStatus === 'offline') {
      issues.push('Network connection is offline');
      recommendations.push('Check internet connectivity');
      criticalIssues++;
    } else if (metrics.networkStatus === 'slow') {
      issues.push('Network connection is slow');
      recommendations.push('Consider optimizing for slow connections');
      warningIssues++;
    }

    // Battery Analysis (if available)
    if (metrics.batteryLevel !== undefined && metrics.batteryLevel < 20) {
      issues.push('Device battery is low (<20%)');
      recommendations.push('Consider reducing monitoring frequency to save battery');
      warningIssues++;
    }

    return { issues, recommendations, criticalIssues, warningIssues };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart monitoring with new interval if changed
    if (newConfig.metricsInterval && this.metricsInterval) {
      this.stopMonitoring();
      this.startMonitoring(newConfig.metricsInterval);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<{
    isRunning: boolean;
    uptime: number;
    metricsCollected: number;
    errorsLogged: number;
    queuedOperations: number;
    networkStatus: string;
  }> {
    try {
      const metricsCount = await this.getCollectionCount('systemMetrics');
      const errorsCount = await this.getCollectionCount('errorLogs');

      return {
        isRunning: this.metricsInterval !== null,
        uptime: Date.now() - (this.startTime || Date.now()),
        metricsCollected: metricsCount,
        errorsLogged: errorsCount,
        queuedOperations: this.retryQueue.length,
        networkStatus: this.getNetworkStatus(),
      };
    } catch (error) {
      console.error('Error getting monitoring stats:', error);
      return {
        isRunning: false,
        uptime: 0,
        metricsCollected: 0,
        errorsLogged: 0,
        queuedOperations: 0,
        networkStatus: 'unknown',
      };
    }
  }

  private startTime: number | null = null;

  /**
   * Enhanced start monitoring with configuration
   */
  startMonitoring(intervalMs: number = this.config.metricsInterval): void {
    if (this.metricsInterval) {
      console.warn('Monitoring already started');
      return;
    }

    this.startTime = Date.now();
    logger.info('Starting enhanced system monitoring...');

    // Collect metrics immediately
    this.collectSystemMetrics();

    // Then collect periodically
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs) as unknown as number;

    // Process any queued operations
    if (this.isOnline) {
      this.processRetryQueue();
    }
  }

  /**
   * Enhanced stop monitoring with cleanup
   */
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      this.startTime = null;
      logger.info('Monitoring stopped');
    }
  }

  /**
   * Get collection count helper
   */
  private async getCollectionCount(collectionName: string): Promise<number> {
    try {
      const q = query(collection(db, collectionName));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      return 0;
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();
