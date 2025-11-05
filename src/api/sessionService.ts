/**
 * Session Management Service
 * Handles user sessions, device tracking, and multi-device logout
 */

import { doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { User as FirebaseUser } from 'firebase/auth';
import { APIResponse, safeAsync } from '@/utils/responseWrapper';
import { logger } from '@/utils/logger.enhanced';


// Session interfaces
export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  isActive: boolean;
  refreshToken?: string;
}

export interface SessionActivity {
  id: string;
  sessionId: string;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

// Session configuration
const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '7200000'); // 2 hours default
const MAX_CONCURRENT_SESSIONS = 5;
const SESSION_CLEANUP_INTERVAL = 3600000; // 1 hour

export class SessionService {
  private COLLECTION = 'userSessions';
  private ACTIVITY_COLLECTION = 'sessionActivities';

  constructor() {
    // Start session cleanup interval
    setInterval(() => this.cleanupExpiredSessions(), SESSION_CLEANUP_INTERVAL);
  }

  /**
   * Create a new user session
   */
  async createSession(
    userId: string,
    deviceId: string,
    ipAddress: string,
    userAgent: string,
    refreshToken?: string
  ): Promise<APIResponse<UserSession>> {
    return await safeAsync(async () => {
      logger.info('Creating new user session', { userId, deviceId });

      // Check concurrent session limit
      const activeSessions = await this.getActiveSessions(userId);
      if (activeSessions.data && activeSessions.data.length >= MAX_CONCURRENT_SESSIONS) {
        // Expire oldest session if limit reached
        const oldestSession = activeSessions.data.reduce((oldest, current) => 
          current.createdAt < oldest.createdAt ? current : oldest
        );
        await this.expireSession(oldestSession.id);
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT);

      const session: UserSession = {
        id: this.generateSessionId(),
        userId,
        deviceId,
        ipAddress,
        userAgent,
        createdAt: now,
        lastActivity: now,
        expiresAt,
        isActive: true,
        refreshToken,
      };

      // Save session to Firestore
      await setDoc(doc(db, this.COLLECTION, session.id), {
        ...session,
        createdAt: Timestamp.fromDate(session.createdAt),
        lastActivity: Timestamp.fromDate(session.lastActivity),
        expiresAt: Timestamp.fromDate(session.expiresAt),
      });

      logger.info('User session created successfully', { sessionId: session.id, userId });
      return session;
    }, 'sessionService.createSession');
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<APIResponse<UserSession | null>> {
    return await safeAsync(async () => {
      logger.info('Fetching session', { sessionId });

      const docRef = doc(db, this.COLLECTION, sessionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const session: UserSession = {
        id: docSnap.id,
        userId: data.userId,
        deviceId: data.deviceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: data.createdAt.toDate(),
        lastActivity: data.lastActivity.toDate(),
        expiresAt: data.expiresAt.toDate(),
        isActive: data.isActive,
        refreshToken: data.refreshToken,
      };

      logger.info('Session fetched successfully', { sessionId });
      return session;
    }, 'sessionService.getSession');
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<APIResponse<UserSession[]>> {
    return await safeAsync(async () => {
      logger.info('Fetching active sessions for user', { userId });

      const now = new Date();
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true),
        where('expiresAt', '>', Timestamp.fromDate(now))
      );

      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          deviceId: data.deviceId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          createdAt: data.createdAt.toDate(),
          lastActivity: data.lastActivity.toDate(),
          expiresAt: data.expiresAt.toDate(),
          isActive: data.isActive,
          refreshToken: data.refreshToken,
        };
      });

      logger.info('Active sessions fetched successfully', { userId, count: sessions.length });
      return sessions;
    }, 'sessionService.getActiveSessions');
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(
    sessionId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<APIResponse<boolean>> {
    return await safeAsync(async () => {
      logger.info('Updating session activity', { sessionId });

      const sessionDoc = doc(db, this.COLLECTION, sessionId);
      const sessionSnap = await getDoc(sessionDoc);

      if (!sessionSnap.exists()) {
        return false;
      }

      const sessionData = sessionSnap.data();
      const now = new Date();

      // Check if session is expired
      if (sessionData.expiresAt.toDate() < now || !sessionData.isActive) {
        return false;
      }

      // Update last activity
      await updateDoc(sessionDoc, {
        lastActivity: Timestamp.fromDate(now),
        ipAddress,
        userAgent,
      });

      logger.info('Session activity updated successfully', { sessionId });
      return true;
    }, 'sessionService.updateSessionActivity');
  }

  /**
   * Log session activity
   */
  async logActivity(
    sessionId: string,
    userId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<APIResponse<SessionActivity>> {
    return await safeAsync(async () => {
      logger.info('Logging session activity', { sessionId, action });

      const activity: SessionActivity = {
        id: this.generateActivityId(),
        sessionId,
        userId,
        action,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        metadata,
      };

      // Save activity to Firestore
      await setDoc(doc(db, this.ACTIVITY_COLLECTION, activity.id), {
        ...activity,
        timestamp: Timestamp.fromDate(activity.timestamp),
      });

      logger.info('Session activity logged successfully', { activityId: activity.id });
      return activity;
    }, 'sessionService.logActivity');
  }

  /**
   * Expire a session
   */
  async expireSession(sessionId: string): Promise<APIResponse<boolean>> {
    return await safeAsync(async () => {
      logger.info('Expiring session', { sessionId });

      const sessionDoc = doc(db, this.COLLECTION, sessionId);
      const sessionSnap = await getDoc(sessionDoc);

      if (!sessionSnap.exists()) {
        return false;
      }

      await updateDoc(sessionDoc, {
        isActive: false,
        expiresAt: Timestamp.fromDate(new Date()),
      });

      logger.info('Session expired successfully', { sessionId });
      return true;
    }, 'sessionService.expireSession');
  }

  /**
   * Expire all sessions for a user
   */
  async expireAllSessions(userId: string): Promise<APIResponse<number>> {
    return await safeAsync(async () => {
      logger.info('Expiring all sessions for user', { userId });

      const activeSessions = await this.getActiveSessions(userId);
      if (!activeSessions.success || !activeSessions.data) {
        return 0;
      }

      const expiredCount = activeSessions.data.length;
      
      // Expire all active sessions
      for (const session of activeSessions.data) {
        await this.expireSession(session.id);
      }

      logger.info('All sessions expired for user', { userId, expiredCount });
      return expiredCount;
    }, 'sessionService.expireAllSessions');
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<APIResponse<number>> {
    return await safeAsync(async () => {
      logger.info('Cleaning up expired sessions');

      const now = new Date();
      const q = query(
        collection(db, this.COLLECTION),
        where('expiresAt', '<', Timestamp.fromDate(now))
      );

      const snapshot = await getDocs(q);
      const expiredSessions = snapshot.docs;

      // Delete expired sessions
      for (const doc of expiredSessions) {
        await deleteDoc(doc.ref);
      }

      logger.info('Expired sessions cleaned up', { count: expiredSessions.length });
      return expiredSessions.length;
    }, 'sessionService.cleanupExpiredSessions');
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<APIResponse<boolean>> {
    return await safeAsync(async () => {
      logger.info('Validating session', { sessionId });

      const session = await this.getSession(sessionId);
      if (!session.success || !session.data) {
        return false;
      }

      const sessionData = session.data;
      const now = new Date();

      // Check if session is active and not expired
      if (!sessionData.isActive || sessionData.expiresAt < now) {
        return false;
      }

      // Extend session expiration if it's close to expiring
      const timeUntilExpiry = sessionData.expiresAt.getTime() - now.getTime();
      if (timeUntilExpiry < SESSION_TIMEOUT * 0.2) { // If less than 20% of timeout remaining
        const newExpiry = new Date(now.getTime() + SESSION_TIMEOUT);
        await updateDoc(doc(db, this.COLLECTION, sessionId), {
          expiresAt: Timestamp.fromDate(newExpiry),
        });
      }

      logger.info('Session validated successfully', { sessionId });
      return true;
    }, 'sessionService.validateSession');
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate activity ID
   */
  private generateActivityId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const sessionService = new SessionService();
