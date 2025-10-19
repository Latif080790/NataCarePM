# Mobile Offline Inspections - Developer Guide
**Phase 3.5: Quick Wins - Offline-First Architecture**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Implementation Details](#implementation-details)
5. [API Reference](#api-reference)
6. [Testing Guide](#testing-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose
The Mobile Offline Inspections system enables field workers to conduct quality inspections without internet connectivity. Data is stored locally in IndexedDB and automatically synchronized with Firebase when connectivity is restored.

### Key Features
- ✅ **Offline-First**: Works seamlessly without internet
- ✅ **Auto-Sync**: Automatic background synchronization
- ✅ **Conflict Resolution**: Smart conflict detection and resolution
- ✅ **PWA Support**: Installable as native app
- ✅ **Photo Capture**: Camera integration for field documentation
- ✅ **Service Worker**: Advanced caching strategies
- ✅ **Network Detection**: Real-time connectivity monitoring
- ✅ **Storage Management**: Quota tracking and cleanup

### Business Value
- **Field Productivity**: Workers can inspect without connectivity constraints
- **Data Integrity**: No data loss during network outages
- **Cost Reduction**: Reduced cellular data usage
- **User Experience**: Seamless offline/online transitions

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Views      │  │  Components  │  │   Contexts   │  │
│  │              │  │              │  │              │  │
│  │ - List View  │  │ - Form       │  │ - Offline    │  │
│  │ - Form View  │  │ - Status     │  │   Context    │  │
│  │ - Sync View  │  │ - Network    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │              Offline Context Layer               │  │
│  │  - State Management                              │  │
│  │  - Network Monitoring                            │  │
│  │  - Sync Orchestration                            │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐           ┌────────────────────┐    │
│  │ Sync Service │◄─────────►│  IndexedDB Utility │    │
│  │              │           │                    │    │
│  │ - Queue Mgmt │           │ - CRUD Operations  │    │
│  │ - Conflict   │           │ - Attachments      │    │
│  │ - Retry      │           │ - Sync Queue       │    │
│  └──────────────┘           └────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│                   Service Worker Layer                  │
│  ┌────────────────────────────────────────────────┐    │
│  │  Workbox PWA (vite-plugin-pwa)                 │    │
│  │  - App Shell Caching                           │    │
│  │  - Runtime Caching                             │    │
│  │  - Background Sync                             │    │
│  └────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│                   Storage Layer                         │
│  ┌──────────────┐                  ┌──────────────┐    │
│  │  IndexedDB   │                  │   Firebase   │    │
│  │              │                  │              │    │
│  │ - Offline    │◄────Sync────────►│ - Firestore  │    │
│  │   Data       │                  │ - Storage    │    │
│  │ - Queue      │                  │              │    │
│  │ - Conflicts  │                  │              │    │
│  └──────────────┘                  └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Create Inspection (Offline)
```
User Input → Form Validation → IndexedDB.saveInspection()
    ↓
Add to Sync Queue (priority: 100)
    ↓
Trigger Immediate Sync (if online)
```

#### 2. Sync Process
```
syncNow() → Load Pending Queue → Process in Batches (10 items)
    ↓
For Each Item:
    1. Update status to 'syncing'
    2. Upload to Firebase
    3. Check for conflicts
    4. Handle attachments
    5. Update local status to 'synced'
    6. Remove from queue
```

#### 3. Conflict Resolution
```
Detect Conflict (remoteUpdated > localUpdated)
    ↓
Create SyncConflict record
    ↓
Apply Resolution Strategy:
    - latest_wins (default)
    - local_wins
    - remote_wins
    - manual (user intervention)
    ↓
Update local data
    ↓
Retry sync
```

---

## Technology Stack

### Core Technologies
- **IndexedDB**: Browser-native NoSQL database (100MB+ capacity)
- **Service Workers**: Background sync, caching, offline support
- **Workbox**: Google's PWA toolkit for service worker management
- **vite-plugin-pwa**: Vite integration for PWA features

### Libraries & Tools
| Library | Version | Purpose |
|---------|---------|---------|
| `vite-plugin-pwa` | ^0.17.4 | PWA generation and service worker |
| `workbox-window` | ^7.0.0 | Service worker registration |
| `date-fns` | ^4.1.0 | Date formatting and manipulation |
| Firebase SDK | ^12.4.0 | Backend synchronization |

### Browser APIs Used
- **IndexedDB API**: Offline data storage
- **Service Worker API**: Background operations
- **Network Information API**: Connection type detection
- **Storage API**: Quota management
- **Cache API**: Asset caching (via Workbox)
- **MediaDevices API**: Camera access for photos

---

## Implementation Details

### 1. IndexedDB Structure

**Database**: `NataCarePM_Offline`  
**Version**: 1

#### Object Stores

**inspections** (keyPath: `localId`)
```typescript
{
  localId: string,           // Primary key
  remoteId?: string,          // Firebase document ID
  projectId: string,
  inspectionType: string,
  data: {
    title: string,
    location: string,
    inspector: string,
    checklist: ChecklistItem[],
    overallResult?: 'pass' | 'fail' | 'conditional'
  },
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict',
  offlineMetadata: {...},
  attachments: [...],
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:
- `remoteId` (non-unique)
- `projectId` (non-unique)
- `syncStatus` (non-unique)
- `createdAt` (non-unique)

**attachments** (keyPath: `id`)
```typescript
{
  id: string,                 // Primary key
  inspectionId: string,
  blob: Blob,                 // Binary data
  fileName: string,
  mimeType: string,
  uploaded: boolean,
  uploadProgress?: number,
  createdAt: Date
}
```

Indexes:
- `inspectionId` (non-unique)
- `uploaded` (non-unique)

**syncQueue** (keyPath: `id`)
```typescript
{
  id: string,
  type: 'inspection' | 'attachment',
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  priority: number,           // Higher = more urgent
  status: SyncStatus,
  retryCount: number,
  maxRetries: number,
  data: any,
  error?: string,
  createdAt: Date,
  scheduledAt?: Date,
  processedAt?: Date
}
```

Indexes:
- `status` (non-unique)
- `priority` (non-unique)
- `type` (non-unique)

**conflicts** (keyPath: `id`)
```typescript
{
  id: string,
  entityType: string,
  entityId: string,
  localVersion: {
    data: any,
    timestamp: Date,
    deviceId: string
  },
  remoteVersion: {
    data: any,
    timestamp: Date,
    userId: string
  },
  resolution: ConflictResolution,
  status: 'pending' | 'resolved' | 'ignored',
  resolvedBy?: string,
  resolvedAt?: Date,
  createdAt: Date
}
```

Indexes:
- `status` (non-unique)
- `entityType` (non-unique)

**metadata** (keyPath: `key`)
```typescript
{
  key: string,               // e.g., 'deviceId', 'lastSync'
  value: any,
  updatedAt: Date
}
```

### 2. Service Worker Configuration

**File**: `vite.config.ts`

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'NataCare Project Management',
    short_name: 'NataCare PM',
    display: 'standalone',
    // ... icons, theme
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        // Firebase Storage - Cache First (long TTL)
        urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'firebase-storage-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 2592000 // 30 days
          }
        }
      },
      {
        // Firestore API - Network First (short timeout)
        urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'firestore-api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 300 // 5 minutes
          }
        }
      },
      // ... Google Fonts caching
    ],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true
  }
})
```

**Caching Strategies**:
- **App Shell**: Precached (all static assets)
- **Firebase Storage**: CacheFirst (images, documents)
- **Firestore API**: NetworkFirst with 10s timeout
- **Google Fonts**: StaleWhileRevalidate

### 3. Sync Service

**File**: `api/syncService.ts`

**Key Methods**:

#### createOfflineInspection()
```typescript
async createOfflineInspection(
  projectId: string,
  inspectionType: string,
  data: OfflineInspection['data']
): Promise<OfflineInspection>
```

**Process**:
1. Generate unique `localId`
2. Get/create `deviceId`
3. Build inspection object
4. Save to IndexedDB
5. Add to sync queue (priority: 100)
6. Trigger immediate sync if online

#### syncNow()
```typescript
async syncNow(): Promise<void>
```

**Process**:
1. Check if sync already in progress
2. Validate network connectivity
3. Load pending sync queue items
4. Create background task tracker
5. Process in batches (10 items/batch)
6. Update progress percentage
7. Handle errors with retry logic
8. Update last sync timestamp

**Retry Logic**:
- Max retries: 3
- Delay: 2 seconds × retry count
- Status: `pending` → `syncing` → `synced` or `failed`

#### syncInspection()
```typescript
private async syncInspection(item: SyncQueueItem): Promise<void>
```

**For CREATE operation**:
1. Convert dates to Firestore Timestamps
2. Add document to `offlineInspections` collection
3. Update local record with `remoteId`
4. Set status to `synced`

**For UPDATE operation**:
1. Fetch remote document
2. Compare timestamps
3. If conflict detected → `handleConflict()`
4. Else update remote document
5. Update local status

**For DELETE operation**:
1. Delete from Firestore
2. Delete from IndexedDB

#### handleConflict()
```typescript
private async handleConflict(
  localInspection: OfflineInspection,
  remoteData: any
): Promise<void>
```

**Process**:
1. Create `SyncConflict` record
2. Store both versions (local & remote)
3. Apply resolution strategy:
   - `latest_wins`: Compare timestamps (default)
   - `local_wins`: Always use local
   - `remote_wins`: Always use remote
   - `manual`: Wait for user intervention
4. Auto-resolve or mark for manual resolution

### 4. Offline Context

**File**: `contexts/OfflineContext.tsx`

**State Management**:
```typescript
interface OfflineContextState {
  // Network
  isOnline: boolean
  networkStatus: NetworkStatus | null
  
  // Data
  offlineInspections: OfflineInspection[]
  pendingInspections: OfflineInspection[]
  syncedInspections: OfflineInspection[]
  conflictedInspections: OfflineInspection[]
  
  // Sync
  syncStatus: {
    pending: number
    failed: number
    conflicts: number
    inProgress: boolean
    lastSync: Date | null
  }
  
  // Storage
  storageMetadata: OfflineStorageMetadata | null
  serviceWorkerStatus: ServiceWorkerStatus | null
  
  // Actions
  createInspection: (...)
  updateInspection: (...)
  deleteInspection: (...)
  addAttachment: (...)
  syncNow: ()
  resolveConflict: (...)
  refreshStorageStats: ()
  clearSyncedData: ()
}
```

**Event Listeners**:
- `window.online`: Trigger auto-sync
- `window.offline`: Update network status
- `connection.change`: Update connection type (Network Information API)

**Auto-Sync Triggers**:
1. Coming online from offline
2. After creating/updating inspection
3. Periodic check (every 30 seconds)
4. User-initiated sync button

### 5. Network Detection

**Implementation**:
```typescript
export const getNetworkStatus = (): NetworkStatus => {
  const online = navigator.onLine;
  const connection = navigator.connection || 
                     navigator.mozConnection || 
                     navigator.webkitConnection;
  
  return {
    online,
    type: connection?.type,              // 'wifi', 'cellular', '4g'
    effectiveType: connection?.effectiveType,  // 'slow-2g', '2g', '3g', '4g'
    downlink: connection?.downlink,      // Mbps
    rtt: connection?.rtt,                // Round trip time (ms)
    saveData: connection?.saveData       // Data saver mode
  };
};
```

**Sync Conditions**:
```typescript
export const canSync = (): boolean => {
  const network = getNetworkStatus();
  
  if (!network.online) return false;
  
  // Don't sync on slow connections with data saver
  if (network.saveData && network.effectiveType === 'slow-2g') {
    return false;
  }
  
  return true;
};
```

---

## API Reference

### IndexedDB Utility (`utils/indexedDB.ts`)

#### Inspection Operations

##### `saveInspection(inspection: OfflineInspection): Promise<void>`
Saves or updates an inspection in IndexedDB.

**Example**:
```typescript
await IndexedDB.saveInspection({
  id: 'insp-123',
  localId: 'insp-123',
  projectId: 'proj-1',
  inspectionType: 'general',
  data: {
    title: 'Foundation Inspection',
    location: 'Site A',
    inspector: 'John Doe',
    scheduledDate: new Date(),
    checklist: []
  },
  syncStatus: 'pending',
  syncRetryCount: 0,
  offlineMetadata: {...},
  attachments: [],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

##### `getInspection(localId: string): Promise<OfflineInspection | undefined>`
Retrieves inspection by local ID.

##### `getAllInspections(): Promise<OfflineInspection[]>`
Retrieves all inspections.

##### `getInspectionsByProject(projectId: string): Promise<OfflineInspection[]>`
Retrieves inspections filtered by project.

##### `getInspectionsByStatus(status: SyncStatus): Promise<OfflineInspection[]>`
Retrieves inspections filtered by sync status.

**Example**:
```typescript
const pending = await IndexedDB.getInspectionsByStatus('pending');
const synced = await IndexedDB.getInspectionsByStatus('synced');
```

##### `updateInspection(localId: string, updates: Partial<OfflineInspection>): Promise<void>`
Updates specific fields of an inspection.

##### `deleteInspection(localId: string): Promise<void>`
Deletes an inspection.

#### Attachment Operations

##### `saveAttachment(attachment: OfflineAttachment): Promise<void>`
Saves file blob to IndexedDB.

**Example**:
```typescript
await IndexedDB.saveAttachment({
  id: 'attach-456',
  inspectionId: 'insp-123',
  blob: photoBlob,
  fileName: 'foundation-crack.jpg',
  mimeType: 'image/jpeg',
  uploaded: false,
  createdAt: new Date()
});
```

##### `getAttachment(id: string): Promise<OfflineAttachment | undefined>`
Retrieves attachment blob.

##### `getAttachmentsByInspection(inspectionId: string): Promise<OfflineAttachment[]>`
Retrieves all attachments for an inspection.

##### `getPendingAttachments(): Promise<OfflineAttachment[]>`
Retrieves attachments not yet uploaded.

##### `updateAttachmentUploadStatus(id: string, uploaded: boolean, progress?: number): Promise<void>`
Updates upload status and progress.

#### Sync Queue Operations

##### `addToSyncQueue(item: SyncQueueItem): Promise<void>`
Adds item to sync queue.

##### `getPendingSyncQueue(): Promise<SyncQueueItem[]>`
Retrieves pending items sorted by priority (high to low).

##### `updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void>`
Updates sync queue item.

##### `removeFromSyncQueue(id: string): Promise<void>`
Removes item from queue.

##### `clearCompletedSyncQueue(): Promise<void>`
Removes all synced items from queue.

#### Conflict Operations

##### `saveConflict(conflict: SyncConflict): Promise<void>`
Creates conflict record.

##### `getPendingConflicts(): Promise<SyncConflict[]>`
Retrieves unresolved conflicts.

##### `resolveConflict(id: string, resolvedData: any, resolvedBy: string): Promise<void>`
Marks conflict as resolved.

#### Metadata & Storage

##### `saveMetadata(key: string, value: any): Promise<void>`
Stores metadata (deviceId, lastSync, etc.).

##### `getMetadata(key: string): Promise<any>`
Retrieves metadata value.

##### `getStorageStats(): Promise<OfflineStorageMetadata>`
Gets comprehensive storage statistics.

**Returns**:
```typescript
{
  version: "1",
  lastSync: Date,
  deviceId: "device-abc123",
  databases: [
    { name: "inspections", recordCount: 45, size: 0 },
    { name: "attachments", recordCount: 120, size: 0 },
    ...
  ],
  pendingSync: 12,
  failedSync: 2,
  conflicts: 1,
  storageQuota: {
    usage: 52428800,      // 50 MB
    quota: 2147483648,    // 2 GB
    percentage: 2.4
  }
}
```

##### `clearAllData(): Promise<void>`
Clears all data from all stores (use with caution).

### Sync Service (`api/syncService.ts`)

##### `createOfflineInspection(projectId, inspectionType, data): Promise<OfflineInspection>`
Creates new inspection and queues for sync.

##### `updateOfflineInspection(localId, updates): Promise<void>`
Updates inspection and queues for sync.

##### `addAttachment(inspectionId, file): Promise<string>`
Adds file attachment and queues for upload.

**Returns**: Attachment ID

##### `syncNow(): Promise<void>`
Triggers immediate synchronization.

##### `getSyncStatus(): Promise<SyncStatus>`
Gets current sync status.

**Returns**:
```typescript
{
  pending: 5,
  failed: 1,
  conflicts: 0,
  inProgress: false,
  currentTask: null,
  lastSync: Date,
  storageUsage: {...}
}
```

##### `resolveConflictManually(conflictId, resolution, mergedData?): Promise<void>`
Manually resolves conflict.

**Parameters**:
- `conflictId`: Conflict ID
- `resolution`: 'local' | 'remote' | 'merge'
- `mergedData`: Required if resolution is 'merge'

##### `clearSyncedData(): Promise<void>`
Removes synced inspections from local storage (keeps pending).

### Offline Context Hook (`useOffline()`)

**Usage**:
```typescript
import { useOffline } from '@/contexts/OfflineContext';

function MyComponent() {
  const {
    isOnline,
    pendingInspections,
    syncStatus,
    createInspection,
    syncNow
  } = useOffline();
  
  // ... use offline functionality
}
```

**Available Properties & Methods**:
- `isOnline: boolean` - Current network status
- `networkStatus: NetworkStatus | null` - Detailed network info
- `offlineInspections: OfflineInspection[]` - All inspections
- `pendingInspections: OfflineInspection[]` - Awaiting sync
- `syncedInspections: OfflineInspection[]` - Successfully synced
- `conflictedInspections: OfflineInspection[]` - Conflicted
- `syncStatus: {...}` - Sync queue status
- `storageMetadata: OfflineStorageMetadata | null` - Storage stats
- `conflicts: SyncConflict[]` - Pending conflicts
- `createInspection(...)` - Create inspection
- `updateInspection(...)` - Update inspection
- `deleteInspection(...)` - Delete inspection
- `addAttachment(...)` - Add file
- `syncNow()` - Trigger sync
- `resolveConflict(...)` - Resolve conflict
- `refreshStorageStats()` - Update storage info
- `clearSyncedData()` - Clean up storage

---

## Testing Guide

### Manual Testing

#### 1. Offline Mode Testing
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Network tab → Throttling dropdown → Offline
3. Create inspection
4. Verify saved to IndexedDB:
   - Application tab → IndexedDB → NataCarePM_Offline
5. Go back online
6. Verify auto-sync
```

#### 2. Service Worker Testing
```bash
# Chrome DevTools
1. Application tab → Service Workers
2. Verify registered and activated
3. Check "Offline" checkbox
4. Reload page → should still load (app shell cached)
5. Inspect Cache Storage:
   - workbox-precache-v2-* (app shell)
   - firebase-storage-cache
   - firestore-api-cache
```

#### 3. Conflict Testing
```bash
# Scenario: Two devices editing same inspection
Device A (Offline):
1. Edit inspection "Foundation Check"
2. Change location to "Site B"
3. Go offline
4. Save changes (queued)

Device B (Online):
5. Edit same inspection
6. Change location to "Site C"
7. Save (synced immediately)

Device A (Back Online):
8. Trigger sync
9. Conflict detected
10. Verify conflict resolution UI shows both versions
11. User selects resolution (local/remote/merge)
12. Verify final state in Firebase
```

### Storage Quota Testing
```typescript
// Test storage limits
async function testStorageQuota() {
  const stats = await IndexedDB.getStorageStats();
  console.log('Usage:', stats.storageQuota.usage);
  console.log('Quota:', stats.storageQuota.quota);
  console.log('Percentage:', stats.storageQuota.percentage);
  
  if (stats.storageQuota.percentage > 80) {
    alert('Storage almost full, consider cleanup');
  }
}
```

### Performance Testing
```typescript
// Measure sync performance
const startTime = performance.now();
await syncService.syncNow();
const duration = performance.now() - startTime;
console.log(`Sync completed in ${duration}ms`);

// Recommended: < 5 seconds for 50 items
```

---

## Deployment

### Pre-Deployment Checklist

- [ ] Service Worker registered and active
- [ ] IndexedDB schema version matches production
- [ ] PWA manifest configured
- [ ] Icons generated (192x192, 512x512)
- [ ] Offline page designed
- [ ] Cache strategies optimized
- [ ] Sync retry limits configured
- [ ] Conflict resolution tested
- [ ] Storage quota warnings implemented

### Build Configuration

**package.json**:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Build Process**:
```bash
npm run build

# Output:
# dist/
#   ├── index.html
#   ├── assets/
#   ├── sw.js (service worker)
#   ├── manifest.webmanifest
#   └── workbox-*.js
```

### Firebase Deployment

**firebase.json**:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Service-Worker-Allowed",
            "value": "/"
          },
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

**Deploy**:
```bash
npm run build
firebase deploy --only hosting
```

### Post-Deployment Verification

**Lighthouse PWA Audit**:
```bash
# Chrome DevTools → Lighthouse
- Fast and reliable (offline works)
- Installable (manifest valid)
- PWA Optimized (90+ score)
```

**PWA Checklist**:
- [ ] HTTPS enabled
- [ ] Service Worker active
- [ ] Manifest valid
- [ ] Icons present
- [ ] Offline page works
- [ ] Install prompt appears
- [ ] Add to Home Screen works

---

## Troubleshooting

### Common Issues

#### 1. Service Worker Not Registering

**Symptoms**: No offline functionality, no caching

**Causes**:
- HTTPS not enabled (required except localhost)
- Service Worker file not found
- Browser doesn't support Service Workers

**Solutions**:
```typescript
// Check browser support
if ('serviceWorker' in navigator) {
  console.log('Service Workers supported');
} else {
  console.error('Service Workers NOT supported');
}

// Check registration
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    console.log('SW registered:', reg);
  } else {
    console.error('SW not registered');
  }
});

// Force update
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update());
});
```

#### 2. IndexedDB Quota Exceeded

**Symptoms**: "QuotaExceededError" when saving

**Solutions**:
```typescript
// Check quota
const stats = await IndexedDB.getStorageStats();
if (stats.storageQuota.percentage > 90) {
  // Clean up synced data
  await syncService.clearSyncedData();
  
  // Or request persistent storage
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    console.log('Persistent storage:', granted);
  }
}
```

#### 3. Sync Not Triggering

**Symptoms**: Data stuck in pending state

**Debug**:
```typescript
// Check network
const network = getNetworkStatus();
console.log('Online:', network.online);
console.log('Can sync:', canSync());

// Check sync queue
const queue = await IndexedDB.getPendingSyncQueue();
console.log('Pending items:', queue.length);

// Check sync status
const status = await syncService.getSyncStatus();
console.log('Sync in progress:', status.inProgress);

// Manual trigger
await syncService.syncNow();
```

#### 4. Conflicts Not Resolving

**Symptoms**: Inspections stuck in conflict state

**Debug**:
```typescript
// List conflicts
const conflicts = await IndexedDB.getPendingConflicts();
console.log('Conflicts:', conflicts);

// Manual resolution
for (const conflict of conflicts) {
  await syncService.resolveConflictManually(
    conflict.id,
    'latest_wins'
  );
}
```

#### 5. Attachments Not Uploading

**Symptoms**: Photos pending upload indefinitely

**Debug**:
```typescript
// Check pending attachments
const pending = await IndexedDB.getPendingAttachments();
console.log('Pending uploads:', pending.length);

// Check file sizes
pending.forEach(att => {
  const sizeMB = att.blob.size / 1024 / 1024;
  console.log(`${att.fileName}: ${sizeMB.toFixed(2)} MB`);
  
  if (sizeMB > 25) {
    console.warn('File too large, Firebase limit is 25MB');
  }
});
```

### Debugging Tools

**IndexedDB Inspector**:
```
Chrome DevTools → Application → IndexedDB → NataCarePM_Offline
- View all stores
- Inspect records
- Delete individual records
- Clear store
```

**Service Worker Inspector**:
```
Chrome DevTools → Application → Service Workers
- View registration status
- Force update
- Unregister
- Inspect cache storage
```

**Network Throttling**:
```
Chrome DevTools → Network → Throttling
- Offline
- Slow 3G
- Fast 3G
- Custom (configure speed)
```

---

## Best Practices

### 1. Storage Management
- Clear synced data periodically
- Compress images before storing
- Set reasonable retention policies
- Monitor quota usage

### 2. Sync Strategy
- Prioritize critical operations
- Batch operations to reduce requests
- Implement exponential backoff for retries
- Handle conflicts gracefully

### 3. User Experience
- Show sync status clearly
- Indicate offline mode prominently
- Provide conflict resolution UI
- Allow manual sync trigger
- Cache frequently used data

### 4. Performance
- Limit attachment sizes (< 10MB recommended)
- Process sync queue in batches
- Use web workers for heavy operations
- Optimize IndexedDB queries with indexes

### 5. Security
- Encrypt sensitive data in IndexedDB
- Validate data before sync
- Implement user authentication for sync
- Clear local data on logout

---

## Metrics & Monitoring

### Key Performance Indicators

**Sync Metrics**:
- Average sync time
- Sync success rate
- Conflict frequency
- Retry rate

**Storage Metrics**:
- Storage usage percentage
- Record count per store
- Attachment sizes
- Quota warnings

**User Metrics**:
- Offline usage frequency
- Inspection completion rate
- Photo capture rate
- Conflict resolution time

### Monitoring Implementation

```typescript
// Log sync performance
const syncMetrics = {
  startTime: Date.now(),
  itemsProcessed: 0,
  itemsFailed: 0,
  totalTime: 0
};

await syncService.syncNow();

syncMetrics.totalTime = Date.now() - syncMetrics.startTime;

// Send to analytics
analytics.logEvent('offline_sync_completed', syncMetrics);
```

---

## Support & Resources

### Documentation
- [IndexedDB API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

### Tools
- Chrome DevTools
- Lighthouse
- Workbox CLI
- Firebase Console

### Contact
For technical support, contact the development team.

---

**Document Version**: 1.0.0  
**Last Updated**: October 20, 2024  
**Author**: NataCare Development Team
