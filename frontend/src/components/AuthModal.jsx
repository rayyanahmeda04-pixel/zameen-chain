import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShoppingBag,
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
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState('BUYER');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
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
        cnic,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b1322] border border-white/10 w-full max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/[0.08] bg-[#060b14] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-white truncate">
                ZameenChain Identity Gateway
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Govt. of Sindh • Citizen & Officer Access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* SCREEN 1: PENDING REGISTRAR CLEARANCE */}
          {pendingRegistrarInfo ? (
            <div className="p-1 sm:p-2 text-center space-y-5 animate-fadeIn">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
              </div>

              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full">
                  Application Queued for Clearance
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-3 mb-1">
                  Sub-Registrar Vetting Required
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your email has been verified and your officer credentials have been transmitted to the Ministry of Revenue for security clearance.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3.5 sm:p-4 rounded-2xl text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Officer Name:</span>
                  <span className="text-slate-100 font-bold font-sans text-right truncate">
                    {pendingRegistrarInfo.name}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Badge ID:</span>
                  <span className="text-teal-400 font-bold">
                    {pendingRegistrarInfo.badgeNumber || 'KDA-APPLICANT'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Verified Email:</span>
                  <span className="text-emerald-400 truncate">{pendingRegistrarInfo.email}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-300 font-bold">PENDING_APPROVAL</span>
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
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          ) : isVerifyingOtp ? (
            /* SCREEN 2: EMAIL OTP VERIFICATION */
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                  <MailCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Verify Official Email</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto break-all">
                  Enter the 6-digit one-time passcode dispatched to{' '}
                  <strong className="text-cyan-300 font-mono">{email}</strong>
                </p>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> OTP Dispatched
                </span>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
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
                  className="w-full bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 rounded-2xl py-3 text-center text-2xl font-mono tracking-[0.5em] text-cyan-300 placeholder-slate-700 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || enteredOtp.length !== 6}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-40 text-slate-950 font-bold py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify Code & Mint Citizen Wallet</span>
                </button>
              </form>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingOtp(false);
                    setErrorMsg('');
                  }}
                  className="hover:text-white cursor-pointer py-1"
                >
                  ← Modify Details
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className={`flex items-center gap-1.5 font-medium py-1 ${
                    resendCooldown > 0
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-teal-400 hover:text-teal-300 cursor-pointer'
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
                    className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                  >
                    Email delayed? Reveal sandbox verification code
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-300">
                    <span>Sandbox OTP:</span>
                    <strong className="font-mono text-emerald-400 tracking-widest">
                      {activeOtpCode}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setEnteredOtp(activeOtpCode)}
                      className="text-cyan-400 font-bold hover:underline cursor-pointer ml-1"
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
              <div className="flex p-1 rounded-2xl bg-slate-950 border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
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
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register Account
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 text-xs">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-slate-300 block font-bold">Select Account Role:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('BUYER')}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          selectedRole === 'BUYER'
                            ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="font-bold text-[11px] sm:text-xs">Buyer</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-500">Investor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('SELLER')}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          selectedRole === 'SELLER'
                            ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Home className="w-4 h-4" />
                        <span className="font-bold text-[11px] sm:text-xs">Owner</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-500">Title Holder</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('REGISTRAR')}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          selectedRole === 'REGISTRAR'
                            ? 'bg-amber-950/70 border-amber-400 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="font-bold text-[11px] sm:text-xs">Registrar</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-500">KDA Officer</span>
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">
                      {selectedRole === 'REGISTRAR'
                        ? 'Officer Full Name & Designation *'
                        : 'Full Legal Name (As per CNIC) *'}
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">
                    {mode === 'signup' && selectedRole === 'REGISTRAR'
                      ? 'Official Government Email *'
                      : 'Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {mode === 'signup' && selectedRole === 'REGISTRAR' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">
                        Service Badge ID *
                      </label>
                      <div className="relative">
                        <IdCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="KDA-SR-104"
                          value={badgeNumber}
                          onChange={(e) => setBadgeNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">
                        Sub-Registry Branch *
                      </label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                )}

                {mode === 'signup' &&
                  (selectedRole === 'BUYER' || selectedRole === 'SELLER') && (
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">
                        NADRA CNIC Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="42101-1234567-1"
                        value={cnic}
                        onChange={(e) => setCnic(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  )}

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {mode === 'login'
                      ? 'Authenticate & Enter Portal'
                      : 'Send 6-Digit Email Verification OTP'}
                  </span>
                </button>
              </form>

              {mode === 'signup' && selectedRole === 'REGISTRAR' && (
                <div className="p-3 rounded-xl bg-amber-950/35 border border-amber-500/35 text-[11px] text-amber-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Security Protocol: Sub-Registrar accounts require Chief Administrator clearance following email OTP verification.
                  </span>
                </div>
              )}

              {/* 1-Click Verified Role Presets on Login Tab */}
              {mode === 'login' && (
                <div className="pt-3.5 sm:pt-4 border-t border-white/[0.08] space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Instant Verified Role Access (1-Click)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {QUICK_DEMO_ACCOUNTS.map((acct) => (
                      <button
                        key={acct.email}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickDemoLogin(acct)}
                        className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-white/[0.07] hover:border-emerald-500/40 transition cursor-pointer"
                      >
                        <span className="text-[11px] font-bold text-white block truncate">
                          {acct.label}
                        </span>
                        <span className="text-[10px] text-emerald-400 block truncate">
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
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#060b14] flex items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-400 shrink-0">
          <span className="truncate">Public search needs no login</span>
          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            Public Mode →
          </button>
        </div>
      </div>
    </div>
  );
}
