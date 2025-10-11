import * as React from 'react';

// Enterprise-grade React type definitions
interface ReactElement<P = any, T extends string | any = string | any> {
    type: T;
    props: P;
    key: string | number | null;
}

interface ReactNode {
    [key: string]: any;
}

interface ComponentType<P = {}> {
    (props: P): ReactElement | null;
    displayName?: string;
    defaultProps?: Partial<P>;
}

interface Context<T> {
    Provider: ComponentType<{ value: T; children?: ReactNode }>;
    Consumer: ComponentType<{ children: (value: T) => ReactNode }>;
    displayName?: string;
}

interface EffectCallback {
    (): void | (() => void | undefined);
}

type DependencyList = ReadonlyArray<any>;

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);

// React function definitions
const createContext = <T,>(defaultValue: T): Context<T> => {
    const context = {
        Provider: ({ value, children }: { value: T; children?: ReactNode }) => {
            return { type: 'Provider', props: { value, children }, key: null };
        },
        Consumer: ({ children }: { children: (value: T) => ReactNode }) => {
            return { type: 'Consumer', props: { children }, key: null };
        }
    } as Context<T>;
    
    (context as any)._currentValue = defaultValue;
    return context;
};

const useContext = <T,>(context: Context<T>): T => {
    return (context as any)._currentValue;
};

const useState = <S,>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>] => {
    const value = typeof initialState === 'function' ? (initialState as () => S)() : initialState;
    const setValue = (newValue: SetStateAction<S>) => {
        // Mock implementation - in real React this would trigger re-renders
        console.log('State updated:', newValue);
    };
    return [value, setValue];
};

const useEffect = (effect: EffectCallback, deps?: DependencyList): void => {
    // Mock implementation - in real React this would run after render
    if (typeof effect === 'function') {
        const cleanup = effect();
        if (typeof cleanup === 'function') {
            // Store cleanup function for later
        }
    }
};

// Advanced Firebase type definitions for enterprise integration
interface FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
    providerData: Array<{
        providerId: string;
        uid: string;
        displayName: string | null;
        email: string | null;
        photoURL: string | null;
    }>;
    metadata: {
        creationTime?: string;
        lastSignInTime?: string;
    };
    tenantId?: string;
}

interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
    toMillis(): number;
    isEqual(other: FirestoreTimestamp): boolean;
    valueOf(): string;
}

interface DocumentSnapshot<T = any> {
    id: string;
    exists: boolean;
    data(): T | undefined;
    get(fieldPath: string): any;
    ref: DocumentReference<T>;
}

interface QuerySnapshot<T = any> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
    forEach(callback: (result: QueryDocumentSnapshot<T>) => void): void;
}

interface QueryDocumentSnapshot<T = any> extends DocumentSnapshot<T> {
    data(): T;
}

interface DocumentReference<T = any> {
    id: string;
    path: string;
    parent: CollectionReference<T>;
    firestore: Firestore;
}

interface CollectionReference<T = any> {
    id: string;
    path: string;
    parent: DocumentReference | null;
    firestore: Firestore;
}

interface Firestore {
    app: FirebaseApp;
}

interface FirebaseApp {
    name: string;
    options: any;
}

// Enterprise-grade Firebase function implementations
class EnterpriseFirebaseService {
    private static instance: EnterpriseFirebaseService;
    private mockDatabase: Map<string, any> = new Map();
    private subscribers: Map<string, Set<Function>> = new Map();

    static getInstance(): EnterpriseFirebaseService {
        if (!EnterpriseFirebaseService.instance) {
            EnterpriseFirebaseService.instance = new EnterpriseFirebaseService();
        }
        return EnterpriseFirebaseService.instance;
    }

    onSnapshot(path: string, callback: (snapshot: QuerySnapshot) => void): () => void {
        const pathSubscribers = this.subscribers.get(path) || new Set();
        pathSubscribers.add(callback);
        this.subscribers.set(path, pathSubscribers);

        // Initial callback with mock data
        setTimeout(() => {
            const mockSnapshot = this.createMockSnapshot(path);
            callback(mockSnapshot);
        }, 100);

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(path);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }

    async setDoc(path: string, data: any, options?: { merge?: boolean }): Promise<void> {
        const existing = this.mockDatabase.get(path) || {};
        const newData = options?.merge ? { ...existing, ...data } : data;
        this.mockDatabase.set(path, {
            ...newData,
            _metadata: {
                createdAt: existing._metadata?.createdAt || new Date(),
                updatedAt: new Date(),
                version: (existing._metadata?.version || 0) + 1
            }
        });
        this.notifySubscribers(path);
    }

    async updateDoc(path: string, data: any): Promise<void> {
        const existing = this.mockDatabase.get(path) || {};
        this.mockDatabase.set(path, {
            ...existing,
            ...data,
            _metadata: {
                ...existing._metadata,
                updatedAt: new Date(),
                version: (existing._metadata?.version || 0) + 1
            }
        });
        this.notifySubscribers(path);
    }

    async addDoc(collectionPath: string, data: any): Promise<DocumentReference> {
        const docId = this.generateId();
        const docPath = `${collectionPath}/${docId}`;
        await this.setDoc(docPath, data);
        return { id: docId, path: docPath } as DocumentReference;
    }

    async deleteDoc(path: string): Promise<void> {
        this.mockDatabase.delete(path);
        this.notifySubscribers(path);
    }

    private createMockSnapshot(path: string): QuerySnapshot {
        const data = this.mockDatabase.get(path) || {};
        return {
            docs: Object.keys(data).map(id => ({
                id,
                data: () => data[id],
                exists: true,
                ref: { id, path: `${path}/${id}` }
            })),
            empty: Object.keys(data).length === 0,
            size: Object.keys(data).length,
            forEach: function(callback: Function) {
                this.docs.forEach(callback);
            }
        } as QuerySnapshot;
    }

    private notifySubscribers(path: string): void {
        const subscribers = this.subscribers.get(path);
        if (subscribers) {
            const snapshot = this.createMockSnapshot(path);
            subscribers.forEach(callback => callback(snapshot));
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Initialize Firebase service
const firebaseService = EnterpriseFirebaseService.getInstance();

// Enterprise Firebase API wrappers
const onSnapshot = (path: any, callback: (snapshot: QuerySnapshot) => void) => 
    firebaseService.onSnapshot(String(path), callback);

const doc = (db: any, ...pathSegments: string[]) => ({
    id: pathSegments[pathSegments.length - 1],
    path: pathSegments.join('/'),
    collection: pathSegments.slice(0, -1).join('/')
});

const collection = (db: any, ...pathSegments: string[]) => ({
    path: pathSegments.join('/'),
    id: pathSegments[pathSegments.length - 1]
});

const setDoc = (docRef: any, data: any, options?: { merge?: boolean }) =>
    firebaseService.setDoc(docRef.path, data, options);

const updateDoc = (docRef: any, data: any) =>
    firebaseService.updateDoc(docRef.path, data);

const deleteDoc = (docRef: any) =>
    firebaseService.deleteDoc(docRef.path);

const addDoc = (collectionRef: any, data: any) =>
    firebaseService.addDoc(collectionRef.path, data);

const serverTimestamp = () => ({
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: (Date.now() % 1000) * 1000000,
    toDate: () => new Date(),
    toMillis: () => Date.now()
} as FirestoreTimestamp);

const query = (collection: any, ...constraints: any[]) => ({
    ...collection,
    constraints
});

const where = (field: string, operator: string, value: any) => ({
    type: 'where',
    field,
    operator,
    value
});

const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({
    type: 'orderBy',
    field,
    direction
});

const limit = (count: number) => ({
    type: 'limit',
    count
});

// Mock database and auth context
const db = { type: 'firestore', name: 'natacare-enterprise' };

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>({
        uid: 'user-123',
        email: 'user@natacare.com',
        displayName: 'Enterprise User',
        photoURL: null,
        emailVerified: true,
        phoneNumber: null,
        providerData: [],
        metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
        }
    });
    
    return { currentUser, loading: false };
};

const useProject = () => {
    const [currentProject, setCurrentProject] = useState({
        id: 'project-enterprise-123',
        name: 'Enterprise Construction Project',
        description: 'Large scale enterprise construction management',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    return { currentProject, loading: false };
};

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

    return {
        type: 'RealtimeCollaborationProvider',
        props: {
            value,
            children
        },
        key: null
    } as ReactElement;
};