/**
 * Messaging Service
 * Team Communication System
 *
 * Service for handling real-time messaging, chat rooms, and team communication
 * Uses Firebase Firestore for persistence and Firebase Realtime Database for real-time updates
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
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type {
  Message,
  Chat,
  User,
  MessageFilterOptions,
  ChatFilterOptions,
  ChatNotification,
  ChatSettings,
} from '@/types/message.types';
import { logger } from '@/utils/logger.enhanced';

// Collection references
const MESSAGES_COLLECTION = 'messages';
const CHATS_COLLECTION = 'chats';
const USERS_COLLECTION = 'users';
const TYPING_INDICATORS_COLLECTION = 'typingIndicators';
const NOTIFICATIONS_COLLECTION = 'chatNotifications';
const SETTINGS_COLLECTION = 'chatSettings';

class MessageService {
  /**
   * Send a new message
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'system' = 'text',
    replyTo?: string
  ): Promise<Message> {
    try {
      const messageData: Omit<Message, 'id'> = {
        chatId,
        senderId,
        senderName: await this.getUserName(senderId),
        content,
        timestamp: new Date(),
        type,
        status: 'sent',
        replyTo,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
        ...messageData,
        timestamp: serverTimestamp(),
      });

      // Update chat last message
      await this.updateChatLastMessage(chatId, {
        ...messageData,
        id: docRef.id,
        timestamp: new Date(),
      } as Message);

      // Send notification
      await this.sendNotification({
        userId: senderId,
        chatId,
        messageId: docRef.id,
        type: 'message',
        isRead: false,
      });

      const message: Message = {
        ...messageData,
        id: docRef.id,
        timestamp: new Date(),
      };

      logger.info('Message sent successfully', { messageId: docRef.id, chatId, senderId });
      return message;
    } catch (error) {
      logger.error('Failed to send message', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string, filters?: MessageFilterOptions): Promise<Message[]> {
    try {
      let q = query(
        collection(db, MESSAGES_COLLECTION),
        where('chatId', '==', chatId),
        orderBy('timestamp', 'asc')
      );

      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }

      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Message);
      }

      logger.info('Messages fetched successfully', { chatId, count: messages.length });
      return messages;
    } catch (error) {
      logger.error('Failed to fetch messages', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Create a new chat
   */
  async createChat(chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat> {
    try {
      const newChat: Omit<Chat, 'id'> = {
        ...chatData,
        createdAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 0,
        isArchived: false,
        isMuted: false,
      };

      const docRef = await addDoc(collection(db, CHATS_COLLECTION), {
        ...newChat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const chat: Chat = {
        ...newChat,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.info('Chat created successfully', { chatId: docRef.id });
      return chat;
    } catch (error) {
      logger.error('Failed to create chat', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to create chat');
    }
  }

  /**
   * Get user's chats
   */
  async getUserChats(userId: string, filters?: ChatFilterOptions): Promise<Chat[]> {
    try {
      // Get chats where user is a participant
      const q = query(
        collection(db, CHATS_COLLECTION),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const chats: Chat[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        chats.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Chat);
      }

      logger.info('User chats fetched successfully', { userId, count: chats.length });
      return chats;
    } catch (error) {
      logger.error('Failed to fetch user chats', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to fetch user chats');
    }
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const docRef = doc(db, CHATS_COLLECTION, chatId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const chat: Chat = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Chat;

      logger.info('Chat fetched successfully', { chatId });
      return chat;
    } catch (error) {
      logger.error('Failed to fetch chat', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to fetch chat');
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Update chat unread count
      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      await updateDoc(chatRef, {
        [`unreadCount_${userId}`]: 0,
        updatedAt: serverTimestamp(),
      });

      // Update notifications as read
      const notificationsQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('chatId', '==', chatId),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const notificationsSnapshot = await getDocs(notificationsQuery);
      const batchUpdates = notificationsSnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(batchUpdates);

      logger.info('Messages marked as read', { chatId, userId });
    } catch (error) {
      logger.error('Failed to mark messages as read', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Send notification
   */
  async sendNotification(notificationData: Omit<ChatNotification, 'id' | 'createdAt'>): Promise<ChatNotification> {
    try {
      const newNotification: Omit<ChatNotification, 'id'> = {
        ...notificationData,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...newNotification,
        createdAt: serverTimestamp(),
      });

      const notification: ChatNotification = {
        ...newNotification,
        id: docRef.id,
        createdAt: new Date(),
      };

      logger.info('Notification sent successfully', { notificationId: docRef.id });
      return notification;
    } catch (error) {
      logger.error('Failed to send notification', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to send notification');
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limitCount: number = 50): Promise<ChatNotification[]> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications: ChatNotification[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as ChatNotification);
      }

      logger.info('User notifications fetched successfully', { userId, count: notifications.length });
      return notifications;
    } catch (error) {
      logger.error('Failed to fetch user notifications', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to fetch user notifications');
    }
  }

  /**
   * Get user chat settings
   */
  async getUserSettings(userId: string): Promise<ChatSettings> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Return default settings
        const defaultSettings: ChatSettings = {
          userId,
          enableNotifications: true,
          notificationSound: true,
          messagePreview: true,
          enterToSend: true,
          theme: 'system',
        };
        return defaultSettings;
      }

      const settings = docSnap.data() as ChatSettings;
      logger.info('User settings fetched successfully', { userId });
      return settings;
    } catch (error) {
      logger.error('Failed to fetch user settings', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to fetch user settings');
    }
  }

  /**
   * Update user chat settings
   */
  async updateUserSettings(userId: string, settings: Partial<ChatSettings>): Promise<void> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, userId);
      await updateDoc(docRef, settings);

      logger.info('User settings updated successfully', { userId });
    } catch (error) {
      logger.error('Failed to update user settings', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to update user settings');
    }
  }

  /**
   * Helper method to get user name
   */
  private async getUserName(userId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        return userData.name;
      }
      return 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  }

  /**
   * Helper method to update chat last message
   */
  private async updateChatLastMessage(chatId: string, message: Message): Promise<void> {
    try {
      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      await updateDoc(chatRef, {
        lastMessage: message,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Failed to update chat last message', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();
export default messageService;