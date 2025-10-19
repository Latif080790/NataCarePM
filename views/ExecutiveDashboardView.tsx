/**
 * Executive Dashboard View
 * Phase 3.5: Quick Wins - Executive Dashboard
 * 
 * C-level dashboard with real-time KPIs, charts, and alerts
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Clock,
  Users,
  Shield,
  Activity,
  Target,
  BarChart3,
  PieChart,
  Bell,
} from 'lucide-react';
import { useExecutive } from '@/contexts/ExecutiveContext';
import type { ExecutiveKPI, KPIStatus, KPITrend, ExecutiveAlert } from '@/types/executive.types';
import { format } from 'date-fns';

const ExecutiveDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const {
    dashboardData,
    loading,
    error,
    timeFrame,
    setTimeFrame,
    refreshDashboard,
    acknowledgeAlert,
    dismissAlert,
  } = useExecutive();

  // Filter critical alerts
  const criticalAlerts = useMemo(() => {
    return dashboardData?.alerts.filter(a => a.type === 'critical' && !a.acknowledged) || [];
  }, [dashboardData]);

  // Get KPI category icon
  const getKPIIcon = (category: string) => {
    switch (category) {
      case 'financial': return DollarSign;
      case 'schedule': return Clock;
      case 'quality': return Target;
      case 'safety': return Shield;
      case 'productivity': return Activity;
      case 'resource': return Users;
      default: return BarChart3;
    }
  };

  // Get status color
  const getStatusColor = (status: KPIStatus) => {
    const colors = {
      excellent: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      good: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      warning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      critical: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
  };

  // Get trend icon
  const getTrendIcon = (trend: KPITrend) => {
    return trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  };

  // Get alert color
  const getAlertColor = (type: ExecutiveAlert['type']) => {
    const colors = {
      critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
      success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    };
    return colors[type] || 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200';
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button onClick={() => refreshDashboard()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Last updated: {format(dashboardData.generatedAt, 'MMM d, yyyy HH:mm')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Frame Selector */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['today', 'week', 'month', 'quarter', 'year'] as const).map((frame) => (
                <button
                  key={frame}
                  onClick={() => setTimeFrame(frame)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    timeFrame === frame
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {frame.charAt(0).toUpperCase() + frame.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => refreshDashboard()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Require Attention
                </h3>
                {criticalAlerts.slice(0, 2).map((alert) => (
                  <p key={alert.id} className="text-sm text-red-800 dark:text-red-300">• {alert.title}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashboardData.kpis.map((kpi) => {
            const Icon = getKPIIcon(kpi.category);
            const TrendIcon = getTrendIcon(kpi.trend);
            return (
              <div key={kpi.id} className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${getStatusColor(kpi.status)} p-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(kpi.status)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendIcon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{kpi.trendPercentage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpi.value.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">{kpi.unit}</span>
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{kpi.name}</div>
                {kpi.description && (
                  <p className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                    {kpi.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Portfolio & Financial */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Portfolio */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Project Portfolio
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.portfolio.totalProjects}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dashboardData.portfolio.activeProjects}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dashboardData.portfolio.completedProjects}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  ${(dashboardData.portfolio.totalValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Budget</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${(dashboardData.financial.totalBudget / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Actual Cost</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  ${(dashboardData.financial.actualCost / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Variance</span>
                <span className={`font-semibold ${dashboardData.financial.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {dashboardData.financial.variance >= 0 ? '+' : ''}${(dashboardData.financial.variance / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        {dashboardData.alerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Active Alerts ({dashboardData.alerts.filter(a => !a.acknowledged).length})
            </h2>
            <div className="space-y-3">
              {dashboardData.alerts.filter(a => !a.acknowledged).slice(0, 5).map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-semibold uppercase">{alert.category}</span>
                      <h3 className="font-semibold mb-1">{alert.title}</h3>
                      <p className="text-sm opacity-90">{alert.message}</p>
                      <div className="mt-2 text-xs opacity-75">{format(alert.createdAt, 'MMM d, HH:mm')}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => acknowledgeAlert(alert.id)} className="text-xs px-3 py-1 bg-white dark:bg-gray-800 border border-current rounded">
                        Acknowledge
                      </button>
                      <button onClick={() => dismissAlert(alert.id)} className="text-xs px-3 py-1 bg-white dark:bg-gray-800 border border-current rounded">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDashboardView;
