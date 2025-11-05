/**
 * Email Integration API Service
 * Priority 3E: Email Integration System
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type {
  EmailNotification,
  EmailTemplate,
  EmailPreferences,
  EmailCampaign,
  EmailStatistics,
  EmailNotificationType,
  EmailStatus,
} from '@/types/email.types';

const NOTIFICATIONS_COLLECTION = 'emailNotifications';
const TEMPLATES_COLLECTION = 'emailTemplates';
const PREFERENCES_COLLECTION = 'emailPreferences';
const CAMPAIGNS_COLLECTION = 'emailCampaigns';

class EmailService {
  async sendNotification(
    notification: Omit<EmailNotification, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<EmailNotification> {
    try {
      const now = new Date();
      const notificationData = {
        ...notification,
        status: 'queued' as EmailStatus,
        scheduledFor: notification.scheduledFor
          ? Timestamp.fromDate(notification.scheduledFor)
          : null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);

      // TODO: Integrate with actual email service (SendGrid, SES, etc.)
      // For now, we just queue it
      console.log('[EmailService] Email queued:', docRef.id);

      return {
        ...notification,
        id: docRef.id,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
      };
    } catch (error: any) {
      console.error('[EmailService] Error sending notification:', error);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as EmailTemplate;
    } catch (error: any) {
      console.error('[EmailService] Error getting template:', error);
      throw new Error(`Failed to get template: ${error.message}`);
    }
  }

  async getTemplates(type?: EmailNotificationType): Promise<EmailTemplate[]> {
    try {
      const q = collection(db, TEMPLATES_COLLECTION);
      const constraints: any[] = [where('isActive', '==', true)];

      if (type) {
        constraints.push(where('type', '==', type));
      }

      const templateQuery = query(q, ...constraints);
      const querySnapshot = await getDocs(templateQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as EmailTemplate;
      });
    } catch (error: any) {
      console.error('[EmailService] Error getting templates:', error);
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }

  async getUserPreferences(userId: string): Promise<EmailPreferences | null> {
    try {
      const docRef = doc(db, PREFERENCES_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Return default preferences
        return {
          userId,
          enabled: true,
          notifications: {},
          emailAddress: '',
          updatedAt: new Date(),
        };
      }

      const data = docSnap.data();
      return {
        userId,
        ...data,
        updatedAt: data.updatedAt?.toDate(),
        unsubscribedAt: data.unsubscribedAt?.toDate(),
      } as EmailPreferences;
    } catch (error: any) {
      console.error('[EmailService] Error getting preferences:', error);
      throw new Error(`Failed to get preferences: ${error.message}`);
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<EmailPreferences>
  ): Promise<void> {
    try {
      const docRef = doc(db, PREFERENCES_COLLECTION, userId);

      const updateData = {
        ...preferences,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      console.error('[EmailService] Error updating preferences:', error);
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }

  async getStatistics(periodStart: Date, periodEnd: Date): Promise<EmailStatistics> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('createdAt', '>=', Timestamp.fromDate(periodStart)),
        where('createdAt', '<=', Timestamp.fromDate(periodEnd))
      );

      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map((doc) => doc.data() as any);

      const stats: EmailStatistics = {
        period: { start: periodStart, end: periodEnd },
        totals: {
          sent: notifications.filter((n) => n.status === 'sent').length,
          delivered: notifications.filter((n) => n.deliveredAt).length,
          failed: notifications.filter((n) => n.status === 'failed').length,
          opened: notifications.filter((n) => n.openedAt).length,
          clicked: notifications.filter((n) => n.clickedAt).length,
          bounced: notifications.filter((n) => n.status === 'bounced').length,
        },
        rates: {
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
        },
        byType: {} as any,
        topLinks: [],
        trends: {
          sentTrend: 'stable',
          openRateTrend: 'stable',
        },
      };

      // Calculate rates
      const sent = stats.totals.sent;
      if (sent > 0) {
        stats.rates.deliveryRate = (stats.totals.delivered / sent) * 100;
        stats.rates.openRate = (stats.totals.opened / sent) * 100;
        stats.rates.clickRate = (stats.totals.clicked / sent) * 100;
        stats.rates.bounceRate = (stats.totals.bounced / sent) * 100;
      }

      return stats;
    } catch (error: any) {
      console.error('[EmailService] Error getting statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

export const emailService = new EmailService();
export default emailService;
