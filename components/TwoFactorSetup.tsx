import React, { useState } from 'react';
import { twoFactorService } from '../api/twoFactorService';
import { useAuth } from '../contexts/AuthContext';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type SetupStep = 'intro' | 'generate' | 'scan' | 'verify' | 'backup' | 'complete';

/**
 * Two-Factor Authentication Setup Component
 * 
 * Guides user through 2FA setup process:
 * 1. Introduction
 * 2. Generate QR code
 * 3. Scan with authenticator app
 * 4. Verify code
 * 5. Save backup codes
 * 6. Complete
 * 
 * @example
 * ```tsx
 * <TwoFactorSetup 
 *   onComplete={() => console.log('2FA enabled')} 
 *   onCancel={() => console.log('Setup canceled')} 
 * />
 * ```
 */
export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<SetupStep>('intro');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Introduction
  const renderIntro = () => (
    <div className="2fa-setup-step">
      <div className="step-icon">🔐</div>
      <h2>Setup Two-Factor Authentication</h2>
      <p>Add an extra layer of security to your account by requiring both your password and an authentication code to sign in.</p>
      
      <div className="benefits-list">
        <h3>Benefits:</h3>
        <ul>
          <li>✓ Protect against password theft</li>
          <li>✓ Secure your sensitive data</li>
          <li>✓ Prevent unauthorized access</li>
          <li>✓ Meet security compliance requirements</li>
        </ul>
      </div>

      <div className="requirements-box">
        <h4>What you'll need:</h4>
        <p>An authenticator app on your smartphone:</p>
        <ul>
          <li>• Google Authenticator</li>
          <li>• Microsoft Authenticator</li>
          <li>• Authy</li>
          <li>• Or any TOTP-compatible app</li>
        </ul>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={() => setStep('generate')}>
          Continue
        </button>
        {onCancel && (
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  // Step 2 & 3: Generate QR Code
  const handleGenerate = async () => {
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await twoFactorService.generateSecret(
        currentUser.uid,
        currentUser.email || 'user@natacare.com'
      );
      
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setStep('scan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const renderGenerate = () => {
    if (loading) {
      return (
        <div className="2fa-setup-step loading">
          <div className="spinner"></div>
          <p>Generating your unique QR code...</p>
        </div>
      );
    }

    return (
      <div className="2fa-setup-step">
        <div className="step-icon">🔑</div>
        <h2>Generate Your Secret Key</h2>
        <p>Click below to generate your unique 2FA secret key and QR code.</p>
        
        <div className="button-group">
          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
          <button className="btn-secondary" onClick={() => setStep('intro')}>
            Back
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>
    );
  };

  const renderScan = () => (
    <div className="2fa-setup-step">
      <div className="step-icon">📱</div>
      <h2>Scan QR Code</h2>
      <p>Open your authenticator app and scan this QR code:</p>
      
      {qrCode && (
        <div className="qr-code-container">
          <img src={qrCode} alt="2FA QR Code" className="qr-code" />
        </div>
      )}

      <div className="manual-entry">
        <details>
          <summary>Can't scan? Enter manually</summary>
          <div className="secret-key">
            <code>{secret}</code>
            <button 
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText(secret);
                alert('Secret key copied to clipboard!');
              }}
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <p className="help-text">
            Enter this key manually in your authenticator app.
          </p>
        </details>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={() => setStep('verify')}>
          I've Scanned the Code
        </button>
        <button className="btn-secondary" onClick={() => setStep('generate')}>
          Back
        </button>
      </div>
    </div>
  );

  // Step 4: Verify
  const handleVerify = async () => {
    if (!currentUser || !verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await twoFactorService.enableTwoFactor(currentUser.uid, verificationCode);
      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const renderVerify = () => (
    <div className="2fa-setup-step">
      <div className="step-icon">✓</div>
      <h2>Verify Setup</h2>
      <p>Enter the 6-digit code from your authenticator app to verify setup:</p>
      
      <div className="verification-input-container">
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
          placeholder="000000"
          maxLength={6}
          className="verification-input"
          autoFocus
          disabled={loading}
        />
        <div className="input-hint">
          Enter the 6-digit code shown in your app
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="button-group">
        <button 
          className="btn-primary" 
          onClick={handleVerify} 
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
        <button 
          className="btn-secondary" 
          onClick={() => {
            setStep('scan');
            setVerificationCode('');
            setError('');
          }}
          disabled={loading}
        >
          Back
        </button>
      </div>
    </div>
  );

  // Step 5: Backup Codes
  const renderBackup = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    };

    const handleDownload = () => {
      const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'natacare-backup-codes.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="2fa-setup-step">
        <div className="step-icon warning">⚠️</div>
        <h2>Save Your Backup Codes</h2>
        
        <div className="warning-box">
          <p className="warning-text">
            <strong>Important!</strong> Save these backup codes in a safe place. 
            You can use them to access your account if you lose your phone.
          </p>
          <p className="warning-sub">
            Each code can only be used once. We recommend printing or saving them securely.
          </p>
        </div>

        <div className="backup-codes-container">
          <div className="backup-codes-grid">
            {backupCodes.map((code, idx) => (
              <div key={idx} className="backup-code">
                <span className="code-number">{idx + 1}.</span>
                <span className="code-value">{code}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="backup-actions">
          <button className="btn-action" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy All'}
          </button>
          <button className="btn-action" onClick={handleDownload}>
            💾 Download
          </button>
          <button className="btn-action" onClick={() => window.print()}>
            🖨️ Print
          </button>
        </div>

        <div className="checkbox-container">
          <input type="checkbox" id="saved-checkbox" required />
          <label htmlFor="saved-checkbox">
            I have saved my backup codes in a secure location
          </label>
        </div>

        <div className="button-group">
          <button 
            className="btn-primary" 
            onClick={() => setStep('complete')}
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Step 6: Complete
  const renderComplete = () => (
    <div className="2fa-setup-step complete">
      <div className="step-icon success">✓</div>
      <h2>Two-Factor Authentication Enabled!</h2>
      <p>Your account is now protected with two-factor authentication.</p>
      
      <div className="success-info">
        <div className="info-item">
          <span className="info-icon">🔐</span>
          <div>
            <strong>Enhanced Security</strong>
            <p>Your account now requires both password and authentication code</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">📱</span>
          <div>
            <strong>Authenticator App</strong>
            <p>Use your app to generate codes when signing in</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icon">🔑</span>
          <div>
            <strong>Backup Codes</strong>
            <p>Keep your backup codes safe for emergency access</p>
          </div>
        </div>
      </div>

      <div className="next-steps">
        <h3>Next Steps:</h3>
        <ul>
          <li>You'll be asked for a code from your app when you sign in</li>
          <li>Make sure you keep your phone accessible</li>
          <li>Store your backup codes in a safe place</li>
          <li>You can regenerate backup codes in your security settings</li>
        </ul>
      </div>

      <div className="button-group">
        <button 
          className="btn-primary" 
          onClick={() => {
            onComplete?.();
          }}
        >
          Done
        </button>
      </div>
    </div>
  );

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return renderIntro();
      case 'generate':
        return renderGenerate();
      case 'scan':
        return renderScan();
      case 'verify':
        return renderVerify();
      case 'backup':
        return renderBackup();
      case 'complete':
        return renderComplete();
      default:
        return renderIntro();
    }
  };

  return (
    <div className="two-factor-setup">
      {/* Progress Indicator */}
      {step !== 'complete' && (
        <div className="setup-progress">
          <div className={`progress-step ${['intro', 'generate', 'scan', 'verify', 'backup', 'complete'].indexOf(step) >= 0 ? 'active' : ''}`}>1</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${['scan', 'verify', 'backup', 'complete'].indexOf(step) >= 0 ? 'active' : ''}`}>2</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${['verify', 'backup', 'complete'].indexOf(step) >= 0 ? 'active' : ''}`}>3</div>
          <div className="progress-line"></div>
          <div className={`progress-step ${['backup', 'complete'].indexOf(step) >= 0 ? 'active' : ''}`}>4</div>
        </div>
      )}

      {/* Current Step Content */}
      <div className="setup-content">
        {renderStep()}
      </div>

      <style>{`
        .two-factor-setup {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
        }

        .setup-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .progress-step {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e5e7eb;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .progress-step.active {
          background: #3b82f6;
          color: white;
        }

        .progress-line {
          width: 60px;
          height: 2px;
          background: #e5e7eb;
        }

        .2fa-setup-step {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .step-icon {
          font-size: 48px;
          text-align: center;
          margin-bottom: 16px;
        }

        .step-icon.warning {
          color: #f59e0b;
        }

        .step-icon.success {
          color: #22c55e;
          font-size: 64px;
        }

        .2fa-setup-step h2 {
          text-align: center;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .2fa-setup-step p {
          text-align: center;
          color: #6b7280;
          margin-bottom: 24px;
        }

        .benefits-list, .requirements-box {
          margin: 24px 0;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .benefits-list h3, .requirements-box h4 {
          margin-bottom: 12px;
          color: #1f2937;
        }

        .benefits-list ul, .requirements-box ul {
          list-style: none;
          padding: 0;
        }

        .benefits-list li {
          padding: 8px 0;
          color: #16a34a;
        }

        .requirements-box ul li {
          padding: 4px 0;
          color: #6b7280;
        }

        .button-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
        }

        .btn-primary, .btn-secondary, .btn-action {
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
        }

        .btn-action {
          background: #f3f4f6;
          color: #1f2937;
          flex: 1;
        }

        .btn-action:hover {
          background: #e5e7eb;
        }

        .qr-code-container {
          display: flex;
          justify-content: center;
          margin: 24px 0;
        }

        .qr-code {
          width: 300px;
          height: 300px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .manual-entry {
          margin: 24px 0;
        }

        .manual-entry summary {
          cursor: pointer;
          color: #3b82f6;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .secret-key {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
          margin: 12px 0;
        }

        .secret-key code {
          flex: 1;
          font-family: monospace;
          font-size: 14px;
          letter-spacing: 2px;
        }

        .btn-copy {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .verification-input-container {
          margin: 24px 0;
        }

        .verification-input {
          width: 100%;
          padding: 16px;
          font-size: 32px;
          text-align: center;
          letter-spacing: 8px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-family: monospace;
        }

        .verification-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .input-hint {
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          margin-top: 8px;
        }

        .warning-box {
          background: #fef3c7;
          border: 2px solid #fbbf24;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }

        .warning-text {
          color: #92400e;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .warning-sub {
          color: #78350f;
          font-size: 14px;
        }

        .backup-codes-container {
          margin: 24px 0;
        }

        .backup-codes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .backup-code {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 14px;
        }

        .code-number {
          color: #9ca3af;
          min-width: 24px;
        }

        .code-value {
          color: #1f2937;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .backup-actions {
          display: flex;
          gap: 12px;
          margin: 24px 0;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 24px 0;
          padding: 12px;
          background: #f0fdf4;
          border-radius: 6px;
        }

        .checkbox-container input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .checkbox-container label {
          color: #166534;
          font-size: 14px;
          cursor: pointer;
        }

        .success-info {
          margin: 24px 0;
        }

        .info-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          margin-bottom: 12px;
          background: #f0fdf4;
          border-radius: 8px;
          border-left: 4px solid #22c55e;
        }

        .info-icon {
          font-size: 24px;
        }

        .info-item strong {
          display: block;
          color: #166534;
          margin-bottom: 4px;
        }

        .info-item p {
          margin: 0;
          font-size: 13px;
          color: #16a34a;
          text-align: left;
        }

        .next-steps {
          margin: 24px 0;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .next-steps h3 {
          color: #1f2937;
          margin-bottom: 12px;
        }

        .next-steps ul {
          padding-left: 20px;
        }

        .next-steps li {
          color: #6b7280;
          margin-bottom: 8px;
          line-height: 1.6;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 14px;
          margin: 16px 0;
        }

        .error-icon {
          font-size: 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .2fa-setup-step.loading {
          text-align: center;
          padding: 60px 32px;
        }

        .2fa-setup-step.complete {
          text-align: center;
        }

        @media print {
          .button-group, .setup-progress {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TwoFactorSetup;
