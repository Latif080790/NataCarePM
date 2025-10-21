/**
 * User Profile Management Types
 * Comprehensive type definitions for enhanced user profile features
 */

// ========================================
// USER PROFILE TYPES
// ========================================

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  thumbnailURL?: string | null;
  role: 'admin' | 'project_manager' | 'finance' | 'logistics' | 'viewer';
  department?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language: 'id' | 'en';

  // Security settings
  twoFactorEnabled: boolean;
  twoFactorMethod: '2FA_SMS' | '2FA_TOTP' | '2FA_EMAIL' | null;
  twoFactorSecret?: string; // Encrypted TOTP secret
  backupCodesRemaining: number;
  lastPasswordChange?: Date;
  passwordChangedCount: number;

  // Session settings
  sessionTimeout: number; // in hours
  maxConcurrentSessions: number;
  rememberDeviceDuration: number; // in days

  // Notification preferences
  notificationPreferences: NotificationPreferences;

  // Account metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  accountStatus: 'active' | 'suspended' | 'locked' | 'deleted';
  emailVerified: boolean;

  // Additional metadata
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  // Tasks & Projects
  taskAssigned: NotificationSetting;
  taskDueSoon: NotificationSetting;
  projectMilestones: NotificationSetting;
  mentionsInComments: NotificationSetting;

  // Financial & Approvals
  poRequiresApproval: NotificationSetting;
  paymentDue: NotificationSetting;
  budgetThreshold: NotificationSetting;
  invoiceReceived: NotificationSetting;

  // Documents & Collaboration
  documentShared: NotificationSetting;
  documentVersionUploaded: NotificationSetting;
  commentOnDocument: NotificationSetting;

  // Security & Account (forced to instant)
  newDeviceLogin: 'instant';
  passwordChanged: 'instant';
  twoFactorToggled: 'instant';
  suspiciousActivity: 'instant';

  // System Notifications
  systemMaintenance: 'instant';
  newFeatures: NotificationSetting;

  // Digest options
  dailyDigest: boolean;
  dailyDigestTime: string; // HH:mm format
  weeklyDigest: boolean;
  monthlyReport: boolean;
}

export type NotificationSetting = 'instant' | 'daily' | 'weekly' | 'off';

// ========================================
// ACTIVITY LOG TYPES
// ========================================

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;

  // Action details
  action: ActivityAction;
  actionCategory: ActivityCategory;
  resource: string; // e.g., 'project', 'task', 'document'
  resourceId?: string;
  resourceName?: string;

  // Request metadata
  ipAddress: string;
  userAgent: string;
  device: DeviceInfo;
  location?: GeoLocation;

  // Timing
  timestamp: Date;
  duration?: number; // for timed actions (in ms)

  // Additional data
  metadata?: Record<string, any>;

  // Security flags
  suspicious: boolean;
  suspiciousReasons?: string[];

  // Status
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
}

export type ActivityAction =
  // Authentication
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | 'SESSION_EXPIRED'
  | 'DEVICE_TRUSTED'
  | 'DEVICE_REVOKED'

  // CRUD Operations
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'

  // Project Management
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'

  // Financial
  | 'PO_CREATED'
  | 'PO_APPROVED'
  | 'PO_REJECTED'
  | 'PAYMENT_MADE'
  | 'INVOICE_CREATED'

  // Documents
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_DELETED'

  // Security
  | 'PERMISSION_CHANGED'
  | 'ROLE_CHANGED'
  | 'ACCESS_DENIED'
  | 'SUSPICIOUS_ACTIVITY_DETECTED'

  // System
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'SETTINGS_CHANGED';

export type ActivityCategory =
  | 'authentication'
  | 'security'
  | 'project'
  | 'task'
  | 'financial'
  | 'document'
  | 'user_management'
  | 'system';

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  isMobile: boolean;
  isBot: boolean;
}

export interface GeoLocation {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// ========================================
// SESSION MANAGEMENT TYPES
// ========================================

export interface UserSession {
  id: string;
  userId: string;

  // Device identification
  deviceId: string; // Fingerprint-based unique ID
  deviceFingerprint: string; // Hashed fingerprint
  deviceName: string; // User-assigned name or auto-generated

  // Device details
  device: DeviceInfo;
  ipAddress: string;
  location?: GeoLocation;

  // Session timing
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;

  // Session status
  active: boolean;
  loggedOutAt?: Date;
  logoutReason?: 'user' | 'timeout' | 'admin' | 'security' | 'expired';

  // Flags
  isCurrentDevice: boolean;
  trusted: boolean;

  // Metadata
  metadata?: Record<string, any>;
}

export interface SessionSummary {
  totalSessions: number;
  activeSessions: number;
  inactiveSessions: number;
  trustedDevices: number;
  suspiciousSessions: number;
  oldestSession?: Date;
  newestSession?: Date;
}

// ========================================
// DEVICE MANAGEMENT TYPES
// ========================================

export interface TrustedDevice {
  id: string;
  userId: string;

  // Device identification
  deviceFingerprint: string; // Hashed fingerprint
  deviceId: string;
  deviceName: string; // User-friendly name

  // Device details
  device: DeviceInfo;
  ipAddress: string;
  location?: GeoLocation;

  // Trust status
  trusted: boolean;
  blocked: boolean;
  requiresApproval: boolean;
  approvalMethod?: 'auto' | 'email' | 'sms' | 'manual';

  // Timing
  firstSeen: Date;
  lastSeen: Date;
  lastUsedAt?: Date;

  // Usage statistics
  loginCount: number;
  failedLoginCount: number;

  // Security
  suspicious: boolean;
  suspiciousReasons?: string[];
  markedAsLost: boolean;

  // Metadata
  metadata?: Record<string, any>;
}

// ========================================
// PASSWORD MANAGEMENT TYPES
// ========================================

export interface PasswordHistory {
  userId: string;
  passwordHash: string; // SHA-256 hash for comparison
  createdAt: Date;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number; // 0-100
  suggestions?: string[];
}

// ========================================
// TWO-FACTOR AUTHENTICATION TYPES
// ========================================

export interface TwoFactorSetup {
  method: '2FA_SMS' | '2FA_TOTP' | '2FA_EMAIL';
  phoneNumber?: string; // For SMS
  secret?: string; // For TOTP
  qrCode?: string; // For TOTP (data URL)
  backupCodes: string[];
}

export interface TwoFactorVerification {
  userId: string;
  code: string;
  method: '2FA_SMS' | '2FA_TOTP' | '2FA_EMAIL' | '2FA_BACKUP';
  timestamp: Date;
}

// ========================================
// PROFILE PHOTO TYPES
// ========================================

export interface ProfilePhotoUpload {
  file: File;
  preview?: string;
  crop?: CropArea;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: 'px' | '%';
}

export interface PhotoUploadResult {
  photoURL: string;
  thumbnailURL?: string;
  uploadedAt: Date;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface ImageValidation {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format?: string;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  metadata?: {
    timestamp: Date;
    requestId?: string;
    [key: string]: any;
  };
}

// ========================================
// FILTER & PAGINATION TYPES
// ========================================

export interface ActivityLogFilter {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  actions?: ActivityAction[];
  categories?: ActivityCategory[];
  resources?: string[];
  suspicious?: boolean;
  status?: 'success' | 'failure' | 'pending';
  limit?: number;
  offset?: number;
}

export interface SessionFilter {
  userId?: string;
  active?: boolean;
  trusted?: boolean;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ========================================
// EXPORT TYPES
// ========================================

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel' | 'json';
  dateRange?: {
    start: Date;
    end: Date;
  };
  fields?: string[];
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  downloadURL?: string;
  filename: string;
  fileSize: number;
  recordCount: number;
  expiresAt: Date;
}

// ========================================
// UTILITY TYPES
// ========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// ========================================
// CONSTANTS
// ========================================

export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*(),.?":{}|<>',
  historyCount: 5, // Check last 5 passwords
} as const;

export const IMAGE_REQUIREMENTS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.heic'],
  targetSize: { width: 800, height: 800 },
  thumbnailSize: { width: 200, height: 200 },
  quality: 0.9,
} as const;

export const SESSION_SETTINGS = {
  defaultTimeout: 8, // hours
  defaultIdleTimeout: 2, // hours
  maxConcurrentSessions: 5,
  rememberDeviceDuration: 30, // days
  warningBeforeTimeout: 5, // minutes
} as const;

export const ACTIVITY_LOG_SETTINGS = {
  maxLogsPerUser: 1000,
  retentionDays: 90,
  suspiciousActivityThreshold: 5, // failed attempts
  rateLimitWindow: 60, // minutes
} as const;

export const RATE_LIMITS = {
  passwordChange: { attempts: 3, window: 60 }, // 3 per hour
  twoFactorVerify: { attempts: 5, window: 60 }, // 5 per hour
  sessionCreate: { attempts: 10, window: 60 }, // 10 per hour
  emailResend: { attempts: 3, window: 60 }, // 3 per hour
  photoUpload: { attempts: 5, window: 60 }, // 5 per hour
} as const;
