import React, { useState, useMemo, useRef } from 'react';
/**
 * 📊 ROBUST CHART COMPONENTS
 * Advanced chart components with error handling, loading states, and comprehensive features
 */


import { Card } from './Card';
import { Button } from './Button';
import { TimeSeriesData } from '@/types/monitoring';

// ============================================
// CHART LOADING SKELETON
// ============================================

interface ChartSkeletonProps {
    height?: number;
    type?: 'line' | 'bar' | 'gauge' | 'pie';
}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ height = 300, type = 'line' }) => {
    return (
        <div className="animate-pulse" style={{ height }}>
            <div className="bg-gray-200 rounded-lg h-full flex items-center justify-center">
                <div className="space-y-3 w-full max-w-md px-4">
                    {type === 'line' && (
                        <>
                            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                            <div className="space-y-2">
                                <div className="h-2 bg-gray-300 rounded"></div>
                                <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                                <div className="h-2 bg-gray-300 rounded w-4/6"></div>
                                <div className="h-2 bg-gray-300 rounded w-3/6"></div>
                            </div>
                        </>
                    )}
                    {type === 'bar' && (
                        <div className="flex items-end space-x-2 h-32">
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-300 rounded-t flex-1"
                                    style={{ height: `${Math.random() * 80 + 20}%` }}
                                ></div>
                            ))}
                        </div>
                    )}
                    {type === 'gauge' && (
                        <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// CHART ERROR BOUNDARY
// ============================================

interface ChartErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ChartErrorBoundary extends React.Component<
    React.PropsWithChildren<{}>,
    ChartErrorBoundaryState
> {
    constructor(props: React.PropsWithChildren<{}>) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Chart Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-600 text-4xl mb-2">📊</div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Chart Error</h3>
                    <p className="text-red-600 text-sm text-center max-w-sm">
                        Unable to render chart. Please try refreshing or contact support.
                    </p>
                    {this.state.error && (
                        <details className="mt-2 text-xs text-red-500">
                            <summary className="cursor-pointer">Error Details</summary>
                            <pre className="mt-1 p-2 bg-red-100 rounded">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => this.setState({ hasError: false })}
                        className="mt-3 text-red-600 border-red-600"
                    >
                        Retry
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

// ============================================
// ENHANCED LINE CHART
// ============================================

interface RobustLineChartProps {
    data: TimeSeriesData[];
    height?: number;
    title?: string;
    loading?: boolean;
    error?: string | null;
    showGrid?: boolean;
    showLegend?: boolean;
    colors?: string[];
    onDataPointClick?: (point: any) => void;
    exportable?: boolean;
    className?: string;
}

export const RobustLineChart: React.FC<RobustLineChartProps> = ({
    data,
    height = 300,
    title,
    loading = false,
    error = null,
    showGrid = true,
    showLegend = true,
    colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    onDataPointClick,
    exportable = false,
    className = ''
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<any>(null);
    const dimensions = { width: 800, height };

    // Error handling
    if (error) {
        return (
            <Card className={`${className} p-6`}>
                <div className="flex flex-col items-center justify-center" style={{ height }}>
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Chart Error</h3>
                    <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
            </Card>
        );
    }

    // Loading state
    if (loading) {
        return (
            <Card className={`${className} p-6`}>
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                <ChartSkeleton height={height} type="line" />
            </Card>
        );
    }

    // No data state
    if (!data || data.length === 0) {
        return (
            <Card className={`${className} p-6`}>
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                <div className="flex flex-col items-center justify-center" style={{ height }}>
                    <div className="text-gray-400 text-4xl mb-2">📈</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
                    <p className="text-gray-500 text-sm text-center">
                        No chart data to display. Check your data source or try refreshing.
                    </p>
                </div>
            </Card>
        );
    }

    // Data processing and scaling
    const processedData = useMemo(() => {
        const allPoints = data.flatMap(series => series.data);
        if (allPoints.length === 0) return { series: [], xRange: [0, 1], yRange: [0, 1] };

        const xValues = allPoints.map(p => p.timestamp.getTime());
        const yValues = allPoints.map(p => p.value);

        const xRange = [Math.min(...xValues), Math.max(...xValues)];
        const yRange = [Math.min(...yValues) * 0.9, Math.max(...yValues) * 1.1];

        const scaledSeries = data.map((series, index) => ({
            ...series,
            color: series.color || colors[index % colors.length],
            scaledData: series.data.map(point => ({
                ...point,
                x: ((point.timestamp.getTime() - xRange[0]) / (xRange[1] - xRange[0])) * (dimensions.width - 100) + 50,
                y: dimensions.height - 50 - ((point.value - yRange[0]) / (yRange[1] - yRange[0])) * (dimensions.height - 100)
            }))
        }));

        return { series: scaledSeries, xRange, yRange };
    }, [data, dimensions, colors]);

    // Handle export
    const handleExport = () => {
        if (!exportable || !svgRef.current) return;
        
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `${title || 'chart'}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
    };

    return (
        <ChartErrorBoundary>
            <Card className={`${className} p-6`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    {title && <h3 className="text-lg font-semibold">{title}</h3>}
                    {exportable && (
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            📥 Export
                        </Button>
                    )}
                </div>

                {/* Chart Container */}
                <div className="relative" style={{ height }}>
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                        className="overflow-visible"
                    >
                        {/* Grid */}
                        {showGrid && (
                            <g className="opacity-30">
                                {/* Horizontal grid lines */}
                                {[...Array(5)].map((_, i) => {
                                    const y = 50 + (i * (dimensions.height - 100)) / 4;
                                    return (
                                        <line
                                            key={`h-grid-${i}`}
                                            x1="50"
                                            y1={y}
                                            x2={dimensions.width - 50}
                                            y2={y}
                                            stroke="#e5e7eb"
                                            strokeWidth="1"
                                        />
                                    );
                                })}
                                {/* Vertical grid lines */}
                                {[...Array(6)].map((_, i) => {
                                    const x = 50 + (i * (dimensions.width - 100)) / 5;
                                    return (
                                        <line
                                            key={`v-grid-${i}`}
                                            x1={x}
                                            y1="50"
                                            x2={x}
                                            y2={dimensions.height - 50}
                                            stroke="#e5e7eb"
                                            strokeWidth="1"
                                        />
                                    );
                                })}
                            </g>
                        )}

                        {/* Data Lines */}
                        {processedData.series.map((series, seriesIndex) => (
                            <g key={`series-${seriesIndex}`}>
                                {/* Line Path */}
                                <path
                                    d={`M ${series.scaledData.map(p => `${p.x},${p.y}`).join(' L ')}`}
                                    fill="none"
                                    stroke={series.color}
                                    strokeWidth="2"
                                    className="transition-opacity hover:opacity-80"
                                />
                                
                                {/* Data Points */}
                                {series.scaledData.map((point, pointIndex) => (
                                    <circle
                                        key={`point-${seriesIndex}-${pointIndex}`}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        fill={series.color}
                                        className="cursor-pointer hover:r-6 transition-all"
                                        onMouseEnter={() => setHoveredPoint({ ...point, series: series.name })}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                        onClick={() => onDataPointClick?.(point)}
                                    />
                                ))}
                            </g>
                        ))}

                        {/* Axes */}
                        <g>
                            {/* X-axis */}
                            <line
                                x1="50"
                                y1={dimensions.height - 50}
                                x2={dimensions.width - 50}
                                y2={dimensions.height - 50}
                                stroke="#374151"
                                strokeWidth="2"
                            />
                            {/* Y-axis */}
                            <line
                                x1="50"
                                y1="50"
                                x2="50"
                                y2={dimensions.height - 50}
                                stroke="#374151"
                                strokeWidth="2"
                            />
                        </g>

                        {/* Axis Labels */}
                        <g className="text-xs fill-gray-600">
                            {/* Y-axis labels */}
                            {[...Array(5)].map((_, i) => {
                                const y = 50 + (i * (dimensions.height - 100)) / 4;
                                const value = processedData.yRange[1] - (i * (processedData.yRange[1] - processedData.yRange[0])) / 4;
                                return (
                                    <text key={`y-label-${i}`} x="40" y={y + 4} textAnchor="end">
                                        {Math.round(value)}
                                    </text>
                                );
                            })}
                        </g>
                    </svg>

                    {/* Tooltip */}
                    {hoveredPoint && (
                        <div
                            className="absolute bg-gray-800 text-white p-2 rounded shadow-lg text-xs z-10 pointer-events-none"
                            style={{
                                left: hoveredPoint.x + 10,
                                top: hoveredPoint.y - 10,
                                transform: 'translate(0, -100%)'
                            }}
                        >
                            <div className="font-semibold">{hoveredPoint.series}</div>
                            <div>Value: {hoveredPoint.value}</div>
                            <div>Time: {hoveredPoint.timestamp.toLocaleTimeString()}</div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                {showLegend && data.length > 1 && (
                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
                        {processedData.series.map((series, index) => (
                            <div key={`legend-${index}`} className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: series.color }}
                                ></div>
                                <span className="text-sm text-gray-700">{series.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </ChartErrorBoundary>
    );
};

// ============================================
// ENHANCED BAR CHART
// ============================================

interface RobustBarChartProps {
    data: Array<{ name: string; value: number; color?: string }>;
    height?: number;
    title?: string;
    loading?: boolean;
    error?: string | null;
    horizontal?: boolean;
    showValues?: boolean;
    className?: string;
}

export const RobustBarChart: React.FC<RobustBarChartProps> = ({
    data,
    height = 300,
    title,
    loading = false,
    error = null,
    horizontal = false,
    showValues = true,
    className = ''
}) => {
    // Error handling
    if (error) {
        return (
            <Card className={`${className} p-6`}>
                <div className="flex flex-col items-center justify-center" style={{ height }}>
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Chart Error</h3>
                    <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
            </Card>
        );
    }

    // Loading state
    if (loading) {
        return (
            <Card className={`${className} p-6`}>
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                <ChartSkeleton height={height} type="bar" />
            </Card>
        );
    }

    // No data state
    if (!data || data.length === 0) {
        return (
            <Card className={`${className} p-6`}>
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                <div className="flex flex-col items-center justify-center" style={{ height }}>
                    <div className="text-gray-400 text-4xl mb-2">📊</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
                    <p className="text-gray-500 text-sm text-center">
                        No chart data to display. Check your data source or try refreshing.
                    </p>
                </div>
            </Card>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <ChartErrorBoundary>
            <Card className={`${className} p-6`}>
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                
                <div className="relative" style={{ height }}>
                    {horizontal ? (
                        // Horizontal bars
                        <div className="space-y-2 h-full flex flex-col justify-around">
                            {data.map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-20 text-xs text-right pr-2 truncate">
                                        {item.name}
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded overflow-hidden">
                                        <div
                                            className="h-6 rounded transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                            style={{
                                                width: `${(item.value / maxValue) * 100}%`,
                                                backgroundColor: item.color || '#3B82F6'
                                            }}
                                        >
                                            {showValues && (
                                                <span className="text-white text-xs font-medium">
                                                    {item.value}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Vertical bars
                        <div className="flex items-end justify-around h-full space-x-1">
                            {data.map((item, index) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div
                                        className="w-full rounded-t transition-all duration-500 ease-out flex items-start justify-center pt-2"
                                        style={{
                                            height: `${(item.value / maxValue) * 80}%`,
                                            backgroundColor: item.color || '#3B82F6',
                                            minHeight: '20px'
                                        }}
                                    >
                                        {showValues && (
                                            <span className="text-white text-xs font-medium">
                                                {item.value}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-center mt-2 max-w-full truncate">
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </ChartErrorBoundary>
    );
};

// ============================================
// ENHANCED GAUGE CHART
// ============================================

interface RobustGaugeChartProps {
    value: number;
    min?: number;
    max?: number;
    title?: string;
    loading?: boolean;
    error?: string | null;
    color?: string;
    size?: number;
    showValue?: boolean;
    unit?: string;
    className?: string;
}

export const RobustGaugeChart: React.FC<RobustGaugeChartProps> = ({
    value,
    min = 0,
    max = 100,
    title,
    loading = false,
    error = null,
    color = '#3B82F6',
    size = 200,
    showValue = true,
    unit = '',
    className = ''
}) => {
    // Error handling
    if (error) {
        return (
            <Card className={`${className} p-6 flex flex-col items-center`}>
                <div className="text-red-500 text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Gauge Error</h3>
                <p className="text-red-600 text-sm text-center">{error}</p>
            </Card>
        );
    }

    // Loading state
    if (loading) {
        return (
            <Card className={`${className} p-6`}>
                {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
                <ChartSkeleton height={size} type="gauge" />
            </Card>
        );
    }

    const normalizedValue = Math.max(min, Math.min(max, value));
    const percentage = ((normalizedValue - min) / (max - min)) * 100;
    const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees
    
    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Calculate needle position
    const needleX = centerX + radius * 0.8 * Math.cos(angle * Math.PI / 180);
    const needleY = centerY + radius * 0.8 * Math.sin(angle * Math.PI / 180);

    return (
        <ChartErrorBoundary>
            <Card className={`${className} p-6 flex flex-col items-center`}>
                {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
                
                <div className="relative">
                    <svg width={size} height={size} className="transform -rotate-90">
                        {/* Background arc */}
                        <path
                            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="20"
                            strokeLinecap="round"
                        />
                        
                        {/* Value arc */}
                        <path
                            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                            fill="none"
                            stroke={color}
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${(percentage / 100) * Math.PI * radius} ${Math.PI * radius}`}
                            className="transition-all duration-1000 ease-out"
                        />
                        
                        {/* Needle */}
                        <line
                            x1={centerX}
                            y1={centerY}
                            x2={needleX}
                            y2={needleY}
                            stroke="#374151"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                        
                        {/* Center dot */}
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r="8"
                            fill="#374151"
                        />
                    </svg>
                    
                    {/* Value display */}
                    {showValue && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-3xl font-bold text-gray-800">
                                {Math.round(normalizedValue)}
                            </div>
                            {unit && (
                                <div className="text-sm text-gray-600">{unit}</div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Scale labels */}
                <div className="flex justify-between w-full mt-2 text-xs text-gray-600">
                    <span>{min}{unit}</span>
                    <span>{max}{unit}</span>
                </div>
            </Card>
        </ChartErrorBoundary>
    );
};

export default {
    RobustLineChart,
    RobustBarChart,
    RobustGaugeChart,
    ChartSkeleton,
    ChartErrorBoundary
};
