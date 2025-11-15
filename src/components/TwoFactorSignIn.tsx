/**
 * 2FA Sign-In Component
 * Handles multi-factor authentication during login
 */

import React, { useState } from 'react';
import {
  getAuth,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth';
import { Shield, Key, AlertCircle } from 'lucide-react';
import { ButtonPro } from './ButtonPro';
import { AlertPro } from './AlertPro';
import { SpinnerPro } from './SpinnerPro';

interface TwoFactorSignInProps {
  resolver: any; // MultiFactorResolver from Firebase
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorSignIn: React.FC<TwoFactorSignInProps> = ({
  resolver,
  onSuccess,
  onCancel,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'select' | 'verify'>('select');
  const auth = getAuth();

  /**
   * Initialize reCAPTCHA for phone verification
   */
  const initRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-signin', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });
    }
  };

  /**
   * Send verification code to selected phone
   */
  const sendVerificationCode = async (selectedIndex: number = 0) => {
    setIsLoading(true);
    setError('');

    try {
      // Initialize reCAPTCHA
      initRecaptcha();

      // Get selected phone hint
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[selectedIndex],
        session: resolver.session,
      };

      // Send SMS
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        window.recaptchaVerifier!
      );

      setVerificationId(verificationId);
      setStep('verify');
    } catch (err: any) {
      console.error('Error sending verification code:', err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify code and complete sign-in
   */
  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create phone credential
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      // Complete sign-in
      await resolver.resolveSignIn(multiFactorAssertion);
      
      onSuccess();
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render phone selection step
   */
  const renderSelectStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600">
          Select a phone number to receive your verification code
        </p>
      </div>

      <div className="space-y-3">
        {resolver.hints.map((hint: any, index: number) => (
          <button
            key={index}
            onClick={() => sendVerificationCode(index)}
            disabled={isLoading}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {hint.displayName || 'Phone Number'}
                </div>
                <div className="text-sm text-gray-500">
                  {hint.phoneNumber || 'SMS verification'}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <AlertPro variant="error">
          <AlertCircle className="inline w-4 h-4 mr-1" />
          {error}
        </AlertPro>
      )}

      <div id="recaptcha-container-signin" />

      <ButtonPro variant="outline" onClick={onCancel} fullWidth>
        Cancel
      </ButtonPro>
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
          We sent a 6-digit code to your phone
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
            onClick={verifyCode}
            disabled={isLoading || verificationCode.length !== 6}
            fullWidth
          >
            {isLoading ? <SpinnerPro /> : 'Verify'}
          </ButtonPro>
          <ButtonPro variant="outline" onClick={() => setStep('select')} fullWidth>
            Back
          </ButtonPro>
        </div>

        <button
          onClick={() => sendVerificationCode(0)}
          className="w-full text-sm text-primary-600 hover:text-primary-700"
          disabled={isLoading}
        >
          Didn't receive code? Resend
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      {step === 'select' && renderSelectStep()}
      {step === 'verify' && renderVerifyStep()}
    </div>
  );
};

