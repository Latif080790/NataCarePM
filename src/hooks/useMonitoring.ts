import { useState, useEffect, useCallback } from 'react';
import {
  monitoringService,
  SystemMetrics,
  ErrorLog,
  ProjectMetrics,
} from '@/api/monitoringService';
import { useAuth } from '@/contexts/AuthContext';

// ... (hook-hook lain tetap sama) ...

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = monitoringService.subscribeToSystemMetrics((newMetrics) => {
      setMetrics(newMetrics);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { metrics, loading };
}

export function useErrorLogs(limitCount: number = 10) {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = monitoringService.subscribeToErrorLogs((newErrors) => {
      setErrors(newErrors);
      setLoading(false);
    }, limitCount);

    return () => unsubscribe();
  }, [limitCount]);

  const resolveError = useCallback(async (errorId: string) => {
    await monitoringService.resolveError(errorId);
  }, []);

  return { errors, loading, resolveError };
}

export function useSystemHealth() {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: SystemMetrics | null;
    issues: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    const healthStatus = await monitoringService.getSystemHealth();
    setHealth(healthStatus);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, loading, refresh: checkHealth };
}

export function useProjectMetrics(projectId: string | undefined) {
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    monitoringService
      .getProjectMetrics(projectId)
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, [projectId]);

  return { metrics, loading };
}


/**
 * REFACTORED Hook for user activity tracking
 * useAuth is now called inside the returned function to prevent top-level execution.
 */
export function useActivityTracker() {
  const auth = useAuth(); // Now we get the whole context

  const trackActivity = useCallback(
    async (
      action: string,
      resource: string,
      resourceId?: string,
      success: boolean = true,
      duration?: number
    ) => {
      const currentUser = auth.currentUser; // Access currentUser when the function is called
      if (!currentUser) return;

      await monitoringService.logUserActivity({
        userId: currentUser.uid,
        userName: currentUser.name || 'Unknown',
        action,
        resource,
        resourceId,
        duration,
        success,
      });
    },
    [auth] // Depend on the whole auth context
  );

  return { trackActivity };
}

export function usePerformanceTracker() {
  const trackPerformance = useCallback(
    async (
      metricName: string,
      value: number,
      unit: string = 'ms',
      context?: Record<string, any>
    ) => {
      await monitoringService.logPerformanceMetric({
        metricName,
        value,
        unit,
        timestamp: new Date(),
        context,
      });
    },
    []
  );

  const measureAsync = useCallback(
    async <T>(metricName: string, fn: () => Promise<T>): Promise<T> => {
      const startTime = performance.now();
      try {
        const result = await fn();
        const duration = performance.now() - startTime;
        await trackPerformance(metricName, duration, 'ms', { success: true });
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        await trackPerformance(metricName, duration, 'ms', { success: false });
        throw error;
      }
    },
    [trackPerformance]
  );

  return { trackPerformance, measureAsync };
}

/**
 * REFACTORED Hook for error tracking
 * useAuth is now called inside the returned function to prevent top-level execution.
 */
export function useErrorTracker() {
  const auth = useAuth(); // Get the whole context

  const trackError = useCallback(
    async (
      error: Error,
      severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
      component?: string,
      action?: string
    ) => {
      const currentUser = auth.currentUser; // Access currentUser when function is called
      await monitoringService.logError({
        message: error.message,
        stack: error.stack,
        severity,
        userId: currentUser?.uid,
        userName: currentUser?.name,
        component,
        action,
      });
    },
    [auth] // Depend on the whole auth context
  );

  return { trackError };
}

export function useDashboardAnalytics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await monitoringService.getDashboardAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { analytics, loading, refresh };
}
