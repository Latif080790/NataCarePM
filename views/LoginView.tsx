import React from 'react';
// 🚀 ENTERPRISE LOGIN VIEW - LEVEL PREMIUM
// Sophisticated Authentication Interface with Advanced Glassmorphism & Animations

import { useState, FormEvent, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/FormControls';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/Spinner';
import { 
  LogIn, UserPlus
} from 'lucide-react';
import ForgotPasswordView from './ForgotPasswordView';
import { TwoFactorVerify } from '../components/TwoFactorVerify';
import { loginSchema, registrationSchema, validateData } from '../utils/validation';

// Firebase imports
import {
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function LoginView() {
    const { loading: authLoading, login, requires2FA, pending2FAUserId, verify2FA, cancel2FA } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    // Enhanced form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Animation state
    useEffect(() => {
        // Component mounted
    }, []);

    if (showForgotPassword) {
        return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
    }
    
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        if (isLogin) {
            // --- PROSES LOGIN dengan Validasi ---
            const validation = validateData(loginSchema, { email, password });
            
            if (!validation.success) {
                // Format errors untuk display
                const formattedErrors: Record<string, string> = {};
                const errorRecord = (validation as any).errors as Record<string, string[]>;
                Object.entries(errorRecord).forEach(([field, messages]) => {
                    formattedErrors[field] = messages[0]; // Ambil error pertama
                });
                setErrors(formattedErrors);
                setIsSubmitting(false);
                return;
            }
            
            try {
                await login(validation.data.email, validation.data.password);
                // Jika berhasil, AuthContext akan menangani redirect
            } catch (error: any) {
                setErrors({ general: error.message || 'Gagal masuk' });
            }
        } else {
            // --- PROSES SIGN UP dengan Validasi ---
            const validation = validateData(registrationSchema, { 
                name, 
                email, 
                password, 
                confirmPassword 
            });
            
            if (!validation.success) {
                // Format errors untuk display
                const formattedErrors: Record<string, string> = {};
                const errorRecord = (validation as any).errors as Record<string, string[]>;
                Object.entries(errorRecord).forEach(([field, messages]) => {
                    formattedErrors[field] = messages[0];
                });
                setErrors(formattedErrors);
                setIsSubmitting(false);
                return;
            }
            
            try {
                // Langkah 1: Buat user di Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(
                    auth, 
                    validation.data.email, 
                    validation.data.password
                );
                const firebaseUser = userCredential.user;

                // Langkah 2: Buat dokumen baru di koleksi 'users' Firestore
                await setDoc(doc(db, "users", firebaseUser.uid), {
                    name: validation.data.name,
                    email: firebaseUser.email,
                    roleId: 'viewer',
                    avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`
                });

                alert('Akun berhasil dibuat! Silakan masuk.');
                setIsLogin(true);
                // Reset form
                setName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');

            } catch (error: any) {
                setErrors({ general: error.message || 'Gagal mendaftar' });
            }
        }
        setIsSubmitting(false);
    };

    const isLoading = authLoading || isSubmitting;

    if (showForgotPassword) {
        return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
    }

    // Handle 2FA verification success
    const handle2FASuccess = () => {
        // AuthContext will handle the login completion automatically
        // The user will be redirected by App.tsx when currentUser is set
    };

    // Handle 2FA cancellation
    const handle2FACancel = () => {
        cancel2FA();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-alabaster">
            {/* 2FA Verification Modal */}
            {requires2FA && pending2FAUserId && (
                <TwoFactorVerify
                    userId={pending2FAUserId}
                    onSuccess={handle2FASuccess}
                    onCancel={handle2FACancel}
                    showBackupCodeOption={true}
                />
            )}

            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">NATA'CARA</CardTitle>
                    <CardDescription>
                        {isLogin ? 'Silakan login untuk mengakses proyek Anda' : 'Buat akun baru untuk memulai'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* General Error Message */}
                        {errors.general && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        )}
                        
                        {!isLogin && (
                             <div>
                                <label className="block text-sm font-medium text-palladium mb-1">Nama</label>
                                <Input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) setErrors({ ...errors, name: '' });
                                    }} 
                                    placeholder="Nama Lengkap" 
                                    disabled={isLoading} 
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-palladium mb-1">Email</label>
                            <Input 
                                type="email" 
                                value={email} 
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }} 
                                placeholder="email@contoh.com" 
                                disabled={isLoading} 
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-palladium mb-1">Password</label>
                            <Input 
                                type="password" 
                                value={password} 
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }} 
                                placeholder="******" 
                                disabled={isLoading} 
                                className={errors.password ? 'border-red-500' : ''}
                            />
                            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                        </div>
                        
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-palladium mb-1">Konfirmasi Password</label>
                                <Input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                                    }} 
                                    placeholder="******" 
                                    disabled={isLoading} 
                                    className={errors.confirmPassword ? 'border-red-500' : ''}
                                />
                                {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                            </div>
                        )}
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                             {isLoading ? <Spinner size="sm" /> : (isLogin ? <LogIn className="w-4 h-4 mr-2"/> : <UserPlus className="w-4 h-4 mr-2"/>)}
                            {isLoading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar Akun Baru')}
                        </Button>
                    </form>
                    
                    {isLogin && (
                        <div className="text-center mt-3">
                            <button 
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-palladium hover:text-persimmon transition-colors"
                                disabled={isLoading}
                            >
                                Lupa password?
                            </button>
                        </div>
                    )}
                    
                    <div className="text-center mt-4">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-persimmon hover:underline"
                            disabled={isLoading}
                        >
                            {isLogin ? 'Belum punya akun? Buat di sini' : 'Sudah punya akun? Masuk'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
