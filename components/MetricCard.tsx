import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export default function MetricCard({
  title,
  value,
  subValue,
  trend = 'neutral',
  trendValue,
  icon,
  color = 'primary',
  className = ''
}: MetricCardProps) {
  const colorClasses = {
    primary: 'text-precious-persimmon',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <BarChart3 className="w-4 h-4" />
  };

  const trendColors = {
    up: 'text-success bg-success-bg',
    down: 'text-error bg-error-bg',
    neutral: 'text-palladium bg-violet-essence/10'
  };

  return (
    <Card className={`card-metric interactive group ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-essence to-no-way-rose/20 group-hover:scale-110 transition-transform duration-300">
          <div className={colorClasses[color]}>
            {icon}
          </div>
        </div>
        
        {trendValue && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${trendColors[trend]}`}>
            {trendIcons[trend]}
            <span className="text-caption font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-heading-3 visual-primary group-hover:text-precious-persimmon transition-colors duration-300">
          {value}
        </h3>
        <p className="text-body-small visual-secondary">{title}</p>
        {subValue && (
          <p className="text-caption visual-secondary mt-2">{subValue}</p>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-precious-persimmon/5 to-no-way-rose/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
    </Card>
  );
}