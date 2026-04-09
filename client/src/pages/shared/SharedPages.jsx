import React, { useEffect, useState } from 'react';
import { Building2, Search, User, Settings, ArrowLeft, Home } from 'lucide-react';

/* ─── Animated background grid dots ─────────────────────────────────── */
const GridDots = ({ color = 'var(--accent)' }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

/* ─── Glow orb behind icon ───────────────────────────────────────────── */
const GlowOrb = ({ color }) => (
  <div
    className="absolute -inset-6 rounded-full blur-2xl opacity-20 pointer-events-none"
    style={{ background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)` }}
  />
);

/* ─── Coming-soon tag ────────────────────────────────────────────────── */
const ComingSoonTag = ({ part }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-pill
    bg-[var(--surface)] border border-[var(--border)]
    text-sm text-[var(--text-muted)] font-medium
    shadow-[var(--shadow-soft)]"
  >
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--warning)] opacity-60" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--warning)]" />
    </span>
    Coming in&nbsp;
    <span className="font-bold text-[var(--accent)]">{part}</span>
  </div>
);

/* ─── Progress bar ───────────────────────────────────────────────────── */
const ProgressBar = ({ pct = 40, color = 'var(--accent)' }) => (
  <div className="w-full max-w-xs">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        Build Progress
      </span>
      <span className="text-[11px] font-bold text-[var(--text-secondary)]">{pct}%</span>
    </div>
    <div className="h-1 rounded-pill bg-[var(--border)] overflow-hidden">
      <div
        className="h-full rounded-pill transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  </div>
);

/* ─── Core PlaceholderPage ───────────────────────────────────────────── */
const PlaceholderPage = ({
  icon: Icon,
  title,
  description,
  part,
  accentColor = 'var(--accent)',
  progress = 35,
  features = [],
}) => {
  const [mounted, setMounted] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 40);
    const t2 = setTimeout(() => setBarWidth(progress), 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [progress]);

  return (
    <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 lg:p-10 page-enter overflow-hidden">
      <GridDots color={accentColor} />

      {/* Ambient glow top-right */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${accentColor} 0%, transparent 70%)` }}
      />

      <div className="relative z-10 max-w-2xl">

        {/* ── Icon block ─────────────────────────────────────────────── */}
        <div
          className={`
            relative w-16 h-16 rounded-2xl flex items-center justify-center mb-8
            border border-[var(--border)]
            transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'}
          `}
          style={{
            background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}08 100%)`,
            boxShadow: `0 0 32px ${accentColor}22`,
          }}
        >
          <GlowOrb color={accentColor} />
          <Icon size={28} style={{ color: accentColor }} className="relative z-10" />
        </div>

        {/* ── Heading ────────────────────────────────────────────────── */}
        <div
          className={`
            transition-all duration-500 delay-75 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <h1 className="font-display text-h1 font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            {title}
          </h1>
          <p className="text-body-lg text-[var(--text-secondary)] leading-relaxed mb-6 max-w-lg">
            {description}
          </p>
        </div>

        {/* ── Feature list (optional) ─────────────────────────────────── */}
        {features.length > 0 && (
          <div
            className={`
              grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8
              transition-all duration-500 delay-150 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {features.map((feat, i) => (
              <div
                key={feat}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl
                  bg-[var(--surface)] border border-[var(--border)]
                  text-sm text-[var(--text-secondary)] font-medium"
                style={{
                  transitionDelay: `${150 + i * 40}ms`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: accentColor }}
                />
                {feat}
              </div>
            ))}
          </div>
        )}

        {/* ── Bottom row: tag + progress ──────────────────────────────── */}
        <div
          className={`
            flex flex-col sm:flex-row items-start sm:items-center gap-5
            transition-all duration-500 delay-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <ComingSoonTag part={part} />
          <ProgressBar pct={barWidth} color={accentColor} />
        </div>
      </div>
    </div>
  );
};

/* ─── Individual exported pages ──────────────────────────────────────── */

export const CompaniesPage = () => (
  <PlaceholderPage
    icon={Building2}
    title="Companies"
    description="All companies visiting your college. Filter by stage, sector, CTC, and deadline. Live countdown timers and detailed drive timelines."
    part="Part 3"
    accentColor="var(--accent)"
    progress={42}
    features={[
      'Filter by stage & sector',
      'CTC range slider',
      'Live countdown timers',
      'Eligibility checker',
      'Drive timeline view',
      'One-click apply',
    ]}
  />
);

export const SearchPage = () => (
  <PlaceholderPage
    icon={Search}
    title="Global Search"
    description="Full-text search across all experiences, companies, and roles. Cmd+K shortcut with live suggestions and smart filters."
    part="Part 10"
    accentColor="#555555"
    progress={18}
    features={[
      'Cmd+K anywhere',
      'Live suggestions',
      'Experience search',
      'Role & company lookup',
      'Smart ranking',
      'Recent history',
    ]}
  />
);

export const ProfilePage = () => (
  <PlaceholderPage
    icon={User}
    title="My Profile"
    description="Manage your profile, college info, branch, batch, and notification preferences. Upload resume and showcase your placed status."
    part="Part 2"
    accentColor="var(--status-success)"
    progress={55}
    features={[
      'Branch & batch info',
      'Resume upload',
      'Placed status badge',
      'Notification prefs',
      'Profile visibility',
      'Avatar upload',
    ]}
  />
);

export const SettingsPage = () => (
  <PlaceholderPage
    icon={Settings}
    title="Settings"
    description="Account settings, notification preferences, privacy controls, and theme customisation. Full control over your Avenor experience."
    part="Part 2"
    accentColor="var(--warning)"
    progress={48}
    features={[
      'Dark / light theme',
      'Email notifications',
      'Privacy controls',
      'Account security',
      'Data export',
      'Delete account',
    ]}
  />
);

/* ─── 404 Page ───────────────────────────────────────────────────────── */
export const NotFoundPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-72px)] flex items-center justify-center p-6 overflow-hidden">
      <GridDots color="var(--accent)" />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
        rounded-full blur-3xl opacity-[0.06] pointer-events-none
        bg-[radial-gradient(ellipse,var(--accent)_0%,transparent_70%)]" />

      <div
        className={`
          relative z-10 text-center max-w-md
          transition-all duration-600 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}
      >
        {/* Giant 404 */}
        <div
          className={`
            font-display font-bold mb-2 leading-none select-none
            transition-all duration-700 delay-[40ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
          style={{
            fontSize: 'clamp(96px, 20vw, 160px)',
            background: 'linear-gradient(135deg, var(--accent) 0%, #3d3d3d 50%, var(--accent) 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 4s linear infinite',
          }}
        >
          404
        </div>

        {/* Divider line */}
        <div
          className={`
            mx-auto mb-6 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent
            transition-all duration-500 delay-100
            ${mounted ? 'opacity-100 w-48' : 'opacity-0 w-0'}
          `}
        />

        <div
          className={`
            transition-all duration-500 delay-150 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
          `}
        >
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            Page not found
          </h1>
          <p className="text-[var(--text-secondary)] text-body mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* CTAs */}
        <div
          className={`
            flex flex-col sm:flex-row items-center justify-center gap-3
            transition-all duration-500 delay-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
          `}
        >
          <a
            href="/"
            className="btn-primary gap-2 px-6 h-11 rounded-input group relative overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              -translate-x-full group-hover:translate-x-full
              transition-all duration-700 pointer-events-none" />
            <Home size={16} className="relative z-10" />
            <span className="relative z-10 font-semibold">Back to Home</span>
          </a>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary gap-2 px-6 h-11 rounded-input"
          >
            <ArrowLeft size={16} />
            <span className="font-semibold">Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};