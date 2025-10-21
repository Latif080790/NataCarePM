import React, { useState, useCallback, createContext, useContext } from 'react';

// Mock implementation for realtime collaboration
interface OnlineUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  lastSeen: Date;
  currentView: string;
  isTyping: boolean;
  cursor?: {
    x: number;
    y: number;
    color: string;
  };
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
  details?: any;
}

interface RealtimeCollaborationContextType {
  onlineUsers: OnlineUser[];
  currentUserPresence: OnlineUser | null;
  recentActivity: ActivityEvent[];
  isUserOnline: (userId: string) => boolean;
  updatePresence: (view: string, isTyping?: boolean, cursor?: { x: number; y: number }) => void;
  sendActivityEvent: (
    event: Omit<ActivityEvent, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => void;
  typingUsers: { [key: string]: OnlineUser };
  updateTypingStatus: (isTyping: boolean, context: string) => void;
}

const RealtimeCollaborationContext = createContext<RealtimeCollaborationContextType | undefined>(
  undefined
);

export const useRealtimeCollaboration = () => {
  const context = useContext(RealtimeCollaborationContext);
  if (context === undefined) {
    throw new Error('useRealtimeCollaboration must be used within a RealtimeCollaborationProvider');
  }
  return context;
};

interface RealtimeCollaborationProviderProps {
  children: React.ReactNode;
}

export const RealtimeCollaborationProvider = ({ children }: RealtimeCollaborationProviderProps) => {
  const [onlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserPresence] = useState<OnlineUser | null>(null);
  const [recentActivity] = useState<ActivityEvent[]>([]);
  const [typingUsers] = useState<{ [key: string]: OnlineUser }>({});

  // Mock implementations
  const isUserOnline = useCallback((_userId: string): boolean => {
    return false; // Mock implementation
  }, []);

  const updatePresence = useCallback(
    async (_view: string, _isTyping: boolean = false, _cursor?: { x: number; y: number }) => {
      // Mock implementation
      console.log('Updating presence (mock)');
    },
    []
  );

  const sendActivityEvent = useCallback(
    async (_event: Omit<ActivityEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => {
      // Mock implementation
      console.log('Sending activity event (mock)');
    },
    []
  );

  const updateTypingStatus = useCallback(async (_isTyping: boolean, _context: string) => {
    // Mock implementation
    console.log('Updating typing status (mock)');
  }, []);

  const value: RealtimeCollaborationContextType = {
    onlineUsers,
    currentUserPresence,
    recentActivity,
    isUserOnline,
    updatePresence,
    sendActivityEvent,
    typingUsers,
    updateTypingStatus,
  };

  return (
    <RealtimeCollaborationContext.Provider value={value}>
      {children}
    </RealtimeCollaborationContext.Provider>
  );
};
