/**
 * Health Monitoring Service
 * 
 * Provides comprehensive health checks for the application including:
 * - API connectivity
 * - Database connectivity
 * - Third-party service status
 * - Performance metrics
 * - Resource utilization
 */

import { logger } from '@/utils/logger.enhanced';
import { query } from 'firebase/firestore';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
      responseTime?: number;
      details?: any;
    };
  };
  overallResponseTime: number;
}

export interface HealthCheckOptions {
  timeout?: number;
  includeDetailedMetrics?: boolean;
  customChecks?: Array<() => Promise<{ name: string; check: () => Promise<boolean> }>>;
}

class HealthMonitoringService {
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckEndpoint: string = '/api/health';

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(options: HealthCheckOptions = {}): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timeout = options.timeout || 5000;
    const checks: HealthCheckResult['checks'] = {};

    try {
      // Check Firebase connectivity
      checks.firebase = await this.checkFirebaseConnectivity(timeout);

      // Check API endpoints
      checks.api = await this.checkApiConnectivity(timeout);

      // Check third-party services
      checks.gemini = await this.checkGeminiConnectivity(timeout);

      // Check performance metrics
      checks.performance = await this.checkPerformanceMetrics();

      // Run custom checks if provided
      if (options.customChecks) {
        for (const customCheck of options.customChecks) {
          try {
            const check = await customCheck();
            const checkResult = await customCheck();
            checks[checkResult.name] = {
              status: (await checkResult.check()) ? 'healthy' : 'unhealthy',
            };
          } catch (error) {
            const checkResult = await customCheck();
            checks[checkResult.name] = {
              status: 'unhealthy',
              message: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }
      }

      const overallResponseTime = Date.now() - startTime;
      const status = this.calculateOverallStatus(checks);

      logger.info('Health check completed', {
        status,
        overallResponseTime,
        checkCount: Object.keys(checks).length,
      });

      return {
        status,
        timestamp: new Date().toISOString(),
        checks,
        overallResponseTime,
      };
    } catch (error) {
      const overallResponseTime = Date.now() - startTime;
      logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          system: {
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        overallResponseTime,
      };
    }
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring(interval: number = 60000): void {
    if (this.isMonitoring) {
      logger.warn('Health monitoring already started');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting health monitoring', { interval });

    this.monitoringInterval = setInterval(async () => {
      try {
        const result = await this.performHealthCheck();
        this.handleHealthCheckResult(result);
      } catch (error) {
        logger.error('Continuous health monitoring failed', error instanceof Error ? error : new Error(String(error)));
      }
    }, interval);
  }

  /**
   * Stop continuous health monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Health monitoring stopped');
  }

  /**
   * Check Firebase connectivity
   */
  private async checkFirebaseConnectivity(timeout: number): Promise<HealthCheckResult['checks']['firebase']> {
    const startTime = Date.now();
    
    try {
      // Import Firebase dynamically to avoid issues in test environments
      const { collection, getDocs, limit } = await import('firebase/firestore');
      const { db } = await import('@/firebaseConfig');
      
      // Perform a lightweight query to test connectivity
      const testCollection = collection(db, 'health-checks');
      await Promise.race([
        getDocs(query(testCollection, limit(1))),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase connectivity timeout')), timeout)
        )
      ]);

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Firebase connectivity failed',
        responseTime,
      };
    }
  }

  /**
   * Check API connectivity
   */
  private async checkApiConnectivity(timeout: number): Promise<HealthCheckResult['checks']['api']> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(this.healthCheckEndpoint, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
        };
      } else {
        return {
          status: 'degraded',
          message: `API returned status ${response.status}`,
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'degraded',
          message: 'API request timeout',
          responseTime,
        };
      }
      
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'API connectivity failed',
        responseTime,
      };
    }
  }

  /**
   * Check Gemini API connectivity
   */
  private async checkGeminiConnectivity(timeout: number): Promise<HealthCheckResult['checks']['gemini']> {
    const startTime = Date.now();
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // If no API key, skip the check
    if (!geminiApiKey) {
      return {
        status: 'degraded',
        message: 'Gemini API key not configured',
      };
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Simple health check endpoint for Gemini
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Health check - respond with 'OK'"
              }]
            }]
          }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
        };
      } else {
        return {
          status: 'degraded',
          message: `Gemini API returned status ${response.status}`,
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          status: 'degraded',
          message: 'Gemini API request timeout',
          responseTime,
        };
      }
      
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Gemini API connectivity failed',
        responseTime,
      };
    }
  }

  /**
   * Check performance metrics
   */
  private async checkPerformanceMetrics(): Promise<HealthCheckResult['checks']['performance']> {
    try {
      // Memory usage
      // Network information
      const networkInfo = typeof navigator !== 'undefined' && (navigator as any).connection
        ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt,
          }
        : { effectiveType: 'unknown' };
      
      // Performance metrics
      const performanceMetrics = {
        network: networkInfo,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };
      
      return {
        status: 'healthy',
        details: performanceMetrics,
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: error instanceof Error ? error.message : 'Performance metrics check failed',
      };
    }
  }

  /**
   * Calculate overall status based on individual checks
   */
  private calculateOverallStatus(checks: HealthCheckResult['checks']): HealthCheckResult['status'] {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Handle health check results
   */
  private handleHealthCheckResult(result: HealthCheckResult): void {
    // Log health status
    logger.info('System health status', {
      status: result.status,
      responseTime: result.overallResponseTime,
      checks: Object.keys(result.checks).length,
    });

    // Send to monitoring service if unhealthy
    if (result.status === 'unhealthy') {
      logger.error('System health critical', {
        failedChecks: Object.entries(result.checks)
          .filter(([_, check]) => check.status === 'unhealthy')
          .map(([name, check]) => ({ name, message: check.message })),
      } as any);
    } else if (result.status === 'degraded') {
      logger.warn('System health degraded', {
        degradedChecks: Object.entries(result.checks)
          .filter(([_, check]) => check.status === 'degraded')
          .map(([name, check]) => ({ name, message: check.message })),
      });
    }

    // Emit event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('health-check-update', { detail: result }));
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): Promise<HealthCheckResult> {
    return this.performHealthCheck();
  }
}

// Export singleton instance
export const healthMonitoringService = new HealthMonitoringService();

// Export for testing
export { HealthMonitoringService };