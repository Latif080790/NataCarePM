import React from 'react';
import {
  validatePassword,
  getPasswordStrengthColor,
  estimateCrackTime
} from '@/utils/passwordValidator';

interface PasswordStrengthIndicatorProps {
  password: string;
  show?: boolean;
}

/**
 * Password Strength Indicator Component
 *
 * Displays real-time feedback on password strength as user types.
 * Shows strength bar, level, and specific improvement suggestions.
 *
 * @example
 * ```tsx
 * <PasswordStrengthIndicator password={password} show={password.length > 0} />
 * ```
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  show = true,
}) => {
  if (!show || !password) {
    return null;
  }

  const strength = validatePassword(password);
  const color = getPasswordStrengthColor(strength.level);
  const crackTime = estimateCrackTime(password);

  return (
    <div style={{ marginTop: '12px', marginBottom: '8px' }}>
      {/* Strength Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '6px',
            backgroundColor: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${strength.score}%`,
              height: '100%',
              backgroundColor: color,
              transition: 'width 0.3s ease, background-color 0.3s ease',
              borderRadius: '3px',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: color,
            minWidth: '80px',
            textAlign: 'right',
          }}
        >
          {strength.level.toUpperCase()}
        </span>
      </div>

      {/* Score and Crack Time */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '8px',
        }}
      >
        <span>Strength: {strength.score}/100</span>
        <span>Time to crack: {crackTime}</span>
      </div>

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div
          style={{
            backgroundColor: strength.isValid ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${strength.isValid ? '#86efac' : '#fecaca'}`,
            borderRadius: '6px',
            padding: '8px 12px',
            marginTop: '8px',
          }}
        >
          <ul
            style={{
              margin: '0',
              padding: '0 0 0 20px',
              fontSize: '12px',
              lineHeight: '1.6',
            }}
          >
            {strength.feedback.map((message, idx) => (
              <li
                key={idx}
                style={{
                  color: message.startsWith('✓') ? '#16a34a' : '#dc2626',
                  marginBottom: idx < strength.feedback.length - 1 ? '4px' : '0',
                }}
              >
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements Checklist */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#6b7280',
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: '6px' }}>Requirements:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <RequirementItem met={password.length >= 12} label="12+ characters" />
          <RequirementItem met={/[A-Z]/.test(password)} label="Uppercase letter" />
          <RequirementItem met={/[a-z]/.test(password)} label="Lowercase letter" />
          <RequirementItem met={/[0-9]/.test(password)} label="Number" />
          <RequirementItem
            met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)}
            label="Special character"
          />
          <RequirementItem met={strength.score >= 80} label="Strong enough" />
        </div>
      </div>
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  label: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, label }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: met ? '#16a34a' : '#9ca3af',
    }}
  >
    <span style={{ fontSize: '14px' }}>{met ? '✓' : '○'}</span>
    <span>{label}</span>
  </div>
);

export default PasswordStrengthIndicator;
