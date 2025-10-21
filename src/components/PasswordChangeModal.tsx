/**
 * Password Change Modal Component
 * Secure password change with visual strength meter and comprehensive validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Lock, Eye, EyeOff, Check, AlertCircle, Shield, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { changePassword } from '@/api/authService';
import {
  validatePassword,
  quickStrengthCheck,
  getPasswordRequirements,
  type PasswordValidationResult,
} from '@/utils/passwordValidator';

// ========================================
// TYPES
// ========================================

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ========================================
// COMPONENT
// ========================================

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // Validation state
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Validate new password on change
  useEffect(() => {
    if (newPassword) {
      const result = validatePassword(newPassword);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [newPassword]);

  // Validate confirm password on change
  useEffect(() => {
    if (confirmPassword) {
      if (newPassword !== confirmPassword) {
        setConfirmError('Password tidak cocok');
      } else {
        setConfirmError(null);
      }
    } else {
      setConfirmError(null);
    }
  }, [newPassword, confirmPassword]);

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setValidation(null);
    setConfirmError(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      addToast('User tidak terautentikasi', 'error');
      return;
    }

    // Validate all fields filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Semua field harus diisi', 'error');
      return;
    }

    // Validate password strength
    if (!validation || !validation.valid) {
      addToast('Password terlalu lemah. Perhatikan persyaratan password.', 'error');
      return;
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      addToast('Password baru dan konfirmasi tidak cocok', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await changePassword({
        userId: currentUser.id,
        currentPassword,
        newPassword,
      });

      if (result.success) {
        addToast('Password berhasil diubah! 🎉', 'success');
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        // Handle specific error codes
        const errorCode = result.error?.code;
        const errorMessage = result.error?.message;

        if (errorCode === 'WRONG_PASSWORD') {
          addToast('Password saat ini salah', 'error');
        } else if (errorCode === 'SAME_PASSWORD') {
          addToast('Password baru tidak boleh sama dengan password lama', 'error');
        } else if (errorCode === 'PASSWORD_REUSED') {
          addToast(errorMessage || 'Password sudah pernah digunakan', 'error');
        } else if (errorCode === 'WEAK_PASSWORD') {
          addToast('Password terlalu lemah', 'error');
        } else if (errorCode === 'REQUIRES_RECENT_LOGIN') {
          addToast('Sesi kadaluarsa. Silakan login ulang.', 'error');
          // Could trigger logout here
        } else {
          addToast(errorMessage || 'Gagal mengubah password', 'error');
        }
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      addToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Get strength data for meter
  const strengthData = newPassword ? quickStrengthCheck(newPassword) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ubah Password</h2>
              <p className="text-sm text-gray-500">Perbarui password akun Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                placeholder="Masukkan password saat ini"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                placeholder="Masukkan password baru"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword && strengthData && (
              <div className="mt-3 space-y-2">
                {/* Strength Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${strengthData.score}%`,
                        backgroundColor: strengthData.color,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{
                      color: strengthData.color,
                      backgroundColor: `${strengthData.color}15`,
                    }}
                  >
                    {strengthData.label}
                  </span>
                </div>

                {/* Validation Messages */}
                {validation && (
                  <div className="space-y-1">
                    {/* Errors */}
                    {validation.errors.map((error, index) => (
                      <div
                        key={`error-${index}`}
                        className="flex items-start gap-2 text-xs text-red-600"
                      >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    ))}

                    {/* Warnings */}
                    {validation.warnings.map((warning, index) => (
                      <div
                        key={`warning-${index}`}
                        className="flex items-start gap-2 text-xs text-amber-600"
                      >
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    ))}

                    {/* Success */}
                    {validation.valid && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <Check className="w-3.5 h-3.5" />
                        <span>Password cukup kuat ✓</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Requirements Toggle */}
            <button
              type="button"
              onClick={() => setShowRequirements(!showRequirements)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 hover:underline"
            >
              {showRequirements ? 'Sembunyikan' : 'Lihat'} persyaratan password
            </button>

            {/* Requirements List */}
            {showRequirements && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">Persyaratan Password:</p>
                <ul className="space-y-1">
                  {getPasswordRequirements().map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-blue-800">
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Password Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${
                  confirmError
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Ketik ulang password baru"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Error */}
            {confirmError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{confirmError}</span>
              </div>
            )}

            {/* Confirm Success */}
            {confirmPassword && !confirmError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <Check className="w-3.5 h-3.5" />
                <span>Password cocok ✓</span>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Untuk keamanan akun Anda:</p>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>Jangan gunakan password yang sama dengan situs lain</li>
                  <li>Ubah password secara berkala (minimal 3 bulan sekali)</li>
                  <li>Jangan bagikan password kepada siapapun</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                !validation?.valid ||
                !!confirmError
              }
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                'Ubah Password'
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;
