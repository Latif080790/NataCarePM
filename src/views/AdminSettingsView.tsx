/**
 * Admin Settings View
 * Centralized admin configuration including 2FA, security, and preferences
 */

import React, { useState } from 'react';
import { Settings, Shield, Bell, User, Lock, Database, Activity } from 'lucide-react';
import { TwoFactorManagement } from '@/components/TwoFactorManagement';
import { useAuth } from '@/contexts/AuthContext';
import { ButtonPro } from '@/components/ButtonPro';
import { SpinnerPro } from '@/components/SpinnerPro';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'privacy', label: 'Privacy', icon: <Lock className="w-5 h-5" /> },
  { id: 'data', label: 'Data & Backup', icon: <Database className="w-5 h-5" /> },
  { id: 'activity', label: 'Activity Log', icon: <Activity className="w-5 h-5" /> },
];

export const AdminSettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('security');
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerPro />
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = currentUser.roleId === 'admin' || currentUser.roleId === 'super-admin';

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg border border-red-200 p-6 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-night-black mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-night-black">Admin Settings</h1>
        </div>
        <p className="text-gray-600">
          Manage security, preferences, and system configuration
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'security' && <SecuritySettings user={currentUser} />}
        {activeTab === 'profile' && <ProfileSettings user={currentUser} />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'privacy' && <PrivacySettings />}
        {activeTab === 'data' && <DataBackupSettings />}
        {activeTab === 'activity' && <ActivityLogSettings />}
      </div>
    </div>
  );
};

/**
 * Security Settings Tab
 */
const SecuritySettings: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-night-black mb-2">Security Settings</h2>
        <p className="text-gray-600">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <TwoFactorManagement user={user} />

      {/* Password Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-night-black mb-2">
              Password
            </h3>
            <p className="text-sm text-gray-600">
              Change your password regularly to keep your account secure
            </p>
          </div>
          <Lock className="w-12 h-12 text-gray-400" />
        </div>
        <ButtonPro variant="outline">Change Password</ButtonPro>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-night-black mb-2">
              Active Sessions
            </h3>
            <p className="text-sm text-gray-600">
              Manage devices where you're currently signed in
            </p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-night-black">Current Session</div>
              <div className="text-sm text-gray-500">Windows · Chrome · Jakarta, Indonesia</div>
            </div>
            <span className="text-xs text-success font-medium">Active</span>
          </div>
        </div>
        <ButtonPro variant="danger">Sign Out All Devices</ButtonPro>
      </div>

      {/* Login History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-night-black mb-4">
          Recent Login Activity
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-night-black">Successful login</div>
              <div className="text-xs text-gray-500">Jakarta, Indonesia · 2 hours ago</div>
            </div>
            <div className="text-xs text-success">✓</div>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-night-black">Successful login</div>
              <div className="text-xs text-gray-500">Jakarta, Indonesia · 1 day ago</div>
            </div>
            <div className="text-xs text-success">✓</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Profile Settings Tab
 */
const ProfileSettings: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-night-black mb-2">Profile Settings</h2>
        <p className="text-gray-600">Update your personal information</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            defaultValue={user.name}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            defaultValue={user.email}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">
            Contact support to change your email address
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="+62"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <ButtonPro variant="primary">Save Changes</ButtonPro>
      </div>
    </div>
  );
};

/**
 * Notification Settings Tab
 */
const NotificationSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-night-black mb-2">Notification Preferences</h2>
        <p className="text-gray-600">Choose how you want to be notified</p>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Email Notifications', description: 'Receive updates via email' },
          { label: 'Push Notifications', description: 'Browser push notifications' },
          { label: 'Security Alerts', description: 'Critical security notifications' },
          { label: 'Project Updates', description: 'Updates about your projects' },
        ].map((item) => (
          <label key={item.label} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" className="w-5 h-5 text-primary-600" />
            <div>
              <div className="font-medium text-night-black">{item.label}</div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

/**
 * Privacy Settings Tab
 */
const PrivacySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-night-black mb-2">Privacy Settings</h2>
        <p className="text-gray-600">Control your privacy and data sharing</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-night-black mb-2">Profile Visibility</h3>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option>Everyone</option>
            <option>Team Members Only</option>
            <option>Private</option>
          </select>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-night-black mb-2">Data Collection</h3>
          <label className="flex items-center gap-3 mt-2">
            <input type="checkbox" className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-700">Allow analytics data collection</span>
          </label>
        </div>
      </div>
    </div>
  );
};

/**
 * Data & Backup Settings Tab
 */
const DataBackupSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-night-black mb-2">Data & Backup</h2>
        <p className="text-gray-600">Manage your data and backups</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-info mb-2">Automatic Backups Enabled</h3>
        <p className="text-sm text-blue-700">
          Your data is automatically backed up daily at 2:00 AM UTC
        </p>
        <p className="text-xs text-info mt-2">
          Last backup: Today at 02:00 AM · Next backup: Tomorrow at 02:00 AM
        </p>
      </div>

      <div className="space-y-3">
        <ButtonPro variant="primary">Download My Data</ButtonPro>
        <ButtonPro variant="outline">Request Manual Backup</ButtonPro>
        <ButtonPro variant="danger">Delete All My Data</ButtonPro>
      </div>
    </div>
  );
};

/**
 * Activity Log Settings Tab
 */
const ActivityLogSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-night-black mb-2">Activity Log</h2>
        <p className="text-gray-600">View your recent account activity</p>
      </div>

      <div className="space-y-2">
        {[
          { action: 'Logged in', time: '2 hours ago', status: 'success' },
          { action: 'Updated profile', time: '1 day ago', status: 'success' },
          { action: 'Changed password', time: '3 days ago', status: 'success' },
          { action: 'Failed login attempt', time: '5 days ago', status: 'warning' },
        ].map((log, i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-night-black">{log.action}</div>
              <div className="text-sm text-gray-500">{log.time}</div>
            </div>
            <span
              className={`text-xs font-medium ${
                log.status === 'success' ? 'text-success' : 'text-warning'
              }`}
            >
              {log.status === 'success' ? '✓' : '⚠'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
