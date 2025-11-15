/**
 * State Components - Loading, Empty, and Error States
 * 
 * Professional state components for consistent UX.
 * 
 * @component
 */

import React from 'react';
import { CardPro } from './CardPro';
import { ButtonPro } from './ButtonPro';
import { AlertCircle, Inbox, RefreshCw, Search, FolderOpen } from 'lucide-react';

// ============================================================================
// Loading State Component
// ============================================================================

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ message = 'Loading...', size = 'md' }: LoadingStateProps) {
  const sizeStyles = {
    sm: { spinner: 'w-8 h-8', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', text: 'text-lg' },
  };

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <svg
        className={`animate-spin text-blue-600 ${sizeStyles[size].spinner}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className={`mt-4 text-gray-600 ${sizeStyles[size].text}`}>{message}</p>
    </div>
  );
}

// ============================================================================
// Skeleton Loader Component
// ============================================================================

export function SkeletonLoader({ 
  count = 1, 
  height = 'h-4',
  className = '' 
}: { 
  count?: number; 
  height?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 rounded animate-pulse`}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

export interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ size?: number }>;
  };
  variant?: 'default' | 'search' | 'folder';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  // Default icons based on variant
  const DefaultIcon = variant === 'search' ? Search : variant === 'folder' ? FolderOpen : Inbox;
  const DisplayIcon = Icon || DefaultIcon;

  return (
    <CardPro className="text-center py-12">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <DisplayIcon size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 mb-6 max-w-md">{description}</p>
        )}
        {action && (
          <ButtonPro
            variant="primary"
            icon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </ButtonPro>
        )}
      </div>
    </CardPro>
  );
}

// ============================================================================
// Error State Component
// ============================================================================

export interface ErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showIcon?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  action,
  showIcon = true,
}: ErrorStateProps) {
  return (
    <CardPro className="text-center py-12 border-red-200 bg-red-50">
      <div className="flex flex-col items-center">
        {showIcon && (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
        <p className="text-red-700 mb-6 max-w-md">{message}</p>
        {action && (
          <ButtonPro
            variant="danger"
            icon={RefreshCw}
            onClick={action.onClick}
          >
            {action.label}
          </ButtonPro>
        )}
      </div>
    </CardPro>
  );
}

// ============================================================================
// Data Table Loading Skeleton
// ============================================================================

export function TableLoadingSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="h-8 bg-gray-300 rounded animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`} className="h-6 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Card Loading Skeleton
// ============================================================================

export function CardLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardPro key={i} className="p-6">
          <div className="space-y-3">
            <div className="h-6 bg-gray-300 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
          </div>
        </CardPro>
      ))}
    </div>
  );
}

// ============================================================================
// List Loading Skeleton
// ============================================================================

export function ListLoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardPro key={i} className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </CardPro>
      ))}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * // Loading state
 * {isLoading && <LoadingState message="Loading projects..." size="lg" />}
 * 
 * // Empty state
 * {projects.length === 0 && (
 *   <EmptyState
 *     title="No projects found"
 *     description="Get started by creating your first project"
 *     action={{
 *       label: "Create Project",
 *       onClick: () => setShowCreateModal(true),
 *       icon: Plus
 *     }}
 *   />
 * )}
 * 
 * // Error state
 * {error && (
 *   <ErrorState
 *     message={error.message}
 *     action={{
 *       label: "Try Again",
 *       onClick: () => refetch()
 *     }}
 *   />
 * )}
 * 
 * // Skeleton loaders
 * {isLoading && <CardLoadingSkeleton count={6} />}
 * {isLoading && <TableLoadingSkeleton rows={10} columns={5} />}
 * {isLoading && <ListLoadingSkeleton count={8} />}
 */

