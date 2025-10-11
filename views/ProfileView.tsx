import React, { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/FormControls';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/Spinner';
import { User, Mail, Lock, Save, Camera } from 'lucide-react';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function ProfileView() {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    // Profile form state
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        
        setError('');
        setSuccess('');
        
        // Validate passwords
        if (newPassword.length < 6) {
            setError('Password baru harus minimal 6 karakter.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError('Password baru dan konfirmasi tidak cocok.');
            return;
        }
        
        setIsSaving(true);
        
        try {
            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email!,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
            
            // Update password
            await updatePassword(auth.currentUser, newPassword);
            
            setSuccess('Password berhasil diubah!');
            setIsChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error('Error changing password:', err);
            if (err.code === 'auth/wrong-password') {
                setError('Password saat ini salah.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol.');
            } else {
                setError('Gagal mengubah password: ' + err.message);
            }
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
                            <div className="relative">
                                <img 
                                    src={avatarUrl || currentUser.avatarUrl} 
                                    alt={name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-violet-essence"
                                />
                                {isEditing && (
                                    <button 
                                        className="absolute bottom-0 right-0 bg-persimmon text-white p-2 rounded-full hover:bg-persimmon/90"
                                        title="Ubah foto profil"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
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
                    <CardTitle>Ubah Password</CardTitle>
                    <CardDescription>Update password akun Anda untuk keamanan</CardDescription>
                </CardHeader>
                <CardContent>
                    {!isChangingPassword ? (
                        <Button onClick={() => setIsChangingPassword(true)}>
                            <Lock className="w-4 h-4 mr-2" />
                            Ubah Password
                        </Button>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-palladium mb-1">Password Saat Ini</label>
                                <Input 
                                    type="password" 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    disabled={isSaving}
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-palladium mb-1">Password Baru</label>
                                <Input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    disabled={isSaving}
                                    required 
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-palladium mb-1">Konfirmasi Password Baru</label>
                                <Input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    disabled={isSaving}
                                    required 
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                                    Simpan Password
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setError('');
                                    }}
                                    disabled={isSaving}
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
