/**
 * Notification Preferences Service
 * Handles user notification preferences for email, SMS, in-app, and push notifications
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { logger } from '../utils/logger';
import { logUserActivity } from './activityLogService';
import type { 
  NotificationPreferences,
  NotificationPreferenceUpdate
} from '../types';

// Collection name
const USERS_COLLECTION = 'users';

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailNotifications: {
    enabled: true,
    taskAssignments: true,
    approvalRequests: true,
    budgetAlerts: true,
    deadlineReminders: true,
    documentUpdates: true,
    systemAlerts: true,
    weeklyDigest: true,
    monthlyReport: false
  },
  inAppNotifications: {
    enabled: true,
    sound: true,
    desktop: true,
    taskAssignments: true,
    approvalRequests: true,
    budgetAlerts: true,
    mentions: true,
    comments: true,
    statusUpdates: true
  },
  smsNotifications: {
    enabled: false,
    criticalAlertsOnly: true,
    budgetThreshold: true,
    approvalUrgent: true,
    securityAlerts: true
  },
  pushNotifications: {
    enabled: true,
    taskReminders: true,
    approvalRequests: true,
    chatMessages: false,
    criticalAlerts: true
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
  frequencySettings: {
    maxEmailsPerDay: 50,
    maxSMSPerDay: 5,
    batchNotifications: false,
    batchInterval: 30 // minutes
  }
};

/**
 * Get notification preferences for user
 */
export const getNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences> => {
  try {
    logger.info('Fetching notification preferences', { userId });

    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      logger.warn('User not found', { userId });
      return DEFAULT_PREFERENCES;
    }

    const userData = userDoc.data();
    const preferences = userData.notificationPreferences;

    if (!preferences) {
      logger.info('No preferences found, returning defaults', { userId });
      return DEFAULT_PREFERENCES;
    }

    // Merge with defaults to ensure all fields exist
    return {
      emailNotifications: {
        ...DEFAULT_PREFERENCES.emailNotifications,
        ...preferences.emailNotifications
      },
      inAppNotifications: {
        ...DEFAULT_PREFERENCES.inAppNotifications,
        ...preferences.inAppNotifications
      },
      smsNotifications: {
        ...DEFAULT_PREFERENCES.smsNotifications,
        ...preferences.smsNotifications
      },
      pushNotifications: {
        ...DEFAULT_PREFERENCES.pushNotifications,
        ...preferences.pushNotifications
      },
      quietHours: {
        ...DEFAULT_PREFERENCES.quietHours,
        ...preferences.quietHours
      },
      frequencySettings: {
        ...DEFAULT_PREFERENCES.frequencySettings,
        ...preferences.frequencySettings
      }
    };

  } catch (error: any) {
    logger.error('Error fetching notification preferences', error, { userId });
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  request: NotificationPreferenceUpdate
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { userId, section, settings } = request;

    logger.info('Updating notification preferences', { userId, section });

    // Get current preferences
    const currentPreferences = await getNotificationPreferences(userId);

    // Update specific section
    let updatedPreferences: NotificationPreferences;

    switch (section) {
      case 'email':
        updatedPreferences = {
          ...currentPreferences,
          emailNotifications: {
            ...currentPreferences.emailNotifications,
            ...settings.emailNotifications
          }
        };
        break;

      case 'inApp':
        updatedPreferences = {
          ...currentPreferences,
          inAppNotifications: {
            ...currentPreferences.inAppNotifications,
            ...settings.inAppNotifications
          }
        };
        break;

      case 'sms':
        updatedPreferences = {
          ...currentPreferences,
          smsNotifications: {
            ...currentPreferences.smsNotifications,
            ...settings.smsNotifications
          }
        };
        break;

      case 'push':
        updatedPreferences = {
          ...currentPreferences,
          pushNotifications: {
            ...currentPreferences.pushNotifications,
            ...settings.pushNotifications
          }
        };
        break;

      case 'quietHours':
        updatedPreferences = {
          ...currentPreferences,
          quietHours: {
            ...currentPreferences.quietHours,
            ...settings.quietHours
          }
        };
        break;

      case 'frequency':
        updatedPreferences = {
          ...currentPreferences,
          frequencySettings: {
            ...currentPreferences.frequencySettings,
            ...settings.frequencySettings
          }
        };
        break;

      default:
        return {
          success: false,
          error: 'Invalid section'
        };
    }

    // Save to Firestore
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      notificationPreferences: updatedPreferences,
      updatedAt: serverTimestamp()
    });

    logger.info('Notification preferences updated', { userId, section });

    // Log activity
    await logUserActivity({
      userId,
      action: 'preferences_updated',
      category: 'profile',
      description: `Updated ${section} notification preferences`,
      status: 'success',
      metadata: { section, changes: settings }
    });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error updating notification preferences', error, { userId: request.userId });
    
    return {
      success: false,
      error: error.message || 'Failed to update notification preferences'
    };
  }
};

/**
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info('Resetting notification preferences to defaults', { userId });

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      notificationPreferences: DEFAULT_PREFERENCES,
      updatedAt: serverTimestamp()
    });

    logger.info('Notification preferences reset', { userId });

    // Log activity
    await logUserActivity({
      userId,
      action: 'preferences_updated',
      category: 'profile',
      description: 'Reset notification preferences to defaults',
      status: 'success'
    });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error resetting notification preferences', error, { userId });
    
    return {
      success: false,
      error: error.message || 'Failed to reset notification preferences'
    };
  }
};

/**
 * Check if notifications should be sent based on quiet hours
 */
export const isWithinQuietHours = (preferences: NotificationPreferences): boolean => {
  if (!preferences.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  // Parse start and end times
  const [startHour, startMinute] = preferences.quietHours.startTime.split(':').map(Number);
  const [endHour, endMinute] = preferences.quietHours.endTime.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
};

/**
 * Check if user should receive specific notification type
 */
export const shouldSendNotification = async (
  userId: string,
  notificationType: {
    channel: 'email' | 'inApp' | 'sms' | 'push';
    category?: string;
  }
): Promise<boolean> => {
  try {
    const preferences = await getNotificationPreferences(userId);
    const { channel, category } = notificationType;

    // Check if channel is enabled
    switch (channel) {
      case 'email':
        if (!preferences.emailNotifications.enabled) return false;
        if (category && preferences.emailNotifications[category as keyof typeof preferences.emailNotifications] === false) {
          return false;
        }
        break;

      case 'inApp':
        if (!preferences.inAppNotifications.enabled) return false;
        if (category && preferences.inAppNotifications[category as keyof typeof preferences.inAppNotifications] === false) {
          return false;
        }
        break;

      case 'sms':
        if (!preferences.smsNotifications.enabled) return false;
        if (category && preferences.smsNotifications[category as keyof typeof preferences.smsNotifications] === false) {
          return false;
        }
        break;

      case 'push':
        if (!preferences.pushNotifications.enabled) return false;
        if (category && preferences.pushNotifications[category as keyof typeof preferences.pushNotifications] === false) {
          return false;
        }
        break;
    }

    // Check quiet hours (except for critical alerts)
    if (channel !== 'sms' || !preferences.smsNotifications.criticalAlertsOnly) {
      if (isWithinQuietHours(preferences)) {
        logger.debug('Notification suppressed due to quiet hours', { userId, channel, category });
        return false;
      }
    }

    return true;

  } catch (error: any) {
    logger.error('Error checking notification preferences', error, { userId, notificationType });
    // Default to sending notification if error occurs
    return true;
  }
};

/**
 * Get notification statistics for user
 */
export const getNotificationStatistics = async (
  userId: string,
  days: number = 30
): Promise<{
  totalSent: number;
  byChannel: { email: number; inApp: number; sms: number; push: number };
  bySuppressed: number;
  averagePerDay: number;
}> => {
  try {
    // This would require a separate notifications_sent collection
    // For now, return placeholder data
    
    logger.info('Getting notification statistics', { userId, days });

    // In production, query notifications_sent collection
    return {
      totalSent: 0,
      byChannel: {
        email: 0,
        inApp: 0,
        sms: 0,
        push: 0
      },
      bySuppressed: 0,
      averagePerDay: 0
    };

  } catch (error: any) {
    logger.error('Error getting notification statistics', error, { userId });
    
    return {
      totalSent: 0,
      byChannel: {
        email: 0,
        inApp: 0,
        sms: 0,
        push: 0
      },
      bySuppressed: 0,
      averagePerDay: 0
    };
  }
};

/**
 * Enable all notifications (convenience function)
 */
export const enableAllNotifications = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updatedPreferences: NotificationPreferences = {
      emailNotifications: {
        enabled: true,
        taskAssignments: true,
        approvalRequests: true,
        budgetAlerts: true,
        deadlineReminders: true,
        documentUpdates: true,
        systemAlerts: true,
        weeklyDigest: true,
        monthlyReport: true
      },
      inAppNotifications: {
        enabled: true,
        sound: true,
        desktop: true,
        taskAssignments: true,
        approvalRequests: true,
        budgetAlerts: true,
        mentions: true,
        comments: true,
        statusUpdates: true
      },
      smsNotifications: {
        enabled: true,
        criticalAlertsOnly: false,
        budgetThreshold: true,
        approvalUrgent: true,
        securityAlerts: true
      },
      pushNotifications: {
        enabled: true,
        taskReminders: true,
        approvalRequests: true,
        chatMessages: true,
        criticalAlerts: true
      },
      quietHours: DEFAULT_PREFERENCES.quietHours,
      frequencySettings: DEFAULT_PREFERENCES.frequencySettings
    };

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      notificationPreferences: updatedPreferences,
      updatedAt: serverTimestamp()
    });

    logger.info('All notifications enabled', { userId });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error enabling all notifications', error, { userId });
    
    return {
      success: false,
      error: error.message || 'Failed to enable all notifications'
    };
  }
};

/**
 * Disable all notifications (convenience function)
 */
export const disableAllNotifications = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updatedPreferences: NotificationPreferences = {
      emailNotifications: {
        ...DEFAULT_PREFERENCES.emailNotifications,
        enabled: false
      },
      inAppNotifications: {
        ...DEFAULT_PREFERENCES.inAppNotifications,
        enabled: false
      },
      smsNotifications: {
        ...DEFAULT_PREFERENCES.smsNotifications,
        enabled: false
      },
      pushNotifications: {
        ...DEFAULT_PREFERENCES.pushNotifications,
        enabled: false
      },
      quietHours: DEFAULT_PREFERENCES.quietHours,
      frequencySettings: DEFAULT_PREFERENCES.frequencySettings
    };

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      notificationPreferences: updatedPreferences,
      updatedAt: serverTimestamp()
    });

    logger.info('All notifications disabled', { userId });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error disabling all notifications', error, { userId });
    
    return {
      success: false,
      error: error.message || 'Failed to disable all notifications'
    };
  }
};

export default {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  isWithinQuietHours,
  shouldSendNotification,
  getNotificationStatistics,
  enableAllNotifications,
  disableAllNotifications
};
