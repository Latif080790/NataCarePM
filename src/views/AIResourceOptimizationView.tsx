/**
 * AI Resource Optimization View
 * NataCarePM - Phase 4: AI & Analytics
 *
 * Main UI for AI-powered resource optimization,
 * ML-based scheduling, and intelligent recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Sparkles,
  Clock,
  DollarSign,
  Users,
  Target,
  AlertCircle,
  Settings,
  Play,
} from 'lucide-react';
import { useAIResource } from '@/contexts/AIResourceContext';
import { useProject } from '@/contexts/ProjectContext';
import type {
  ResourceOptimizationRequest,
  OptimizationGoal,
  OptimizationResult,
  SchedulingRecommendation,
} from '@/types/ai-resource.types';

// ============================================================================
// Main Component
// ============================================================================

const AIResourceOptimizationView: React.FC = () => {
  const {
    models,
    optimizationResults,
    recommendations,
    resourceAllocations,
    bottlenecks,
    isLoading,
    error,
    initializeModels,
    requestOptimization,
    getRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    clearError,
  } = useAIResource();

  const { currentProject } = useProject();

  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'bottlenecks'>(
    'overview'
  );
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('balance_cost_time');
  const [budgetLimit, setBudgetLimit] = useState<string>('');

  // Initialize ML models on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeModels();
      } catch (err) {
        console.error('Failed to initialize AI models:', err);
      }
    };

    init();
  }, [initializeModels]);

  // Get latest optimization result
  const latestResult = optimizationResults[optimizationResults.length - 1];
  const pendingRecommendations = recommendations.filter((r) => r.status === 'pending');
  const criticalBottlenecks = bottlenecks.filter(
    (b) => b.severity === 'high' || b.severity === 'critical'
  );

  // Event Handlers
  const handleOptimizationRequest = async () => {
    if (!currentProject?.id) {
      console.error('No project selected');
      return;
    }

    const request: ResourceOptimizationRequest = {
      requestId: `opt_req_${Date.now()}`,
      projectIds: [currentProject.id],
      optimizationGoal,
      constraints: budgetLimit ? { budgetLimit: parseFloat(budgetLimit) } : {},
      preferences: {},
      timeHorizon: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
      requestedAt: new Date(),
      requestedBy: 'current_user',
    };

    try {
      await requestOptimization(request);
      setOptimizationDialogOpen(false);
    } catch (err) {
      console.error('Optimization request failed:', err);
    }
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      await acceptRecommendation(recommendationId);
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
    }
  };

  const handleRejectRecommendation = async (recommendationId: string) => {
    try {
      await rejectRecommendation(recommendationId);
    } catch (err) {
      console.error('Failed to reject recommendation:', err);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  // Loading state
  if (isLoading && !latestResult) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Initializing AI models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Resource Optimization
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ML-powered resource allocation and intelligent scheduling
            </p>
          </div>
          <button
            onClick={() => setOptimizationDialogOpen(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Run Optimization
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Recommendations
            {pendingRecommendations.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                {pendingRecommendations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bottlenecks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'bottlenecks'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Bottlenecks
            {criticalBottlenecks.length > 0 && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                {criticalBottlenecks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ML Models Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-200 dark:border-purple-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ML Models
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {models.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active & Ready</p>
              </div>

              {/* Optimizations Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Optimizations
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {optimizationResults.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Runs</p>
              </div>

              {/* Recommendations Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recommendations
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pendingRecommendations.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending Review</p>
              </div>

              {/* Bottlenecks Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-orange-200 dark:border-orange-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bottlenecks
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {criticalBottlenecks.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">High/Critical</p>
              </div>
            </div>

            {/* Latest Result */}
            {latestResult && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Latest Optimization Result
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      latestResult.status === 'success'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}
                  >
                    {latestResult.status.toUpperCase()}
                  </span>
                </div>

                {/* Confidence Score */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Confidence Score
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(latestResult.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${latestResult.confidenceScore * 100}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {latestResult.performanceMetrics.costSavingsPercentage.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Time Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {latestResult.performanceMetrics.timeSavings.toFixed(0)} hrs
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Utilization</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {latestResult.performanceMetrics.resourceUtilizationAvg.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {latestResult.warnings.length > 0 && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                          Warnings ({latestResult.warnings.length})
                        </h4>
                        {latestResult.warnings.slice(0, 3).map((warning, idx) => (
                          <p key={idx} className="text-sm text-yellow-800 dark:text-yellow-300">
                            • {warning.message}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Recommendations ({pendingRecommendations.length} pending)
              </h3>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {pendingRecommendations.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No pending recommendations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRecommendations.map((rec) => (
                  <div
                    key={rec.recommendationId}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}
                          >
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {rec.recommendationType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-white mb-2">{rec.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-3 h-3" />
                            <span>
                              {rec.estimatedImpact.costChange >= 0 ? '+' : ''}
                              {rec.estimatedImpact.costChange.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>
                              {rec.estimatedImpact.timeChange >= 0 ? '+' : ''}
                              {rec.estimatedImpact.timeChange.toFixed(0)}h
                            </span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {rec.affectedTasks.length} tasks • {rec.affectedResources.length}{' '}
                            resources
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleAcceptRecommendation(rec.recommendationId)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          title="Accept"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRejectRecommendation(rec.recommendationId)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottlenecks Tab */}
        {activeTab === 'bottlenecks' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resource Bottlenecks
            </h3>

            {bottlenecks.length === 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  No Bottlenecks Detected
                </h4>
                <p className="text-green-700 dark:text-green-300">
                  All resources are adequately allocated
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bottlenecks.map((bottleneck) => (
                  <div
                    key={bottleneck.bottleneckId}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {bottleneck.resourceName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bottleneck.resourceType.toUpperCase()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(bottleneck.severity)}`}
                      >
                        {bottleneck.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Demand vs Capacity
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {bottleneck.demandVsCapacity.demand} /{' '}
                          {bottleneck.demandVsCapacity.capacity}
                        </p>
                        <p className="text-sm text-red-600">
                          Shortfall: {bottleneck.demandVsCapacity.shortfallPercentage.toFixed(1)}%
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Estimated Impact
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          Delay: {bottleneck.estimatedDelayDays} days
                        </p>
                        <p className="text-sm text-red-600">
                          Cost: ${bottleneck.estimatedCostImpact.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Affected</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {bottleneck.affectedProjects.length} projects
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bottleneck.affectedTasks.length} tasks
                        </p>
                      </div>
                    </div>

                    {bottleneck.recommendations.length > 0 && (
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                              Recommendations
                            </h5>
                            {bottleneck.recommendations.map((rec, idx) => (
                              <p key={idx} className="text-sm text-blue-800 dark:text-blue-300">
                                • {rec}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optimization Dialog */}
      {optimizationDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configure Resource Optimization
                </h2>
                <button
                  onClick={() => setOptimizationDialogOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Optimization Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Optimization Goal
                </label>
                <select
                  value={optimizationGoal}
                  onChange={(e) => setOptimizationGoal(e.target.value as OptimizationGoal)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="minimize_cost">Minimize Cost</option>
                  <option value="minimize_duration">Minimize Duration</option>
                  <option value="maximize_quality">Maximize Quality</option>
                  <option value="balance_cost_time">Balance Cost & Time</option>
                  <option value="maximize_utilization">Maximize Utilization</option>
                  <option value="minimize_idle_time">Minimize Idle Time</option>
                </select>
              </div>

              {/* Budget Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Limit (optional)
                </label>
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="Enter budget limit"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    The AI will analyze your projects and recommend optimal resource allocations
                    based on ML models trained on historical data.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setOptimizationDialogOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleOptimizationRequest}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isLoading ? 'Optimizing...' : 'Start Optimization'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResourceOptimizationView;
