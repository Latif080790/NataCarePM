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
 * Note: For production, configure separate Firebase projects per region
 */
export const REGIONS: RegionConfig[] = [
  {
    id: 'us-central1',
    name: 'US Central (Primary)',
    firebaseConfig: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    },
    priority: 1,
    healthCheckUrl:
      import.meta.env.VITE_FIREBASE_HEALTH_CHECK_URL ||
      'https://us-central1-natacare-pm.cloudfunctions.net/health',
    latencyThreshold: 1000,
  },
  {
    id: 'us-east1',
    name: 'US East (Secondary)',
    firebaseConfig: {
      apiKey:
        import.meta.env.VITE_FIREBASE_API_KEY_SECONDARY ||
        import.meta.env.VITE_FIREBASE_API_KEY ||
        '',
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_SECONDARY ||
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
        '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_SECONDARY ||
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
        '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId:
        import.meta.env.VITE_FIREBASE_APP_ID_SECONDARY ||
        import.meta.env.VITE_FIREBASE_APP_ID ||
        '',
    },
    priority: 2,
    healthCheckUrl:
      import.meta.env.VITE_FIREBASE_HEALTH_CHECK_URL_SECONDARY ||
      'https://us-east1-natacare-pm.cloudfunctions.net/health',
    latencyThreshold: 1500,
  },
  {
    id: 'europe-west1',
    name: 'Europe West (Tertiary)',
    firebaseConfig: {
      apiKey:
        import.meta.env.VITE_FIREBASE_API_KEY_TERTIARY ||
        import.meta.env.VITE_FIREBASE_API_KEY ||
        '',
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_TERTIARY ||
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
        '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET_TERTIARY ||
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
        '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId:
        import.meta.env.VITE_FIREBASE_APP_ID_TERTIARY || import.meta.env.VITE_FIREBASE_APP_ID || '',
    },
    priority: 3,
    healthCheckUrl:
      import.meta.env.VITE_FIREBASE_HEALTH_CHECK_URL_TERTIARY ||
      'https://europe-west1-natacare-pm.cloudfunctions.net/health',
    latencyThreshold: 2000,
  },
];

/**
 * Failover thresholds and configuration
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
  autoFailoverEnabled: import.meta.env.VITE_AUTO_FAILOVER_ENABLED === 'true',

  // Enable automatic failback
  autoFailbackEnabled: import.meta.env.VITE_AUTO_FAILBACK_ENABLED === 'true',
};

/**
 * Get current active region from localStorage
 */
export function getCurrentRegion(): RegionConfig {
  const storedRegionId = localStorage.getItem('active_region');
  const region = REGIONS.find((r) => r.id === storedRegionId) || REGIONS[0];
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
    reason,
  });

  // Keep only last 50 events
  if (history.length > 50) {
    history.shift();
  }

  localStorage.setItem('failover_history', JSON.stringify(history));
}
