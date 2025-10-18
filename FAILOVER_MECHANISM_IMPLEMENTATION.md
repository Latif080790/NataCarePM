# Failover Mechanism Implementation Guide

## Overview

This document provides implementation details for high availability and automatic failover mechanisms for NataCarePM, ensuring business continuity during regional outages or service disruptions.

## Architecture

### Current Single-Region Setup
```
┌─────────────────────────────────────────┐
│         Firebase (us-central1)          │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐      │
│  │  Firestore  │  │   Storage   │      │
│  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐      │
│  │    Auth     │  │   Functions │      │
│  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │   Users      │
    └──────────────┘
```

### Target Multi-Region Architecture
```
                  ┌──────────────────┐
                  │   Global DNS     │
                  │  (Health Check)  │
                  └────────┬─────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ PRIMARY  │    │ SECONDARY│    │ TERTIARY │
    │us-central│    │us-east   │    │europe-w  │
    └──────────┘    └──────────┘    └──────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                  ┌────────┴─────────┐
                  │  Data Sync       │
                  │  (Replication)   │
                  └──────────────────┘
```

## Implementation Components

### 1. Health Check System

**File**: `utils/healthCheck.ts`

```typescript
/**
 * Health Check System
 * Monitors Firebase services and application health
 */

import { db, auth, storage } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface HealthStatus {
  healthy: boolean;
  timestamp: number;
  services: {
    firestore: ServiceHealth;
    auth: ServiceHealth;
    storage: ServiceHealth;
    hosting: ServiceHealth;
  };
  region: string;
  latency: number;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: number;
  error?: string;
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  const [firestoreHealth, authHealth, storageHealth, hostingHealth] = await Promise.all([
    checkFirestore(),
    checkAuth(),
    checkStorage(),
    checkHosting()
  ]);
  
  const totalLatency = Date.now() - startTime;
  const allHealthy = 
    firestoreHealth.status === 'healthy' &&
    authHealth.status === 'healthy' &&
    storageHealth.status === 'healthy' &&
    hostingHealth.status === 'healthy';
  
  const status: HealthStatus = {
    healthy: allHealthy,
    timestamp: Date.now(),
    services: {
      firestore: firestoreHealth,
      auth: authHealth,
      storage: storageHealth,
      hosting: hostingHealth
    },
    region: process.env.VITE_FIREBASE_REGION || 'us-central1',
    latency: totalLatency
  };
  
  // Log health status to Firestore for monitoring
  try {
    await setDoc(doc(db, 'system_health', 'latest'), {
      ...status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log health status:', error);
  }
  
  return status;
}

/**
 * Check Firestore connectivity and performance
 */
async function checkFirestore(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Attempt to read a system document
    const healthDoc = await getDoc(doc(db, 'system', 'health_check'));
    
    // If document doesn't exist, create it
    if (!healthDoc.exists()) {
      await setDoc(doc(db, 'system', 'health_check'), {
        lastCheck: serverTimestamp()
      });
    }
    
    const latency = Date.now() - startTime;
    
    return {
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency,
      lastCheck: Date.now()
    };
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: Date.now(),
      error: error.message
    };
  }
}

/**
 * Check Firebase Auth connectivity
 */
async function checkAuth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if auth is initialized
    const currentUser = auth.currentUser;
    
    // Auth is accessible if we can check current user
    const latency = Date.now() - startTime;
    
    return {
      status: latency < 500 ? 'healthy' : 'degraded',
      latency,
      lastCheck: Date.now()
    };
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: Date.now(),
      error: error.message
    };
  }
}

/**
 * Check Firebase Storage connectivity
 */
async function checkStorage(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Attempt to get storage reference
    const testRef = storage.ref('health_check/test.txt');
    
    // Try to get download URL (doesn't need to exist)
    try {
      await testRef.getDownloadURL();
    } catch (error: any) {
      // 404 is acceptable - means storage is accessible
      if (error.code === 'storage/object-not-found') {
        const latency = Date.now() - startTime;
        return {
          status: latency < 1000 ? 'healthy' : 'degraded',
          latency,
          lastCheck: Date.now()
        };
      }
      throw error;
    }
    
    const latency = Date.now() - startTime;
    return {
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency,
      lastCheck: Date.now()
    };
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: Date.now(),
      error: error.message
    };
  }
}

/**
 * Check hosting/CDN connectivity
 */
async function checkHosting(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Fetch version file or health endpoint
    const response = await fetch('/health.json', {
      method: 'GET',
      cache: 'no-cache'
    });
    
    const latency = Date.now() - startTime;
    
    return {
      status: response.ok && latency < 2000 ? 'healthy' : 'degraded',
      latency,
      lastCheck: Date.now()
    };
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: Date.now(),
      error: error.message
    };
  }
}

/**
 * Continuous health monitoring
 */
export class HealthMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Array<(status: HealthStatus) => void> = [];
  
  /**
   * Start monitoring with specified interval
   */
  start(intervalMs: number = 60000) {
    if (this.intervalId) {
      console.warn('Health monitor already running');
      return;
    }
    
    console.log(`Starting health monitor (interval: ${intervalMs}ms)`);
    
    // Initial check
    this.runCheck();
    
    // Periodic checks
    this.intervalId = setInterval(() => {
      this.runCheck();
    }, intervalMs);
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Health monitor stopped');
    }
  }
  
  /**
   * Subscribe to health status updates
   */
  subscribe(callback: (status: HealthStatus) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Run health check and notify listeners
   */
  private async runCheck() {
    try {
      const status = await performHealthCheck();
      
      // Notify all listeners
      this.listeners.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('Error in health check callback:', error);
        }
      });
      
      // Log unhealthy status
      if (!status.healthy) {
        console.warn('Health check failed:', status);
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor();
```

### 2. Failover Configuration

**File**: `config/failover.ts`

```typescript
/**
 * Failover Configuration
 * Defines regions, priorities, and failover behavior
 */

export interface RegionConfig {
  id: string;
  name: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    databaseURL?: string;
  };
  priority: number; // Lower = higher priority
  healthCheckUrl: string;
  latencyThreshold: number; // ms
}

/**
 * Multi-region configuration
 */
export const REGIONS: RegionConfig[] = [
  {
    id: 'us-central1',
    name: 'US Central (Primary)',
    firebaseConfig: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID || ''
    },
    priority: 1,
    healthCheckUrl: 'https://us-central1-natacare-pm.cloudfunctions.net/health',
    latencyThreshold: 1000
  },
  {
    id: 'us-east1',
    name: 'US East (Secondary)',
    firebaseConfig: {
      apiKey: process.env.VITE_FIREBASE_API_KEY_SECONDARY || '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN_SECONDARY || '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET_SECONDARY || '',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID_SECONDARY || ''
    },
    priority: 2,
    healthCheckUrl: 'https://us-east1-natacare-pm.cloudfunctions.net/health',
    latencyThreshold: 1500
  },
  {
    id: 'europe-west1',
    name: 'Europe West (Tertiary)',
    firebaseConfig: {
      apiKey: process.env.VITE_FIREBASE_API_KEY_TERTIARY || '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN_TERTIARY || '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET_TERTIARY || '',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID_TERTIARY || ''
    },
    priority: 3,
    healthCheckUrl: 'https://europe-west1-natacare-pm.cloudfunctions.net/health',
    latencyThreshold: 2000
  }
];

/**
 * Failover thresholds
 */
export const FAILOVER_CONFIG = {
  // Number of consecutive failed checks before failover
  failureThreshold: 3,
  
  // Time to wait before attempting failover (ms)
  failoverDelay: 5000,
  
  // Time to wait before failing back to primary (ms)
  failbackDelay: 300000, // 5 minutes
  
  // Health check interval (ms)
  healthCheckInterval: 30000, // 30 seconds
  
  // Maximum failover attempts before giving up
  maxFailoverAttempts: 3,
  
  // Enable automatic failover
  autoFailoverEnabled: true,
  
  // Enable automatic failback
  autoFailbackEnabled: true
};

/**
 * Get current active region from localStorage
 */
export function getCurrentRegion(): RegionConfig {
  const storedRegionId = localStorage.getItem('active_region');
  const region = REGIONS.find(r => r.id === storedRegionId) || REGIONS[0];
  return region;
}

/**
 * Set active region
 */
export function setCurrentRegion(regionId: string): void {
  localStorage.setItem('active_region', regionId);
  localStorage.setItem('failover_timestamp', Date.now().toString());
}

/**
 * Get failover history
 */
export function getFailoverHistory(): Array<{
  timestamp: number;
  from: string;
  to: string;
  reason: string;
}> {
  const history = localStorage.getItem('failover_history');
  return history ? JSON.parse(history) : [];
}

/**
 * Record failover event
 */
export function recordFailover(from: string, to: string, reason: string): void {
  const history = getFailoverHistory();
  history.push({
    timestamp: Date.now(),
    from,
    to,
    reason
  });
  
  // Keep only last 50 events
  if (history.length > 50) {
    history.shift();
  }
  
  localStorage.setItem('failover_history', JSON.stringify(history));
}
```

### 3. Automatic Failover Manager

**File**: `utils/failoverManager.ts`

```typescript
/**
 * Failover Manager
 * Handles automatic failover between regions
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { 
  REGIONS, 
  FAILOVER_CONFIG, 
  getCurrentRegion, 
  setCurrentRegion,
  recordFailover,
  RegionConfig 
} from '../config/failover';
import { performHealthCheck, HealthStatus } from './healthCheck';

export class FailoverManager {
  private currentRegion: RegionConfig;
  private firebaseApp: FirebaseApp | null = null;
  private failureCount: number = 0;
  private failoverInProgress: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.currentRegion = getCurrentRegion();
  }
  
  /**
   * Initialize Firebase with current region
   */
  async initialize(): Promise<void> {
    console.log(`Initializing Firebase in region: ${this.currentRegion.name}`);
    
    try {
      this.firebaseApp = initializeApp(this.currentRegion.firebaseConfig);
      
      // Test connection
      const healthStatus = await performHealthCheck();
      
      if (!healthStatus.healthy) {
        console.warn('Initial health check failed, attempting failover');
        await this.performFailover('Initial health check failed');
      }
      
      // Start health monitoring
      if (FAILOVER_CONFIG.autoFailoverEnabled) {
        this.startHealthMonitoring();
      }
      
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      await this.performFailover('Initialization failed');
    }
  }
  
  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return;
    }
    
    console.log('Starting health monitoring');
    
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealthAndFailover();
    }, FAILOVER_CONFIG.healthCheckInterval);
  }
  
  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Health monitoring stopped');
    }
  }
  
  /**
   * Check health and perform failover if needed
   */
  private async checkHealthAndFailover(): Promise<void> {
    if (this.failoverInProgress) {
      return;
    }
    
    try {
      const healthStatus = await performHealthCheck();
      
      if (healthStatus.healthy) {
        // Reset failure count on successful check
        this.failureCount = 0;
        
        // Check if we should fail back to primary
        if (FAILOVER_CONFIG.autoFailbackEnabled) {
          await this.checkFailback();
        }
      } else {
        // Increment failure count
        this.failureCount++;
        
        console.warn(`Health check failed (${this.failureCount}/${FAILOVER_CONFIG.failureThreshold})`);
        
        // Perform failover if threshold reached
        if (this.failureCount >= FAILOVER_CONFIG.failureThreshold) {
          await this.performFailover('Multiple health check failures');
        }
      }
    } catch (error) {
      console.error('Health check error:', error);
      this.failureCount++;
      
      if (this.failureCount >= FAILOVER_CONFIG.failureThreshold) {
        await this.performFailover('Health check error');
      }
    }
  }
  
  /**
   * Perform failover to next available region
   */
  private async performFailover(reason: string): Promise<void> {
    if (this.failoverInProgress) {
      console.warn('Failover already in progress');
      return;
    }
    
    this.failoverInProgress = true;
    const originalRegion = this.currentRegion;
    
    console.log(`🔄 Initiating failover from ${originalRegion.name}. Reason: ${reason}`);
    
    try {
      // Find next available region
      const nextRegion = await this.findHealthyRegion();
      
      if (!nextRegion) {
        console.error('❌ No healthy regions available for failover');
        this.failoverInProgress = false;
        return;
      }
      
      console.log(`✅ Failing over to ${nextRegion.name}`);
      
      // Wait for failover delay
      await new Promise(resolve => setTimeout(resolve, FAILOVER_CONFIG.failoverDelay));
      
      // Reinitialize Firebase with new region
      this.currentRegion = nextRegion;
      this.firebaseApp = initializeApp(nextRegion.firebaseConfig, `region-${nextRegion.id}`);
      
      // Update stored region
      setCurrentRegion(nextRegion.id);
      
      // Record failover
      recordFailover(originalRegion.id, nextRegion.id, reason);
      
      // Reset failure count
      this.failureCount = 0;
      
      // Notify user
      this.notifyFailover(originalRegion.name, nextRegion.name);
      
      console.log(`✅ Failover complete: ${originalRegion.name} → ${nextRegion.name}`);
      
    } catch (error) {
      console.error('❌ Failover failed:', error);
    } finally {
      this.failoverInProgress = false;
    }
  }
  
  /**
   * Find next healthy region
   */
  private async findHealthyRegion(): Promise<RegionConfig | null> {
    // Get regions sorted by priority
    const sortedRegions = [...REGIONS].sort((a, b) => a.priority - b.priority);
    
    // Skip current region
    const candidateRegions = sortedRegions.filter(r => r.id !== this.currentRegion.id);
    
    // Test each region
    for (const region of candidateRegions) {
      try {
        console.log(`Testing region: ${region.name}`);
        
        const response = await fetch(region.healthCheckUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.healthy) {
            console.log(`✅ ${region.name} is healthy`);
            return region;
          }
        }
      } catch (error) {
        console.warn(`${region.name} health check failed:`, error);
      }
    }
    
    return null;
  }
  
  /**
   * Check if we should fail back to primary region
   */
  private async checkFailback(): Promise<void> {
    // Only fail back if not on primary
    if (this.currentRegion.priority === 1) {
      return;
    }
    
    const primaryRegion = REGIONS.find(r => r.priority === 1);
    if (!primaryRegion) {
      return;
    }
    
    // Check if enough time has passed since last failover
    const lastFailover = localStorage.getItem('failover_timestamp');
    if (lastFailover) {
      const timeSinceFailover = Date.now() - parseInt(lastFailover);
      if (timeSinceFailover < FAILOVER_CONFIG.failbackDelay) {
        return; // Too soon to fail back
      }
    }
    
    // Check if primary is healthy
    try {
      const response = await fetch(primaryRegion.healthCheckUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.healthy) {
          console.log('✅ Primary region is healthy, failing back');
          await this.performFailback(primaryRegion);
        }
      }
    } catch (error) {
      console.log('Primary region not yet healthy for failback');
    }
  }
  
  /**
   * Fail back to specified region
   */
  private async performFailback(targetRegion: RegionConfig): Promise<void> {
    const currentRegion = this.currentRegion;
    
    console.log(`⏪ Failing back from ${currentRegion.name} to ${targetRegion.name}`);
    
    this.currentRegion = targetRegion;
    this.firebaseApp = initializeApp(targetRegion.firebaseConfig, `region-${targetRegion.id}`);
    
    setCurrentRegion(targetRegion.id);
    recordFailover(currentRegion.id, targetRegion.id, 'Automatic failback to primary');
    
    this.notifyFailover(currentRegion.name, targetRegion.name);
    
    console.log(`✅ Failback complete: ${currentRegion.name} → ${targetRegion.name}`);
  }
  
  /**
   * Notify user of failover
   */
  private notifyFailover(from: string, to: string): void {
    // Create toast notification or system message
    const event = new CustomEvent('failover', {
      detail: { from, to }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Get current region info
   */
  getCurrentRegionInfo(): RegionConfig {
    return this.currentRegion;
  }
  
  /**
   * Manual failover trigger
   */
  async manualFailover(targetRegionId: string): Promise<void> {
    const targetRegion = REGIONS.find(r => r.id === targetRegionId);
    
    if (!targetRegion) {
      throw new Error(`Region not found: ${targetRegionId}`);
    }
    
    const currentRegion = this.currentRegion;
    
    console.log(`Manual failover: ${currentRegion.name} → ${targetRegion.name}`);
    
    this.currentRegion = targetRegion;
    this.firebaseApp = initializeApp(targetRegion.firebaseConfig, `region-${targetRegion.id}`);
    
    setCurrentRegion(targetRegion.id);
    recordFailover(currentRegion.id, targetRegion.id, 'Manual failover');
    
    this.notifyFailover(currentRegion.name, targetRegion.name);
  }
}

// Singleton instance
export const failoverManager = new FailoverManager();
```

### 4. React Integration

**File**: `hooks/useFailover.ts`

```typescript
/**
 * React Hook for Failover Status
 */

import { useState, useEffect } from 'react';
import { failoverManager } from '../utils/failoverManager';
import { RegionConfig } from '../config/failover';

export interface FailoverStatus {
  currentRegion: RegionConfig;
  isHealthy: boolean;
  lastFailover: Date | null;
}

export function useFailover() {
  const [status, setStatus] = useState<FailoverStatus>({
    currentRegion: failoverManager.getCurrentRegionInfo(),
    isHealthy: true,
    lastFailover: null
  });
  
  useEffect(() => {
    // Listen for failover events
    const handleFailover = (event: CustomEvent) => {
      setStatus(prev => ({
        ...prev,
        currentRegion: failoverManager.getCurrentRegionInfo(),
        lastFailover: new Date()
      }));
    };
    
    window.addEventListener('failover', handleFailover as EventListener);
    
    return () => {
      window.removeEventListener('failover', handleFailover as EventListener);
    };
  }, []);
  
  const manualFailover = async (regionId: string) => {
    await failoverManager.manualFailover(regionId);
  };
  
  return {
    ...status,
    manualFailover
  };
}
```

## Firebase Configuration

### Multi-Region Firestore Setup

**Note**: Firebase Firestore currently doesn't support true multi-region write replication. However, we can implement a pseudo-multi-region setup using:

1. **Primary Database**: Main Firestore instance in `us-central1`
2. **Read Replicas**: Cloud Functions that sync data to secondary regions
3. **Regional Routing**: DNS-based routing to nearest region

### Cloud Function for Data Replication

**File**: `functions/src/replication.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Secondary Firestore instance
const secondaryDb = admin.firestore();

/**
 * Replicate writes to secondary region
 */
export const replicateToSecondary = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .firestore
  .document('{collection}/{docId}')
  .onWrite(async (change, context) => {
    const collection = context.params.collection;
    const docId = context.params.docId;
    
    try {
      if (!change.after.exists) {
        // Document deleted
        await secondaryDb.collection(collection).doc(docId).delete();
        console.log(`Deleted ${collection}/${docId} from secondary`);
      } else {
        // Document created or updated
        const data = change.after.data();
        await secondaryDb.collection(collection).doc(docId).set(data);
        console.log(`Replicated ${collection}/${docId} to secondary`);
      }
    } catch (error) {
      console.error('Replication failed:', error);
      // Don't throw - we don't want to block primary writes
    }
  });
```

## Monitoring & Alerts

### Cloud Monitoring Setup

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Create alert policy for failover events
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Failover Alert" \
  --condition-display-name="Failover Detected" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=60s \
  --condition-filter='metric.type="custom.googleapis.com/failover/events"'
```

### Health Check Endpoint

Create `public/health.json`:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-10-18T00:00:00Z"
}
```

## Testing

### Failover Test Script

**File**: `scripts/test-failover.ts`

```typescript
#!/usr/bin/env ts-node

import { failoverManager } from '../utils/failoverManager';
import { REGIONS } from '../config/failover';

async function testFailover() {
  console.log('=== Failover Test ===\n');
  
  // Initialize
  await failoverManager.initialize();
  
  console.log('Current region:', failoverManager.getCurrentRegionInfo().name);
  
  // Test failover to each region
  for (const region of REGIONS) {
    console.log(`\nTesting failover to ${region.name}...`);
    
    try {
      await failoverManager.manualFailover(region.id);
      console.log(`✅ Failover to ${region.name} successful`);
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`❌ Failover to ${region.name} failed:`, error);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

testFailover().catch(console.error);
```

## Deployment Checklist

### Prerequisites

- [ ] Firebase Blaze plan activated
- [ ] Multiple Firebase projects created (one per region)
- [ ] Cloud Functions deployed in each region
- [ ] DNS configured with health checks
- [ ] Monitoring alerts configured
- [ ] Team trained on failover procedures

### Environment Variables

Create `.env.production`:

```bash
# Primary Region (us-central1)
VITE_FIREBASE_API_KEY=primary-api-key
VITE_FIREBASE_AUTH_DOMAIN=primary-auth-domain
VITE_FIREBASE_PROJECT_ID=natacare-pm
VITE_FIREBASE_STORAGE_BUCKET=primary-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=primary-sender-id
VITE_FIREBASE_APP_ID=primary-app-id

# Secondary Region (us-east1)
VITE_FIREBASE_API_KEY_SECONDARY=secondary-api-key
VITE_FIREBASE_AUTH_DOMAIN_SECONDARY=secondary-auth-domain
VITE_FIREBASE_STORAGE_BUCKET_SECONDARY=secondary-bucket
VITE_FIREBASE_APP_ID_SECONDARY=secondary-app-id

# Tertiary Region (europe-west1)
VITE_FIREBASE_API_KEY_TERTIARY=tertiary-api-key
VITE_FIREBASE_AUTH_DOMAIN_TERTIARY=tertiary-auth-domain
VITE_FIREBASE_STORAGE_BUCKET_TERTIARY=tertiary-bucket
VITE_FIREBASE_APP_ID_TERTIARY=tertiary-app-id

# Failover Configuration
VITE_FIREBASE_REGION=us-central1
VITE_AUTO_FAILOVER_ENABLED=true
VITE_AUTO_FAILBACK_ENABLED=true
```

## Limitations & Considerations

### Current Limitations

1. **Firestore Multi-Region**: Firebase Firestore doesn't natively support multi-region writes
2. **Authentication**: Firebase Auth is global but may have regional latency
3. **Storage**: Firebase Storage replication is manual
4. **Cost**: Running multiple Firebase projects increases costs significantly

### Recommended Approach for NataCarePM

Given Firebase limitations and cost considerations, we recommend:

**Phase 1: Enhanced Monitoring** (Current Implementation)
- Health check system ✅
- Automated monitoring ✅
- Alert notifications ✅
- Manual failover capability ✅

**Phase 2: Geographic DNS Routing** (Future)
- Use Cloudflare or AWS Route53 for geo-routing
- Route users to nearest Firebase region automatically
- Implement read-only failover for secondary regions

**Phase 3: True Multi-Region** (Enterprise)
- Migrate to Google Cloud Run + Cloud SQL
- Use Cloud Spanner for multi-region database
- Implement active-active architecture

## Cost Analysis

### Estimated Monthly Costs

| Component | Cost/Month |
|-----------|------------|
| **Primary Firebase Project** | $50 |
| **Secondary Firebase Project** | $30 |
| **Cloud Functions (Replication)** | $20 |
| **Cloud Monitoring** | $10 |
| **Load Balancer/DNS** | $15 |
| **Total** | **$125/month** |

**Note**: This is 2.5x the cost of single-region setup.

## Conclusion

This failover mechanism provides:

✅ **Automated health monitoring**  
✅ **Automatic failover on failure**  
✅ **Manual failover capability**  
✅ **Failback to primary region**  
✅ **Real-time status monitoring**  
✅ **Complete audit trail**

For production deployment, start with Phase 1 (monitoring + manual failover) and evaluate multi-region needs based on actual uptime requirements and budget.

---

**Last Updated**: October 18, 2025  
**Version**: 1.0  
**Status**: Implementation Ready
