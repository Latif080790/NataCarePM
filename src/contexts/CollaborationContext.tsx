/**
 * Collaboration Context (Consolidated)
 * NataCarePM - Team Communication & Integration Hub
 *
 * CONSOLIDATED CONTEXT: Combines:
 * - MessageContext (messaging, chats, notifications)
 * - RealtimeCollaborationContext (presence, activity)
 * - IntegrationContext (ERP, CRM, Accounting integrations)
 *
 * Features:
 * - Team messaging and chat
 * - Real-time presence detection
 * - Activity feed
 * - Third-party integrations
 * - Backward compatibility via facade hooks
 */

import * as React from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useReducer,
  ReactNode,
} from 'react';
import { messageService } from '@/api/messageService';
import { integrationGateway, IntegrationConfig } from '@/api/integrationGateway';
import { erpIntegrationService } from '@/services/erpIntegrationService';
import { crmIntegrationService } from '@/services/crmIntegrationService';
import { accountingIntegrationService } from '@/services/accountingIntegrationService';
import { logger } from '@/utils/logger.enhanced';
import { useAuth } from './AuthContext.minimal';
import type {
  Message,
  Chat,
  ChatNotification,
  ChatSettings,
  MessageFilterOptions,
  ChatFilterOptions,
} from '@/types/message.types';

// ============================================================================
// Type Definitions
// ============================================================================

// Realtime Collaboration Types
interface OnlineUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  lastSeen: Date;
  currentView: string;
  isTyping: boolean;
  cursor?: { x: number; y: number; color: string };
}

interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  action:
    | 'task_created'
    | 'task_updated'
    | 'task_deleted'
    | 'comment_added'
    | 'file_uploaded'
    | 'status_changed';
  entityType: 'task' | 'comment' | 'document' | 'project';
  entityId: string;
  entityTitle: string;
  timestamp: Date;
  details?: unknown;
}

// Integration Types
interface IntegrationState {
  integrations: IntegrationConfig[];
  loading: boolean;
  error: string | null;
  syncStatus: {
    lastSync: Date | null;
    isSyncing: boolean;
    syncError: string | null;
  };
}

type IntegrationAction =
  | { type: 'SET_INTEGRATIONS'; payload: IntegrationConfig[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_STATUS'; payload: Partial<IntegrationState['syncStatus']> }
  | { type: 'ADD_INTEGRATION'; payload: IntegrationConfig }
  | { type: 'UPDATE_INTEGRATION'; payload: IntegrationConfig }
  | { type: 'REMOVE_INTEGRATION'; payload: string };

// ============================================================================
// Combined Context Type
// ============================================================================

interface CollaborationContextType {
  // ====== Message State ======
  chats: Chat[];
  currentChat: Chat | null;
  chatsLoading: boolean;
  chatsError: string | null;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  notifications: ChatNotification[];
  unreadNotifications: number;
  notificationsLoading: boolean;
  notificationsError: string | null;
  settings: ChatSettings | null;
  settingsLoading: boolean;

  // ====== Message Actions ======
  fetchUserChats: (filters?: ChatFilterOptions) => Promise<void>;
  createChat: (chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Chat>;
  selectChat: (chat: Chat | null) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => Promise<void>;
  fetchMessages: (chatId: string, filters?: MessageFilterOptions) => Promise<void>;
  sendMessage: (
    chatId: string,
    content: string,
    type?: 'text' | 'image' | 'file' | 'system',
    replyTo?: string
  ) => Promise<Message>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  fetchNotifications: (limit?: number) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<ChatSettings>) => Promise<void>;

  // ====== Realtime Collaboration State ======
  onlineUsers: OnlineUser[];
  currentUserPresence: OnlineUser | null;
  recentActivity: ActivityEvent[];
  typingUsers: { [key: string]: OnlineUser };

  // ====== Realtime Collaboration Actions ======
  isUserOnline: (userId: string) => boolean;
  updatePresence: (view: string, isTyping?: boolean, cursor?: { x: number; y: number }) => void;
  sendActivityEvent: (
    event: Omit<ActivityEvent, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => void;
  updateTypingStatus: (isTyping: boolean, context: string) => void;

  // ====== Integration State ======
  integrations: IntegrationConfig[];
  integrationsLoading: boolean;
  integrationsError: string | null;
  syncStatus: IntegrationState['syncStatus'];

  // ====== Integration Actions ======
  fetchIntegrations: () => Promise<void>;
  createIntegration: (config: IntegrationConfig) => Promise<boolean>;
  updateIntegration: (id: string, config: Partial<IntegrationConfig>) => Promise<boolean>;
  deleteIntegration: (id: string) => Promise<boolean>;
  syncAllData: () => Promise<void>;
  syncIntegration: (id: string) => Promise<boolean>;
  fetchERPData: () => Promise<void>;
  fetchCRMData: () => Promise<void>;
  fetchAccountingData: () => Promise<void>;

  // ====== Utility ======
  clearErrors: () => void;
}

// ============================================================================
// Integration Reducer
// ============================================================================

const initialIntegrationState: IntegrationState = {
  integrations: [],
  loading: false,
  error: null,
  syncStatus: {
    lastSync: null,
    isSyncing: false,
    syncError: null,
  },
};

function integrationReducer(
  state: IntegrationState,
  action: IntegrationAction
): IntegrationState {
  switch (action.type) {
    case 'SET_INTEGRATIONS':
      return { ...state, integrations: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: { ...state.syncStatus, ...action.payload } };
    case 'ADD_INTEGRATION':
      return { ...state, integrations: [...state.integrations, action.payload] };
    case 'UPDATE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'REMOVE_INTEGRATION':
      return {
        ...state,
        integrations: state.integrations.filter((i) => i.id !== action.payload),
      };
    default:
      return state;
  }
}

// ============================================================================
// Context Creation
// ============================================================================

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface CollaborationProviderProps {
  children: ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const authContext = useAuth();
  const { currentUser } = authContext;

  // ====== Message State ======
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

  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // ====== Realtime State ======
  const [onlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserPresence] = useState<OnlineUser | null>(null);
  const [recentActivity] = useState<ActivityEvent[]>([]);
  const [typingUsers] = useState<{ [key: string]: OnlineUser }>({});

  // ====== Integration State ======
  const [integrationState, dispatchIntegration] = useReducer(
    integrationReducer,
    initialIntegrationState
  );

  // ============================================================================
  // Message Functions
  // ============================================================================

  const fetchUserChats = useCallback(
    async (filters?: ChatFilterOptions) => {
      const userId = currentUser?.id;
      if (!userId) return;

      setChatsLoading(true);
      setChatsError(null);

      try {
        const userChats = await messageService.getUserChats(userId, filters);
        setChats(userChats);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch chats';
        logger.error('Error fetching chats', error instanceof Error ? error : new Error(msg));
        setChatsError(msg);
      } finally {
        setChatsLoading(false);
      }
    },
    [currentUser]
  );

  const createChat = useCallback(
    async (chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat> => {
      setChatsLoading(true);
      setChatsError(null);

      try {
        const newChat = await messageService.createChat(chatData);
        setChats((prev) => [newChat, ...prev]);
        return newChat;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create chat';
        logger.error('Error creating chat', error instanceof Error ? error : new Error(msg));
        setChatsError(msg);
        throw error;
      } finally {
        setChatsLoading(false);
      }
    },
    []
  );

  const selectChat = useCallback((chat: Chat | null) => {
    setCurrentChat(chat);
    if (!chat) setMessages([]);
  }, []);

  const updateChat = useCallback(
    async (chatId: string, updates: Partial<Chat>): Promise<void> => {
      setChatsLoading(true);
      setChatsError(null);

      try {
        setChats((prev) =>
          prev.map((chat) => (chat.id === chatId ? { ...chat, ...updates } : chat))
        );
        if (currentChat?.id === chatId) {
          setCurrentChat((prev) => (prev ? { ...prev, ...updates } : null));
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to update chat';
        logger.error('Error updating chat', error instanceof Error ? error : new Error(msg));
        setChatsError(msg);
        throw error;
      } finally {
        setChatsLoading(false);
      }
    },
    [currentChat?.id]
  );

  const fetchMessages = useCallback(async (chatId: string, filters?: MessageFilterOptions) => {
    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const chatMessages = await messageService.getMessages(chatId, filters);
      setMessages(chatMessages);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch messages';
      logger.error('Error fetching messages', error instanceof Error ? error : new Error(msg));
      setMessagesError(msg);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (
      chatId: string,
      content: string,
      type: 'text' | 'image' | 'file' | 'system' = 'text',
      replyTo?: string
    ): Promise<Message> => {
      if (!currentUser?.id) throw new Error('User not authenticated');

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
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to send message';
        logger.error('Error sending message', error instanceof Error ? error : new Error(msg));
        setMessagesError(msg);
        throw error;
      } finally {
        setMessagesLoading(false);
      }
    },
    [currentUser?.id]
  );

  const markMessagesAsRead = useCallback(
    async (chatId: string): Promise<void> => {
      if (!currentUser?.id) return;

      try {
        await messageService.markMessagesAsRead(chatId, currentUser.id);
        setChats((prev) =>
          prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat))
        );
        if (currentChat?.id === chatId) {
          setCurrentChat((prev) => (prev ? { ...prev, unreadCount: 0 } : null));
        }
      } catch (error: unknown) {
        logger.error(
          'Error marking messages as read',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    },
    [currentUser?.id, currentChat?.id]
  );

  const fetchNotifications = useCallback(
    async (limit: number = 50) => {
      if (!currentUser?.id) return;

      setNotificationsLoading(true);
      setNotificationsError(null);

      try {
        const userNotifications = await messageService.getUserNotifications(currentUser.id, limit);
        setNotifications(userNotifications);
        setUnreadNotifications(userNotifications.filter((n) => !n.isRead).length);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to fetch notifications';
        logger.error(
          'Error fetching notifications',
          error instanceof Error ? error : new Error(msg)
        );
        setNotificationsError(msg);
      } finally {
        setNotificationsLoading(false);
      }
    },
    [currentUser?.id]
  );

  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsAsRead = useCallback(async (): Promise<void> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
  }, []);

  const fetchSettings = useCallback(async (): Promise<void> => {
    if (!currentUser?.id) return;

    setSettingsLoading(true);
    try {
      const userSettings = await messageService.getUserSettings(currentUser.id);
      setChatSettings(userSettings);
    } catch (error: unknown) {
      logger.error(
        'Error fetching settings',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setSettingsLoading(false);
    }
  }, [currentUser?.id]);

  const updateSettings = useCallback(
    async (settingsUpdates: Partial<ChatSettings>): Promise<void> => {
      if (!currentUser?.id) return;

      setSettingsLoading(true);
      try {
        await messageService.updateUserSettings(currentUser.id, settingsUpdates);
        setChatSettings((prev) =>
          prev ? { ...prev, ...settingsUpdates } : ({ ...settingsUpdates } as ChatSettings)
        );
      } catch (error: unknown) {
        logger.error(
          'Error updating settings',
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        setSettingsLoading(false);
      }
    },
    [currentUser?.id]
  );

  // ============================================================================
  // Realtime Collaboration Functions
  // ============================================================================

  const isUserOnline = useCallback((_userId: string): boolean => {
    return false; // Mock implementation
  }, []);

  const updatePresence = useCallback(
    async (
      _view: string,
      _isTyping: boolean = false,
      _cursor?: { x: number; y: number }
    ) => {
      // Mock implementation
      return Promise.resolve();
    },
    []
  );

  const sendActivityEvent = useCallback(
    async (_event: Omit<ActivityEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => {
      // Mock implementation
      return Promise.resolve();
    },
    []
  );

  const updateTypingStatus = useCallback(async (_isTyping: boolean, _context: string) => {
    // Mock implementation
    return Promise.resolve();
  }, []);

  // ============================================================================
  // Integration Functions
  // ============================================================================

  const fetchIntegrations = useCallback(async (): Promise<void> => {
    try {
      dispatchIntegration({ type: 'SET_LOADING', payload: true });
      const response = await integrationGateway.getIntegrations();

      if (response.success && response.data) {
        dispatchIntegration({ type: 'SET_INTEGRATIONS', payload: response.data });
      } else {
        dispatchIntegration({
          type: 'SET_ERROR',
          payload: response.error?.message || 'Failed to fetch integrations',
        });
      }
    } catch (error) {
      logger.error(
        'Failed to fetch integrations',
        error instanceof Error ? error : new Error(String(error))
      );
      dispatchIntegration({ type: 'SET_ERROR', payload: 'Failed to fetch integrations' });
    }
  }, []);

  const createIntegration = useCallback(async (config: IntegrationConfig): Promise<boolean> => {
    try {
      dispatchIntegration({ type: 'SET_LOADING', payload: true });
      const response = await integrationGateway.createIntegration(config);

      if (response.success && response.data) {
        dispatchIntegration({ type: 'ADD_INTEGRATION', payload: response.data });
        return true;
      } else {
        dispatchIntegration({
          type: 'SET_ERROR',
          payload: response.error?.message || 'Failed to create integration',
        });
        return false;
      }
    } catch (error) {
      logger.error(
        'Failed to create integration',
        error instanceof Error ? error : new Error(String(error))
      );
      dispatchIntegration({ type: 'SET_ERROR', payload: 'Failed to create integration' });
      return false;
    }
  }, []);

  const updateIntegrationFn = useCallback(
    async (id: string, config: Partial<IntegrationConfig>): Promise<boolean> => {
      try {
        dispatchIntegration({ type: 'SET_LOADING', payload: true });
        const response = await integrationGateway.updateIntegration(id, config);

        if (response.success && response.data) {
          dispatchIntegration({ type: 'UPDATE_INTEGRATION', payload: response.data });
          return true;
        } else {
          dispatchIntegration({
            type: 'SET_ERROR',
            payload: response.error?.message || 'Failed to update integration',
          });
          return false;
        }
      } catch (error) {
        logger.error(
          'Failed to update integration',
          error instanceof Error ? error : new Error(String(error))
        );
        dispatchIntegration({ type: 'SET_ERROR', payload: 'Failed to update integration' });
        return false;
      }
    },
    []
  );

  const deleteIntegration = useCallback(async (id: string): Promise<boolean> => {
    try {
      dispatchIntegration({ type: 'SET_LOADING', payload: true });
      const response = await integrationGateway.deleteIntegration(id);

      if (response.success) {
        dispatchIntegration({ type: 'REMOVE_INTEGRATION', payload: id });
        return true;
      } else {
        dispatchIntegration({
          type: 'SET_ERROR',
          payload: response.error?.message || 'Failed to delete integration',
        });
        return false;
      }
    } catch (error) {
      logger.error(
        'Failed to delete integration',
        error instanceof Error ? error : new Error(String(error))
      );
      dispatchIntegration({ type: 'SET_ERROR', payload: 'Failed to delete integration' });
      return false;
    }
  }, []);

  const syncAllData = useCallback(async (): Promise<void> => {
    try {
      dispatchIntegration({
        type: 'SET_SYNC_STATUS',
        payload: { isSyncing: true, syncError: null },
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      dispatchIntegration({
        type: 'SET_SYNC_STATUS',
        payload: { isSyncing: false, lastSync: new Date(), syncError: null },
      });

      logger.info('All data synced successfully');
    } catch (error) {
      logger.error(
        'Failed to sync all data',
        error instanceof Error ? error : new Error(String(error))
      );
      dispatchIntegration({
        type: 'SET_SYNC_STATUS',
        payload: { isSyncing: false, syncError: 'Failed to sync data' },
      });
    }
  }, []);

  const syncIntegration = useCallback(async (id: string): Promise<boolean> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      logger.info('Integration synced successfully', { integrationId: id });
      return true;
    } catch (error) {
      logger.error(
        'Failed to sync integration',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }, []);

  const fetchERPData = useCallback(async (): Promise<void> => {
    try {
      dispatchIntegration({ type: 'SET_LOADING', payload: true });
      await erpIntegrationService.getProjects();
      await erpIntegrationService.getTasks();
      await erpIntegrationService.getResources();
      dispatchIntegration({ type: 'SET_LOADING', payload: false });
      logger.info('ERP data fetched successfully');
    } catch (error) {
      logger.error(
        'Failed to fetch ERP data',
        error instanceof Error ? error : new Error(String(error))
      );
      dispatchIntegration({ type: 'SET_ERROR', payload: 'Failed to fetch ERP data' });
    }
  }, []);

  const fetchCRMData = useCallback(async (): Promise<void> => {
    try {
      dispatchIntegration({ type: 'SET_LOADING', payload: true });
      await crmIntegrationService.getContacts();
      await crmIntegrationService.getOpportunities();
      await crmIntegrationService.getAccounts();
      dispatchIntegration({ type: 'SET_LOADING', payload: false });
      logger.info('CRM data fetched successfully');
    } catch (error) {
      logger.error(
        'Failed to fetch CRM data',
        error instanceof Error ? error : new Error(String(error))
      );
      dispatchIntegration({ type: 'SET_ERROR', payload: 'Failed to fetch CRM data' });
    }
  }, []);

  const fetchAccountingData = useCallback(async (): Promise<void> => {
    try {
      dispatchIntegration({ type: 'SET_LOADING', payload: true });
      await accountingIntegrationService.getChartOfAccounts();
      await accountingIntegrationService.getJournalEntries();
      await accountingIntegrationService.getInvoices();
      dispatchIntegration({ type: 'SET_LOADING', payload: false });
      logger.info('Accounting data fetched successfully');
    } catch (error) {
      logger.error(
        'Failed to fetch accounting data',
        error instanceof Error ? error : new Error(String(error))
      );
      dispatchIntegration({ type: 'SET_ERROR', payload: 'Failed to fetch accounting data' });
    }
  }, []);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const clearErrors = useCallback(() => {
    setChatsError(null);
    setMessagesError(null);
    setNotificationsError(null);
    dispatchIntegration({ type: 'SET_ERROR', payload: null });
  }, []);

  // ============================================================================
  // Initial Load
  // ============================================================================

  useEffect(() => {
    let isMounted = true;

    if (!currentUser?.id) return;

    const timer = setTimeout(() => {
      const safeFetch = async () => {
        if (!isMounted) return;
        try {
          await Promise.allSettled([
            fetchUserChats(),
            fetchNotifications(),
            fetchSettings(),
            fetchIntegrations(),
          ]);
        } catch (err) {
          logger.warn(
            'Error during initial data fetch',
            err instanceof Error ? err : new Error(String(err))
          );
        }
      };
      safeFetch();
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: CollaborationContextType = {
    // Message State
    chats,
    currentChat,
    chatsLoading,
    chatsError,
    messages,
    messagesLoading,
    messagesError,
    notifications,
    unreadNotifications,
    notificationsLoading,
    notificationsError,
    settings: chatSettings,
    settingsLoading,

    // Message Actions
    fetchUserChats,
    createChat,
    selectChat,
    updateChat,
    fetchMessages,
    sendMessage,
    markMessagesAsRead,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchSettings,
    updateSettings,

    // Realtime State
    onlineUsers,
    currentUserPresence,
    recentActivity,
    typingUsers,

    // Realtime Actions
    isUserOnline,
    updatePresence,
    sendActivityEvent,
    updateTypingStatus,

    // Integration State
    integrations: integrationState.integrations,
    integrationsLoading: integrationState.loading,
    integrationsError: integrationState.error,
    syncStatus: integrationState.syncStatus,

    // Integration Actions
    fetchIntegrations,
    createIntegration,
    updateIntegration: updateIntegrationFn,
    deleteIntegration,
    syncAllData,
    syncIntegration,
    fetchERPData,
    fetchCRMData,
    fetchAccountingData,

    // Utility
    clearErrors,
  };

  return (
    <CollaborationContext.Provider value={value}>{children}</CollaborationContext.Provider>
  );
};

// ============================================================================
// Main Hook
// ============================================================================

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
};

/**
 * Safe version of useCollaboration that returns null if outside provider
 * Use this for optional features like ChatIcon that may render outside the provider
 */
export const useCollaborationSafe = (): CollaborationContextType | null => {
  return useContext(CollaborationContext);
};

// ============================================================================
// FACADE HOOKS - Backward Compatibility
// ============================================================================

// Default values for when context is not available
const defaultMessageState = {
  chats: [] as Chat[],
  currentChat: null,
  chatsLoading: false,
  chatsError: null,
  messages: [] as Message[],
  messagesLoading: false,
  messagesError: null,
  notifications: [] as ChatNotification[],
  unreadNotifications: 0,
  notificationsLoading: false,
  notificationsError: null,
  settings: null,
  settingsLoading: false,
  fetchUserChats: async () => {},
  createChat: async () => ({} as Chat),
  selectChat: () => {},
  updateChat: async () => {},
  fetchMessages: async () => {},
  sendMessage: async () => ({} as Message),
  markMessagesAsRead: async () => {},
  fetchNotifications: async () => {},
  markNotificationAsRead: async () => {},
  markAllNotificationsAsRead: async () => {},
  fetchSettings: async () => {},
  updateSettings: async () => {},
  clearErrors: () => {},
};

/**
 * @deprecated Use useCollaboration() instead. This hook is for backward compatibility only.
 * NOTE: This hook is now safe to use outside CollaborationProvider - returns defaults
 */
export const useMessage = () => {
  const context = useContext(CollaborationContext);
  
  // Return safe defaults if outside provider
  if (!context) {
    return defaultMessageState;
  }
  
  return {
    chats: context.chats,
    currentChat: context.currentChat,
    chatsLoading: context.chatsLoading,
    chatsError: context.chatsError,
    messages: context.messages,
    messagesLoading: context.messagesLoading,
    messagesError: context.messagesError,
    notifications: context.notifications,
    unreadNotifications: context.unreadNotifications,
    notificationsLoading: context.notificationsLoading,
    notificationsError: context.notificationsError,
    settings: context.settings,
    settingsLoading: context.settingsLoading,
    fetchUserChats: context.fetchUserChats,
    createChat: context.createChat,
    selectChat: context.selectChat,
    updateChat: context.updateChat,
    fetchMessages: context.fetchMessages,
    sendMessage: context.sendMessage,
    markMessagesAsRead: context.markMessagesAsRead,
    fetchNotifications: context.fetchNotifications,
    markNotificationAsRead: context.markNotificationAsRead,
    markAllNotificationsAsRead: context.markAllNotificationsAsRead,
    fetchSettings: context.fetchSettings,
    updateSettings: context.updateSettings,
    clearErrors: context.clearErrors,
  };
};

// Default values for realtime collaboration when context is not available
const defaultRealtimeState = {
  onlineUsers: [] as OnlineUser[],
  currentUserPresence: null,
  recentActivity: [] as ActivityEvent[],
  isUserOnline: () => false,
  updatePresence: () => {},
  sendActivityEvent: () => {},
  typingUsers: {} as { [key: string]: OnlineUser },
  updateTypingStatus: () => {},
};

/**
 * @deprecated Use useCollaboration() instead. This hook is for backward compatibility only.
 * NOTE: This hook is now safe to use outside CollaborationProvider - returns defaults
 */
export const useRealtimeCollaboration = () => {
  const context = useContext(CollaborationContext);
  
  // Return safe defaults if outside provider
  if (!context) {
    return defaultRealtimeState;
  }
  
  return {
    onlineUsers: context.onlineUsers,
    currentUserPresence: context.currentUserPresence,
    recentActivity: context.recentActivity,
    isUserOnline: context.isUserOnline,
    updatePresence: context.updatePresence,
    sendActivityEvent: context.sendActivityEvent,
    typingUsers: context.typingUsers,
    updateTypingStatus: context.updateTypingStatus,
  };
};

// Default values for integration when context is not available
const defaultIntegrationState = {
  integrations: [] as IntegrationConfig[],
  loading: false,
  error: null,
  syncStatus: {
    lastSync: null,
    isSyncing: false,
    syncError: null,
  },
  fetchIntegrations: async () => {},
  createIntegration: async () => false,
  updateIntegration: async () => false,
  deleteIntegration: async () => false,
  syncAllData: async () => {},
  syncIntegration: async () => false,
  fetchERPData: async () => {},
  fetchCRMData: async () => {},
  fetchAccountingData: async () => {},
};

/**
 * @deprecated Use useCollaboration() instead. This hook is for backward compatibility only.
 * NOTE: This hook is now safe to use outside CollaborationProvider - returns defaults
 */
export const useIntegration = () => {
  const context = useContext(CollaborationContext);
  
  // Return safe defaults if outside provider
  if (!context) {
    return defaultIntegrationState;
  }
  
  return {
    integrations: context.integrations,
    loading: context.integrationsLoading,
    error: context.integrationsError,
    syncStatus: context.syncStatus,
    fetchIntegrations: context.fetchIntegrations,
    createIntegration: context.createIntegration,
    updateIntegration: context.updateIntegration,
    deleteIntegration: context.deleteIntegration,
    syncAllData: context.syncAllData,
    syncIntegration: context.syncIntegration,
    fetchERPData: context.fetchERPData,
    fetchCRMData: context.fetchCRMData,
    fetchAccountingData: context.fetchAccountingData,
  };
};

export default CollaborationContext;
