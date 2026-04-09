import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ArrowRight, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [step, setStep] = useState(1); // 1: email, 2: otp+newpass
  const [form, setForm] = useState({ email: initialEmail, otp: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setErrors({ email: 'Enter a valid email' });
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(form.email);
      toast.success('OTP sent! Check your email (or server console in dev mode)');
      setStep(2);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.otp || form.otp.length !== 6) errs.otp = 'Enter the 6-digit OTP';
    if (!form.newPassword || form.newPassword.length < 6) errs.newPassword = 'Min 6 characters';
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.resetPassword({ email: form.email, otp: form.otp, newPassword: form.newPassword });
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. Check OTP and try again.';
      toast.error(msg);
      setErrors({ otp: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[linear-gradient(135deg,rgba(120,120,120,0.12),rgba(80,80,80,0.08))] border border-[rgba(58,58,58,0.16)] flex items-center justify-center mx-auto mb-4">
            <KeyRound size={28} className="text-[var(--accent)]" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            {step === 1 ? 'Forgot password?' : 'Reset password'}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {step === 1
              ? "Enter your email and we'll send you an OTP"
              : `OTP sent to ${form.email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@college.edu"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-[var(--input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-sm outline-none transition-all
                    ${errors.email ? 'border-[var(--danger)] focus:shadow-[var(--input-error-ring)]' : 'border-[var(--color-border)] focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]'}`}
                />
              </div>
              {errors.email && <p className="text-xs text-[var(--danger)]">{errors.email}</p>}
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[linear-gradient(120deg,rgba(90,90,90,1),rgba(70,70,70,1))] hover:brightness-[1.08] disabled:opacity-60 text-[var(--text-reverse)] font-bold py-3.5 rounded-xl transition-all shadow-md"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Mail size={16} /> Send OTP</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">6-digit OTP</label>
              <input
                type="text" name="otp" value={form.otp} onChange={handleChange}
                placeholder="123456" maxLength={6}
                className={`w-full px-4 py-3 rounded-xl border bg-[var(--input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-sm outline-none text-center tracking-[0.5em] font-mono transition-all
                  ${errors.otp ? 'border-[var(--danger)] focus:shadow-[var(--input-error-ring)]' : 'border-[var(--color-border)] focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]'}`}
              />
              {errors.otp && <p className="text-xs text-[var(--danger)]">{errors.otp}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type={showPass ? 'text' : 'password'} name="newPassword" value={form.newPassword} onChange={handleChange}
                  placeholder="Min 6 characters"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-[var(--input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-sm outline-none transition-all
                    ${errors.newPassword ? 'border-[var(--danger)] focus:shadow-[var(--input-error-ring)]' : 'border-[var(--color-border)] focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]'}`}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-[var(--danger)]">{errors.newPassword}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--color-text-secondary)]">Confirm Password</label>
              <input
                type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                placeholder="Repeat password"
                className={`w-full px-4 py-3 rounded-xl border bg-[var(--input-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] text-sm outline-none transition-all
                  ${errors.confirmPassword ? 'border-[var(--danger)] focus:shadow-[var(--input-error-ring)]' : 'border-[var(--color-border)] focus:border-[var(--accent)] focus:shadow-[var(--input-focus-ring)]'}`}
              />
              {errors.confirmPassword && <p className="text-xs text-[var(--danger)]">{errors.confirmPassword}</p>}
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[linear-gradient(90deg,rgba(90,90,90,1),rgba(70,70,70,1))] hover:brightness-105 disabled:opacity-60 text-[var(--text-reverse)] font-bold py-3.5 rounded-xl transition-all shadow-md"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Reset Password <ArrowRight size={16} /></>}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-[var(--accent)] hover:opacity-80 font-medium transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
