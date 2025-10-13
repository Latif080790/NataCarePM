import React, { useState, useMemo } from 'react';


interface SCurveDataPoint {
  month: string;
  planned: number;
  actual: number;
}

interface SCurveChartProps {
  data: SCurveDataPoint[];
}

export const SCurveChart: React.FC<SCurveChartProps> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string; planned: number; actual: number } | null>(null);
  
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>No S-Curve data available</p>
      </div>
    );
  }

  const width = 1000;
  const height = 280;
  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.planned, d.actual))
  );

  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => chartHeight - (value / maxValue) * chartHeight;

  // Generate path for line
  const createPath = (dataKey: 'planned' | 'actual') => {
    return data.map((point, index) => {
      const x = xScale(index) + padding.left;
      const y = yScale(point[dataKey]) + padding.top;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
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
      >
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
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-500 font-medium"
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
            <text
              key={point.month}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-[11px] fill-slate-400 font-medium"
            >
              {point.month}
            </text>
          );
        })}

        {/* Planned line */}
        <path
          d={plannedPath}
          fill="none"
          stroke="#F87941"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-lg"
        />

        {/* Actual line */}
        <path
          d={actualPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-lg"
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
                r="5"
                fill="#F87941"
                stroke="#1e293b"
                strokeWidth="2"
                className="cursor-pointer transition-all hover:r-7"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
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
                r="5"
                fill="#3b82f6"
                stroke="#1e293b"
                strokeWidth="2"
                className="cursor-pointer transition-all hover:r-7"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 20 ${height / 2})`}
          className="text-xs fill-slate-400 font-semibold"
        >
          Progress (%)
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div className="absolute top-4 right-4 bg-slate-800 border border-slate-600/50 rounded-lg px-4 py-3 shadow-2xl z-50">
          <div className="text-xs font-semibold text-slate-300 mb-2">{hoveredPoint.month}</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-4">
              <span className="text-xs text-slate-400">Rencana:</span>
              <span className="text-sm font-bold text-orange-400">{hoveredPoint.planned}%</span>
            </div>
            <div className="flex items-center justify-between space-x-4">
              <span className="text-xs text-slate-400">Realisasi:</span>
              <span className="text-sm font-bold text-blue-400">{hoveredPoint.actual}%</span>
            </div>
            <div className="pt-1 border-t border-slate-700 mt-2">
              <div className="flex items-center justify-between space-x-4">
                <span className="text-xs text-slate-400">Deviasi:</span>
                <span className={`text-sm font-bold ${hoveredPoint.actual >= hoveredPoint.planned ? 'text-green-400' : 'text-red-400'}`}>
                  {hoveredPoint.actual >= hoveredPoint.planned ? '+' : ''}{hoveredPoint.actual - hoveredPoint.planned}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
