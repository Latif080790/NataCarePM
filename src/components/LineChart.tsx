import React, { useState, useMemo } from 'react';

import { formatCurrency } from '@/constants';

interface Point {
  day: number;
  cost: number;
}

interface LineChartProps {
  data: {
    planned: Point[];
    actual: Point[];
  };
  width: number;
  height: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, width, height }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: number; planned: number; actual: number } | null>(null);

  if (!data.planned.length && !data.actual.length) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center text-palladium glass rounded-2xl border border-violet-essence/20">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl gradient-bg-primary flex items-center justify-center">
            📊
          </div>
          <p className="font-medium">No data available for chart</p>
        </div>
      </div>
    );
  }
  
  const padding = { top: 30, right: 40, bottom: 60, left: 100 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxDay = Math.max(
    data.planned[data.planned.length - 1]?.day || 0,
    data.actual[data.actual.length - 1]?.day || 0,
    1 // avoid division by zero
  );

  const maxCost = Math.max(
    ...data.planned.map(p => p.cost),
    ...data.actual.map(p => p.cost),
    1 // avoid division by zero
  ) * 1.1; // 10% buffer

  const xScale = (day: number) => (day / maxDay) * chartWidth;
  const yScale = (cost: number) => chartHeight - (cost / maxCost) * chartHeight;

  const createPath = (points: Point[]) => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.day)} ${yScale(p.cost)}`).join(' ');
  };

  const plannedPath = createPath(data.planned);
  const actualPath = createPath(data.actual);

  const yAxisLabels = [];
  for (let i = 0; i <= 5; i++) {
    const cost = (maxCost / 5) * i;
    yAxisLabels.push({
      cost: cost,
      y: yScale(cost),
    });
  }
  
  const xAxisLabels = [];
  const tickCount = Math.min(Math.floor(maxDay / 7), 10); // Weekly ticks, max 10
  for (let i = 0; i <= tickCount; i++) {
    const day = Math.round((maxDay / tickCount) * i);
    xAxisLabels.push({
      day: day,
      x: xScale(day),
    });
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const svgRect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - svgRect.left - padding.left;
      
      const day = Math.round((mouseX / chartWidth) * maxDay);
      if (day < 0 || day > maxDay) {
        setTooltip(null);
        return;
      }
      
      const findCost = (points: Point[], targetDay: number) => {
          const pointAfter = points.find(p => p.day >= targetDay);
          const pointBefore = points.filter(p => p.day <= targetDay).pop();
          if (pointAfter && pointAfter.day === targetDay) return pointAfter.cost;
          if (!pointBefore) return 0;
          if (!pointAfter) return pointBefore.cost;

          // Linear interpolation for smoother tooltip values
          const dayDiff = pointAfter.day - pointBefore.day;
          if (dayDiff === 0) return pointBefore.cost;
          const costDiff = pointAfter.cost - pointBefore.cost;
          const ratio = (targetDay - pointBefore.day) / dayDiff;
          return pointBefore.cost + (costDiff * ratio);
      };

      const plannedCost = findCost(data.planned, day);
      const actualCost = findCost(data.actual, day);

      setTooltip({
          x: mouseX + padding.left,
          y: e.clientY - svgRect.top,
          day: day,
          planned: plannedCost,
          actual: actualCost,
      });
  };

  return (
    <div className="relative">
      <svg width={width} height={height} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} className="bg-gradient-to-br from-brilliance/20 to-violet-essence-50/30 rounded-2xl">
        <defs>
          {/* Enhanced gradients for chart elements */}
          <linearGradient id="plannedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: '#B1B1B1', stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: '#E6E4E6', stopOpacity: 0.8}} />
          </linearGradient>
          <linearGradient id="actualGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: '#F87941', stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: '#F9B095', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#F87941', stopOpacity: 1}} />
          </linearGradient>
          <filter id="dropShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
          </filter>
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Enhanced Grid */}
          {yAxisLabels.map(({ cost, y }) => (
            <g key={cost}>
              <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#E6E4E6" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2,2" />
            </g>
          ))}

          {/* Enhanced Axes */}
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#2F3035" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#2F3035" strokeWidth="2" />

          {/* Enhanced Y Axis Labels */}
          {yAxisLabels.map(({ cost, y }) => (
            <g key={cost}>
              <text x="-15" y={y + 4} textAnchor="end" fontSize="11" fill="#2F3035" className="font-medium">{`${(cost / 1e6).toFixed(0)}Jt`}</text>
            </g>
          ))}

          {/* Enhanced X Axis Labels */}
          {xAxisLabels.map(({ day, x }) => (
             <g key={day}>
              <text x={x} y={chartHeight + 25} textAnchor="middle" fontSize="11" fill="#2F3035" className="font-medium">{`D-${day}`}</text>
            </g>
          ))}
          <text x={chartWidth / 2} y={chartHeight + 45} textAnchor="middle" fontSize="13" fill="#2F3035" className="font-semibold">Hari Proyek</text>
          
          {/* Enhanced Planned Path */}
          <path 
            d={plannedPath} 
            fill="none" 
            stroke="url(#plannedGradient)" 
            strokeWidth="3" 
            strokeDasharray="6 4" 
            filter="url(#dropShadow)"
          />
          
          {/* Enhanced Actual Path */}
          <path 
            d={actualPath} 
            fill="none" 
            stroke="url(#actualGradient)" 
            strokeWidth="4" 
            filter="url(#dropShadow)"
          />

          {/* Data Points for Planned */}
          {data.planned.map((point, index) => (
            <circle
              key={`planned-${index}`}
              cx={xScale(point.day)}
              cy={yScale(point.cost)}
              r="4"
              fill="#B1B1B1"
              stroke="#FDFCFC"
              strokeWidth="2"
              className="hover:r-6 transition-all duration-200"
            />
          ))}

          {/* Data Points for Actual */}
          {data.actual.map((point, index) => (
            <circle
              key={`actual-${index}`}
              cx={xScale(point.day)}
              cy={yScale(point.cost)}
              r="5"
              fill="#F87941"
              stroke="#FDFCFC"
              strokeWidth="2"
              className="hover:r-7 transition-all duration-200 drop-shadow-lg"
            />
          ))}

          {/* Enhanced Tooltip Hover Line */}
          {tooltip && (
            <line 
              x1={xScale(tooltip.day)} 
              y1="0" 
              x2={xScale(tooltip.day)} 
              y2={chartHeight} 
              stroke="#F87941" 
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}
        </g>
      </svg>
      
      {/* Enhanced Tooltip */}
      {tooltip && (
          <div 
            className="absolute p-3 text-sm glass border border-violet-essence/30 text-night-black rounded-xl shadow-2xl pointer-events-none backdrop-blur-xl z-50"
            style={{ left: tooltip.x + 15, top: tooltip.y - 15, transform: 'translateY(-100%)' }}
          >
              <div className="font-bold mb-2 gradient-text">Hari ke-{tooltip.day}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-palladium border border-violet-essence"></span>
                <span className="text-xs">Rencana: <span className="font-semibold">{formatCurrency(tooltip.planned)}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-precious-persimmon"></span>
                <span className="text-xs">Aktual: <span className="font-semibold">{formatCurrency(tooltip.actual)}</span></span>
              </div>
          </div>
      )}
    </div>
  );
};
