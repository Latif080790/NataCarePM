/**
 * Verify 2FA Modal
 * Modal for entering TOTP code during login
 */

import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { ButtonPro } from '@/components/ButtonPro';
import { Shield, AlertCircle, Key } from 'lucide-react';

interface Verify2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string, isBackupCode?: boolean) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export const Verify2FAModal = ({
  isOpen,
  onClose,
  onVerify,
  loading = false,
  error = null,
}: Verify2FAModalProps) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || loading) return;

    await onVerify(code, useBackupCode);
  };

  const handleClose = () => {
    if (!loading) {
      setCode('');
      setUseBackupCode(false);
      onClose();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (useBackupCode) {
      // Backup code format: XXXX-XXXX (allow letters, numbers, hyphen)
      setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, '').substring(0, 9));
    } else {
      // TOTP code: 6 digits only
      setCode(value.replace(/\D/g, '').substring(0, 6));
    }
  };

  const isValidCode = useBackupCode ? code.length === 9 : code.length === 6;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Verifikasi Two-Factor Authentication"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600">
            {useBackupCode
              ? 'Masukkan salah satu kode backup Anda'
              : 'Masukkan kode 6 digit dari aplikasi authenticator'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Verifikasi Gagal</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {useBackupCode ? 'Kode Backup' : 'Kode Verifikasi'}
          </label>
          <input
            id="code"
            type="text"
            inputMode={useBackupCode ? 'text' : 'numeric'}
            value={code}
            onChange={handleCodeChange}
            placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={loading}
            autoFocus
            autoComplete="off"
          />
          {!useBackupCode && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Kode akan berubah setiap 30 detik
            </p>
          )}
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            disabled={loading}
          >
            <Key className="w-4 h-4" />
            <span>
              {useBackupCode
                ? 'Gunakan kode dari aplikasi authenticator'
                : 'Gunakan kode backup'}
            </span>
          </button>
        </div>

        <div className="flex space-x-3 pt-4">
          <ButtonPro
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={loading}
          >
            Batal
          </ButtonPro>
          <ButtonPro
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={!isValidCode || loading}
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </ButtonPro>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Tidak bisa mengakses aplikasi authenticator atau kode backup?{' '}
            <a
              href="/help/2fa-recovery"
              className="text-blue-600 hover:text-blue-700 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pelajari cara recovery akun
            </a>
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default Verify2FAModal;
