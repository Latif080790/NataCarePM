/**
 * PullToRefresh Component
 * 
 * Pull-to-refresh functionality for mobile devices
 * Features:
 * - Pull down gesture detection
 * - Loading spinner with animation
 * - Customizable refresh callback
 * - iOS-style rubber band effect
 */

import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useIsMobile } from '../constants/responsive';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(true);
  const touchStartRef = useRef<{ y: number; scrollTop: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Only enable on mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;

    const scrollTop = containerRef.current?.scrollTop || 0;
    
    // Only allow pull-to-refresh when at top of scroll
    if (scrollTop === 0) {
      setCanPull(true);
      touchStartRef.current = {
        y: e.touches[0].clientY,
        scrollTop,
      };
    } else {
      setCanPull(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canPull || !touchStartRef.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current.y;

    // Only track pull down (positive deltaY) when at top
    if (deltaY > 0 && touchStartRef.current.scrollTop === 0) {
      // Rubber band effect: reduce pull distance at higher values
      const rubberBandFactor = 0.5;
      const adjustedDistance = deltaY * rubberBandFactor;
      setPullDistance(Math.min(adjustedDistance, threshold * 1.5));
      
      // Prevent default scroll behavior when pulling
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!canPull || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    touchStartRef.current = null;
    setCanPull(false);
  };

  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorRotation = (pullDistance / threshold) * 360;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className={`pull-to-refresh ${pullDistance > 0 || isRefreshing ? 'active' : ''}`}
        style={{
          opacity: isRefreshing ? 1 : indicatorOpacity,
          transform: `translateY(${isRefreshing ? '10px' : `-${60 - pullDistance}px`})`,
        }}
      >
        <RefreshCw
          size={24}
          className={`text-orange-500 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${indicatorRotation}deg)`,
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? '60px' : pullDistance > 0 ? `${pullDistance * 0.5}px` : '0px'})`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
