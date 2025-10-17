/**
 * Push Notification Channel Implementation
 * Using Firebase Cloud Messaging (FCM)
 */

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { getNotificationConfig } from '../config/notificationConfig';
import type { Notification } from '../../types/automation';

export interface PushOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, string>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  vibrate?: number[];
}

export interface PushResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Firebase Cloud Messaging Service
 */
class FCMService {
  private messaging: Messaging | null = null;
  private vapidKey: string;
  private currentToken: string | null = null;
  
  constructor(vapidKey: string) {
    this.vapidKey = vapidKey;
  }
  
  /**
   * Initialize FCM messaging
   */
  async initialize(): Promise<void> {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported - push notifications disabled');
        return;
      }
      
      // Check if notification permission is granted
      if (Notification.permission === 'denied') {
        console.warn('Notification permission denied');
        return;
      }
      
      // Import Firebase app
      const { app } = await import('../../firebaseConfig');
      this.messaging = getMessaging(app);
      
      // Request permission if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission not granted');
          return;
        }
      }
      
      // Get FCM token
      await this.getDeviceToken();
      
      // Setup message listener
      this.setupMessageListener();
      
    } catch (error) {
      console.error('Failed to initialize FCM:', error);
    }
  }
  
  /**
   * Get FCM device token
   */
  async getDeviceToken(): Promise<string | null> {
    if (!this.messaging) {
      return null;
    }
    
    try {
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });
      
      this.currentToken = token;
      console.log('FCM Token:', token);
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }
  
  /**
   * Setup listener for foreground messages
   */
  private setupMessageListener(): void {
    if (!this.messaging) {
      return;
    }
    
    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification using Notification API
      if (payload.notification) {
        this.showNotification({
          title: payload.notification.title || 'New Notification',
          body: payload.notification.body || '',
          icon: payload.notification.icon,
          image: payload.notification.image,
          data: payload.data as Record<string, string>
        });
      }
    });
  }
  
  /**
   * Show browser notification
   */
  async showNotification(options: PushOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        data: options.data,
        // actions: options.actions, // TypeScript doesn't recognize this yet
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        tag: options.tag,
        vibrate: options.vibrate || [200, 100, 200]
      } as NotificationOptions);
    } catch (error) {
      console.error('Error showing notification:', error);
      
      // Fallback to simple Notification API
      new Notification(options.title, {
        body: options.body,
        icon: options.icon,
        data: options.data
      });
    }
  }
  
  /**
   * Send push notification to specific token (server-side)
   * Note: This should be called from backend with server key
   */
  async sendToToken(token: string, options: PushOptions): Promise<PushResult> {
    // This method should be implemented on the server side
    // For client-side, we can only show local notifications
    console.warn('sendToToken should be called from backend');
    
    // For demo purposes, show local notification
    await this.showNotification(options);
    
    return {
      success: true,
      token
    };
  }
  
  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }
}

/**
 * Push Notification Template Builder
 */
export class PushTemplateBuilder {
  /**
   * Build push notification from Notification object
   */
  static buildFromNotification(notification: Notification): PushOptions {
    return {
      title: notification.title,
      body: notification.message,
      icon: this.getTypeIcon(notification.type),
      badge: '/badge-72x72.png',
      data: {
        notificationId: notification.id || '',
        type: notification.type,
        priority: notification.priority,
        relatedEntityType: notification.relatedEntityType || '',
        relatedEntityId: notification.relatedEntityId || '',
        ...this.flattenData(notification.data || {})
      },
      actions: notification.actions?.map(action => ({
        action: action.url || action.label.toLowerCase().replace(/\s+/g, '_'),
        title: action.label,
        icon: '/action-icon.png'
      })),
      requireInteraction: notification.priority === 'urgent',
      tag: notification.id || `notification_${Date.now()}`,
      vibrate: this.getVibrationPattern(notification.priority)
    };
  }
  
  private static getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      project_update: '/icons/project.png',
      task_assigned: '/icons/task.png',
      task_completed: '/icons/success.png',
      deadline_reminder: '/icons/clock.png',
      budget_alert: '/icons/money.png',
      document_uploaded: '/icons/document.png',
      approval_required: '/icons/approval.png',
      message_received: '/icons/message.png',
      system_alert: '/icons/alert.png',
      payment_due: '/icons/payment.png'
    };
    return icons[type] || '/icon-192x192.png';
  }
  
  private static getVibrationPattern(priority: string): number[] {
    switch (priority) {
      case 'urgent':
        return [200, 100, 200, 100, 200]; // Long vibration
      case 'high':
        return [200, 100, 200]; // Medium vibration
      default:
        return [200]; // Short vibration
    }
  }
  
  private static flattenData(data: Record<string, unknown>): Record<string, string> {
    const flattened: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        flattened[key] = String(value);
      } else if (value !== null && value !== undefined) {
        flattened[key] = JSON.stringify(value);
      }
    }
    
    return flattened;
  }
}

/**
 * Push Notification Service Manager
 */
export class PushService {
  private fcmService: FCMService | null = null;
  private config = getNotificationConfig();
  private initialized = false;
  
  constructor() {
    // Don't auto-initialize - let app initialize explicitly
  }
  
  /**
   * Initialize push notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    const { vapidKey } = this.config.fcm;
    
    if (!vapidKey) {
      console.warn('FCM VAPID key not configured - push notifications disabled');
      return;
    }
    
    this.fcmService = new FCMService(vapidKey);
    await this.fcmService.initialize();
    this.initialized = true;
  }
  
  /**
   * Send push notification
   */
  async sendNotification(notification: Notification): Promise<PushResult> {
    if (!this.fcmService) {
      console.warn('Push notification service not initialized');
      return {
        success: false,
        error: 'Push notification service not configured'
      };
    }
    
    const options = PushTemplateBuilder.buildFromNotification(notification);
    
    try {
      await this.fcmService.showNotification(options);
      
      return {
        success: true,
        token: this.fcmService.getCurrentToken() || undefined
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown push notification error'
      };
    }
  }
  
  /**
   * Send custom push notification
   */
  async send(options: PushOptions): Promise<PushResult> {
    if (!this.fcmService) {
      return {
        success: false,
        error: 'Push notification service not configured'
      };
    }
    
    try {
      await this.fcmService.showNotification(options);
      
      return {
        success: true,
        token: this.fcmService.getCurrentToken() || undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get FCM device token
   */
  async getDeviceToken(): Promise<string | null> {
    if (!this.fcmService) {
      await this.initialize();
    }
    
    return this.fcmService?.getCurrentToken() || null;
  }
  
  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Initialize FCM after permission granted
      await this.initialize();
    }
    
    return permission;
  }
  
  /**
   * Check if push notifications are supported and enabled
   */
  isSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }
  
  /**
   * Check if push service is configured and initialized
   */
  isConfigured(): boolean {
    return this.fcmService !== null && this.initialized;
  }
  
  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// Export singleton instance
export const pushService = new PushService();
