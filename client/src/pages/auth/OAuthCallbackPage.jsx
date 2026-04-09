import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import BrandLogo from '../../components/shared/BrandLogo';

const OAuthCallbackPage = () => {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const { login }     = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus]   = useState('loading'); // 'loading' | 'error'

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const token    = params.get('token');
    const redirect = params.get('redirect') || '/student/dashboard';

    if (!token) {
      setStatus('error');
      setTimeout(() => navigate('/login?error=oauth'), 1800);
      return;
    }

    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        login(res.data.data.user, token);
        navigate(redirect, { replace: true });
      })
      .catch(() => {
        setStatus('error');
        setTimeout(() => navigate('/login?error=oauth'), 1800);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] relative overflow-hidden">

      {/* ── Ambient background glow ───────────────────────────────── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[500px] h-[300px] rounded-full blur-3xl pointer-events-none
          transition-opacity duration-700"
        style={{
          background: status === 'error'
            ? 'radial-gradient(ellipse, rgba(255,69,58,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(17,17,17,0.07) 0%, transparent 70%)',
          opacity: mounted ? 1 : 0,
        }}
      />

      {/* ── Dot grid ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]">
          <defs>
            <pattern id="cb-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--accent)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cb-grid)" />
        </svg>
      </div>

      {/* ── Main card ─────────────────────────────────────────────── */}
      <div
        className={`
          relative z-10 flex flex-col items-center gap-6 px-10 py-10
          rounded-2xl bg-[var(--surface)] border border-[var(--border)]
          shadow-[var(--shadow-soft)]
          transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {/* Google G icon */}
        <div className={`
          relative w-14 h-14 rounded-2xl flex items-center justify-center
          border border-[var(--border)] bg-[var(--surface-2)]
          transition-all duration-500 delay-75
          ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
        `}>
          {/* Pulse ring */}
          {status === 'loading' && (
            <span className="absolute inset-0 rounded-2xl ring-1 ring-[var(--accent)]
              animate-ping opacity-20 pointer-events-none" />
          )}

          <svg viewBox="0 0 24 24" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1f1f1f" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
            <path fill="#555555" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
            <path fill="#4a4a4a" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
            <path fill="#1a1a1a" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
        </div>

        {/* Spinner or error icon */}
        <div className={`
          transition-all duration-400 delay-100
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}>
          {status === 'loading' ? (
            <div className="relative">
              {/* Outer ring */}
              <div className="w-10 h-10 rounded-full border-2 border-[var(--border)]" />
              {/* Spinning arc */}
              <div className="absolute inset-0 w-10 h-10 rounded-full
                border-2 border-transparent border-t-[var(--accent)]
                animate-spin" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--danger)]/10
              border border-[var(--danger)]/25 flex items-center justify-center
              animate-fade-in">
              <svg className="w-5 h-5 text-[var(--danger)]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Text */}
        <div className={`
          text-center space-y-1.5
          transition-all duration-400 delay-150
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}>
          <p className={`font-display font-bold text-base tracking-tight
            transition-colors duration-300
            ${status === 'error' ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
            {status === 'error' ? 'Authentication failed' : 'Signing you in…'}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {status === 'error'
              ? 'Redirecting back to login…'
              : 'Verifying your Google account'}
          </p>
        </div>

        {/* Progress bar (loading only) */}
        {status === 'loading' && (
          <div className={`
            w-full max-w-[180px] h-0.5 rounded-pill bg-[var(--border)] overflow-hidden
            transition-all duration-400 delay-200
            ${mounted ? 'opacity-100' : 'opacity-0'}
          `}>
            <div
              className="h-full rounded-pill bg-gradient-to-r from-[var(--accent)] to-[#3d3d3d]"
              style={{ animation: 'shimmer 1.8s linear infinite', backgroundSize: '200% 100%' }}
            />
          </div>
        )}
      </div>

      {/* ── Avenor wordmark ───────────────────────────────────────── */}
      <div className={`
        absolute bottom-8 left-1/2 -translate-x-1/2
        text-[11px] font-bold text-[var(--text-muted)] tracking-widest uppercase
        transition-all duration-500 delay-300
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
        <BrandLogo size="xs" />
      </div>
    </div>
  );
};

export default OAuthCallbackPage;