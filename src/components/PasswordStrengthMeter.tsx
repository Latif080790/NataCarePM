/**
 * Password Strength Meter Component
 * Visual indicator for password strength with real-time feedback
 */

import { useMemo } from 'react';
import { validatePassword, type PasswordStrength } from '@/utils/passwordValidator';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

const strengthColors: Record<PasswordStrength, { bg: string; text: string; border: string }> = {
  'weak': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  'fair': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  'good': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  'strong': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  'very-strong': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
};

const strengthLabels: Record<PasswordStrength, string> = {
  'weak': 'Lemah',
  'fair': 'Cukup',
  'good': 'Baik',
  'strong': 'Kuat',
  'very-strong': 'Sangat Kuat',
};

const strengthIcons: Record<PasswordStrength, React.ReactNode> = {
  'weak': <XCircle className="w-4 h-4" />,
  'fair': <AlertTriangle className="w-4 h-4" />,
  'good': <Shield className="w-4 h-4" />,
  'strong': <CheckCircle className="w-4 h-4" />,
  'very-strong': <CheckCircle className="w-4 h-4" />,
};

export const PasswordStrengthMeter = ({
  password,
  showRequirements = true,
  className = '',
}: PasswordStrengthMeterProps) => {
  const validation = useMemo(() => {
    if (!password) {
      return {
        valid: false,
        strength: 'weak' as PasswordStrength,
        score: 0,
        errors: [],
        warnings: [],
        suggestions: [],
        estimatedCrackTime: '',
      };
    }
    return validatePassword(password);
  }, [password]);

  const { strength, score, errors, warnings, suggestions, estimatedCrackTime } = validation;
  const colors = strengthColors[strength];

  // Calculate progress bar segments (4 segments)
  const segments = 4;
  const filledSegments = Math.ceil((score / 100) * segments);

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Kekuatan Password:</span>
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
              {strengthIcons[strength]}
              <span className="text-xs font-semibold">{strengthLabels[strength]}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500">{score}/100</span>
        </div>

        {/* Progress segments */}
        <div className="flex space-x-1">
          {Array.from({ length: segments }).map((_, index) => {
            const isFilled = index < filledSegments;
            let segmentColor = 'bg-gray-200';

            if (isFilled) {
              if (strength === 'weak') segmentColor = 'bg-red-500';
              else if (strength === 'fair') segmentColor = 'bg-orange-500';
              else if (strength === 'good') segmentColor = 'bg-yellow-500';
              else if (strength === 'strong') segmentColor = 'bg-green-500';
              else if (strength === 'very-strong') segmentColor = 'bg-emerald-500';
            }

            return (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${segmentColor}`}
              />
            );
          })}
        </div>

        {/* Estimated crack time */}
        {estimatedCrackTime && (
          <p className="text-xs text-gray-600">
            Perkiraan waktu crack: <span className="font-medium">{estimatedCrackTime}</span>
          </p>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className={`border rounded-lg p-3 ${colors.border} ${colors.bg}`}>
          <p className={`text-sm font-semibold ${colors.text} mb-1 flex items-center`}>
            <XCircle className="w-4 h-4 mr-1" />
            Error:
          </p>
          <ul className={`text-xs ${colors.text} space-y-1`}>
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings and suggestions */}
      {(warnings.length > 0 || suggestions.length > 0) && showRequirements && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          {warnings.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 text-yellow-600" />
                Peringatan:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                <Shield className="w-4 h-4 mr-1 text-blue-600" />
                Saran:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Success message for strong passwords */}
      {strength === 'very-strong' && (
        <div className="border border-emerald-300 rounded-lg p-3 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-700 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Password Anda sangat kuat dan aman! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Compact version of password strength meter (just the bar)
 */
export const PasswordStrengthBar = ({ password }: { password: string }) => {
  const validation = useMemo(() => {
    if (!password) return { strength: 'weak' as PasswordStrength, score: 0 };
    const result = validatePassword(password);
    return { strength: result.strength, score: result.score };
  }, [password]);

  const { strength, score } = validation;

  if (!password) return null;

  const segments = 4;
  const filledSegments = Math.ceil((score / 100) * segments);

  return (
    <div className="flex space-x-1">
      {Array.from({ length: segments }).map((_, index) => {
        const isFilled = index < filledSegments;
        let segmentColor = 'bg-gray-200';

        if (isFilled) {
          if (strength === 'weak') segmentColor = 'bg-red-500';
          else if (strength === 'fair') segmentColor = 'bg-orange-500';
          else if (strength === 'good') segmentColor = 'bg-yellow-500';
          else if (strength === 'strong') segmentColor = 'bg-green-500';
          else if (strength === 'very-strong') segmentColor = 'bg-emerald-500';
        }

        return (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${segmentColor}`}
          />
        );
      })}
    </div>
  );
};

/**
 * Password requirements checklist
 */
export const PasswordRequirements = ({ password }: { password: string }) => {
  const requirements = [
    {
      label: 'Minimal 8 karakter',
      test: (p: string) => p.length >= 8,
    },
    {
      label: 'Minimal 1 huruf kapital (A-Z)',
      test: (p: string) => /[A-Z]/.test(p),
    },
    {
      label: 'Minimal 1 huruf kecil (a-z)',
      test: (p: string) => /[a-z]/.test(p),
    },
    {
      label: 'Minimal 1 angka (0-9)',
      test: (p: string) => /[0-9]/.test(p),
    },
    {
      label: 'Minimal 1 karakter khusus (!@#$%^&*)',
      test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Persyaratan Password:</p>
      <ul className="space-y-1.5">
        {requirements.map((req, index) => {
          const passes = password && req.test(password);
          return (
            <li key={index} className="flex items-center space-x-2 text-sm">
              {passes ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <span className={passes ? 'text-green-700' : 'text-gray-600'}>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
