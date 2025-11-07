// React default import removed (using automatic JSX runtime)
// 🚀 ENTERPRISE LOGIN VIEW - LEVEL PREMIUM
// Sophisticated Authentication Interface with Advanced Glassmorphism & Animations

import { useState, useEffect } from 'react';
import { ButtonPro } from '@/components/ButtonPro';
import { InputPro } from '@/components/FormComponents';
import { CardPro } from '@/components/CardPro';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';
import { useValidatedForm } from '@/hooks/useValidatedForm';
import { FormErrorSummary } from '@/components/FormFields';
import { loginSchema, registrationSchema, type LoginFormData, type RegistrationFormData } from '@/schemas/authSchemas';
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Shield,
  Building2,
  Sparkles,
  Lock,
  Mail,
  User,
  CheckCircle,
  ArrowRight,
  Star,
  Trophy,
  Zap,
  Globe,
  BarChart3,
} from 'lucide-react';
import ForgotPasswordView from './ForgotPasswordView';

// Firebase imports
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

export default function EnterpriseLoginView() {
  const { loading: authLoading, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

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

      alert('✅ Account created successfully! Please sign in.');
      setIsLogin(true);
      registrationForm.resetForm();
    },
  });

  // Select active form based on mode
  const activeForm = isLogin ? loginForm : registrationForm;
  const { handleSubmit, formState: { errors, isSubmitting } } = activeForm;

  // Animation state
  useEffect(() => {
    setMounted(true);
  }, []);

  if (showForgotPassword) {
    return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        {/* Floating orbs animation */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-accent-coral/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-80 h-80 bg-accent-blue/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-emerald/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* 🏗️ ENTERPRISE CONTENT LAYOUT */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding & Features */}
        <div
          className={`hidden lg:flex lg:w-1/2 p-12 flex-col justify-center transition-all duration-1000 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        >
          {/* Premium Logo & Branding */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-coral to-accent-coral-dark flex items-center justify-center text-white text-2xl font-bold shadow-coral floating">
                🏗️
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white gradient-text">NATA'CARA</h1>
                <p className="text-lg text-white/70 font-medium">Enterprise Project Management</p>
              </div>
            </div>

            <p className="text-xl text-white/80 leading-relaxed mb-8">
              Platform manajemen proyek konstruksi tingkat enterprise dengan
              <span className="text-accent-coral font-semibold"> teknologi AI </span>
              dan analytics mendalam yang mengoptimalkan setiap aspek proyek Anda.
            </p>

            {/* Key metrics */}
            <div className="flex gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-coral">15+</div>
                <div className="text-sm text-white/60">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-emerald">1000+</div>
                <div className="text-sm text-white/60">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-blue">99.9%</div>
                <div className="text-sm text-white/60">Success Rate</div>
              </div>
            </div>
          </div>

          {/* Enterprise Features */}
          <div className="space-y-6">
            {[
              {
                icon: Shield,
                title: 'Enterprise Security',
                desc: 'Keamanan tingkat bank dengan enkripsi end-to-end dan compliance SOC 2',
              },
              {
                icon: Zap,
                title: 'Real-time Analytics',
                desc: 'Dashboard analytics dengan prediksi AI yang akurat dan insights mendalam',
              },
              {
                icon: Building2,
                title: 'Multi-Project Management',
                desc: 'Kelola ratusan proyek konstruksi dengan sinkronisasi real-time',
              },
              {
                icon: Trophy,
                title: 'Performance Tracking',
                desc: 'KPI monitoring dengan reporting otomatis dan benchmarking industri',
              },
              {
                icon: Globe,
                title: 'Global Scalability',
                desc: 'Infrastructure cloud yang mendukung skala enterprise di seluruh dunia',
              },
              {
                icon: BarChart3,
                title: 'Predictive Insights',
                desc: 'Machine learning untuk prediksi risiko dan optimasi resource allocation',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`flex items-start gap-4 glass p-4 rounded-xl transition-all duration-700 hover:scale-105 hover:shadow-lg ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-blue-dark flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise Certifications */}
          <div className="mt-12 p-6 glass rounded-xl">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-accent-emerald" />
              Enterprise Certifications
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
              <div>✓ ISO 27001 Certified</div>
              <div>✓ SOC 2 Type II</div>
              <div>✓ GDPR Compliant</div>
              <div>✓ 24/7 Enterprise Support</div>
            </div>
          </div>
        </div>

        {/* Right Side - Authentication Form */}
        <div
          className={`w-full lg:w-1/2 flex items-center justify-center p-8 transition-all duration-1000 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        >
          <div className="w-full max-w-md">
            {/* Premium Auth Card */}
            <CardPro className="p-8 bg-white" variant="elevated">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isLogin ? 'Welcome Back' : 'Join Enterprise'}
                  </h2>
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600">
                  {isLogin
                    ? 'Akses dashboard enterprise Anda dengan teknologi terdepan'
                    : 'Bergabung dengan platform enterprise construction management terdepan'}
                </p>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormErrorSummary errors={errors} />

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    <InputPro
                      type="text"
                      {...registrationForm.register('name')}
                      placeholder="Enter your full name"
                      disabled={isSubmitting || authLoading}
                    />
                    {registrationForm.formState.errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {registrationForm.formState.errors.name.message as string}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <InputPro
                    type="email"
                    {...(isLogin ? loginForm.register('email') : registrationForm.register('email'))}
                    placeholder="Enter your enterprise email"
                    disabled={isSubmitting || authLoading}
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <InputPro
                      type={showPassword ? 'text' : 'password'}
                      {...(isLogin ? loginForm.register('password') : registrationForm.register('password'))}
                      placeholder="Enter your secure password"
                      disabled={isSubmitting || authLoading}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message as string}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirm Password
                    </label>
                    <InputPro
                      type={showPassword ? 'text' : 'password'}
                      {...registrationForm.register('confirmPassword')}
                      placeholder="Confirm your password"
                      disabled={isSubmitting || authLoading}
                    />
                    {registrationForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {registrationForm.formState.errors.confirmPassword.message as string}
                      </p>
                    )}
                  </div>
                )}

                {!isLogin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...registrationForm.register('agreeToTerms')}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                  <ButtonPro
                    type="submit"
                    disabled={isSubmitting || authLoading}
                    variant="primary"
                    className="w-full"
                  >
                    {isSubmitting || authLoading ? (
                      <>
                        <Spinner size="sm" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        {isLogin ? 'Access Enterprise Dashboard' : 'Create Enterprise Account'}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </ButtonPro>

                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      Forgot your password?
                    </button>
                  )}
                </div>

                {/* Toggle Auth Mode */}
                <div className="text-center pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    {isLogin ? "Don't have an enterprise account?" : 'Already have an account?'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-600 font-semibold hover:text-blue-700 transition-colors ml-1"
                  >
                    {isLogin ? 'Request Enterprise Access' : 'Sign In to Enterprise'}
                  </button>
                </div>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-gradient-to-r from-accent-emerald/10 to-accent-blue/10 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-accent-emerald" />
                  <span className="text-xs font-semibold text-white/90">
                    ENTERPRISE DEMO ACCESS
                  </span>
                </div>
                <div className="text-xs text-white/60 space-y-1">
                  <div>
                    <strong>Email:</strong> pm@natacara.dev
                  </div>
                  <div>
                    <strong>Password:</strong> NataCare2025!
                  </div>
                  <div className="text-accent-coral mt-2">🚀 Full enterprise features unlocked</div>
                </div>
              </div>
            </CardPro>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-4 text-white/50 text-xs">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Enterprise Grade</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-white/50 text-xs">
              © 2025 NATA'CARA Enterprise Platform. All rights reserved.
              <br />
              <span className="text-accent-coral">
                Powered by Advanced AI & Cloud Infrastructure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
