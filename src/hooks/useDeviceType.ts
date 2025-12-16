/**
 * useDeviceType Hook
 * Enterprise-grade device detection for responsive layouts
 * 
 * Features:
 * - Real-time screen size monitoring
 * - Breakpoint-based device categorization
 * - Orientation detection
 * - Touch capability detection
 * - Network quality estimation
 */

import { useState, useEffect, useMemo } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type NetworkQuality = 'slow' | 'medium' | 'fast';

interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
  networkQuality: NetworkQuality;
}

// Enterprise breakpoints (aligned with Tailwind CSS)
const BREAKPOINTS = {
  mobile: 640,  // sm
  tablet: 1024, // lg
} as const;

/**
 * Detect network quality based on connection type
 */
function getNetworkQuality(): NetworkQuality {
  if (!('connection' in navigator)) return 'medium';
  
  const connection = (navigator as any).connection;
  if (!connection) return 'medium';

  const effectiveType = connection.effectiveType;
  
  if (effectiveType === '4g' || effectiveType === 'wifi') return 'fast';
  if (effectiveType === '3g') return 'medium';
  return 'slow';
}

/**
 * Detect device type based on screen width
 */
function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Detect screen orientation
 */
function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

/**
 * Detect touch capability
 */
function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * useDeviceType Hook
 * 
 * @example
 * ```tsx
 * const { isMobile, isDesktop, type } = useDeviceType();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * return <DesktopLayout />;
 * ```
 */
export function useDeviceType(): DeviceInfo {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(getNetworkQuality());

  useEffect(() => {
    // Handle resize with debouncing (performance optimization)
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenWidth(window.innerWidth);
        setScreenHeight(window.innerHeight);
      }, 150);
    };

    // Handle network change
    const handleConnectionChange = () => {
      setNetworkQuality(getNetworkQuality());
    };

    window.addEventListener('resize', handleResize);
    
    // Monitor network changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', handleConnectionChange);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  // Memoize computed values
  const deviceInfo = useMemo<DeviceInfo>(() => {
    const type = getDeviceType(screenWidth);
    const orientation = getOrientation(screenWidth, screenHeight);
    const touch = isTouchDevice();

    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      isTouchDevice: touch,
      orientation,
      screenWidth,
      screenHeight,
      networkQuality,
    };
  }, [screenWidth, screenHeight, networkQuality]);

  return deviceInfo;
}

/**
 * Hook for conditional rendering based on device type
 * 
 * @example
 * ```tsx
 * const shouldLoadChart = useDeviceCheck(device => device.isDesktop || device.networkQuality === 'fast');
 * ```
 */
export function useDeviceCheck(condition: (device: DeviceInfo) => boolean): boolean {
  const device = useDeviceType();
  return useMemo(() => condition(device), [device, condition]);
}

/**
 * Hook for loading heavy components only on desktop
 * 
 * @example
 * ```tsx
 * const ChartComponent = useDesktopOnly(() => import('./HeavyChart'));
 * ```
 */
export function useDesktopOnly<T>(loader: () => Promise<{ default: T }>): T | null {
  const { isDesktop } = useDeviceType();
  const [component, setComponent] = useState<T | null>(null);

  useEffect(() => {
    if (isDesktop && !component) {
      loader().then(module => setComponent(module.default));
    }
  }, [isDesktop, component, loader]);

  return isDesktop ? component : null;
}
