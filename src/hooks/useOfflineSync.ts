/**
 * OFFLINE SYNC HOOK
 * React hook untuk offline functionality
 * Last Updated: December 16, 2025
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService } from '@/services/offlineSyncService';
import { logger } from '@/utils/logger.enhanced';
import { useToast } from '@/contexts/ToastContext';

interface OfflineSyncHookReturn {
  // Connection status
  isOnline: boolean;
  isSyncing: boolean;

  // Sync stats
  pendingCount: number;
  failedCount: number;
  storageSize: number;
  isLowStorage: boolean;

  // Actions
  queueOperation: (
    type: 'create' | 'update' | 'delete',
    collection: string,
    documentId: string | undefined,
    data: any,
    projectId: string
  ) => Promise<number>;
  saveDailyLogOffline: (dailyLogData: any, projectId: string) => Promise<string>;
  syncNow: () => Promise<void>;
  clearFailedOperations: () => Promise<void>;

  // Helpers
  formatStorageSize: (bytes: number) => string;
}

/**
 * Hook untuk manage offline sync
 * 
 * @example
 * ```tsx
 * const { 
 *   isOnline, 
 *   pendingCount, 
 *   saveDailyLogOffline,
 *   syncNow 
 * } = useOfflineSync();
 * 
 * // Save data offline
 * if (!isOnline) {
 *   await saveDailyLogOffline(data, projectId);
 *   addToast('Saved offline. Will sync when online.', 'info');
 * }
 * 
 * // Manual sync
 * await syncNow();
 * ```
 */
export function useOfflineSync(): OfflineSyncHookReturn {
  const { addToast } = useToast();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [storageSize, setStorageSize] = useState(0);
  const [isLowStorage, setIsLowStorage] = useState(false);

  // Update stats
  const updateStats = useCallback(async () => {
    try {
      const stats = await offlineSyncService.getSyncStats();
      setPendingCount(stats.pending);
      setFailedCount(stats.failed);
      setStorageSize(stats.storageSize);
      setIsLowStorage(stats.isLowStorage);
      setIsSyncing(stats.isSyncing);
    } catch (error) {
      logger.error('Failed to update offline stats', error instanceof Error ? error : new Error(String(error)));
    }
  }, []);

  // Online/offline event handlers
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      logger.info('Connection restored - starting auto-sync');
      
      // Auto-sync when connection restored
      try {
        await syncNow();
      } catch (error) {
        logger.error('Auto-sync failed', error instanceof Error ? error : new Error(String(error)));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Connection lost - switching to offline mode');
      addToast('⚠️ Offline mode - Data will be saved locally', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial stats load
    updateStats();

    // Update stats every 10 seconds
    const interval = setInterval(updateStats, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [addToast, updateStats]);

  // Queue operation for sync
  const queueOperation = useCallback(
    async (
      type: 'create' | 'update' | 'delete',
      collection: string,
      documentId: string | undefined,
      data: any,
      projectId: string
    ): Promise<number> => {
      try {
        const id = await offlineSyncService.queueOperation(
          type,
          collection,
          documentId,
          data,
          projectId
        );
        
        await updateStats();
        
        addToast('Operation queued for sync', 'info');
        return id;
      } catch (error) {
        logger.error('Failed to queue operation', error instanceof Error ? error : new Error(String(error)));
        addToast('Failed to queue operation', 'error');
        throw error;
      }
    },
    [addToast, updateStats]
  );

  // Save daily log offline
  const saveDailyLogOffline = useCallback(
    async (dailyLogData: any, projectId: string): Promise<string> => {
      try {
        const localId = await offlineSyncService.saveDailyLogOffline(
          dailyLogData,
          projectId
        );
        
        await updateStats();
        
        addToast('📱 Daily log saved offline', 'success');
        return localId;
      } catch (error) {
        logger.error('Failed to save daily log offline', error instanceof Error ? error : new Error(String(error)));
        addToast('Failed to save offline', 'error');
        throw error;
      }
    },
    [addToast, updateStats]
  );

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      addToast('Cannot sync: No internet connection', 'info');
      return;
    }

    if (isSyncing) {
      addToast('Sync already in progress', 'info');
      return;
    }

    try {
      setIsSyncing(true);
      addToast('🔄 Syncing...', 'info');

      const result = await offlineSyncService.syncAll();

      if (result.total === 0) {
        addToast('✅ Nothing to sync', 'success');
      } else if (result.failed === 0) {
        addToast(`✅ Synced ${result.success} items successfully`, 'success');
      } else {
        addToast(
          `⚠️ Synced ${result.success}/${result.total} items (${result.failed} failed)`,
          'info'
        );
      }

      await updateStats();
    } catch (error) {
      logger.error('Sync failed', error instanceof Error ? error : new Error(String(error)));
      addToast('❌ Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [addToast, isSyncing, updateStats]);

  // Clear failed operations
  const clearFailedOperations = useCallback(async () => {
    try {
      const count = await offlineSyncService.clearFailedOperations();
      addToast(`Cleared ${count} failed operations`, 'success');
      await updateStats();
    } catch (error) {
      logger.error('Failed to clear failed operations', error instanceof Error ? error : new Error(String(error)));
      addToast('Failed to clear operations', 'error');
    }
  }, [addToast, updateStats]);

  // Format storage size
  const formatStorageSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  return {
    // Status
    isOnline,
    isSyncing,
    
    // Stats
    pendingCount,
    failedCount,
    storageSize,
    isLowStorage,
    
    // Actions
    queueOperation,
    saveDailyLogOffline,
    syncNow,
    clearFailedOperations,
    
    // Helpers
    formatStorageSize,
  };
}

/**
 * Hook untuk check if app should work offline
 */
export function useOfflineMode() {
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOfflineMode;
}
