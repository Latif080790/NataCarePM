/**
 * Session Management Service
 * Handles user sessions, device tracking, and multi-device logout
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { logger } from '../utils/logger';
import { logUserActivity } from './activityLogService';
import type { 
  UserSession,
  DeviceInfo,
  GeoLocation,
  SessionSummary,
  BulkSessionInvalidationRequest
} from '../types';

// Collection names
const SESSIONS_COLLECTION = 'user_sessions';
const USERS_COLLECTION = 'users';

/**
 * Get device information
 */
const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
  }

  let os = 'Unknown';
  let osVersion = '';
  
  if (/Windows NT 10/i.test(ua)) {
    os = 'Windows';
    osVersion = '10';
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

  const screenResolution = `${window.screen.width}x${window.screen.height}`;
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
    isTrusted: true
  };
};

/**
 * Get client IP address
 */
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (error) {
    logger.warn('Failed to get client IP', error);
    return 'Unknown';
  }
};

/**
 * Get geo location from IP
 */
const getGeoLocation = async (ipAddress: string): Promise<GeoLocation | undefined> => {
  try {
    // In production, use a geolocation service
    return undefined;
  } catch (error) {
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
 * Create new session
 */
export const createSession = async (
  userId: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
  try {
    logger.info('Creating new session', { userId });

    // Get device info
    const deviceInfo = getDeviceInfo();
    
    // Get IP address
    const ipAddress = await getClientIP();
    
    // Get geo location
    const location = await getGeoLocation(ipAddress);

    // Generate session ID
    const sessionId = generateSessionId();

    // Calculate expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create session document
    const sessionData: Omit<UserSession, 'sessionId'> = {
      userId,
      deviceInfo,
      loginAt: new Date(),
      lastActivityAt: new Date(),
      ipAddress,
      location,
      isCurrentSession: true,
      expiresAt,
      status: 'active'
    };

    // Save to Firestore
    const sessionRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      sessionId,
      ...sessionData,
      loginAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt)
    });

    logger.info('Session created', { userId, sessionId });

    // Store session ID in sessionStorage
    sessionStorage.setItem('currentSessionId', sessionId);

    // Update user document with current session
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      currentSessionId: sessionId,
      lastLoginAt: serverTimestamp(),
      lastLoginIP: ipAddress,
      lastLoginDevice: `${deviceInfo.os} ${deviceInfo.browser}`,
      updatedAt: serverTimestamp()
    });

    // Log activity
    await logUserActivity({
      userId,
      action: 'login',
      category: 'authentication',
      description: 'User logged in',
      status: 'success',
      securityRelevant: true,
      riskLevel: 'low'
    });

    return {
      success: true,
      sessionId
    };

  } catch (error: any) {
    logger.error('Error creating session', error, { userId });
    
    return {
      success: false,
      error: error.message || 'Failed to create session'
    };
  }
};

/**
 * Update session activity
 */
export const updateSessionActivity = async (
  sessionId: string
): Promise<void> => {
  try {
    // Find session document
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('sessionId', '==', sessionId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      logger.warn('Session not found for activity update', { sessionId });
      return;
    }

    // Update last activity timestamp
    const sessionDoc = snapshot.docs[0];
    await updateDoc(sessionDoc.ref, {
      lastActivityAt: serverTimestamp()
    });

  } catch (error: any) {
    logger.error('Error updating session activity', error, { sessionId });
  }
};

/**
 * Get active sessions for user
 */
export const getActiveSessions = async (
  userId: string
): Promise<UserSession[]> => {
  try {
    logger.info('Fetching active sessions', { userId });

    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    const sessions: UserSession[] = [];
    const currentSessionId = sessionStorage.getItem('currentSessionId');

    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        sessionId: data.sessionId,
        userId: data.userId,
        deviceInfo: data.deviceInfo,
        loginAt: data.loginAt?.toDate() || new Date(),
        lastActivityAt: data.lastActivityAt?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        location: data.location,
        isCurrentSession: data.sessionId === currentSessionId,
        expiresAt: data.expiresAt?.toDate(),
        status: data.status
      });
    });

    // Sort by last activity
    sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

    logger.info('Active sessions fetched', { userId, count: sessions.length });

    return sessions;

  } catch (error: any) {
    logger.error('Error fetching active sessions', error, { userId });
    return [];
  }
};

/**
 * Invalidate specific session
 */
export const invalidateSession = async (
  sessionId: string,
  reason: string = 'User requested'
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info('Invalidating session', { sessionId, reason });

    // Find session document
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('sessionId', '==', sessionId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        error: 'Session not found'
      };
    }

    const sessionDoc = snapshot.docs[0];
    const sessionData = sessionDoc.data();

    // Update session status
    await updateDoc(sessionDoc.ref, {
      status: 'invalidated',
      invalidatedAt: serverTimestamp(),
      invalidatedReason: reason
    });

    logger.info('Session invalidated', { sessionId });

    // Log activity
    await logUserActivity({
      userId: sessionData.userId,
      action: 'session_invalidated',
      category: 'security',
      description: `Session invalidated: ${reason}`,
      status: 'success',
      securityRelevant: true,
      riskLevel: 'low',
      metadata: { sessionId, reason }
    });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error invalidating session', error, { sessionId });
    
    return {
      success: false,
      error: error.message || 'Failed to invalidate session'
    };
  }
};

/**
 * Invalidate all other sessions (logout from all devices except current)
 */
export const invalidateOtherSessions = async (
  request: BulkSessionInvalidationRequest
): Promise<{ success: boolean; invalidatedCount: number; error?: string }> => {
  try {
    const { userId, keepCurrentSession, sessionIdsToKeep, reason } = request;

    logger.info('Invalidating other sessions', { userId, keepCurrentSession });

    // Get current session ID
    const currentSessionId = keepCurrentSession ? sessionStorage.getItem('currentSessionId') : null;

    // Get all active sessions
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    let invalidatedCount = 0;

    // Invalidate each session
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const sessionId = data.sessionId;

      // Skip current session if requested
      if (keepCurrentSession && sessionId === currentSessionId) {
        continue;
      }

      // Skip sessions in keep list
      if (sessionIdsToKeep && sessionIdsToKeep.includes(sessionId)) {
        continue;
      }

      // Invalidate session
      await updateDoc(doc.ref, {
        status: 'invalidated',
        invalidatedAt: serverTimestamp(),
        invalidatedReason: reason
      });

      invalidatedCount++;
    }

    logger.info('Other sessions invalidated', { userId, invalidatedCount });

    // Log activity
    await logUserActivity({
      userId,
      action: 'logout_all_sessions',
      category: 'security',
      description: `Logged out from ${invalidatedCount} device(s)`,
      status: 'success',
      securityRelevant: true,
      riskLevel: 'low',
      metadata: { invalidatedCount, reason }
    });

    return {
      success: true,
      invalidatedCount
    };

  } catch (error: any) {
    logger.error('Error invalidating other sessions', error, { userId: request.userId });
    
    return {
      success: false,
      invalidatedCount: 0,
      error: error.message || 'Failed to invalidate sessions'
    };
  }
};

/**
 * Logout current session
 */
export const logoutCurrentSession = async (
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    logger.info('Logging out current session', { userId });

    const currentSessionId = sessionStorage.getItem('currentSessionId');

    if (currentSessionId) {
      // Invalidate session
      await invalidateSession(currentSessionId, 'User logout');
    }

    // Sign out from Firebase Auth
    await signOut(auth);

    // Clear session storage
    sessionStorage.removeItem('currentSessionId');

    logger.info('User logged out', { userId });

    // Log activity (before clearing session)
    await logUserActivity({
      userId,
      action: 'logout',
      category: 'authentication',
      description: 'User logged out',
      status: 'success',
      securityRelevant: true,
      riskLevel: 'low'
    });

    return {
      success: true
    };

  } catch (error: any) {
    logger.error('Error during logout', error, { userId });
    
    return {
      success: false,
      error: error.message || 'Failed to logout'
    };
  }
};

/**
 * Get session summary for dashboard
 */
export const getSessionSummary = async (
  userId: string
): Promise<SessionSummary | null> => {
  try {
    logger.info('Fetching session summary', { userId });

    const sessions = await getActiveSessions(userId);
    
    if (sessions.length === 0) {
      return null;
    }

    const currentSession = sessions.find(s => s.isCurrentSession);
    if (!currentSession) {
      return null;
    }

    const otherSessions = sessions.filter(s => !s.isCurrentSession);

    // Identify suspicious sessions (simple heuristic)
    const suspiciousSessions = sessions.filter(s => {
      // Example: Different country or unusual device
      // In production, implement proper suspicious activity detection
      return false;
    });

    // Get last login info
    const lastLoginInfo = {
      timestamp: currentSession.loginAt,
      location: currentSession.location?.city || currentSession.ipAddress,
      device: `${currentSession.deviceInfo.os} - ${currentSession.deviceInfo.browser}`,
      ipAddress: currentSession.ipAddress
    };

    return {
      totalActiveSessions: sessions.length,
      currentSession,
      otherSessions,
      suspiciousSessions,
      lastLoginInfo
    };

  } catch (error: any) {
    logger.error('Error fetching session summary', error, { userId });
    return null;
  }
};

/**
 * Clean up expired sessions (cron job function)
 */
export const cleanupExpiredSessions = async (): Promise<{
  success: boolean;
  cleanedCount: number;
  error?: string;
}> => {
  try {
    logger.info('Cleaning up expired sessions');

    const now = new Date();

    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('expiresAt', '<=', Timestamp.fromDate(now)),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    let cleanedCount = 0;

    for (const doc of snapshot.docs) {
      await updateDoc(doc.ref, {
        status: 'expired',
        invalidatedAt: serverTimestamp(),
        invalidatedReason: 'Session expired'
      });
      cleanedCount++;
    }

    logger.info('Expired sessions cleaned up', { cleanedCount });

    return {
      success: true,
      cleanedCount
    };

  } catch (error: any) {
    logger.error('Error cleaning up expired sessions', error);
    
    return {
      success: false,
      cleanedCount: 0,
      error: error.message || 'Failed to cleanup expired sessions'
    };
  }
};

/**
 * Check if session is valid
 */
export const isSessionValid = async (
  sessionId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('sessionId', '==', sessionId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return false;
    }

    const sessionData = snapshot.docs[0].data();
    
    // Check if expired
    if (sessionData.expiresAt) {
      const expiresAt = sessionData.expiresAt.toDate();
      if (expiresAt <= new Date()) {
        // Session expired, invalidate it
        await updateDoc(snapshot.docs[0].ref, {
          status: 'expired',
          invalidatedAt: serverTimestamp()
        });
        return false;
      }
    }

    return true;

  } catch (error: any) {
    logger.error('Error checking session validity', error, { sessionId });
    return false;
  }
};

export default {
  createSession,
  updateSessionActivity,
  getActiveSessions,
  invalidateSession,
  invalidateOtherSessions,
  logoutCurrentSession,
  getSessionSummary,
  cleanupExpiredSessions,
  isSessionValid
};
