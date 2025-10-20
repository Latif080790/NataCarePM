/**
 * Quality Inspection View
 * Priority 3D: Quality Management System
 * 
 * Schedule and manage quality inspections
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuality } from '@/contexts/QualityContext';
import type { QualityInspection, InspectionStatus, InspectionResult } from '@/types/quality.types';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/Button';

interface QualityInspectionViewProps {
  projectId: string;
}

const QualityInspectionView: React.FC<QualityInspectionViewProps> = ({ projectId }) => {
  const {
    inspections,
    inspectionsLoading,
    inspectionsError,
    fetchInspections,
    createInspection,
    setSelectedInspection,
    getInspectionsByStatus,
    getInspectionsByResult,
    getPassRate,
  } = useQuality();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InspectionStatus | 'all'>('all');
  const [selectedResult, setSelectedResult] = useState<InspectionResult | 'all'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // Fetch inspections on mount
  useEffect(() => {
    fetchInspections(projectId);
  }, [projectId]);

  // Filtered inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(inspection => {
      const matchesSearch = !searchQuery ||
        inspection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.inspectionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || inspection.status === selectedStatus;
      const matchesResult = selectedResult === 'all' || inspection.overallResult === selectedResult;

      return matchesSearch && matchesStatus && matchesResult;
    });
  }, [inspections, searchQuery, selectedStatus, selectedResult]);

  // Status options
  const statusOptions: { value: InspectionStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Result options
  const resultOptions: { value: InspectionResult | 'all'; label: string }[] = [
    { value: 'all', label: 'All Results' },
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail' },
    { value: 'conditional', label: 'Conditional' },
  ];

  // Get status color
  const getStatusColor = (status: InspectionStatus): string => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get result color
  const getResultColor = (result: InspectionResult): string => {
    switch (result) {
      case 'pass': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'fail': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'conditional': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = inspections.length;
    const completed = inspections.filter(i => i.status === 'completed').length;
    const scheduled = inspections.filter(i => i.status === 'scheduled').length;
    const passRate = getPassRate();

    return { total, completed, scheduled, passRate };
  }, [inspections, getPassRate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Quality Inspections
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Schedule and manage quality inspections
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => console.log('Create inspection')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Inspection
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white dark:bg-gray-700 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total Inspections
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                        {stats.total}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                        Scheduled
                      </dt>
                      <dd className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                        {stats.scheduled}
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
                        Completed
                      </dt>
                      <dd className="text-lg font-semibold text-green-900 dark:text-green-200">
                        {stats.completed}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 overflow-hidden rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-purple-600 dark:text-purple-400 truncate">
                        Pass Rate
                      </dt>
                      <dd className="text-lg font-semibold text-purple-900 dark:text-purple-200">
                        {stats.passRate.toFixed(1)}%
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
                  placeholder="Search inspections..."
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

            {/* Result Filter */}
            <div>
              <label htmlFor="result" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Result
              </label>
              <select
                id="result"
                value={selectedResult}
                onChange={(e) => setSelectedResult(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {resultOptions.map((option) => (
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
              Showing {filteredInspections.length} of {inspections.length} inspections
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded ${
                  viewMode === 'calendar'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

        {/* Inspections List */}
        <div className="mt-6">
          {inspectionsLoading ? (
            <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Spinner />
            </div>
          ) : inspectionsError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{inspectionsError}</p>
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No inspections found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by scheduling a new inspection
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          {inspection.inspectionNumber}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(inspection.status)}`}>
                          {inspection.status.replace('_', ' ')}
                        </span>
                        {inspection.status === 'completed' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getResultColor(inspection.overallResult)}`}>
                            {inspection.overallResult}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {inspection.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {inspection.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Location:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{inspection.location || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Inspector:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{inspection.inspector}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{formatDate(inspection.scheduledDate)}</span>
                        </div>
                      </div>

                      {inspection.status === 'completed' && (
                        <div className="mt-4 flex items-center space-x-4">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                inspection.passRate >= 90 ? 'bg-green-600' :
                                inspection.passRate >= 70 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${inspection.passRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {inspection.passRate.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => console.log('View', inspection.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => console.log('Edit', inspection.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

export default QualityInspectionView;
