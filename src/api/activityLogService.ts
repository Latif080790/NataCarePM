/**
 * Activity Log Service
 * Comprehensive user activity tracking and logging system
 */

import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { logger } from '@/utils/logger';
import type { 
  UserActivityLog,
  UserActivityAction,
  ActivityCategory,
  ActivityLogFilter,
  ActivityLogResponse,
  DeviceInfo,
  GeoLocation
} from '@/types';

// Collection name
const ACTIVITY_LOGS_COLLECTION = 'user_activity_logs';

/**
 * Get device information from user agent
 */
const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  // Detect OS
  let os = 'Unknown';
  let osVersion = '';
  
  if (/Windows NT 10/i.test(ua)) {
    os = 'Windows';
    osVersion = '10';
  } else if (/Windows NT 6.3/i.test(ua)) {
    os = 'Windows';
    osVersion = '8.1';
  } else if (/Windows NT 6.2/i.test(ua)) {
    os = 'Windows';
    osVersion = '8';
  } else if (/Windows NT 6.1/i.test(ua)) {
    os = 'Windows';
    osVersion = '7';
  } else if (/Mac OS X/i.test(ua)) {
    os = 'macOS';
    const match = ua.match(/Mac OS X ([\d_]+)/);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/Android/i.test(ua)) {
    os = 'Android';
    const match = ua.match(/Android ([\d.]+)/);
    if (match) osVersion = match[1];
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
    const match = ua.match(/OS ([\d_]+)/);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
    const match = ua.match(/Edg\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (/Chrome/i.test(ua)) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/([\d.]+)/);
    if (match) browserVersion = match[1];
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
    const match = ua.match(/Version\/([\d.]+)/);
    if (match) browserVersion = match[1];
  }

  // Get screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  // Generate device ID (simple hash of UA + screen)
  const deviceId = btoa(`${ua}-${screenResolution}`).substring(0, 32);

  return {
    deviceId,
    deviceType,
    os,
    osVersion,
    browser,
    browserVersion,
    userAgent: ua,
    screenResolution,
    isTrusted: true // Can be enhanced with device trust logic
  };
};

/**
 * Get client IP address (requires backend API or third-party service)
 */
const getClientIP = async (): Promise<string> => {
  try {
    // In production, you'd call your backend API to get the real IP
    // For now, we'll use a public IP lookup service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    logger.warn('Failed to get client IP', error);
    return 'Unknown';
  }
};

/**
 * Get geo location from IP address (requires geolocation service)
 */
const getGeoLocation = async (ipAddress: string): Promise<GeoLocation | undefined> => {
  try {
    // In production, use a geolocation service like ipstack, ipapi, or MaxMind
    // For now, return undefined
    return undefined;
    
    // Example implementation:
    // const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    // const data = await response.json();
    // return {
    //   country: data.country_name,
    //   countryCode: data.country_code,
    //   region: data.region,
    //   city: data.city,
    //   latitude: data.latitude,
    //   longitude: data.longitude,
    //   timezone: data.timezone
    // };
  } catch (error) {
    logger.warn('Failed to get geo location', error);
    return undefined;
  }
};

/**
 * Generate session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Get or create session ID from sessionStorage
 */
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('activitySessionId');
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('activitySessionId', sessionId);
  }
  
  return sessionId;
};

/**
 * Log user activity
 */
export const logUserActivity = async (params: {
  userId: string;
  action: UserActivityAction;
  category: ActivityCategory;
  description: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  projectId?: string;
  status?: 'success' | 'failure' | 'warning';
  errorMessage?: string;
  errorCode?: string;
  metadata?: { [key: string]: any };
  changes?: Array<{ field: string; oldValue: any; newValue: any; changeType: 'created' | 'updated' | 'deleted' }>;
  securityRelevant?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}): Promise<void> => {
  try {
    const {
      userId,
      action,
      category,
      description,
      resourceType,
      resourceId,
      resourceName,
      projectId,
      status = 'success',
      errorMessage,
      errorCode,
      metadata,
      changes,
      securityRelevant = false,
      riskLevel = 'low'
    } = params;

    // Get device info
    const deviceInfo = getDeviceInfo();
    
    // Get IP address
    const ipAddress = await getClientIP();
    
    // Get geo location
    const location = await getGeoLocation(ipAddress);
    
    // Get session ID
    const sessionId = getSessionId();

    // Create activity log entry
    const activityLog: Omit<UserActivityLog, 'id'> = {
      userId,
      timestamp: new Date(),
      action,
      category,
      description,
      resourceType,
      resourceId,
      resourceName,
      projectId,
      ipAddress,
      deviceInfo,
      location,
      sessionId,
      status,
      errorMessage,
      errorCode,
      metadata,
      changes,
      securityRelevant,
      riskLevel
    };

    // Save to Firestore
    await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
      ...activityLog,
      timestamp: serverTimestamp()
    });

    logger.debug('Activity logged', { userId, action, category });

  } catch (error: any) {
    // Don't throw error - logging failure shouldn't break the app
    logger.error('Failed to log activity', error, { userId: params.userId, action: params.action });
  }
};

/**
 * Get activity logs with filters
 */
export const getActivityLogs = async (
  filter: ActivityLogFilter
): Promise<ActivityLogResponse> => {
  try {
    const {
      userId,
      actions,
      categories,
      dateFrom,
      dateTo,
      status,
      securityRelevantOnly,
      resourceType,
      resourceId,
      projectId,
      limit: limitValue = 50,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = filter;

    logger.info('Fetching activity logs', { userId, limit: limitValue, offset });

    // Build query
    let q = query(collection(db, ACTIVITY_LOGS_COLLECTION));

    // Apply filters
    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    if (actions && actions.length > 0) {
      q = query(q, where('action', 'in', actions.slice(0, 10))); // Firestore 'in' limit is 10
    }

    if (categories && categories.length > 0) {
      q = query(q, where('category', 'in', categories.slice(0, 10)));
    }

    if (dateFrom) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(dateFrom)));
    }

    if (dateTo) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(dateTo)));
    }

    if (status && status.length > 0) {
      q = query(q, where('status', 'in', status));
    }

    if (securityRelevantOnly) {
      q = query(q, where('securityRelevant', '==', true));
    }

    if (resourceType) {
      q = query(q, where('resourceType', '==', resourceType));
    }

    if (resourceId) {
      q = query(q, where('resourceId', '==', resourceId));
    }

    if (projectId) {
      q = query(q, where('projectId', '==', projectId));
    }

    // Apply sorting
    q = query(q, orderBy(sortBy, sortOrder));

    // Apply limit
    q = query(q, firestoreLimit(limitValue + 1)); // +1 to check if there are more

    // Execute query
    const snapshot = await getDocs(q);

    // Process results
    const logs: UserActivityLog[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as UserActivityLog);
    });

    // Check if there are more results
    const hasMore = logs.length > limitValue;
    if (hasMore) {
      logs.pop(); // Remove the extra record
    }

    // Skip offset
    const paginatedLogs = logs.slice(offset);

    logger.info('Activity logs fetched', { count: paginatedLogs.length, hasMore });

    return {
      logs: paginatedLogs,
      totalCount: paginatedLogs.length,
      hasMore,
      filters: filter
    };

  } catch (error: any) {
    logger.error('Error fetching activity logs', error, { filter });
    
    return {
      logs: [],
      totalCount: 0,
      hasMore: false,
      filters: filter
    };
  }
};

/**
 * Get recent activity for user
 */
export const getRecentActivity = async (
  userId: string,
  limitValue: number = 10
): Promise<UserActivityLog[]> => {
  const result = await getActivityLogs({
    userId,
    limit: limitValue,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });

  return result.logs;
};

/**
 * Get security-relevant activity
 */
export const getSecurityActivity = async (
  userId: string,
  days: number = 30
): Promise<UserActivityLog[]> => {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const result = await getActivityLogs({
    userId,
    securityRelevantOnly: true,
    dateFrom,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    limit: 100
  });

  return result.logs;
};

/**
 * Get activity summary for user
 */
export const getActivitySummary = async (
  userId: string,
  days: number = 30
): Promise<{
  totalActivities: number;
  byCategory: { [key: string]: number };
  byAction: { [key: string]: number };
  securityEvents: number;
  failedAttempts: number;
}> => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const result = await getActivityLogs({
      userId,
      dateFrom,
      limit: 1000,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    const logs = result.logs;

    // Calculate statistics
    const byCategory: { [key: string]: number } = {};
    const byAction: { [key: string]: number } = {};
    let securityEvents = 0;
    let failedAttempts = 0;

    logs.forEach(log => {
      // Count by category
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;

      // Count by action
      byAction[log.action] = (byAction[log.action] || 0) + 1;

      // Count security events
      if (log.securityRelevant) {
        securityEvents++;
      }

      // Count failures
      if (log.status === 'failure') {
        failedAttempts++;
      }
    });

    return {
      totalActivities: logs.length,
      byCategory,
      byAction,
      securityEvents,
      failedAttempts
    };

  } catch (error: any) {
    logger.error('Error getting activity summary', error, { userId });
    
    return {
      totalActivities: 0,
      byCategory: {},
      byAction: {},
      securityEvents: 0,
      failedAttempts: 0
    };
  }
};

/**
 * Delete old activity logs (admin function for data retention)
 */
export const deleteOldActivityLogs = async (
  olderThanDays: number
): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    logger.info('Deleting old activity logs', { olderThanDays, cutoffDate });

    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      where('timestamp', '<=', Timestamp.fromDate(cutoffDate)),
      firestoreLimit(500) // Delete in batches
    );

    const snapshot = await getDocs(q);

    // Delete in batch
    const batch = await import('firebase/firestore').then(({ writeBatch }) => writeBatch(db));
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    const deletedCount = snapshot.size;

    logger.info('Old activity logs deleted', { deletedCount });

    return {
      success: true,
      deletedCount
    };

  } catch (error: any) {
    logger.error('Error deleting old activity logs', error);
    
    return {
      success: false,
      deletedCount: 0,
      error: error.message || 'Failed to delete old activity logs'
    };
  }
};

export default {
  logUserActivity,
  getActivityLogs,
  getRecentActivity,
  getSecurityActivity,
  getActivitySummary,
  deleteOldActivityLogs
};
