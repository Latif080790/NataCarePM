/**
 * Enhanced Loading Components for Code Splitting
 * Provides better UX during lazy-loaded component transitions
 */

import { memo } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Minimal loading spinner for small components
 */
export const MinimalLoader = memo(() => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
  </div>
));

MinimalLoader.displayName = 'MinimalLoader';

/**
 * Page loader with branding for full-page transitions
 */
export const PageLoader = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">Loading...</p>
        <p className="text-xs text-slate-500 mt-1">Please wait</p>
      </div>
    </div>
  </div>
));

PageLoader.displayName = 'PageLoader';

/**
 * View loader for route transitions (maintains layout)
 */
export const ViewLoader = memo(() => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center space-y-3">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-slate-700">Loading view...</p>
    </div>
  </div>
));

ViewLoader.displayName = 'ViewLoader';

/**
 * Skeleton loader for content areas
 */
export const SkeletonLoader = memo(() => (
  <div className="space-y-4 p-6 animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 rounded"></div>
      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
      <div className="h-4 bg-slate-200 rounded w-4/6"></div>
    </div>
    <div className="grid grid-cols-3 gap-4 mt-6">
      <div className="h-24 bg-slate-200 rounded"></div>
      <div className="h-24 bg-slate-200 rounded"></div>
      <div className="h-24 bg-slate-200 rounded"></div>
    </div>
  </div>
));

SkeletonLoader.displayName = 'SkeletonLoader';

/**
 * Card skeleton for list views
 */
export const CardSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 bg-slate-200 rounded"></div>
      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
    </div>
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

/**
 * Table skeleton for data tables
 */
export const TableSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="border-b border-slate-200 p-4">
      <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
    </div>
    <div className="divide-y divide-slate-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 flex items-center space-x-4 animate-pulse">
          <div className="w-8 h-8 bg-slate-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-8 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

/**
 * Chart skeleton for data visualizations
 */
export const ChartSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
    <div className="flex items-end justify-between h-64 space-x-2">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 rounded-t"
          style={{ height: `${Math.random() * 100}%` }}
        ></div>
      ))}
    </div>
    <div className="flex justify-center mt-4 space-x-4">
      <div className="h-3 bg-slate-200 rounded w-16"></div>
      <div className="h-3 bg-slate-200 rounded w-16"></div>
      <div className="h-3 bg-slate-200 rounded w-16"></div>
    </div>
  </div>
));

ChartSkeleton.displayName = 'ChartSkeleton';

/**
 * Dashboard skeleton for dashboard views
 */
export const DashboardSkeleton = memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="flex justify-between items-start mb-2">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="w-8 h-8 bg-slate-200 rounded"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Table */}
    <TableSkeleton />
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

/**
 * Progressive loader with percentage (for heavy operations)
 */
export const ProgressiveLoader = memo<{ progress?: number; message?: string }>(
  ({ progress = 0, message = 'Loading...' }) => (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-200"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 60}`}
            strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
            className="text-blue-500 transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-700">{Math.round(progress)}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
    </div>
  )
);

ProgressiveLoader.displayName = 'ProgressiveLoader';

/**
 * Error fallback component
 */
export const LoaderError = memo<{ error: Error; retry?: () => void }>(({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-red-600"
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
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load</h3>
      <p className="text-sm text-slate-600 mb-4">{error.message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
));

LoaderError.displayName = 'LoaderError';

