/**
 * Two-Factor Authentication Management Component
 * Provides UI for enabling/disabling 2FA in account settings
 */

import React, { useState } from 'react';
import { getAuth, multiFactor } from 'firebase/auth';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { ButtonPro } from './ButtonPro';
import { TwoFactorAuth } from './TwoFactorAuth';
import { useToast } from '@/contexts/ToastContext';

interface TwoFactorManagementProps {
  user: any;
}

export const TwoFactorManagement: React.FC<TwoFactorManagementProps> = ({ user }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const { addToast } = useToast();
  const auth = getAuth();

  React.useEffect(() => {
    if (user && auth.currentUser) {
      const enrolledFactors = multiFactor(auth.currentUser).enrolledFactors;
      setIs2FAEnabled(enrolledFactors.length > 0);
    }
  }, [user]);

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const enrolledFactors = multiFactor(currentUser).enrolledFactors;
      if (enrolledFactors.length > 0) {
        await multiFactor(currentUser).unenroll(enrolledFactors[0]);
        setIs2FAEnabled(false);
        addToast('Two-factor authentication disabled', 'success');
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      addToast('Failed to disable 2FA', 'error');
    }
  };

  if (showEnrollment) {
    return (
      <TwoFactorAuth
        onSuccess={() => {
          setShowEnrollment(false);
          setIs2FAEnabled(true);
        }}
        onCancel={() => setShowEnrollment(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add an extra layer of security to your account by requiring a verification code when you sign in.
          </p>
          
          {is2FAEnabled ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              <span>Enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Not enabled</span>
            </div>
          )}
        </div>

        <Shield className={`w-12 h-12 ${is2FAEnabled ? 'text-green-500' : 'text-gray-400'}`} />
      </div>

      <div className="mt-6">
        {is2FAEnabled ? (
          <ButtonPro variant="danger" onClick={handleDisable2FA}>
            Disable 2FA
          </ButtonPro>
        ) : (
          <ButtonPro variant="primary" onClick={() => setShowEnrollment(true)}>
            Enable 2FA
          </ButtonPro>
        )}
      </div>
    </div>
  );
};

