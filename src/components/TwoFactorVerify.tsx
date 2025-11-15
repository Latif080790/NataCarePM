import React, { useState, useEffect, useRef } from 'react';
import { twoFactorService } from '@/api/twoFactorService';

interface TwoFactorVerifyProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
  showBackupCodeOption?: boolean;
}

/**
 * Two-Factor Authentication Verification Component
 *
 * Used during login to verify 2FA code from authenticator app or backup code.
 *
 * Features:
 * - 6-digit TOTP code input with auto-focus
 * - Backup code fallback option
 * - Rate limiting feedback (attempts remaining)
 * - Auto-clear on error
 * - Keyboard navigation support
 *
 * @example
 * ```tsx
 * <TwoFactorVerify
 *   userId={user.uid}
 *   onSuccess={() => completeLogin()}
 *   onCancel={() => logout()}
 *   showBackupCodeOption={true}
 * />
 * ```
 */
export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  userId,
  onSuccess,
  onCancel,
  showBackupCodeOption = true,
}) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Auto-focus when switching between TOTP and backup code
    inputRef.current?.focus();
  }, [useBackupCode]);

  const handleVerify = async () => {
    if (!code || (useBackupCode && code.length !== 8) || (!useBackupCode && code.length !== 6)) {
      setError(
        `Please enter a valid ${useBackupCode ? '8-character backup code' : '6-digit code'}`
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await twoFactorService.verifyCode(userId, code);

      if (result) {
        // Show success message briefly before calling onSuccess
        setError('');
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        throw new Error('Verification failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid code';
      setError(errorMessage);

      // Decrement attempts counter
      setAttempts((prev) => Math.max(0, prev - 1));

      // Clear input on error
      setCode('');
      inputRef.current?.focus();

      // Check if rate limited
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
        setAttempts(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    if (useBackupCode) {
      // Backup code: 8 alphanumeric characters
      const sanitized = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
      setCode(sanitized);
    } else {
      // TOTP: 6 digits only
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      setCode(sanitized);
    }
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
    setError('');
  };

  return (
    <div className="two-factor-verify-overlay">
      <div className="two-factor-verify-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>🔐 Two-Factor Authentication</h2>
          <p className="modal-subtitle">
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the code from your authenticator app'}
          </p>
        </div>

        {/* Input Section */}
        <div className="modal-body">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={useBackupCode ? 'ABCD1234' : '000000'}
              maxLength={useBackupCode ? 8 : 6}
              className={`verification-input ${error ? 'error' : ''}`}
              disabled={loading || attempts === 0}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <div className="input-hint">
              {useBackupCode ? 'Enter 8-character backup code' : 'Enter 6-digit code from your app'}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Attempts Counter */}
          {attempts < 3 && attempts > 0 && (
            <div className="attempts-warning">
              <span className="warning-icon">⚠️</span>
              <span>
                {attempts} attempt{attempts !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}

          {/* Rate Limit Message */}
          {attempts === 0 && (
            <div className="rate-limit-message">
              <span className="error-icon">🚫</span>
              <span>Too many failed attempts. Please try again later.</span>
            </div>
          )}

          {/* Backup Code Toggle */}
          {showBackupCodeOption && (
            <div className="backup-toggle">
              <button
                type="button"
                className="toggle-link"
                onClick={toggleBackupCode}
                disabled={loading}
              >
                {useBackupCode
                  ? '← Use authenticator app instead'
                  : "Can't access your app? Use backup code →"}
              </button>
            </div>
          )}

          {/* Help Text */}
          {useBackupCode && (
            <div className="help-box">
              <p className="help-title">Using a backup code</p>
              <ul className="help-list">
                <li>Each backup code can only be used once</li>
                <li>Codes are case-insensitive</li>
                <li>Generate new codes in your security settings</li>
              </ul>
            </div>
          )}

          {!useBackupCode && (
            <div className="help-box">
              <p className="help-title">Can't find your code?</p>
              <ul className="help-list">
                <li>Open your authenticator app</li>
                <li>Find the NataCarePM entry</li>
                <li>Enter the 6-digit code shown</li>
                <li>Codes refresh every 30 seconds</li>
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-footer">
          <button
            className="btn-verify"
            onClick={handleVerify}
            disabled={
              loading || attempts === 0 || (useBackupCode ? code.length !== 8 : code.length !== 6)
            }
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>

          {onCancel && (
            <button className="btn-cancel" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
        </div>

        {/* Security Note */}
        <div className="security-note">
          <span className="note-icon">🔒</span>
          <span>Your authentication code is required to protect your account</span>
        </div>
      </div>

      <style>{`
        .two-factor-verify-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .two-factor-verify-modal {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
          overflow: hidden;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 32px 32px 24px;
          border-bottom: 1px solid #e5e7eb;
          text-align: center;
        }

        .modal-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          color: #1f2937;
          font-weight: 700;
        }

        .modal-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .modal-body {
          padding: 32px;
        }

        .input-container {
          margin-bottom: 20px;
        }

        .verification-input {
          width: 100%;
          padding: 20px;
          font-size: 32px;
          text-align: center;
          letter-spacing: 8px;
          border: 3px solid #e5e7eb;
          border-radius: 12px;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          transition: all 0.2s ease;
          background: #f9fafb;
        }

        .verification-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .verification-input.error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .verification-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-hint {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          margin-top: 12px;
        }

        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .error-icon {
          font-size: 18px;
        }

        .attempts-warning {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          color: #92400e;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .warning-icon {
          font-size: 16px;
        }

        .rate-limit-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          color: #991b1b;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .backup-toggle {
          text-align: center;
          margin: 24px 0;
        }

        .toggle-link {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          padding: 8px;
          transition: color 0.2s ease;
        }

        .toggle-link:hover:not(:disabled) {
          color: #2563eb;
          text-decoration: underline;
        }

        .toggle-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .help-box {
          padding: 16px;
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          border-radius: 6px;
          margin-top: 20px;
        }

        .help-title {
          margin: 0 0 8px 0;
          font-weight: 600;
          color: #1e40af;
          font-size: 14px;
        }

        .help-list {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: #1e3a8a;
        }

        .help-list li {
          margin-bottom: 4px;
          line-height: 1.5;
        }

        .modal-footer {
          padding: 24px 32px 32px;
          display: flex;
          gap: 12px;
        }

        .btn-verify, .btn-cancel {
          flex: 1;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-verify {
          background: #3b82f6;
          color: white;
        }

        .btn-verify:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-verify:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-verify:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-cancel {
          background: transparent;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 32px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }

        .note-icon {
          font-size: 14px;
        }

        /* Responsive Design */
        @media (max-width: 600px) {
          .two-factor-verify-modal {
            border-radius: 12px;
          }

          .modal-header {
            padding: 24px 20px 16px;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .modal-body {
            padding: 24px 20px;
          }

          .verification-input {
            font-size: 24px;
            padding: 16px;
            letter-spacing: 4px;
          }

          .modal-footer {
            padding: 16px 20px 24px;
            flex-direction: column;
          }

          .btn-verify, .btn-cancel {
            width: 100%;
          }
        }

        /* High Contrast Mode Support */
        @media (prefers-contrast: high) {
          .verification-input {
            border-width: 3px;
          }

          .btn-verify {
            border: 2px solid #1e40af;
          }
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .two-factor-verify-modal {
            background: #1f2937;
          }

          .modal-header {
            border-bottom-color: #374151;
          }

          .modal-header h2 {
            color: #f9fafb;
          }

          .modal-subtitle {
            color: #9ca3af;
          }

          .verification-input {
            background: #111827;
            border-color: #374151;
            color: #f9fafb;
          }

          .verification-input:focus {
            background: #1f2937;
          }

          .input-hint {
            color: #6b7280;
          }

          .help-box {
            background: #1e3a5f;
            border-left-color: #3b82f6;
          }

          .help-title {
            color: #93c5fd;
          }

          .help-list {
            color: #bfdbfe;
          }

          .security-note {
            background: #111827;
            border-top-color: #374151;
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
};

export default TwoFactorVerify;

