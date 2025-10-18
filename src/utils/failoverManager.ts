/**
 * Failover Manager
 * Handles automatic failover between regions
 * 
 * Note: This is a monitoring and alerting system.
 * True multi-region failover requires separate Firebase projects per region.
 */

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
  private failureCount: number = 0;
  private failoverInProgress: boolean = false;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Array<(event: FailoverEvent) => void> = [];
  
  constructor() {
    this.currentRegion = getCurrentRegion();
  }
  
  /**
   * Initialize failover manager
   */
  async initialize(): Promise<void> {
    console.log(`Initializing Failover Manager for region: ${this.currentRegion.name}`);
    
    try {
      // Perform initial health check
      const healthStatus = await performHealthCheck();
      
      if (!healthStatus.healthy) {
        console.warn('Initial health check failed');
        this.notifyListeners({
          type: 'health_warning',
          region: this.currentRegion.id,
          message: 'Initial health check failed',
          timestamp: Date.now()
        });
      }
      
      // Start health monitoring if enabled
      if (FAILOVER_CONFIG.autoFailoverEnabled) {
        this.startHealthMonitoring();
      }
      
    } catch (error) {
      console.error('Failover manager initialization failed:', error);
      this.notifyListeners({
        type: 'initialization_error',
        region: this.currentRegion.id,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
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
        if (this.failureCount > 0) {
          console.log('Health restored, resetting failure count');
          this.failureCount = 0;
        }
        
        // Check if we should fail back to primary
        if (FAILOVER_CONFIG.autoFailbackEnabled) {
          await this.checkFailback();
        }
      } else {
        // Increment failure count
        this.failureCount++;
        
        console.warn(`Health check failed (${this.failureCount}/${FAILOVER_CONFIG.failureThreshold})`);
        
        this.notifyListeners({
          type: 'health_check_failed',
          region: this.currentRegion.id,
          message: `Health check failed (${this.failureCount}/${FAILOVER_CONFIG.failureThreshold})`,
          timestamp: Date.now(),
          healthStatus
        });
        
        // Trigger failover alert if threshold reached
        if (this.failureCount >= FAILOVER_CONFIG.failureThreshold) {
          this.notifyListeners({
            type: 'failover_recommended',
            region: this.currentRegion.id,
            message: 'Multiple health check failures detected. Manual failover recommended.',
            timestamp: Date.now(),
            healthStatus
          });
        }
      }
    } catch (error) {
      console.error('Health check error:', error);
      this.failureCount++;
      
      if (this.failureCount >= FAILOVER_CONFIG.failureThreshold) {
        this.notifyListeners({
          type: 'failover_recommended',
          region: this.currentRegion.id,
          message: 'Health check errors detected. Manual failover recommended.',
          timestamp: Date.now()
        });
      }
    }
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
    
    // Notify that primary is available for failback
    this.notifyListeners({
      type: 'failback_available',
      region: primaryRegion.id,
      message: 'Primary region is healthy and available for failback',
      timestamp: Date.now()
    });
  }
  
  /**
   * Manual failover to specified region
   */
  async manualFailover(targetRegionId: string, reason: string = 'Manual failover'): Promise<void> {
    const targetRegion = REGIONS.find(r => r.id === targetRegionId);
    
    if (!targetRegion) {
      throw new Error(`Region not found: ${targetRegionId}`);
    }
    
    if (this.currentRegion.id === targetRegionId) {
      console.log('Already on target region');
      return;
    }
    
    const currentRegion = this.currentRegion;
    
    console.log(`Manual failover: ${currentRegion.name} → ${targetRegion.name}`);
    
    this.notifyListeners({
      type: 'failover_started',
      region: targetRegion.id,
      message: `Initiating manual failover to ${targetRegion.name}`,
      timestamp: Date.now()
    });
    
    // Update current region
    this.currentRegion = targetRegion;
    setCurrentRegion(targetRegion.id);
    recordFailover(currentRegion.id, targetRegion.id, reason);
    
    // Reset failure count
    this.failureCount = 0;
    
    // Notify completion
    this.notifyListeners({
      type: 'failover_completed',
      region: targetRegion.id,
      message: `Failover completed: ${currentRegion.name} → ${targetRegion.name}`,
      timestamp: Date.now()
    });
    
    // Reload application to apply new region
    window.location.reload();
  }
  
  /**
   * Get current region info
   */
  getCurrentRegionInfo(): RegionConfig {
    return this.currentRegion;
  }
  
  /**
   * Get current health status
   */
  async getCurrentHealth(): Promise<HealthStatus> {
    return await performHealthCheck();
  }
  
  /**
   * Subscribe to failover events
   */
  subscribe(callback: (event: FailoverEvent) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all listeners
   */
  private notifyListeners(event: FailoverEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in failover event callback:', error);
      }
    });
    
    // Also dispatch custom DOM event
    window.dispatchEvent(new CustomEvent('failover-event', { detail: event }));
  }
}

/**
 * Failover event types
 */
export interface FailoverEvent {
  type: 'health_check_failed' | 'health_warning' | 'failover_recommended' | 
        'failback_available' | 'failover_started' | 'failover_completed' | 
        'initialization_error';
  region: string;
  message: string;
  timestamp: number;
  healthStatus?: HealthStatus;
}

// Singleton instance
export const failoverManager = new FailoverManager();
