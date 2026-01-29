import { db } from '@/firebaseConfig';
import {
    CreateNotificationInput,
    Notification,
    NotificationChannel,
    NotificationFilters,
    NotificationPriority,
    NotificationType,
} from '@/types/automation';
import { logger } from '@/utils/logger.enhanced';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { emailService } from './channels/emailChannel';
import { pushService } from './channels/pushChannel';
import { smsService } from './channels/smsChannel';

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

export const createNotification = async (input: CreateNotificationInput): Promise<string> => {
  // Initialize delivery status for each channel
  const deliveryStatus: Record<
    NotificationChannel,
    { sent: boolean; sentAt?: Timestamp; error?: string }
  > = {
    [NotificationChannel.IN_APP]: { sent: false },
    [NotificationChannel.EMAIL]: { sent: false },
    [NotificationChannel.SMS]: { sent: false },
    [NotificationChannel.PUSH]: { sent: false },
    [NotificationChannel.WEBHOOK]: { sent: false },
  };

  const notificationData: Omit<Notification, 'id'> = {
    recipientId: input.recipientId,
    recipientEmail: input.recipientEmail,
    type: input.type,
    priority: input.priority,
    title: input.title,
    message: input.message,
    data: input.data,
    channels: input.channels,
    scheduledFor: input.scheduledFor,
    isRead: false,
    isSent: false,
    deliveryStatus,
    actions: input.actions,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    category: input.category,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'notifications'), notificationData);

  // Send notification asynchronously if not scheduled
  if (!input.scheduledFor) {
    setTimeout(() => sendNotificationChannels(docRef.id, input.channels), 0);
  }

  return docRef.id;
};

export const getNotifications = async (
  filters?: NotificationFilters,
  limitCount: number = 50
): Promise<Notification[]> => {
  let q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (filters?.recipientId) {
    q = query(q, where('recipientId', '==', filters.recipientId));
  }

  if (filters?.type) {
    q = query(q, where('type', '==', filters.type));
  }

  if (filters?.priority) {
    q = query(q, where('priority', '==', filters.priority));
  }

  if (filters?.isRead !== undefined) {
    q = query(q, where('isRead', '==', filters.isRead));
  }

  if (filters?.category) {
    q = query(q, where('category', '==', filters.category));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Notification
  );
};

export const getNotificationById = async (notificationId: string): Promise<Notification | null> => {
  const docRef = doc(db, 'notifications', notificationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Notification;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, {
    isRead: true,
    readAt: Timestamp.now(),
  });
};

export const markMultipleAsRead = async (notificationIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  notificationIds.forEach((id) => {
    const docRef = doc(db, 'notifications', id);
    batch.update(docRef, {
      isRead: true,
      readAt: Timestamp.now(),
    });
  });

  await batch.commit();
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      isRead: true,
      readAt: Timestamp.now(),
    });
  });

  await batch.commit();
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const docRef = doc(db, 'notifications', notificationId);
  await deleteDoc(docRef);
};

export const deleteMultipleNotifications = async (notificationIds: string[]): Promise<void> => {
  const batch = writeBatch(db);

  notificationIds.forEach((id) => {
    const docRef = doc(db, 'notifications', id);
    batch.delete(docRef);
  });

  await batch.commit();
};

// ============================================================================
// NOTIFICATION COUNTS
// ============================================================================

export const getUnreadCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const getNotificationCounts = async (
  userId: string
): Promise<{
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}> => {
  const q = query(collection(db, 'notifications'), where('recipientId', '==', userId));

  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map((doc) => doc.data() as Notification);

  const byType: Record<NotificationType, number> = {
    info: 0,
    success: 0,
    warning: 0,
    error: 0,
    alert: 0,
  };

  const byPriority: Record<NotificationPriority, number> = {
    low: 0,
    normal: 0,
    high: 0,
    urgent: 0,
  };

  let unread = 0;

  notifications.forEach((notification) => {
    if (!notification.isRead) {
      unread++;
    }
    byType[notification.type]++;
    byPriority[notification.priority]++;
  });

  return {
    total: notifications.length,
    unread,
    byType,
    byPriority,
  };
};

// ============================================================================
// NOTIFICATION DELIVERY
// ============================================================================

const sendNotificationChannels = async (
  notificationId: string,
  channels: NotificationChannel[]
): Promise<void> => {
  const notification = await getNotificationById(notificationId);
  if (!notification) {
    return;
  }

  const deliveryStatus = { ...notification.deliveryStatus };

  for (const channel of channels) {
    try {
      await sendToChannel(notification, channel);
      deliveryStatus[channel] = {
        sent: true,
        sentAt: Timestamp.now(),
      };
    } catch (error: any) {
      deliveryStatus[channel] = {
        sent: false,
        error: error.message,
      };
    }
  }

  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, {
    isSent: true,
    sentAt: Timestamp.now(),
    deliveryStatus,
  });
};

const sendToChannel = async (
  notification: Notification,
  channel: NotificationChannel
): Promise<void> => {
  switch (channel) {
    case NotificationChannel.IN_APP:
      // Already stored in Firestore
      return;

    case NotificationChannel.EMAIL:
      await sendEmail(notification);
      return;

    case NotificationChannel.SMS:
      await sendSMS(notification);
      return;

    case NotificationChannel.PUSH:
      await sendPushNotification(notification);
      return;

    case NotificationChannel.WEBHOOK:
      await sendWebhook(notification);
      return;

    default:
      throw new Error(`Unknown notification channel: ${channel}`);
  }
};

// ============================================================================
// CHANNEL-SPECIFIC SENDERS
// ============================================================================

const sendEmail = async (notification: Notification): Promise<void> => {
  if (!notification.recipientEmail) {
    throw new Error('Recipient email not provided');
  }

  // Use integrated email service
  const result = await emailService.sendNotification(notification);

  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }

  logger.info('Email sent successfully', { messageId: result.messageId });
};

const sendSMS = async (notification: Notification): Promise<void> => {
  if (!notification.recipientPhone) {
    throw new Error('Recipient phone not provided');
  }

  // Use integrated SMS service
  const result = await smsService.sendNotification(notification);

  if (!result.success) {
    throw new Error(result.error || 'Failed to send SMS');
  }

  logger.info('SMS sent successfully', { messageId: result.messageId });
};

const sendPushNotification = async (notification: Notification): Promise<void> => {
  // Use integrated push notification service
  const result = await pushService.sendNotification(notification);

  if (!result.success) {
    throw new Error(result.error || 'Failed to send push notification');
  }

  logger.info('Push notification sent successfully');
};

const sendWebhook = async (notification: Notification): Promise<void> => {
  try {
    // ✅ IMPLEMENTATION: Get webhook URL from user preferences
    let webhookUrl = notification.data?.webhookUrl;

    // If not in notification data, try to get from user preferences
    if (!webhookUrl && notification.recipientId) {
      const userDoc = await getDoc(doc(db, 'users', notification.recipientId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        webhookUrl = userData?.webhookUrl || userData?.preferences?.webhookUrl;
      }
    }

    if (!webhookUrl) {
      throw new Error('Webhook URL not configured for user');
    }

    // Send webhook notification
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: notification.createdAt.toDate().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }

    logger.info('Webhook notification sent successfully to:', webhookUrl);
  } catch (error) {
    logger.error('Error sending webhook', error as Error);
    throw error;
  }
};

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export const sendPOApprovedNotification = async (
  recipientId: string,
  poData: {
    poNumber: string;
    vendorName: string;
    totalAmount: number;
    approvedBy: string;
  }
): Promise<string> => {
  return await createNotification({
    recipientId,
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.NORMAL,
    title: 'Purchase Order Approved',
    message: `PO ${poData.poNumber} for ${poData.vendorName} (${formatCurrency(poData.totalAmount)}) has been approved by ${poData.approvedBy}`,
    data: poData,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    category: 'procurement',
    relatedEntityType: 'purchase_order',
    relatedEntityId: poData.poNumber,
  });
};

export const sendGRCompletedNotification = async (
  recipientId: string,
  grData: {
    grNumber: string;
    poNumber: string;
    receivedItems: number;
    totalValue: number;
  }
): Promise<string> => {
  return await createNotification({
    recipientId,
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.NORMAL,
    title: 'Goods Receipt Completed',
    message: `GR ${grData.grNumber} for PO ${grData.poNumber} completed. ${grData.receivedItems} items received (${formatCurrency(grData.totalValue)})`,
    data: grData,
    channels: [NotificationChannel.IN_APP],
    category: 'logistics',
    relatedEntityType: 'goods_receipt',
    relatedEntityId: grData.grNumber,
  });
};

export const sendMRApprovedNotification = async (
  recipientId: string,
  mrData: {
    mrNumber: string;
    itemCount: number;
    approvedBy: string;
  }
): Promise<string> => {
  return await createNotification({
    recipientId,
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.NORMAL,
    title: 'Material Request Approved',
    message: `MR ${mrData.mrNumber} with ${mrData.itemCount} items has been approved by ${mrData.approvedBy}`,
    data: mrData,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    category: 'procurement',
    relatedEntityType: 'material_request',
    relatedEntityId: mrData.mrNumber,
  });
};

export const sendBudgetExceededAlert = async (
  recipientId: string,
  budgetData: {
    wbsCode: string;
    wbsName: string;
    budgetAmount: number;
    actualCost: number;
    variance: number;
    variancePercent: number;
  }
): Promise<string> => {
  return await createNotification({
    recipientId,
    type: NotificationType.ERROR,
    priority: NotificationPriority.URGENT,
    title: 'Budget Exceeded',
    message: `WBS ${budgetData.wbsCode} (${budgetData.wbsName}) has exceeded budget by ${formatCurrency(budgetData.variance)} (${budgetData.variancePercent.toFixed(1)}%)`,
    data: budgetData,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    category: 'finance',
    relatedEntityType: 'wbs',
    relatedEntityId: budgetData.wbsCode,
    actions: [
      {
        label: 'View WBS',
        action: 'navigate',
        url: `/wbs/${budgetData.wbsCode}`,
        style: 'primary',
      },
      {
        label: 'Review Budget',
        action: 'navigate',
        url: `/finance/budget/${budgetData.wbsCode}`,
        style: 'secondary',
      },
    ],
  });
};

export const sendStockLowAlert = async (
  recipientId: string,
  stockData: {
    materialCode: string;
    materialName: string;
    currentStock: number;
    minimumStock: number;
    unit: string;
  }
): Promise<string> => {
  return await createNotification({
    recipientId,
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    title: 'Low Stock Alert',
    message: `${stockData.materialName} (${stockData.materialCode}) is below minimum stock: ${stockData.currentStock} ${stockData.unit} (min: ${stockData.minimumStock} ${stockData.unit})`,
    data: stockData,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    category: 'inventory',
    relatedEntityType: 'material',
    relatedEntityId: stockData.materialCode,
    actions: [
      {
        label: 'Create Reorder',
        action: 'create_mr',
        style: 'primary',
      },
      {
        label: 'View Material',
        action: 'navigate',
        url: `/inventory/${stockData.materialCode}`,
        style: 'secondary',
      },
    ],
  });
};

export const sendVendorEvaluatedNotification = async (
  recipientId: string,
  vendorData: {
    vendorName: string;
    overallScore: number;
    rating: string;
    evaluatedBy: string;
  }
): Promise<string> => {
  return await createNotification({
    recipientId,
    type: NotificationType.INFO,
    priority: NotificationPriority.NORMAL,
    title: 'Vendor Evaluation Completed',
    message: `${vendorData.vendorName} has been evaluated. Overall score: ${vendorData.overallScore.toFixed(1)}/100 (${vendorData.rating}) by ${vendorData.evaluatedBy}`,
    data: vendorData,
    channels: [NotificationChannel.IN_APP],
    category: 'vendor',
    relatedEntityType: 'vendor',
    relatedEntityId: vendorData.vendorName,
  });
};

export const sendEVMAlert = async (
  recipientId: string,
  evmData: {
    projectName: string;
    cpi: number;
    spi: number;
    status: 'overbudget' | 'behind_schedule' | 'both';
  }
): Promise<string> => {
  let message = `Project ${evmData.projectName} EVM Alert: `;

  if (evmData.status === 'overbudget' || evmData.status === 'both') {
    message += `CPI ${evmData.cpi.toFixed(2)} (over budget)`;
  }

  if (evmData.status === 'both') {
    message += ' and ';
  }

  if (evmData.status === 'behind_schedule' || evmData.status === 'both') {
    message += `SPI ${evmData.spi.toFixed(2)} (behind schedule)`;
  }

  return await createNotification({
    recipientId,
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    title: 'EVM Performance Alert',
    message,
    data: evmData,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    category: 'project',
    relatedEntityType: 'project',
    relatedEntityId: evmData.projectName,
  });
};

// ============================================================================
// BATCH NOTIFICATIONS
// ============================================================================

export const sendBatchNotifications = async (
  notifications: CreateNotificationInput[]
): Promise<string[]> => {
  const notificationIds: string[] = [];

  for (const notification of notifications) {
    try {
      const id = await createNotification(notification);
      notificationIds.push(id);
    } catch (error) {
      logger.error('Failed to create notification', error as Error);
    }
  }

  return notificationIds;
};

// ============================================================================
// SCHEDULED NOTIFICATIONS
// ============================================================================

export const processScheduledNotifications = async (): Promise<void> => {
  const now = Timestamp.now();

  const q = query(
    collection(db, 'notifications'),
    where('isSent', '==', false),
    where('scheduledFor', '<=', now)
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const notification = { id: doc.id, ...doc.data() } as Notification;

    try {
      await sendNotificationChannels(notification.id, notification.channels);
    } catch (error) {
      logger.error(`Failed to send scheduled notification ${notification.id}:`, error as Error);
    }
  }
};

// ============================================================================
// CLEANUP
// ============================================================================

export const deleteExpiredNotifications = async (): Promise<number> => {
  const now = Timestamp.now();

  const q = query(collection(db, 'notifications'), where('expiresAt', '<=', now));

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
};

export const deleteOldNotifications = async (daysOld: number): Promise<number> => {
  const cutoffDate = Timestamp.fromMillis(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  const q = query(
    collection(db, 'notifications'),
    where('createdAt', '<=', cutoffDate),
    where('isRead', '==', true)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// ✅ IMPLEMENTATION: Proper HTML email template
export const formatEmailTemplate = (notification: Notification): string => {
  const priorityColors: Record<NotificationPriority, string> = {
    [NotificationPriority.LOW]: '#6c757d',
    [NotificationPriority.NORMAL]: '#0d6efd',
    [NotificationPriority.HIGH]: '#ff9800',
    [NotificationPriority.URGENT]: '#dc3545',
  };

  const typeEmojis: Record<NotificationType, string> = {
    [NotificationType.INFO]: 'ℹ️',
    [NotificationType.SUCCESS]: '✅',
    [NotificationType.WARNING]: '⚠️',
    [NotificationType.ERROR]: '❌',
    [NotificationType.ALERT]: '🔔',
  };

  const priorityColor = priorityColors[notification.priority];
  const typeEmoji = typeEmojis[notification.type];

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .email-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .email-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .priority-badge {
          display: inline-block;
          background: ${priorityColor};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .email-body {
          padding: 30px 20px;
        }
        .message-box {
          background: #f8f9fa;
          border-left: 4px solid ${priorityColor};
          padding: 16px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .message-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .message-content {
          font-size: 14px;
          color: #555;
          white-space: pre-wrap;
        }
        .action-buttons {
          margin: 24px 0;
          text-align: center;
        }
        .action-button {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 4px;
          transition: background 0.3s;
        }
        .action-button:hover {
          background: #5568d3;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 14px;
        }
        .data-table th {
          background: #f1f3f5;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
        }
        .data-table td {
          padding: 10px;
          border-bottom: 1px solid #dee2e6;
        }
        .email-footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
        }
        .timestamp {
          color: #868e96;
          font-size: 12px;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>NataCarePM Notification</h1>
          <span class="priority-badge">${notification.priority} Priority</span>
        </div>
        
        <div class="email-body">
          <div class="message-box">
            <div class="message-title">
              <span>${typeEmoji}</span>
              <span>${notification.title}</span>
            </div>
            <div class="message-content">${notification.message}</div>
          </div>
          
          ${notification.data ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Detail</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(notification.data)
                  .filter(([key]) => !key.startsWith('_') && key !== 'webhookUrl')
                  .map(([key, value]) => `
                    <tr>
                      <td><strong>${key}</strong></td>
                      <td>${typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
                    </tr>
                  `)
                  .join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${notification.actions && notification.actions.length > 0 ? `
            <div class="action-buttons">
              ${notification.actions
                .map(action => `
                  <a href="${action.url}" class="action-button">
                    ${action.label}
                  </a>
                `)
                .join('')}
            </div>
          ` : ''}
          
          <div class="timestamp">
            Sent: ${notification.createdAt.toDate().toLocaleString('id-ID', {
              dateStyle: 'full',
              timeStyle: 'short'
            })}
          </div>
        </div>
        
        <div class="email-footer">
          <p>This is an automated notification from <strong>NataCarePM</strong></p>
          <p>Construction Project Management System</p>
          <p style="margin-top: 12px; font-size: 11px;">
            If you have questions, please contact your project administrator.
          </p>
        </div>
      </div>
    </body>
    </html>
  `.trim();
};

const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    [NotificationType.INFO]: 'ℹ️',
    [NotificationType.SUCCESS]: '✅',
    [NotificationType.WARNING]: '⚠️',
    [NotificationType.ERROR]: '❌',
    [NotificationType.ALERT]: '🔔',
  };

  return icons[type] || 'ℹ️';
};

// Export for use in email templates and notifications
export { getNotificationIcon };
