import React from 'react';

interface ProgressRingProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 8,
  color = 'primary',
  showPercentage = true,
  className = '',
  children,
}: ProgressRingProps) {
  const sizes = {
    sm: { width: 80, height: 80, fontSize: 'text-lg' },
    md: { width: 120, height: 120, fontSize: 'text-2xl' },
    lg: { width: 160, height: 160, fontSize: 'text-3xl' },
  };

  const colors = {
    primary: {
      stroke: 'url(#primaryGradient)',
      background: '#E6E4E6',
    },
    success: {
      stroke: '#10b981',
      background: '#E6E4E6',
    },
    warning: {
      stroke: '#f59e0b',
      background: '#E6E4E6',
    },
    error: {
      stroke: '#ef4444',
      background: '#E6E4E6',
    },
  };

  const { width, height, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const center = width / 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F87941" />
            <stop offset="100%" stopColor="#F9B095" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors[color].background}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />

        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors[color].stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-sm"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(248, 121, 65, 0.2))',
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage ? (
          <div className="text-center">
            <span className={`${fontSize} font-bold gradient-text`}>{Math.round(progress)}%</span>
            {children && <div className="text-body-small visual-secondary mt-1">{children}</div>}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

