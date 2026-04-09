import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Building, GraduationCap,
  Award, ArrowRight, ArrowLeft, CheckCircle,
  ChevronDown, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import BrandLogo from '../../components/shared/BrandLogo';

const API_ORIGIN = import.meta.env.VITE_API_URL?.trim()
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:8000';

/* ─── Constants ──────────────────────────────────────────────────────── */
const ROLES = [
  {
    id: 'student',
    icon: GraduationCap,
    title: 'Student',
    description: 'Track applications, prep for interviews, compare offers',
    activeBorder: 'border-[rgba(99,102,241,0.28)]',
    activeBg: 'bg-[rgba(99,102,241,0.08)]',
    iconActive: 'text-[#6366f1] bg-[rgba(99,102,241,0.1)] border-[rgba(99,102,241,0.24)]',
    badge: 'Most common',
    badgeCls: 'bg-[rgba(99,102,241,0.1)] text-[#6366f1]',
    checkColor: 'text-[#6366f1]',
  },
  {
    id: 'coordinator',
    icon: Building,
    title: 'Coordinator',
    description: 'Manage companies, students, announcements & analytics',
    activeBorder: 'border-[rgba(245,158,11,0.28)]',
    activeBg: 'bg-[rgba(245,158,11,0.08)]',
    iconActive: 'text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.24)]',
    badge: 'College staff',
    badgeCls: 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]',
    checkColor: 'text-[#f59e0b]',
  },
  {
    id: 'alumni',
    icon: Award,
    title: 'Alumni',
    description: 'Share experiences, salary data & refer juniors',
    activeBorder: 'border-[rgba(16,185,129,0.28)]',
    activeBg: 'bg-[rgba(16,185,129,0.08)]',
    iconActive: 'text-[#10b981] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.24)]',
    badge: 'Give back',
    badgeCls: 'bg-[rgba(16,185,129,0.1)] text-[#10b981]',
    checkColor: 'text-[#10b981]',
  },
];

const BRANCHES = [
  'Computer Science','Information Technology','Electronics & Communication',
  'Electrical Engineering','Mechanical Engineering','Civil Engineering',
  'Chemical Engineering','Other',
];

const BATCHES = ['2024','2025','2026','2027','2028'];

/* ─── Shared atoms ───────────────────────────────────────────────────── */
const Label = ({ children }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
    {children}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-[11px] text-[var(--danger)] font-medium mt-1.5">{msg}</p> : null;

const ic = (err, extra = '') =>
  `input text-sm pl-10 transition-all duration-200 ${extra}
  ${err ? 'border-[var(--danger)] shadow-[var(--input-error-ring)]' : ''}`;

/* ─── Password strength bar ──────────────────────────────────────────── */
const PasswordStrength = ({ password }) => {
  const len    = password.length;
  const hasNum = /\d/.test(password);
  const hasSym = /[^a-zA-Z0-9]/.test(password);
  const score  = (len >= 6 ? 1 : 0) + (len >= 10 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);

  const levels = [
    { label: 'Weak',   color: 'bg-[var(--danger)]'  },
    { label: 'Fair',   color: 'bg-[var(--warning)]' },
    { label: 'Good',   color: 'bg-[var(--accent)]'  },
    { label: 'Strong', color: 'bg-[var(--status-success)]' },
  ];
  const lvl = levels[Math.min(score - 1, 3)] || levels[0];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i}
            className={`h-0.5 flex-1 rounded-pill transition-all duration-300
              ${i <= score ? lvl.color : 'bg-[var(--border)]'}`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${lvl.color.replace('bg-', 'text-')}`}>
        {lvl.label}
      </p>
    </div>
  );
};

/* ─── Step dots ──────────────────────────────────────────────────────── */
const StepDots = ({ step }) => (
  <div className="flex items-center justify-center gap-3 mb-8">
    {[1, 2].map(s => (
      <div key={s} className="flex items-center gap-2">
        <div className={`
          w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold
          transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${s < step
            ? 'bg-[var(--accent)] text-[var(--text-reverse)] scale-95'
            : s === step
              ? 'bg-[var(--accent)] text-[var(--text-reverse)] shadow-md'
              : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]'
          }
        `}>
          {s < step ? <CheckCircle size={13} /> : s}
        </div>
        <span className={`text-xs font-semibold hidden sm:block transition-colors duration-200
          ${s === step ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {s === 1 ? 'Choose Role' : 'Your Details'}
        </span>
        {s < 2 && (
          <div className={`w-10 h-px mx-1 transition-colors duration-300
            ${step > 1 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
        )}
      </div>
    ))}
  </div>
);

/* ─── Main page ──────────────────────────────────────────────────────── */
const RegisterPage = () => {
  const navigate = useNavigate();
  const { registerUser, getDashboardPath } = useAuth();
  const googleAuthUrl = `${API_ORIGIN}/api/auth/google`;

  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: '', college: '', batch: '', branch: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});
  const [mounted,      setMounted]      = useState(false);

  /* Re-trigger mount animation on step change */
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, [step]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const selectRole = role => {
    setForm(p => ({ ...p, role }));
    setErrors(p => ({ ...p, role: '' }));
  };

  const validateStep1 = () =>
    !form.role ? { role: 'Please select your role to continue' } : {};

  const validateStep2 = () => {
    const e = {};
    if (!form.name.trim())                   e.name = 'Name is required';
    else if (form.name.trim().length < 2)    e.name = 'Name must be at least 2 characters';
    if (!form.email)                         e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)                      e.password = 'Password is required';
    else if (form.password.length < 6)       e.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(2);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const user = await registerUser({
        name:     form.name.trim(),
        email:    form.email.toLowerCase().trim(),
        password: form.password,
        role:     form.role,
        college:  form.college,
        batch:    form.batch,
        branch:   form.branch,
      });
      toast.success(`Welcome to Avenor, ${user.name.split(' ')[0]}!`);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.id === form.role);

  return (
    <div className="auth-page min-h-[calc(100vh-4rem)] w-full flex items-center justify-center
      p-4 py-4 md:py-6 bg-[var(--bg)] relative overflow-x-hidden">

      {/* ── Ambient glow ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2
        w-[600px] h-[300px] rounded-full blur-3xl opacity-[0.06] pointer-events-none
        bg-[radial-gradient(ellipse,rgba(120,120,120,0.3)_0%,transparent_70%)]" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2
        w-[560px] h-[260px] rounded-full blur-3xl opacity-[0.06] pointer-events-none
        bg-[radial-gradient(ellipse,rgba(100,100,100,0.3)_0%,transparent_72%)]" />

      {/* ── Dot grid ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="rg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--text-muted)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rg)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-xl">

        {/* ── Brand header ─────────────────────────────────────────── */}
        <div className={`
          text-center mb-8
          transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {/* Logo */}
          <div className="flex items-center justify-center mb-5">
            <BrandLogo size="sm" />
          </div>

          <h1 className="font-display text-h2 font-bold text-[var(--text-primary)] tracking-tight mb-2">
            {step === 1 ? 'Who are you?' : 'Create your account'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {step === 1
              ? 'Select your role to get the right experience'
              : 'Fill in your details to get started'}
          </p>
        </div>

        {/* ── Step dots ─────────────────────────────────────────────── */}
        <StepDots step={step} />

        {/* ══ STEP 1: Role selection ══════════════════════════════════ */}
        {step === 1 && (
          <div className={`
            space-y-3
            transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}>
            {ROLES.map(({ id, icon: Icon, title, description,
              activeBorder, activeBg, iconActive, badge, badgeCls, checkColor }, i) => {
              const active = form.role === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectRole(id)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={`auth-role-card
                    w-full p-5 rounded-2xl border-2 text-left flex items-start gap-4 group
                    transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                    animate-slide-up
                    ${active
                      ? `${activeBorder} ${activeBg} scale-[1.01] shadow-[var(--shadow-soft)]`
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-muted)]/30 hover:scale-[1.005]'
                    }
                  `}
                >
                  {/* Icon well */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                    border transition-all duration-200
                    ${active
                      ? iconActive
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]'
                    }
                  `}>
                    <Icon size={21} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-sm
                        ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-pill ${badgeCls}`}>
                        {badge}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
                  </div>

                  {/* Check */}
                  {active && (
                    <CheckCircle size={18} className={`${checkColor} shrink-0 mt-0.5 animate-fade-in`} />
                  )}
                </button>
              );
            })}

            {/* Role error */}
            <div className={`overflow-hidden transition-all duration-300
              ${errors.role ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="text-sm text-[var(--danger)] text-center font-medium">{errors.role}</p>
            </div>

            {/* Continue */}
            <button
              type="button"
              onClick={handleNext}
              className="auth-primary-btn w-full btn-primary h-12 rounded-input font-bold gap-2
                flex items-center justify-center relative overflow-hidden group mt-2"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-transparent via-white/10 to-transparent
                -translate-x-full group-hover:translate-x-full
                transition-all duration-700 pointer-events-none" />
              <span className="relative z-10">Continue</span>
              <ArrowRight size={15} className="relative z-10" />
            </button>

            <a
              href={googleAuthUrl}
              className="auth-google-btn w-full flex items-center justify-center gap-3 border border-[#dadce0] hover:border-[#c7c9cc] text-[#3c4043] font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm bg-[#ffffff] mt-1 shadow-[0_1px_2px_rgba(60,64,67,0.15)] hover:bg-[#f8f9fa] active:scale-[0.97]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.51 5.51 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.18 3.56-8.65z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.79-2.11-6.73-4.95H1.27v3.09A12 12 0 0 0 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.28A7.21 7.21 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.78 1.27 5.36l4-3.08z"/>
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.13 15.23 0 12 0A12 12 0 0 0 1.27 6.64l4 3.08c.94-2.84 3.6-4.95 6.73-4.95z"/>
              </svg>
              Continue with Google
            </a>

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link to="/login"
                className="text-[var(--accent)] hover:opacity-80 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* ══ STEP 2: Details form ════════════════════════════════════ */}
        {step === 2 && (
          <form
            onSubmit={handleSubmit}
            className={`
              space-y-4
              transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {/* Selected role pill */}
            {selectedRole && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl
                bg-[var(--surface)] border border-[var(--border)] animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center
                    border ${selectedRole.iconActive}`}>
                    <selectedRole.icon size={13} />
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                    {form.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs text-[var(--accent)]
                    hover:opacity-80 font-semibold transition-colors"
                >
                  <ArrowLeft size={11} /> Change
                </button>
              </div>
            )}

            {/* General error */}
            <div className={`overflow-hidden transition-all duration-300
              ${errors.general ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl
                bg-[var(--danger-bg)] border border-[var(--danger-border)]
                text-sm text-[var(--danger)] font-medium">
                {errors.general}
              </div>
            </div>

            {/* Name */}
            <div
              className="animate-slide-up"
              style={{ animationDelay: '40ms' }}
            >
              <Label>Full Name</Label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2
                  text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text" name="name" value={form.name}
                  onChange={handleChange}
                  placeholder="Brahmjeet Singh"
                  autoComplete="name"
                  className={ic(errors.name)}
                />
              </div>
              <FieldError msg={errors.name} />
            </div>

            {/* Email */}
            <div
              className="animate-slide-up"
              style={{ animationDelay: '80ms' }}
            >
              <Label>Email Address</Label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2
                  text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange}
                  placeholder="you@college.edu"
                  autoComplete="email"
                  className={ic(errors.email)}
                />
              </div>
              <FieldError msg={errors.email} />
            </div>

            {/* Password row */}
            <div
              className="grid grid-cols-2 gap-3 animate-slide-up"
              style={{ animationDelay: '120ms' }}
            >
              {/* Password */}
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2
                    text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    autoComplete="new-password"
                    className={ic(errors.password, 'pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] hover:text-[var(--text-primary)]
                      transition-colors duration-150"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
                <FieldError msg={errors.password} />
              </div>

              {/* Confirm */}
              <div>
                <Label>Confirm</Label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2
                    text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword" value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat"
                    autoComplete="new-password"
                    className={ic(errors.confirmPassword, 'pr-10')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] hover:text-[var(--text-primary)]
                      transition-colors duration-150"
                  >
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {/* Match indicator */}
                {form.confirmPassword && (
                  <p className={`text-[10px] font-semibold mt-2
                    ${form.password === form.confirmPassword
                      ? 'text-[var(--status-success)]' : 'text-[var(--danger)]'}`}>
                    {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ No match'}
                  </p>
                )}
                <FieldError msg={errors.confirmPassword} />
              </div>
            </div>

            {/* Optional fields */}
            <div
              className="rounded-2xl border border-[var(--border)] overflow-hidden
                animate-slide-up"
              style={{ animationDelay: '160ms' }}
            >
              <div className="flex items-center gap-2 px-4 py-3
                border-b border-[var(--border)] bg-[var(--surface-2)]/60">
                <Sparkles size={12} className="text-[var(--text-muted)]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Optional — personalises your experience
                </p>
              </div>

              <div className="p-4 space-y-3 bg-[var(--surface)]">
                {/* College */}
                <input
                  type="text" name="college" value={form.college}
                  onChange={handleChange}
                  placeholder="College name (e.g. Thapar Institute)"
                  className="input text-sm"
                />

                {/* Branch + Batch */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <select
                      name="branch" value={form.branch}
                      onChange={handleChange}
                      className="input text-sm appearance-none pr-8"
                    >
                      <option value="">Select Branch</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      name="batch" value={form.batch}
                      onChange={handleChange}
                      className="input text-sm appearance-none pr-8"
                    >
                      <option value="">Batch / Year</option>
                      {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="auth-primary-btn w-full btn-primary h-12 rounded-input font-bold gap-2
                flex items-center justify-center relative overflow-hidden group
                disabled:opacity-50 disabled:cursor-not-allowed
                animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-transparent via-white/10 to-transparent
                -translate-x-full group-hover:translate-x-full
                transition-all duration-700 pointer-events-none" />
              {loading ? (
                <>
                  <div className="relative z-10 w-4 h-4 border-2
                    border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative z-10">Creating account…</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Create Account</span>
                  <ArrowRight size={15} className="relative z-10" />
                </>
              )}
            </button>

            <a
              href={googleAuthUrl}
              className="auth-google-btn w-full flex items-center justify-center gap-3 border border-[#dadce0] hover:border-[#c7c9cc] text-[#3c4043] font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm bg-[#ffffff] mt-1 shadow-[0_1px_2px_rgba(60,64,67,0.15)] hover:bg-[#f8f9fa] active:scale-[0.97]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.51 5.51 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.18 3.56-8.65z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.79-2.11-6.73-4.95H1.27v3.09A12 12 0 0 0 12 24z"/>
                <path fill="#FBBC05" d="M5.27 14.28A7.21 7.21 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.78 1.27 5.36l4-3.08z"/>
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.13 15.23 0 12 0A12 12 0 0 0 1.27 6.64l4 3.08c.94-2.84 3.6-4.95 6.73-4.95z"/>
              </svg>
              Continue with Google
            </a>

            <p className="text-center text-xs text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link to="/login"
                className="text-[var(--accent)] font-semibold hover:opacity-80 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>

      <style>{`
        .dark .auth-page .auth-role-card:hover {
          border-color: rgba(255,255,255,0.22) !important;
          background: rgba(26,26,26,0.9) !important;
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 18px 34px -20px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.1) inset;
        }

        .dark .auth-page .auth-primary-btn {
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 14px 30px -16px rgba(0,0,0,0.9);
        }

        .dark .auth-page .auth-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 36px -18px rgba(0,0,0,0.95);
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
      `}</style>
    </div>
  );
};

export default RegisterPage;