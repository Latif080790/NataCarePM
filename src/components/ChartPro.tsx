/**
 * ChartPro - Enterprise-grade chart wrapper system
 * 
 * Provides unified interface for all chart types with:
 * - Loading states & error boundaries
 * - Responsive behavior & container queries
 * - Export functionality (PNG, SVG, CSV)
 * - Consistent styling & theming
 * - Accessibility features (ARIA labels, keyboard nav)
 * - Animation controls
 * - Legend customization
 * - Data formatting & validation
 * 
 * @module ChartPro
 */

import React, { useState, useRef, useEffect, ErrorInfo, Component } from 'react';
import { 
  Download, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Settings,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { Card } from './Card';
import { ButtonPro } from './ButtonPro';
import { BadgePro } from './BadgePro';
import { ModalPro } from './ModalPro';
import { toast } from './ToastPro';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ChartType = 'line' | 'bar' | 'gauge' | 'pie' | 'area' | 'scatter';
export type ExportFormat = 'png' | 'svg' | 'csv' | 'json';

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export interface ChartConfig {
  responsive?: boolean;
  animated?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showAxes?: boolean;
  exportable?: boolean;
  fullscreenable?: boolean;
  refreshable?: boolean;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  theme?: 'light' | 'dark' | 'auto';
  colorScheme?: string[];
}

export interface ChartProProps {
  // Core props
  type: ChartType;
  data: ChartDataPoint[] | any;
  title?: string;
  description?: string;
  config?: ChartConfig;
  className?: string;
  
  // Customization
  children?: React.ReactNode;
  renderChart?: (data: any, config: ChartConfig) => React.ReactNode;
  
  // Callbacks
  onExport?: (format: ExportFormat, data: any) => void;
  onRefresh?: () => void | Promise<void>;
  onError?: (error: Error) => void;
  
  // Loading & error states
  loading?: boolean;
  error?: string | null;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
}

interface LegendItem {
  label: string;
  color: string;
  value?: number;
  visible: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ChartConfig = {
  responsive: true,
  animated: true,
  showLegend: true,
  showGrid: true,
  showTooltip: true,
  showAxes: true,
  exportable: true,
  fullscreenable: true,
  refreshable: true,
  minHeight: 300,
  maxHeight: 600,
  aspectRatio: 16 / 9,
  theme: 'auto',
  colorScheme: [
    '#F87941', // precious-persimmon
    '#F9B095', // no-way-rose
    '#E6E4E6', // violet-essence
    '#B1B1B1', // palladium
    '#10b981', // success
    '#3b82f6', // info
    '#f59e0b', // warning
    '#ef4444', // error
  ],
};

// ============================================================================
// Error Boundary for Charts
// ============================================================================

interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChartPro Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-error mb-4" />
            <h3 className="text-heading-4 visual-primary mb-2">Chart Error</h3>
            <p className="text-body-small visual-secondary">
              {this.state.error?.message || 'Failed to render chart'}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook for managing chart container dimensions
 */
function useChartDimensions(containerRef: React.RefObject<HTMLDivElement>, config: ChartConfig) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current || !config.responsive) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const height = config.aspectRatio 
          ? width / config.aspectRatio 
          : Math.min(Math.max(width * 0.6, config.minHeight || 300), config.maxHeight || 600);
        
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [containerRef, config]);

  return dimensions;
}

/**
 * Hook for managing legend visibility state
 */
function useLegend(data: ChartDataPoint[], colorScheme: string[]) {
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);

  useEffect(() => {
    const items: LegendItem[] = data.map((point, index) => ({
      label: point.label,
      color: colorScheme[index % colorScheme.length],
      value: point.value,
      visible: true,
    }));
    setLegendItems(items);
  }, [data, colorScheme]);

  const toggleLegendItem = (index: number) => {
    setLegendItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, visible: !item.visible } : item))
    );
  };

  return { legendItems, toggleLegendItem };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Export chart to PNG
 */
async function exportToPNG(element: HTMLElement, filename: string): Promise<void> {
  try {
    // Using html2canvas would be ideal, but we'll provide a basic implementation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // For now, create a simple download trigger
    // In production, use html2canvas library
    toast({
      title: 'Export PNG',
      description: 'PNG export requires html2canvas library. Install with: npm install html2canvas',
      variant: 'info',
    });
  } catch (error) {
    throw new Error('Failed to export PNG');
  }
}

/**
 * Export chart to SVG
 */
async function exportToSVG(element: HTMLElement, filename: string): Promise<void> {
  try {
    const svgElement = element.querySelector('svg');
    if (!svgElement) throw new Error('No SVG found in chart');

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'SVG exported successfully', variant: 'success' });
  } catch (error) {
    throw new Error('Failed to export SVG');
  }
}

/**
 * Export chart data to CSV
 */
function exportToCSV(data: ChartDataPoint[], filename: string): void {
  try {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => row[header]).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'CSV exported successfully', variant: 'success' });
  } catch (error) {
    throw new Error('Failed to export CSV');
  }
}

/**
 * Export chart data to JSON
 */
function exportToJSON(data: any, filename: string): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'JSON exported successfully', variant: 'success' });
  } catch (error) {
    throw new Error('Failed to export JSON');
  }
}

// ============================================================================
// ChartToolbar Component
// ============================================================================

interface ChartToolbarProps {
  config: ChartConfig;
  onExport: (format: ExportFormat) => void;
  onRefresh?: () => void;
  onToggleFullscreen: () => void;
  onToggleSettings: () => void;
  isFullscreen: boolean;
  loading?: boolean;
}

const ChartToolbar: React.FC<ChartToolbarProps> = ({
  config,
  onExport,
  onRefresh,
  onToggleFullscreen,
  onToggleSettings,
  isFullscreen,
  loading,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {config.exportable && (
        <div className="relative">
          <ButtonPro
            variant="ghost"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Export chart"
          >
            Export
          </ButtonPro>
          
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] glass-enhanced border border-violet-essence/20 rounded-xl shadow-xl p-2">
              <button
                className="w-full text-left px-3 py-2 text-body-small visual-primary hover:bg-violet-essence/10 rounded-lg transition-colors"
                onClick={() => {
                  onExport('png');
                  setShowExportMenu(false);
                }}
              >
                PNG Image
              </button>
              <button
                className="w-full text-left px-3 py-2 text-body-small visual-primary hover:bg-violet-essence/10 rounded-lg transition-colors"
                onClick={() => {
                  onExport('svg');
                  setShowExportMenu(false);
                }}
              >
                SVG Vector
              </button>
              <button
                className="w-full text-left px-3 py-2 text-body-small visual-primary hover:bg-violet-essence/10 rounded-lg transition-colors"
                onClick={() => {
                  onExport('csv');
                  setShowExportMenu(false);
                }}
              >
                CSV Data
              </button>
              <button
                className="w-full text-left px-3 py-2 text-body-small visual-primary hover:bg-violet-essence/10 rounded-lg transition-colors"
                onClick={() => {
                  onExport('json');
                  setShowExportMenu(false);
                }}
              >
                JSON Data
              </button>
            </div>
          )}
        </div>
      )}

      {config.refreshable && onRefresh && (
        <ButtonPro
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh chart"
        />
      )}

      {config.fullscreenable && (
        <ButtonPro
          variant="ghost"
          size="sm"
          leftIcon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        />
      )}

      <ButtonPro
        variant="ghost"
        size="sm"
        leftIcon={<Settings className="w-4 h-4" />}
        onClick={onToggleSettings}
        aria-label="Chart settings"
      />
    </div>
  );
};

// ============================================================================
// ChartLegend Component
// ============================================================================

interface ChartLegendProps {
  items: LegendItem[];
  onToggle: (index: number) => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const ChartLegend: React.FC<ChartLegendProps> = ({ items, onToggle, position = 'bottom' }) => {
  const positionClasses = {
    top: 'flex-row flex-wrap mb-4',
    bottom: 'flex-row flex-wrap mt-4',
    left: 'flex-col mr-4',
    right: 'flex-col ml-4',
  };

  return (
    <div className={`flex gap-4 ${positionClasses[position]}`}>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onToggle(index)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            item.visible
              ? 'bg-violet-essence/10 hover:bg-violet-essence/20'
              : 'bg-transparent opacity-50 hover:opacity-75'
          }`}
          aria-label={`Toggle ${item.label}`}
          aria-pressed={item.visible}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-caption visual-primary font-medium">{item.label}</span>
          {item.value !== undefined && (
            <span className="text-caption visual-secondary ml-1">
              ({item.value.toLocaleString()})
            </span>
          )}
          {!item.visible && <EyeOff className="w-3 h-3 ml-1 text-visual-secondary" />}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// ChartPro Main Component
// ============================================================================

export const ChartPro: React.FC<ChartProProps> = ({
  type,
  data,
  title,
  description,
  config: userConfig,
  className = '',
  children,
  renderChart,
  onExport,
  onRefresh,
  onError,
  loading = false,
  error = null,
  ariaLabel,
  ariaDescription,
}) => {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useChartDimensions(containerRef, config);
  const { legendItems, toggleLegendItem } = useLegend(
    Array.isArray(data) ? data : [],
    config.colorScheme || DEFAULT_CONFIG.colorScheme!
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      if (onExport) {
        onExport(format, data);
        return;
      }

      const filename = `chart-${type}-${Date.now()}`;

      switch (format) {
        case 'png':
          if (chartRef.current) {
            await exportToPNG(chartRef.current, `${filename}.png`);
          }
          break;
        case 'svg':
          if (chartRef.current) {
            await exportToSVG(chartRef.current, `${filename}.svg`);
          }
          break;
        case 'csv':
          if (Array.isArray(data)) {
            exportToCSV(data, `${filename}.csv`);
          }
          break;
        case 'json':
          exportToJSON(data, `${filename}.json`);
          break;
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({ title: 'Success', description: 'Chart refreshed', variant: 'success' });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <ChartErrorBoundary onError={onError}>
      <Card
        ref={containerRef}
        className={`card-enhanced ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
        role="img"
        aria-label={ariaLabel || `${type} chart: ${title}`}
        aria-description={ariaDescription || description}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-violet-essence/20">
            <div className="flex-1">
              {title && <h3 className="text-heading-3 visual-primary mb-1">{title}</h3>}
              {description && <p className="text-body-small visual-secondary">{description}</p>}
            </div>
            <ChartToolbar
              config={config}
              onExport={handleExport}
              onRefresh={handleRefresh}
              onToggleFullscreen={toggleFullscreen}
              onToggleSettings={() => setShowSettings(true)}
              isFullscreen={isFullscreen}
              loading={loading || isRefreshing}
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-body-small visual-secondary">Loading chart data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-12 h-12 text-error mb-4" />
            <h4 className="text-heading-4 visual-primary mb-2">Failed to load chart</h4>
            <p className="text-body-small visual-secondary">{error}</p>
            {onRefresh && (
              <ButtonPro
                variant="outline"
                size="sm"
                className="mt-4"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRefresh}
              >
                Retry
              </ButtonPro>
            )}
          </div>
        )}

        {/* Chart Content */}
        {!loading && !error && (
          <>
            {config.showLegend && legendItems.length > 0 && (
              <ChartLegend items={legendItems} onToggle={toggleLegendItem} position="top" />
            )}

            <div
              ref={chartRef}
              className={`chart-container ${config.animated ? 'animate-fadeIn' : ''}`}
              style={{
                minHeight: config.minHeight,
                maxHeight: config.maxHeight,
              }}
            >
              {renderChart ? renderChart(data, config) : children}
            </div>
          </>
        )}

        {/* Settings Modal */}
        <ModalPro
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Chart Settings"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-body-small visual-primary">Show Legend</span>
              <input type="checkbox" defaultChecked={config.showLegend} className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-small visual-primary">Show Grid</span>
              <input type="checkbox" defaultChecked={config.showGrid} className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-small visual-primary">Animations</span>
              <input type="checkbox" defaultChecked={config.animated} className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-small visual-primary">Tooltips</span>
              <input type="checkbox" defaultChecked={config.showTooltip} className="toggle" />
            </div>
          </div>
        </ModalPro>
      </Card>
    </ChartErrorBoundary>
  );
};

// ============================================================================
// Export convenience wrappers for specific chart types
// ============================================================================

export const LineChartPro: React.FC<Omit<ChartProProps, 'type'>> = (props) => (
  <ChartPro {...props} type="line" />
);

export const BarChartPro: React.FC<Omit<ChartProProps, 'type'>> = (props) => (
  <ChartPro {...props} type="bar" />
);

export const GaugeChartPro: React.FC<Omit<ChartProProps, 'type'>> = (props) => (
  <ChartPro {...props} type="gauge" />
);

export const PieChartPro: React.FC<Omit<ChartProProps, 'type'>> = (props) => (
  <ChartPro {...props} type="pie" />
);

export default ChartPro;
