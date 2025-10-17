/**
 * SwipeableCards Component
 * 
 * Horizontal swipeable card carousel for mobile
 * Features:
 * - Touch swipe navigation
 * - Snap scrolling
 * - Dot indicators
 * - Auto-scroll support
 * - iOS momentum scrolling
 */

import React, { useRef, useState, useEffect } from 'react';
import { useIsMobile } from '../constants/responsive';

interface SwipeableCardsProps {
  children: React.ReactNode[];
  autoScroll?: boolean;
  autoScrollInterval?: number;
  showIndicators?: boolean;
  className?: string;
}

export const SwipeableCards: React.FC<SwipeableCardsProps> = ({
  children,
  autoScroll = false,
  autoScrollInterval = 5000,
  showIndicators = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || !isMobile) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const nextIndex = (currentIndex + 1) % children.length;
        const scrollWidth = scrollRef.current.scrollWidth / children.length;
        scrollRef.current.scrollTo({
          left: nextIndex * scrollWidth,
          behavior: 'smooth',
        });
      }
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, currentIndex, children.length, isMobile]);

  // Update current index on scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = scrollRef.current.scrollWidth / children.length;
    const index = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(index);
  };

  // Desktop fallback: show all cards in grid
  if (!isMobile) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Swipeable container */}
      <div
        ref={scrollRef}
        className="card-swipeable-container"
        onScroll={handleScroll}
      >
        {children.map((child, index) => (
          <div key={index} className="card-swipeable-item">
            {child}
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {showIndicators && children.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (scrollRef.current) {
                  const cardWidth = scrollRef.current.scrollWidth / children.length;
                  scrollRef.current.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth',
                  });
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-orange-500 w-6'
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeableCards;
