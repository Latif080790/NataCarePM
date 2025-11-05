/**
 * Change Order Impact Analysis View
 * Priority 3C: Change Order Management System
 *
 * Detailed impact analysis for cost, schedule, and resources
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useChangeOrder } from '@/contexts/ChangeOrderContext';
import { Spinner } from '@/components/Spinner';

interface ChangeOrderImpactViewProps {
  changeOrderId: string;
}

const ChangeOrderImpactView: React.FC<ChangeOrderImpactViewProps> = ({ changeOrderId }) => {
  const { selectedChangeOrder, changeOrdersLoading, changeOrdersError, fetchChangeOrderById } =
    useChangeOrder();

  // Local state
  const [selectedView, setSelectedView] = useState<'cost' | 'schedule' | 'overview'>('overview');

  // Fetch change order on mount
  useEffect(() => {
    fetchChangeOrderById(changeOrderId);
  }, [changeOrderId]);

  // Calculate total impact
  const totalImpact = useMemo(() => {
    if (!selectedChangeOrder) return null;

    return {
      cost: selectedChangeOrder.costImpact,
      costPercentage: selectedChangeOrder.budgetImpact
        ? (selectedChangeOrder.budgetImpact.variance /
            selectedChangeOrder.budgetImpact.originalBudget) *
          100
        : 0,
      schedule: selectedChangeOrder.scheduleImpact,
      schedulePercentage: selectedChangeOrder.scheduleImpactDetail
        ? (selectedChangeOrder.scheduleImpact /
            ((selectedChangeOrder.scheduleImpactDetail.newEndDate.getTime() -
              selectedChangeOrder.scheduleImpactDetail.originalEndDate.getTime()) /
              (1000 * 60 * 60 * 24))) *
          100
        : 0,
    };
  }, [selectedChangeOrder]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (changeOrdersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (changeOrdersError || !selectedChangeOrder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            {changeOrdersError || 'Change order not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span className="font-mono">{selectedChangeOrder.changeNumber}</span>
              <span>•</span>
              <span>Impact Analysis</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedChangeOrder.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comprehensive impact assessment
            </p>
          </div>

          {/* View Tabs */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {(['overview', 'cost', 'schedule'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`${
                    selectedView === view
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {view}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedView === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Cost Impact
                        </dt>
                        <dd
                          className={`text-lg font-semibold ${
                            selectedChangeOrder.costImpact >= 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {selectedChangeOrder.costImpact >= 0 ? '+' : ''}
                          {formatCurrency(selectedChangeOrder.costImpact)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Schedule Impact
                        </dt>
                        <dd
                          className={`text-lg font-semibold ${
                            selectedChangeOrder.scheduleImpact >= 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {selectedChangeOrder.scheduleImpact >= 0 ? '+' : ''}
                          {selectedChangeOrder.scheduleImpact} days
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-purple-600 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Type
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {selectedChangeOrder.changeType}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
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
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Status
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {selectedChangeOrder.status.replace('_', ' ')}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Overview */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Impact Overview
              </h2>

              <div className="space-y-6">
                {/* Cost Impact Visualization */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cost Impact
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        selectedChangeOrder.costImpact >= 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {totalImpact && totalImpact.costPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        selectedChangeOrder.costImpact >= 0 ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{
                        width: `${Math.min(Math.abs(totalImpact?.costPercentage || 0), 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Schedule Impact Visualization */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Schedule Impact
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        selectedChangeOrder.scheduleImpact >= 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {selectedChangeOrder.scheduleImpact >= 0 ? '+' : ''}
                      {selectedChangeOrder.scheduleImpact} days
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        selectedChangeOrder.scheduleImpact >= 0 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{
                        width: `${Math.min(Math.abs(selectedChangeOrder.scheduleImpact) * 2, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Justification */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Justification
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {selectedChangeOrder.justification}
              </p>

              {selectedChangeOrder.alternativesConsidered && (
                <>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mt-6 mb-2">
                    Alternatives Considered
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {selectedChangeOrder.alternativesConsidered}
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {selectedView === 'cost' && selectedChangeOrder.budgetImpact && (
          <div className="space-y-6">
            {/* Budget Summary */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Budget Impact Analysis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Original Budget</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(selectedChangeOrder.budgetImpact.originalBudget)}
                  </p>
                </div>

                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Additional Cost</p>
                  <p
                    className={`text-2xl font-bold ${
                      selectedChangeOrder.budgetImpact.additionalCost >= 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {selectedChangeOrder.budgetImpact.additionalCost >= 0 ? '+' : ''}
                    {formatCurrency(selectedChangeOrder.budgetImpact.additionalCost)}
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Budget</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(selectedChangeOrder.budgetImpact.newBudget)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variance
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      selectedChangeOrder.budgetImpact.variance >= 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {formatCurrency(selectedChangeOrder.budgetImpact.variance)} (
                    {selectedChangeOrder.budgetImpact.variancePercentage.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Affected Cost Categories */}
            {selectedChangeOrder.budgetImpact.affectedCostCategories.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Affected Cost Categories
                </h2>
                <div className="space-y-3">
                  {selectedChangeOrder.budgetImpact.affectedCostCategories.map((category, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.category}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          category.impact >= 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {category.impact >= 0 ? '+' : ''}
                        {formatCurrency(category.impact)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedView === 'schedule' && selectedChangeOrder.scheduleImpactDetail && (
          <div className="space-y-6">
            {/* Schedule Summary */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Schedule Impact Analysis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Original End Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatDate(selectedChangeOrder.scheduleImpactDetail.originalEndDate)}
                  </p>
                </div>

                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Delay</p>
                  <p
                    className={`text-2xl font-bold ${
                      selectedChangeOrder.scheduleImpactDetail.delayDays >= 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {selectedChangeOrder.scheduleImpactDetail.delayDays >= 0 ? '+' : ''}
                    {selectedChangeOrder.scheduleImpactDetail.delayDays} days
                  </p>
                </div>

                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New End Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatDate(selectedChangeOrder.scheduleImpactDetail.newEndDate)}
                  </p>
                </div>
              </div>

              {selectedChangeOrder.scheduleImpactDetail.criticalPathAffected && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex">
                    <svg
                      className="h-5 w-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Critical Path Affected
                      </h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        This change order impacts the project's critical path and will affect the
                        overall project timeline.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Affected Tasks */}
            {selectedChangeOrder.scheduleImpactDetail.affectedTasks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Affected Tasks
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Task
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Delay (Days)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedChangeOrder.scheduleImpactDetail.affectedTasks.map((task) => (
                        <tr key={task.taskId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {task.taskName}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                              task.delayDays >= 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {task.delayDays >= 0 ? '+' : ''}
                            {task.delayDays}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeOrderImpactView;
