/**
 * Device-Aware Component Loader
 * 
 * Utilities for conditional loading based on device capabilities
 * - Lazy load heavy components only on desktop
 * - Skip unnecessary features on mobile
 * - Network-aware loading
 */

import { lazy, ComponentType } from 'react';
import { DeviceInfo } from '@/hooks/useDeviceType';

/**
 * Load component only on desktop devices
 * Returns null on mobile/tablet
 */
export function desktopOnly<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
): ReturnType<typeof lazy<T>> | (() => null) {
  // Check if we should load (server-side rendering safe)
  if (typeof window === 'undefined') {
    return lazy(loader);
  }

  const isMobile = window.innerWidth < 1024; // Tablet breakpoint
  
  if (isMobile) {
    // Return null component for mobile
    return () => null;
  }

  return lazy(loader);
}

/**
 * Load component with network quality check
 * Returns lightweight fallback on slow networks
 */
export function networkAware<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  fallbackLoader: () => Promise<{ default: T }>
): ReturnType<typeof lazy<T>> {
  return lazy(async () => {
    // Check network quality
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    // Load fallback on slow networks
    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      return fallbackLoader();
    }

    return loader();
  });
}

/**
 * Conditional component loader based on device info
 */
export function conditionalLoad<T extends ComponentType<any>>(
  condition: (device: Partial<DeviceInfo>) => boolean,
  loader: () => Promise<{ default: T }>,
  fallbackLoader?: () => Promise<{ default: T }>
): ReturnType<typeof lazy<T>> | (() => null) {
  return lazy(async () => {
    // Basic device detection (server-safe)
    const deviceInfo: Partial<DeviceInfo> = {
      screenWidth: window.innerWidth,
      isMobile: window.innerWidth < 640,
      isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024,
    };

    const shouldLoad = condition(deviceInfo);

    if (!shouldLoad && fallbackLoader) {
      return fallbackLoader();
    }

    if (!shouldLoad) {
      return { default: (() => null) as T };
    }

    return loader();
  });
}

/**
 * Feature flags for mobile optimization
 */
export const MobileFeatureFlags = {
  // Charts - only on desktop or fast network
  LOAD_CHARTS: (device: DeviceInfo) => 
    device.isDesktop || device.networkQuality === 'fast',

  // AI Features - desktop only due to heavy processing
  LOAD_AI_FEATURES: (device: DeviceInfo) => 
    device.isDesktop,

  // Real-time collaboration - desktop only
  LOAD_LIVE_CURSORS: (device: DeviceInfo) => 
    device.isDesktop,

  // Command palette - desktop only (keyboard-driven)
  LOAD_COMMAND_PALETTE: (device: DeviceInfo) => 
    device.isDesktop,

  // Advanced analytics - desktop or tablet landscape
  LOAD_ANALYTICS: (device: DeviceInfo) => 
    device.isDesktop || (device.isTablet && device.orientation === 'landscape'),

  // Document preview - all devices but quality depends on network
  LOAD_DOCUMENT_PREVIEW: (device: DeviceInfo) => 
    true,

  // OCR - all devices but warn on slow network
  LOAD_OCR: (device: DeviceInfo) => 
    device.networkQuality !== 'slow',

  // Export features - all devices
  LOAD_EXPORT: (device: DeviceInfo) => 
    true,

  // Background sync - all devices
  LOAD_OFFLINE_SYNC: (device: DeviceInfo) => 
    true,
};

/**
 * Component registry for device-specific loading
 */
export const ComponentLoaders = {
  // Heavy chart libraries
  Charts: {
    AdvancedChart: desktopOnly(() => import('@/components/charts/AdvancedChart')),
    GanttChart: desktopOnly(() => import('@/views/GanttChartView')),
    DependencyGraph: desktopOnly(() => import('@/views/DependencyGraphView')),
  },

  // AI-powered features
  AI: {
    AssistantChat: desktopOnly(() => import('@/components/AiAssistantChat')),
    ResourceOptimization: desktopOnly(() => import('@/views/AIResourceOptimizationView')),
    PredictiveAnalytics: desktopOnly(() => import('@/views/PredictiveAnalyticsView')),
  },

  // Collaboration features
  Collaboration: {
    LiveCursors: desktopOnly(() => import('@/components/LiveCursors')),
    CommandPalette: desktopOnly(() => import('@/components/CommandPalette').then(m => ({ default: m.CommandPalette }))),
  },

  // Mobile-optimized views
  Mobile: {
    Dashboard: lazy(() => import('@/views/MobileDashboardView')),
    DailyLog: lazy(() => import('@/views/examples/DailyLogOfflineExample')),
  },
};

/**
 * Example usage:
 * 
 * ```tsx
 * // In App.tsx or any component
 * import { ComponentLoaders, MobileFeatureFlags } from '@/utils/deviceAwareLoader';
 * import { useDeviceType } from '@/hooks/useDeviceType';
 * 
 * function MyComponent() {
 *   const device = useDeviceType();
 *   const ChartComponent = ComponentLoaders.Charts.AdvancedChart;
 *   
 *   if (!MobileFeatureFlags.LOAD_CHARTS(device)) {
 *     return <SimpleFallback />;
 *   }
 *   
 *   return (
 *     <Suspense fallback={<Spinner />}>
 *       <ChartComponent />
 *     </Suspense>
 *   );
 * }
 * ```
 */
