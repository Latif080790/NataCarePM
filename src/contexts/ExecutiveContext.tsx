/**
 * Executive Context
 * Phase 3.5: Quick Wins - Executive Dashboard
 *
 * Manages executive dashboard state and real-time KPI updates
 */

import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  ExecutiveDashboardData,
  TimeFrame,
} from '@/types/executive.types';
import executiveService from '@/api/executiveService';

interface ExecutiveContextState {
  // Dashboard data
  dashboardData: ExecutiveDashboardData | null;
  loading: boolean;
  error: string | null;

  // Time frame
  timeFrame: TimeFrame;

  // Actions
  loadDashboard: (timeFrame?: TimeFrame, projectId?: string) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
}

const ExecutiveContext = createContext<ExecutiveContextState | undefined>(undefined);

export const useExecutive = () => {
  const context = useContext(ExecutiveContext);
  if (!context) {
    throw new Error('useExecutive must be used within ExecutiveProvider');
  }
  return context;
};

export const ExecutiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrameState] = useState<TimeFrame>('month');

  // Load dashboard data
  const loadDashboard = useCallback(
    async (frame?: TimeFrame, projectId?: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await executiveService.getDashboardData(frame || timeFrame, projectId);
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    },
    [timeFrame]
  );

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    if (dashboardData) {
      await loadDashboard(dashboardData.timeFrame, dashboardData.projectId);
    }
  }, [dashboardData, loadDashboard]);

  // Set time frame
  const setTimeFrame = useCallback(
    (frame: TimeFrame) => {
      setTimeFrameState(frame);
      loadDashboard(frame);
    },
    [loadDashboard]
  );

  // Acknowledge alert
  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      try {
        await executiveService.acknowledgeAlert(alertId, 'current-user'); // TODO: Get from auth context
        await refreshDashboard();
      } catch (err) {
        console.error('Failed to acknowledge alert:', err);
      }
    },
    [refreshDashboard]
  );

  // Dismiss alert
  const dismissAlert = useCallback(
    async (alertId: string) => {
      try {
        await executiveService.dismissAlert(alertId);
        await refreshDashboard();
      } catch (err) {
        console.error('Failed to dismiss alert:', err);
      }
    },
    [refreshDashboard]
  );

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        refreshDashboard();
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  const value: ExecutiveContextState = {
    dashboardData,
    loading,
    error,
    timeFrame,
    loadDashboard,
    refreshDashboard,
    setTimeFrame,
    acknowledgeAlert,
    dismissAlert,
  };

  return <ExecutiveContext.Provider value={value}>{children}</ExecutiveContext.Provider>;
};
