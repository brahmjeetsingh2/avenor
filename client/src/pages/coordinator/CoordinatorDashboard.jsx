import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, Building2, IndianRupee, TrendingUp, Download,
  Award, Activity, ArrowUpRight, ChevronUp, ChevronDown,
  LayoutDashboard, RefreshCw, Bell, Plus, ClipboardList, BarChart3, Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import dashboardService from '../../services/dashboardService';
import { CompanyLogo } from '../../components/shared/CompanyCard';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';

/* ─── Chart palette ──────────────────────────────────────────────────── */
const LIGHT_CHART = {
  primary:  '#1f1f1f',
  accent:   '#555555',
  success:  '#2a2a2a',
  danger:   '#1a1a1a',
  warning:  '#4a4a4a',
  muted:    '#6A6860',
};

const DARK_CHART = {
  primary:  '#F5F5F5',
  accent:   '#D0D0D0',
  success:  '#B8B8B8',
  danger:   '#A7A7A7',
  warning:  '#E2E2E2',
  muted:    '#8A8A8A',
};

const LIGHT_PIE_PALETTE = [
  '#1f1f1f','#3d3d3d','#4a4a4a','#2a2a2a',
  '#1a1a1a','#555555','#6b6b6b','#F9F9F9',
];

const DARK_PIE_PALETTE = [
  '#F5F5F5','#D0D0D0','#B8B8B8','#A7A7A7',
  '#8A8A8A','#707070','#555555','#3d3d3d',
];

const YEARS = ['2025', '2024', '2023', '2022'];

/* ─── Custom chart tooltip ───────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3.5 py-3 text-xs shadow-[var(--shadow-hover)] min-w-[130px]">
      <p className="font-bold text-[var(--text-primary)] mb-2 text-sm">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-[var(--text-primary)]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI card ───────────────────────────────────────────────────────── */
const KPI = ({ icon: Icon, label, value, sub, iconBg, iconColor, trend, index = 0 }) => (
  <div
    className="card p-5 flex flex-col gap-4 group animate-slide-up hover:scale-[1.01]
      transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        ${iconBg} border border-current/10 ${iconColor}`}>
        <Icon size={17} />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5
          rounded-pill border
          ${trend >= 0
            ? 'text-[var(--status-success)] bg-[var(--status-success)]/12 border-[var(--status-success)]/20'
            : 'text-[var(--danger)]  bg-[var(--danger)]/12  border-[var(--danger)]/20'
          }`}>
          {trend >= 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="font-display text-2xl font-bold text-[var(--text-primary)] leading-none mb-1.5">
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </p>
      {sub && (
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{sub}</p>
      )}
    </div>
  </div>
);

/* ─── Chart section wrapper ──────────────────────────────────────────── */
const ChartCard = ({ title, subtitle, icon: Icon, iconColor, children, delay = 0, className = '' }) => (
  <div
    className={`card min-w-0 p-5 overflow-hidden animate-slide-up ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className={`w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]
            flex items-center justify-center`}>
            <Icon size={13} className={iconColor || 'text-[var(--text-muted)]'} />
          </span>
        )}
        <div>
          <h2 className="font-display font-bold text-[var(--text-primary)] text-sm">{title}</h2>
          {subtitle && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
    {children}
  </div>
);

const QuickAction = ({ to, icon: Icon, label, desc, color }) => (
  <Link
    to={to}
    className="card mx-auto w-full max-w-md sm:max-w-none p-3.5 sm:p-4 flex items-start sm:items-center gap-3 hover:border-[var(--accent)]/30 transition-all duration-200 group"
  >
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={16} className="sm:w-[17px] sm:h-[17px]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200 leading-tight">
        {label}
      </p>
      <p className="text-xs text-[var(--text-muted)] leading-snug line-clamp-2 sm:truncate">
        {desc}
      </p>
    </div>
    <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-200 shrink-0 mt-0.5 sm:mt-0" />
  </Link>
);

/* ─── Sortable funnel table ──────────────────────────────────────────── */
const FunnelTable = ({ data }) => {
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');

  const toggle = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...data].sort((a, b) => {
    const v = (a[sortKey] || 0) - (b[sortKey] || 0);
    return sortDir === 'asc' ? v : -v;
  });

  const SortBtn = ({ k, label }) => (
    <button
      onClick={() => toggle(k)}
      className={`flex items-center justify-end gap-1 transition-colors duration-150
        ${sortKey === k ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
    >
      {label}
      {sortKey === k
        ? sortDir === 'asc'
          ? <ChevronUp size={11} />
          : <ChevronDown size={11} />
        : <span className="w-3" />
      }
    </button>
  );

  const COLS = [
    { key: 'total',       label: 'Total',       color: 'text-[var(--text-primary)]' },
    { key: 'applied',     label: 'Applied',     color: 'text-[var(--text-secondary)]' },
    { key: 'shortlisted', label: 'Shortlisted', color: 'text-[var(--text-secondary)]' },
    { key: 'test',        label: 'Test/GD',     color: 'text-[var(--text-secondary)]' },
    { key: 'offer',       label: 'Offers',      color: 'text-[var(--status-success)]' },
    { key: 'rejected',    label: 'Rejected',    color: 'text-[var(--danger)]' },
  ];

  return (
    <div className="card overflow-hidden p-0 animate-slide-up" style={{ animationDelay: '160ms' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]
            flex items-center justify-center">
            <Building2 size={13} className="text-[var(--text-muted)]" />
          </span>
          <h2 className="font-display font-bold text-[var(--text-primary)] text-sm">
            Company-wise Funnel
          </h2>
        </div>
        <span className="badge badge-muted text-[10px]">{data.length} companies</span>
      </div>

      <div className="overflow-x-auto">
        <table className="ht-table min-w-[760px]">
          <thead>
            <tr>
              <th className="w-48">Company</th>
              {COLS.map(c => (
                <th key={c.key} className="text-right">
                  <SortBtn k={c.key} label={c.label} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row._id}
                className="animate-fade-in group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td>
                  <div className="flex items-center gap-2.5">
                    <CompanyLogo logo={row.logo} name={row.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate
                        group-hover:text-[var(--accent)] transition-colors duration-200">
                        {row.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{row.sector}</p>
                    </div>
                  </div>
                </td>
                {/* Total */}
                <td className="text-right text-sm font-bold text-[var(--text-primary)]">
                  {row.total || 0}
                </td>
                {/* Applied */}
                <td className="text-right text-sm font-medium text-[var(--text-secondary)]">
                  {row.applied || 0}
                </td>
                {/* Shortlisted */}
                <td className="text-right text-sm font-medium text-[var(--text-secondary)]">
                  {row.shortlisted || 0}
                </td>
                {/* Test */}
                <td className="text-right text-sm font-medium text-[var(--text-secondary)]">
                  {row.test || 0}
                </td>
                {/* Offer */}
                <td className="text-right">
                  <span className={`text-sm font-bold ${
                    row.offer > 0 ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'
                  }`}>
                    {row.offer || 0}
                  </span>
                </td>
                {/* Rejected */}
                <td className="text-right text-sm font-medium text-[var(--danger)]">
                  {row.rejected || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── Status color map for activity ─────────────────────────────────── */
const ACTIVITY_STATUS = {
  applied:      'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]',
  shortlisted:  'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]',
  test:         'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]',
  interview_r1: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]',
  interview_r2: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]',
  interview_r3: 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]',
  offer:        'bg-[var(--success-bg)] text-[var(--status-success)] border border-[var(--success-border)]',
  rejected:     'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]',
};

/* ─── Activity feed ──────────────────────────────────────────────────── */
const ActivityFeed = ({ items }) => (
  <div className="card min-w-0 p-0 overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
    <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2.5">
      <span className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]
        flex items-center justify-center">
        <Activity size={13} className="text-[var(--accent)]" />
      </span>
      <h2 className="font-display font-bold text-[var(--text-primary)] text-sm">Recent Activity</h2>
    </div>

    <div className="divide-y divide-[var(--border)]">
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
          No activity yet
        </div>
      ) : items.map((a, i) => (
        <div
          key={a._id}
          style={{ animationDelay: `${i * 35}ms` }}
          className="flex items-center gap-3 px-5 py-3.5
            hover:bg-[var(--surface-2)]/60 transition-colors duration-150
            group animate-fade-in"
        >
          <Avatar name={a.student?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate
              group-hover:text-[var(--accent)] transition-colors duration-200">
              {a.student?.name}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {a.company?.name}
              {a.student?.branch && <> · {a.student.branch}</>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize
              ${ACTIVITY_STATUS[a.status] || 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
              {a.status.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {formatDistanceToNow(new Date(a.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Loading skeleton ───────────────────────────────────────────────── */
const DashboardSkeleton = () => (
  <div className="p-4 md:p-6 space-y-6">
    {/* KPI row */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3"
          style={{ animationDelay: `${i * 50}ms` }}>
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton h-7 w-2/3 rounded-pill" />
          <div className="skeleton h-2.5 w-1/2 rounded-pill" />
        </div>
      ))}
    </div>
    {/* Charts */}
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card p-5 h-72 skeleton" />
      <div className="card p-5 h-72 skeleton" />
    </div>
    <div className="card p-5 h-52 skeleton" />
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card p-5 h-64 skeleton" />
      <div className="card p-5 h-64 skeleton" />
    </div>
  </div>
);

/* ─── Main dashboard ─────────────────────────────────────────────────── */
const CoordinatorDashboard = () => {
  const [stats,     setStats]     = useState(null);
  const [funnel,    setFunnel]    = useState([]);
  const [branches,  setBranches]  = useState([]);
  const [timeline,  setTimeline]  = useState([]);
  const [activity,  setActivity]  = useState([]);
  const [operations, setOperations] = useState(null);
  const [year,      setYear]      = useState(String(new Date().getFullYear()));
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });
  const requestRef = useRef(null);
  const safeFunnel = Array.isArray(funnel) ? funnel : [];
  const safeBranches = Array.isArray(branches) ? branches : [];
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const safeActivity = Array.isArray(activity) ? activity : [];
  const safeOperations = operations && typeof operations === 'object' ? operations : null;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const chartSeries = isDark ? DARK_CHART : LIGHT_CHART;
  const piePalette = isDark ? DARK_PIE_PALETTE : LIGHT_PIE_PALETTE;

  const fetchAll = useCallback(async () => {
    if (requestRef.current) requestRef.current.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    try {
      const [s, f, b, t, a, o] = await Promise.allSettled([
        dashboardService.getStats({ year }, { signal: controller.signal }),
        dashboardService.getFunnel({ signal: controller.signal }),
        dashboardService.getBranches({ signal: controller.signal }),
        dashboardService.getTimeline({ year }, { signal: controller.signal }),
        dashboardService.getActivity({ signal: controller.signal }),
        dashboardService.getOperations({ signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      if (s.status === 'fulfilled') setStats(s.value);
      if (f.status === 'fulfilled') setFunnel(Array.isArray(f.value?.funnel) ? f.value.funnel : []);
      if (b.status === 'fulfilled') setBranches(Array.isArray(b.value?.branches) ? b.value.branches : []);
      if (t.status === 'fulfilled') setTimeline(Array.isArray(t.value?.timeline) ? t.value.timeline : []);
      if (a.status === 'fulfilled') setActivity(Array.isArray(a.value?.activity) ? a.value.activity : []);
      if (o.status === 'fulfilled') setOperations(o.value && typeof o.value === 'object' ? o.value : null);

      const hardFailure = [s, f, b, t, a].some((result) => result.status === 'rejected');
      if (hardFailure) {
        toast.error('Some dashboard data could not be loaded');
      }
      if (o.status === 'rejected') {
        toast.error('Operations snapshot unavailable');
      }
    } catch {
      if (controller.signal.aborted) return;
      toast.error('Failed to load dashboard data');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [year]);

  useEffect(() => {
    fetchAll();
    return () => {
      if (requestRef.current) requestRef.current.abort();
    };
  }, [fetchAll]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await dashboardService.exportCSV();
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const timelineData = safeTimeline.filter(t =>
    t.applied || t.shortlisted || t.offers || t.rejected
  );

  return (
    <div className="min-h-[calc(100vh-72px)] p-4 md:p-6 lg:p-8 page-enter space-y-6 bg-[var(--bg)] max-w-[1360px] mx-auto overflow-x-hidden">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className={`
        hero-shell hero-shell--coordinator px-5 py-4
        flex items-start justify-between flex-wrap gap-4
        transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/20
              flex items-center justify-center">
              <LayoutDashboard size={15} className="text-[var(--accent)]" />
            </div>
            <h1 className="font-display text-h2 font-bold text-[var(--text-primary)] tracking-tight">
              Placement Dashboard
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] ml-0 sm:ml-10.5">
            Real-time analytics for your placement season
          </p>
        </div>

        <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Year picker */}
          <div className="relative w-full sm:w-auto">
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="input text-sm appearance-none pr-8 w-full sm:w-auto sm:min-w-[100px]"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2
              text-[var(--text-muted)] pointer-events-none" />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchAll}
            className="btn-ghost h-11 px-3.5 rounded-input text-sm font-semibold gap-2
              flex items-center justify-center w-full sm:w-auto"
          >
            <RefreshCw size={14} />
            <span className="sm:hidden">Refresh</span>
          </button>

          {/* Export */}
          <Button
            variant="secondary" size="sm"
            leftIcon={<Download size={13} />}
            onClick={handleExport}
            loading={exporting}
            className="btn-secondary h-11 px-4 rounded-input font-semibold w-full sm:w-auto"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {safeOperations && (
        <div className="grid xl:grid-cols-3 gap-5">
          <div className="card min-w-0 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-[var(--warning)]" />
              <h2 className="font-display font-bold text-sm text-[var(--text-primary)]">Companies Needing Attention</h2>
            </div>
            {Array.isArray(safeOperations.widgets?.companiesNeedingAttention) && safeOperations.widgets.companiesNeedingAttention.length ? (
              safeOperations.widgets.companiesNeedingAttention.slice(0, 5).map((c) => (
                <Link key={c._id} to={`/coordinator/companies/${c._id}/edit`} className="block rounded-xl border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]/30">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {c.applicationDeadline ? `Deadline: ${new Date(c.applicationDeadline).toLocaleDateString('en-IN')}` : 'Missing deadline'}
                    {c.missingDocuments ? ' • Missing documents' : ''}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No urgent company actions.</p>
            )}
          </div>

          <div className="card min-w-0 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-[var(--accent)]" />
              <h2 className="font-display font-bold text-sm text-[var(--text-primary)]">Deadlines This Week</h2>
            </div>
            {Array.isArray(safeOperations.widgets?.deadlinesThisWeek) && safeOperations.widgets.deadlinesThisWeek.length ? (
              safeOperations.widgets.deadlinesThisWeek.slice(0, 6).map((d) => (
                <Link key={d._id} to={`/companies/${d._id}`} className="block rounded-xl border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]/30">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{d.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(d.deadline).toLocaleDateString('en-IN')} • {d.stage}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No upcoming deadlines in next 7 days.</p>
            )}
            <p className="text-xs text-[var(--text-secondary)]">
              Shortlisted students awaiting slots: <strong>{safeOperations.widgets?.shortlistedAwaitingSlots || 0}</strong>
            </p>
          </div>

          <div className="card min-w-0 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[var(--accent)]" />
              <h2 className="font-display font-bold text-sm text-[var(--text-primary)]">Coordinator Profile Layer</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Managed College: <strong>{safeOperations.coordinatorProfile?.managedCollege || 'Not set'}</strong>
            </p>
            <p className="text-xs text-[var(--text-muted)]">Branches: {(Array.isArray(safeOperations.coordinatorProfile?.managedBranches) ? safeOperations.coordinatorProfile.managedBranches : []).join(', ') || 'All'}</p>
            <p className="text-xs text-[var(--text-muted)]">Batches: {(Array.isArray(safeOperations.coordinatorProfile?.managedBatches) ? safeOperations.coordinatorProfile.managedBatches : []).join(', ') || 'All'}</p>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(safeOperations.coordinatorProfile?.capabilities) ? safeOperations.coordinatorProfile.capabilities : []).map((cap) => (
                <span key={cap} className="chip text-[10px]">{cap.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {Array.isArray(safeOperations?.operationalAlerts) && safeOperations.operationalAlerts.length > 0 && (
        <div className="card p-5 space-y-2">
          <h2 className="font-display font-bold text-sm text-[var(--text-primary)]">Operational Alerts</h2>
          <div className="space-y-2">
            {safeOperations.operationalAlerts.slice(0, 8).map((a, idx) => (
              <div key={`${a.type}-${a.companyId || idx}`} className="rounded-xl border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-3 py-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{a.companyName || 'Placement Alert'}</p>
                <p className="text-xs text-[var(--text-secondary)]">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI row ──────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KPI index={0}
            icon={Users}       label="Total Students"
            iconBg="bg-[var(--accent)]/10"    iconColor="text-[var(--accent)]"
            value={stats.totalStudents}
          />
          <KPI index={1}
            icon={Award}       label="Placed"
            iconBg="bg-[var(--success-bg)]"   iconColor="text-[var(--status-success)]"
            value={`${stats.placedPct}%`}
            sub={`${stats.placed} students`}
          />
          <KPI index={2}
            icon={IndianRupee} label="Avg CTC"
            iconBg="bg-[var(--surface-2)]" iconColor="text-[var(--accent)]"
            value={`₹${Number(stats.avgCTC).toFixed(1)}L`}
            sub={`Max ₹${stats.maxCTC}L`}
          />
          <KPI index={3}
            icon={Building2}   label="Companies"
            iconBg="bg-[var(--warning)]/10"   iconColor="text-[var(--warning)]"
            value={stats.totalCompanies}
          />
          <KPI index={4}
            icon={TrendingUp}  label="Total Offers"
            iconBg="bg-[var(--success-bg)]"   iconColor="text-[var(--status-success)]"
            value={stats.offerCount}
            sub={`${stats.appCount} applications`}
          />
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
        <QuickAction
          to="/coordinator/companies/new"
          icon={Plus}
          label="Add Company"
          desc="Create and publish a new campus opportunity"
          color="bg-[var(--accent)]/10 text-[var(--accent)]"
        />
        <QuickAction
          to="/coordinator/shortlists"
          icon={ClipboardList}
          label="Manage Shortlists"
          desc="Review applicants and bulk update statuses"
          color="bg-[var(--surface-2)] text-[var(--accent)]"
        />
        <QuickAction
          to="/coordinator/announcements"
          icon={Bell}
          label="Send Announcement"
          desc="Notify students by branch, batch, or all"
          color="bg-[var(--warning)]/10 text-[var(--warning)]"
        />
        <QuickAction
          to="/coordinator/analytics"
          icon={BarChart3}
          label="Open Analytics"
          desc="Dive deeper into branch and funnel trends"
          color="bg-[var(--surface-2)] text-[var(--accent)]"
        />
      </div>

      {/* ── Line chart + Pie chart ────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Monthly timeline */}
        <ChartCard
          title={`Monthly Activity — ${year}`}
          subtitle="Application funnel over time"
          icon={TrendingUp}
          iconColor="text-[var(--accent)]"
          delay={80}
          className="lg:col-span-2"
        >
          <div className="lg:col-span-2">
            {timelineData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-[var(--text-muted)]">
                No activity data for {year}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart
                  data={safeTimeline}
                  margin={{ top: 4, right: isMobile ? 0 : 8, left: isMobile ? 0 : -24, bottom: 0 }}
                >
                  <XAxis dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}
                    axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  {!isMobile && <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 12 }} />}
                  <Line type="monotone" dataKey="applied"     name="Applied"
                    stroke={chartSeries.primary}  strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="shortlisted" name="Shortlisted"
                    stroke={chartSeries.accent}   strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="offers"      name="Offers"
                    stroke={chartSeries.success}  strokeWidth={2.5}
                    dot={{ r: 4, fill: chartSeries.success, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="rejected"    name="Rejected"
                    stroke={chartSeries.danger}   strokeWidth={1.5}
                    dot={false} strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* Branch pie */}
        <ChartCard
          title="Branch-wise Placement"
          subtitle="Percentage of placed students"
          icon={Award}
          iconColor="text-[var(--warning)]"
          delay={120}
        >
          {safeBranches.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-[var(--text-muted)]">
              No branch data yet
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={branches}
                    dataKey="placed"
                    nameKey="branch"
                    cx="50%" cy="50%"
                    innerRadius={42} outerRadius={68}
                    paddingAngle={3}
                  >
                    {safeBranches.map((_, i) => (
                      <Cell key={i} fill={piePalette[i % piePalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, props) => [
                      `${props.payload.placed}/${props.payload.total} (${props.payload.pct}%)`,
                      props.payload.branch,
                    ]}
                    contentStyle={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend list */}
              <div className="mt-4 space-y-2">
                {safeBranches.slice(0, 5).map((b, i) => (
                  <div key={b.branch} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: piePalette[i % piePalette.length] }} />
                    <span className="text-[var(--text-muted)] truncate flex-1 font-medium">
                      {b.branch.split(' ')[0]}
                    </span>
                    {/* mini bar */}
                    <div className="w-16 h-1.5 rounded-pill bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-pill"
                        style={{
                          width: `${b.pct}%`,
                          background: piePalette[i % piePalette.length],
                        }}
                      />
                    </div>
                    <span className="font-bold text-[var(--text-primary)] w-8 text-right">
                      {b.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Bar chart ────────────────────────────────────────────── */}
      {branches.length > 0 && (
        <ChartCard
          title="Students vs Placed by Branch"
          subtitle="Total enrolled vs successfully placed"
          icon={Users}
          iconColor="text-[var(--accent)]"
          delay={140}
        >
          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={safeBranches.map((b) => ({
                ...b,
                branch: typeof b.branch === 'string' ? b.branch.split(' ')[0] : '',
              }))}
              margin={{ top: 4, right: isMobile ? 0 : 8, left: isMobile ? 0 : -24, bottom: 0 }}
              barSize={18}
              barCategoryGap="30%"
            >
              <XAxis dataKey="branch"
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip
                content={<ChartTip />}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(17,17,17,0.04)', radius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Bar dataKey="total"  name="Total"  fill={chartSeries.muted}   radius={[6, 6, 0, 0]} fillOpacity={0.7} />
              <Bar dataKey="placed" name="Placed" fill={chartSeries.success} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ── Funnel table + Activity ───────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 min-w-0">
          <FunnelTable data={safeFunnel} />
        </div>
        <ActivityFeed items={safeActivity} />
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
