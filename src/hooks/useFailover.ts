/**
 * React Hook for Failover Status and Control
 */

import { useState, useEffect } from 'react';
import { failoverManager, FailoverEvent } from '@/utils/failoverManager';
import { RegionConfig, REGIONS, getFailoverHistory } from '../config/failover';
import { HealthStatus } from '@/utils/healthCheck';

export interface FailoverStatus {
  currentRegion: RegionConfig;
  availableRegions: RegionConfig[];
  isHealthy: boolean;
  lastFailover: Date | null;
  failoverHistory: Array<{
    timestamp: number;
    from: string;
    to: string;
    reason: string;
  }>;
  recentEvents: FailoverEvent[];
}

export function useFailover() {
  const [status, setStatus] = useState<FailoverStatus>({
    currentRegion: failoverManager.getCurrentRegionInfo(),
    availableRegions: REGIONS,
    isHealthy: true,
    lastFailover: null,
    failoverHistory: getFailoverHistory(),
    recentEvents: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to failover events
    const unsubscribe = failoverManager.subscribe((event: FailoverEvent) => {
      console.log('Failover event:', event);

      setStatus((prev) => {
        const newEvents = [...prev.recentEvents, event].slice(-10); // Keep last 10 events

        return {
          ...prev,
          currentRegion: failoverManager.getCurrentRegionInfo(),
          failoverHistory: getFailoverHistory(),
          recentEvents: newEvents,
          isHealthy: event.type !== 'health_check_failed' && event.type !== 'health_warning',
          lastFailover: event.type === 'failover_completed' ? new Date() : prev.lastFailover,
        };
      });
    });

    // Initial health check
    checkHealth();

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Check current health status
   */
  const checkHealth = async () => {
    try {
      const healthStatus = await failoverManager.getCurrentHealth();
      setStatus((prev) => ({
        ...prev,
        isHealthy: healthStatus.healthy,
      }));
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus((prev) => ({
        ...prev,
        isHealthy: false,
      }));
    }
  };

  /**
   * Perform manual failover
   */
  const manualFailover = async (regionId: string, reason: string = 'Manual failover') => {
    setIsLoading(true);
    try {
      await failoverManager.manualFailover(regionId, reason);
      // Page will reload after failover
    } catch (error) {
      console.error('Manual failover failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear recent events
   */
  const clearEvents = () => {
    setStatus((prev) => ({
      ...prev,
      recentEvents: [],
    }));
  };

  return {
    ...status,
    isLoading,
    checkHealth,
    manualFailover,
    clearEvents,
  };
}
