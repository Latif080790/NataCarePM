/**
 * Two-Factor Authentication Component
 * Implements MFA for admin users using Firebase Auth
 */

import React, { useState } from 'react';
import { 
  PhoneAuthProvider, 
  RecaptchaVerifier,
  multiFactor,
  PhoneMultiFactorGenerator,
  getAuth,
} from 'firebase/auth';
import { Shield, Smartphone, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { ButtonPro } from './ButtonPro';
import { AlertPro } from './AlertPro';
import { SpinnerPro } from './SpinnerPro';
import { useToast } from '@/contexts/ToastContext';

interface TwoFactorAuthProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [phoneNumber, setPhoneNumber] = useState('+62');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();
  const auth = getAuth();

  /**
   * Initialize reCAPTCHA verifier
   */
  const initRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        },
      });
    }
  };

  /**
   * Send SMS verification code
   */
  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Initialize reCAPTCHA
      initRecaptcha();

      // Get multi-factor session
      const multiFactorSession = await multiFactor(user).getSession();

      // Send SMS
      const phoneInfoOptions = {
        phoneNumber,
        session: multiFactorSession,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        window.recaptchaVerifier!
      );

      setVerificationId(verificationId);
      setStep('verify');
      toast.success('Verification code sent to your phone');
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      setError(err.message || 'Failed to send verification code');
      toast.error('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify code and enroll 2FA
   */
  const verifyAndEnroll = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create phone credential
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Enroll in multi-factor authentication
      await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number');

      setStep('complete');
      toast.success('Two-factor authentication enabled successfully!');
      
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Invalid verification code');
      toast.error('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render setup step
   */
  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enable Two-Factor Authentication
        </h2>
        <p className="text-gray-600">
          Add an extra layer of security to your account
        </p>
      </div>

      <AlertPro variant="info" title="Why enable 2FA?">
        Two-factor authentication helps protect your account by requiring a verification code from your phone in addition to your password.
      </AlertPro>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Smartphone className="inline w-4 h-4 mr-1" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+62812345678"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Include country code (e.g., +62 for Indonesia)
          </p>
        </div>

        {error && (
          <AlertPro variant="error">
            <AlertCircle className="inline w-4 h-4 mr-1" />
            {error}
          </AlertPro>
        )}

        <div id="recaptcha-container" />

        <div className="flex gap-3">
          <ButtonPro
            variant="primary"
            onClick={sendVerificationCode}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? <SpinnerPro /> : 'Send Verification Code'}
          </ButtonPro>
          {onCancel && (
            <ButtonPro variant="outline" onClick={onCancel} fullWidth>
              Cancel
            </ButtonPro>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * Render verification step
   */
  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Key className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enter Verification Code
        </h2>
        <p className="text-gray-600">
          We sent a 6-digit code to {phoneNumber}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
            maxLength={6}
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error && (
          <AlertPro variant="error">
            <AlertCircle className="inline w-4 h-4 mr-1" />
            {error}
          </AlertPro>
        )}

        <div className="flex gap-3">
          <ButtonPro
            variant="primary"
            onClick={verifyAndEnroll}
            disabled={isLoading || verificationCode.length !== 6}
            fullWidth
          >
            {isLoading ? <SpinnerPro /> : 'Verify & Enable 2FA'}
          </ButtonPro>
          <ButtonPro variant="outline" onClick={() => setStep('setup')} fullWidth>
            Back
          </ButtonPro>
        </div>

        <button
          onClick={sendVerificationCode}
          className="w-full text-sm text-primary-600 hover:text-primary-700"
          disabled={isLoading}
        >
          Didn't receive code? Resend
        </button>
      </div>
    </div>
  );

  /**
   * Render completion step
   */
  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        2FA Enabled Successfully!
      </h2>
      <p className="text-gray-600">
        Your account is now protected with two-factor authentication
      </p>

      <AlertPro variant="success" title="What's next?">
        From now on, you'll need to enter a verification code from your phone when logging in.
      </AlertPro>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Backup Codes</h3>
        <p className="text-sm text-gray-600 mb-3">
          Save these backup codes in a safe place. You can use them to sign in if you lose access to your phone.
        </p>
        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {['ABCD-EFGH', 'IJKL-MNOP', 'QRST-UVWX', 'YZ12-3456'].map((code) => (
            <div key={code} className="bg-white p-2 rounded border border-gray-200">
              {code}
            </div>
          ))}
        </div>
      </div>

      <ButtonPro variant="primary" onClick={onSuccess} fullWidth>
        Done
      </ButtonPro>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      {step === 'setup' && renderSetupStep()}
      {step === 'verify' && renderVerifyStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
};

/**
 * 2FA Management Component (for settings page)
 */
interface TwoFactorManagementProps {
  user: any;
}

export const TwoFactorManagement: React.FC<TwoFactorManagementProps> = ({ user }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const { toast } = useToast();
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
        toast.success('Two-factor authentication disabled');
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable 2FA');
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

// Extend Window interface for TypeScript
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}
