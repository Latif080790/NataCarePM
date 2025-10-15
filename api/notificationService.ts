import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
  NotificationChannel,
  NotificationPriority,
  NotificationType
} from '../types/automation';

// ============================================================================
// NOTIFICATION MANAGEMENT
// ============================================================================

export const createNotification = async (
  input: CreateNotificationInput
): Promise<string> => {
  // Initialize delivery status for each channel
  const deliveryStatus: Record<NotificationChannel, { sent: boolean; sentAt?: Timestamp; error?: string }> = {
    [NotificationChannel.IN_APP]: { sent: false },
    [NotificationChannel.EMAIL]: { sent: false },
    [NotificationChannel.SMS]: { sent: false },
    [NotificationChannel.PUSH]: { sent: false },
    [NotificationChannel.WEBHOOK]: { sent: false }
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
    createdAt: Timestamp.now()
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
    firestoreLimit(limitCount)
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
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Notification));
};

export const getNotificationById = async (notificationId: string): Promise<Notification | null> => {
  const docRef = doc(db, 'notifications', notificationId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as Notification;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, {
    isRead: true,
    readAt: Timestamp.now()
  });
};

export const markMultipleAsRead = async (notificationIds: string[]): Promise<void> => {
  const batch = writeBatch(db);
  
  notificationIds.forEach(id => {
    const docRef = doc(db, 'notifications', id);
    batch.update(docRef, {
      isRead: true,
      readAt: Timestamp.now()
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

  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      isRead: true,
      readAt: Timestamp.now()
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
  
  notificationIds.forEach(id => {
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

export const getNotificationCounts = async (userId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}> => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map(doc => doc.data() as Notification);

  const byType: Record<NotificationType, number> = {
    info: 0,
    success: 0,
    warning: 0,
    error: 0,
    alert: 0
  };

  const byPriority: Record<NotificationPriority, number> = {
    low: 0,
    normal: 0,
    high: 0,
    urgent: 0
  };

  let unread = 0;

  notifications.forEach(notification => {
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
    byPriority
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
        sentAt: Timestamp.now()
      };
    } catch (error: any) {
      deliveryStatus[channel] = {
        sent: false,
        error: error.message
      };
    }
  }

  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, {
    isSent: true,
    sentAt: Timestamp.now(),
    deliveryStatus
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

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log('Email notification:', {
    to: notification.recipientEmail,
    subject: notification.title,
    body: notification.message,
    priority: notification.priority
  });

  // Placeholder for actual email sending
  // await emailService.send({
  //   to: notification.recipientEmail,
  //   subject: notification.title,
  //   html: formatEmailTemplate(notification),
  //   priority: notification.priority
  // });
};

const sendSMS = async (notification: Notification): Promise<void> => {
  if (!notification.recipientPhone) {
    throw new Error('Recipient phone not provided');
  }

  // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  console.log('SMS notification:', {
    to: notification.recipientPhone,
    message: notification.message
  });

  // Placeholder for actual SMS sending
  // await smsService.send({
  //   to: notification.recipientPhone,
  //   message: `${notification.title}: ${notification.message}`
  // });
};

const sendPushNotification = async (notification: Notification): Promise<void> => {
  // TODO: Integrate with push notification service (Firebase Cloud Messaging, etc.)
  console.log('Push notification:', {
    recipientId: notification.recipientId,
    title: notification.title,
    body: notification.message,
    data: notification.data
  });

  // Placeholder for actual push notification
  // await pushService.send({
  //   userId: notification.recipientId,
  //   notification: {
  //     title: notification.title,
  //     body: notification.message,
  //     icon: getNotificationIcon(notification.type),
  //     badge: await getUnreadCount(notification.recipientId)
  //   },
  //   data: notification.data
  // });
};

const sendWebhook = async (notification: Notification): Promise<void> => {
  // TODO: Get webhook URL from user preferences
  const webhookUrl = notification.data?.webhookUrl;
  
  if (!webhookUrl) {
    throw new Error('Webhook URL not provided');
  }

  console.log('Webhook notification:', {
    url: webhookUrl,
    notification
  });

  // Placeholder for actual webhook call
  // await fetch(webhookUrl, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     type: notification.type,
  //     priority: notification.priority,
  //     title: notification.title,
  //     message: notification.message,
  //     data: notification.data,
  //     timestamp: notification.createdAt.toDate().toISOString()
  //   })
  // });
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
    relatedEntityId: poData.poNumber
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
    relatedEntityId: grData.grNumber
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
    relatedEntityId: mrData.mrNumber
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
        style: 'primary'
      },
      {
        label: 'Review Budget',
        action: 'navigate',
        url: `/finance/budget/${budgetData.wbsCode}`,
        style: 'secondary'
      }
    ]
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
        style: 'primary'
      },
      {
        label: 'View Material',
        action: 'navigate',
        url: `/inventory/${stockData.materialCode}`,
        style: 'secondary'
      }
    ]
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
    relatedEntityId: vendorData.vendorName
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
    relatedEntityId: evmData.projectName
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
      console.error('Failed to create notification:', error);
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
      console.error(`Failed to send scheduled notification ${notification.id}:`, error);
    }
  }
};

// ============================================================================
// CLEANUP
// ============================================================================

export const deleteExpiredNotifications = async (): Promise<number> => {
  const now = Timestamp.now();
  
  const q = query(
    collection(db, 'notifications'),
    where('expiresAt', '<=', now)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
};

export const deleteOldNotifications = async (daysOld: number): Promise<number> => {
  const cutoffDate = Timestamp.fromMillis(
    Date.now() - (daysOld * 24 * 60 * 60 * 1000)
  );
  
  const q = query(
    collection(db, 'notifications'),
    where('createdAt', '<=', cutoffDate),
    where('isRead', '==', true)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
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
    minimumFractionDigits: 0
  }).format(amount);
};

const formatEmailTemplate = (notification: Notification): string => {
  // TODO: Implement proper email template
  return `
    <html>
      <body>
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        ${notification.actions ? `
          <div>
            ${notification.actions.map(action => `
              <a href="${action.url}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                ${action.label}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </body>
    </html>
  `;
};

const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    alert: '🔔'
  };
  
  return icons[type] || 'ℹ️';
};
