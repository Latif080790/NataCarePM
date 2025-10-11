import React from 'react';

// Extended Button component props with custom variants
export interface ExtendedButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

// Document types for document management
export interface DocumentVersion {
  id: string;
  documentId: string; // Changed from number to string for consistency
  version: string;
  name: string;
  uploadDate: string;
  uploadedBy: string;
  fileSize: number;
  url: string;
  comments: string;
  changeLog: string;
  size: number;
}

export interface DocumentWithVersions {
  id: string; // Changed from number to string for consistency
  name: string;
  category: string;
  currentVersion: string;
  uploadDate: string;
  url: string;
  versions: DocumentVersion[];
  tags: string[];
  lastModified: string;
  modifiedBy: string;
  isArchived: boolean;
}

// Security Dashboard types
export interface SecurityEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  event: 'login_success' | 'login_failure' | 'password_change' | 'suspicious_activity' | 'config_change' | 'data_access' | 'admin_action' | 'security_alert';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityMetrics {
  totalUsers: number;
  activeUsers: number;
  suspiciousLogins: number;
  blockedAttempts: number;
  passwordExpiring: number;
  recentEvents: SecurityEvent[];
  securityEvents: SecurityEvent[];
}

// Live cursor types for real-time collaboration
export interface LiveCursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  isActive: boolean;
  lastSeen: number;
}

// Extended User interface with all required properties
export interface ExtendedUser {
  uid: string; // Firebase UID
  id: string; // Application ID
  name: string;
  email: string;
  roleId: string;
  avatarUrl: string;
  isOnline?: boolean;
  lastSeen?: string;
  permissions?: string[];
}

// Notification types
export interface EnhancedNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: string;
  linkTo?: string;
  priority: 'low' | 'medium' | 'high';
  actionButton?: {
    text: string;
    action: string;
  };
}

// Stat card types for dashboard
export interface StatCardData {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ComponentType<any>;
  iconType?: 'trending-up' | 'trending-down' | 'users' | 'calendar' | 'dollar-sign' | 'alert-triangle' | 'check-circle' | 'clock';
  color?: string;
  trend?: Array<{ date: string; value: number }>;
}

// Chart types
export interface GaugeChartProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
}

export interface RadialProgressProps {
  title: string;
  description: string;
  value: number; // 0 to 100
  color?: string;
  className?: string;
}