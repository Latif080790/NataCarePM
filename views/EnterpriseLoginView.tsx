// 🚀 ENTERPRISE LOGIN VIEW - LEVEL PREMIUM
// Sophisticated Authentication Interface with Advanced Glassmorphism & Animations

import { useState, FormEvent, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/FormControls';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/Spinner';
import { 
  LogIn, UserPlus, Eye, EyeOff, Shield, Building2, 
  Sparkles, Lock, Mail, User, CheckCircle,
  ArrowRight, Star, Trophy, Zap, Globe, BarChart3
} from 'lucide-react';
import ForgotPasswordView from './ForgotPasswordView';

// Firebase imports
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function EnterpriseLoginView() {
    const { loading: authLoading, login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Enhanced form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    // Animation state
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);

        if (isLogin) {
            try {
                const success = await login(email, password);
                if (!success) {
                    alert('🚨 Authentication failed. Please check your credentials.');
                }
            } catch (error: any) {
                alert(`❌ Login Error: ${error.message}`);
            }
        } else {
            if (!name) {
                alert("⚠️ Full name is required.");
                setIsSubmitting(false);
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                await setDoc(doc(db, 'users', user.uid), {
                    name,
                    email,
                    role: 'project_manager',
                    createdAt: new Date().toISOString()
                });

                alert("✅ Account created successfully! Please sign in.");
                setIsLogin(true);
            } catch (error: any) {
                alert(`❌ Registration Error: ${error.message}`);
            }
        }
        setIsSubmitting(false);
    };

    if (showForgotPassword) {
        return <ForgotPasswordView onBack={() => setShowForgotPassword(false)} />;
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* 🎨 SOPHISTICATED ANIMATED BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
                {/* Floating orbs animation */}
                <div className="absolute top-20 left-20 w-96 h-96 bg-accent-coral/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-blue/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-emerald/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                {/* Grid pattern overlay */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* 🏗️ ENTERPRISE CONTENT LAYOUT */}
            <div className="relative z-10 min-h-screen flex">
                {/* Left Side - Branding & Features */}
                <div className={`hidden lg:flex lg:w-1/2 p-12 flex-col justify-center transition-all duration-1000 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
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
                            { icon: Shield, title: 'Enterprise Security', desc: 'Keamanan tingkat bank dengan enkripsi end-to-end dan compliance SOC 2' },
                            { icon: Zap, title: 'Real-time Analytics', desc: 'Dashboard analytics dengan prediksi AI yang akurat dan insights mendalam' },
                            { icon: Building2, title: 'Multi-Project Management', desc: 'Kelola ratusan proyek konstruksi dengan sinkronisasi real-time' },
                            { icon: Trophy, title: 'Performance Tracking', desc: 'KPI monitoring dengan reporting otomatis dan benchmarking industri' },
                            { icon: Globe, title: 'Global Scalability', desc: 'Infrastructure cloud yang mendukung skala enterprise di seluruh dunia' },
                            { icon: BarChart3, title: 'Predictive Insights', desc: 'Machine learning untuk prediksi risiko dan optimasi resource allocation' }
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
                <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 transition-all duration-1000 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                    <div className="w-full max-w-md">
                        {/* Premium Auth Card */}
                        <div className="glass-card p-8 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Sparkles className="w-6 h-6 text-accent-coral" />
                                    <h2 className="text-2xl font-bold text-white">
                                        {isLogin ? 'Welcome Back' : 'Join Enterprise'}
                                    </h2>
                                    <Sparkles className="w-6 h-6 text-accent-coral" />
                                </div>
                                <p className="text-white/70">
                                    {isLogin 
                                        ? 'Akses dashboard enterprise Anda dengan teknologi terdepan' 
                                        : 'Bergabung dengan platform enterprise construction management terdepan'
                                    }
                                </p>
                            </div>

                            {/* Authentication Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Enter your full name"
                                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent-coral focus:border-transparent backdrop-blur-sm transition-all duration-300"
                                                required={!isLogin}
                                            />
                                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your enterprise email"
                                            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent-coral focus:border-transparent backdrop-blur-sm transition-all duration-300"
                                            required
                                        />
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your secure password"
                                            className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent-coral focus:border-transparent backdrop-blur-sm transition-all duration-300"
                                            required
                                        />
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || authLoading}
                                        className="w-full py-3 bg-gradient-to-r from-accent-coral to-accent-coral-dark text-white font-semibold rounded-xl shadow-coral hover:shadow-coral-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
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
                                    </Button>

                                    {isLogin && (
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-sm text-white/70 hover:text-accent-coral transition-colors"
                                        >
                                            Forgot your password?
                                        </button>
                                    )}
                                </div>

                                {/* Toggle Auth Mode */}
                                <div className="text-center pt-6 border-t border-white/10">
                                    <p className="text-white/70 text-sm">
                                        {isLogin ? "Don't have an enterprise account?" : "Already have an account?"}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-accent-coral font-semibold hover:text-accent-coral-dark transition-colors ml-1"
                                    >
                                        {isLogin ? 'Request Enterprise Access' : 'Sign In to Enterprise'}
                                    </button>
                                </div>
                            </form>

                            {/* Demo Credentials */}
                            <div className="mt-6 p-4 bg-gradient-to-r from-accent-emerald/10 to-accent-blue/10 rounded-xl border border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4 text-accent-emerald" />
                                    <span className="text-xs font-semibold text-white/90">ENTERPRISE DEMO ACCESS</span>
                                </div>
                                <div className="text-xs text-white/60 space-y-1">
                                    <div><strong>Email:</strong> pm@natacara.dev</div>
                                    <div><strong>Password:</strong> NataCare2025!</div>
                                    <div className="text-accent-coral mt-2">🚀 Full enterprise features unlocked</div>
                                </div>
                            </div>
                        </div>

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
                            <span className="text-accent-coral">Powered by Advanced AI & Cloud Infrastructure</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}