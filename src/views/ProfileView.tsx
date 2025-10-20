import React from 'react';
import { useState, FormEvent, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormControls';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';
import { PasswordChangeModal } from '@/components/PasswordChangeModal';
import { TwoFactorSetup } from '@/components/TwoFactorSetup';
import { twoFactorService } from '@/api/twoFactorService';
import { User, Lock, Save, Camera, Shield, ShieldCheck } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

export default function ProfileView() {
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
                avatarUrl
            });
            
            // Update Firebase Auth profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: name,
                    photoURL: avatarUrl
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
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Profil Pengguna</CardTitle>
                    <CardDescription>Kelola informasi profil Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6 mb-6">
                        <div className="flex-shrink-0">
                            {/* New ProfilePhotoUpload component with interactive crop */}
                            <ProfilePhotoUpload />
                        </div>
                        
                        <div className="flex-1">
                            {!isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-palladium">Nama</label>
                                        <p className="text-lg font-semibold">{currentUser.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-palladium">Email</label>
                                        <p className="text-lg">{currentUser.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-palladium">Role</label>
                                        <p className="text-lg capitalize">{currentUser.roleId}</p>
                                    </div>
                                    <Button onClick={() => setIsEditing(true)} className="mt-4">
                                        <User className="w-4 h-4 mr-2" />
                                        Edit Profil
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-palladium mb-1">Nama</label>
                                        <Input 
                                            type="text" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                            disabled={isSaving}
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-palladium mb-1">Email</label>
                                        <Input 
                                            type="email" 
                                            value={email} 
                                            disabled={true}
                                            className="bg-gray-100"
                                        />
                                        <p className="text-xs text-palladium mt-1">Email tidak dapat diubah</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-palladium mb-1">Avatar URL</label>
                                        <Input 
                                            type="url" 
                                            value={avatarUrl} 
                                            onChange={(e) => setAvatarUrl(e.target.value)} 
                                            placeholder="https://example.com/avatar.jpg"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                                            Simpan
                                        </Button>
                                        <Button 
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
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                    
                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-600">{success}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Keamanan Akun</CardTitle>
                    <CardDescription>Kelola password dan keamanan akun Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Password Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Password
                            </h3>
                            <p className="text-sm text-palladium mb-3">
                                Gunakan password yang kuat untuk melindungi akun Anda. 
                                Disarankan mengubah password secara berkala.
                            </p>
                            <Button onClick={() => setShowPasswordModal(true)}>
                                <Lock className="w-4 h-4 mr-2" />
                                Ubah Password
                            </Button>
                        </div>

                        {/* 2FA Section */}
                        <div className="border-t pt-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                {is2FAEnabled ? (
                                    <ShieldCheck className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Shield className="w-4 h-4" />
                                )}
                                Autentikasi Dua Faktor (2FA)
                            </h3>
                            
                            {checking2FA ? (
                                <div className="flex items-center gap-2 text-sm text-palladium">
                                    <Spinner size="sm" />
                                    Memeriksa status 2FA...
                                </div>
                            ) : (
                                <>
                                    {is2FAEnabled ? (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                                                    ✓ Autentikasi dua faktor aktif
                                                </p>
                                                <p className="text-xs text-green-600 mt-1">
                                                    Akun Anda dilindungi dengan keamanan tambahan
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (window.confirm('Apakah Anda yakin ingin menonaktifkan 2FA? Ini akan mengurangi keamanan akun Anda.')) {
                                                            try {
                                                                const code = window.prompt('Masukkan kode dari authenticator app untuk konfirmasi:');
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
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (window.confirm('Regenerate backup codes? Kode lama tidak akan bisa digunakan lagi.')) {
                                                            try {
                                                                const code = window.prompt('Masukkan kode dari authenticator app untuk konfirmasi:');
                                                                if (code && currentUser) {
                                                                    const newCodes = await twoFactorService.regenerateBackupCodes(currentUser.uid, code);
                                                                    alert(`Backup codes baru:\n\n${newCodes.join('\n')}\n\nSimpan di tempat yang aman!`);
                                                                    setSuccess('Backup codes berhasil dibuat ulang');
                                                                    setTimeout(() => setSuccess(''), 5000);
                                                                }
                                                            } catch (err) {
                                                                setError('Gagal membuat ulang backup codes. Pastikan kode Anda benar.');
                                                                setTimeout(() => setError(''), 5000);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    Regenerate Backup Codes
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                                <p className="text-sm text-yellow-800 font-medium flex items-center gap-2">
                                                    ⚠️ Autentikasi dua faktor tidak aktif
                                                </p>
                                                <p className="text-xs text-yellow-600 mt-1">
                                                    Aktifkan 2FA untuk meningkatkan keamanan akun Anda
                                                </p>
                                            </div>
                                            <p className="text-sm text-palladium">
                                                Tambahkan lapisan keamanan ekstra dengan mengaktifkan autentikasi dua faktor. 
                                                Anda akan memerlukan kode dari aplikasi authenticator setiap kali login.
                                            </p>
                                            <Button onClick={() => setShow2FASetup(true)}>
                                                <Shield className="w-4 h-4 mr-2" />
                                                Aktifkan 2FA
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        maxWidth: '700px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <TwoFactorSetup
                            onComplete={() => {
                                setShow2FASetup(false);
                                setIs2FAEnabled(true);
                                setSuccess('Autentikasi dua faktor berhasil diaktifkan!');
                                setTimeout(() => setSuccess(''), 5000);
                            }}
                            onCancel={() => setShow2FASetup(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
