import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, User as UserIcon } from 'lucide-react';
import { Button, Input } from '../components/UI';
import { ROUTES, APP_NAME } from '../constants';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import logoIcon from '../assets/icon.svg';


export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#F7F7F7] flex items-center justify-center overflow-hidden px-4">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[860px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden flex"
        style={{ height: 'min(580px, calc(100vh - 48px))' }}
      >

        {/* LEFT — Form */}
        <div className="w-1/2 flex flex-col justify-center px-10 py-8 overflow-hidden">

          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-5">
            <Link to={ROUTES.HOME}>
              <img src={logoIcon} alt={APP_NAME} className="w-[38px] h-[38px] mb-2" />
            </Link>
            <h2 className="text-[17px] font-extrabold text-[#1A1A1A]">Sign in to {APP_NAME}</h2>
            <p className="text-[12px] text-[#6B6B6B] mt-0.5">Enter your credentials to access your account</p>
          </div>

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3 text-[12px]"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3 w-full">

            <div>
              <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1">Username</label>
              <Input
                placeholder="e.g. admin"
                type="text"
                required
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                icon={<UserIcon size={14} />}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#1A1A1A] mb-1">Password</label>
              <Input
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                icon={<Lock size={14} />}
              />
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#6B6B6B] hover:text-[#8B7355] flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                  {showPassword ? 'Hide' : 'Show'} password
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-[#8B7355]" />
                <span className="text-[12px] text-[#6B6B6B]">Remember me</span>
              </label>
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-[12px] text-[#8B7355] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[38px] bg-[#8B7355] hover:bg-[#7A6448] text-white text-[13px] font-bold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </Button>

          </form>

        </div>

        {/* RIGHT — Illustration */}
        <div className="w-1/2 bg-[#F5F0E8] relative overflow-hidden flex flex-col items-center justify-center">

          {/* Decorative circles */}
          <div className="absolute top-[-150px] right-[-100px] w-[260px] h-[260px] rounded-full bg-[#EAE3D2] opacity-70" />
          <div className="absolute bottom-[-120px] left-[-70px] w-[220px] h-[220px] rounded-full bg-[#EAE3D2] opacity-70" />

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center text-center px-8">
            <div className="w-[120px] h-[120px] rounded-full bg-[#DDD5C0] flex items-center justify-center mb-5 shadow-inner">
              <img src={logoIcon} alt="icon" className="w-[48px] h-[48px]" />
            </div>
            <h3 className="text-[18px] font-extrabold text-[#1A1A1A] mb-2">Secure Access Portal</h3>
            <p className="text-[12px] text-[#6B6B6B] leading-relaxed">
              ConcoursDoctor is a restricted platform. Access is granted by your system administrator based on your assigned role.
            </p>

            {/* Role hint cards */}

          </div>
        </div>

      </motion.div>
    </div>
  );
};

// RegisterPage is intentionally removed — account creation is admin-only.
// This named export is kept as a stub to prevent import errors from old references.
export const RegisterPage = () => null;
