/**
 * Mobile Offline Inspection Type Definitions
 * Phase 3.5: Quick Wins - Mobile Offline Capabilities
 * 
 * Support for offline data collection, sync, and conflict resolution
 */

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type SyncDirection = 'upload' | 'download' | 'bidirectional';
export type ConflictResolution = 'local_wins' | 'remote_wins' | 'latest_wins' | 'manual';

/**
 * Offline Inspection Record
 */
export interface OfflineInspection {
  id: string;
  localId: string; // UUID generated locally
  remoteId?: string; // Firestore ID after sync
  
  projectId: string;
  inspectionType: string;
  
  // Offline metadata
  offlineMetadata: {
    createdOffline: boolean;
    lastModifiedOffline: Date;
    deviceId: string;
    deviceInfo: {
      platform: string;
      os: string;
      browser: string;
      appVersion: string;
    };
    networkStatus: 'online' | 'offline';
  };
  
  // Sync status
  syncStatus: SyncStatus;
  lastSyncAttempt?: Date;
  lastSyncSuccess?: Date;
  syncError?: string;
  syncRetryCount: number;
  
  // Inspection data
  data: {
    title: string;
    description?: string;
    location: string;
    inspector: string;
    scheduledDate: Date;
    actualDate?: Date;
    
    checklist: {
      id: string;
      item: string;
      result: 'pass' | 'fail' | 'na';
      notes?: string;
      photoIds?: string[]; // References to offline photos
    }[];
    
    overallResult?: 'pass' | 'fail' | 'conditional';
    notes?: string;
  };
  
  // Attachments (stored locally)
  attachments: {
    id: string;
    type: 'photo' | 'video' | 'document';
    localPath: string;
    remoteUrl?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploaded: boolean;
    uploadProgress?: number;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync Queue Item
 */
export interface SyncQueueItem {
  id: string;
  type: 'inspection' | 'defect' | 'incident' | 'training' | 'attachment';
  entityId: string;
  
  operation: 'create' | 'update' | 'delete';
  direction: SyncDirection;
  
  priority: number; // Higher = more urgent
  
  data: any;
  
  status: SyncStatus;
  retryCount: number;
  maxRetries: number;
  
  error?: string;
  
  createdAt: Date;
  scheduledAt?: Date;
  processedAt?: Date;
}

/**
 * Sync Conflict
 */
export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  
  localVersion: {
    data: any;
    timestamp: Date;
    deviceId: string;
  };
  
  remoteVersion: {
    data: any;
    timestamp: Date;
    userId: string;
  };
  
  resolution: ConflictResolution;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolvedData?: any;
  
  status: 'pending' | 'resolved' | 'ignored';
  
  createdAt: Date;
}

/**
 * Offline Storage Metadata
 */
export interface OfflineStorageMetadata {
  version: string;
  lastSync: Date;
  deviceId: string;
  
  databases: {
    name: string;
    version: number;
    size: number;
    recordCount: number;
  }[];
  
  pendingSync: number;
  failedSync: number;
  conflicts: number;
  
  storageQuota: {
    usage: number;
    quota: number;
    percentage: number;
  };
}

/**
 * Service Worker Status
 */
export interface ServiceWorkerStatus {
  registered: boolean;
  active: boolean;
  version: string;
  
  cacheStatus: {
    appCache: {
      name: string;
      size: number;
      files: number;
    };
    dataCache: {
      name: string;
      size: number;
      entries: number;
    };
  };
  
  updateAvailable: boolean;
  lastUpdate?: Date;
}

/**
 * Network Status
 */
export interface NetworkStatus {
  online: boolean;
  type?: 'wifi' | 'cellular' | '4g' | '3g' | 'ethernet' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
}

/**
 * Background Sync Task
 */
export interface BackgroundSyncTask {
  id: string;
  tag: string;
  
  type: 'sync' | 'upload' | 'download';
  
  itemsTotal: number;
  itemsProcessed: number;
  itemsFailed: number;
  
  progress: number; // percentage
  
  startedAt?: Date;
  completedAt?: Date;
  
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  error?: string;
}

export default OfflineInspection;
