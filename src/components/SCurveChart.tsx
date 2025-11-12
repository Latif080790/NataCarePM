import React, { useState } from 'react';

interface SCurveDataPoint {
  month: string;
  planned: number;
  actual: number;
}

interface SCurveChartProps {
  data: SCurveDataPoint[];
}

/**
 * SCurveChart Component - Performance Optimized
 * Uses React.memo to prevent unnecessary re-renders when data hasn't changed
 * Optimized for construction project S-curve visualization
 */
const SCurveChartComponent: React.FC<SCurveChartProps> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    month: string;
    planned: number;
    actual: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>No S-Curve data available</p>
      </div>
    );
  }

  const width = 1000;
  const height = 300;
  const padding = { top: 30, right: 80, bottom: 50, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => Math.max(d.planned, d.actual)));

  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => chartHeight - (value / maxValue) * chartHeight;

  // Generate path for line
  const createPath = (dataKey: 'planned' | 'actual') => {
    return data
      .map((point, index) => {
        const x = xScale(index) + padding.left;
        const y = yScale(point[dataKey]) + padding.top;
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  const plannedPath = createPath('planned');
  const actualPath = createPath('actual');

  return (
    <div className="relative w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        style={{ minHeight: '300px' }}
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="plannedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F87941" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F87941" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="actualGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y = yScale(value) + padding.top;
          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={value === 0 || value === 100 ? '#475569' : '#334155'}
                strokeWidth={value === 0 || value === 100 ? '2' : '1'}
                strokeDasharray={value === 0 || value === 100 ? '0' : '4 4'}
                opacity={value === 0 || value === 100 ? '0.6' : '0.3'}
              />
              <text
                x={padding.left - 15}
                y={y + 5}
                textAnchor="end"
                className="text-[12px] fill-slate-400 font-semibold"
              >
                {value}%
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((point, index) => {
          const x = xScale(index) + padding.left;
          return (
            <g key={point.month}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={height - padding.bottom}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.2"
              />
              <text
                x={x}
                y={height - padding.bottom + 25}
                textAnchor="middle"
                className="text-[12px] fill-slate-300 font-semibold"
              >
                {point.month}
              </text>
            </g>
          );
        })}

        {/* Planned line with area fill */}
        <path
          d={`${plannedPath} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
          fill="url(#plannedGradient)"
          opacity="0.3"
        />
        <path
          d={plannedPath}
          fill="none"
          stroke="#F87941"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />

        {/* Actual line with area fill */}
        <path
          d={`${actualPath} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`}
          fill="url(#actualGradient)"
          opacity="0.3"
        />
        <path
          d={actualPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />

        {/* Data points - Planned */}
        {data.map((point, index) => {
          const x = xScale(index) + padding.left;
          const y = yScale(point.planned) + padding.top;
          return (
            <g key={`planned-${index}`}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="#F87941"
                stroke="#1e293b"
                strokeWidth="3"
                className="cursor-pointer transition-all hover:r-8"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {index === data.length - 1 && (
                <text x={x + 25} y={y + 5} className="text-[11px] fill-orange-400 font-bold">
                  {point.planned}%
                </text>
              )}
            </g>
          );
        })}

        {/* Data points - Actual */}
        {data.map((point, index) => {
          const x = xScale(index) + padding.left;
          const y = yScale(point.actual) + padding.top;
          return (
            <g key={`actual-${index}`}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="#3b82f6"
                stroke="#1e293b"
                strokeWidth="3"
                className="cursor-pointer transition-all hover:r-8"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {index === data.length - 1 && (
                <text x={x + 25} y={y + 5} className="text-[11px] fill-blue-400 font-bold">
                  {point.actual}%
                </text>
              )}
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={25}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 25 ${height / 2})`}
          className="text-sm fill-slate-300 font-bold tracking-wide"
        >
          Progress (%)
        </text>

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="text-sm fill-slate-300 font-bold tracking-wide"
        >
          Timeline (Months)
        </text>
      </svg>

      {/* Enhanced Tooltip */}
      {hoveredPoint && (
        <div className="absolute top-4 right-4 glass border border-slate-600/50 rounded-xl px-5 py-4 shadow-2xl z-50 backdrop-blur-xl">
          <div className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            {hoveredPoint.month} 2025
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-xs text-slate-300 font-medium">Rencana:</span>
              </div>
              <span className="text-base font-bold text-orange-400">{hoveredPoint.planned}%</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-slate-300 font-medium">Realisasi:</span>
              </div>
              <span className="text-base font-bold text-blue-400">{hoveredPoint.actual}%</span>
            </div>
            <div className="pt-2 border-t border-slate-700/50 mt-2">
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-slate-400 font-medium">Deviasi:</span>
                <span
                  className={`text-base font-bold ${hoveredPoint.actual >= hoveredPoint.planned ? 'text-green-400' : 'text-red-400'}`}
                >
                  {hoveredPoint.actual >= hoveredPoint.planned ? '+' : ''}
                  {hoveredPoint.actual - hoveredPoint.planned}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 text-right">
                {hoveredPoint.actual >= hoveredPoint.planned ? '🎯 On Track' : '⚠️ Behind Schedule'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Memoized SCurveChart with custom comparison
 * Prevents re-renders when data array has the same values
 */
export const SCurveChart = React.memo(SCurveChartComponent, (prevProps, nextProps) => {
  // Quick reference equality check
  if (prevProps.data === nextProps.data) {
    return true;
  }

  // Deep comparison for data array
  if (prevProps.data.length !== nextProps.data.length) {
    return false;
  }

  return prevProps.data.every((point, index) => 
    point.month === nextProps.data[index]?.month &&
    point.planned === nextProps.data[index]?.planned &&
    point.actual === nextProps.data[index]?.actual
  );
});
