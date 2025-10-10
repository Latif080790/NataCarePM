import React, { useState } from 'react';
import { formatCurrency } from '../constants';

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
    return <div style={{ width, height }} className="flex items-center justify-center text-palladium">No data available for chart.</div>;
  }
  
  const padding = { top: 20, right: 30, bottom: 40, left: 80 };
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
      <svg width={width} height={height} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Axes */}
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#888B94" />
          <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#888B94" />

          {/* Y Axis Ticks and Labels */}
          {yAxisLabels.map(({ cost, y }) => (
            <g key={cost}>
              <line x1="-5" y1={y} x2={chartWidth} y2={y} stroke="#EAE8FF" />
              <text x="-10" y={y + 4} textAnchor="end" fontSize="10" fill="#888B94">{`${(cost / 1e6).toFixed(0)}Jt`}</text>
            </g>
          ))}

          {/* X Axis Ticks and Labels */}
          {xAxisLabels.map(({ day, x }) => (
             <g key={day}>
              <text x={x} y={chartHeight + 20} textAnchor="middle" fontSize="10" fill="#888B94">{`D-${day}`}</text>
            </g>
          ))}
          <text x={chartWidth / 2} y={chartHeight + 35} textAnchor="middle" fontSize="12" fill="#1C1C21">Hari Proyek</text>
          
          {/* Planned Path */}
          <path d={plannedPath} fill="none" stroke="#888B94" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Actual Path */}
          <path d={actualPath} fill="none" stroke="#FF6B5A" strokeWidth="2" />

          {/* Tooltip Hover Line */}
          {tooltip && <line x1={xScale(tooltip.day)} y1="0" x2={xScale(tooltip.day)} y2={chartHeight} stroke="#1C1C21" strokeDasharray="3 3"/>}
        </g>
      </svg>
      {tooltip && (
          <div 
            className="absolute p-2 text-xs bg-night-black text-white rounded-md shadow-lg pointer-events-none"
            style={{ left: tooltip.x + 10, top: tooltip.y - 10, transform: 'translateY(-100%)' }}
          >
              <div className="font-bold mb-1">Hari ke-{tooltip.day}</div>
              <div><span className="inline-block w-2 h-2 rounded-full bg-[#888B94] mr-1"></span>Rencana: {formatCurrency(tooltip.planned)}</div>
              <div><span className="inline-block w-2 h-2 rounded-full bg-[#FF6B5A] mr-1"></span>Aktual: {formatCurrency(tooltip.actual)}</div>
          </div>
      )}
    </div>
  );
};
