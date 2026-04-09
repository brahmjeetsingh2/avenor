import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, FileText, BookOpen, BrainCircuit,
  ArrowRight, TrendingUp, Zap, Bell, Award, DollarSign,
  Bookmark, AlertTriangle, Clock3, RefreshCw, ClipboardList, PartyPopper,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import applicationService from '../../services/applicationService';
import companyService from '../../services/companyService';
import experienceService from '../../services/experienceService';
import notificationService from '../../services/notificationService';
import referralService from '../../services/referralService';
import authService from '../../services/authService';
import { StatusBadge } from '../../utils/applicationStatus';
import { CompanyLogo } from '../../components/shared/CompanyCard';
import Countdown from '../../components/shared/Countdown';
import Avatar from '../../components/ui/Avatar';

// ─── Quick stat card ──────────────────────────────────────────────────────────
const QuickStat = ({ icon: Icon, label, value, iconBg, iconColor, hoverBorder = 'var(--accent)', to }) => (
  <Link
    to={to}
    style={{
      position:       'relative',
      display:        'flex',
      alignItems:     'center',
      gap:            12,
      padding:        'clamp(12px, 3.6vw, 18px) clamp(12px, 4vw, 20px)',
      background:     'linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, #FFFFFF 6%) 0%, color-mix(in srgb, var(--surface-2) 92%, #FFFFFF 8%) 100%)',
      border:         '1px solid var(--border)',
      borderRadius:   'var(--radius-card)',
      boxShadow:      'var(--shadow-soft)',
      textDecoration: 'none',
      overflow:       'hidden',
      transition:     'transform 0.24s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.24s ease, border-color 0.24s ease, background 0.24s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform   = 'translateY(-4px)';
      e.currentTarget.style.boxShadow   = 'var(--shadow-hover)';
      e.currentTarget.style.borderColor = hoverBorder;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform   = 'translateY(0)';
      e.currentTarget.style.boxShadow   = 'var(--shadow-soft)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}
  >
    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: iconBg, opacity: 0.8 }} />
    {/* Icon */}
    <div style={{ width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: iconBg, border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 10px 20px -16px rgba(0,0,0,0.35)' }}>
      <Icon size={18} style={{ color: iconColor }} />
    </div>

    {/* Text */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 'clamp(20px, 4.6vw, 24px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</p>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.35 }}>{label}</p>
    </div>

    <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.8 }} />
  </Link>
);

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const DashboardSkeleton = () => (
  <div style={{ padding: 'clamp(16px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-card)' }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 92, borderRadius: 'var(--radius-card)' }} />
      ))}
    </div>
    <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-card)' }} />
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, to, linkLabel = 'View all' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
    <h2 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.11em' }}>{title}</h2>
    <Link
      to={to}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}
    >
      {linkLabel} <ArrowRight size={12} />
    </Link>
  </div>
);

const Panel = ({ title, children, action, subtitle, tone = 'var(--accent)' }) => (
  <div
    style={{
      background: themedSurface,
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-soft)',
      transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
      e.currentTarget.style.borderColor = 'var(--border-strong)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}
  >
    <div style={{ padding: 'clamp(10px, 3vw, 13px) clamp(12px, 3.8vw, 16px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 3 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone, boxShadow: `0 0 0 4px color-mix(in srgb, ${tone} 18%, transparent)` }} />
          <h2 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.11em' }}>{title}</h2>
        </div>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginLeft: 18 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
    <div style={{ padding: 'clamp(12px, 3.8vw, 16px)' }}>
      {children}
    </div>
  </div>
);

// ─── Greeting ─────────────────────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── Verdict pill (inline — for feed list) ────────────────────────────────────
const verdictStyle = {
  selected:   { background: 'var(--success-bg)', color: 'var(--success)' },
  rejected:   { background: 'var(--danger-bg)', color: 'var(--danger)' },
  waitlisted: { background: 'var(--warning-bg)',  color: 'var(--warning)' },
};

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedSurfaceAlt = 'linear-gradient(180deg, color-mix(in srgb, var(--surface-2) 92%, var(--text-primary) 8%) 0%, color-mix(in srgb, var(--surface-3) 90%, var(--text-primary) 10%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

// ─── Main component ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [apps,      setApps]      = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [feed,      setFeed]      = useState([]);
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [stats,     setStats]     = useState({ stats: [], total: 0 });
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      applicationService.getMyApps(null, { signal: controller.signal }),
      applicationService.getMyStats({ signal: controller.signal }),
      companyService.getAll({ limit: 20, active: 'true', sortBy: 'createdAt', order: 'desc' }, { signal: controller.signal }),
      experienceService.getFeed({ limit: 3 }, { signal: controller.signal }),
      notificationService.getAll({ limit: 8 }, { signal: controller.signal }),
      referralService.list({ limit: 8, sort: 'newest' }, { signal: controller.signal }),
      authService.getSavedCompanies({ signal: controller.signal }),
    ]).then(([appsRes, statsRes, compRes, feedRes, notifRes, referralRes, savedRes]) => {
      if (controller.signal.aborted) return;

      const appsData = appsRes.status === 'fulfilled' ? (appsRes.value.data?.data ?? appsRes.value.data) : null;
      const statsData = statsRes.status === 'fulfilled' ? (statsRes.value.data?.data ?? statsRes.value.data) : null;
      const companiesData = compRes.status === 'fulfilled'
        ? (Array.isArray(compRes.value?.data) ? compRes.value.data : (Array.isArray(compRes.value) ? compRes.value : []))
        : [];
      const feedData = feedRes.status === 'fulfilled' ? (feedRes.value.data ?? feedRes.value) : null;
      const notifData = notifRes.status === 'fulfilled' ? (notifRes.value.data ?? notifRes.value) : null;
      const referralData = referralRes.status === 'fulfilled' ? (referralRes.value.data ?? referralRes.value) : null;
      const savedData = savedRes.status === 'fulfilled' ? (savedRes.value.data ?? savedRes.value) : null;

      setApps((appsData?.applications ?? []).slice(0, 5));
      setStats({
        stats: statsData?.stats ?? [],
        total: statsData?.total ?? 0,
      });
      setCompanies(companiesData);
      setCompanyCount(compRes.status === 'fulfilled' ? (compRes.value?.pagination?.total ?? compRes.value?.total ?? companiesData.length) : companiesData.length);
      setFeed(feedData?.experiences ?? []);
      setNotifications(Array.isArray(notifData?.data) ? notifData.data : (Array.isArray(notifData?.notifications) ? notifData.notifications : []));
      setReferrals(Array.isArray(referralData?.data) ? referralData.data : (Array.isArray(referralData?.referrals) ? referralData.referrals : []));
      setSavedCompanies(Array.isArray(savedData?.companies) ? savedData.companies : []);
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const statMap = Object.fromEntries((stats.stats || []).map(s => [s._id, s.count]));
  const appliedCompanyIds = useMemo(() => new Set((apps || []).map((app) => String(app.company?._id || app.company))), [apps]);

  const savedCompanyIds = useMemo(() => {
    const ids = new Set((user?.savedCompanies || []).map(String));
    savedCompanies.forEach((company) => ids.add(String(company._id)));
    return ids;
  }, [savedCompanies, user?.savedCompanies]);

  const recommendedCompanies = useMemo(() => {
    const branch = user?.branch;
    const batch = user?.batch;
    return companies
      .filter((company) => !appliedCompanyIds.has(String(company._id)))
      .filter((company) => !savedCompanyIds.has(String(company._id)))
      .filter((company) => {
        const eligibleBranch = !branch || !Array.isArray(company.eligibility?.branches) || !company.eligibility.branches.length || company.eligibility.branches.includes(branch);
        const eligibleBatch = !batch || true;
        return eligibleBranch && eligibleBatch;
      })
      .slice(0, 3);
  }, [companies, appliedCompanyIds, savedCompanyIds, user?.branch, user?.batch]);

  const urgentAlerts = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const alerts = [];

    apps.forEach((app) => {
      const slotDate = app.interviewSlot?.date ? new Date(app.interviewSlot.date).getTime() : null;
      if (slotDate && slotDate - now <= dayMs && slotDate >= now) {
        alerts.push({
          key: `slot-${app._id}`,
          title: `${app.company?.name || 'Interview'} in the next 24 hours`,
          description: app.interviewSlot?.venue || app.interviewSlot?.time || 'Interview slot assigned',
          to: '/student/applications',
          tone: 'warning',
        });
      }
    });

    companies.forEach((company) => {
      if (company.applicationDeadline) {
        const deadline = new Date(company.applicationDeadline).getTime();
        if (deadline >= now && deadline - now <= dayMs && !appliedCompanyIds.has(String(company._id))) {
          alerts.push({
            key: `deadline-${company._id}`,
            title: `${company.name} deadline in 24 hours`,
            description: 'Apply before the cutoff',
            to: `/companies/${company._id}`,
            tone: 'danger',
          });
        }
      }
    });

    notifications.slice(0, 6).forEach((notif) => {
      if (['shortlist', 'status_update', 'interview_slot', 'offer'].includes(notif.type) && !notif.isRead) {
        alerts.push({
          key: `notif-${notif._id}`,
          title: notif.title,
          description: notif.message,
          to: '/student/notifications',
          tone: 'accent',
        });
      }
    });

    return alerts.slice(0, 5);
  }, [apps, companies, notifications, appliedCompanyIds]);

  const activityFeed = useMemo(() => {
    const items = [
      ...apps.slice(0, 3).map((app) => ({
        key: `app-${app._id}`,
        label: `${app.company?.name || 'Company'} · ${app.status.replace(/_/g, ' ')}`,
        detail: app.statusHistory?.[0]?.note || 'Application activity',
        time: app.updatedAt || app.createdAt,
        to: '/student/applications',
      })),
      ...notifications.slice(0, 3).map((notif) => ({
        key: `notif-${notif._id}`,
        label: notif.title,
        detail: notif.message,
        time: notif.createdAt,
        to: '/student/notifications',
      })),
      ...referrals.slice(0, 3).map((referral) => ({
        key: `ref-${referral._id}`,
        label: `${referral.company} · ${referral.role}`,
        detail: referral.lifecycleStatus?.replace('_', ' ') || referral.type,
        time: referral.createdAt,
        to: '/student/referrals',
      })),
    ];

    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
  }, [apps, notifications, referrals]);

  if (loading) return <DashboardSkeleton />;

  const heroSignals = [
    { label: 'Saved', value: savedCompanyIds.size, tone: 'var(--accent)' },
    { label: 'Alerts', value: urgentAlerts.length, tone: 'var(--warning)' },
    { label: 'To explore', value: recommendedCompanies.length, tone: 'var(--accent)' },
  ];

  const quickStats = [
    { icon: FileText,   label: 'Applications',    value: stats.total,              iconBg: themedWash, iconColor: 'var(--accent)', hoverBorder: 'var(--border-strong)', to: '/student/applications' },
    { icon: TrendingUp, label: 'Shortlisted',     value: statMap.shortlisted || 0, iconBg: themedWash, iconColor: 'var(--accent)', hoverBorder: 'var(--border-strong)', to: '/student/applications' },
    { icon: Zap,        label: 'Active Companies', value: companyCount,             iconBg: themedWash, iconColor: 'var(--accent)', hoverBorder: 'var(--border-strong)', to: '/student/companies' },
    { icon: BookOpen,   label: 'Experiences',     value: feed.length,               iconBg: themedWash, iconColor: 'var(--accent)', hoverBorder: 'var(--border-strong)', to: '/student/experiences' },
  ];

  return (
    <div className="page-enter" style={{ padding: 'clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 4vw, 20px)' }}>

      {/* ── Welcome banner ─────────────────────────────────────────── */}
      <div
        className="hero-shell hero-shell--student"
        style={{
          borderRadius: 'var(--radius-card)',
          padding:      'clamp(14px, 4vw, 20px) clamp(14px, 4.4vw, 22px)',
          display:      'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap:          16,
          alignItems:   'stretch',
          borderLeft:   '3px solid var(--accent)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <Avatar name={user?.name} size="lg" src={user?.profilePic} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{greeting()}</p>
              <h1 style={{ fontSize: 'clamp(21px,3vw,30px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                {user?.name?.split(' ')[0]}
              </h1>
              {user?.branch && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {user.branch} · Batch {user.batch}
                </p>
              )}
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 700 }}>
            Keep track of applications, deadlines, referrals, and prep in one clean view built for day-to-day placement work.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(17,17,17,0.08)', color: 'var(--accent)', fontSize: 11, fontWeight: 800 }}>
              <Clock3 size={11} /> Focused for students
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(38,38,38,0.09)', color: 'var(--warning)', fontSize: 11, fontWeight: 800 }}>
              <AlertTriangle size={11} /> Deadlines and alerts in view
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <Link
            to="/student/ai-prep"
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              gap:            12,
              padding:        '14px 16px',
              background:     themedSurfaceAlt,
              color:          'var(--text-primary)',
              fontWeight:     700,
              fontSize:       13,
              borderRadius:   'var(--radius-card)',
              textDecoration: 'none',
              boxShadow:      'var(--shadow-soft)',
              border:         '1px solid var(--border)',
              transition:     'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: themedWash, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BrainCircuit size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>AI Interview Prep</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Mock interviews and targeted prep</p>
              </div>
            </div>
            <ArrowRight size={15} style={{ color: 'var(--accent)' }} />
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 8 }}>
            {heroSignals.map((signal) => (
              <div key={signal.label} style={{ padding: '12px 10px', borderRadius: 14, background: themedWash, border: '1px solid var(--border)', backdropFilter: 'blur(10px)', boxShadow: 'var(--shadow-soft)' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>{signal.value}</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: signal.tone }}>{signal.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
        {quickStats.map(s => <QuickStat key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 12 }}>
        {recommendedCompanies.length > 0 && (
          <Panel title="Recommended Companies" subtitle="Companies that still look worth your time" tone="var(--accent)" action={<Link to="/student/companies" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Explore</Link>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recommendedCompanies.map((company) => (
                <Link key={company._id} to={`/companies/${company._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', padding: '10px 12px', borderRadius: '12px', transition: 'background 0.18s ease, transform 0.18s ease' }} onMouseEnter={e => { e.currentTarget.style.background = themedWash; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <CompanyLogo logo={company.logo} name={company.name} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{company.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{company.sector}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Urgent Alerts" subtitle="Deadlines and updates that need attention" tone="var(--danger)" action={<Link to="/student/notifications" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Open notifications</Link>}>
          {urgentAlerts.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No urgent alerts right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {urgentAlerts.map((alert) => (
                <Link key={alert.key} to={alert.to} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ border: alert.tone === 'danger' ? '1px solid var(--danger-border)' : '1px solid var(--border)', borderRadius: 'var(--radius-input)', padding: '10px 12px', background: alert.tone === 'danger' ? 'var(--danger-bg)' : themedWash, boxShadow: 'var(--shadow-soft)' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.35 }}>{alert.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.45 }}>{alert.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Saved Companies" subtitle="Quick access to companies you want to revisit" tone="var(--accent)" action={<Link to="/student/companies" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Manage</Link>}>
          {savedCompanies.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Save companies you want to revisit later.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {savedCompanies.slice(0, 4).map((company) => (
                <Link key={company._id} to={`/companies/${company._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', padding: '10px 12px', borderRadius: '12px', transition: 'background 0.18s ease, transform 0.18s ease' }} onMouseEnter={e => { e.currentTarget.style.background = themedWash; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <CompanyLogo logo={company.logo} name={company.name} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{company.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{company.applicationDeadline ? `Deadline ${new Date(company.applicationDeadline).toLocaleDateString('en-IN')}` : 'No deadline set'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <Panel title="Activity Feed" subtitle="A short pulse of what changed recently" tone="var(--accent)" action={<Link to="/student/notifications" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>All activity</Link>}>
          {activityFeed.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your recent activity will appear here.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activityFeed.map((item) => (
                <Link key={item.key} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 12, background: themedSurfaceAlt, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-soft)' }}>
                      <ClipboardList size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>{item.label}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{item.detail}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.time ? formatDistanceToNow(new Date(item.time), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Resume Your Work" subtitle="Fast links to the places students usually return to" tone="var(--accent)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/student/ai-prep" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: themedWash, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <BrainCircuit size={14} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Continue AI prep</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Pick up your next mock interview</p>
              </div>
            </Link>
            <Link to="/student/referrals" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: themedWash, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <Award size={14} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Review referrals</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{referrals.length} recent referral{referrals.length === 1 ? '' : 's'}</p>
              </div>
            </Link>
            <Link to="/student/offers" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: themedWash, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                <TrendingUp size={14} style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Compare offers</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Keep your offer decisions moving</p>
              </div>
            </Link>
          </div>
        </Panel>
      </div>

      {/* ── Main content grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        style={{ gap: 20, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* My Applications */}
          <div>
            <SectionHeader title="My Applications" to="/student/applications" />
            {apps.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '36px 24px', textAlign: 'center', boxShadow: 'var(--shadow-soft)' }}>
                <FileText size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No applications yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Browse companies and start applying</p>
                <Link
                  to="/student/companies"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--accent)', color: 'var(--text-reverse)', fontWeight: 700, fontSize: 13, borderRadius: 'var(--radius-input)', textDecoration: 'none' }}
                >
                  Browse Companies <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
                {apps.map((app, idx) => (
                  <div
                    key={app._id}
                    onClick={() => navigate('/student/applications')}
                    style={{
                      display:       'flex',
                      alignItems:    'center',
                      gap:           12,
                      padding:       '12px 16px',
                      borderBottom:  idx < apps.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor:        'pointer',
                      transition:    'background 0.18s ease, transform 0.18s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = themedWash; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <CompanyLogo logo={app.company?.logo} name={app.company?.name} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.company?.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.company?.roles?.slice(0, 2).join(', ') || app.company?.sector}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <StatusBadge status={app.status} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Companies */}
          <div>
            <SectionHeader title="New Companies" to="/student/companies" />
            {companies.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No companies added yet by your coordinator.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
                {companies.map(c => (
                  <Link
                    key={c._id}
                    to={`/companies/${c._id}`}
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            12,
                      padding:        '14px 16px',
                      background:     'var(--surface)',
                      border:         '1px solid var(--border)',
                      borderRadius:   'var(--radius-card)',
                      textDecoration: 'none',
                      boxShadow:      'var(--shadow-soft)',
                      transition:     'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = 'var(--shadow-soft)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <CompanyLogo logo={c.logo} name={c.name} size="sm" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.sector}</span>
                        {c.applicationDeadline && <Countdown deadline={c.applicationDeadline} />}
                      </div>
                    </div>
                    <ArrowRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Recent experiences */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Experiences</h2>
              <Link to="/student/experiences" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                See all
              </Link>
            </div>

            {feed.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No experiences posted yet
              </div>
            ) : feed.map((exp, idx) => {
              const vs = verdictStyle[exp.verdict] || verdictStyle.waitlisted;
              return (
                <Link
                  key={exp._id}
                  to={`/experiences/${exp._id}`}
                  style={{
                    display:        'flex',
                    alignItems:     'flex-start',
                    gap:            10,
                    padding:        '11px 16px',
                    borderBottom:   idx < feed.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    transition:     'background 0.18s ease, transform 0.18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = themedWash; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <CompanyLogo logo={exp.company?.logo} name={exp.company?.name} size="sm" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.company?.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.role}</p>
                    <span style={{ display: 'inline-flex', marginTop: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: vs.background, color: vs.color, textTransform: 'capitalize' }}>
                      {exp.verdict}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
