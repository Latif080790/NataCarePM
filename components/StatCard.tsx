import React from 'react';
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
  color = 'text-persimmon',
  trend,
  onClick,
  className = ''
}: StatCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return 'text-green-600';
    if (trendValue < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return <TrendingUp className="w-3 h-3" />;
    if (trendValue < 0) return <TrendingDown className="w-3 h-3" />;
    return null;
  };

  return (
    <Card 
      className={`transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 ${className}`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <div className="transition-all duration-200 hover:scale-110">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)}
              <span className="font-medium">
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            {description}
          </p>
        )}
        {onClick && (
          <div className="mt-2 text-xs text-blue-600 font-medium opacity-0 hover:opacity-100 transition-opacity">
            Click for details →
          </div>
        )}
      </CardContent>
    </Card>
  );
}
