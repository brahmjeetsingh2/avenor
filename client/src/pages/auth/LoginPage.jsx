import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import BrandLogo from '../../components/shared/BrandLogo';

const API_ORIGIN = import.meta.env.VITE_API_URL?.trim()
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:8000';

const CLIENT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
const GOOGLE_AUTH_URL = `${API_ORIGIN}/api/auth/google?client_url=${encodeURIComponent(CLIENT_ORIGIN)}`;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, getDashboardPath } = useAuth();

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname;

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const user = await loginUser({ email: form.email, password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      const destination = from || getDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  return (
    <div className="auth-page min-h-[calc(100vh-4rem)] w-full flex overflow-x-hidden">
      {/* ── Left panel (decorative) ── */}
      <div className="hidden lg:flex lg:w-1/2 hero-shell hero-shell--auth relative overflow-hidden bg-[linear-gradient(135deg,var(--bg),var(--surface),var(--surface-2))] items-center justify-center p-12 border-r border-[var(--color-border)] rounded-none">
        {/* Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[80px] animate-pulse-slow bg-[rgba(120,120,120,0.12)]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-[60px] animate-pulse-slow bg-[rgba(90,90,90,0.1)]" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-sm text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-12">
            <BrandLogo size="md" />
          </div>

          <h2 className="font-display text-4xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight">
            Your placement<br />command center
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-10 leading-relaxed">
            Track companies, prep for interviews, compare offers — all in one place.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: '500+', label: 'Companies' },
              { val: '10K+', label: 'Experiences' },
              { val: '100%', label: 'Free' },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="auth-stat-card p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] transition-all duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]/60" />
                  <div className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{val}</div>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div
          className="w-full max-w-md animate-slide-up hero-shell hero-shell--auth p-5 md:p-6 border-[rgba(120,120,120,0.24)] shadow-[0_20px_40px_-28px_rgba(0,0,0,0.55)] bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(245,245,245,0.9))] dark:bg-[linear-gradient(165deg,rgba(18,18,18,0.94),rgba(12,12,12,0.9))]"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[linear-gradient(90deg,rgba(120,120,120,0.12),rgba(100,100,100,0.1),rgba(80,80,80,0.08))] border border-[rgba(38,38,38,0.16)] text-xs font-semibold text-[var(--text-primary)] mb-4">
              <Zap size={11} className="text-[var(--text-primary)]" />
              Welcome back
            </div>
            <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              Welcome Back
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Sign in to continue your placement journey.{' '}
              <Link to="/register" className="text-[var(--accent)] hover:opacity-80 font-semibold transition-colors">
                Create your Avenor account
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General error */}
            {errors.general && (
              <div className="p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-sm text-[var(--danger)]">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@college.edu"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-[var(--input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-sm outline-none transition-all
                    ${errors.email
                      ? 'border-[var(--danger)] focus:shadow-[var(--input-error-ring)]'
                      : 'border-[var(--color-border)] focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]'
                    }`}
                />
              </div>
              {errors.email && <p className="text-xs text-[var(--danger)]">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[var(--accent)] hover:opacity-80 transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-[var(--input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-sm outline-none transition-all
                    ${errors.password
                      ? 'border-[var(--danger)] focus:shadow-[var(--input-error-ring)]'
                      : 'border-[var(--color-border)] focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-[var(--danger)]">{errors.password}</p>}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={form.rememberMe}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  form.rememberMe
                    ? 'bg-[var(--accent)] border-[var(--accent)]'
                    : 'border-[var(--color-border)] group-hover:border-[var(--accent)]'
                }`}>
                  {form.rememberMe && (
                    <svg className="w-3 h-3 text-[var(--text-reverse)]" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--color-text-secondary)]">Remember me for 7 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="auth-primary-btn w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-[var(--text-reverse)] font-bold py-3.5 rounded-xl transition-all duration-200 shadow-[0_10px_22px_-10px_rgba(0,0,0,0.55)] border border-[rgba(255,255,255,0.06)] active:scale-[0.97] mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Google OAuth */}
          <a
            href={GOOGLE_AUTH_URL}
            className="auth-google-btn w-full flex items-center justify-center gap-3 border border-[#dadce0] hover:border-[#c7c9cc] text-[#3c4043] font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm bg-[#ffffff] mt-3 shadow-[0_1px_2px_rgba(60,64,67,0.15)] hover:bg-[#f8f9fa] active:scale-[0.97]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.51 5.51 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.18 3.56-8.65z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.79-2.11-6.73-4.95H1.27v3.09A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.28A7.21 7.21 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.78 1.27 5.36l4-3.08z"/>
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.13 15.23 0 12 0A12 12 0 0 0 1.27 6.64l4 3.08c.94-2.84 3.6-4.95 6.73-4.95z"/>
            </svg>
            Continue with Google
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Register CTA */}
          <Link
            to="/register"
            className="auth-outline-btn w-full flex items-center justify-center gap-2 border border-[var(--color-border)] hover:border-[var(--accent)]/30 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm"
          >
            Create a new account
          </Link>

          {/* Footer note */}
          <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
            By signing in, you agree to Avenor's terms of service
          </p>
        </div>
      </div>

      <style>{`
        .dark .auth-page .auth-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 14px 30px -18px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.1) inset;
        }

        .dark .auth-page .auth-primary-btn {
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 14px 30px -16px rgba(0,0,0,0.88);
        }

        .dark .auth-page .auth-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 36px -18px rgba(0,0,0,0.92);
        }

        .dark .auth-page .auth-google-btn {
          background: rgba(20,20,20,0.92);
          border-color: rgba(255,255,255,0.18);
          color: var(--text-primary);
          box-shadow: 0 10px 24px -16px rgba(0,0,0,0.88);
        }

        .dark .auth-page .auth-google-btn:hover {
          background: rgba(34,34,34,0.95);
          border-color: rgba(255,255,255,0.28);
          transform: translateY(-2px);
        }

        .dark .auth-page .auth-outline-btn {
          background: rgba(20,20,20,0.78);
          border-color: rgba(255,255,255,0.14);
          color: var(--text-secondary);
        }

        .dark .auth-page .auth-outline-btn:hover {
          background: rgba(32,32,32,0.86);
          border-color: rgba(255,255,255,0.26);
          color: var(--text-primary);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
