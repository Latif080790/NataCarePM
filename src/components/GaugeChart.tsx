// Gauge Chart Components
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';

interface RadialProgressProps {
  title: string;
  description: string;
  value: number; // 0 to 100
  color?: string;
  className?: string;
}

interface GaugeChartProps {
  value: number;
  max: number;
  thresholds: number[];
}

/**
 * RadialProgress Component - Performance Optimized
 * Uses React.memo for efficient rendering
 */
const RadialProgressComponent = ({ title, description, value, className = '' }: RadialProgressProps) => {
  // Ensure value is a valid number
  const safeValue = isNaN(value) || !isFinite(value) ? 0 : value;
  const normalizedValue = Math.max(0, Math.min(100, safeValue));
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <Card
      className={`glass-enhanced border-violet-essence/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${className}`}
    >
      <CardHeader className="pb-4 border-b border-violet-essence/10">
        <CardTitle className="text-lg font-bold gradient-text">{title}</CardTitle>
        <CardDescription className="text-palladium">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-6">
        <div className="relative w-36 h-36 group">
          <svg
            className="w-full h-full transform group-hover:scale-105 transition-transform duration-300"
            viewBox="0 0 100 100"
          >
            {/* Enhanced background circle with gradient */}
            <defs>
              <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#E6E4E6', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#E6E4E6', stopOpacity: 0.1 }} />
              </linearGradient>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#F87941', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#F9B095', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#F87941', stopOpacity: 1 }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              className="stroke-current text-violet-essence/30"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="45"
              fill="url(#bg-gradient)"
            />

            {/* Progress circle */}
            <circle
              className={`transition-all duration-1000 ease-in-out`}
              stroke="url(#progress-gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              filter="url(#glow)"
            />
          </svg>

          {/* Enhanced center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold gradient-text group-hover:scale-110 transition-transform duration-300">
              {normalizedValue.toFixed(1)}%
            </span>
            <div className="w-4 h-1 rounded-full bg-gradient-to-r from-precious-persimmon to-no-way-rose mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Floating indicator */}
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-lg animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export const RadialProgress = React.memo(RadialProgressComponent);

/**
 * GaugeChart Component - Performance Optimized
 * Uses React.memo to prevent unnecessary re-renders
 */
const GaugeChartComponent = ({ value, max }: GaugeChartProps) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <RadialProgress
      title="Performance"
      description={`${value.toFixed(1)} / ${max}`}
      value={percentage}
    />
  );
};

export const GaugeChart = React.memo(GaugeChartComponent);

