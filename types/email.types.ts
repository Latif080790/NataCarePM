/**
 * Email Integration Type Definitions
 * Priority 3E: Email Integration System
 */

export type EmailNotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'project_update'
  | 'deadline_reminder'
  | 'change_order_submitted'
  | 'change_order_approved'
  | 'change_order_rejected'
  | 'risk_alert'
  | 'quality_inspection'
  | 'defect_found'
  | 'budget_alert'
  | 'weekly_summary'
  | 'monthly_report'
  | 'custom';

export type EmailFrequency = 'immediate' | 'daily_digest' | 'weekly_digest' | 'never';

export type EmailPriority = 'low' | 'normal' | 'high' | 'urgent';

export type EmailStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'bounced';

export interface EmailRecipient {
  email: string;
  name?: string;
  userId?: string;
  type: 'to' | 'cc' | 'bcc';
}

export interface EmailAttachment {
  filename: string;
  content?: string; // base64 encoded or URL
  contentType: string;
  size: number;
  url?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: EmailNotificationType;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  
  variables: {
    name: string;
    description: string;
    defaultValue?: string;
    required: boolean;
  }[];
  
  isActive: boolean;
  isDefault: boolean;
  
  // Branding
  logo?: string;
  headerColor?: string;
  footerText?: string;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailNotification {
  id: string;
  type: EmailNotificationType;
  
  recipients: EmailRecipient[];
  
  subject: string;
  bodyHtml: string;
  bodyText: string;
  
  templateId?: string;
  templateVariables?: Record<string, any>;
  
  attachments?: EmailAttachment[];
  
  priority: EmailPriority;
  status: EmailStatus;
  
  projectId?: string;
  taskId?: string;
  userId?: string;
  
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  
  errorMessage?: string;
  retryCount?: number;
  maxRetries?: number;
  
  metadata?: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferences {
  userId: string;
  
  enabled: boolean; // Master switch
  
  notifications: {
    [key in EmailNotificationType]?: {
      enabled: boolean;
      frequency: EmailFrequency;
    };
  };
  
  digestSchedule?: {
    dailyTime?: string; // HH:MM format
    weeklyDay?: number; // 0-6 (Sunday-Saturday)
    weeklyTime?: string;
  };
  
  emailAddress: string;
  alternateEmails?: string[];
  
  language?: string;
  timezone?: string;
  
  unsubscribeToken?: string;
  unsubscribedAt?: Date;
  
  updatedAt: Date;
}

export interface EmailActivity {
  emailId: string;
  recipientEmail: string;
  
  events: {
    type: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
    timestamp: Date;
    metadata?: {
      link?: string;
      userAgent?: string;
      ipAddress?: string;
      bounceReason?: string;
    };
  }[];
  
  deliveryStatus: 'pending' | 'delivered' | 'failed' | 'bounced';
  opened: boolean;
  openCount: number;
  clicked: boolean;
  clickCount: number;
  
  lastActivityAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  
  templateId: string;
  
  recipients: {
    targetAudience: 'all_users' | 'project_members' | 'role_based' | 'custom';
    filters?: {
      roles?: string[];
      projects?: string[];
      userIds?: string[];
    };
    count: number;
  };
  
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    openRate: number; // percentage
    clickRate: number; // percentage
  };
  
  createdBy: string;
  createdAt: Date;
  sentAt?: Date;
}

export interface EmailDigest {
  userId: string;
  type: 'daily' | 'weekly';
  periodStart: Date;
  periodEnd: Date;
  
  sections: {
    title: string;
    items: {
      type: EmailNotificationType;
      title: string;
      description: string;
      link?: string;
      metadata?: Record<string, any>;
    }[];
  }[];
  
  generatedAt: Date;
  sentAt?: Date;
}

export interface EmailLog {
  id: string;
  emailId?: string;
  
  recipient: string;
  subject: string;
  
  status: EmailStatus;
  statusMessage?: string;
  
  sentAt?: Date;
  deliveredAt?: Date;
  
  metadata?: Record<string, any>;
  
  createdAt: Date;
}

export interface EmailStatistics {
  period: {
    start: Date;
    end: Date;
  };
  
  totals: {
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  
  byType: Record<EmailNotificationType, {
    sent: number;
    opened: number;
    clicked: number;
  }>;
  
  topLinks: {
    url: string;
    clicks: number;
  }[];
  
  trends: {
    sentTrend: 'increasing' | 'decreasing' | 'stable';
    openRateTrend: 'improving' | 'declining' | 'stable';
  };
}

export default EmailNotification;
