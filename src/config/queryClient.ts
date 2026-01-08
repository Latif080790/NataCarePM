/**
 * React Query (TanStack Query) Configuration
 * Phase 5: Scale & Optimize - Advanced Caching
 * 
 * Features:
 * - Global cache configuration
 * - Automatic background refetching
 * - Request deduplication
 * - Offline support
 * - Error retry with exponential backoff
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger.enhanced';

/**
 * Default stale times for different data types (in milliseconds)
 */
export const STALE_TIMES = {
  /** Static data that rarely changes (e.g., user profile) */
  STATIC: 1000 * 60 * 30, // 30 minutes
  
  /** Semi-static data (e.g., project list, RAB items) */
  SEMI_STATIC: 1000 * 60 * 5, // 5 minutes
  
  /** Dynamic data that changes frequently (e.g., inventory, tasks) */
  DYNAMIC: 1000 * 60 * 1, // 1 minute
  
  /** Real-time data (e.g., notifications, chat) */
  REALTIME: 1000 * 30, // 30 seconds
  
  /** Dashboard metrics */
  METRICS: 1000 * 60 * 2, // 2 minutes
};

/**
 * Cache times (how long to keep unused data in cache)
 */
export const CACHE_TIMES = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 15, // 15 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  PERSISTENT: 1000 * 60 * 60 * 24, // 24 hours
};

/**
 * Query keys factory for consistent key management
 */
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
    dashboard: (id: string) => [...queryKeys.projects.all, 'dashboard', id] as const,
  },
  
  // RAB (Budget)
  rab: {
    all: ['rab'] as const,
    list: (projectId: string) => [...queryKeys.rab.all, 'list', projectId] as const,
    item: (projectId: string, itemId: string) => [...queryKeys.rab.all, 'item', projectId, itemId] as const,
    summary: (projectId: string) => [...queryKeys.rab.all, 'summary', projectId] as const,
  },
  
  // Inventory
  inventory: {
    all: ['inventory'] as const,
    list: (projectId: string) => [...queryKeys.inventory.all, 'list', projectId] as const,
    item: (projectId: string, itemId: string) => [...queryKeys.inventory.all, 'item', projectId, itemId] as const,
    lowStock: (projectId: string) => [...queryKeys.inventory.all, 'lowStock', projectId] as const,
  },
  
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (projectId: string) => [...queryKeys.tasks.all, 'list', projectId] as const,
    byStatus: (projectId: string, status: string) => [...queryKeys.tasks.all, 'byStatus', projectId, status] as const,
    overdue: (projectId: string) => [...queryKeys.tasks.all, 'overdue', projectId] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    daily: (projectId: string, date: string) => [...queryKeys.reports.all, 'daily', projectId, date] as const,
    weekly: (projectId: string, week: string) => [...queryKeys.reports.all, 'weekly', projectId, week] as const,
    monthly: (projectId: string, month: string) => [...queryKeys.reports.all, 'monthly', projectId, month] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    profile: (id: string) => [...queryKeys.users.all, 'profile', id] as const,
    permissions: (id: string) => [...queryKeys.users.all, 'permissions', id] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    list: (page: number) => [...queryKeys.notifications.all, 'list', page] as const,
  },
  
  // AI Insights
  ai: {
    all: ['ai'] as const,
    insights: (projectId: string) => [...queryKeys.ai.all, 'insights', projectId] as const,
    predictions: (projectId: string) => [...queryKeys.ai.all, 'predictions', projectId] as const,
    nlQuery: (query: string) => [...queryKeys.ai.all, 'nlQuery', query] as const,
  },
};

/**
 * Global error handler for React Query
 */
const handleQueryError = (error: unknown) => {
  logger.error('React Query Error', error instanceof Error ? error : undefined, {
    message: error instanceof Error ? error.message : 'Unknown error',
  });
};

/**
 * Create and configure the QueryClient
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes by default
        staleTime: STALE_TIMES.SEMI_STATIC,
        
        // Keep unused data in cache for 15 minutes
        gcTime: CACHE_TIMES.MEDIUM,
        
        // Retry failed requests 3 times with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (error instanceof Error && error.message.includes('permission')) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus (good for stale data)
        refetchOnWindowFocus: true,
        
        // Don't refetch on mount if data is fresh
        refetchOnMount: 'always',
        
        // Keep previous data while fetching new data
        placeholderData: (previousData: unknown) => previousData,
        
        // Network mode - fetch even when offline if cache exists
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
        
        // Global error handler
        onError: handleQueryError,
      },
    },
  });
}

/**
 * Singleton QueryClient instance
 */
let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
}

export default getQueryClient;
