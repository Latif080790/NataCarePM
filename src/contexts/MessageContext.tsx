/**
 * Message Context
 * Team Communication System
 *
 * Provides global state management for messaging and chat functionality
 */

import * as React from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { messageService } from '@/api/messageService';
import type {
  Message,
  Chat,
  ChatNotification,
  ChatSettings,
  MessageFilterOptions,
  ChatFilterOptions,
} from '@/types/message.types';
import { useAuth } from './AuthContext';

/**
 * Message Context State Interface
 */
interface MessageContextState {
  // Chats
  chats: Chat[];
  currentChat: Chat | null;
  chatsLoading: boolean;
  chatsError: string | null;

  // Messages
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;

  // Notifications
  notifications: ChatNotification[];
  unreadNotifications: number;
  notificationsLoading: boolean;
  notificationsError: string | null;

  // Settings
  settings: ChatSettings | null;
  settingsLoading: boolean;

  // Actions - Chats
  fetchUserChats: (filters?: ChatFilterOptions) => Promise<void>;
  createChat: (chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Chat>;
  selectChat: (chat: Chat | null) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => Promise<void>;

  // Actions - Messages
  fetchMessages: (chatId: string, filters?: MessageFilterOptions) => Promise<void>;
  sendMessage: (
    chatId: string,
    content: string,
    type?: 'text' | 'image' | 'file' | 'system',
    replyTo?: string
  ) => Promise<Message>;
  markMessagesAsRead: (chatId: string) => Promise<void>;

  // Actions - Notifications
  fetchNotifications: (limit?: number) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Actions - Settings
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<ChatSettings>) => Promise<void>;

  // Utility
  clearErrors: () => void;
}

/**
 * Create Context
 */
const MessageContext = createContext<MessageContextState | undefined>(undefined);

/**
 * Message Provider Props
 */
interface MessageProviderProps {
  children: ReactNode;
}

/**
 * Message Provider Component
 */
export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  /**
   * Fetch user chats
   */
  const fetchUserChats = useCallback(async (filters?: ChatFilterOptions) => {
    if (!currentUser?.id) return;

    setChatsLoading(true);
    setChatsError(null);

    try {
      const userChats = await messageService.getUserChats(currentUser.id, filters);
      setChats(userChats);
    } catch (error: any) {
      console.error('[MessageContext] Error fetching chats:', error);
      setChatsError(error.message || 'Failed to fetch chats');
    } finally {
      setChatsLoading(false);
    }
  }, [currentUser?.id]);

  /**
   * Create new chat
   */
  const createChat = useCallback(
    async (chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat> => {
      setChatsLoading(true);
      setChatsError(null);

      try {
        const newChat = await messageService.createChat(chatData);
        setChats((prev) => [newChat, ...prev]);
        return newChat;
      } catch (error: any) {
        console.error('[MessageContext] Error creating chat:', error);
        setChatsError(error.message || 'Failed to create chat');
        throw error;
      } finally {
        setChatsLoading(false);
      }
    },
    []
  );

  /**
   * Select chat
   */
  const selectChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
    // Clear messages when changing chats
    if (!chat) {
      setMessages([]);
    }
  }, []);

  /**
   * Update chat
   */
  const updateChat = useCallback(async (chatId: string, updates: Partial<Chat>): Promise<void> => {
    setChatsLoading(true);
    setChatsError(null);

    try {
      // In a real implementation, we would call an update service method
      // For now, we'll just update the local state
      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, ...updates } : chat))
      );
      
      if (currentChat?.id === chatId) {
        setCurrentChat((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } catch (error: any) {
      console.error('[MessageContext] Error updating chat:', error);
      setChatsError(error.message || 'Failed to update chat');
      throw error;
    } finally {
      setChatsLoading(false);
    }
  }, [currentChat?.id]);

  /**
   * Fetch messages for a chat
   */
  const fetchMessages = useCallback(
    async (chatId: string, filters?: MessageFilterOptions) => {
      setMessagesLoading(true);
      setMessagesError(null);

      try {
        const chatMessages = await messageService.getMessages(chatId, filters);
        setMessages(chatMessages);
      } catch (error: any) {
        console.error('[MessageContext] Error fetching messages:', error);
        setMessagesError(error.message || 'Failed to fetch messages');
      } finally {
        setMessagesLoading(false);
      }
    },
    []
  );

  /**
   * Send message
   */
  const sendMessage = useCallback(
    async (
      chatId: string,
      content: string,
      type: 'text' | 'image' | 'file' | 'system' = 'text',
      replyTo?: string
    ): Promise<Message> => {
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      setMessagesLoading(true);
      setMessagesError(null);

      try {
        const newMessage = await messageService.sendMessage(
          chatId,
          currentUser.id,
          content,
          type,
          replyTo
        );

        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
      } catch (error: any) {
        console.error('[MessageContext] Error sending message:', error);
        setMessagesError(error.message || 'Failed to send message');
        throw error;
      } finally {
        setMessagesLoading(false);
      }
    },
    [currentUser?.id]
  );

  /**
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback(
    async (chatId: string): Promise<void> => {
      if (!currentUser?.id) return;

      try {
        await messageService.markMessagesAsRead(chatId, currentUser.id);
        
        // Update local state
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
        
        if (currentChat?.id === chatId) {
          setCurrentChat((prev) => (prev ? { ...prev, unreadCount: 0 } : null));
        }
      } catch (error: any) {
        console.error('[MessageContext] Error marking messages as read:', error);
      }
    },
    [currentUser?.id, currentChat?.id]
  );

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async (limit: number = 50) => {
    if (!currentUser?.id) return;

    setNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const userNotifications = await messageService.getUserNotifications(currentUser.id, limit);
      setNotifications(userNotifications);
      setUnreadNotifications(userNotifications.filter((n) => !n.isRead).length);
    } catch (error: any) {
      console.error('[MessageContext] Error fetching notifications:', error);
      setNotificationsError(error.message || 'Failed to fetch notifications');
    } finally {
      setNotificationsLoading(false);
    }
  }, [currentUser?.id]);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('[MessageContext] Error marking notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsAsRead = useCallback(async (): Promise<void> => {
    try {
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadNotifications(0);
    } catch (error: any) {
      console.error('[MessageContext] Error marking all notifications as read:', error);
    }
  }, []);

  /**
   * Fetch settings
   */
  const fetchSettings = useCallback(async (): Promise<void> => {
    if (!currentUser?.id) return;

    setSettingsLoading(true);

    try {
      const userSettings = await messageService.getUserSettings(currentUser.id);
      setSettings(userSettings);
    } catch (error: any) {
      console.error('[MessageContext] Error fetching settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, [currentUser?.id]);

  /**
   * Update settings
   */
  const updateSettings = useCallback(
    async (settingsUpdates: Partial<ChatSettings>): Promise<void> => {
      if (!currentUser?.id) return;

      setSettingsLoading(true);

      try {
        await messageService.updateUserSettings(currentUser.id, settingsUpdates);
        
        setSettings((prev) =>
          prev ? { ...prev, ...settingsUpdates } : { ...settingsUpdates } as ChatSettings
        );
      } catch (error: any) {
        console.error('[MessageContext] Error updating settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    },
    [currentUser?.id]
  );

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setChatsError(null);
    setMessagesError(null);
    setNotificationsError(null);
  }, []);

  /**
   * Initial load - ONLY after auth is ready
   */
  useEffect(() => {
    // Wait for auth to be ready before fetching data
    if (!currentUser?.id) {
      return;
    }

    // Add small delay to ensure Firebase Auth is fully initialized
    const timer = setTimeout(() => {
      fetchUserChats().catch(err => {
        console.warn('[MessageContext] Failed to fetch chats on init:', err);
      });
      fetchNotifications().catch(err => {
        console.warn('[MessageContext] Failed to fetch notifications on init:', err);
      });
      fetchSettings().catch(err => {
        console.warn('[MessageContext] Failed to fetch settings on init:', err);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [currentUser?.id]); // Remove function dependencies to prevent infinite loop

  /**
   * Context value
   */
  const value: MessageContextState = {
    // Chats
    chats,
    currentChat,
    chatsLoading,
    chatsError,

    // Messages
    messages,
    messagesLoading,
    messagesError,

    // Notifications
    notifications,
    unreadNotifications,
    notificationsLoading,
    notificationsError,

    // Settings
    settings,
    settingsLoading,

    // Actions - Chats
    fetchUserChats,
    createChat,
    selectChat,
    updateChat,

    // Actions - Messages
    fetchMessages,
    sendMessage,
    markMessagesAsRead,

    // Actions - Notifications
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,

    // Actions - Settings
    fetchSettings,
    updateSettings,

    // Utility
    clearErrors,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

/**
 * Custom hook to use Message Context
 */
export const useMessage = (): MessageContextState => {
  const context = useContext(MessageContext);

  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }

  return context;
};

export default MessageContext;
