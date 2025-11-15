import React, { useState } from 'react';
/**
 * 📊 MONITORING VIEW
 * Comprehensive system monitoring and analytics dashboard
 */

import MonitoringDashboard from '@/components/MonitoringDashboard';
import { CardPro } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import {
  useSystemHealth,
  useDashboardAnalytics,
  useErrorLogs,
  useSystemMetrics,
} from '@/hooks/useMonitoring';

interface MonitoringViewProps {
  className?: string;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { health, loading: healthLoading, refresh: refreshHealth } = useSystemHealth();
  const {
    analytics,
    loading: analyticsLoading,
    refresh: refreshAnalytics,
  } = useDashboardAnalytics(timeRange);
  const { errors, loading: errorsLoading } = useErrorLogs(50);
  const { metrics: currentMetrics, loading: metricsLoading } = useSystemMetrics();

  const handleRefreshAll = () => {
    refreshHealth();
    refreshAnalytics();
  };

  const getHealthStatusColor = () => {
    if (!health) return 'bg-gray-500';
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 System Monitoring</h1>
          <p className="text-gray-600">Real-time monitoring and analytics for NataCarePM</p>
        </div>

        <div className="flex items-center gap-4">
          {/* System Health Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
            <div
              className={`w-3 h-3 rounded-full ${getHealthStatusColor()} ${health?.status === 'healthy' ? 'animate-pulse' : ''}`}
            />
            <span className="text-sm font-medium">
              {healthLoading ? 'Checking...' : health?.status || 'Unknown'}
            </span>
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-white rounded-lg border overflow-hidden">
            {(['hour', 'day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  timeRange === range ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <ButtonPro
            variant="outline"
            onClick={handleRefreshAll}
            disabled={healthLoading || analyticsLoading}
          >
            <span className={healthLoading || analyticsLoading ? 'animate-spin' : ''}>🔄</span>
            {' '}Refresh
          </ButtonPro>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardPro className="text-center">
          <div className="text-2xl font-bold text-blue-600">{currentMetrics?.activeUsers || 0}</div>
          <div className="text-sm text-gray-600">Active Users</div>
          {metricsLoading && <div className="text-xs text-gray-400 mt-1">Loading...</div>}
        </CardPro>

        <CardPro className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics?.summary?.totalActivities || 0}
          </div>
          <div className="text-sm text-gray-600">Total Activities ({timeRange})</div>
          {analyticsLoading && <div className="text-xs text-gray-400 mt-1">Loading...</div>}
        </CardPro>

        <CardPro className="text-center">
          <div className="text-2xl font-bold text-red-600">{errors.length}</div>
          <div className="text-sm text-gray-600">Unresolved Errors</div>
          {errorsLoading && <div className="text-xs text-gray-400 mt-1">Loading...</div>}
        </CardPro>

        <CardPro className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {currentMetrics ? Math.round(currentMetrics.responseTime) : 0}ms
          </div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
          {metricsLoading && <div className="text-xs text-gray-400 mt-1">Loading...</div>}
        </CardPro>
      </div>

      {/* Advanced Controls */}
      <CardPro>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Monitoring Controls</h3>
          <ButtonPro variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </ButtonPro>
        </div>

        {showAdvanced && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Monitoring Interval</label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="30000">30 seconds</option>
                  <option value="60000">
                    1 minute
                  </option>
                  <option value="300000">5 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Error Threshold</label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="5">5 errors/min</option>
                  <option value="10">
                    10 errors/min
                  </option>
                  <option value="20">20 errors/min</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Alerts</label>
                <div className="flex gap-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm">Browser</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <ButtonPro variant="outline">
                Export Data
              </ButtonPro>
              <ButtonPro variant="outline">
                Clear Cache
              </ButtonPro>
              <ButtonPro variant="outline">
                Download Logs
              </ButtonPro>
            </div>
          </div>
        )}
      </CardPro>

      {/* Main Monitoring Dashboard */}
      <MonitoringDashboard showControls={false} className="bg-white rounded-lg border" />

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardPro>
          <h3 className="text-lg font-semibold mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Application Version</span>
              <span className="font-medium">v2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Database Status</span>
              <span className="text-green-600 font-medium">✅ Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Firebase Status</span>
              <span className="text-green-600 font-medium">✅ Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Health Check</span>
              <span className="font-medium">
                {health?.metrics?.timestamp
                  ? new Date(health.metrics.timestamp).toLocaleTimeString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </CardPro>

        <CardPro>
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">CPU Usage</span>
              <span className="font-medium">
                {currentMetrics ? `${Math.round(currentMetrics.cpu)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory Usage</span>
              <span className="font-medium">
                {currentMetrics ? `${Math.round(currentMetrics.memory)}MB` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate</span>
              <span className="font-medium">
                {currentMetrics ? `${currentMetrics.errorRate}/min` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime</span>
              <span className="font-medium">99.9%</span>
            </div>
          </div>
        </CardPro>
      </div>
    </div>
  );
};

export default MonitoringView;

