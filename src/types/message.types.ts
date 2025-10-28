/**
 * Message and Chat Type Definitions
 * Team Communication System
 *
 * Types for real-time messaging, chat rooms, and team communication
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read';
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: string; // Message ID this message is replying to
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'other';
  size: number; // in bytes
  uploadedAt: Date;
}

export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  name?: string; // For group chats
  type: 'direct' | 'group' | 'project' | 'team';
  participants: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
}

export interface DirectChat extends Chat {
  type: 'direct';
  participants: [string, string]; // Exactly two users
}

export interface GroupChat extends Chat {
  type: 'group';
  name: string;
  description?: string;
  createdBy: string;
  admins: string[];
}

export interface ProjectChat extends Chat {
  type: 'project';
  projectId: string;
  projectName: string;
}

export interface TeamChat extends Chat {
  type: 'team';
  teamId: string;
  teamName: string;
}

export interface ChatMessage extends Message {
  chatId: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  chatId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface MessageFilterOptions {
  chatId?: string;
  senderId?: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface ChatFilterOptions {
  userId?: string;
  chatType?: 'direct' | 'group' | 'project' | 'team';
  searchQuery?: string;
  includeArchived?: boolean;
}

export interface MessageStatistics {
  totalMessages: number;
  messagesByType: {
    text: number;
    image: number;
    file: number;
    system: number;
  };
  messagesByUser: {
    userId: string;
    userName: string;
    messageCount: number;
  }[];
  dailyMessageCount: {
    date: Date;
    count: number;
  }[];
}

export interface ChatNotification {
  id: string;
  userId: string;
  chatId: string;
  messageId: string;
  type: 'message' | 'mention' | 'reaction';
  isRead: boolean;
  createdAt: Date;
}

export interface ChatSettings {
  userId: string;
  enableNotifications: boolean;
  notificationSound: boolean;
  messagePreview: boolean;
  enterToSend: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default Message;