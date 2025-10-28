# 🔧 IMPLEMENTASI REKOMENDASI PRIORITAS TINGGI

## 1. Firebase Integration Enhancement

### A. Real-time Authentication

```typescript
// File: hooks/useFirebaseAuth.ts
import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { User } from '../types';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name || firebaseUser.displayName || '',
              roleId: userData.roleId || 'viewer',
              avatarUrl: userData.avatarUrl || firebaseUser.photoURL || '',
              isOnline: true,
              lastSeen: new Date(),
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('Authentication error occurred');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name,
        email: firebaseUser.email,
        roleId: 'viewer',
        avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        createdAt: new Date(),
        isOnline: true,
        lastSeen: new Date(),
      });

      // Update Firebase Auth profile
      await firebaseUpdateProfile(firebaseUser, { displayName: name });

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Update online status
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          isOnline: false,
          lastSeen: new Date(),
        });
      }

      await firebaseSignOut(auth);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
};
```

### B. Real-time Data Hooks

```typescript
// File: hooks/useRealtimeData.ts
import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  QuerySnapshot,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Project, Task, User, Notification } from '../types';

export const useRealtimeProject = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const projectRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(
      projectRef,
      (doc: DocumentSnapshot) => {
        try {
          if (doc.exists()) {
            setProject({ id: doc.id, ...doc.data() } as Project);
          } else {
            setProject(null);
          }
        } catch (err) {
          console.error('Project snapshot error:', err);
          setError('Failed to load project data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Project listener error:', err);
        setError('Real-time connection failed');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { project, loading, error };
};

export const useRealtimeTasks = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const tasksQuery = query(
      collection(db, 'projects', projectId, 'tasks'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot: QuerySnapshot) => {
        try {
          const tasksData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Task[];
          setTasks(tasksData);
        } catch (err) {
          console.error('Tasks snapshot error:', err);
          setError('Failed to load tasks');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Tasks listener error:', err);
        setError('Real-time connection failed');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { tasks, loading, error };
};

export const useRealtimeNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot: QuerySnapshot) => {
      try {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];

        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Notifications snapshot error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return { notifications, unreadCount, loading };
};
```

## 2. Security Enhancement

### A. Enhanced Authentication Context

```typescript
// File: contexts/EnhancedAuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useFirebaseAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
```

### B. Role-Based Access Control

```typescript
// File: utils/rbac.ts
import { User } from '../types';

export type Permission =
  | 'project.create'
  | 'project.edit'
  | 'project.delete'
  | 'project.view'
  | 'task.create'
  | 'task.edit'
  | 'task.delete'
  | 'task.view'
  | 'user.manage'
  | 'report.view'
  | 'report.export'
  | 'finance.view'
  | 'finance.edit';

export type Role = 'admin' | 'manager' | 'supervisor' | 'worker' | 'viewer';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'project.create',
    'project.edit',
    'project.delete',
    'project.view',
    'task.create',
    'task.edit',
    'task.delete',
    'task.view',
    'user.manage',
    'report.view',
    'report.export',
    'finance.view',
    'finance.edit',
  ],
  manager: [
    'project.create',
    'project.edit',
    'project.view',
    'task.create',
    'task.edit',
    'task.delete',
    'task.view',
    'report.view',
    'report.export',
    'finance.view',
    'finance.edit',
  ],
  supervisor: [
    'project.view',
    'task.create',
    'task.edit',
    'task.view',
    'report.view',
    'finance.view',
  ],
  worker: ['project.view', 'task.view', 'task.edit'],
  viewer: ['project.view', 'task.view', 'report.view'],
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user || !user.roleId) return false;

  const userRole = user.roleId as Role;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export const usePermissions = (user: User | null) => {
  const checkPermission = (permission: Permission) => hasPermission(user, permission);

  return {
    can: checkPermission,
    canCreateProject: () => checkPermission('project.create'),
    canEditProject: () => checkPermission('project.edit'),
    canDeleteProject: () => checkPermission('project.delete'),
    canViewProject: () => checkPermission('project.view'),
    canCreateTask: () => checkPermission('task.create'),
    canEditTask: () => checkPermission('task.edit'),
    canDeleteTask: () => checkPermission('task.delete'),
    canViewTask: () => checkPermission('task.view'),
    canManageUsers: () => checkPermission('user.manage'),
    canViewReports: () => checkPermission('report.view'),
    canExportReports: () => checkPermission('report.export'),
    canViewFinance: () => checkPermission('finance.view'),
    canEditFinance: () => checkPermission('finance.edit'),
  };
};
```

## 3. Performance Optimization

### A. Component Lazy Loading

```typescript
// File: components/LazyComponents.tsx
import { lazy, Suspense } from 'react';
import { Spinner } from './Spinner';

// Lazy load heavy components
export const LazyDashboard = lazy(() => import('../views/DashboardView'));
export const LazyEnterpriseAdvancedDashboard = lazy(() => import('../views/EnterpriseAdvancedDashboardView'));
export const LazyGanttChart = lazy(() => import('../views/GanttChartView'));
export const LazyKanbanBoard = lazy(() => import('../views/KanbanBoardView'));
export const LazyReportView = lazy(() => import('../views/ReportView'));
export const LazyFinanceView = lazy(() => import('../views/FinanceView'));

// Higher-order component for lazy loading with loading state
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = (props: P) => (
    <Suspense fallback={fallback ? <fallback /> : <Spinner />}>
      <Component {...props} />
    </Suspense>
  );

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return LazyComponent;
};
```

### B. Optimized Vite Configuration

```typescript
// File: vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react({
        // Enable Fast Refresh
        fastRefresh: true,
        // Optimize JSX runtime
        jsxRuntime: 'automatic',
      }),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
        manifest: {
          name: 'NataCarePM',
          short_name: 'NataCarePM',
          description: 'Construction Project Management System',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@components': path.resolve(__dirname, './components'),
        '@views': path.resolve(__dirname, './views'),
        '@hooks': path.resolve(__dirname, './hooks'),
        '@contexts': path.resolve(__dirname, './contexts'),
        '@api': path.resolve(__dirname, './api'),
        '@types': path.resolve(__dirname, './types'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
            charts: ['recharts'],
            utils: ['date-fns', 'lodash'],
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'firebase/app',
        'firebase/firestore',
        'firebase/auth',
        'firebase/storage',
      ],
    },
  };
});
```

## 4. Testing Infrastructure

### A. Jest Configuration

```json
// File: jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@views/(.*)$': '<rootDir>/src/views/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### B. Test Setup

```typescript
// File: src/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock Firebase
jest.mock('./firebaseConfig', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Mock environment variables
process.env.VITE_GEMINI_API_KEY = 'test-api-key';

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

### C. Component Tests

```typescript
// File: __tests__/components/StatCard.test.tsx
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../components/StatCard';
import { DollarSign } from 'lucide-react';

describe('StatCard Component', () => {
  const defaultProps = {
    title: 'Test Title',
    value: '$1,000',
    icon: DollarSign,
    trend: '+5%' as const,
    description: 'Test description'
  };

  it('renders title and value correctly', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays trend when provided', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('renders icon component', () => {
    render(<StatCard {...defaultProps} />);

    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<StatCard {...defaultProps} />);

    const cardElement = screen.getByRole('article');
    expect(cardElement).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow-sm');
  });
});
```

## 5. Implementation Steps

### Minggu 1-2: Backend Integration

1. ✅ Implement `useFirebaseAuth` hook
2. ✅ Create `useRealtimeData` hooks
3. ✅ Update AuthContext to use real Firebase
4. ✅ Test authentication flows

### Minggu 3-4: Security & RBAC

1. ✅ Implement role-based permissions
2. ✅ Add security middleware
3. ✅ Update UI components with permission checks
4. ✅ Test authorization scenarios

### Minggu 5-6: Performance & Testing

1. ✅ Configure lazy loading
2. ✅ Optimize Vite build configuration
3. ✅ Set up Jest testing framework
4. ✅ Write component tests

### Production Deployment Checklist:

- [ ] Environment variables configured
- [ ] Firebase security rules implemented
- [ ] SSL certificate installed
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] Backup procedures established

**STATUS: READY FOR IMPLEMENTATION** 🚀
