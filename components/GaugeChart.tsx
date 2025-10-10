import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';

interface RadialProgressProps {
  title: string;
  description: string;
  value: number; // 0 to 100
  color?: string;
}

export function RadialProgress({ title, description, value, color = 'stroke-persimmon' }: RadialProgressProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="stroke-current text-violet-essence"
              strokeWidth="10"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              className={`stroke-current ${color} transition-all duration-1000 ease-in-out`}
              strokeWidth="10"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-night-black">{value.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}