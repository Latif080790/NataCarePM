import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
  Zap,
} from 'lucide-react';
import {
  CardPro,
  ButtonPro,
  StatCardPro,
  BadgePro,
  EnterpriseLayout,
  PageHeader,
  SectionLayout,
} from '@/components/DesignSystem';
import MonitoringDashboard from '@/components/MonitoringDashboard';
import {
  useSystemHealth,
  useDashboardAnalytics,
  useErrorLogs,
  useSystemMetrics,
} from '@/hooks/useMonitoring';

interface MonitoringViewProProps {
  className?: string;
}

type TimeRange = 'hour' | 'day' | 'week' | 'month';

interface ErrorLog {
  id: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  resolved: boolean;
}

export const MonitoringViewPro: React.FC<MonitoringViewProProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
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

  const getHealthStatus = (): 'success' | 'warning' | 'error' | 'default' => {
    if (!health) return 'default';
    switch (health.status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getHealthIcon = () => {
    switch (health?.status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  // Error logs table columns
  const errorColumns: ColumnDef<ErrorLog>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {new Date(row.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => {
        const severityMap = {
          low: 'info',
          medium: 'warning',
          high: 'error',
          critical: 'error',
        } as const;
        return (
          <BadgeStatus variant={severityMap[row.severity]}>
            {row.severity.toUpperCase()}
          </BadgeStatus>
        );
      },
    },
    {
      key: 'component',
      header: 'Component',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.component || 'System'}</span>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (row) => (
        <span className="text-sm text-gray-900 truncate max-w-md">{row.message}</span>
      ),
    },
    {
      key: 'resolved',
      header: 'Status',
      render: (row) => (
        <BadgeStatus status={row.resolved ? 'success' : 'warning'}>
          {row.resolved ? 'Resolved' : 'Pending'}
        </BadgeStatus>
      ),
    },
  ];

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'hour', label: 'Last Hour' },
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const isLoading = healthLoading || analyticsLoading || metricsLoading;

  return (
    <EnterpriseLayout maxWidth="full" className={className}>
      {/* Page Header */}
      <PageHeader
        title="System Monitoring"
        subtitle="Real-time monitoring and analytics for NataCarePM"
        icon={<Activity className="w-8 h-8" />}
        actions={
          <div className="flex items-center gap-3">
            {/* System Health Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-soft">
              {healthLoading ? (
                <SpinnerPro size="sm" />
              ) : (
                getHealthIcon()
              )}
              <span className="text-sm font-medium text-gray-900">
                {healthLoading ? 'Checking...' : health?.status || 'Unknown'}
              </span>
              {health?.status === 'healthy' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Refresh Button */}
            <ButtonPro
              variant="outline"
              onClick={handleRefreshAll}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </ButtonPro>

            {/* Advanced Settings */}
            <ButtonPro
              variant={showAdvanced ? 'primary' : 'outline'}
              onClick={() => setShowAdvanced(!showAdvanced)}
              leftIcon={<Settings className="w-4 h-4" />}
            >
              Advanced
            </ButtonPro>
          </div>
        }
      />

      {/* Time Range Filter */}
      <SectionLayout variant="compact">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex bg-white rounded-lg border border-gray-200 shadow-soft overflow-hidden">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  timeRange === option.value
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </SectionLayout>

      {/* Critical Alerts */}
      {health?.status === 'critical' && (
        <AlertPro
          type="error"
          title="Critical System Issue Detected"
          message="Immediate attention required. Check error logs for details."
          action={
            <ButtonPro variant="error" size="sm">
              View Details
            </ButtonPro>
          }
        />
      )}

      {/* Quick Stats */}
      <SectionLayout title="System Metrics">
        <GridLayout cols={4}>
          <StatCardPro
            title="Active Users"
            value={currentMetrics?.activeUsers || 0}
            icon={<Users className="w-5 h-5" />}
            trend={currentMetrics?.activeUsers ? 'up' : undefined}
            trendValue={12}
            loading={metricsLoading}
            variant="primary"
          />

          <StatCardPro
            title="Total Activities"
            value={analytics?.summary?.totalActivities || 0}
            subtitle={`in ${timeRange}`}
            icon={<Activity className="w-5 h-5" />}
            trend="up"
            trendValue={8}
            loading={analyticsLoading}
            variant="success"
          />

          <StatCardPro
            title="Unresolved Errors"
            value={errors.length}
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={errors.length > 10 ? 'up' : 'down'}
            trendValue={errors.length > 10 ? 15 : 5}
            loading={errorsLoading}
            variant={errors.length > 10 ? 'error' : 'warning'}
          />

          <StatCardPro
            title="Response Time"
            value={currentMetrics ? `${Math.round(currentMetrics.responseTime)}ms` : '0ms'}
            icon={<Zap className="w-5 h-5" />}
            trend={currentMetrics && currentMetrics.responseTime < 200 ? 'down' : 'up'}
            trendValue={currentMetrics ? Math.round((currentMetrics.responseTime / 200) * 10) : 0}
            loading={metricsLoading}
            variant="info"
          />
        </GridLayout>
      </SectionLayout>

      {/* Advanced Controls */}
      {showAdvanced && (
        <SectionLayout
          title="Advanced Controls"
          description="Configure monitoring settings and thresholds"
        >
          <CardPro>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Monitoring Interval
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all">
                  <option value="30000">30 seconds</option>
                  <option value="60000">1 minute</option>
                  <option value="300000">5 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Alert Threshold
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all">
                  <option value="error">Error only</option>
                  <option value="warning">Warning & Error</option>
                  <option value="info">All notifications</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Auto-Refresh
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-600">Enable auto-refresh</span>
                </div>
              </div>
            </div>
          </CardPro>
        </SectionLayout>
      )}

      {/* Main Monitoring Dashboard */}
      <SectionLayout title="Monitoring Dashboard">
        <MonitoringDashboard />
      </SectionLayout>

      {/* Error Logs Table */}
      <SectionLayout
        title="Recent Error Logs"
        description="Latest system errors and warnings"
        actions={
          <ButtonPro variant="outline" size="sm">
            <TrendingUp className="w-4 h-4" />
            Export Logs
          </ButtonPro>
        }
      >
        {errorsLoading ? (
          <SpinnerPro overlay text="Loading error logs..." />
        ) : errors.length === 0 ? (
          <AlertPro
            type="success"
            title="No Errors Found"
            message="System is running smoothly with no recent errors."
          />
        ) : (
          <TablePro
            data={errors as ErrorLog[]}
            columns={errorColumns}
            searchable
            searchPlaceholder="Search errors..."
          />
        )}
      </SectionLayout>

      {/* Performance Metrics */}
      <SectionLayout title="Performance Overview">
        <GridLayout cols={2}>
          <CardPro>
            <CardPro.Header
              title="System Health Score"
              subtitle="Overall system performance"
            />
            <CardPro.Content>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600">
                    {health?.score || 0}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Health Score</div>
                  <BadgeStatus status={getHealthStatus()} className="mt-4">
                    {health?.status || 'Unknown'}
                  </BadgeStatus>
                </div>
              </div>
            </CardPro.Content>
          </CardPro>

          <CardPro>
            <CardPro.Header
              title="Resource Usage"
              subtitle="Current system resource consumption"
            />
            <CardPro.Content>
              <div className="space-y-4">
                {[
                  { label: 'CPU', value: currentMetrics?.cpu || 0, max: 100, color: 'bg-blue-500' },
                  { label: 'Memory', value: currentMetrics?.memory || 0, max: 100, color: 'bg-green-500' },
                  { label: 'Storage', value: currentMetrics?.storage || 0, max: 100, color: 'bg-purple-500' },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <span className="text-sm font-bold text-gray-900">{metric.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${metric.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardPro.Content>
          </CardPro>
        </GridLayout>
      </SectionLayout>
    </EnterpriseLayout>
  );
};

export default MonitoringViewPro;
