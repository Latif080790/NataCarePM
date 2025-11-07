/**
 * Mobile Feature Analytics Tracker
 * Track camera uploads, GPS accuracy, and push notification metrics
 */

import { trackPageView, trackEvent } from '@/config/ga4.config';

export interface CameraUploadMetrics {
  timestamp: number;
  success: boolean;
  fileSize: number;
  compressionRatio: number;
  uploadDuration: number;
  errorMessage?: string;
}

export interface GPSMetrics {
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  withinGeofence: boolean;
  distanceFromSite: number;
  acquisitionTime: number;
}

export interface PushNotificationMetrics {
  timestamp: number;
  notificationType: string;
  delivered: boolean;
  opened: boolean;
  timeToOpen?: number;
}

export class MobileAnalytics {
  private static instance: MobileAnalytics;
  
  private cameraMetrics: CameraUploadMetrics[] = [];
  private gpsMetrics: GPSMetrics[] = [];
  private pushMetrics: PushNotificationMetrics[] = [];

  private constructor() {}

  static getInstance(): MobileAnalytics {
    if (!MobileAnalytics.instance) {
      MobileAnalytics.instance = new MobileAnalytics();
    }
    return MobileAnalytics.instance;
  }

  // Camera Upload Tracking
  trackCameraUpload(metrics: CameraUploadMetrics) {
    this.cameraMetrics.push(metrics);
    
    trackEvent('camera_upload', {
      success: metrics.success,
      file_size: metrics.fileSize,
      compression_ratio: metrics.compressionRatio.toFixed(2),
      upload_duration: metrics.uploadDuration,
      error: metrics.errorMessage || 'none',
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics] Camera Upload:', metrics);
    }
  }

  // GPS Tracking
  trackGPSCapture(metrics: GPSMetrics) {
    this.gpsMetrics.push(metrics);
    
    trackEvent('gps_capture', {
      accuracy: Math.round(metrics.accuracy),
      within_geofence: metrics.withinGeofence,
      distance_from_site: Math.round(metrics.distanceFromSite),
      acquisition_time: metrics.acquisitionTime,
    });

    if (import.meta.env.DEV) {
      console.log('[Analytics] GPS Capture:', metrics);
    }
  }

  // Push Notification Tracking
  trackPushNotification(metrics: PushNotificationMetrics) {
    this.pushMetrics.push(metrics);
    
    trackEvent('push_notification', {
      type: metrics.notificationType,
      delivered: metrics.delivered,
      opened: metrics.opened,
      time_to_open: metrics.timeToOpen || 0,
    });

    if (import.meta.env.DEV) {
      console.log('[Analytics] Push Notification:', metrics);
    }
  }

  // Get Camera Success Rate
  getCameraSuccessRate(): number {
    if (this.cameraMetrics.length === 0) return 0;
    const successful = this.cameraMetrics.filter(m => m.success).length;
    return (successful / this.cameraMetrics.length) * 100;
  }

  // Get GPS Accuracy Stats
  getGPSAccuracyStats() {
    if (this.gpsMetrics.length === 0) {
      return { average: 0, min: 0, max: 0, geofenceCompliance: 0 };
    }

    const accuracies = this.gpsMetrics.map(m => m.accuracy);
    const withinGeofence = this.gpsMetrics.filter(m => m.withinGeofence).length;

    return {
      average: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
      min: Math.min(...accuracies),
      max: Math.max(...accuracies),
      geofenceCompliance: (withinGeofence / this.gpsMetrics.length) * 100,
    };
  }

  // Get Push Notification Stats
  getPushStats() {
    if (this.pushMetrics.length === 0) {
      return { deliveryRate: 0, openRate: 0, avgTimeToOpen: 0 };
    }

    const delivered = this.pushMetrics.filter(m => m.delivered).length;
    const opened = this.pushMetrics.filter(m => m.opened).length;
    const openTimes = this.pushMetrics
      .filter(m => m.timeToOpen !== undefined)
      .map(m => m.timeToOpen!);

    return {
      deliveryRate: (delivered / this.pushMetrics.length) * 100,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      avgTimeToOpen: openTimes.length > 0
        ? openTimes.reduce((a, b) => a + b, 0) / openTimes.length
        : 0,
    };
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      camera: {
        total: this.cameraMetrics.length,
        successRate: this.getCameraSuccessRate(),
        metrics: this.cameraMetrics,
      },
      gps: {
        total: this.gpsMetrics.length,
        stats: this.getGPSAccuracyStats(),
        metrics: this.gpsMetrics,
      },
      push: {
        total: this.pushMetrics.length,
        stats: this.getPushStats(),
        metrics: this.pushMetrics,
      },
    };
  }

  // Clear old metrics (keep last 1000 of each)
  pruneMetrics() {
    const maxSize = 1000;
    
    if (this.cameraMetrics.length > maxSize) {
      this.cameraMetrics = this.cameraMetrics.slice(-maxSize);
    }
    
    if (this.gpsMetrics.length > maxSize) {
      this.gpsMetrics = this.gpsMetrics.slice(-maxSize);
    }
    
    if (this.pushMetrics.length > maxSize) {
      this.pushMetrics = this.pushMetrics.slice(-maxSize);
    }
  }
}

// Singleton instance
export const mobileAnalytics = MobileAnalytics.getInstance();

// Helper functions for easy tracking
export const trackCameraUpload = (metrics: CameraUploadMetrics) => {
  mobileAnalytics.trackCameraUpload(metrics);
};

export const trackGPSCapture = (metrics: GPSMetrics) => {
  mobileAnalytics.trackGPSCapture(metrics);
};

export const trackPushNotification = (metrics: PushNotificationMetrics) => {
  mobileAnalytics.trackPushNotification(metrics);
};

// Export metrics
export const exportMobileMetrics = () => {
  return mobileAnalytics.exportMetrics();
};
