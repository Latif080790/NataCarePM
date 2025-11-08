// React default import removed (using automatic JSX runtime)
import { useState } from 'react';
import { CardPro, CardProHeader, CardProContent, CardProTitle, CardProDescription } from '@/components/CardPro';
import { ButtonPro } from '@/components/ButtonPro';
import { LoadingState } from '@/components/StateComponents';
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

  const { register, handleSubmit, formState: { errors, isSubmitting: formSubmitting } } = useValidatedForm<PasswordResetRequestData>({
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <CardPro variant="elevated" className="w-full max-w-sm">
          <CardProHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardProTitle className="text-2xl">Email Terkirim</CardProTitle>
            <CardProDescription>
              Kami telah mengirimkan link reset password ke <strong>{sentEmail}</strong>
            </CardProDescription>
          </CardProHeader>
          <CardProContent>
            <p className="text-sm text-gray-600 text-center mb-4" data-testid="reset-success-message">
              Periksa inbox email Anda dan klik link untuk mereset password. Link akan kadaluarsa dalam 1 jam.
            </p>
            <ButtonPro variant="outline" icon={ArrowLeft} onClick={onBack} className="w-full">
              Kembali ke Login
            </ButtonPro>
          </CardProContent>
        </CardPro>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <CardPro variant="elevated" className="w-full max-w-sm">
        <CardProHeader className="text-center">
          <CardProTitle className="text-2xl">Lupa Password</CardProTitle>
          <CardProDescription>Masukkan email Anda untuk menerima link reset password</CardProDescription>
        </CardProHeader>
        <CardProContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

            {/* Inline validation message (client-side) */}
            {errors.email && (
              <div className="text-sm text-red-600" data-testid="email-error-msg">
                {errors.email.message as string}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <ButtonPro
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting || formSubmitting}
              data-testid="submit-reset"
            >
              {isSubmitting || formSubmitting ? 'Mengirim...' : 'Kirim Link Reset'}
            </ButtonPro>

            <ButtonPro
              type="button"
              onClick={onBack}
              variant="outline"
              icon={ArrowLeft}
              className="w-full"
              disabled={isSubmitting}
            >
              Kembali ke Login
            </ButtonPro>
          </form>
        </CardProContent>
      </CardPro>
    </div>
  );
}
