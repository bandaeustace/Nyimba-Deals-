import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Phone,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquare,
  RefreshCw,
  LogOut,
  CreditCard
} from 'lucide-react';
import { User, PaymentNetwork } from '../types';
import { authService, ADMIN_PHONE, ADMIN_NAME, PAYMENT_AMOUNT } from '../services/authService';

interface GatedGateScreenProps {
  onAuthenticated: (user: User) => void;
  initialUser?: User | null;
}

export default function GatedGateScreen({ onAuthenticated, initialUser }: GatedGateScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser || authService.getCurrentUser());

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sign up multi-step state
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [paymentNetwork, setPaymentNetwork] = useState<PaymentNetwork>('Airtel Money');
  const [paymentRef, setPaymentRef] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  // Waiting room auto-poll state
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date());

  // Periodically check if pending account has been approved by Admin
  useEffect(() => {
    if (!currentUser || currentUser.status !== 'pending') return;

    const interval = setInterval(async () => {
      setIsCheckingApproval(true);
      try {
        const fresh = await authService.refreshCurrentUser();
        setLastCheckedTime(new Date());
        if (fresh && fresh.status === 'approved') {
          setCurrentUser(fresh);
          onAuthenticated(fresh);
        }
      } catch (err) {
        console.error('Polling check failed:', err);
      } finally {
        setIsCheckingApproval(false);
      }
    }, 6000); // Check every 6 seconds

    return () => clearInterval(interval);
  }, [currentUser, onAuthenticated]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginPhone.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your phone number and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await authService.login(loginPhone, loginPassword);
      if (!res.success || !res.user) {
        setLoginError(res.error || 'Login failed. Please check credentials.');
        setIsLoggingIn(false);
        return;
      }

      setCurrentUser(res.user);

      if (res.user.status === 'approved') {
        onAuthenticated(res.user);
      } else if (res.user.status === 'blocked') {
        setLoginError('This account is permanently restricted.');
      }
      // If status is 'pending', UI will transition into Waiting Room automatically!
    } catch {
      setLoginError('A connection error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Step 1 of Sign Up (Account details)
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!username.trim()) {
      setSignupError('Please enter your full name or business username.');
      return;
    }
    if (!signupPhone.trim() || signupPhone.replace(/[^0-9]/g, '').length < 9) {
      setSignupError('Please enter a valid 10-digit Zambian phone number (e.g. 0773694618).');
      return;
    }
    if (signupPassword.length < 4) {
      setSignupError('Password must be at least 4 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupStep(2);
  };

  // Handle Step 2: Final Payment Confirmation Submission
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setIsSubmittingSignup(true);

    try {
      const res = await authService.register({
        username,
        phone: signupPhone,
        passwordPlain: signupPassword,
        paymentNetwork,
        paymentRef: paymentRef.trim() || 'Awaiting manual SMS check',
      });

      if (!res.success || !res.user) {
        setSignupError(res.error || 'Registration failed. Try again.');
        setIsSubmittingSignup(false);
        return;
      }

      setCurrentUser(res.user);
      if (res.user.status === 'approved') {
        onAuthenticated(res.user);
      }
      // Else stays on pending waiting screen
    } catch {
      setSignupError('Error saving registration. Please retry.');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleManualCheckNow = async () => {
    setIsCheckingApproval(true);
    const fresh = await authService.refreshCurrentUser();
    setLastCheckedTime(new Date());
    setIsCheckingApproval(false);
    if (fresh && fresh.status === 'approved') {
      setCurrentUser(fresh);
      onAuthenticated(fresh);
    }
  };

  const handleLogoutFromWaiting = () => {
    authService.logout();
    setCurrentUser(null);
    setSignupStep(1);
    setActiveTab('login');
  };

  // If user is currently pending approval, show the WAITING ROOM SCREEN
  if (currentUser && currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-center">
          {/* Status animation icon */}
          <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-5 relative">
            <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Awaiting Admin Approval
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Thank you, {currentUser.username}!
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed mb-5">
            Your account is currently waiting for admin approval. You paid{' '}
            <strong className="text-emerald-400">K4 to 0773694618 (EUSTACE BANDA)</strong>. The CEO will review and approve your account shortly.
          </p>

          {/* Payment submission details summary */}
          <div className="bg-slate-800/80 rounded-2xl p-4 text-left text-xs space-y-2 border border-slate-700/60 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Account Name:</span>
              <span className="font-semibold text-white">{currentUser.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Phone Number:</span>
              <span className="font-semibold text-white">{currentUser.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Network:</span>
              <span className="font-semibold text-emerald-400">{currentUser.paymentNetwork || 'Mobile Money'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Reference:</span>
              <span className="font-mono text-slate-200 truncate max-w-[180px]">{currentUser.paymentRef || 'Submitted'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-700">
              <span className="text-slate-400">Last auto-check:</span>
              <span className="text-slate-400">{lastCheckedTime.toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Manual refresh button */}
          <button
            onClick={handleManualCheckNow}
            disabled={isCheckingApproval}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 mb-4 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingApproval ? 'animate-spin text-emerald-400' : ''}`} />
            {isCheckingApproval ? 'Checking Approval Status...' : 'Check If Approved Now'}
          </button>

          {/* Direct WhatsApp and Call buttons to CEO */}
          <p className="text-xs text-slate-400 mb-2 font-medium">Want faster approval? Contact CEO directly:</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <a
              href="tel:0773694618"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              Call 0773694618
            </a>
            <a
              href={`https://wa.me/260773694618?text=${encodeURIComponent(
                `Hello CEO Eustace Banda, I have registered on Nyimba Deals as "${currentUser.username}" (${currentUser.phone}) and paid K4 via ${currentUser.paymentNetwork}. Please approve my account.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp CEO
            </a>
          </div>

          <button
            onClick={handleLogoutFromWaiting}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            Switch account / Sign in with another number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Banner */}
      <div className="max-w-md mx-auto w-full pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <span className="font-black text-xl text-white tracking-tighter">ND</span>
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">Nyimba Deals</h1>
              <p className="text-[11px] text-emerald-400 font-medium">Eastern Province Marketplace</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-[11px] text-emerald-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified & Gated
          </div>
        </div>

        {/* Gated Access Notice */}
        <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-3.5 mb-6 backdrop-blur">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-white">Safe Community Gateway:</span>{' '}
              <span className="text-slate-300">
                All members must log in to view deals or post items. New sign-ups pay K4 to keep Nyimba free from scammers.
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl mb-6">
          <button
            onClick={() => {
              setActiveTab('login');
              setLoginError('');
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setSignupStep(1);
              setSignupError('');
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up & Pay K4
          </button>
        </div>

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form
            onSubmit={handleLoginSubmit}
            className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Phone Number / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 0773694618"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all pl-10"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all pl-10"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Log In to Nyimba Deals
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setSignupStep(1);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
              >
                Don't have an approved account? Sign up here (K4)
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SIGN UP FLOW */}
        {activeTab === 'signup' && signupStep === 1 && (
          <form
            onSubmit={handleProceedToPayment}
            className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Step 1: Account Information</h3>
                <p className="text-xs text-slate-400">Enter your details to create your profile</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                1 of 2
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                USERNAME / FULL NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Mwansa Banda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-10"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                PHONE NUMBER
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 097xxxxxxx or 077xxxxxxx"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-10"
                  required
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Create a secure password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-10"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-10"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {signupError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{signupError}</span>
              </div>
            )}

            {/* Red NEXT button as requested matching user graphic */}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-xl shadow-red-950 uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              NEXT (PAY K4 VERIFICATION)
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: STEP 2 - PAYMENT STEP (Matching flyer specifications) */}
        {activeTab === 'signup' && signupStep === 2 && (
          <form
            onSubmit={handleCompleteRegistration}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                &larr; Back
              </button>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Step 2 of 2
              </span>
            </div>

            {/* OFFICIAL PAYMENT FLYER CARD */}
            <div className="bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 rounded-2xl p-4 text-white shadow-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-200 mb-1">
                Official Verification Payment
              </div>
              <div className="text-xl font-black tracking-tight mb-1">
                MAKE A PAYMENT OF K4
              </div>
              <div className="text-sm font-bold text-white/90">
                TO: <span className="underline decoration-amber-300">0773694618</span>
              </div>
              <div className="text-xs font-semibold text-amber-100">
                NAME: {ADMIN_NAME}
              </div>
            </div>

            {/* Quick 1-tap USSD Shortcuts for Zambian Networks */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Tap to dial your Mobile Money network:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="tel:*115#"
                  className="bg-red-950/80 hover:bg-red-900 border border-red-700/60 p-2.5 rounded-xl text-center text-xs font-bold text-red-200 transition-all flex flex-col items-center gap-0.5"
                >
                  <span>Airtel</span>
                  <span className="text-[11px] font-mono text-red-400">*115#</span>
                </a>
                <a
                  href="tel:*303#"
                  className="bg-yellow-950/80 hover:bg-yellow-900 border border-yellow-700/60 p-2.5 rounded-xl text-center text-xs font-bold text-yellow-200 transition-all flex flex-col items-center gap-0.5"
                >
                  <span>MTN MoMo</span>
                  <span className="text-[11px] font-mono text-yellow-400">*303#</span>
                </a>
                <a
                  href="tel:*344#"
                  className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 p-2.5 rounded-xl text-center text-xs font-bold text-emerald-200 transition-all flex flex-col items-center gap-0.5"
                >
                  <span>Zamtel</span>
                  <span className="text-[11px] font-mono text-emerald-400">*344#</span>
                </a>
              </div>
            </div>

            {/* Network Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Payment Network Used
              </label>
              <select
                value={paymentNetwork}
                onChange={(e) => setPaymentNetwork(e.target.value as PaymentNetwork)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Airtel Money">Airtel Money (Sent to 0773694618)</option>
                <option value="MTN MoMo">MTN MoMo (Sent to 0773694618)</option>
                <option value="Zamtel Kwacha">Zamtel Kwacha (Sent to 0773694618)</option>
                <option value="Direct / Cash">Paid in Cash / Direct to Eustace Banda</option>
              </select>
            </div>

            {/* Reference ID input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                SMS Transaction ID / Reference
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. TX12345678 or sender phone"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-10"
                  required
                />
                <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter the Transaction ID from the SMS message you received after sending K4.
              </p>
            </div>

            {signupError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{signupError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingSignup}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmittingSignup ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                <>
                  SUBMIT FOR CEO APPROVAL
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto w-full text-center py-4 text-xs text-slate-500">
        Nyimba Deals &copy; {new Date().getFullYear()} &bull; Directed by CEO Eustace Banda (0773694618) &bull; Eastern Province, Zambia
      </div>
    </div>
  );
}
