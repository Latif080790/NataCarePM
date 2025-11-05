import React, { useState, useEffect } from 'react';

import { Card } from './Card';
import { Button } from './Button';
import { LineChart } from './LineChart';
import { GaugeChart } from './GaugeChart';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Calculator,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { EVMService } from '@/api/evmService';
import { EVMMetrics, EVMTrendData, Task, RabItem } from '@/types';

interface EVMDashboardProps {
  projectId: string;
  tasks: Task[];
  rabItems: RabItem[];
  actualCosts: { [taskId: string]: number };
  projectStartDate: Date;
  budgetAtCompletion: number;
  historicalData?: { date: Date; costs: { [taskId: string]: number } }[];
  onMetricsUpdate?: (metrics: EVMMetrics) => void;
}

export const EVMDashboard: React.FC<EVMDashboardProps> = ({
  projectId,
  tasks,
  rabItems,
  actualCosts,
  projectStartDate,
  budgetAtCompletion,
  historicalData = [],
  onMetricsUpdate,
}) => {
  const [evmMetrics, setEvmMetrics] = useState<EVMMetrics | null>(null);
  const [trendData, setTrendData] = useState<EVMTrendData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'forecast' | 'analysis'>(
    'overview'
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    calculateEVMMetrics();
  }, [projectId, tasks, rabItems, actualCosts]);

  const calculateEVMMetrics = async () => {
    setIsLoading(true);
    try {
      const metrics = EVMService.calculateEVMMetrics(projectId, {
        tasks,
        rabItems,
        actualCosts,
        currentDate: new Date(),
        projectStartDate,
        budgetAtCompletion,
      });

      setEvmMetrics(metrics);
      onMetricsUpdate?.(metrics);

      // Generate trend data if historical data is available
      if (historicalData.length > 0) {
        const trends = EVMService.generateEVMTrendData(
          tasks,
          rabItems,
          historicalData,
          projectStartDate,
          budgetAtCompletion
        );
        setTrendData(trends);
      }
    } catch (error) {
      console.error('Error calculating EVM metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, type: 'index' | 'variance') => {
    if (type === 'index') {
      if (value >= 1.0) return 'text-green-600';
      if (value >= 0.9) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      // variance
      if (value >= 0) return 'text-green-600';
      if (value >= -0.1 * budgetAtCompletion) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Track':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'At Risk':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'Critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const prepareTrendChartData = () => {
    if (trendData.length === 0) return { planned: [], actual: [] };

    return {
      planned: trendData.map((data, index) => ({
        day: index + 1,
        cost: data.plannedValue,
      })),
      actual: trendData.map((data, index) => ({
        day: index + 1,
        cost: data.earnedValue,
      })),
    };
  };

  const preparePerformanceChartData = () => {
    if (trendData.length === 0) return { planned: [], actual: [] };

    return {
      planned: trendData.map((data, index) => ({
        day: index + 1,
        cost: data.cpi,
      })),
      actual: trendData.map((data, index) => ({
        day: index + 1,
        cost: data.spi,
      })),
    };
  };

  if (!evmMetrics) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Calculating EVM metrics...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(evmMetrics.performanceStatus)}
              <span className="font-medium text-gray-900">
                Project Status: {evmMetrics.performanceStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Health Score: {evmMetrics.healthScore}/100
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calculateEVMMetrics} disabled={isLoading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'forecast', label: 'Forecast', icon: Calendar },
            { id: 'analysis', label: 'Analysis', icon: Calculator },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key EVM Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Planned Value (PV)</h3>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(evmMetrics.plannedValue)}
              </div>
              <p className="text-sm text-gray-600">
                {formatPercentage(evmMetrics.plannedValue / budgetAtCompletion)} of budget
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Earned Value (EV)</h3>
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(evmMetrics.earnedValue)}
              </div>
              <p className="text-sm text-gray-600">
                {formatPercentage(evmMetrics.earnedValue / budgetAtCompletion)} completed
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Actual Cost (AC)</h3>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(evmMetrics.actualCost)}
              </div>
              <p className="text-sm text-gray-600">
                {formatPercentage(evmMetrics.actualCost / budgetAtCompletion)} spent
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Budget at Completion</h3>
                <Calculator className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(budgetAtCompletion)}
              </div>
              <p className="text-sm text-gray-600">Total project budget</p>
            </Card>
          </div>

          {/* Performance Indices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Performance Index (CPI)</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {evmMetrics.costPerformanceIndex.toFixed(2)}
                </div>
                <div className="flex items-center">
                  {evmMetrics.costPerformanceIndex >= 1.0 ? (
                    <ArrowUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className={getPerformanceColor(evmMetrics.costPerformanceIndex, 'index')}>
                    {evmMetrics.costPerformanceIndex >= 1.0 ? 'Under Budget' : 'Over Budget'}
                  </span>
                </div>
              </div>
              <div className="h-32">
                <GaugeChart
                  value={evmMetrics.costPerformanceIndex}
                  max={2}
                  thresholds={[0.8, 1.0, 1.2]}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                CPI = EV / AC = {formatCurrency(evmMetrics.earnedValue)} /{' '}
                {formatCurrency(evmMetrics.actualCost)}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Schedule Performance Index (SPI)</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  {evmMetrics.schedulePerformanceIndex.toFixed(2)}
                </div>
                <div className="flex items-center">
                  {evmMetrics.schedulePerformanceIndex >= 1.0 ? (
                    <ArrowUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-red-600" />
                  )}
                  <span
                    className={getPerformanceColor(evmMetrics.schedulePerformanceIndex, 'index')}
                  >
                    {evmMetrics.schedulePerformanceIndex >= 1.0
                      ? 'Ahead of Schedule'
                      : 'Behind Schedule'}
                  </span>
                </div>
              </div>
              <div className="h-32">
                <GaugeChart
                  value={evmMetrics.schedulePerformanceIndex}
                  max={2}
                  thresholds={[0.8, 1.0, 1.2]}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                SPI = EV / PV = {formatCurrency(evmMetrics.earnedValue)} /{' '}
                {formatCurrency(evmMetrics.plannedValue)}
              </p>
            </Card>
          </div>

          {/* Variances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cost Variance (CV)</h3>
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`text-3xl font-bold ${getPerformanceColor(evmMetrics.costVariance, 'variance')}`}
                >
                  {formatCurrency(evmMetrics.costVariance)}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {((evmMetrics.costVariance / budgetAtCompletion) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">of budget</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                CV = EV - AC = {formatCurrency(evmMetrics.earnedValue)} -{' '}
                {formatCurrency(evmMetrics.actualCost)}
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Under Budget</span>
                  <span>Over Budget</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      evmMetrics.costVariance >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(Math.abs(evmMetrics.costVariance / budgetAtCompletion) * 100 * 5, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Schedule Variance (SV)</h3>
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`text-3xl font-bold ${getPerformanceColor(evmMetrics.scheduleVariance, 'variance')}`}
                >
                  {formatCurrency(evmMetrics.scheduleVariance)}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{evmMetrics.timeVariance} days</div>
                  <div className="text-xs text-gray-500">time variance</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                SV = EV - PV = {formatCurrency(evmMetrics.earnedValue)} -{' '}
                {formatCurrency(evmMetrics.plannedValue)}
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Ahead</span>
                  <span>Behind</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      evmMetrics.scheduleVariance >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(Math.abs(evmMetrics.scheduleVariance / budgetAtCompletion) * 100 * 5, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </Card>
          </div>

          {/* Forecasts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Estimate at Completion (EAC)</h3>
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(evmMetrics.estimateAtCompletion)}
              </div>
              <p className="text-sm text-gray-600">Projected final cost</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Estimate to Complete (ETC)</h3>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(evmMetrics.estimateToComplete)}
              </div>
              <p className="text-sm text-gray-600">Remaining cost needed</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Variance at Completion (VAC)</h3>
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
              <div
                className={`text-2xl font-bold ${getPerformanceColor(evmMetrics.varianceAtCompletion, 'variance')}`}
              >
                {formatCurrency(evmMetrics.varianceAtCompletion)}
              </div>
              <p className="text-sm text-gray-600">Budget vs forecast variance</p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">EVM Trend Analysis</h3>
            <div className="h-80">
              <LineChart data={prepareTrendChartData()} width={800} height={320} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Index Trends</h3>
            <div className="h-80">
              <LineChart data={preparePerformanceChartData()} width={800} height={320} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Project Completion Forecast</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Time Forecast</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Time to Complete:</span>
                    <span className="font-medium">{evmMetrics.estimatedTimeToComplete} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Schedule Variance:</span>
                    <span
                      className={evmMetrics.timeVariance >= 0 ? 'text-green-600' : 'text-red-600'}
                    >
                      {evmMetrics.timeVariance} days
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Cost Forecast</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimate at Completion:</span>
                    <span className="font-medium">
                      {formatCurrency(evmMetrics.estimateAtCompletion)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget Variance:</span>
                    <span
                      className={
                        evmMetrics.varianceAtCompletion >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formatCurrency(evmMetrics.varianceAtCompletion)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Cost Performance</h4>
                <div className="space-y-2">
                  {evmMetrics.costPerformanceIndex >= 1.0 ? (
                    <div className="text-green-600 text-sm">
                      ✓ Project is performing under budget
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">⚠ Project is over budget</div>
                  )}
                  <p className="text-sm text-gray-600">
                    For every dollar spent, the project is earning $
                    {evmMetrics.costPerformanceIndex.toFixed(2)} worth of work.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Schedule Performance</h4>
                <div className="space-y-2">
                  {evmMetrics.schedulePerformanceIndex >= 1.0 ? (
                    <div className="text-green-600 text-sm">✓ Project is ahead of schedule</div>
                  ) : (
                    <div className="text-red-600 text-sm">⚠ Project is behind schedule</div>
                  )}
                  <p className="text-sm text-gray-600">
                    The project is progressing at{' '}
                    {(evmMetrics.schedulePerformanceIndex * 100).toFixed(0)}% of the planned rate.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
