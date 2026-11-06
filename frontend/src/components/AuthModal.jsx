import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Home,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
  IdCard,
  Loader2,
  Clock,
  MailCheck,
  RotateCcw,
  Zap
} from 'lucide-react';
import { loginUser, registerUser, QUICK_DEMO_ACCOUNTS } from '../utils/authService';
import { sendVerificationOtp, verifyOtp } from '../utils/emailVerificationService';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [selectedRole, setSelectedRole] = useState('CITIZEN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [department, setDepartment] = useState('KDA Scheme 33 Sub-Registry Division');

  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [activeOtpCode, setActiveOtpCode] = useState('');
  const [showDemoOtpFallback, setShowDemoOtpFallback] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRegistrarInfo, setPendingRegistrarInfo] = useState(null);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleQuickDemoLogin = async (acct) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const user = await loginUser(acct.email, acct.password);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const user = await loginUser(email, password);
        onAuthSuccess(user);
        onClose();
      } else {
        if (!name.trim()) throw new Error('Please enter your full legal name.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }

        const res = await sendVerificationOtp(email, name);
        setActiveOtpCode(res.otp);
        setShowDemoOtpFallback(false);
        setIsVerifyingOtp(true);
        setResendCooldown(30);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!enteredOtp || enteredOtp.trim().length !== 6) {
        throw new Error('Please enter the 6-digit verification code.');
      }

      const check = verifyOtp(email, enteredOtp);
      if (!check.valid) {
        throw new Error(check.message);
      }

      const user = await registerUser({
        name,
        email,
        password,
        role: selectedRole,
        badgeNumber,
        department
      });

      if (user.role === 'REGISTRAR' && user.status === 'PENDING_APPROVAL') {
        setIsVerifyingOtp(false);
        setPendingRegistrarInfo({
          name: user.name,
          email: user.email,
          badgeNumber: user.badgeNumber || badgeNumber,
          department: user.department || department
        });
        return;
      }

      setIsVerifyingOtp(false);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await sendVerificationOtp(email, name);
      setActiveOtpCode(res.otp);
      setResendCooldown(30);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-white border border-[#D4D4CE] focus:border-[#0B5D46] focus:ring-2 focus:ring-[#0B5D46]/15 rounded-lg px-3.5 py-2.5 text-[#111315] placeholder-zinc-400 focus:outline-none transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#E4E4E0] w-full max-w-lg rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(16,24,40,0.18)] max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[#E4E4E0] bg-[#FBFBFA] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#0B5D46] flex items-center justify-center text-white shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#111315] truncate">
                ZameenChain Identity Gateway
              </h3>
              <p className="text-[11px] text-zinc-500 truncate">
                Govt. of Sindh • Citizen & Officer Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white hover:bg-[#F4F4F1] text-zinc-500 hover:text-[#111315] border border-[#E4E4E0] transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* SCREEN 1: PENDING REGISTRAR CLEARANCE */}
          {pendingRegistrarInfo ? (
            <div className="p-1 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>

              <div>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Application Queued for Clearance
                </span>
                <h3 className="text-lg font-bold text-[#111315] mt-2.5 mb-1">
                  Sub-Registrar Vetting Required
                </h3>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                  Your email has been verified and your officer credentials have been transmitted to the Ministry of Revenue for security clearance.
                </p>
              </div>

              <div className="bg-[#FBFBFA] border border-[#E4E4E0] p-3.5 rounded-lg text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 shrink-0">Officer Name</span>
                  <span className="text-[#111315] font-semibold font-sans text-right truncate">
                    {pendingRegistrarInfo.name}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 shrink-0">Badge ID</span>
                  <span className="text-[#0B5D46] font-semibold">
                    {pendingRegistrarInfo.badgeNumber || 'KDA-APPLICANT'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500 shrink-0">Verified Email</span>
                  <span className="text-[#111315] truncate">{pendingRegistrarInfo.email}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E4E4E0]">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-amber-700 font-semibold">PENDING_APPROVAL</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setPendingRegistrarInfo(null);
                  setIsVerifyingOtp(false);
                  setMode('login');
                  setEmail(pendingRegistrarInfo.email);
                  setPassword('');
                  setErrorMsg('');
                }}
                className="w-full bg-[#111315] hover:bg-[#27272A] text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          ) : isVerifyingOtp ? (
            /* SCREEN 2: EMAIL OTP VERIFICATION */
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0B5D46] flex items-center justify-center mx-auto">
                  <MailCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#111315]">Verify Email Address</h3>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto break-all">
                  Enter the 6-digit one-time passcode dispatched to{' '}
                  <strong className="text-[#111315] font-mono">{email}</strong>
                </p>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200 text-[11px] font-medium">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> OTP Dispatched
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpAndRegister} className="space-y-3.5">
                <input
                  type="text"
                  data-otp="true"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#FBFBFA] border border-[#D4D4CE] focus:border-[#0B5D46] rounded-lg py-3 text-center text-2xl font-mono tracking-[0.5em] text-[#111315] placeholder-zinc-300 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || enteredOtp.length !== 6}
                  className="w-full bg-[#0B5D46] hover:bg-[#094B38] disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify Code & Mint Citizen Wallet</span>
                </button>
              </form>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#F0F0EC] text-zinc-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingOtp(false);
                    setErrorMsg('');
                  }}
                  className="hover:text-[#111315] cursor-pointer py-1"
                >
                  ← Modify Details
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className={`flex items-center gap-1.5 font-medium py-1 ${
                    resendCooldown > 0
                      ? 'text-zinc-400 cursor-not-allowed'
                      : 'text-[#0B5D46] hover:underline cursor-pointer'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
                  </span>
                </button>
              </div>

              <div className="text-center pt-1">
                {!showDemoOtpFallback ? (
                  <button
                    type="button"
                    onClick={() => setShowDemoOtpFallback(true)}
                    className="text-[11px] text-zinc-500 hover:text-[#111315] underline cursor-pointer"
                  >
                    Email delayed? Reveal sandbox verification code
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-[#FBFBFA] border border-[#E4E4E0] px-3 py-1.5 rounded-lg text-[11px] text-zinc-600">
                    <span>Sandbox OTP:</span>
                    <strong className="font-mono text-[#0B5D46] tracking-widest">
                      {activeOtpCode}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setEnteredOtp(activeOtpCode)}
                      className="text-[#111315] font-semibold hover:underline cursor-pointer ml-1"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SCREEN 3: SIGN IN / REGISTER */
            <>
              <div className="flex p-1 rounded-lg bg-[#EDEDEA] border border-[#E4E4E0]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-[#111315] shadow-xs'
                      : 'text-zinc-600 hover:text-[#111315]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white text-[#111315] shadow-xs'
                      : 'text-zinc-600 hover:text-[#111315]'
                  }`}
                >
                  Register Account
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-zinc-700 block font-semibold">Select Account Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'CITIZEN', label: 'Citizen', sub: 'Owner & Buyer', icon: Home },
                        { key: 'REGISTRAR', label: 'Registrar', sub: 'KDA Officer', icon: ShieldCheck }
                      ].map((r) => {
                        const Icon = r.icon;
                        const active = selectedRole === r.key;
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => setSelectedRole(r.key)}
                            className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                              active
                                ? 'bg-[#F4F4F1] border-[#111315] text-[#111315]'
                                : 'bg-white border-[#E4E4E0] text-zinc-500 hover:border-zinc-300'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? 'text-[#0B5D46]' : 'text-zinc-400'}`} />
                            <span className="font-semibold text-xs">{r.label}</span>
                            <span className="text-[10px] text-zinc-400">{r.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="text-zinc-700 block mb-1 font-medium">
                      {selectedRole === 'REGISTRAR'
                        ? 'Officer Full Name & Designation *'
                        : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        selectedRole === 'REGISTRAR'
                          ? 'e.g. Engr. Tariq Mansoor'
                          : 'e.g. Hamza Sheikh'
                      }
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label className="text-zinc-700 block mb-1 font-medium">
                    {mode === 'signup' && selectedRole === 'REGISTRAR'
                      ? 'Official Government Email *'
                      : 'Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                {mode === 'signup' && selectedRole === 'REGISTRAR' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-700 block mb-1 font-medium">
                        Service Badge ID *
                      </label>
                      <div className="relative">
                        <IdCard className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="KDA-SR-104"
                          value={badgeNumber}
                          onChange={(e) => setBadgeNumber(e.target.value)}
                          className={`${inputClass} pl-9 font-mono`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-700 block mb-1 font-medium">
                        Sub-Registry Branch *
                      </label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-zinc-700 block mb-1 font-medium">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#111315] hover:bg-[#27272A] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {mode === 'login'
                      ? 'Sign In to Workspace'
                      : 'Send 6-Digit Email Verification OTP'}
                  </span>
                </button>
              </form>

              {mode === 'signup' && selectedRole === 'REGISTRAR' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Security Protocol: Sub-Registrar accounts require Chief Administrator clearance following email OTP verification.
                  </span>
                </div>
              )}

              {/* 1-Click Verified Role Presets on Login Tab */}
              {mode === 'login' && (
                <div className="pt-3.5 border-t border-[#F0F0EC] space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
                    <Zap className="w-3.5 h-3.5 text-[#0B5D46] shrink-0" />
                    <span>Quick Role Switch (Demo Evaluation)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {QUICK_DEMO_ACCOUNTS.map((acct) => (
                      <button
                        key={acct.email}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickDemoLogin(acct)}
                        className="text-left p-2.5 rounded-lg bg-[#FBFBFA] hover:bg-[#F4F4F1] border border-[#E4E4E0] hover:border-zinc-300 transition cursor-pointer"
                      >
                        <span className="text-[11px] font-semibold text-[#111315] block truncate">
                          {acct.label}
                        </span>
                        <span className="text-[10px] text-[#0B5D46] font-medium block truncate">
                          {acct.sublabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 border-t border-[#E4E4E0] bg-[#FBFBFA] flex items-center justify-between gap-2 text-[11px] sm:text-xs text-zinc-500 shrink-0">
          <span className="truncate">Public verification requires no login</span>
          <button
            onClick={onClose}
            className="text-[#0B5D46] hover:underline font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            Continue Public →
          </button>
        </div>
      </div>
    </div>
  );
}
