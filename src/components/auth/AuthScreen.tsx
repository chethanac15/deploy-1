import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PlanTier } from '../../types';
import { ApniEstateLogo } from '../common/ApniEstateLogo';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Building2,
  Sparkles
} from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'demo' | 'forgot_password' | 'check_email';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword, setIsDemoMode, loading } = useAuth();
  
  const [view, setView] = useState<AuthView>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Demo Login fields
  const [demoEmail, setDemoEmail] = useState('demo@apniestate.com');
  const [demoPassword, setDemoPassword] = useState('demo123');
  const [showDemoPassword, setShowDemoPassword] = useState(false);

  // Sign Up fields
  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [phone, setPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan] = useState<PlanTier>('studio');
  
  // UI feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    // Intercept Demo Credentials locally without calling Supabase
    if (cleanEmail.toLowerCase() === 'demo@apniestate.com') {
      if (password === 'demo123') {
        setIsDemoMode(true);
        return;
      } else {
        setErrorMessage('Invalid demo credentials. Please use the demo credentials shown below.');
        return;
      }
    }

    try {
      await signIn(cleanEmail, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    }
  };

  // Dedicated Demo Login Handler
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = demoEmail.trim().toLowerCase();
    if (cleanEmail === 'demo@apniestate.com' && demoPassword === 'demo123') {
      setIsDemoMode(true);
    } else {
      setErrorMessage('Invalid demo credentials. Please use the demo credentials shown below.');
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!studioName.trim()) {
      setErrorMessage('Please enter your studio or business name.');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      const res = await signUp({
        fullName,
        studioName,
        email: signUpEmail,
        phone,
        password: signUpPassword,
        plan: selectedPlan
      });

      if (res.requiresEmailVerification) {
        setView('check_email');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create studio account. Please try again.');
    }
  };

  // Password Recovery Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process reset request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#1E293B] relative flex flex-col justify-between overflow-x-hidden font-sans selection:bg-[#B27D52] selection:text-white">
      {/* Background Layer with warm natural lighting and interior studio visual */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url('/interior_studio_office_bg.jpg')`
        }}
      >
        {/* Soft natural lighting gradient masks */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F7F5EE] via-[#F7F5EE]/95 via-40% to-[#F7F5EE]/25 lg:to-transparent" />
        <div className="absolute inset-0 bg-[#091D34]/5 backdrop-blur-[0.5px]" />
      </div>

      {/* Main Responsive Grid Container */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-12 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-center w-full my-auto">
          
          {/* ====================================================
              LEFT COLUMN: LUXURY EDITORIAL BRAND HERO (Desktop only)
             ==================================================== */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 space-y-8 text-left py-4">
            
            {/* Logo + Subtitle Header */}
            <div className="flex items-center gap-4">
              <ApniEstateLogo size="md" variant="dark" />
              <div className="hidden sm:block h-8 w-px bg-[#CBB7A2]/80" />
              <div className="hidden sm:block text-[9.5px] font-bold tracking-[0.26em] text-[#64748B] uppercase leading-relaxed font-sans">
                INTERIOR STUDIO<br />MANAGEMENT SOFTWARE
              </div>
            </div>

            {/* Editorial Headline with Cormorant Garamond & Playfair Display */}
            <div className="space-y-4 max-w-xl">
              <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-medium text-[#091D34] tracking-tight leading-[1.04] [font-family:'Cormorant_Garamond',serif]">
                Manage<br />
                <span className="text-[#B27D52] italic font-semibold [font-family:'Playfair_Display',serif] pr-1">Interiors</span><br />
                Like a Pro
              </h1>

              <div className="space-y-1.5 pt-1">
                <p className="text-sm font-bold tracking-wide text-[#091D34] uppercase [font-family:'Plus_Jakarta_Sans',sans-serif]">
                  Projects · People · Purchases · Progress.
                </p>
                <p className="text-sm sm:text-[15px] text-[#5A5856] font-normal leading-relaxed max-w-md">
                  All in one workspace — built specifically for interior architecture firms, design studios, and contractors.
                </p>
              </div>
            </div>

            {/* Circular Bronze Feature Badge */}
            <div className="inline-flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white/80 border border-[#E8E0D5] shadow-xs backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-[#8C5E3A] text-white flex items-center justify-center shadow-xs shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] font-bold tracking-wider text-[#4A4744] uppercase leading-tight font-sans">
                A Smarter Way to Manage Interiors
              </div>
            </div>

            {/* Bottom Slogan / Separator */}
            <div className="pt-6 sm:pt-10 space-y-3">
              <div className="w-10 h-0.5 bg-[#CBB7A2]" />
              <div className="text-[11px] font-bold tracking-[0.35em] text-[#78736E] uppercase font-sans">
                PLAN · TRACK · GROW
              </div>
            </div>

          </div>

          {/* ====================================================
              RIGHT COLUMN: WARM-WHITE LUXURY AUTH CARD
             ==================================================== */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center justify-center lg:justify-end w-full">
            
            {/* Mobile-Only Header */}
            <div className="lg:hidden flex flex-col items-center text-center mb-4 space-y-1">
              <ApniEstateLogo size="sm" variant="dark" />
              <div className="text-[9px] font-extrabold tracking-[0.22em] text-[#64748B] uppercase font-sans">
                INTERIOR STUDIO MANAGEMENT SOFTWARE
              </div>
            </div>

            <div className="w-full max-w-[440px] bg-[#FCFAF7]/95 border border-[#ECE5DB] rounded-2xl sm:rounded-[32px] p-4 sm:p-7 lg:p-9 shadow-[0_20px_50px_-10px_rgba(20,15,10,0.08)] backdrop-blur-xl relative">
              
              {/* Refined 3-Mode Segmented Navigation */}
              <div className="flex items-center p-1 bg-[#EFECE4] border border-[#E2DDD2] rounded-2xl mb-5 text-[11px] sm:text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setView('signin');
                  }}
                  className={`flex-1 py-2 px-1 sm:px-2.5 rounded-xl transition-all cursor-pointer min-h-[38px] text-center truncate ${
                    view === 'signin'
                      ? 'bg-[#0B213F] text-white shadow-xs'
                      : 'text-[#5A5856] hover:text-[#0B213F]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setView('signup');
                  }}
                  className={`flex-1 py-2 px-1 sm:px-2.5 rounded-xl transition-all cursor-pointer min-h-[38px] text-center truncate ${
                    view === 'signup'
                      ? 'bg-[#0B213F] text-white shadow-xs'
                      : 'text-[#5A5856] hover:text-[#0B213F]'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setView('demo');
                  }}
                  className={`flex-1 py-2 px-1 sm:px-2.5 rounded-xl transition-all cursor-pointer min-h-[38px] text-center truncate ${
                    view === 'demo'
                      ? 'bg-[#0B213F] text-white shadow-xs'
                      : 'text-[#5A5856] hover:text-[#0B213F]'
                  }`}
                >
                  Demo Login
                </button>
              </div>

              {/* ────────────────────────────────────────────────
                  TAB 1: SIGN IN (Existing Customers)
                 ──────────────────────────────────────────────── */}
              {view === 'signin' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-left space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-semibold [font-family:'Cormorant_Garamond',serif] text-[#091D34]">
                      Welcome Back
                    </h2>
                    <p className="text-xs text-[#71717A]">
                      Sign in to your workspace
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="text-left">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#474440] mb-1.5">
                        Work Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="you@studio.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] focus:ring-2 focus:ring-[#0B213F]/10 rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#474440] mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-9 py-2.5 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] focus:ring-2 focus:ring-[#0B213F]/10 rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#3F3F46] cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div 
                          onClick={() => setRememberMe(!rememberMe)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            rememberMe 
                              ? 'bg-[#0B213F] border-[#0B213F] text-white' 
                              : 'bg-white border-[#D4D4D8]'
                          }`}
                        >
                          {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs text-[#52525B]">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setView('forgot_password');
                        }}
                        className="text-xs font-medium text-[#8C5E3A] hover:text-[#70482B] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Primary Sign In Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#0B213F] hover:bg-[#07162C] text-white font-bold text-xs tracking-wide shadow-md shadow-[#0B213F]/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <span>Signing in...</span>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Secondary Trial Action */}
                  <div className="pt-2">
                    <div className="relative mb-3.5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#EAE5DC]" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                        <span className="bg-[#FCFAF7] px-2.5 text-[#A1A1AA]">New to Apni Estate?</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setView('signup');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-[#D6C5B2] hover:bg-[#F5ECE0]/60 text-[#8C5E3A] font-bold text-xs transition-all text-center cursor-pointer shadow-2xs"
                    >
                      Start 15-Day Free Trial
                    </button>
                  </div>

                  <div className="pt-2 text-center">
                    <span className="text-[9px] font-bold tracking-[0.25em] text-[#9E988F] uppercase">
                      BUILT FOR INTERIOR BUSINESSES
                    </span>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────
                  TAB 2: CREATE ACCOUNT (15-Day Free Trial)
                 ──────────────────────────────────────────────── */}
              {view === 'signup' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-left space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-semibold [font-family:'Cormorant_Garamond',serif] text-[#091D34]">
                      Start Your Free Trial
                    </h2>
                    <p className="text-xs text-[#71717A]">
                      Create your studio workspace in minutes.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52525B] mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Aarav Mehta"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52525B] mb-1">
                          Studio / Business *
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="Mehta Design Studio"
                            value={studioName}
                            onChange={(e) => setStudioName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52525B] mb-1">
                          Work Email *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            placeholder="aarav@studio.com"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52525B] mb-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            placeholder="+91 98201 00000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52525B] mb-1">
                          Password (8+ chars) *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            placeholder="••••••••"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#3F3F46]"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52525B] mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium placeholder-[#A1A1AA] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#0B213F] hover:bg-[#07162C] text-white font-bold text-xs shadow-md shadow-[#0B213F]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
                    >
                      {loading ? (
                        <span>Creating workspace...</span>
                      ) : (
                        <>
                          <span>Start 15-Day Free Trial</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#71717A] pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>15-Day Free Trial • No demo data • Private workspace</span>
                    </div>
                  </form>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-[#71717A]">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setView('signin');
                        }}
                        className="font-bold text-[#8C5E3A] hover:text-[#70482B] hover:underline cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────
                  TAB 3: DEMO LOGIN (Sandbox Mode)
                 ──────────────────────────────────────────────── */}
              {view === 'demo' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-left space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-semibold [font-family:'Cormorant_Garamond',serif] text-[#091D34]">
                      Explore Demo Workspace
                    </h2>
                    <p className="text-xs text-[#71717A]">
                      Explore a ready-to-use interior studio workspace with sample projects.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleDemoSubmit} className="space-y-3.5">
                    {/* Public Demo Credentials Card */}
                    <div className="p-3.5 rounded-2xl bg-[#F5ECE0]/70 border border-[#EBDBC9] text-left space-y-2">
                      <div className="text-[11px] font-bold text-[#8C5E3A] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-[#8C5E3A]" />
                        <span>Presentation Demo Account</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white/90 p-2 rounded-xl border border-[#E2DDD2]">
                        <div>
                          <span className="text-[#71717A] text-[10px] block font-sans font-semibold">Demo Email:</span>
                          <span className="text-[#18181B] font-semibold select-all">demo@apniestate.com</span>
                        </div>
                        <div>
                          <span className="text-[#71717A] text-[10px] block font-sans font-semibold">Password:</span>
                          <span className="text-[#18181B] font-semibold select-all">demo123</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#474440] mb-1.5">
                        Demo Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={demoEmail}
                          onChange={(e) => setDemoEmail(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#474440] mb-1.5">
                        Demo Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showDemoPassword ? 'text' : 'password'}
                          required
                          value={demoPassword}
                          onChange={(e) => setDemoPassword(e.target.value)}
                          className="w-full pl-10 pr-9 py-2.5 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] font-medium outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDemoPassword(!showDemoPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#3F3F46] cursor-pointer"
                        >
                          {showDemoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 rounded-xl bg-[#0B213F] hover:bg-[#07162C] text-white font-bold text-xs shadow-md shadow-[#0B213F]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <span>Login to Demo Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="pt-2 text-center border-t border-[#EAE5DC]/80">
                    <p className="text-[11px] text-[#71717A]">
                      Ready to start your private workspace?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setView('signup');
                        }}
                        className="font-bold text-[#8C5E3A] hover:text-[#70482B] hover:underline cursor-pointer"
                      >
                        Start 15-Day Free Trial
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────
                  VIEW 4: FORGOT PASSWORD
                 ──────────────────────────────────────────────── */}
              {view === 'forgot_password' && (
                <div className="space-y-4 animate-in fade-in duration-150 text-left">
                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-semibold [font-family:'Cormorant_Garamond',serif] text-[#091D34]">
                      Reset Password
                    </h2>
                    <p className="text-xs text-[#71717A]">
                      Enter your email to receive a password recovery link.
                    </p>
                  </div>

                  {resetSent ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div className="font-bold">Password recovery link sent!</div>
                      <p className="text-[#52525B]">Check your inbox for instructions to reset your password.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setResetSent(false);
                          setView('signin');
                        }}
                        className="mt-2 inline-block font-bold text-[#8C5E3A] hover:underline cursor-pointer"
                      >
                        ← Return to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      {errorMessage && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#474440] mb-1.5">
                          Account Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            placeholder="you@studio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-[#F5F2EA]/80 hover:bg-[#F5F2EA] focus:bg-white border border-[#E2DDD2] focus:border-[#0B213F] rounded-xl text-xs text-[#18181B] placeholder-[#A1A1AA] outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 rounded-xl bg-[#0B213F] hover:bg-[#07162C] text-white font-bold text-xs shadow-md shadow-[#0B213F]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? 'Sending link...' : 'Send Recovery Link'}
                      </button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setView('signin')}
                          className="text-xs text-[#71717A] hover:text-[#18181B] cursor-pointer"
                        >
                          ← Back to Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ────────────────────────────────────────────────
                  VIEW 5: CHECK EMAIL
                 ──────────────────────────────────────────────── */}
              {view === 'check_email' && (
                <div className="space-y-4 text-center py-3 animate-in fade-in duration-150">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8EDE4] text-[#0B213F] flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold [font-family:'Cormorant_Garamond',serif] text-[#091D34]">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-[#71717A] max-w-xs mx-auto leading-relaxed">
                    We've sent a verification link to <strong className="text-[#18181B]">{signUpEmail}</strong>. Click the link to complete your studio registration.
                  </p>
                  <button
                    type="button"
                    onClick={() => setView('signin')}
                    className="mt-3 px-6 py-2.5 rounded-xl bg-[#0B213F] hover:bg-[#07162C] text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
