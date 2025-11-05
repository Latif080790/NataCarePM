/**
 * Risk Mitigation View
 * Priority 3B: Risk Management System
 *
 * Track mitigation plans, actions, and effectiveness
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRisk } from '@/contexts/RiskContext';
import type { Risk, MitigationAction } from '@/types/risk.types';
import { Spinner } from '@/components/Spinner';

interface RiskMitigationViewProps {
  projectId: string;
}

const RiskMitigationView: React.FC<RiskMitigationViewProps> = ({ projectId }) => {
  const { risks, risksLoading, risksError, fetchRisks } = useRisk();

  // Local state
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue' | 'completed'>(
    'active'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch risks on mount
  useEffect(() => {
    fetchRisks(projectId);
  }, [projectId]);

  // Get risks with mitigation plans
  const risksWithMitigation = useMemo(() => {
    return risks.filter((risk) => risk.mitigationPlan && risk.mitigationPlan.actions.length > 0);
  }, [risks]);

  // Filter risks based on action status
  const filteredRisks = useMemo(() => {
    return risksWithMitigation.filter((risk) => {
      const matchesSearch =
        !searchQuery ||
        risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        risk.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === 'all') return true;

      const actions = risk.mitigationPlan!.actions;

      if (filterStatus === 'active') {
        return actions.some((a) => a.status === 'in_progress' || a.status === 'pending');
      } else if (filterStatus === 'overdue') {
        const now = new Date();
        return actions.some(
          (a) => (a.status === 'in_progress' || a.status === 'pending') && new Date(a.dueDate) < now
        );
      } else if (filterStatus === 'completed') {
        return actions.every((a) => a.status === 'completed');
      }

      return true;
    });
  }, [risksWithMitigation, filterStatus, searchQuery]);

  // Get all mitigation actions across all risks
  const allActions = useMemo(() => {
    const actions: Array<{ risk: Risk; action: MitigationAction }> = [];

    filteredRisks.forEach((risk) => {
      risk.mitigationPlan?.actions.forEach((action) => {
        actions.push({ risk, action });
      });
    });

    return actions;
  }, [filteredRisks]);

  // Get action statistics
  const actionStats = useMemo(() => {
    const stats = {
      total: allActions.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
    };

    const now = new Date();

    allActions.forEach(({ action }) => {
      if (action.status === 'pending') stats.pending++;
      else if (action.status === 'in_progress') stats.inProgress++;
      else if (action.status === 'completed') stats.completed++;
      else if (action.status === 'cancelled') stats.cancelled++;

      if (
        (action.status === 'pending' || action.status === 'in_progress') &&
        new Date(action.dueDate) < now
      ) {
        stats.overdue++;
      }
    });

    return stats;
  }, [allActions]);

  // Get action status color
  const getActionStatusColor = (status: MitigationAction['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  // Check if action is overdue
  const isOverdue = (action: MitigationAction): boolean => {
    return (
      (action.status === 'pending' || action.status === 'in_progress') &&
      new Date(action.dueDate) < new Date()
    );
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get strategy label
  const getStrategyLabel = (strategy: string): string => {
    const labels: Record<string, string> = {
      avoid: 'Avoid',
      mitigate: 'Mitigate',
      transfer: 'Transfer',
      accept: 'Accept',
    };
    return labels[strategy] || strategy;
  };

  // Get strategy color
  const getStrategyColor = (strategy: string): string => {
    switch (strategy) {
      case 'avoid':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'mitigate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'transfer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'accept':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Risk Mitigation Tracker
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monitor mitigation plans and action items
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white dark:bg-gray-700 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Actions
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {actionStats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                        In Progress
                      </dt>
                      <dd className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                        {actionStats.inProgress}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Pending
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {actionStats.pending}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 overflow-hidden rounded-lg border border-green-200 dark:border-green-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-semibold text-green-900 dark:text-green-200">
                        {actionStats.completed}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 overflow-hidden rounded-lg border border-red-200 dark:border-red-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-red-600 dark:text-red-400 truncate">
                        Overdue
                      </dt>
                      <dd className="text-lg font-semibold text-red-900 dark:text-red-200">
                        {actionStats.overdue}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Search */}
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Search Risks
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Search risks..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="filterStatus"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Filter by Status
              </label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Risks</option>
                <option value="active">Active Actions</option>
                <option value="overdue">Overdue Actions</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mitigation Plans List */}
        <div className="mt-6 space-y-6">
          {risksLoading ? (
            <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Spinner />
            </div>
          ) : risksError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{risksError}</p>
            </div>
          ) : filteredRisks.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No mitigation plans found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            filteredRisks.map((risk) => (
              <div
                key={risk.id}
                className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  {/* Risk Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {risk.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {risk.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            risk.priorityLevel === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : risk.priorityLevel === 'high'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                : risk.priorityLevel === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {risk.priorityLevel}
                        </span>
                        {risk.mitigationPlan && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStrategyColor(risk.mitigationPlan.strategy)}`}
                          >
                            {getStrategyLabel(risk.mitigationPlan.strategy)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg
                          className={`w-6 h-6 transform transition-transform ${selectedRisk?.id === risk.id ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Mitigation Plan Summary */}
                  {risk.mitigationPlan && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Mitigation Plan
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {risk.mitigationPlan.description}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Actions:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {risk.mitigationPlan.actions.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            ${risk.mitigationPlan.estimatedCost.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Target:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {formatDate(risk.mitigationPlan.targetCompletionDate)}
                          </span>
                        </div>
                        {risk.mitigationPlan.effectiveness && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Effectiveness:</span>
                            <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                              {(
                                ((risk.mitigationPlan.effectiveness.severityReduction +
                                  risk.mitigationPlan.effectiveness.probabilityReduction) /
                                  10) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {selectedRisk?.id === risk.id && risk.mitigationPlan && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Action Items
                      </h4>
                      <div className="space-y-3">
                        {risk.mitigationPlan.actions.map((action) => (
                          <div
                            key={action.id}
                            className={`p-4 rounded-lg border-2 ${
                              isOverdue(action)
                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {action.action}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded ${getActionStatusColor(action.status)}`}
                                  >
                                    {action.status.replace('_', ' ')}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Due: {formatDate(action.dueDate)}
                                  </span>
                                  {action.cost && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Cost: ${action.cost.toLocaleString()}
                                    </span>
                                  )}
                                  {isOverdue(action) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-medium">
                                      OVERDUE
                                    </span>
                                  )}
                                </div>
                                {action.notes && (
                                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {action.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskMitigationView;
