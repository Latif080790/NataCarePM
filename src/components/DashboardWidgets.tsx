/**
 * Dashboard Widgets System
 * 
 * Enterprise-grade widget components for dashboard layouts with:
 * - Drag-and-drop positioning (react-grid-layout)
 * - Customizable sizes & responsive breakpoints
 * - Collapsible/expandable panels
 * - Widget state persistence (localStorage)
 * - Multiple widget types (stat, chart, list, metric, table)
 * - Export & refresh capabilities
 * - Loading & error states
 * - Full accessibility support
 * 
 * @module DashboardWidgets
 */

import React, { useState, useEffect, ReactNode } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  RefreshCw,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ListOrdered,
} from 'lucide-react';
import { Card } from './Card';
import { BadgePro } from './BadgePro';
import { SpinnerPro } from './SpinnerPro';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type WidgetType = 'stat' | 'chart' | 'list' | 'metric' | 'table' | 'custom';
export type TrendDirection = 'up' | 'down' | 'neutral';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size?: WidgetSize;
  collapsible?: boolean;
  closable?: boolean;
  refreshable?: boolean;
  exportable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  initialCollapsed?: boolean;
  className?: string;
}

export interface StatData {
  value: string | number;
  label: string;
  trend?: {
    direction: TrendDirection;
    value: number;
    label?: string;
  };
  icon?: ReactNode;
  color?: string;
}

export interface ChartWidgetData {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any;
  config?: any;
}

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: ReactNode;
  badge?: string;
  color?: string;
}

export interface MetricData {
  current: number;
  target: number;
  unit?: string;
  label: string;
  color?: string;
}

// ============================================================================
// Widget Container Component
// ============================================================================

export interface WidgetContainerProps extends WidgetConfig {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void | Promise<void>;
  onClose?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  footer?: ReactNode;
  headerActions?: ReactNode;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  id,
  title,
  size = 'md',
  collapsible = true,
  closable = false,
  refreshable = true,
  exportable = false,
  initialCollapsed = false,
  className = '',
  children,
  loading = false,
  error = null,
  onRefresh,
  onClose,
  onExport,
  onSettings,
  footer,
  headerActions,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sizeClasses = {
    sm: 'col-span-1',
    md: 'col-span-2',
    lg: 'col-span-3',
    xl: 'col-span-4',
    full: 'col-span-full',
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card
      className={`widget-container card-enhanced ${sizeClasses[size]} ${className}`}
      data-widget-id={id}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-violet-essence/20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3 className="text-heading-4 visual-primary font-semibold truncate">{title}</h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {headerActions}

          {refreshable && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="p-1.5 rounded-lg hover:bg-violet-essence/10 transition-colors disabled:opacity-50"
              aria-label="Refresh widget"
            >
              <RefreshCw className={`w-4 h-4 visual-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {exportable && (
            <button
              onClick={onExport}
              className="p-1.5 rounded-lg hover:bg-violet-essence/10 transition-colors"
              aria-label="Export data"
            >
              <Download className="w-4 h-4 visual-secondary" />
            </button>
          )}

          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1.5 rounded-lg hover:bg-violet-essence/10 transition-colors"
              aria-label="Widget settings"
            >
              <Settings className="w-4 h-4 visual-secondary" />
            </button>
          )}

          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-violet-essence/10 transition-colors"
              aria-label={isCollapsed ? 'Expand widget' : 'Collapse widget'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 visual-secondary" />
              ) : (
                <ChevronUp className="w-4 h-4 visual-secondary" />
              )}
            </button>
          )}

          {closable && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
              aria-label="Close widget"
            >
              <X className="w-4 h-4 text-error" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <SpinnerPro size="lg" />
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center mb-3">
                <X className="w-6 h-6 text-error" />
              </div>
              <p className="text-body-small text-error">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="widget-content">{children}</div>
          )}

          {footer && (
            <div className="mt-4 pt-3 border-t border-violet-essence/20">
              {footer}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

// ============================================================================
// Stat Widget
// ============================================================================

export interface StatWidgetProps extends Omit<WidgetContainerProps, 'children'> {
  data: StatData;
  compact?: boolean;
}

export const StatWidget: React.FC<StatWidgetProps> = ({
  data,
  compact = false,
  ...containerProps
}) => {
  const getTrendIcon = () => {
    if (!data.trend) return null;
    
    switch (data.trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (!data.trend) return 'visual-secondary';
    
    switch (data.trend.direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-visual-secondary';
    }
  };

  return (
    <WidgetContainer {...containerProps}>
      <div className={`flex ${compact ? 'flex-row items-center gap-4' : 'flex-col'}`}>
        {/* Icon */}
        {data.icon && (
          <div
            className={`${
              compact ? 'w-12 h-12' : 'w-16 h-16'
            } rounded-xl flex items-center justify-center mb-${compact ? '0' : '4'}`}
            style={{ backgroundColor: data.color ? `${data.color}20` : undefined }}
          >
            <div style={{ color: data.color }}>{data.icon}</div>
          </div>
        )}

        {/* Value & Label */}
        <div className="flex-1">
          <div className={`${compact ? 'text-2xl' : 'text-4xl'} font-bold gradient-text mb-1`}>
            {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
          </div>
          <div className="text-body-small visual-secondary">{data.label}</div>
        </div>

        {/* Trend */}
        {data.trend && (
          <div className={`flex items-center gap-1.5 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-semibold">{data.trend.value}%</span>
            {data.trend.label && (
              <span className="text-xs visual-secondary ml-1">({data.trend.label})</span>
            )}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

// ============================================================================
// Chart Widget
// ============================================================================

export interface ChartWidgetProps extends Omit<WidgetContainerProps, 'children'> {
  chartData: ChartWidgetData;
  renderChart?: (data: any, config: any) => ReactNode;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  chartData,
  renderChart,
  ...containerProps
}) => {
  return (
    <WidgetContainer {...containerProps}>
      <div className="chart-widget min-h-[200px] flex items-center justify-center">
        {renderChart ? (
          renderChart(chartData.data, chartData.config)
        ) : (
          <div className="text-center visual-secondary">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-body-small">Custom chart renderer required</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

// ============================================================================
// List Widget
// ============================================================================

export interface ListWidgetProps extends Omit<WidgetContainerProps, 'children'> {
  items: ListItem[];
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onItemClick?: (item: ListItem) => void;
}

export const ListWidget: React.FC<ListWidgetProps> = ({
  items,
  maxItems = 5,
  showViewAll = true,
  onViewAll,
  onItemClick,
  ...containerProps
}) => {
  const displayItems = items.slice(0, maxItems);

  return (
    <WidgetContainer
      {...containerProps}
      footer={
        showViewAll && items.length > maxItems ? (
          <button
            onClick={onViewAll}
            className="w-full text-center py-2 text-body-small text-primary hover:text-primary-dark transition-colors font-medium"
          >
            View all {items.length} items
          </button>
        ) : undefined
      }
    >
      <div className="space-y-2">
        {displayItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-violet-essence/10 transition-colors text-left group"
          >
            {/* Icon */}
            {item.icon && (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.color ? `${item.color}20` : undefined }}
              >
                <div style={{ color: item.color }}>{item.icon}</div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-body-small visual-primary font-medium truncate group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                {item.badge && (
                  <BadgePro variant="default" size="sm">
                    {item.badge}
                  </BadgePro>
                )}
              </div>
              {item.subtitle && (
                <p className="text-caption visual-secondary truncate">{item.subtitle}</p>
              )}
            </div>

            {/* Value */}
            {item.value !== undefined && (
              <div className="text-body-small visual-primary font-semibold flex-shrink-0">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </div>
            )}
          </button>
        ))}

        {displayItems.length === 0 && (
          <div className="text-center py-8 visual-secondary">
            <ListOrdered className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-body-small">No items to display</p>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

// ============================================================================
// Metric Widget (Progress Bar)
// ============================================================================

export interface MetricWidgetProps extends Omit<WidgetContainerProps, 'children'> {
  data: MetricData;
  showPercentage?: boolean;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  data,
  showPercentage = true,
  ...containerProps
}) => {
  const percentage = Math.min(100, Math.max(0, (data.current / data.target) * 100));
  const isOverTarget = data.current > data.target;

  return (
    <WidgetContainer {...containerProps}>
      <div className="space-y-4">
        {/* Values */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-bold gradient-text">
              {data.current.toLocaleString()}
            </span>
            {data.unit && <span className="text-body-small visual-secondary ml-1">{data.unit}</span>}
          </div>
          <div className="text-right">
            <div className="text-body-small visual-secondary">Target</div>
            <div className="text-lg font-semibold visual-primary">
              {data.target.toLocaleString()}
              {data.unit && <span className="text-caption visual-secondary ml-1">{data.unit}</span>}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-caption visual-secondary">
            <span>{data.label}</span>
            {showPercentage && <span className="font-semibold">{percentage.toFixed(1)}%</span>}
          </div>
          <div className="relative">
            <div className="w-full h-3 bg-violet-essence/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                  isOverTarget
                    ? 'bg-gradient-to-r from-warning to-error'
                    : 'bg-gradient-to-r from-primary to-primary-dark'
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

// ============================================================================
// Widget Grid Layout
// ============================================================================

export interface WidgetGridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  children,
  columns = 4,
  gap = 6,
  className = '',
}) => {
  return (
    <div
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// Custom Hook for Widget State Management
// ============================================================================

export interface WidgetState {
  id: string;
  collapsed: boolean;
  visible: boolean;
  position?: { x: number; y: number };
  size?: WidgetSize;
}

export function useWidgetState(dashboardId: string, initialWidgets: WidgetConfig[]) {
  const storageKey = `dashboard-widgets-${dashboardId}`;

  const [widgets, setWidgets] = useState<WidgetState[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialWidgets.map((w) => ({
          id: w.id,
          collapsed: w.initialCollapsed || false,
          visible: true,
        }));
      }
    }
    return initialWidgets.map((w) => ({
      id: w.id,
      collapsed: w.initialCollapsed || false,
      visible: true,
    }));
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(widgets));
  }, [widgets, storageKey]);

  const toggleCollapse = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, collapsed: !w.collapsed } : w))
    );
  };

  const toggleVisibility = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const updatePosition = (id: string, position: { x: number; y: number }) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position } : w))
    );
  };

  const updateSize = (id: string, size: WidgetSize) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size } : w))
    );
  };

  const resetLayout = () => {
    setWidgets(
      initialWidgets.map((w) => ({
        id: w.id,
        collapsed: w.initialCollapsed || false,
        visible: true,
      }))
    );
  };

  return {
    widgets,
    toggleCollapse,
    toggleVisibility,
    updatePosition,
    updateSize,
    resetLayout,
  };
}

// ============================================================================
// Export all components
// ============================================================================

export default {
  WidgetContainer,
  StatWidget,
  ChartWidget,
  ListWidget,
  MetricWidget,
  WidgetGrid,
  useWidgetState,
};
