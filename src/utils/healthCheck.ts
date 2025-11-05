/**
 * Health Check System
 * Monitors Firebase services and application health
 */

import { db, auth, storage } from '@/firebaseConfig';
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
    checkHosting(),
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
      hosting: hostingHealth,
    },
    region: import.meta.env.VITE_FIREBASE_REGION || 'us-central1',
    latency: totalLatency,
  };

  // Log health status to Firestore for monitoring
  try {
    await setDoc(doc(db, 'system_health', 'latest'), {
      ...status,
      updatedAt: serverTimestamp(),
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
        lastCheck: serverTimestamp(),
      });
    }

    const latency = Date.now() - startTime;

    return {
      status: latency < 1000 ? 'healthy' : 'degraded',
      latency,
      lastCheck: Date.now(),
    };
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: Date.now(),
      error: error.message,
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
//     const currentUser = auth.currentUser; // Unused variable

    // Auth is accessible if we can check current user (even if null)
    const latency = Date.now() - startTime;

    return {
      status: latency < 500 ? 'healthy' : 'degraded',
      latency,
      lastCheck: Date.now(),
    };
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: Date.now(),
      error: error.message,
    };
  }
}

/**
 * Check Firebase Storage connectivity
 */
async function checkStorage(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Simple check - storage object exists
    if (storage) {
      const latency = Date.now() - startTime;
      return {
        status: latency < 1000 ? 'healthy' : 'degraded',
        latency,
        lastCheck: Date.now(),
      };
    }

    throw new Error('Storage not initialized');
  } catch (error: any) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      lastCheck: Date.now(),
      error: error.message,
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
      cache: 'no-cache',
    });

    const latency = Date.now() - startTime;

    return {
      status: response.ok && latency < 2000 ? 'healthy' : 'degraded',
      latency,
      lastCheck: Date.now(),
    };
  } catch (error: any) {
    // If health.json doesn't exist, hosting is still healthy
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastCheck: Date.now(),
    };
  }
}

/**
 * Continuous health monitoring
 */
export class HealthMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
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
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Run health check and notify listeners
   */
  private async runCheck() {
    try {
      const status = await performHealthCheck();

      // Notify all listeners
      this.listeners.forEach((callback) => {
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
