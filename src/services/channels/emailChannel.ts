/**
 * Email Channel Implementation
 * Supports SendGrid and Firebase extensions
 */

import { getNotificationConfig } from '../config/notificationConfig';
import type { Notification } from '../../types/automation';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: {
    email: string;
    name: string;
  };
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    type: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * SendGrid Email Service
 */
class SendGridEmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(this.apiKey);

      const msg: any = {
        to: options.to,
        from: options.from || {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        text: options.text || this.stripHtml(options.html),
        html: options.html,
        replyTo: options.replyTo,
        attachments: options.attachments,
      };

      const response = await sgMail.default.send(msg);

      return {
        success: true,
        messageId: response[0].headers['x-message-id'] as string,
      };
    } catch (error) {
      console.error('SendGrid email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Email Template Builder
 */
export class EmailTemplateBuilder {
  /**
   * Build HTML email from notification
   */
  static buildFromNotification(notification: Notification): string {
    const priorityColor = this.getPriorityColor(notification.priority);
    const iconEmoji = this.getTypeIcon(notification.type);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
      background: ${priorityColor};
    }
    .content {
      background: white;
      padding: 30px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 20px;
    }
    .actions {
      margin-top: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    .button:hover {
      background: #5568d3;
    }
    .footer {
      background: #f7fafc;
      padding: 20px;
      border-radius: 0 0 8px 8px;
      text-align: center;
      font-size: 14px;
      color: #718096;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .metadata {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="icon">${iconEmoji}</div>
    <h1>${notification.title}</h1>
    <span class="priority-badge">${notification.priority}</span>
  </div>
  
  <div class="content">
    <div class="message">
      ${notification.message}
    </div>
    
    ${
      notification.actions && notification.actions.length > 0
        ? `
      <div class="actions">
        ${notification.actions
          .map(
            (action) => `
          <a href="${action.url || '#'}" class="button">${action.label}</a>
        `
          )
          .join('')}
      </div>
    `
        : ''
    }
    
    ${
      notification.data
        ? `
      <div class="metadata">
        <strong>Additional Information:</strong><br>
        ${this.formatData(notification.data)}
      </div>
    `
        : ''
    }
  </div>
  
  <div class="footer">
    <p>This is an automated notification from NataCarePM.</p>
    <p>© ${new Date().getFullYear()} NataCarePM. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  private static getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#ca8a04';
      case 'low':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  }

  private static getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      project_update: '📊',
      task_assigned: '✅',
      task_completed: '🎉',
      deadline_reminder: '⏰',
      budget_alert: '💰',
      document_uploaded: '📄',
      approval_required: '✋',
      message_received: '💬',
      system_alert: '⚠️',
      payment_due: '💳',
    };
    return icons[type] || '📬';
  }

  private static formatData(data: Record<string, unknown>): string {
    return Object.entries(data)
      .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
      .join('');
  }
}

/**
 * Email Service Manager
 */
export class EmailService {
  private sendGridService: SendGridEmailService | null = null;
  private config = getNotificationConfig();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.config.email.provider === 'sendgrid' && this.config.email.sendgrid) {
      this.sendGridService = new SendGridEmailService(
        this.config.email.sendgrid.apiKey,
        this.config.email.sendgrid.fromEmail,
        this.config.email.sendgrid.fromName
      );
    }
  }

  /**
   * Send email notification
   */
  async sendNotification(notification: Notification): Promise<EmailResult> {
    if (!notification.recipientEmail) {
      return {
        success: false,
        error: 'Recipient email not provided',
      };
    }

    if (!this.sendGridService) {
      console.warn('Email service not configured - skipping email notification');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const html = EmailTemplateBuilder.buildFromNotification(notification);

    const options: EmailOptions = {
      to: notification.recipientEmail,
      subject: notification.title,
      html,
    };

    return this.sendGridService.send(options);
  }

  /**
   * Send custom email
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    if (!this.sendGridService) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    return this.sendGridService.send(options);
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.sendGridService !== null;
  }
}

// Export singleton instance
export const emailService = new EmailService();
