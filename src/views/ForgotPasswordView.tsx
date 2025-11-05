// React default import removed (using automatic JSX runtime)
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/Card';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { FormField } from '@/components/FormFields';
import { passwordResetRequestSchema, type PasswordResetRequestData } from '@/schemas/authSchemas';

export default function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useValidatedForm<PasswordResetRequestData>({
    schema: passwordResetRequestSchema,
    onSubmit: async (data) => {
      setIsSubmitting(true);
      setError('');

      try {
        await sendPasswordResetEmail(auth, data.email);
        setSentEmail(data.email);
        setEmailSent(true);
      } catch (error: any) {
        console.error('Password reset error:', error);
        if (error.code === 'auth/user-not-found') {
          setError('Email tidak terdaftar dalam sistem.');
        } else if (error.code === 'auth/invalid-email') {
          setError('Format email tidak valid.');
        } else {
          setError('Gagal mengirim email reset password. Silakan coba lagi.');
        }
        throw error; // Prevent form reset
      } finally {
        setIsSubmitting(false);
      }
    },
    resetOnSuccess: false,
  });

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-alabaster">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Email Terkirim</CardTitle>
            <CardDescription>
              Kami telah mengirimkan link reset password ke <strong>{sentEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-palladium text-center mb-4">
              Periksa inbox email Anda dan klik link untuk mereset password. Link akan kadaluarsa
              dalam 1 jam.
            </p>
            <Button onClick={onBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-alabaster">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Lupa Password</CardTitle>
          <CardDescription>Masukkan email Anda untuk menerima link reset password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              name="email"
              label="Email"
              type="email"
              placeholder="email@contoh.com"
              register={register}
              errors={errors}
              disabled={isSubmitting}
              required
              helpText="Masukkan email yang terdaftar di akun Anda"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" /> Mengirim...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" /> Kirim Link Reset
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={onBack}
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
