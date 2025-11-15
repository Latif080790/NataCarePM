/**
 * Enterprise Login View - Clean Design
 * Clean, professional login interface consistent with application design system
 */

import { useState } from 'react';
import { ButtonPro } from '@/components/ButtonPro';
import { CardPro, CardProHeader, CardProContent, CardProTitle, CardProDescription } from '@/components/CardPro';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { FormField } from '@/components/FormFields';
import { loginSchema, registrationSchema, type LoginFormData, type RegistrationFormData } from '@/schemas/authSchemas';
import { LogIn, UserPlus, Shield, Building2, AlertCircle } from 'lucide-react';
import ForgotPasswordView from './ForgotPasswordView';
import { TwoFactorSignIn } from '@/components/TwoFactorSignIn';

// Firebase imports
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

export default function EnterpriseLoginView() {
  const { 
    loading: authLoading, 
    login, 
    error: authError, 
    clearError,
    requires2FA,
    mfaResolver,
    cancel2FA,
  } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Login form validation
  const loginForm = useValidatedForm<LoginFormData>({
    schema: loginSchema,
    onSubmit: async (data) => {
      await login(data.email, data.password);
    },
  });

  // Registration form validation
  const registrationForm = useValidatedForm<RegistrationFormData>({
    schema: registrationSchema,
    onSubmit: async (data) => {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        email: data.email,
        role: 'project_manager',
        createdAt: new Date().toISOString(),
      });

      alert(' Account created successfully! Please sign in.');
      setIsLogin(true);
      registrationForm.resetForm();
    },
  });

  // Select active form based on mode
  const activeForm = isLogin ? loginForm : registrationForm;
  const { handleSubmit, formState: { isSubmitting } } = activeForm;

  const handleToggleMode = () => {
    clearError();
    setIsLogin((prev) => !prev);
  };

  const handleForgotPassword = () => {
    clearError();
    setShowForgotPassword(true);
  };

  if (showForgotPassword) {
    return <ForgotPasswordView onBack={() => {
      clearError();
      setShowForgotPassword(false);
    }} />;
  }

  // Show 2FA verification if required
  if (requires2FA && mfaResolver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <TwoFactorSignIn
          resolver={mfaResolver}
          onSuccess={() => {
            // User will be redirected by AuthContext
          }}
          onCancel={cancel2FA}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">NATA'CARA</h1>
          <p className="text-sm text-gray-600 mt-1">Project Management System</p>
        </div>

        {/* Main Card */}
        <CardPro variant="elevated">
          <CardProHeader>
            <CardProTitle className="flex items-center gap-2">
              {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardProTitle>
            <CardProDescription>
              {isLogin 
                ? 'Sign in to access your dashboard' 
                : 'Register for a new account'}
            </CardProDescription>
          </CardProHeader>

          <CardProContent>
            {/* Error Display */}
            {authError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Authentication Error</p>
                  <p className="text-sm text-red-700 mt-1">{authError}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Dismiss error"
                >
                  
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <FormField
                  name="name"
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  register={registrationForm.register}
                  errors={registrationForm.formState.errors}
                  disabled={isSubmitting || authLoading}
                  required
                />
              )}

              {isLogin ? (
                <>
                  <FormField
                    name="email"
                    label="Email Address"
                    type="email"
                    placeholder="email@company.com"
                    register={loginForm.register}
                    errors={loginForm.formState.errors}
                    disabled={isSubmitting || authLoading}
                    required
                  />

                  <FormField
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    register={loginForm.register}
                    errors={loginForm.formState.errors}
                    disabled={isSubmitting || authLoading}
                    required
                  />
                </>
              ) : (
                <>
                  <FormField
                    name="email"
                    label="Email Address"
                    type="email"
                    placeholder="email@company.com"
                    register={registrationForm.register}
                    errors={registrationForm.formState.errors}
                    disabled={isSubmitting || authLoading}
                    required
                  />

                  <FormField
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    register={registrationForm.register}
                    errors={registrationForm.formState.errors}
                    disabled={isSubmitting || authLoading}
                    required
                    helpText="Minimum 8 characters"
                  />
                </>
              )}

              {!isLogin && (
                <FormField
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  register={registrationForm.register}
                  errors={registrationForm.formState.errors}
                  disabled={isSubmitting || authLoading}
                  required
                />
              )}

              {!isLogin && (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    {...registrationForm.register('agreeToTerms')}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
              )}
              {registrationForm.formState.errors.agreeToTerms && (
                <p className="text-sm text-red-600 mt-1">
                  {registrationForm.formState.errors.agreeToTerms.message as string}
                </p>
              )}

              {/* Submit Button */}
              <ButtonPro
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting || authLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </ButtonPro>

              {/* Forgot Password Link */}
              {isLogin && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Toggle Mode */}
              <div className="pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="ml-1 text-blue-600 font-medium hover:text-blue-700 hover:underline"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-900">Demo Access</p>
                  <p className="text-xs text-blue-700 mt-1">
                    <strong>Email:</strong> pm@natacara.dev
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Password:</strong> NataCare2025!
                  </p>
                </div>
              </div>
            </div>
          </CardProContent>
        </CardPro>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p> 2025 NATA'CARA. All rights reserved.</p>
          <p className="mt-1">Enterprise Project Management System</p>
        </div>
      </div>
    </div>
  );
}

