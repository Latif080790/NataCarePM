import {
    generateCostAlerts,
    generateForecast,
    getCostControlSummary,
} from '@/api/costControlService';
import { useProject } from '@/contexts/ProjectContext';
import { useToast } from '@/contexts/ToastContext';
import {
    CostAlert,
    CostControlSummary,
} from '@/types/costControl';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    DollarSign,
    Download,
    RefreshCw,
    Target,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const CostControlDashboardView: React.FC = () => {
  const { currentProject } = useProject();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<CostControlSummary | null>(null);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'evm' | 'budget' | 'trends' | 'cashflow'
  >('overview');

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject]);

  const loadData = async () => {
    if (!currentProject) return;

    try {
      setIsLoading(true);
      const data = await getCostControlSummary(currentProject.id);
      setSummary(data);

      const generatedAlerts = generateCostAlerts(data.evmMetrics, data.budgetVsActual);
      setAlerts(generatedAlerts);
    } catch (error: any) {
      addToast('Failed to load cost control data', 'error');
      console.error('Error loading cost control data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!summary) return;

    try {
      addToast(`Exporting to ${format.toUpperCase()}...`, 'info');
      // Export functionality would be implemented here
    } catch (error: any) {
      addToast(`Export failed`, 'error');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      on_track: 'text-green-600',
      over_budget: 'text-red-600',
      under_budget: 'text-blue-600',
      behind_schedule: 'text-orange-600',
      ahead_of_schedule: 'text-green-600',
      critical: 'text-red-600',
      at_risk: 'text-orange-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
      on_track: 'bg-green-100 text-green-800',
      over_budget: 'bg-red-100 text-red-800',
      under_budget: 'bg-blue-100 text-blue-800',
      behind_schedule: 'bg-orange-100 text-orange-800',
      ahead_of_schedule: 'bg-green-100 text-green-800',
      critical: 'bg-red-100 text-red-800',
      at_risk: 'bg-orange-100 text-orange-800',
      within_budget: 'bg-green-100 text-green-800',
      near_limit: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Overview Tab
  const renderOverview = () => {
    if (!summary) return null;

    const { evmMetrics, totalBudget, totalActual } = summary;

    return (
      <div className="space-y-6">
        {/* Top-level KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Budget */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalBudget)}</p>
              </div>
              <Target className="w-10 h-10 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <span>BAC (Budget at Completion)</span>
              </div>
            </div>
          </div>

          {/* Actual Cost */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actual Cost</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalActual)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className={evmMetrics.cv >= 0 ? 'text-green-600' : 'text-red-600'}>
                  CV: {formatCurrency(evmMetrics.cv)}
                </span>
              </div>
            </div>
          </div>

          {/* CPI */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cost Performance</p>
                <p className={`text-2xl font-bold mt-1 ${getStatusColor(evmMetrics.status)}`}>
                  {evmMetrics.cpi.toFixed(2)}
                </p>
              </div>
              {evmMetrics.cpi >= 1 ? (
                <TrendingUp className="w-10 h-10 text-green-500" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-500" />
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <span>CPI (Cost Performance Index)</span>
              </div>
            </div>
          </div>

          {/* SPI */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Schedule Performance</p>
                <p className={`text-2xl font-bold mt-1 ${getStatusColor(evmMetrics.status)}`}>
                  {evmMetrics.spi.toFixed(2)}
                </p>
              </div>
              {evmMetrics.spi >= 1 ? (
                <TrendingUp className="w-10 h-10 text-green-500" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-500" />
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <span>SPI (Schedule Performance Index)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Earned Value */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Earned Value</p>
            <p className="text-xl font-bold mt-1 text-blue-900">{formatCurrency(evmMetrics.ev)}</p>
            <p className="text-xs text-blue-600 mt-2">EV (BCWP)</p>
          </div>

          {/* Planned Value */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium">Planned Value</p>
            <p className="text-xl font-bold mt-1 text-green-900">{formatCurrency(evmMetrics.pv)}</p>
            <p className="text-xs text-green-600 mt-2">PV (BCWS)</p>
          </div>

          {/* EAC */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 font-medium">Estimate at Completion</p>
            <p className="text-xl font-bold mt-1 text-orange-900">
              {formatCurrency(evmMetrics.eac)}
            </p>
            <p className="text-xs text-orange-600 mt-2">EAC (Forecast)</p>
          </div>

          {/* VAC */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 font-medium">Variance at Completion</p>
            <p
              className={`text-xl font-bold mt-1 ${evmMetrics.vac >= 0 ? 'text-purple-900' : 'text-red-900'}`}
            >
              {formatCurrency(evmMetrics.vac)}
            </p>
            <p className="text-xs text-purple-600 mt-2">VAC (BAC - EAC)</p>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold">Cost Alerts ({alerts.length})</h3>
            </div>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : alert.severity === 'high'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : alert.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <p className="font-medium text-gray-900">{alert.title}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {alert.affectedWBS && (
                        <p className="text-xs text-gray-500 mt-1">Affected: {alert.affectedWBS}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Score */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Project Health Score</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span
                      className={`text-3xl font-bold ${
                        evmMetrics.healthScore >= 80
                          ? 'text-green-600'
                          : evmMetrics.healthScore >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {evmMetrics.healthScore.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold inline-block py-1 px-2 rounded-full ${getStatusBadgeColor(evmMetrics.status)}`}
                    >
                      {evmMetrics.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${evmMetrics.healthScore}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      evmMetrics.healthScore >= 80
                        ? 'bg-green-500'
                        : evmMetrics.healthScore >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Cost Health: </span>
              <span
                className={`font-medium ${evmMetrics.cpi >= 0.95 ? 'text-green-600' : 'text-red-600'}`}
              >
                {evmMetrics.cpi >= 0.95 ? 'Good' : 'Poor'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Schedule Health: </span>
              <span
                className={`font-medium ${evmMetrics.spi >= 0.95 ? 'text-green-600' : 'text-red-600'}`}
              >
                {evmMetrics.spi >= 0.95 ? 'Good' : 'Poor'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress vs Spending */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Progress vs Spending</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Physical Progress</span>
                <span className="font-medium">{evmMetrics.percentComplete.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${evmMetrics.percentComplete}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Budget Spent</span>
                <span className="font-medium">{evmMetrics.percentSpent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    evmMetrics.percentSpent > evmMetrics.percentComplete + 10
                      ? 'bg-red-500'
                      : evmMetrics.percentSpent > evmMetrics.percentComplete + 5
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, evmMetrics.percentSpent)}%` }}
                ></div>
              </div>
            </div>
          </div>
          {evmMetrics.percentSpent > evmMetrics.percentComplete && (
            <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Spending is ahead of progress by{' '}
                {(evmMetrics.percentSpent - evmMetrics.percentComplete).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // EVM Tab
  const renderEVM = () => {
    if (!summary) return null;

    const { evmMetrics } = summary;
    const forecast = generateForecast(evmMetrics);

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-6">Earned Value Management (EVM) Analysis</h3>

          {/* EVM Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Planned Value */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Planned Value (PV)</span>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(evmMetrics.pv)}</p>
              <p className="text-xs text-blue-600 mt-1">BCWS - Budgeted Cost of Work Scheduled</p>
            </div>

            {/* Earned Value */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Earned Value (EV)</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(evmMetrics.ev)}</p>
              <p className="text-xs text-green-600 mt-1">BCWP - Budgeted Cost of Work Performed</p>
            </div>

            {/* Actual Cost */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">Actual Cost (AC)</span>
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(evmMetrics.ac)}</p>
              <p className="text-xs text-purple-600 mt-1">ACWP - Actual Cost of Work Performed</p>
            </div>
          </div>

          {/* Variance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Cost Variance Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost Variance (CV):</span>
                  <span
                    className={`font-bold ${evmMetrics.cv >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(evmMetrics.cv)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost Performance Index (CPI):</span>
                  <span
                    className={`font-bold ${evmMetrics.cpi >= 1 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {evmMetrics.cpi.toFixed(3)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    {evmMetrics.cpi >= 1
                      ? `Project is ${((evmMetrics.cpi - 1) * 100).toFixed(1)}% under budget`
                      : `Project is ${((1 - evmMetrics.cpi) * 100).toFixed(1)}% over budget`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Schedule Variance Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Schedule Variance (SV):</span>
                  <span
                    className={`font-bold ${evmMetrics.sv >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(evmMetrics.sv)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Schedule Performance Index (SPI):</span>
                  <span
                    className={`font-bold ${evmMetrics.spi >= 1 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {evmMetrics.spi.toFixed(3)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    {evmMetrics.spi >= 1
                      ? `Project is ${((evmMetrics.spi - 1) * 100).toFixed(1)}% ahead of schedule`
                      : `Project is ${((1 - evmMetrics.spi) * 100).toFixed(1)}% behind schedule`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Forecasting */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Cost Forecasting</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Budget at Completion (BAC)</p>
                <p className="text-xl font-bold">{formatCurrency(evmMetrics.bac)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Estimate at Completion (EAC)</p>
                <p className="text-xl font-bold">{formatCurrency(evmMetrics.eac)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Estimate to Complete (ETC)</p>
                <p className="text-xl font-bold">{formatCurrency(evmMetrics.etc)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Variance at Completion (VAC)</p>
                <p
                  className={`text-xl font-bold ${evmMetrics.vac >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(evmMetrics.vac)}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">To-Complete Performance Index (TCPI)</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {evmMetrics.tcpi.toFixed(3)}
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    Remaining work must be performed at {(evmMetrics.tcpi * 100).toFixed(1)}%
                    efficiency to meet budget
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="font-medium mb-4">Forecast Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">EAC by CPI Method</p>
              <p className="text-lg font-bold">{formatCurrency(forecast.eacByCPI)}</p>
              <p className="text-xs text-gray-500 mt-1">BAC / CPI</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">EAC by SPI Method</p>
              <p className="text-lg font-bold">{formatCurrency(forecast.eacBySPI)}</p>
              <p className="text-xs text-gray-500 mt-1">AC + (BAC - EV) / SPI</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">EAC by CPI×SPI Method</p>
              <p className="text-lg font-bold">{formatCurrency(forecast.eacByCPIAndSPI)}</p>
              <p className="text-xs text-gray-500 mt-1">AC + (BAC - EV) / (CPI × SPI)</p>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-1">
              Selected Forecast (CPI Method)
            </p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(forecast.selectedEAC)}
            </p>
            <p className="text-sm text-green-600 mt-2">
              Confidence Level: {forecast.confidenceLevel.toFixed(0)}% • Estimated completion in{' '}
              {forecast.daysRemaining} days
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Budget vs Actual Tab
  const renderBudget = () => {
    if (!summary) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Budget vs Actual by WBS</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    WBS Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Committed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.budgetVsActual.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.wbsCode}</td>
                    <td className="px-6 py-4">{item.categoryName}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.budgetAmount)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.actualAmount)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.committedAmount)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.remainingBudget)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={item.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(item.variance)} ({item.variancePercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600">Please select a project to view cost control dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Cost Control Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive cost analysis and earned value management
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'evm', label: 'EVM Analysis', icon: Target },
            { id: 'budget', label: 'Budget vs Actual', icon: DollarSign },
            { id: 'trends', label: 'Trends', icon: LineChartIcon },
            { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'evm' && renderEVM()}
      {selectedTab === 'budget' && renderBudget()}
      {selectedTab === 'trends' && (
        <div className="text-center text-gray-500 py-12">
          <LineChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>Trend analysis view - Coming soon with interactive charts</p>
        </div>
      )}
      {selectedTab === 'cashflow' && (
        <div className="text-center text-gray-500 py-12">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>Cash flow projection view - Coming soon with forecasting</p>
        </div>
      )}
    </div>
  );
};

export default CostControlDashboardView;

