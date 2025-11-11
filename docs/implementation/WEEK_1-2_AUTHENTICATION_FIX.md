# WEEK 1-2: AUTHENTICATION SYSTEM FIX - IMPLEMENTATION PLAN

## 📋 Overview
Fix authentication system dari development mode ke production-ready dengan real authentication, JWT validation, IP restrictions, dan audit logging.

## 🎯 Goals
1. Replace dummy hooks dengan real authentication
2. Implement JWT token validation
3. Add IP restriction checking
4. Implement comprehensive audit logging
5. Secure all API endpoints

---

## 📅 DAY 1: Real Authentication Hooks

### Tasks:
- [ ] Fix `usePermissions.ts` - remove dummy returns
- [ ] Implement real permission checking dari Firestore
- [ ] Add permission caching untuk performance
- [ ] Test permission system dengan different roles

### Files to Modify:
- `src/hooks/usePermissions.ts` (currently all dummy)
- `src/contexts/AuthContext.tsx` (add permission loading)
- `src/middleware/rbac.ts` (integrate with frontend hooks)

### Implementation:
```typescript
// src/hooks/usePermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPermissions } from '@/api/authService';
import { Permission } from '@/types';

export const usePermissions = () => {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadPermissions(user.uid);
    } else {
      setUserPermissions([]);
      setIsLoading(false);
    }
  }, [user?.uid]);

  const loadPermissions = async (userId: string) => {
    try {
      const permissions = await getUserPermissions(userId);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setUserPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return userPermissions.includes(permission);
  }, [user, userPermissions]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every(p => userPermissions.includes(p));
  }, [user, userPermissions]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(p => userPermissions.includes(p));
  }, [user, userPermissions]);

  const canPerformAction = useCallback((resource: string, action: string): boolean => {
    const permission = `${resource}:${action}` as Permission;
    return hasPermission(permission);
  }, [hasPermission]);

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canPerformAction,
    userPermissions,
    isLoading,
  };
};
```

---

## 📅 DAY 2: JWT Token Validation

### Tasks:
- [ ] Implement JWT token generation di backend
- [ ] Add token validation middleware
- [ ] Implement token refresh mechanism
- [ ] Add token expiry handling

### Files to Create/Modify:
- `src/api/authService.ts` (NEW - authentication API)
- `src/utils/jwtUtils.ts` (NEW - JWT helpers)
- `src/middleware/authMiddleware.ts` (NEW - request interceptor)

### Implementation:
```typescript
// src/api/authService.ts
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Permission, UserRole } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isActive: boolean;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Get ID token
      const idToken = await userCredential.user.getIdToken();
      const refreshToken = userCredential.user.refreshToken;

      // Create session
      await createUserSession({
        userId: userCredential.user.uid,
        sessionId: generateSessionId(),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        isActive: true,
      });

      // Log login activity
      await logAuthActivity({
        userId: userCredential.user.uid,
        action: 'login',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: Timestamp.now(),
        success: true,
      });

      return {
        accessToken: idToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error: any) {
      // Log failed login
      await logAuthActivity({
        userId: credentials.email,
        action: 'login_failed',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: Timestamp.now(),
        success: false,
        error: error.message,
      });
      throw error;
    }
  },

  async logout(): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      await invalidateUserSessions(user.uid);
      await logAuthActivity({
        userId: user.uid,
        action: 'logout',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: Timestamp.now(),
        success: true,
      });
    }
    await firebaseSignOut(auth);
  },

  async refreshAccessToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    return await user.getIdToken(true);
  },

  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const sessionDoc = await getDoc(doc(db, 'userSessions', sessionId));
      if (!sessionDoc.exists()) return false;

      const session = sessionDoc.data() as UserSession;
      return session.isActive && session.expiresAt.toDate() > new Date();
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  },
};

async function createUserSession(session: UserSession): Promise<void> {
  await setDoc(doc(db, 'userSessions', session.sessionId), session);
}

async function invalidateUserSessions(userId: string): Promise<void> {
  // Mark all user sessions as inactive
  // Implementation depends on Firestore query capabilities
}

async function logAuthActivity(activity: any): Promise<void> {
  await setDoc(doc(db, 'authLogs', `${Date.now()}`), activity);
}

async function getClientIP(): Promise<string> {
  // In production, get from server-side
  return 'client-ip-placeholder';
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];

    const userData = userDoc.data();
    const roleId = userData.roleId as UserRole;

    // Get role permissions from constants
    const { ROLES_CONFIG } = await import('@/constants');
    const role = ROLES_CONFIG.find(r => r.id === roleId);

    return role?.permissions || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}
```

---

## 📅 DAY 3: IP Restriction Implementation

### Tasks:
- [ ] Add IP whitelist/blacklist configuration
- [ ] Implement IP validation middleware
- [ ] Add geo-location checking
- [ ] Test IP restrictions

### Files to Create:
- `src/middleware/ipRestriction.ts` (NEW)
- `src/config/security.ts` (NEW - security configuration)

### Implementation:
```typescript
// src/config/security.ts
export interface SecurityConfig {
  ipWhitelist: string[];
  ipBlacklist: string[];
  enableGeoRestriction: boolean;
  allowedCountries: string[];
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
}

export const securityConfig: SecurityConfig = {
  ipWhitelist: [
    // Add trusted IPs
    '127.0.0.1',
    '::1',
  ],
  ipBlacklist: [
    // Add blocked IPs
  ],
  enableGeoRestriction: false,
  allowedCountries: ['ID'], // Indonesia only
  maxLoginAttempts: 5,
  lockoutDuration: 30,
};

// src/middleware/ipRestriction.ts
import { securityConfig } from '@/config/security';

export class IPRestrictionService {
  static async isIPAllowed(ip: string): Promise<boolean> {
    // Check blacklist first
    if (securityConfig.ipBlacklist.includes(ip)) {
      return false;
    }

    // If whitelist is configured, check it
    if (securityConfig.ipWhitelist.length > 0) {
      return securityConfig.ipWhitelist.includes(ip);
    }

    // Default: allow
    return true;
  }

  static async checkGeoRestriction(ip: string): Promise<boolean> {
    if (!securityConfig.enableGeoRestriction) return true;

    try {
      // Use IP geolocation API (ip-api.com, ipinfo.io, etc.)
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();

      return securityConfig.allowedCountries.includes(data.countryCode);
    } catch (error) {
      console.error('Geo restriction check failed:', error);
      // On error, allow access (fail-open) or deny (fail-closed)
      return true;
    }
  }
}
```

---

## 📅 DAY 4: Audit Logging System

### Tasks:
- [ ] Create comprehensive audit log structure
- [ ] Implement audit log recording
- [ ] Add audit log viewer UI
- [ ] Test audit trail functionality

### Files to Create:
- `src/api/auditService.ts` (NEW)
- `src/views/AuditLogView.tsx` (ENHANCE existing)
- `src/types/audit.types.ts` (NEW)

### Implementation:
```typescript
// src/types/audit.types.ts
export interface AuditEntry {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  changes?: AuditChange[];
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'role_change'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject';

export interface AuditChange {
  field: string;
  before: any;
  after: any;
  changedAt: Timestamp;
}

// src/api/auditService.ts
import { db } from '@/firebaseConfig';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { AuditEntry, AuditAction } from '@/types/audit.types';

export const auditService = {
  async logAction(params: {
    userId: string;
    userName: string;
    action: AuditAction;
    resource: string;
    resourceId: string;
    changes?: any[];
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const entry: Omit<AuditEntry, 'id'> = {
        ...params,
        timestamp: Timestamp.now(),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: getCurrentSessionId(),
        success: true,
      };

      await addDoc(collection(db, 'auditLogs'), entry);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging should not break main functionality
    }
  },

  async getAuditLogs(filters: {
    userId?: string;
    resource?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditEntry[]> {
    try {
      let q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));

      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.resource) {
        q = query(q, where('resource', '==', filters.resource));
      }
      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditEntry[];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  },
};

async function getClientIP(): Promise<string> {
  // Placeholder - in production, get from server
  return 'client-ip';
}

function getCurrentSessionId(): string {
  return sessionStorage.getItem('sessionId') || 'unknown';
}
```

---

## 📅 DAY 5: Testing & Integration

### Tasks:
- [ ] Test authentication flow end-to-end
- [ ] Test permission checking across different roles
- [ ] Test JWT token refresh
- [ ] Test IP restrictions
- [ ] Test audit logging
- [ ] Fix any bugs found

---

## 📊 Success Criteria

✅ All dummy hooks replaced with real implementations
✅ JWT tokens working with refresh mechanism
✅ IP restrictions functional
✅ Comprehensive audit logs recorded
✅ All API endpoints secured
✅ Role-based access control working correctly
✅ Zero security vulnerabilities

---

## 🚀 Next Steps (Week 2)

After Week 1 completion, proceed to:
1. Document Management System implementation
2. Notification Preferences UI
3. Audit Trail Enhancement

---

**Created:** November 12, 2025
**Priority:** 🔴 CRITICAL - Blocking for production
**Estimated Effort:** 2 weeks (80 hours)
**Expected ROI:** ⭐⭐⭐⭐⭐
