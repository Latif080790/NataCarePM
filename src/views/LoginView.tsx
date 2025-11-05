// 🚀 ENTERPRISE LOGIN VIEW - LEVEL PREMIUM
// Sophisticated Authentication Interface with Advanced Glassmorphism & Animations

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';
import { LogIn, UserPlus } from 'lucide-react';
import ForgotPasswordView from './ForgotPasswordView';
import { TwoFactorVerify } from '@/components/TwoFactorVerify';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { FormField, FormErrorSummary } from '@/components/FormFields';
import { 
  loginSchema, 
  registrationSchema,
  type LoginFormData,
  type RegistrationFormData 
} from '@/schemas/authSchemas';

// Firebase imports
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

export default function LoginView() {
  const {
    loading: authLoading,
    login,
    requires2FA,
    pending2FAUserId,
    cancel2FA,
  } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Login form
  const loginForm = useValidatedForm<LoginFormData>({
    schema: loginSchema,
    onSubmit: async (data) => {
      setGeneralError('');
      try {
        await login(data.email, data.password);
        // AuthContext will handle redirect
      } catch (error: any) {
        setGeneralError(error.message || 'Gagal masuk');
        throw error; // Re-throw to prevent form reset
      }
    },
    resetOnSuccess: false, // Don't reset on success (will redirect)
  });

  // Registration form
  const registrationForm = useValidatedForm<RegistrationFormData>({
    schema: registrationSchema,
    onSubmit: async (data) => {
      setGeneralError('');
      try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
        const firebaseUser = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: data.name,
          email: firebaseUser.email,
          roleId: 'viewer',
          avatarUrl: `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
        });

        alert('Akun berhasil dibuat! Silakan masuk.');
        setIsLogin(true);
        // Form will be reset automatically
      } catch (error: any) {
        setGeneralError(error.message || 'Gagal mendaftar');
        throw error; // Re-throw to prevent form reset
      }
    },
  });

  // Select active form based on mode
  const activeForm = isLogin ? loginForm : registrationForm;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = activeForm;
  const isLoading = authLoading || isSubmitting;

  // Animation state
  useEffect(() => {
    // Component mounted
  }, []);

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
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{generalError}</p>
              </div>
            )}

            {/* Form Error Summary */}
            <FormErrorSummary errors={errors} />

            {/* Registration: Name field */}
            {!isLogin && (
              <FormField
                name="name"
                label="Nama"
                type="text"
                placeholder="Nama Lengkap"
                register={register as any}
                errors={errors}
                disabled={isLoading}
                required
              />
            )}

            {/* Email field */}
            <FormField
              name="email"
              label="Email"
              type="email"
              placeholder="email@contoh.com"
              register={register as any}
              errors={errors}
              disabled={isLoading}
              required
            />

            {/* Password field */}
            <FormField
              name="password"
              label="Password"
              type="password"
              placeholder="******"
              register={register as any}
              errors={errors}
              disabled={isLoading}
              required
            />

            {/* Registration: Confirm Password field */}
            {!isLogin && (
              <FormField
                name="confirmPassword"
                label="Konfirmasi Password"
                type="password"
                placeholder="******"
                register={register as any}
                errors={errors}
                disabled={isLoading}
                required
              />
            )}

            {/* Registration: Terms checkbox */}
            {!isLogin && (
              <>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    {...(registrationForm.register as any)('agreeToTerms')}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-palladium">
                    Saya setuju dengan{' '}
                    <a href="#" className="text-persimmon hover:underline">
                      Syarat & Ketentuan
                    </a>{' '}
                    dan{' '}
                    <a href="#" className="text-persimmon hover:underline">
                      Kebijakan Privasi
                    </a>
                  </label>
                </div>
                {registrationForm.formState.errors.agreeToTerms && (
                  <p className="text-xs text-red-600 mt-1">
                    {registrationForm.formState.errors.agreeToTerms.message}
                  </p>
                )}
              </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Spinner size="sm" />
              ) : isLogin ? (
                <LogIn className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar Akun Baru'}
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
