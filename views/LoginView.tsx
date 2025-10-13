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

// Firebase imports
import {
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function LoginView() {
    const { loading: authLoading, login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    
    // Enhanced form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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

        if (isLogin) {
            // --- PROSES LOGIN ---
            try {
                await login(email, password);
                // Jika berhasil, AuthContext akan menangani redirect
            } catch (error: any) {
                alert(`Gagal Masuk: ${error.message}`);
            }
        } else {
            // --- PROSES SIGN UP ---
            if (!name) {
                alert("Nama tidak boleh kosong.");
                setIsSubmitting(false);
                return;
            }
            try {
                // Langkah 1: Buat user di Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const firebaseUser = userCredential.user;

                // Langkah 2: Buat dokumen baru di koleksi 'users' Firestore
                // ID dokumen = UID dari Firebase Auth
                await setDoc(doc(db, "users", firebaseUser.uid), {
                    name: name,
                    email: firebaseUser.email,
                    roleId: 'viewer', // Atur peran default untuk pengguna baru
                    avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}` // Avatar default
                });

                alert('Akun berhasil dibuat! Silakan masuk.');
                setIsLogin(true); // Arahkan pengguna ke tampilan login setelah berhasil mendaftar

            } catch (error: any) {
                alert(`Gagal Mendaftar: ${error.message}`);
            }
        }
        setIsSubmitting(false);
    };

    const isLoading = authLoading || isSubmitting;

    if (showForgotPassword) {
        return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-alabaster">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">NATA'CARA</CardTitle>
                    <CardDescription>
                        {isLogin ? 'Silakan login untuk mengakses proyek Anda' : 'Buat akun baru untuk memulai'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                             <div>
                                <label className="block text-sm font-medium text-palladium mb-1">Nama</label>
                                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Lengkap" disabled={isLoading} required />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-palladium mb-1">Email</label>
                            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" disabled={isLoading} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-palladium mb-1">Password</label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" disabled={isLoading} required />
                        </div>
                        
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
