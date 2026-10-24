import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, User, ShoppingBag, Home, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, X, IdCard, Loader2, Clock, MailCheck, RotateCcw, Settings, ExternalLink } from 'lucide-react';
import { loginUser, registerUser } from '../utils/authService';
import { sendVerificationOtp, verifyOtp, getGoogleScriptUrl, setGoogleScriptUrl } from '../utils/emailVerificationService';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [selectedRole, setSelectedRole] = useState('BUYER'); // 'BUYER', 'SELLER', 'REGISTRAR'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [department, setDepartment] = useState('KDA Scheme 33 Sub-Registry Division');

  // OTP Verification States
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [activeOtpCode, setActiveOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sentViaScript, setSentViaScript] = useState(false);

  // Google Apps Script Configuration Settings
  const [showGasConfig, setShowGasConfig] = useState(false);
  const [gasUrlInput, setGasUrlInput] = useState(getGoogleScriptUrl());
  const [gasSavedMsg, setGasSavedMsg] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRegistrarInfo, setPendingRegistrarInfo] = useState(null);

  // Resend countdown timer
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

  // Handle Form Submission (Login OR Step 1 of Sign Up)
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
        // Sign Up: Validate Form first
        if (!name.trim()) throw new Error("Please enter your full name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (!email.trim() || !email.includes('@')) throw new Error("Please enter a valid email address.");

        // Step 1: Send 6-Digit Email Verification Code via Google Apps Script
        const res = await sendVerificationOtp(email, name);
        setActiveOtpCode(res.otp);
        setSentViaScript(res.sentViaScript);
        setIsVerifyingOtp(true);
        setResendCooldown(30);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Code and Complete Registration in Database
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!enteredOtp || enteredOtp.trim().length !== 6) {
        throw new Error("Please enter the complete 6-digit verification code.");
      }

      const check = verifyOtp(email, enteredOtp);
      if (!check.valid) {
        throw new Error(check.message);
      }

      // Code is valid! Proceed to register user in Neon PostgreSQL
      const user = await registerUser({
        name,
        email,
        password,
        role: selectedRole,
        cnic,
        badgeNumber,
        department
      });

      // 🔒 If Registrar, show pending approval screen
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

      // Buyers and Sellers: Authenticate & Login
      setIsVerifyingOtp(false);
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await sendVerificationOtp(email, name);
      setActiveOtpCode(res.otp);
      setSentViaScript(res.sentViaScript);
      setResendCooldown(30);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Google Apps Script Webhook URL
  const handleSaveGasUrl = (e) => {
    e.preventDefault();
    setGoogleScriptUrl(gasUrlInput);
    setGasSavedMsg(true);
    setTimeout(() => setGasSavedMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">ZameenChain Portal Access</h3>
              <p className="text-xs text-slate-400">Government of Sindh • Karachi Land Authority</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* SCREEN 1: PENDING APPROVAL (When Registrar completes registration) */}
          {pendingRegistrarInfo ? (
            <div className="p-4 sm:p-6 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-full">
                  Registration Received • Approval Required
                </span>
                <h3 className="text-xl font-black text-slate-100 mt-3 mb-1">
                  Application Under Review
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Aapka email verify ho gaya hai aur KDA Sub-Registrar account create ho chuka hai, magar <strong>ab tak activate nahi hua</strong>.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Officer Name:</span>
                  <span className="text-slate-100 font-bold font-sans">{pendingRegistrarInfo.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Badge ID:</span>
                  <span className="text-teal-400 font-bold">{pendingRegistrarInfo.badgeNumber || 'KDA-APPLICANT'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Verified Email:</span>
                  <span className="text-emerald-400 font-semibold">{pendingRegistrarInfo.email} ✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vetting Officer:</span>
                  <span className="text-amber-400 font-bold font-sans">👑 Rayyan Ahmed (Chief Admin)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/60">
                    PENDING_APPROVAL ⏳
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-left max-w-md mx-auto">
                <p>
                  ℹ️ <strong>Security Protocol:</strong> Chief Admin (Rayyan Ahmed) apne portal ke <strong>"Registrar Vetting Queue"</strong> se aapke credentials check karke <strong>Approve</strong> karenge. Approval ke baad hi aap KDA terminal access kar sakenge.
                </p>
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
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                Acknowledge & Back to Sign In
              </button>
            </div>
          ) : isVerifyingOtp ? (
            /* SCREEN 2: EMAIL OTP VERIFICATION STEP */
            <div className="p-2 sm:p-4 space-y-5 animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
                  <MailCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">Verify Your Email Address</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  We have sent a 6-digit verification code to: <br />
                  <strong className="text-cyan-300 font-mono text-sm">{email}</strong>
                </p>

                {sentViaScript ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sent via Google Apps Script (Check Inbox / Spam)
                  </span>
                ) : (
                  <div className="pt-1">
                    <span className="inline-block text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                      ⚡ Quick Testing OTP: <strong className="text-teal-400 font-mono tracking-widest">{activeOtpCode}</strong>
                      <button
                        type="button"
                        onClick={() => setEnteredOtp(activeOtpCode)}
                        className="ml-2 text-cyan-400 hover:underline cursor-pointer font-bold"
                      >
                        (Click to Auto-fill)
                      </button>
                    </span>
                  </div>
                )}
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block text-center mb-2">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="000000"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 rounded-2xl py-3 text-center text-2xl font-mono tracking-[0.5em] text-cyan-300 placeholder-slate-700 focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || enteredOtp.length !== 6}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-40 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Verify Email & Complete Registration</span>
                </button>
              </form>

              {/* Action Buttons: Resend & Change Email */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                <button
                  type="button"
                  onClick={() => { setIsVerifyingOtp(false); setErrorMsg(''); }}
                  className="hover:text-slate-200 transition cursor-pointer"
                >
                  ← Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className={`flex items-center gap-1.5 transition cursor-pointer font-medium ${
                    resendCooldown > 0
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-teal-400 hover:text-teal-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}</span>
                </button>
              </div>

              {/* Optional: Google Apps Script Webhook Configuration Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowGasConfig(!showGasConfig)}
                  className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 mx-auto transition cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Google Apps Script Email Webhook Settings</span>
                </button>

                {showGasConfig && (
                  <div className="mt-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2 animate-fadeIn">
                    <p className="text-[11px] text-slate-400">
                      Paste your deployed Google Apps Script Web App URL to send real emails via Gmail:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={gasUrlInput}
                        onChange={(e) => setGasUrlInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGasUrl}
                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                    {gasSavedMsg && (
                      <p className="text-[11px] text-emerald-400 font-medium">✓ Google Script URL saved successfully!</p>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono">
                      Code available in project: <code>scripts/GoogleAppsScript_EmailService.gs</code>
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* SCREEN 3: NORMAL LOGIN & REGISTRATION FORMS */
            <>
              {/* Tabs: Sign In vs Register */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                    mode === 'login'
                      ? 'border-teal-400 text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Sign In to Account
                </button>
                <button
                  onClick={() => { setMode('signup'); setErrorMsg(''); }}
                  className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                    mode === 'signup'
                      ? 'border-teal-400 text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Register New Account
                </button>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* ONLY ON SIGN UP: Role Selection (Buyer, Seller, KDA Registrar) */}
                {mode === 'signup' && (
                  <div className="space-y-2 pb-2">
                    <label className="text-slate-300 block font-bold text-xs">
                      Registering as:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      
                      {/* Buyer */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole('BUYER')}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedRole === 'BUYER'
                            ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="font-bold text-xs">Buyer</span>
                        <span className="text-[10px] text-slate-500">Khareedar</span>
                      </button>

                      {/* Seller */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole('SELLER')}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedRole === 'SELLER'
                            ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        <span className="font-bold text-xs">Seller</span>
                        <span className="text-[10px] text-slate-500">Zameen Maalik</span>
                      </button>

                      {/* KDA Registrar */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole('REGISTRAR')}
                        className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedRole === 'REGISTRAR'
                            ? 'bg-amber-950/70 border-amber-400 text-amber-300 ring-2 ring-amber-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-bold text-xs">Registrar</span>
                        <span className="text-[10px] text-slate-500">Govt Officer</span>
                      </button>

                    </div>
                  </div>
                )}

                {/* Name field (Sign Up only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">
                      {selectedRole === 'REGISTRAR' ? 'Officer Full Name & Title *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={selectedRole === 'REGISTRAR' ? 'e.g. Sub-Registrar Tariq Mansoor' : 'e.g. Hamza Sheikh'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                {/* Email Address (Both Login and Sign Up) */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">
                    {mode === 'signup' && selectedRole === 'REGISTRAR'
                      ? 'Official Government Email (@kda.gos.pk) *'
                      : 'Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder={mode === 'signup' && selectedRole === 'REGISTRAR' ? 'officer.name@kda.gos.pk' : 'user@example.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Registrar specific fields */}
                {mode === 'signup' && selectedRole === 'REGISTRAR' && (
                  <>
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Official Badge ID / Service Number *</label>
                      <div className="relative">
                        <IdCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. KDA-SR-102"
                          value={badgeNumber}
                          onChange={(e) => setBadgeNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">District Sub-Registry Division *</label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </>
                )}

                {/* CNIC (Buyer / Seller on Sign Up) */}
                {mode === 'signup' && (selectedRole === 'BUYER' || selectedRole === 'SELLER') && (
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">CNIC Number (National Identity) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 42101-1234567-1"
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {mode === 'login'
                      ? 'Sign In to Account'
                      : 'Send Verification Code to Email'}
                  </span>
                </button>
              </form>

              {/* Registrar Approval Notice */}
              {mode === 'signup' && selectedRole === 'REGISTRAR' && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[11px] text-amber-200 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Govt Security Vetting:</strong> Email verify hone ke baad aapki Sub-Registrar application Chief Admin (Rayyan Ahmed) ko approval ke liye submit hogi.
                  </span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer: Guest mode */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Just want to verify a plot?</span>
          <button
            onClick={onClose}
            className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer underline underline-offset-2"
          >
            Continue as Public Guest (Inspect Only)
          </button>
        </div>

      </div>
    </div>
  );
}
