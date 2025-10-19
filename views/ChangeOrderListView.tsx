/**
 * Change Order List View
 * Priority 3C: Change Order Management System
 * 
 * Main change order catalog with filtering, sorting, and management capabilities
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useChangeOrder } from '../contexts/ChangeOrderContext';
import type { ChangeOrder, ChangeOrderStatus, ChangeOrderType, ChangeOrderFilterOptions } from '../types/changeOrder.types';
import { Spinner } from '../components/Spinner';
import { Button } from '../components/Button';

interface ChangeOrderListViewProps {
  projectId: string;
}

const ChangeOrderListView: React.FC<ChangeOrderListViewProps> = ({ projectId }) => {
  const {
    changeOrders,
    changeOrdersLoading,
    changeOrdersError,
    fetchChangeOrders,
    createChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
    summary,
    fetchSummary,
    getChangeOrdersByStatus,
    getTotalCostImpact,
    getTotalScheduleImpact,
  } = useChangeOrder();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ChangeOrderStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ChangeOrderType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedChangeOrder, setSelectedChangeOrder] = useState<ChangeOrder | null>(null);

  // Fetch change orders on mount
  useEffect(() => {
    fetchChangeOrders(projectId);
    fetchSummary(projectId);
  }, [projectId]);

  // Filtered change orders
  const filteredChangeOrders = useMemo(() => {
    return changeOrders.filter(co => {
      const matchesSearch = !searchQuery ||
        co.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        co.changeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        co.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || co.status === selectedStatus;
      const matchesType = selectedType === 'all' || co.changeType === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [changeOrders, searchQuery, selectedStatus, selectedType]);

  // Status options
  const statusOptions: { value: ChangeOrderStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Statuses', color: 'gray' },
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'submitted', label: 'Submitted', color: 'blue' },
    { value: 'under_review', label: 'Under Review', color: 'yellow' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'implemented', label: 'Implemented', color: 'purple' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' },
  ];

  // Type options
  const typeOptions: { value: ChangeOrderType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'scope', label: 'Scope Change' },
    { value: 'design', label: 'Design Change' },
    { value: 'schedule', label: 'Schedule Change' },
    { value: 'budget', label: 'Budget Change' },
    { value: 'specification', label: 'Specification Change' },
    { value: 'other', label: 'Other' },
  ];

  // Get status color
  const getStatusColor = (status: ChangeOrderStatus): string => {
    const statusMap: Record<ChangeOrderStatus, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      implemented: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return statusMap[status];
  };

  // Get priority color (based on cost impact)
  const getPriorityColor = (costImpact: number): string => {
    const absImpact = Math.abs(costImpact);
    if (absImpact >= 100000) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (absImpact >= 50000) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (absImpact >= 10000) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  // Get priority label (based on cost impact)
  const getPriorityLabel = (costImpact: number): string => {
    const absImpact = Math.abs(costImpact);
    if (absImpact >= 100000) return 'Critical';
    if (absImpact >= 50000) return 'High';
    if (absImpact >= 10000) return 'Medium';
    return 'Low';
  };

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

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this change order?')) {
      try {
        await deleteChangeOrder(id);
      } catch (error) {
        console.error('Failed to delete change order:', error);
      }
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
                Change Orders
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage project change requests and approvals
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => console.log('Create change order')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Change Order
              </Button>
            </div>
          </div>

          {/* Summary Statistics */}
          {summary && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white dark:bg-gray-700 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Total Change Orders
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                          {summary.totalChangeOrders}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 overflow-hidden rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-yellow-600 dark:text-yellow-400 truncate">
                          Pending Approval
                        </dt>
                        <dd className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
                          {summary.pendingApprovals}
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
                      <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                          Approval Rate
                        </dt>
                        <dd className="text-lg font-semibold text-green-900 dark:text-green-200">
                          {summary.approvalRate.toFixed(1)}%
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
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                          Total Cost Impact
                        </dt>
                        <dd className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                          {formatCurrency(summary.totalCostImpact)}
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Search by number or title..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredChangeOrders.length} of {changeOrders.length} change orders
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Change Orders List */}
        <div className="mt-6">
          {changeOrdersLoading ? (
            <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Spinner />
            </div>
          ) : changeOrdersError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{changeOrdersError}</p>
            </div>
          ) : filteredChangeOrders.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No change orders found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new change order
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {filteredChangeOrders.map((co) => (
                <div
                  key={co.id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {co.changeNumber}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(co.costImpact)}`}>
                          {getPriorityLabel(co.costImpact)}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {co.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {co.description}
                      </p>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Status:</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(co.status)}`}>
                            {co.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Type:</span>
                          <span className="text-gray-900 dark:text-white capitalize">{co.changeType}</span>
                        </div>
                        {co.costImpact && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Cost Impact:</span>
                            <span className={`font-medium ${co.costImpact >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {co.costImpact >= 0 ? '+' : ''}{formatCurrency(co.costImpact)}
                            </span>
                          </div>
                        )}
                        {co.scheduleImpact && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Schedule Impact:</span>
                            <span className={`font-medium ${co.scheduleImpact >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {co.scheduleImpact >= 0 ? '+' : ''}{co.scheduleImpact} days
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => console.log('View', co.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => console.log('Edit', co.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(co.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeOrderListView;
