import { Card } from './Card';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  showValues?: boolean;
  className?: string;
}

export default function SimpleBarChart({
  data,
  title,
  showValues = true,
  className = ''
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const colors = [
    '#F87941', // precious-persimmon
    '#F9B095', // no-way-rose
    '#E6E4E6', // violet-essence
    '#10b981', // success
    '#f59e0b', // warning
    '#ef4444', // error
    '#3b82f6'  // info
  ];

  return (
    <Card className={`card-enhanced ${className}`}>
      {title && (
        <div className="mb-6">
          <h3 className="text-heading-3 visual-primary">{title}</h3>
        </div>
      )}
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const color = item.color || colors[index % colors.length];
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-body-small visual-secondary font-medium">
                  {item.label}
                </span>
                {showValues && (
                  <span className="text-body-small visual-primary font-semibold">
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="relative">
                <div className="w-full bg-violet-essence/30 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-violet-essence/20">
        <div className="flex flex-wrap gap-4">
          {data.map((item, index) => {
            const color = item.color || colors[index % colors.length];
            return (
              <div key={item.label} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-caption visual-secondary">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
