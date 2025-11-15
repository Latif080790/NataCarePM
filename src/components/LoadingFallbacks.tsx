/**
 * Loading Fallback Components
 * Optimized loading states for code-split components
 */

import { Spinner } from './Spinner';

/**
 * Page-level loading fallback
 * Used for route-based lazy loaded views
 */
export const PageLoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">Memuat halaman...</p>
      </div>
    </div>
  );
};

/**
 * Component-level loading fallback
 * Used for smaller lazy-loaded components within pages
 */
export const ComponentLoadingFallback = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <Spinner size="md" />
    </div>
  );
};

/**
 * Inline loading fallback
 * Minimal loading indicator for inline components
 */
export const InlineLoadingFallback = () => {
  return (
    <div className="inline-flex items-center space-x-2">
      <Spinner size="sm" />
      <span className="text-xs text-gray-500">Loading...</span>
    </div>
  );
};

/**
 * Modal loading fallback
 * Used for lazy-loaded modals
 */
export const ModalLoadingFallback = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <Spinner size="lg" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader for dashboard cards
 */
export const DashboardCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
    </div>
  );
};

/**
 * Skeleton loader for tables
 */
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for charts
 */
export const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded flex items-end space-x-2 p-4">
          {[60, 80, 40, 70, 50, 90, 30].map((height, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded flex-1"
              style={{ height: `${height}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for profile page
 */
export const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-pulse">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for form
 */
export const FormSkeleton = ({ fields = 5 }: { fields?: number }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        ))}
        <div className="flex space-x-2 pt-4">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for list items
 */
export const ListSkeleton = ({ items = 5 }: { items?: number }) => {
  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Full page skeleton for dashboard
 */
export const DashboardSkeleton = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton rows={5} />
    </div>
  );
};

export default PageLoadingFallback;

