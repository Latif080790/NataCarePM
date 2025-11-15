import React, { useState, FormEvent, useEffect } from 'react';
import { CardPro, CardProHeader, CardProContent, CardProTitle, CardProDescription } from '@/components/CardPro';
import { ButtonPro, ButtonProGroup } from '@/components/ButtonPro';
import { InputPro, FormGroupPro } from '@/components/FormComponents';
import { LoadingState, ErrorState } from '@/components/StateComponents';
import { useAuth } from '@/contexts/AuthContext';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { TwoFactorSetup } from '@/components/TwoFactorSetup';
import { twoFactorService } from '@/api/twoFactorService';
import { User, Lock, Save, Shield, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

const ProfileView = React.memo(function ProfileView() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [checking2FA, setChecking2FA] = useState(true);

  // Profile form state
  const [name, setName] = useState(currentUser?.name || '');
  const [email] = useState(currentUser?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check 2FA status on mount
  useEffect(() => {
    const check2FAStatus = async () => {
      if (currentUser) {
        try {
          const enabled = await twoFactorService.isEnabled(currentUser.uid);
          setIs2FAEnabled(enabled);
        } catch (err) {
          console.error('Failed to check 2FA status:', err);
        } finally {
          setChecking2FA(false);
        }
      }
    };
    check2FAStatus();
  }, [currentUser]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.id), {
        name,
        avatarUrl,
      });

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: avatarUrl,
        });
      }

      setSuccess('Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Gagal memperbarui profil: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser) {
    return <LoadingState message="Loading profile..." size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Profile Information Card */}
      <CardPro variant="elevated">
        <CardProHeader>
          <CardProTitle>Profil Pengguna</CardProTitle>
          <CardProDescription>Kelola informasi profil Anda</CardProDescription>
        </CardProHeader>
        <CardProContent>
          <div className="flex items-start gap-6 mb-6">
            <div className="flex-shrink-0">
              <ProfilePhotoUpload />
            </div>

            <div className="flex-1">
              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nama</label>
                    <p className="text-lg font-semibold text-gray-900">{currentUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-lg text-gray-900">{currentUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Role</label>
                    <p className="text-lg capitalize text-gray-900">{currentUser.roleId}</p>
                  </div>
                  <ButtonPro variant="primary" icon={User} onClick={() => setIsEditing(true)} className="mt-4">
                    Edit Profil
                  </ButtonPro>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <FormGroupPro label="Nama" required>
                    <InputPro
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSaving}
                      required
                    />
                  </FormGroupPro>
                  
                  <FormGroupPro label="Email" helpText="Email tidak dapat diubah">
                    <InputPro 
                      type="email" 
                      value={email} 
                      disabled={true} 
                      className="bg-gray-100" 
                    />
                  </FormGroupPro>
                  
                  <FormGroupPro label="Avatar URL">
                    <InputPro
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      disabled={isSaving}
                    />
                  </FormGroupPro>

                  <ButtonProGroup>
                    <ButtonPro 
                      type="submit" 
                      variant="primary" 
                      icon={Save}
                      disabled={isSaving}
                      isLoading={isSaving}
                    >
                      Simpan
                    </ButtonPro>
                    <ButtonPro
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setName(currentUser.name);
                        setAvatarUrl(currentUser.avatarUrl);
                      }}
                      disabled={isSaving}
                    >
                      Batal
                    </ButtonPro>
                  </ButtonProGroup>
                </form>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
        </CardProContent>
      </CardPro>

      {/* Change Password Card */}
      <CardPro variant="elevated">
        <CardProHeader>
          <CardProTitle>Keamanan Akun</CardProTitle>
          <CardProDescription>Kelola password dan keamanan akun Anda</CardProDescription>
        </CardProHeader>
        <CardProContent>
          <div className="space-y-6">
            {/* Password Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Gunakan password yang kuat untuk melindungi akun Anda. Disarankan mengubah password
                secara berkala.
              </p>
              <ButtonPro variant="outline" icon={Lock} onClick={() => setShowPasswordModal(true)}>
                Ubah Password
              </ButtonPro>
            </div>

            {/* 2FA Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                {is2FAEnabled ? (
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Autentikasi Dua Faktor (2FA)
              </h3>

              {checking2FA ? (
                <LoadingState message="Memeriksa status 2FA..." size="sm" />
              ) : (
                <>
                  {is2FAEnabled ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Autentikasi dua faktor aktif
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Akun Anda dilindungi dengan keamanan tambahan
                        </p>
                      </div>
                      <ButtonProGroup>
                        <ButtonPro
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (
                              window.confirm(
                                'Apakah Anda yakin ingin menonaktifkan 2FA? Ini akan mengurangi keamanan akun Anda.'
                              )
                            ) {
                              try {
                                const code = window.prompt(
                                  'Masukkan kode dari authenticator app untuk konfirmasi:'
                                );
                                if (code && currentUser) {
                                  await twoFactorService.disable(currentUser.uid, code);
                                  setIs2FAEnabled(false);
                                  setSuccess('Autentikasi dua faktor berhasil dinonaktifkan');
                                  setTimeout(() => setSuccess(''), 5000);
                                }
                              } catch (err) {
                                setError('Gagal menonaktifkan 2FA. Pastikan kode Anda benar.');
                                setTimeout(() => setError(''), 5000);
                              }
                            }
                          }}
                        >
                          Nonaktifkan 2FA
                        </ButtonPro>
                        <ButtonPro
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (
                              window.confirm(
                                'Regenerate backup codes? Kode lama tidak akan bisa digunakan lagi.'
                              )
                            ) {
                              try {
                                const code = window.prompt(
                                  'Masukkan kode dari authenticator app untuk konfirmasi:'
                                );
                                if (code && currentUser) {
                                  const newCodes = await twoFactorService.regenerateBackupCodes(
                                    currentUser.uid,
                                    code
                                  );
                                  alert(
                                    `Backup codes baru:\n\n${newCodes.join('\n')}\n\nSimpan di tempat yang aman!`
                                  );
                                  setSuccess('Backup codes berhasil dibuat ulang');
                                  setTimeout(() => setSuccess(''), 5000);
                                }
                              } catch (err) {
                                setError(
                                  'Gagal membuat ulang backup codes. Pastikan kode Anda benar.'
                                );
                                setTimeout(() => setError(''), 5000);
                              }
                            }
                          }}
                        >
                          Regenerate Backup Codes
                        </ButtonPro>
                      </ButtonProGroup>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Autentikasi dua faktor tidak aktif
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Aktifkan 2FA untuk meningkatkan keamanan akun Anda
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Tambahkan lapisan keamanan ekstra dengan mengaktifkan autentikasi dua
                        faktor. Anda akan memerlukan kode dari aplikasi authenticator setiap kali
                        login.
                      </p>
                      <ButtonPro variant="primary" icon={Shield} onClick={() => setShow2FASetup(true)}>
                        Aktifkan 2FA
                      </ButtonPro>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardProContent>
      </CardPro>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setSuccess('Password berhasil diubah!');
          setTimeout(() => setSuccess(''), 5000);
        }}
      />

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-5">
          <CardPro className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <TwoFactorSetup
              onComplete={() => {
                setShow2FASetup(false);
                setIs2FAEnabled(true);
                setSuccess('Autentikasi dua faktor berhasil diaktifkan!');
                setTimeout(() => setSuccess(''), 5000);
              }}
              onCancel={() => setShow2FASetup(false)}
            />
          </CardPro>
        </div>
      )}
    </div>
  );
});

export default ProfileView;
