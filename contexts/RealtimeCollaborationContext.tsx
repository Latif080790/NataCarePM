import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';
import { onSnapshot, doc, collection, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
    action: 'task_created' | 'task_updated' | 'task_deleted' | 'comment_added' | 'file_uploaded' | 'status_changed';
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
    sendActivityEvent: (event: Omit<ActivityEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => void;
    typingUsers: { [key: string]: OnlineUser };
    updateTypingStatus: (isTyping: boolean, context: string) => void;
}

const RealtimeCollaborationContext = createContext<RealtimeCollaborationContextType | undefined>(undefined);

export const useRealtimeCollaboration = () => {
    const context = useContext(RealtimeCollaborationContext);
    if (context === undefined) {
        throw new Error('useRealtimeCollaboration must be used within a RealtimeCollaborationProvider');
    }
    return context;
};

interface RealtimeCollaborationProviderProps {
    children: ReactNode;
}

// Color palette for user cursors
const userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECCA7',
    '#F38BA8', '#A8DADC', '#457B9D', '#F1FAEE', '#E63946',
    '#2A9D8F', '#264653', '#F4A261', '#E76F51', '#E9C46A'
];

export const RealtimeCollaborationProvider: React.FC<RealtimeCollaborationProviderProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const { currentProject } = useProject();
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [currentUserPresence, setCurrentUserPresence] = useState<OnlineUser | null>(null);
    const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
    const [typingUsers, setTypingUsers] = useState<{ [key: string]: OnlineUser }>({});

    // Generate consistent color for user
    const getUserColor = (userId: string): string => {
        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return userColors[Math.abs(hash) % userColors.length];
    };

    // Update user presence
    const updatePresence = async (view: string, isTyping: boolean = false, cursor?: { x: number; y: number }) => {
        if (!currentUser || !currentProject) return;

        const presenceData: Partial<OnlineUser> = {
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || currentUser.email || 'Anonymous',
            lastSeen: new Date(),
            currentView: view,
            isTyping,
            cursor: cursor ? {
                ...cursor,
                color: getUserColor(currentUser.uid)
            } : undefined
        };

        try {
            const presenceRef = doc(db, 'projects', currentProject.id, 'presence', currentUser.uid);
            await setDoc(presenceRef, {
                ...presenceData,
                lastSeen: serverTimestamp()
            }, { merge: true });

            setCurrentUserPresence(presenceData as OnlineUser);
        } catch (error) {
            console.error('Error updating presence:', error);
        }
    };

    // Send activity event
    const sendActivityEvent = async (event: Omit<ActivityEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => {
        if (!currentUser || !currentProject) return;

        const activityData: Omit<ActivityEvent, 'id'> = {
            ...event,
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email || 'Anonymous',
            timestamp: new Date()
        };

        try {
            const activityRef = doc(collection(db, 'projects', currentProject.id, 'activity'));
            await setDoc(activityRef, {
                ...activityData,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending activity event:', error);
        }
    };

    // Update typing status
    const updateTypingStatus = (isTyping: boolean, context: string) => {
        if (!currentUser || !currentProject) return;

        updatePresence(context, isTyping);

        // Clear typing status after 3 seconds of inactivity
        if (isTyping) {
            setTimeout(() => {
                updatePresence(context, false);
            }, 3000);
        }
    };

    // Check if user is online
    const isUserOnline = (userId: string): boolean => {
        const user = onlineUsers.find(u => u.id === userId);
        if (!user) return false;
        
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return user.lastSeen > fiveMinutesAgo;
    };

    // Listen to online users
    useEffect(() => {
        if (!currentProject || !currentUser) return;

        const presenceQuery = collection(db, 'projects', currentProject.id, 'presence');
        const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
            const users: OnlineUser[] = [];
            const typing: { [key: string]: OnlineUser } = {};

            snapshot.forEach((doc) => {
                const data = doc.data();
                const user: OnlineUser = {
                    id: doc.id,
                    email: data.email,
                    displayName: data.displayName,
                    avatar: data.avatar,
                    lastSeen: data.lastSeen?.toDate() || new Date(),
                    currentView: data.currentView || '',
                    isTyping: data.isTyping || false,
                    cursor: data.cursor
                };

                users.push(user);

                if (user.isTyping && user.id !== currentUser.uid) {
                    typing[user.id] = user;
                }
            });

            setOnlineUsers(users);
            setTypingUsers(typing);
        });

        return () => unsubscribe();
    }, [currentProject, currentUser]);

    // Listen to activity feed
    useEffect(() => {
        if (!currentProject) return;

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const activityQuery = query(
            collection(db, 'projects', currentProject.id, 'activity'),
            where('timestamp', '>=', twentyFourHoursAgo)
        );

        const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
            const activities: ActivityEvent[] = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                activities.push({
                    id: doc.id,
                    userId: data.userId,
                    userName: data.userName,
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    entityTitle: data.entityTitle,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    details: data.details
                });
            });

            // Sort by timestamp (newest first)
            activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setRecentActivity(activities.slice(0, 50)); // Keep only latest 50 activities
        });

        return () => unsubscribe();
    }, [currentProject]);

    // Set initial presence when component mounts
    useEffect(() => {
        if (currentUser && currentProject) {
            updatePresence('dashboard');
        }
    }, [currentUser, currentProject]);

    // Clean up presence when user leaves
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (currentUser && currentProject) {
                try {
                    const presenceRef = doc(db, 'projects', currentProject.id, 'presence', currentUser.uid);
                    await deleteDoc(presenceRef);
                } catch (error) {
                    console.error('Error cleaning up presence:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleBeforeUnload();
        };
    }, [currentUser, currentProject]);

    // Update presence periodically to maintain "online" status
    useEffect(() => {
        if (!currentUser || !currentProject) return;

        const interval = setInterval(() => {
            updatePresence(currentUserPresence?.currentView || 'dashboard', false);
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [currentUser, currentProject, currentUserPresence?.currentView]);

    const value: RealtimeCollaborationContextType = {
        onlineUsers,
        currentUserPresence,
        recentActivity,
        isUserOnline,
        updatePresence,
        sendActivityEvent,
        typingUsers,
        updateTypingStatus
    };

    return (
        <RealtimeCollaborationContext.Provider value={value}>
            {children}
        </RealtimeCollaborationContext.Provider>
    );
};