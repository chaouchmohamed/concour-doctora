import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, AlertCircle, KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ROUTES, APP_NAME } from '../constants';
import logoIcon from '../assets/icon.svg';

// ─── Password strength helpers ────────────────────────────────────────────────

const RULES = [
  { id: 'length',  label: 'At least 8 characters',              test: (p: string) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter',                test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',                test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit',   label: 'One digit (0–9)',                     test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$…)',        test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const getStrength = (p: string) => RULES.filter(r => r.test(p)).length;
const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColor = ['', '#EF4444', '#F59E0B', '#EAB308', '#10B981', '#059669'];

// ─── Reusable password field ──────────────────────────────────────────────────

const PasswordField = ({
  label, value, onChange, placeholder, show, onToggle, className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
  className?: string;
}) => (
  <div className={className}>
    <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
        <Lock size={14} />
      </div>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-[#F7F7F7] border border-[#EBEBEB] rounded-xl text-[13px] text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30 focus:border-[#8B7355] transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6B6B6B] transition-colors"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

// ─── Strength bar + rule indicators (inline, like ForgotPassword Step 3) ─────

const StrengthIndicator = ({ password }: { password: string }) => {
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
      <div className="flex gap-1 mb-1">
        {RULES.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{ backgroundColor: i < strength ? strengthColor[strength] : '#E5E7EB' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold" style={{ color: strengthColor[strength] }}>
          {strengthLabel[strength]}
        </p>
        <div className="flex gap-2">
          {RULES.map(rule => (
            <span key={rule.id} title={rule.label}>
              {rule.test(password)
                ? <CheckCircle2 size={11} className="text-emerald-500" />
                : <XCircle size={11} className="text-[#D0CCC6]" />}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Confirm match hint ───────────────────────────────────────────────────────

const MatchHint = ({ newPass, confirm }: { newPass: string; confirm: string }) => {
  if (!confirm) return null;
  const match = newPass === confirm;
  return match ? (
    <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
      <CheckCircle2 size={11} /> Passwords match
    </p>
  ) : (
    <p className="text-[11px] text-red-500 font-medium mt-1">Passwords do not match</p>
  );
};

// ─── FORCED (first-login) view — centered card, same as ForgotPassword Step 3 ─

const ForcedChangeView = () => {
  const { changePassword, user, logout } = useAuth();
  const navigate = useNavigate();

  const [newPass, setNewPass]       = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [success, setSuccess]       = useState(false);

  const allRulesPassed = getStrength(newPass) === RULES.length;
  const passwordsMatch = newPass === confirm && confirm !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allRulesPassed) { setError('Your new password does not meet all the requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      // No current password needed — backend checks must_change_password flag
      await changePassword(newPass);
      setSuccess(true);
      // Navigate immediately — no delay avoids the voluntary-change UI flash
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4EE] via-[#F0EDE7] to-[#E8E2D8] flex items-center justify-center px-4 py-8">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-8%] left-[-3%] w-[450px] h-[450px] rounded-full bg-[#8B7355]/7 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[380px] h-[380px] rounded-full bg-[#8B7355]/6 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[480px]"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.10)] overflow-hidden">

          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-[#8B7355] via-[#C9A97A] to-[#8B7355]" />

          <div className="p-8">

            {/* Logo + header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6B5540] flex items-center justify-center shadow-lg mb-3">
                <img src={logoIcon} alt={APP_NAME} className="w-7 h-7" />
              </div>
            </div>

            {/* Hero icon */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D2] flex items-center justify-center mx-auto mb-4 relative">
                <KeyRound size={26} className="text-[#8B7355]" />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-[20px] font-bold text-[#1A1A1A]">Set Your Permanent Password</h2>
              <p className="text-[13px] text-[#6B6B6B] mt-1.5 leading-relaxed">
                Welcome{user?.first_name ? `, ${user.first_name}` : ''}! Your account is ready — just secure it with a strong password to continue.
              </p>
            </div>

            {/* Error banner */}
            <AnimatePresence>
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

            {/* Success */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
                    <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-[16px] font-bold text-[#1A1A1A]">Password Set!</p>
                  <p className="text-[13px] text-[#6B6B6B] mt-1">Taking you to the dashboard…</p>
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mt-3" />
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* New password */}
                <div>
                  <PasswordField
                    label="New Password"
                    value={newPass}
                    onChange={setNewPass}
                    placeholder="Create a strong password"
                    show={showNew}
                    onToggle={() => setShowNew(v => !v)}
                  />
                  <StrengthIndicator password={newPass} />
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
                      <Lock size={14} />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="Repeat your new password"
                      className={`w-full pl-10 pr-10 py-3 bg-[#F7F7F7] border rounded-xl text-[13px] text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 transition-all ${
                        confirm
                          ? passwordsMatch
                            ? 'border-emerald-400 focus:ring-emerald-300/30'
                            : 'border-red-300 focus:ring-red-200/30'
                          : 'border-[#EBEBEB] focus:ring-[#8B7355]/30 focus:border-[#8B7355]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6B6B6B] transition-colors"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <MatchHint newPass={newPass} confirm={confirm} />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !allRulesPassed || !passwordsMatch}
                  className="w-full h-[46px] bg-[#8B7355] hover:bg-[#7A6448] disabled:bg-[#C4B49A] disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(139,115,85,0.35)] flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting password…</>
                  ) : (
                    <><ShieldCheck size={15} /> Activate Account</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-[12px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                >
                  Sign out instead
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#A0A0A0] mt-4">{APP_NAME} — Secure Access Platform</p>
      </motion.div>
    </div>
  );
};

// ─── VOLUNTARY change — two-panel design (from settings) ──────────────────────

const VoluntaryChangeView = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const [current, setCurrent]       = useState('');
  const [newPass, setNewPass]       = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [success, setSuccess]       = useState(false);

  const allRulesPassed = getStrength(newPass) === RULES.length;
  const passwordsMatch = newPass === confirm && confirm !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allRulesPassed) { setError('Your new password does not meet all the requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }
    if (current === newPass) { setError('New password must be different from the current one.'); return; }

    setIsLoading(true);
    try {
      await changePassword(newPass, current);
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.DASHBOARD, { replace: true }), 2200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4EE] via-[#F0EDE7] to-[#E8E2D8] flex items-center justify-center px-4 py-8">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#8B7355]/8 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#8B7355]/6 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[900px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.10)] overflow-hidden flex"
        style={{ minHeight: 560 }}
      >
        {/* Left panel */}
        <div className="w-[44%] bg-gradient-to-br from-[#2D2419] via-[#3D3222] to-[#4A3C28] relative overflow-hidden flex flex-col justify-between p-10">
          <div className="absolute top-[-80px] right-[-80px] w-[240px] h-[240px] rounded-full border border-white/10" />
          <div className="absolute top-[-40px] right-[-40px] w-[180px] h-[180px] rounded-full border border-white/8" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[200px] h-[200px] rounded-full border border-white/10" />

          <div>
            <div className="w-11 h-11 rounded-xl bg-[#8B7355] flex items-center justify-center shadow-lg mb-8">
              <img src={logoIcon} alt="Logo" className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 bg-[#8B7355]/30 text-[#C9A97A] rounded-full px-3 py-1 text-[11px] font-semibold mb-4 border border-[#8B7355]/40">
              <ShieldCheck size={11} /> Secure Area
            </div>
            <h1 className="text-white text-[22px] font-bold leading-snug mb-3">Change Your Password</h1>
            <p className="text-white/55 text-[13px] leading-relaxed">
              Update your account password. Use a strong, unique password you don't use elsewhere.
            </p>
          </div>

          {/* Requirements list */}
          <div className="space-y-2">
            <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider mb-3">Password requirements</p>
            {RULES.map(rule => {
              const passed = rule.test(newPass);
              return (
                <motion.div key={rule.id} className="flex items-center gap-2.5" animate={{ opacity: newPass ? 1 : 0.5 }}>
                  {passed
                    ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    : <XCircle size={13} className="text-white/25 shrink-0" />}
                  <span className={`text-[12px] transition-colors ${passed ? 'text-white/80' : 'text-white/35'}`}>
                    {rule.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col justify-center px-10 py-10">
          <div className="mb-7">
            <h2 className="text-[20px] font-bold text-[#1A1A1A] mb-1">Update your password</h2>
            <p className="text-[13px] text-[#6B6B6B]">Enter your current password and choose a new one.</p>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[#1A1A1A]">Password Changed!</p>
                  <p className="text-[13px] text-[#6B6B6B] mt-1">Redirecting you to the dashboard…</p>
                </div>
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-[13px]"
                  >
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField
                  label="Current Password"
                  value={current}
                  onChange={setCurrent}
                  placeholder="Enter your current password"
                  show={showCurrent}
                  onToggle={() => setShowCurrent(v => !v)}
                />

                <div>
                  <PasswordField
                    label="New Password"
                    value={newPass}
                    onChange={setNewPass}
                    placeholder="Create a strong password"
                    show={showNew}
                    onToggle={() => setShowNew(v => !v)}
                  />
                  <StrengthIndicator password={newPass} />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]"><Lock size={14} /></div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      placeholder="Repeat your new password"
                      className={`w-full pl-10 pr-10 py-3 bg-[#F7F7F7] border rounded-xl text-[13px] text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 transition-all ${
                        confirm
                          ? passwordsMatch
                            ? 'border-emerald-400 focus:ring-emerald-300/30 focus:border-emerald-400'
                            : 'border-red-300 focus:ring-red-200/30 focus:border-red-400'
                          : 'border-[#EBEBEB] focus:ring-[#8B7355]/30 focus:border-[#8B7355]'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#6B6B6B] transition-colors">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <MatchHint newPass={newPass} confirm={confirm} />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !allRulesPassed || !passwordsMatch}
                  className="w-full h-[46px] bg-[#8B7355] hover:bg-[#7A6448] disabled:bg-[#C4B49A] disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(139,115,85,0.35)] flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Changing…</>
                    : <><ShieldCheck size={15} /> Change Password</>}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Root export — picks the right view automatically ─────────────────────────

export const ChangePasswordPage = () => {
  const { user } = useAuth();
  // Lock the view on mount so a state update mid-flight never flips between views
  const [viewMode] = useState<'forced' | 'voluntary'>(
    user?.must_change_password ? 'forced' : 'voluntary'
  );
  return viewMode === 'forced' ? <ForcedChangeView /> : <VoluntaryChangeView />;
};
