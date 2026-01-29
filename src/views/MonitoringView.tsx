import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  CardPro,
  ButtonPro,
  StatCardPro,
  BadgeStatus,
  EnterpriseLayout,
  PageHeader,
  SectionLayout,
  TablePro,
  SpinnerPro,
  AlertPro,
  GridLayout,
} from '@/components/DesignSystem';
import type { ColumnDef } from '@/components/DesignSystem';
import MonitoringDashboard from '@/components/MonitoringDashboard';
import {
  useSystemHealth,
  useDashboardAnalytics,
  useErrorLogs,
  useSystemMetrics,
} from '@/hooks/useMonitoring';

interface MonitoringViewProps {
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

export const MonitoringView: React.FC<MonitoringViewProps> = ({ className = '' }) => {
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
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-error" />;
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
          low: 'default',
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
        <span className="text-sm text-night-black truncate max-w-md">{row.message}</span>
      ),
    },
    {
      key: 'resolved',
      header: 'Status',
      render: (row) => (
        <BadgeStatus variant={row.resolved ? 'success' : 'warning'}>
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
      <PageHeader
        title="System Monitoring"
        subtitle="Real-time monitoring and analytics for NataCarePM"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-soft">
              {healthLoading ? (
                <SpinnerPro size="sm" />
              ) : (
                getHealthIcon()
              )}
              <span className="text-sm font-medium text-night-black">
                {healthLoading ? 'Checking...' : health?.status || 'Unknown'}
              </span>
              {health?.status === 'healthy' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>

            <ButtonPro
              variant="outline"
              onClick={handleRefreshAll}
              disabled={isLoading}
              icon={RefreshCw}
            >
              Refresh
            </ButtonPro>

            <ButtonPro
              variant={showAdvanced ? 'primary' : 'outline'}
              onClick={() => setShowAdvanced(!showAdvanced)}
              icon={Settings}
            >
              Advanced
            </ButtonPro>
          </div>
        }
      />

      <SectionLayout>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex bg-white rounded-lg border border-gray-200 shadow-soft overflow-hidden">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${timeRange === option.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </SectionLayout>

      {health?.status === 'critical' && (
        <AlertPro
          variant="error"
          title="Critical System Issue Detected"
        >
          Immediate attention required. Check error logs for details.
        </AlertPro>
      )}

      <SectionLayout title="System Metrics">
        <GridLayout>
          <StatCardPro
            title="Active Users"
            value={currentMetrics?.activeUsers || 0}
            icon={Users}
            trend={currentMetrics?.activeUsers ? { value: 12, isPositiveGood: true } : undefined}
            isLoading={metricsLoading}
            variant="primary"
          />

          <StatCardPro
            title="Total Activities"
            value={analytics?.summary?.totalActivities || 0}
            icon={Activity}
            trend={{ value: 8, isPositiveGood: true }}
            isLoading={analyticsLoading}
            variant="success"
          />

          <StatCardPro
            title="Unresolved Errors"
            value={errors.length}
            icon={AlertTriangle}
            trend={errors.length > 10 ? { value: 15, isPositiveGood: false } : { value: 5, isPositiveGood: true }}
            isLoading={errorsLoading}
            variant={errors.length > 10 ? 'error' : 'warning'}
          />

          <StatCardPro
            title="Response Time"
            value={currentMetrics ? `${Math.round(currentMetrics.responseTime)}ms` : '0ms'}
            icon={Zap}
            trend={currentMetrics && currentMetrics.responseTime < 200 ? { value: Math.round((currentMetrics.responseTime / 200) * 10), isPositiveGood: true } : { value: 0, isPositiveGood: false }}
            isLoading={metricsLoading}
            variant="default"
          />
        </GridLayout>
      </SectionLayout>

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
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option value="30000">30 seconds</option>
                  <option value="60000">1 minute</option>
                  <option value="300000">5 minutes</option>
                </select>
              </div>

              {/* ... more inputs ... */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Auto-Refresh
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-600">Enable auto-refresh</span>
                </div>
              </div>
            </div>
          </CardPro>
        </SectionLayout>
      )}

      <SectionLayout title="Monitoring Dashboard">
        <MonitoringDashboard />
      </SectionLayout>

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
          <SpinnerPro />
        ) : errors.length === 0 ? (
          <AlertPro
            variant="success"
            title="No Errors Found"
          >
            System is running smoothly with no recent errors.
          </AlertPro>
        ) : (
          <TablePro
            data={errors as unknown as ErrorLog[]}
            columns={errorColumns}
            searchable
            searchPlaceholder="Search errors..."
            hoverable
            stickyHeader
            emptyMessage="No expenses recorded yet."
          />
        )}
      </SectionLayout>
    </EnterpriseLayout>
  );
};

export default MonitoringView;
