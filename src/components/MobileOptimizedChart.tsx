/**
 * MobileOptimizedChart Component
 * 
 * Simplified chart wrapper for mobile devices
 * Features:
 * - Reduced data points for performance
 * - Touch-optimized interactions
 * - Responsive sizing
 * - Simplified legend
 */

import React from 'react';
import { useIsMobile } from '@/constants/responsive';

interface ChartData {
  [key: string]: any;
}

interface MobileOptimizedChartProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  mobileMaxPoints?: number;
  desktopComponent: React.ReactNode;
  mobileComponent?: React.ReactNode;
  className?: string;
}

export const MobileOptimizedChart: React.FC<MobileOptimizedChartProps> = ({
  data,
  type,
  mobileMaxPoints = 5,
  desktopComponent,
  mobileComponent,
  className = '',
}) => {
  const isMobile = useIsMobile();

  // Simplify data for mobile
  const simplifyData = (data: ChartData[]): ChartData[] => {
    if (!isMobile || data.length <= mobileMaxPoints) {
      return data;
    }

    // Sample data points evenly
    const step = Math.ceil(data.length / mobileMaxPoints);
    return data.filter((_, index) => index % step === 0 || index === data.length - 1);
  };

  const optimizedData = simplifyData(data);

  if (isMobile && mobileComponent) {
    return <div className={className}>{mobileComponent}</div>;
  }

  // Clone desktop component with optimized data
  if (React.isValidElement(desktopComponent)) {
    const clonedComponent = React.cloneElement(desktopComponent as React.ReactElement<any>, {
      data: optimizedData,
      options: {
        ...((desktopComponent as any).props?.options || {}),
        ...(isMobile && {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1.5,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: {
                  size: 10,
                },
                padding: 8,
              },
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            x: {
              ticks: {
                font: {
                  size: 10,
                },
                maxRotation: 45,
                minRotation: 45,
              },
            },
            y: {
              ticks: {
                font: {
                  size: 10,
                },
              },
            },
          },
        }),
      },
    });

    return <div className={className}>{clonedComponent}</div>;
  }

  return <div className={className}>{desktopComponent}</div>;
};

export default MobileOptimizedChart;
