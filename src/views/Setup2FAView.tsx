/**
 * Setup Two-Factor Authentication View
 * Wizard-style interface for enabling TOTP-based 2FA
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { generateTOTPSecret, enrollTOTP, getTOTPStatus } from '@/api/totpAuthService';
import { ButtonPro } from '@/components/ButtonPro';
import { CardPro } from '@/components/CardPro';
import { LoadingState } from '@/components/StateComponents';
import { Shield, Smartphone, Key, CheckCircle, Copy, AlertCircle } from 'lucide-react';

type SetupStep = 'intro' | 'qrcode' | 'verify' | 'backup' | 'complete';

const Setup2FAView = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  // Check if 2FA is already enabled
  useEffect(() => {
    const checkStatus = async () => {
      if (!currentUser) return;

      const status = await getTOTPStatus(currentUser.uid);
      if (status.enabled) {
        addToast('2FA sudah aktif untuk akun Anda', 'info');
        navigate('/profile');
      }
    };

    checkStatus();
  }, [currentUser, navigate, addToast]);

  // Generate TOTP secret when reaching QR code step
  useEffect(() => {
    if (currentStep === 'qrcode' && !secret) {
      handleGenerateSecret();
    }
  }, [currentStep]);

  const handleGenerateSecret = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    try {
      const result = await generateTOTPSecret(currentUser.uid, currentUser.email);

      if (result.success && result.secret && result.qrCodeUrl && result.manualEntryKey) {
        setSecret(result.secret);
        setQrCodeUrl(result.qrCodeUrl);
        setManualEntryKey(result.manualEntryKey);
      } else {
        addToast(result.error || 'Gagal membuat secret 2FA', 'error');
        setCurrentStep('intro');
      }
    } catch (error: any) {
      addToast(error.message || 'Terjadi kesalahan', 'error');
      setCurrentStep('intro');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnroll = async () => {
    if (!currentUser || !secret || !verificationCode) return;

    if (verificationCode.length !== 6) {
      addToast('Kode verifikasi harus 6 digit', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await enrollTOTP(currentUser.uid, secret, verificationCode);

      if (result.success && result.backupCodes) {
        setBackupCodes(result.backupCodes);
        setCurrentStep('backup');
        addToast('2FA berhasil diaktifkan!', 'success');
      } else {
        addToast(result.error || 'Kode verifikasi tidak valid', 'error');
      }
    } catch (error: any) {
      addToast(error.message || 'Gagal memverifikasi kode', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    addToast('Kode backup disalin ke clipboard', 'success');
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `natacare-backup-codes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Kode backup berhasil diunduh', 'success');
    setBackupCodesSaved(true);
  };

  const handleComplete = () => {
    if (!backupCodesSaved) {
      const confirmed = confirm(
        'Anda belum menyimpan kode backup. Kode ini diperlukan jika Anda kehilangan akses ke aplikasi authenticator. Lanjutkan?'
      );
      if (!confirmed) return;
    }

    setCurrentStep('complete');
  };

  const renderIntroStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Aktifkan Two-Factor Authentication
        </h2>
        <p className="text-gray-600">
          Tambahkan lapisan keamanan ekstra untuk melindungi akun Anda
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Apa itu 2FA?</h3>
        <p className="text-sm text-blue-800">
          Two-Factor Authentication (2FA) memerlukan dua bentuk verifikasi saat login: password Anda
          dan kode 6 digit dari aplikasi authenticator di smartphone Anda.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Yang Anda butuhkan:</h3>
        <div className="flex items-start space-x-3">
          <Smartphone className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Aplikasi Authenticator</p>
            <p className="text-sm text-gray-600">
              Google Authenticator, Authy, Microsoft Authenticator, atau aplikasi TOTP lainnya
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Key className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Tempat Aman untuk Kode Backup</p>
            <p className="text-sm text-gray-600">
              Anda akan menerima kode backup yang harus disimpan dengan aman
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <ButtonPro variant="outline" onClick={() => navigate('/profile')} className="flex-1">
          Batal
        </ButtonPro>
        <ButtonPro variant="primary" onClick={() => setCurrentStep('qrcode')} className="flex-1">
          Mulai Setup
        </ButtonPro>
      </div>
    </div>
  );

  const renderQRCodeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
        <p className="text-gray-600">Gunakan aplikasi authenticator untuk scan QR code ini</p>
      </div>

      {loading ? (
        <div className="py-12">
          <LoadingState />
        </div>
      ) : (
        <>
          {qrCodeUrl && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Tidak bisa scan? Masukkan manual:
            </h3>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono">
                {manualEntryKey}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(manualEntryKey);
                  addToast('Key disalin!', 'success');
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <ButtonPro variant="outline" onClick={() => setCurrentStep('intro')} className="flex-1">
              Kembali
            </ButtonPro>
            <ButtonPro variant="primary" onClick={() => setCurrentStep('verify')} className="flex-1">
              Lanjutkan
            </ButtonPro>
          </div>
        </>
      )}
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Setup</h2>
        <p className="text-gray-600">
          Masukkan kode 6 digit dari aplikasi authenticator untuk memverifikasi setup
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
            Kode Verifikasi
          </label>
          <input
            id="verificationCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2">
            Kode akan berubah setiap 30 detik
          </p>
        </div>
      </div>

      <div className="flex space-x-3">
        <ButtonPro variant="outline" onClick={() => setCurrentStep('qrcode')} className="flex-1" disabled={loading}>
          Kembali
        </ButtonPro>
        <ButtonPro
          variant="primary"
          onClick={handleVerifyAndEnroll}
          className="flex-1"
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </ButtonPro>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Simpan Kode Backup</h2>
        <p className="text-gray-600">
          Kode ini diperlukan jika Anda kehilangan akses ke aplikasi authenticator
        </p>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <p className="text-sm font-semibold text-yellow-900 mb-2">
          ⚠️ PENTING: Simpan kode-kode ini di tempat yang aman!
        </p>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Setiap kode hanya bisa digunakan sekali</li>
          <li>• Jangan bagikan kode ini kepada siapapun</li>
          <li>• Anda tidak akan melihat kode ini lagi setelah halaman ini</li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((code, index) => (
            <code
              key={index}
              className="bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono text-center"
            >
              {code}
            </code>
          ))}
        </div>

        <div className="flex space-x-2">
          <ButtonPro variant="secondary" icon={Copy} onClick={handleCopyBackupCodes} className="flex-1">
            Salin
          </ButtonPro>
          <ButtonPro variant="secondary" onClick={handleDownloadBackupCodes} className="flex-1">
            Unduh
          </ButtonPro>
        </div>
      </div>

      <div className="flex space-x-3">
        <ButtonPro variant="primary" onClick={handleComplete} className="flex-1">
          Saya Sudah Menyimpan Kode
        </ButtonPro>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">2FA Berhasil Diaktifkan! 🎉</h2>
        <p className="text-gray-600">
          Akun Anda sekarang lebih aman dengan two-factor authentication
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
        <h3 className="font-semibold text-green-900 mb-2">Langkah Selanjutnya:</h3>
        <ul className="text-sm text-green-800 space-y-2">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Simpan kode backup di tempat yang aman (password manager, brankas, dll)</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Pastikan aplikasi authenticator Anda sudah ter-backup</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span>Saat login berikutnya, Anda akan diminta memasukkan kode 6 digit</span>
          </li>
        </ul>
      </div>

      <ButtonPro variant="primary" onClick={() => navigate('/profile')} className="w-full">
        Selesai
      </ButtonPro>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return renderIntroStep();
      case 'qrcode':
        return renderQRCodeStep();
      case 'verify':
        return renderVerifyStep();
      case 'backup':
        return renderBackupStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderIntroStep();
    }
  };

  const getStepNumber = () => {
    const steps = {
      intro: 1,
      qrcode: 2,
      verify: 3,
      backup: 4,
      complete: 5,
    };
    return steps[currentStep];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        {currentStep !== 'complete' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Langkah {getStepNumber()} dari 5
              </span>
              <span className="text-sm text-gray-500">{Math.round((getStepNumber() / 5) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(getStepNumber() / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Main card */}
        <CardPro variant="elevated" className="bg-white">
          <div className="p-8">{renderStep()}</div>
        </CardPro>

        {/* Help text */}
        {currentStep !== 'complete' && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Butuh bantuan?{' '}
              <a href="/help/2fa" className="text-blue-600 hover:text-blue-700 font-medium">
                Lihat Panduan Setup 2FA
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Setup2FAView;

