/**
 * Push Notifications Service
 * FCM integration for real-time alerts
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
}

export class NotificationService {
  private static vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  static async subscribe(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey || '') as BufferSource,
    });

    return subscription;
  }

  static async unsubscribe(): Promise<boolean> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    return false;
  }

  static async showNotification(payload: NotificationPayload): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge-72.png',
      data: payload.data,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction || false,
    });
  }

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    const perm = await NotificationService.requestPermission();
    setPermission(perm);
    
    if (perm === 'granted') {
      const sub = await NotificationService.subscribe();
      setSubscription(sub);
    }
  };

  const unsubscribe = async () => {
    const result = await NotificationService.unsubscribe();
    if (result) {
      setSubscription(null);
    }
  };

  return { permission, subscription, requestPermission, unsubscribe };
}

// Add React import
import { useState, useEffect } from 'react';
