// React default import removed (using automatic JSX runtime)
import { useState, useEffect, useMemo } from 'react';
import { Project, ProjectMetrics, Notification, AiInsight } from '@/types';
import { StatCard } from '@/components/StatCard';
import { RadialProgress } from '@/components/GaugeChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Progress } from '@/components/Progress';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormControls';
import { Spinner } from '@/components/Spinner';
import { formatCurrency, formatDate } from '@/constants';
import {
  DollarSign,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Target,
  FileText,
  Bell,
  Settings,
  Fullscreen,
  Minimize,
  RotateCcw,
} from 'lucide-react';

interface DashboardViewProps {
  projectMetrics: ProjectMetrics;
  recentReports: any[];
  notifications: Notification[];
  project: Project;
  updateAiInsight: () => Promise<void>;
}

interface DashboardFilters {
  dateRange: {
    from: string;
    to: string;
  };
  showCompleted: boolean;
  showOverdue: boolean;
  metricType: 'all' | 'financial' | 'progress' | 'team';
  refreshInterval: number; // in seconds, 0 means manual only
}

interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  position: { x: number; y: number; w: number; h: number };
}

const defaultFilters: DashboardFilters = {
  dateRange: {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  },
  showCompleted: true,
  showOverdue: true,
  metricType: 'all',
  refreshInterval: 30,
};

const defaultWidgets: WidgetConfig[] = [
  {
    id: 'overview',
    title: 'Project Overview',
    visible: true,
    position: { x: 0, y: 0, w: 12, h: 3 },
  },
  { id: 'metrics', title: 'Key Metrics', visible: true, position: { x: 0, y: 3, w: 8, h: 4 } },
  { id: 'ai-insights', title: 'AI Insights', visible: true, position: { x: 8, y: 3, w: 4, h: 4 } },
  { id: 'progress', title: 'Progress Chart', visible: true, position: { x: 0, y: 7, w: 6, h: 4 } },
  {
    id: 'notifications',
    title: 'Recent Notifications',
    visible: true,
    position: { x: 6, y: 7, w: 6, h: 4 },
  },
  { id: 'reports', title: 'Recent Reports', visible: true, position: { x: 0, y: 11, w: 12, h: 3 } },
];

const AiInsightWidget = ({
  insight,
  onRefresh,
  isLoading,
}: {
  insight?: AiInsight;
  onRefresh: () => void;
  isLoading: boolean;
}) => (
  <Card className="flex flex-col h-full">
    <CardHeader>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-persimmon" />
          <CardTitle>AI Project Insights</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <CardDescription>Analisis dan prediksi oleh Google Gemini</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      ) : !insight ? (
        <p className="text-sm text-palladium text-center">
          Belum ada insight. Klik refresh untuk menghasilkan.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-night-black">Ringkasan</h4>
            <p className="text-palladium">{insight.summary}</p>
          </div>
          <div>
            <h4 className="font-semibold text-night-black">Potensi Risiko</h4>
            <ul className="list-disc list-inside text-palladium space-y-1">
              {insight.risks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-night-black">Rekomendasi</h4>
            <ul className="list-disc list-inside text-palladium space-y-1">
              {insight.recommendations?.map((rec, i) => <li key={i}>{rec}</li>) || []}
            </ul>
          </div>
          <div className="text-xs text-palladium mt-4">
            Diperbarui: {insight.timestamp ? formatDate(insight.timestamp) : 'Unknown'}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function DashboardView({
  projectMetrics,
  recentReports,
  notifications,
  project,
  updateAiInsight,
}: DashboardViewProps) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || filters.refreshInterval === 0) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // In real implementation, this would trigger data refresh
    }, filters.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [filters.refreshInterval, autoRefresh]);

  // Filtered metrics based on date range and filters
  const filteredMetrics = useMemo(() => {
    const fromDate = new Date(filters.dateRange.from);
    const toDate = new Date(filters.dateRange.to);

    // In real implementation, this would filter actual data
    const budgetUtilization = projectMetrics.totalBudget > 0 
      ? (projectMetrics.actualCost / projectMetrics.totalBudget) * 100 
      : 0;
    
    const schedulePerformance = projectMetrics.evm?.spi 
      ? projectMetrics.evm.spi * 100 
      : 100;
    
    const cpi = projectMetrics.evm?.cpi 
      ? projectMetrics.evm.cpi.toFixed(2) 
      : '1.00';
    
    const spi = projectMetrics.evm?.spi 
      ? projectMetrics.evm.spi.toFixed(2) 
      : '1.00';
    
    return {
      ...projectMetrics,
      // Additional calculated metrics with safe fallbacks
      totalCost: projectMetrics.actualCost || 0,
      budgetUtilization: isFinite(budgetUtilization) ? budgetUtilization : 0,
      schedulePerformance: isFinite(schedulePerformance) ? schedulePerformance : 100,
      cpi: cpi,
      spi: spi,
      // Apply date filtering logic here
      filteredReports: recentReports.filter((report) => {
        const reportDate = new Date(report.date);
        return reportDate >= fromDate && reportDate <= toDate;
      }),
      filteredNotifications: notifications.filter((notif) => {
        const notifDate = new Date(notif.timestamp);
        return notifDate >= fromDate && notifDate <= toDate;
      }),
    };
  }, [projectMetrics, recentReports, notifications, filters]);

  // Widget visibility management
  const visibleWidgets = widgets.filter((w) => w.visible);

  const handleExportData = () => {
    const exportData = {
      metrics: filteredMetrics,
      filters: filters,
      exportDate: new Date().toISOString(),
      project: {
        name: project.name,
        id: project.id,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-export-${project.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetLayout = () => {
    setWidgets(defaultWidgets);
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, visible: !w.visible } : w)));
  };

  const updateFilter = (key: keyof DashboardFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefreshInsights = async () => {
    setIsLoading(true);
    try {
      await updateAiInsight();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Enterprise Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdated.toLocaleTimeString('id-ID')}
              {autoRefresh && <span className="text-green-600 text-xs ml-2">• Auto-refresh enabled</span>}
            </p>
          </div>

          {/* Real-time status indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}
            ></div>
            <span className="text-xs text-palladium">{autoRefresh ? 'Live' : 'Manual'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <Input
              type="date"
              value={filters.dateRange.from}
              onChange={(e) =>
                updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })
              }
              className="w-32 text-xs"
            />
            <span>to</span>
            <Input
              type="date"
              value={filters.dateRange.to}
              onChange={(e) =>
                updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })
              }
              className="w-32 text-xs"
            />
          </div>

          <Button
            variant={showFilters ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'text-green-600' : ''}`} />
            Auto Refresh
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            Layout
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Metric Type</label>
                <select
                  value={filters.metricType}
                  onChange={(e) => updateFilter('metricType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all">All Metrics</option>
                  <option value="financial">Financial</option>
                  <option value="progress">Progress</option>
                  <option value="team">Team</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Refresh Interval</label>
                <select
                  value={filters.refreshInterval}
                  onChange={(e) => updateFilter('refreshInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>Manual Only</option>
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.showCompleted}
                    onChange={(e) => updateFilter('showCompleted', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show Completed</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.showOverdue}
                    onChange={(e) => updateFilter('showOverdue', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show Overdue</span>
                </label>
              </div>

              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setFilters(defaultFilters)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widget Settings Panel */}
      {showSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Widget Settings
              <Button variant="outline" size="sm" onClick={handleResetLayout}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Layout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {widgets.map((widget) => (
                <label key={widget.id} className="flex items-center gap-2 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={widget.visible}
                    onChange={() => toggleWidget(widget.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{widget.title}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Dashboard Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Project Overview - Always Visible */}
          {visibleWidgets.find((w) => w.id === 'overview')?.visible && (
            <div className="lg:col-span-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Project Overview</span>
                    <div className="flex items-center gap-2 text-sm text-palladium">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>On Track</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Total Progress"
                      value={`${filteredMetrics.overallProgress}%`}
                      icon={Target}
                      trend={+2.5}
                      className="border-l-4 border-l-green-500"
                    />
                    <StatCard
                      title="Budget Spent"
                      value={formatCurrency(filteredMetrics.totalCost)}
                      icon={DollarSign}
                      trend={-1.2}
                      className="border-l-4 border-l-blue-500"
                    />
                    <StatCard
                      title="Active Tasks"
                      value="24"
                      icon={CheckCircle}
                      trend={+5}
                      className="border-l-4 border-l-orange-500"
                    />
                    <StatCard
                      title="Team Members"
                      value={project.members.length.toString()}
                      icon={Users}
                      trend={0}
                      className="border-l-4 border-l-purple-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Key Metrics */}
          {visibleWidgets.find((w) => w.id === 'metrics')?.visible && (
            <div className="lg:col-span-8">
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                  <CardDescription>
                    Real-time metrics for {filters.dateRange.from} to {filters.dateRange.to}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <RadialProgress
                          title="Progress Keseluruhan"
                          description={`${filteredMetrics.overallProgress}% dari target`}
                          value={filteredMetrics.overallProgress}
                          className="text-center"
                        />
                        <p className="text-sm font-semibold mt-2">Overall Progress</p>
                      </div>
                      <div className="text-center">
                        <RadialProgress
                          title="Budget Utilization"
                          description={`${filteredMetrics.budgetUtilization.toFixed(1)}% dari total budget`}
                          value={filteredMetrics.budgetUtilization}
                          color="stroke-blue-500"
                          className="mx-auto"
                        />
                      </div>
                      <div className="text-center">
                        <RadialProgress
                          title="Schedule Performance"
                          description={`${filteredMetrics.schedulePerformance.toFixed(1)}% jadwal sesuai target`}
                          value={filteredMetrics.schedulePerformance}
                          color="stroke-yellow-500"
                          className="mx-auto"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold break-words">Cost Performance Index</p>
                        <p className="text-2xl font-bold text-green-600">{filteredMetrics.cpi}</p>
                        <p className="text-xs text-palladium">Target: ≥ 1.0</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold break-words">Schedule Performance Index</p>
                        <p className="text-2xl font-bold text-orange-600">{filteredMetrics.spi}</p>
                        <p className="text-xs text-palladium">Target: ≥ 1.0</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Insights */}
          {visibleWidgets.find((w) => w.id === 'ai-insights')?.visible && (
            <div className="lg:col-span-4">
              <AiInsightWidget
                insight={project.aiInsight}
                onRefresh={handleRefreshInsights}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Progress Timeline */}
          {visibleWidgets.find((w) => w.id === 'progress')?.visible && (
            <div className="lg:col-span-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progress Timeline</CardTitle>
                  <CardDescription>Weekly progress over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredMetrics.filteredReports?.slice(0, 5).map((report, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-persimmon rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Week {index + 1}</span>
                            <span className="text-xs text-palladium">
                              {formatDate(report.date)}
                            </span>
                          </div>
                          <Progress value={Math.min(100, 20 + index * 15)} className="mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Notifications */}
          {visibleWidgets.find((w) => w.id === 'notifications')?.visible && (
            <div className="lg:col-span-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Notifications</span>
                    <Button variant="ghost" size="sm">
                      <Bell className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredMetrics.filteredNotifications
                      ?.slice(0, 5)
                      .map((notification, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 border rounded">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'error'
                                ? 'bg-red-500'
                                : notification.type === 'warning'
                                  ? 'bg-yellow-500'
                                  : notification.type === 'success'
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                            }`}
                          ></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-palladium">{notification.message}</p>
                            <p className="text-xs text-palladium mt-1">
                              {formatDate(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Reports */}
          {visibleWidgets.find((w) => w.id === 'reports')?.visible && (
            <div className="lg:col-span-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Reports</span>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Progress</th>
                          <th className="text-left p-2">Issues</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMetrics.filteredReports?.slice(0, 8).map((report, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2">{formatDate(report.date)}</td>
                            <td className="p-2">Daily Report</td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Progress value={Math.min(100, 15 + index * 10)} className="w-20" />
                                <span>{Math.min(100, 15 + index * 10)}%</span>
                              </div>
                            </td>
                            <td className="p-2">{report.issues?.length || 0} issues</td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  index % 3 === 0
                                    ? 'bg-green-100 text-green-700'
                                    : index % 3 === 1
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {index % 3 === 0
                                  ? 'Completed'
                                  : index % 3 === 1
                                    ? 'In Progress'
                                    : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
