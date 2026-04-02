import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROUTES, APP_NAME, API_BASE } from '../constants';
import logoIcon from '../assets/logo.png';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 120;

// Password strength rules
const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit', label: 'One digit (0–9)', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string) {
  return RULES.filter(r => r.test(password)).length;
}
const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColor = ['', '#EF4444', '#F59E0B', '#EAB308', '#10B981', '#059669'];

// ─── OTP Input Component ───────────────────────────────────────────────────
const OtpInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    // Fill empty slots
    while (arr.length < OTP_LENGTH) arr.push('');
    const next = arr.join('').slice(0, OTP_LENGTH);
    onChange(next);
    if (digit && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted) {
      onChange(pasted.padEnd(OTP_LENGTH, ''));
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-13 text-center text-[22px] font-bold border-2 rounded-xl bg-[#F7F7F7] text-[#1A1A1A] focus:outline-none transition-all duration-200 ${
            value[i]
              ? 'border-[#8B7355] bg-[#FAF6F0] shadow-[0_0_0_3px_rgba(139,115,85,0.15)]'
              : 'border-[#EBEBEB] focus:border-[#8B7355] focus:shadow-[0_0_0_3px_rgba(139,115,85,0.15)]'
          }`}
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
};

// ─── Countdown Timer ──────────────────────────────────────────────────────
const Countdown = ({ seconds, onExpire }: { seconds: number; onExpire: () => void }) => {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const id = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) { clearInterval(id); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, onExpire]);

  const m = Math.floor(left / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');

  return (
    <span className={`font-mono font-bold ${left <= 30 ? 'text-red-500' : 'text-[#8B7355]'}`}>
      {m}:{s}
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = getStrength(newPass);
  const allRulesPassed = strength === RULES.length;
  const passwordsMatch = newPass === confirmPass && confirmPass !== '';

  // Step 1: Send OTP to email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Failed to send OTP. Please check your email address.');
      }
      setIsOtpExpired(false);
      setOtp('');
      setCountdownKey(k => k + 1);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = useCallback(async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to resend OTP.');
      setIsOtpExpired(false);
      setOtp('');
      setCountdownKey(k => k + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < OTP_LENGTH) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Invalid or expired code. Please try again.');
      }
      setStep('newPassword');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed) { setError('Password does not meet all requirements.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPass }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Failed to reset password.');
      }
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const STEPS: Step[] = ['email', 'otp', 'newPassword', 'success'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4EE] via-[#F0EDE7] to-[#E8E2D8] flex items-center justify-center px-4 py-8">

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-8%] left-[-3%] w-[450px] h-[450px] rounded-full bg-[#8B7355]/7 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[380px] h-[380px] rounded-full bg-[#8B7355]/6 blur-3xl" />
      </div>

      <motion.div
        key="card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[480px]"
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['Email', 'Verify OTP', 'New Password'].map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                  i < stepIndex
                    ? 'bg-emerald-500 text-white'
                    : i === stepIndex
                    ? 'bg-[#8B7355] text-white shadow-[0_0_0_3px_rgba(139,115,85,0.25)]'
                    : 'bg-[#E5E0D8] text-[#9B9B9B]'
                }`}>
                  {i < stepIndex ? <CheckCircle2 size={13} /> : i + 1}
                </div>
                <span className={`text-[11px] font-semibold hidden sm:block ${
                  i === stepIndex ? 'text-[#8B7355]' : i < stepIndex ? 'text-emerald-600' : 'text-[#A0A0A0]'
                }`}>{label}</span>
              </div>
              {i < 2 && (
                <div className={`h-px w-8 transition-all duration-500 ${i < stepIndex ? 'bg-emerald-400' : 'bg-[#DDD8D0]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.10)] overflow-hidden">

          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-[#8B7355] via-[#C9A97A] to-[#8B7355]" />

          <div className="p-8">

            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <Link to={ROUTES.HOME}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5540] flex items-center justify-center shadow-lg mb-3">
                  <img src={logoIcon} alt={APP_NAME} className="w-8 h-8 rounded-lg shadow-sm" />
                </div>
              </Link>
            </div>

            {/* Error banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[12px] overflow-hidden"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── STEP 1: Email ── */}
            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D2] flex items-center justify-center mx-auto mb-4">
                      <Mail size={26} className="text-[#8B7355]" />
                    </div>
                    <h2 className="text-[20px] font-bold text-[#1A1A1A]">Forgot your password?</h2>
                    <p className="text-[13px] text-[#6B6B6B] mt-1.5">
                      Enter your registered email and we'll send you a one-time code to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleSendEmail} className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">Email address</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]"><Mail size={14} /></div>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          placeholder="your.name@example.com"
                          className="w-full pl-10 pr-4 py-3 bg-[#F7F7F7] border border-[#EBEBEB] rounded-xl text-[13px] text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30 focus:border-[#8B7355] transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-[46px] bg-[#8B7355] hover:bg-[#7A6448] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(139,115,85,0.35)] flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending code…</>
                      ) : (
                        <><Mail size={15} /> Send OTP Code</>
                      )}
                    </button>

                    <div className="text-center">
                      <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1.5 text-[12px] text-[#6B6B6B] hover:text-[#8B7355] transition-colors">
                        <ArrowLeft size={12} /> Back to sign in
                      </Link>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 2: OTP ── */}
              {step === 'otp' && (
                <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D2] flex items-center justify-center mx-auto mb-4 relative">
                      <ShieldCheck size={26} className="text-[#8B7355]" />
                      {!isOtpExpired && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </div>
                    <h2 className="text-[20px] font-bold text-[#1A1A1A]">Check your email</h2>
                    <p className="text-[13px] text-[#6B6B6B] mt-1.5">
                      We sent a 6-digit code to <span className="font-semibold text-[#1A1A1A]">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <OtpInput value={otp} onChange={setOtp} />

                    {/* Timer */}
                    <div className="text-center">
                      {isOtpExpired ? (
                        <p className="text-[12px] text-red-500 font-medium">Code expired.</p>
                      ) : (
                        <p className="text-[12px] text-[#6B6B6B]">
                          Code expires in <Countdown key={countdownKey} seconds={OTP_EXPIRY_SECONDS} onExpire={() => setIsOtpExpired(true)} />
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length < OTP_LENGTH || isOtpExpired}
                      className="w-full h-[46px] bg-[#8B7355] hover:bg-[#7A6448] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(139,115,85,0.35)] flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying…</>
                      ) : (
                        <><ShieldCheck size={15} /> Verify Code</>
                      )}
                    </button>

                    {/* Resend */}
                    <div className="flex items-center justify-between text-[12px]">
                      <button type="button" onClick={() => setStep('email')} className="text-[#6B6B6B] hover:text-[#8B7355] flex items-center gap-1 transition-colors">
                        <ArrowLeft size={12} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading}
                        className="text-[#8B7355] hover:text-[#7A6448] font-semibold disabled:opacity-50 flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw size={12} /> Resend code
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 3: New password ── */}
              {step === 'newPassword' && (
                <motion.div key="newPassword" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D2] flex items-center justify-center mx-auto mb-4">
                      <Lock size={26} className="text-[#8B7355]" />
                    </div>
                    <h2 className="text-[20px] font-bold text-[#1A1A1A]">Set new password</h2>
                    <p className="text-[13px] text-[#6B6B6B] mt-1.5">Choose a strong password for your account.</p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">

                    {/* New Password */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">New Password</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]"><Lock size={14} /></div>
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPass}
                          onChange={e => setNewPass(e.target.value)}
                          required
                          placeholder="Create a strong password"
                          className="w-full pl-10 pr-10 py-3 bg-[#F7F7F7] border border-[#EBEBEB] rounded-xl text-[13px] text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30 focus:border-[#8B7355] transition-all"
                        />
                        <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6B6B6B] transition-colors">
                          {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {newPass && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {RULES.map((_, i) => (
                              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                                style={{ backgroundColor: i < strength ? strengthColor[strength] : '#E5E7EB' }} />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold" style={{ color: strengthColor[strength] }}>
                              {strengthLabel[strength]}
                            </p>
                            <div className="flex gap-2">
                              {RULES.map(rule => (
                                <span key={rule.id} title={rule.label}>
                                  {rule.test(newPass)
                                    ? <CheckCircle2 size={11} className="text-emerald-500" />
                                    : <XCircle size={11} className="text-[#D0CCC6]" />}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]"><Lock size={14} /></div>
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPass}
                          onChange={e => setConfirmPass(e.target.value)}
                          required
                          placeholder="Repeat your new password"
                          className={`w-full pl-10 pr-10 py-3 bg-[#F7F7F7] border rounded-xl text-[13px] text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 transition-all ${
                            confirmPass
                              ? passwordsMatch
                                ? 'border-emerald-400 focus:ring-emerald-300/30'
                                : 'border-red-300 focus:ring-red-200/30'
                              : 'border-[#EBEBEB] focus:ring-[#8B7355]/30 focus:border-[#8B7355]'
                          }`}
                        />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6B6B6B] transition-colors">
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {confirmPass && !passwordsMatch && (
                        <p className="text-[11px] text-red-500 font-medium mt-1">Passwords do not match</p>
                      )}
                      {confirmPass && passwordsMatch && (
                        <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Passwords match
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !allRulesPassed || !passwordsMatch}
                      className="w-full h-[46px] bg-[#8B7355] hover:bg-[#7A6448] disabled:bg-[#C4B49A] disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(139,115,85,0.35)] flex items-center justify-center gap-2 mt-2"
                    >
                      {isLoading ? (
                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting…</>
                      ) : (
                        <><ShieldCheck size={15} /> Reset Password</>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 4: Success ── */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="text-center py-4"
                >
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
                    <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-emerald-500" />
                    </div>
                  </div>
                  <h2 className="text-[22px] font-bold text-[#1A1A1A] mb-2">Password Reset!</h2>
                  <p className="text-[13px] text-[#6B6B6B] mb-6 leading-relaxed">
                    Your password has been successfully updated. You can now sign in with your new credentials.
                  </p>
                  <button
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="inline-flex items-center gap-2 h-[46px] px-8 bg-[#8B7355] hover:bg-[#7A6448] text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(139,115,85,0.35)]"
                  >
                    Sign in now
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom credit */}
        <p className="text-center text-[11px] text-[#A0A0A0] mt-4">{APP_NAME} — Secure Access Platform</p>
      </motion.div>
    </div>
  );
};
