/**
 * Enhanced Loading States
 * Provides better UX during component lazy loading
 */

import React from 'react';

/**
 * Skeleton loader for different view types
 */
export const ViewSkeleton: React.FC<{ type?: 'dashboard' | 'table' | 'form' | 'chart' }> = ({ type = 'dashboard' }) => {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'chart':
      return <ChartSkeleton />;
    default:
      return <DefaultSkeleton />;
  }
};

/**
 * Dashboard skeleton with cards
 */
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Table skeleton
 */
const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
    {/* Header */}
    <div className="p-6 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
    </div>
    
    {/* Table */}
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {[1, 2, 3, 4, 5].map(i => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <tr key={i} className="border-t border-gray-200">
              {[1, 2, 3, 4, 5].map(j => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-gray-100 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * Form skeleton
 */
const FormSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
    
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-1/6 mb-2"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
    
    <div className="mt-6 flex gap-3">
      <div className="h-10 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-100 rounded w-24"></div>
    </div>
  </div>
);

/**
 * Chart skeleton
 */
const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
    <div className="h-80 bg-gray-100 rounded"></div>
  </div>
);

/**
 * Default skeleton
 */
const DefaultSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-4 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Spinner with message
 */
export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex flex-col items-center space-y-3">
        <div className={`${sizeClasses[size]} border-orange-500 border-t-transparent rounded-full animate-spin`}></div>
        {message && <p className="text-sm font-medium text-slate-700">{message}</p>}
      </div>
    </div>
  );
};

/**
 * Progressive loading indicator
 */
export const ProgressiveLoader: React.FC<{ 
  progress: number; 
  message?: string;
  total?: number;
  current?: number;
}> = ({ progress, message, total, current }) => {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-full max-w-md px-6">
        <div className="space-y-3">
          {message && (
            <p className="text-sm font-medium text-slate-700 text-center">{message}</p>
          )}
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-orange-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          
          {/* Stats */}
          {total && current !== undefined && (
            <p className="text-xs text-gray-500 text-center">
              {current} / {total} items loaded
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Error fallback for lazy loading failures
 */
export const LazyLoadError: React.FC<{ 
  error?: Error; 
  resetErrorBoundary?: () => void;
  componentName?: string;
}> = ({ error, resetErrorBoundary, componentName }) => {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="max-w-md text-center space-y-4">
        <div className="text-red-500">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load {componentName || 'Component'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {error?.message || 'An error occurred while loading this component.'}
          </p>
        </div>
        
        <div className="flex gap-3 justify-center">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Timeout handler for slow-loading components
 */
export class LoadingTimeout {
  private timeoutId: NodeJS.Timeout | null = null;
  
  start(callback: () => void, ms: number = 10000) {
    this.clear();
    this.timeoutId = setTimeout(callback, ms);
  }
  
  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Suspense with timeout fallback
 */
export const SuspenseWithTimeout: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
  onTimeout?: () => void;
}> = ({ children, fallback, timeout = 10000, onTimeout }) => {
  const [isTimeout, setIsTimeout] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeout(true);
      onTimeout?.();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (isTimeout) {
    return (
      <LazyLoadError 
        error={new Error('Component took too long to load')}
        resetErrorBoundary={() => window.location.reload()}
      />
    );
  }

  return (
    <React.Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </React.Suspense>
  );
};
