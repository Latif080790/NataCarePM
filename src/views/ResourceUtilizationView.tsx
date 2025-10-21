/**
 * Resource Utilization View
 * Priority 3A: Resource Management System
 *
 * Dashboard for tracking resource utilization metrics and efficiency
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useResource } from '@/contexts/ResourceContext';
import type { Resource, ResourceUtilization, ResourceType } from '@/types/resource.types';
import { Spinner } from '@/components/Spinner';

const ResourceUtilizationView: React.FC = () => {
  const {
    resources,
    utilization,
    resourcesLoading,
    fetchResources,
    calculateUtilization,
    statistics,
    fetchStatistics,
  } = useResource();

  // Local state
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>(
    'month'
  );
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'utilization' | 'cost' | 'name'>('utilization');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch data on mount
  useEffect(() => {
    fetchResources();
    fetchStatistics();
  }, []);

  // Calculate period dates
  const getPeriodDates = () => {
    const end = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  };

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let filtered = resources;

    if (selectedType !== 'all') {
      filtered = filtered.filter((r) => r.type === selectedType);
    }

    // Sort resources
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'utilization') {
        const aUtil = utilization.get(a.id)?.utilizationRate || 0;
        const bUtil = utilization.get(b.id)?.utilizationRate || 0;
        comparison = aUtil - bUtil;
      } else if (sortBy === 'cost') {
        const aCost = utilization.get(a.id)?.totalCost || 0;
        const bCost = utilization.get(b.id)?.totalCost || 0;
        comparison = aCost - bCost;
      } else {
        comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [resources, selectedType, sortBy, sortOrder, utilization]);

  // Get utilization color
  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get utilization bg color
  const getUtilizationBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (rate >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resource Utilization
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor resource utilization, efficiency, and performance metrics
            </p>
          </div>

          {/* Summary Statistics */}
          {statistics && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden rounded-lg shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-blue-100 truncate">
                          Average Utilization
                        </dt>
                        <dd className="text-2xl font-bold text-white">
                          {statistics.utilization.average.toFixed(1)}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 overflow-hidden rounded-lg shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-white"
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
                        <dt className="text-sm font-medium text-green-100 truncate">
                          High Utilization (≥80%)
                        </dt>
                        <dd className="text-2xl font-bold text-white">
                          {statistics.utilization.high}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden rounded-lg shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-white"
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
                        <dt className="text-sm font-medium text-yellow-100 truncate">
                          Medium Utilization
                        </dt>
                        <dd className="text-2xl font-bold text-white">
                          {statistics.utilization.medium}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 overflow-hidden rounded-lg shadow">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-8 w-8 text-white"
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
                        <dt className="text-sm font-medium text-purple-100 truncate">
                          Total Monthly Cost
                        </dt>
                        <dd className="text-2xl font-bold text-white">
                          ${statistics.costs.totalMonthly.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Period Filter */}
            <div>
              <label
                htmlFor="period"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Time Period
              </label>
              <select
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Resource Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                <option value="human">Human Resources</option>
                <option value="equipment">Equipment</option>
                <option value="material">Materials</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label
                htmlFor="sortBy"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Sort By
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="utilization">Utilization Rate</option>
                <option value="cost">Total Cost</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Order
              </label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Utilization Table */}
        <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Resource Utilization Details
            </h3>
          </div>

          {resourcesLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12">
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No resources found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Resource
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Utilization
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Hours
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredResources.map((resource) => {
                    const resourceUtil = utilization.get(resource.id);
                    const utilizationRate = resourceUtil?.utilizationRate || 0;

                    return (
                      <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {resource.name}
                          </div>
                          {resource.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {resource.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                            {resource.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              resource.status === 'available'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : resource.status === 'allocated'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : resource.status === 'maintenance'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {resource.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUtilizationBgColor(utilizationRate)}`}
                                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm font-medium ${getUtilizationColor(utilizationRate)}`}
                            >
                              {utilizationRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {resourceUtil ? (
                            <div>
                              <div>
                                {resourceUtil.totalAllocatedHours.toFixed(1)} /{' '}
                                {resourceUtil.totalAvailableHours.toFixed(1)}
                              </div>
                              {resourceUtil.idleHours > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {resourceUtil.idleHours.toFixed(1)}h idle
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                          {resourceUtil ? (
                            <div>
                              <div>${resourceUtil.totalCost.toLocaleString()}</div>
                              {resourceUtil.costPerProductiveHour && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ${resourceUtil.costPerProductiveHour.toFixed(2)}/hr
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceUtilizationView;
