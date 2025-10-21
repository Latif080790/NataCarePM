/**
 * Offline Context
 * Phase 3.5: Mobile Offline Inspections
 *
 * Manages offline state, sync status, and network connectivity
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  OfflineInspection,
  SyncConflict,
  NetworkStatus,
  OfflineStorageMetadata,
  ServiceWorkerStatus,
} from '@/types/offline.types';
import syncService, { getNetworkStatus } from '@/api/syncService';
import * as IndexedDB from '@/utils/indexedDB';

interface OfflineContextState {
  // Network status
  isOnline: boolean;
  networkStatus: NetworkStatus | null;

  // Inspections
  offlineInspections: OfflineInspection[];
  pendingInspections: OfflineInspection[];
  syncedInspections: OfflineInspection[];
  conflictedInspections: OfflineInspection[];

  // Sync status
  syncStatus: {
    pending: number;
    failed: number;
    conflicts: number;
    inProgress: boolean;
    lastSync: Date | null;
  };

  // Storage
  storageMetadata: OfflineStorageMetadata | null;

  // Service Worker
  serviceWorkerStatus: ServiceWorkerStatus | null;

  // Conflicts
  conflicts: SyncConflict[];

  // Actions
  createInspection: (
    projectId: string,
    inspectionType: string,
    data: OfflineInspection['data']
  ) => Promise<OfflineInspection>;
  updateInspection: (localId: string, updates: Partial<OfflineInspection['data']>) => Promise<void>;
  deleteInspection: (localId: string) => Promise<void>;
  addAttachment: (inspectionId: string, file: File) => Promise<string>;

  // Sync actions
  syncNow: () => Promise<void>;
  getSyncStatus: () => Promise<void>;

  // Conflict resolution
  resolveConflict: (
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedData?: any
  ) => Promise<void>;

  // Storage management
  refreshStorageStats: () => Promise<void>;
  clearSyncedData: () => Promise<void>;

  // Service Worker
  updateServiceWorker: () => void;
}

const OfflineContext = createContext<OfflineContextState | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Network status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);

  // Inspections
  const [offlineInspections, setOfflineInspections] = useState<OfflineInspection[]>([]);

  // Sync status
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    failed: 0,
    conflicts: 0,
    inProgress: false,
    lastSync: null as Date | null,
  });

  // Storage
  const [storageMetadata, setStorageMetadata] = useState<OfflineStorageMetadata | null>(null);

  // Conflicts
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  // Service Worker state
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);

  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<ServiceWorkerStatus | null>(null);

  // Service Worker update function
  const updateServiceWorkerApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update();
        });
      });
    }
  }, []);

  // Derived state
  const pendingInspections = useMemo(
    () => offlineInspections.filter((i) => i.syncStatus === 'pending'),
    [offlineInspections]
  );

  const syncedInspections = useMemo(
    () => offlineInspections.filter((i) => i.syncStatus === 'synced'),
    [offlineInspections]
  );

  const conflictedInspections = useMemo(
    () => offlineInspections.filter((i) => i.syncStatus === 'conflict'),
    [offlineInspections]
  );

  // Load inspections from IndexedDB
  const loadInspections = useCallback(async () => {
    try {
      const inspections = await IndexedDB.getAllInspections();
      setOfflineInspections(inspections);
    } catch (error) {
      console.error('Failed to load inspections:', error);
    }
  }, []);

  // Load conflicts
  const loadConflicts = useCallback(async () => {
    try {
      const conflictsList = await IndexedDB.getPendingConflicts();
      setConflicts(conflictsList);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    const status = getNetworkStatus();
    setNetworkStatus(status);
    setIsOnline(status.online);
  }, []);

  // Get sync status
  const getSyncStatus = useCallback(async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus({
        pending: status.pending,
        failed: status.failed,
        conflicts: status.conflicts,
        inProgress: status.inProgress,
        lastSync: status.lastSync,
      });
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  }, []);

  // Refresh storage stats
  const refreshStorageStats = useCallback(async () => {
    try {
      const stats = await IndexedDB.getStorageStats();
      setStorageMetadata(stats);
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }
  }, []);

  // Update Service Worker status
  const updateSWStatus = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setServiceWorkerStatus({
            registered: true,
            active: registration.active !== null,
            version: '1.0.0',
            cacheStatus: {
              appCache: {
                name: 'app-cache',
                size: 0,
                files: 0,
              },
              dataCache: {
                name: 'data-cache',
                size: 0,
                entries: 0,
              },
            },
            updateAvailable: needRefresh,
          });
        } else {
          setServiceWorkerStatus({
            registered: false,
            active: false,
            version: '1.0.0',
            cacheStatus: {
              appCache: { name: 'app-cache', size: 0, files: 0 },
              dataCache: { name: 'data-cache', size: 0, entries: 0 },
            },
            updateAvailable: false,
          });
        }
      });
    }
  }, [needRefresh]);

  // Create inspection
  const createInspection = useCallback(
    async (projectId: string, inspectionType: string, data: OfflineInspection['data']) => {
      const inspection = await syncService.createOfflineInspection(projectId, inspectionType, data);
      await loadInspections();
      await getSyncStatus();
      return inspection;
    },
    [loadInspections, getSyncStatus]
  );

  // Update inspection
  const updateInspection = useCallback(
    async (localId: string, updates: Partial<OfflineInspection['data']>) => {
      await syncService.updateOfflineInspection(localId, updates);
      await loadInspections();
      await getSyncStatus();
    },
    [loadInspections, getSyncStatus]
  );

  // Delete inspection
  const deleteInspection = useCallback(
    async (localId: string) => {
      await IndexedDB.deleteInspection(localId);
      await loadInspections();
    },
    [loadInspections]
  );

  // Add attachment
  const addAttachment = useCallback(
    async (inspectionId: string, file: File) => {
      const attachmentId = await syncService.addAttachment(inspectionId, file);
      await loadInspections();
      await getSyncStatus();
      return attachmentId;
    },
    [loadInspections, getSyncStatus]
  );

  // Sync now
  const syncNow = useCallback(async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, inProgress: true }));
      await syncService.syncNow();
      await loadInspections();
      await loadConflicts();
      await getSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncStatus((prev) => ({ ...prev, inProgress: false }));
    }
  }, [loadInspections, loadConflicts, getSyncStatus]);

  // Resolve conflict
  const resolveConflict = useCallback(
    async (conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any) => {
      await syncService.resolveConflictManually(conflictId, resolution, mergedData);
      await loadConflicts();
      await loadInspections();
      await getSyncStatus();
    },
    [loadConflicts, loadInspections, getSyncStatus]
  );

  // Clear synced data
  const clearSyncedData = useCallback(async () => {
    await syncService.clearSyncedData();
    await loadInspections();
    await refreshStorageStats();
  }, [loadInspections, refreshStorageStats]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      await IndexedDB.initDB();
      await loadInspections();
      await loadConflicts();
      await getSyncStatus();
      await refreshStorageStats();
      updateNetworkStatus();
      updateSWStatus();
    };

    initialize();
  }, [
    loadInspections,
    loadConflicts,
    getSyncStatus,
    refreshStorageStats,
    updateNetworkStatus,
    updateSWStatus,
  ]);

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus();
      // Auto-sync when coming online
      syncNow().catch(console.error);
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API listener
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus, syncNow]);

  // Periodic sync status refresh
  useEffect(() => {
    const interval = setInterval(() => {
      getSyncStatus();
      refreshStorageStats();
      updateSWStatus();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [getSyncStatus, refreshStorageStats, updateSWStatus]);

  // Auto-sync on Service Worker update
  useEffect(() => {
    if (offlineReady) {
      console.log('App is ready to work offline');
    }

    if (needRefresh) {
      console.log('New version available, update recommended');
    }
  }, [offlineReady, needRefresh]);

  const value: OfflineContextState = {
    isOnline,
    networkStatus,
    offlineInspections,
    pendingInspections,
    syncedInspections,
    conflictedInspections,
    syncStatus,
    storageMetadata,
    serviceWorkerStatus,
    conflicts,
    createInspection,
    updateInspection,
    deleteInspection,
    addAttachment,
    syncNow,
    getSyncStatus,
    resolveConflict,
    refreshStorageStats,
    clearSyncedData,
    updateServiceWorker: updateServiceWorkerApp,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};
