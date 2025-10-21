/**
 * Predictive Analytics View
 * NataCarePM - Phase 4: AI & Analytics
 *
 * Main UI for predictive analytics including cost forecasting,
 * schedule prediction, risk analysis, and quality forecasting
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Play,
  Target,
  Clock,
  ShieldAlert,
  Star,
  Activity,
} from 'lucide-react';
import { usePredictiveAnalytics } from '@/contexts/PredictiveAnalyticsContext';
import { useProject } from '@/contexts/ProjectContext';
import type { GenerateForecastRequest, ForecastType } from '@/types/predictive-analytics.types';

// ============================================================================
// Main Component
// ============================================================================

const PredictiveAnalyticsView: React.FC = () => {
  const {
    costForecasts,
    scheduleForecasts,
    riskForecasts,
    qualityForecasts,
    isLoading,
    error,
    generateForecast,
    clearError,
  } = usePredictiveAnalytics();

  const { currentProject } = useProject();

  const [activeTab, setActiveTab] = useState<'cost' | 'schedule' | 'risk' | 'quality'>('cost');
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [forecastType, setForecastType] = useState<ForecastType>('cost');
  const [forecastHorizon, setForecastHorizon] = useState<string>('90');

  // Get latest forecasts
  const latestCostForecast = costForecasts[costForecasts.length - 1];
  const latestScheduleForecast = scheduleForecasts[scheduleForecasts.length - 1];
  const latestRiskForecast = riskForecasts[riskForecasts.length - 1];
  const latestQualityForecast = qualityForecasts[qualityForecasts.length - 1];

  // Event Handlers
  const handleGenerateForecast = async () => {
    if (!currentProject?.id) {
      console.error('No project selected');
      return;
    }

    const request: GenerateForecastRequest = {
      projectId: currentProject.id,
      forecastTypes: [forecastType],
      config: {
        forecastHorizon: parseInt(forecastHorizon),
      },
      includeExternalFactors: true,
    };

    try {
      await generateForecast(request);
      setForecastDialogOpen(false);
    } catch (err) {
      console.error('Forecast generation failed:', err);
    }
  };

  // Utility functions
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Predictive Analytics
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered forecasting for cost, schedule, risk, and quality
            </p>
          </div>
          <button
            onClick={() => setForecastDialogOpen(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Generate Forecast
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mt-4">
          <button
            onClick={() => setActiveTab('cost')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'cost'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Cost Forecast
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule Forecast
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'risk'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Risk Forecast
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'quality'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            Quality Forecast
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Cost Forecast Tab */}
        {activeTab === 'cost' && (
          <div className="space-y-6">
            {latestCostForecast ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Forecast Cost
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(latestCostForecast.totalForecastCost)}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Projected Overrun
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(latestCostForecast.projectedOverrun)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {latestCostForecast.projectedOverrunPercentage.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Confidence Score
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(latestCostForecast.confidenceScore * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Risk Level
                      </span>
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(latestCostForecast.riskLevel)}`}
                    >
                      {latestCostForecast.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Warnings */}
                {latestCostForecast.warnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                          Forecast Warnings
                        </h3>
                        <ul className="space-y-1">
                          {latestCostForecast.warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400">
                              • <strong>{warning.category}:</strong> {warning.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Predictions Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Cost Predictions by Category
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Predicted Cost
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Cumulative Cost
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Variance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {latestCostForecast.predictions.map((pred, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(pred.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                              {formatCurrency(pred.predictedCost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                              {formatCurrency(pred.cumulativeCost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span
                                className={pred.variance > 0 ? 'text-red-600' : 'text-green-600'}
                              >
                                {pred.variance > 0 ? '+' : ''}
                                {formatCurrency(pred.variance)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Cost Forecasts Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Generate your first cost forecast to see predictions and insights
                </p>
                <button
                  onClick={() => {
                    setForecastType('cost');
                    setForecastDialogOpen(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Cost Forecast
                </button>
              </div>
            )}
          </div>
        )}

        {/* Schedule Forecast Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {latestScheduleForecast ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Predicted Completion
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatDate(latestScheduleForecast.predictedCompletionDate)}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Delay Days
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {latestScheduleForecast.delayDays} days
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        On-Time Probability
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(latestScheduleForecast.onTimeProbability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Schedule Forecasts Available
                </h3>
                <button
                  onClick={() => {
                    setForecastType('schedule');
                    setForecastDialogOpen(true);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate Schedule Forecast
                </button>
              </div>
            )}
          </div>
        )}

        {/* Risk & Quality Tabs - Similar structure */}
        {activeTab === 'risk' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <ShieldAlert className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Risk Forecast Coming Soon
            </h3>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Quality Forecast Coming Soon
            </h3>
          </div>
        )}
      </div>

      {/* Forecast Generation Dialog */}
      {forecastDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Generate Forecast
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forecast Type
                </label>
                <select
                  value={forecastType}
                  onChange={(e) => setForecastType(e.target.value as ForecastType)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="cost">Cost Forecast</option>
                  <option value="schedule">Schedule Forecast</option>
                  <option value="risk">Risk Forecast</option>
                  <option value="quality">Quality Forecast</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forecast Horizon (days)
                </label>
                <input
                  type="number"
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(e.target.value)}
                  min="30"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setForecastDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateForecast}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalyticsView;
