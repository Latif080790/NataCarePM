/**
 * SMS Channel Implementation using Twilio
 */

import { getNotificationConfig } from '../config/notificationConfig';
import type { Notification } from '../../types/automation';

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
  mediaUrl?: string[];
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryStatus?: string;
}

/**
 * Twilio SMS Service
 */
class TwilioSMSService {
  private client: any;
  private phoneNumber: string;
  
  constructor(accountSid: string, authToken: string, phoneNumber: string) {
    this.phoneNumber = phoneNumber;
    this.initializeClient(accountSid, authToken);
  }
  
  private async initializeClient(accountSid: string, authToken: string): Promise<void> {
    try {
      const twilio = await import('twilio');
      this.client = twilio.default(accountSid, authToken);
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }
  
  async send(options: SMSOptions): Promise<SMSResult> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }
      
      // Format phone number (ensure E.164 format)
      const formattedTo = this.formatPhoneNumber(options.to);
      
      const messageOptions: any = {
        body: options.message,
        from: options.from || this.phoneNumber,
        to: formattedTo
      };
      
      // Add media URL if provided (MMS)
      if (options.mediaUrl && options.mediaUrl.length > 0) {
        messageOptions.mediaUrl = options.mediaUrl;
      }
      
      const message = await this.client.messages.create(messageOptions);
      
      return {
        success: true,
        messageId: message.sid,
        deliveryStatus: message.status
      };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message || 'Unknown SMS error'
      };
    }
  }
  
  /**
   * Format phone number to E.164 format
   * E.164 format: +[country code][number]
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters except '+'
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If doesn't start with '+', assume it's Indonesian number
    if (!cleaned.startsWith('+')) {
      // Remove leading '0' if present
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      // Add Indonesian country code
      cleaned = '+62' + cleaned;
    }
    
    return cleaned;
  }
  
  /**
   * Get message delivery status
   */
  async getDeliveryStatus(messageId: string): Promise<string> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }
      
      const message = await this.client.messages(messageId).fetch();
      return message.status;
    } catch (error) {
      console.error('Error fetching message status:', error);
      return 'unknown';
    }
  }
}

/**
 * SMS Template Builder
 */
export class SMSTemplateBuilder {
  /**
   * Build SMS message from notification (max 160 chars for standard SMS)
   */
  static buildFromNotification(notification: Notification): string {
    const priorityPrefix = this.getPriorityPrefix(notification.priority);
    const typePrefix = this.getTypePrefix(notification.type);
    
    // Build message parts
    const parts: string[] = [];
    
    // Add priority indicator for urgent/high
    if (priorityPrefix) {
      parts.push(priorityPrefix);
    }
    
    // Add type prefix
    if (typePrefix) {
      parts.push(typePrefix);
    }
    
    // Add title
    parts.push(notification.title);
    
    // Add truncated message (if space allows)
    const headerLength = parts.join(' ').length;
    const remainingChars = 160 - headerLength - 10; // Reserve 10 chars for ellipsis and formatting
    
    if (remainingChars > 20) {
      const truncatedMessage = this.truncate(notification.message, remainingChars);
      parts.push(truncatedMessage);
    }
    
    return parts.join(' - ');
  }
  
  /**
   * Build long SMS message (no character limit, but charged as multiple messages)
   */
  static buildLongMessage(notification: Notification): string {
    const parts: string[] = [];
    
    // Header
    parts.push(`[${notification.priority.toUpperCase()}]`);
    parts.push(notification.title);
    parts.push('');
    
    // Message body
    parts.push(notification.message);
    
    // Actions (if any)
    if (notification.actions && notification.actions.length > 0) {
      parts.push('');
      parts.push('Actions:');
      notification.actions.forEach((action, index) => {
        parts.push(`${index + 1}. ${action.label}`);
        if (action.url) {
          parts.push(`   ${action.url}`);
        }
      });
    }
    
    // Footer
    parts.push('');
    parts.push('- NataCarePM');
    
    return parts.join('\n');
  }
  
  private static getPriorityPrefix(priority: string): string {
    switch (priority) {
      case 'urgent': return '🚨 URGENT';
      case 'high': return '⚠️ HIGH';
      default: return '';
    }
  }
  
  private static getTypePrefix(type: string): string {
    const prefixes: Record<string, string> = {
      task_assigned: '✅ Task',
      deadline_reminder: '⏰ Reminder',
      budget_alert: '💰 Budget',
      approval_required: '✋ Approval',
      payment_due: '💳 Payment'
    };
    return prefixes[type] || '';
  }
  
  private static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}

/**
 * SMS Service Manager
 */
export class SMSService {
  private twilioService: TwilioSMSService | null = null;
  private config = getNotificationConfig();
  private sentCount: Map<string, number> = new Map(); // Rate limiting
  
  constructor() {
    this.initialize();
  }
  
  private initialize(): void {
    const { accountSid, authToken, phoneNumber } = this.config.twilio;
    
    if (accountSid && authToken && phoneNumber) {
      this.twilioService = new TwilioSMSService(accountSid, authToken, phoneNumber);
    }
  }
  
  /**
   * Send SMS notification
   */
  async sendNotification(notification: Notification, useLongFormat = false): Promise<SMSResult> {
    if (!notification.recipientPhone) {
      return {
        success: false,
        error: 'Recipient phone number not provided'
      };
    }
    
    if (!this.twilioService) {
      console.warn('SMS service not configured - skipping SMS notification');
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }
    
    // Check rate limit
    if (!this.checkRateLimit(notification.recipientPhone)) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      };
    }
    
    // Build message
    const message = useLongFormat
      ? SMSTemplateBuilder.buildLongMessage(notification)
      : SMSTemplateBuilder.buildFromNotification(notification);
    
    const options: SMSOptions = {
      to: notification.recipientPhone,
      message
    };
    
    const result = await this.twilioService.send(options);
    
    // Update rate limit counter
    if (result.success) {
      this.incrementRateLimit(notification.recipientPhone);
    }
    
    return result;
  }
  
  /**
   * Send custom SMS
   */
  async send(options: SMSOptions): Promise<SMSResult> {
    if (!this.twilioService) {
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }
    
    // Check rate limit
    if (!this.checkRateLimit(options.to)) {
      return {
        success: false,
        error: 'Rate limit exceeded'
      };
    }
    
    const result = await this.twilioService.send(options);
    
    if (result.success) {
      this.incrementRateLimit(options.to);
    }
    
    return result;
  }
  
  /**
   * Check delivery status
   */
  async getDeliveryStatus(messageId: string): Promise<string> {
    if (!this.twilioService) {
      return 'unknown';
    }
    
    return this.twilioService.getDeliveryStatus(messageId);
  }
  
  /**
   * Rate limiting: Check if recipient can receive message
   */
  private checkRateLimit(phoneNumber: string): boolean {
    const now = Date.now();
    const key = `${phoneNumber}_${Math.floor(now / 60000)}`; // Per minute
    const count = this.sentCount.get(key) || 0;
    
    return count < this.config.settings.rateLimitPerMinute;
  }
  
  /**
   * Increment rate limit counter
   */
  private incrementRateLimit(phoneNumber: string): void {
    const now = Date.now();
    const key = `${phoneNumber}_${Math.floor(now / 60000)}`;
    const count = this.sentCount.get(key) || 0;
    this.sentCount.set(key, count + 1);
    
    // Cleanup old entries (older than 2 minutes)
    const oldestKey = Math.floor((now - 120000) / 60000);
    for (const [k] of this.sentCount) {
      const timestamp = parseInt(k.split('_').pop() || '0');
      if (timestamp < oldestKey) {
        this.sentCount.delete(k);
      }
    }
  }
  
  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return this.twilioService !== null;
  }
}

// Export singleton instance
export const smsService = new SMSService();
