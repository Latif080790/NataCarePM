import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { LucideProps, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<LucideProps>;
  description?: string;
  color?: string;
  trend?: number;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'text-precious-persimmon',
  trend,
  onClick,
  className = '',
}: StatCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-palladium';
  };

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return <TrendingUp className="w-3 h-3" />;
    if (trendValue < 0) return <TrendingDown className="w-3 h-3" />;
    return null;
  };

  return (
    <Card
      className={`group transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] cursor-pointer border border-violet-essence/20 shadow-lg glass-enhanced backdrop-blur-lg overflow-hidden relative ${className}`}
      onClick={handleClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-brilliance/50 via-violet-essence-50/30 to-no-way-rose-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-palladium group-hover:text-night-black transition-colors duration-300">
          {title}
        </CardTitle>
        <div className="w-12 h-12 rounded-xl glass flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-violet-essence/20">
          <Icon
            className={`h-5 w-5 ${color} group-hover:text-precious-persimmon transition-colors duration-300`}
          />
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="flex items-end justify-between mb-3">
          <div className="text-3xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">
            {value}
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center space-x-1 text-sm ${getTrendColor(trend)} px-2 py-1 rounded-lg glass-subtle`}
            >
              {getTrendIcon(trend)}
              <span className="font-semibold">
                {trend > 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {description && (
          <p className="text-xs text-palladium group-hover:text-night-black/80 transition-colors duration-300 leading-relaxed">
            {description}
          </p>
        )}

        {onClick && (
          <div className="mt-3 text-xs text-precious-persimmon font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex items-center gap-1">
            <span>Click for details</span>
            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
          </div>
        )}
      </CardContent>

      {/* Floating indicator */}
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </Card>
  );
}
