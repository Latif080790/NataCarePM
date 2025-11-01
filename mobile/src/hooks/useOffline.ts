/**
 * Custom hook for offline functionality
 * NataCarePM Mobile App
 */

import { useState, useEffect } from 'react';
import { offlineService } from '../services';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await offlineService.initialize();
        offlineService.startPeriodicSync();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize offline service:', error);
      }
    };

    init();

    // Setup online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      offlineService.stopPeriodicSync();
    };
  }, []);

  const saveOfflineData = async <T>(key: string, data: T, type: string, projectId?: string) => {
    if (!isInitialized) {
      throw new Error('Offline service not initialized');
    }
    return offlineService.saveOfflineData(key, data, type, projectId);
  };

  const getOfflineData = async <T>(key: string): Promise<T | null> => {
    if (!isInitialized) {
      throw new Error('Offline service not initialized');
    }
    return offlineService.getOfflineData<T>(key);
  };

  const addToSyncQueue = async <T>(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    data: T,
    projectId?: string
  ) => {
    if (!isInitialized) {
      throw new Error('Offline service not initialized');
    }
    return offlineService.addToSyncQueue(operation, entityType, data, projectId);
  };

  const getSyncQueueSize = async (): Promise<number> => {
    if (!isInitialized) {
      throw new Error('Offline service not initialized');
    }
    return offlineService.getSyncQueueSize();
  };

  return {
    isOnline,
    isInitialized,
    saveOfflineData,
    getOfflineData,
    addToSyncQueue,
    getSyncQueueSize,
  };
};