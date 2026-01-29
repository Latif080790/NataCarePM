/**
 * Notification Service Configuration
 * Centralized configuration for all notification channels
 */

export interface NotificationConfig {
  // Twilio SMS Configuration
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    messagingServiceSid?: string;
  };

  // Email Configuration
  email: {
    provider: 'sendgrid' | 'firebase' | 'smtp';
    sendgrid?: {
      apiKey: string;
      fromEmail: string;
      fromName: string;
    };
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };

  // Firebase Cloud Messaging (Push Notifications)
  fcm: {
    vapidKey: string;
    serverKey: string;
  };

  // General Settings
  settings: {
    maxRetries: number;
    retryDelayMs: number;
    rateLimitPerMinute: number;
    enableLogging: boolean;
  };
}

/**
 * Load notification configuration from environment variables
 */
export const getNotificationConfig = (): NotificationConfig => {
  return {
    twilio: {
      accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
      authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
      phoneNumber: import.meta.env.VITE_TWILIO_PHONE_NUMBER || '',
      messagingServiceSid: import.meta.env.VITE_TWILIO_MESSAGING_SERVICE_SID,
    },

    email: {
      provider: 'sendgrid', // Default to SendGrid
      sendgrid: {
        apiKey: import.meta.env.VITE_SENDGRID_API_KEY || '',
        fromEmail: import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@natacare.com',
        fromName: import.meta.env.VITE_SENDGRID_FROM_NAME || 'NataCarePM',
      },
    },

    fcm: {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY || '',
      serverKey: import.meta.env.VITE_FCM_SERVER_KEY || '',
    },

    settings: {
      maxRetries: parseInt(import.meta.env.VITE_NOTIFICATION_MAX_RETRIES || '3'),
      retryDelayMs: parseInt(import.meta.env.VITE_NOTIFICATION_RETRY_DELAY_MS || '5000'),
      rateLimitPerMinute: parseInt(import.meta.env.VITE_NOTIFICATION_RATE_LIMIT_PER_MINUTE || '60'),
      enableLogging: import.meta.env.DEV || false,
    },
  };
};

/**
 * Validate notification configuration
 */
export const validateConfig = (
  config: NotificationConfig
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate Twilio
  if (!config.twilio.accountSid) {
    warnings.push('Twilio Account SID not configured - SMS notifications disabled');
  }
  if (!config.twilio.authToken) {
    warnings.push('Twilio Auth Token not configured - SMS notifications disabled');
  }
  if (!config.twilio.phoneNumber) {
    warnings.push('Twilio Phone Number not configured - SMS notifications disabled');
  }

  // Validate Email
  if (config.email.provider === 'sendgrid') {
    if (!config.email.sendgrid?.apiKey) {
      warnings.push('SendGrid API Key not configured - Email notifications disabled');
    }
    if (!config.email.sendgrid?.fromEmail) {
      errors.push('SendGrid From Email is required');
    }
  }

  // Validate FCM
  if (!config.fcm.vapidKey) {
    warnings.push('FCM VAPID Key not configured - Push notifications disabled');
  }
  if (!config.fcm.serverKey) {
    warnings.push('FCM Server Key not configured - Push notifications disabled');
  }

  // Validate Settings
  if (config.settings.maxRetries < 0 || config.settings.maxRetries > 10) {
    errors.push('Max retries must be between 0 and 10');
  }
  if (config.settings.retryDelayMs < 1000 || config.settings.retryDelayMs > 60000) {
    warnings.push('Retry delay should be between 1-60 seconds');
  }
  if (config.settings.rateLimitPerMinute < 1 || config.settings.rateLimitPerMinute > 1000) {
    warnings.push('Rate limit should be between 1-1000 per minute');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Check if specific channel is configured
 */
export const isChannelConfigured = (
  channel: 'email' | 'sms' | 'push',
  config: NotificationConfig
): boolean => {
  switch (channel) {
    case 'email':
      return !!(config.email.sendgrid?.apiKey && config.email.sendgrid?.fromEmail);
    case 'sms':
      return !!(config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber);
    case 'push':
      return !!(config.fcm.vapidKey && config.fcm.serverKey);
    default:
      return false;
  }
};
