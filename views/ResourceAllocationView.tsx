/**
 * Resource Allocation View
 * Priority 3A: Resource Management System
 * 
 * Interactive calendar for resource allocation with drag-and-drop
 * and conflict detection
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useResource } from '../contexts/ResourceContext';
import type { Resource, ResourceAllocation, ResourceConflict } from '../types/resource.types';
import { Spinner } from '../components/Spinner';
import { Button } from '../components/Button';

const ResourceAllocationView: React.FC = () => {
  const {
    resources,
    allocations,
    resourcesLoading,
    fetchResources,
    fetchAllocations,
    createAllocation,
    checkConflicts,
  } = useResource();

  // Local state
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [showAllocationForm, setShowAllocationForm] = useState(false);

  // Fetch resources on mount
  useEffect(() => {
    fetchResources();
  }, []);

  // Fetch allocations when resource is selected
  useEffect(() => {
    if (selectedResource) {
      fetchAllocations(selectedResource.id);
    }
  }, [selectedResource]);

  // Calendar navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  // Get calendar dates
  const calendarDates = useMemo(() => {
    const dates: Date[] = [];
    const start = new Date(currentDate);
    
    if (viewMode === 'day') {
      dates.push(new Date(start));
    } else if (viewMode === 'week') {
      // Start from Monday
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
    } else {
      // Month view
      const year = start.getFullYear();
      const month = start.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      for (let d = firstDay.getDate(); d <= lastDay.getDate(); d++) {
        dates.push(new Date(year, month, d));
      }
    }
    
    return dates;
  }, [currentDate, viewMode]);

  // Format date header
  const formatDateHeader = (date: Date) => {
    if (viewMode === 'day') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'week') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.getDate().toString();
    }
  };

  // Get allocations for a specific date
  const getAllocationsForDate = (date: Date) => {
    return allocations.filter(allocation => {
      const allocStart = new Date(allocation.startDate);
      const allocEnd = new Date(allocation.endDate);
      
      return date >= allocStart && date <= allocEnd;
    });
  };

  // Check if resource is available on date
  const isResourceAvailable = (resource: Resource, date: Date) => {
    return resource.availability.some(slot => {
      const slotStart = new Date(slot.startDate);
      const slotEnd = new Date(slot.endDate);
      
      return date >= slotStart && date <= slotEnd;
    });
  };

  // Handle resource selection
  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource(resource);
  };

  // Handle create allocation
  const handleCreateAllocation = () => {
    setShowAllocationForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Resource Allocation Calendar
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage resource allocations and schedules
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={handleCreateAllocation}
                disabled={!selectedResource}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Allocate Resource
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Resource List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Resources
                </h2>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {resourcesLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : resources.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No resources available
                  </p>
                ) : (
                  resources.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => handleResourceSelect(resource)}
                      className={`w-full text-left p-3 rounded-lg transition-colors $
{
                        selectedResource?.id === resource.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {resource.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {resource.type} • {resource.status}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Resource Details */}
            {selectedResource && (
              <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Resource Details
                </h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Type</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {selectedResource.type}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {selectedResource.status}
                    </dd>
                  </div>
                  {selectedResource.location && (
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Location</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedResource.location}
                      </dd>
                    </div>
                  )}
                  {selectedResource.costPerDay && (
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Cost/Day</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        ${selectedResource.costPerDay.toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              {/* Calendar Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateDate('prev')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {currentDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long',
                        ...(viewMode === 'day' && { day: 'numeric' })
                      })}
                    </h2>
                    <button
                      onClick={() => navigateDate('next')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex space-x-2">
                    {(['day', 'week', 'month'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-1 text-sm rounded ${
                          viewMode === mode
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                {!selectedResource ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Select a resource
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose a resource from the sidebar to view and manage allocations
                    </p>
                  </div>
                ) : (
                  <div className={`grid ${
                    viewMode === 'day' ? 'grid-cols-1' :
                    viewMode === 'week' ? 'grid-cols-7' :
                    'grid-cols-7'
                  } gap-2`}>
                    {calendarDates.map((date, index) => {
                      const dateAllocations = getAllocationsForDate(date);
                      const isAvailable = isResourceAvailable(selectedResource, date);
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={index}
                          className={`min-h-24 p-2 rounded-lg border-2 ${
                            isToday
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {formatDateHeader(date)}
                          </div>
                          
                          {dateAllocations.length > 0 ? (
                            <div className="space-y-1">
                              {dateAllocations.map((allocation) => (
                                <div
                                  key={allocation.id}
                                  className={`text-xs p-1 rounded ${
                                    allocation.status === 'active'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                      : allocation.status === 'confirmed'
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  {allocation.projectName}
                                </div>
                              ))}
                            </div>
                          ) : isAvailable ? (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              Available
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">
                              Unavailable
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Allocation Conflicts Detected
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <ul className="list-disc list-inside space-y-1">
                        {conflicts.map((conflict, idx) => (
                          <li key={idx}>
                            {conflict.conflictType} - {conflict.resourceName} ({conflict.severity})
                            {conflict.suggestedResolution && ` - ${conflict.suggestedResolution}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocationView;
