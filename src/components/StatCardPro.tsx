/**
 * 📊 Professional StatCard Component
 * Enterprise-grade metric display card
 * 
 * Features:
 * - Clean, minimal design
 * - Clear visual hierarchy
 * - Accessible (WCAG AA)
 * - Mobile-friendly
 * - No distracting animations
 * 
 * Usage:
 * <StatCardPro
 *   title="Total Revenue"
 *   value="$1.2M"
 *   icon={DollarSign}
 *   trend={{ value: 12, label: 'vs last month' }}
 *   variant="primary"
 * />
 */

import React from 'react';
import { LucideProps } from 'lucide-react';

interface StatCardProProps {
  /** Main label for the metric */
  title: string;
  
  /** The primary value to display */
  value: string | number;
  
  /** Icon component from lucide-react */
  icon: React.ComponentType<LucideProps>;
  
  /** Optional description text */
  description?: string;
  
  /** Trend indicator (optional) */
  trend?: {
    value: number;  // Percentage change
    label?: string; // e.g., "vs last month"
    isPositiveGood?: boolean; // Default true - green for positive, red for negative
  };
  
  /** Visual variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  
  /** Click handler (optional) */
  onClick?: () => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Additional className */
  className?: string;
}

export const StatCardPro = React.memo(function StatCardPro({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  onClick,
  isLoading = false,
  className = '',
}: StatCardProProps) {
  // Variant styles - using design tokens
  const variantStyles = {
    default: {
      border: 'border-l-neutral-300',
      iconBg: 'bg-neutral-100',
      iconColor: 'text-neutral-600',
    },
    primary: {
      border: 'border-l-primary-600',
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    success: {
      border: 'border-l-semantic-success',
      iconBg: 'bg-semantic-successLight',
      iconColor: 'text-semantic-success',
    },
    warning: {
      border: 'border-l-semantic-warning',
      iconBg: 'bg-semantic-warningLight',
      iconColor: 'text-semantic-warning',
    },
    error: {
      border: 'border-l-semantic-error',
      iconBg: 'bg-semantic-errorLight',
      iconColor: 'text-semantic-error',
    },
  };

  const styles = variantStyles[variant];

  // Trend color logic
  const getTrendColor = () => {
    if (!trend) return '';
    const isPositive = trend.value >= 0;
    const isPositiveGood = trend.isPositiveGood !== false; // Default true
    
    if (isPositive && isPositiveGood) return 'text-green-600';
    if (!isPositive && !isPositiveGood) return 'text-green-600';
    if (isPositive && !isPositiveGood) return 'text-red-600';
    if (!isPositive && isPositiveGood) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend.value >= 0 ? '↑' : '↓';
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 
        border-l-4 ${styles.border}
        p-6
        transition-shadow duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : 'shadow-sm'}
        ${isLoading ? 'opacity-60 pointer-events-none' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      {/* Header: Title + Icon */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </p>
        
        {/* Icon Badge */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${styles.iconBg}
        `}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-3 mb-2">
        {isLoading ? (
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-gray-900">
            {value}
          </p>
        )}

        {/* Trend Indicator */}
        {trend && !isLoading && (
          <div className={`
            flex items-center gap-1 text-sm font-medium
            ${getTrendColor()}
          `}>
            <span className="text-base">{getTrendIcon()}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Footer: Description or Trend Label */}
      {(description || trend?.label) && !isLoading && (
        <p className="text-sm text-gray-500 mt-2">
          {description || trend?.label}
        </p>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.value === nextProps.value &&
    prevProps.title === nextProps.title &&
    prevProps.trend?.value === nextProps.trend?.value &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.variant === nextProps.variant
  );
});

/**
 * Loading Skeleton for StatCard
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-gray-300 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="h-9 w-32 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

/**
 * Grid Container for StatCards
 */
interface StatCardGridProps {
  children: React.ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export function StatCardGrid({
  children,
  columns = {
    default: 1,
    sm: 2,
    md: 2,
    lg: 4,
  },
  className = '',
}: StatCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const responsiveClasses = [
    columns.default ? gridCols[columns.default as keyof typeof gridCols] : 'grid-cols-1',
    columns.sm ? `sm:${gridCols[columns.sm as keyof typeof gridCols]}` : '',
    columns.md ? `md:${gridCols[columns.md as keyof typeof gridCols]}` : '',
    columns.lg ? `lg:${gridCols[columns.lg as keyof typeof gridCols]}` : '',
    columns.xl ? `xl:${gridCols[columns.xl as keyof typeof gridCols]}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${responsiveClasses} gap-6 ${className}`}>
      {children}
    </div>
  );
}
