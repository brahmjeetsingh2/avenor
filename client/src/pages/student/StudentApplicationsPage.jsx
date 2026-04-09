import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Briefcase, ArrowRight, Download, Search, Filter, Sparkles, Bell, Building2, Clock3 } from 'lucide-react';
import toast from 'react-hot-toast';
import applicationService from '../../services/applicationService';
import { StatusBadge, STATUS_CONFIG, KANBAN_COLUMNS } from '../../utils/applicationStatus';
import ApplicationDetailModal from '../../components/shared/ApplicationDetailModal';
import { CompanyLogo } from '../../components/shared/CompanyCard';
import { CompanyCardSkeleton } from '../../components/shared/Skeleton';

// ─── Funnel stats bar ─────────────────────────────────────────────────────────
const FUNNEL_ITEMS = [
  { label: 'Applied',     key: 'applied',      barColor: 'var(--accent)'  },
  { label: 'Shortlisted', key: 'shortlisted',  barColor: 'var(--accent)'  },
  { label: 'Interviews',  key: 'interview_r1', barColor: 'var(--warning)' },
  { label: 'Offers',      key: 'offer',        barColor: 'var(--status-success)' },
  { label: 'Rejected',    key: 'rejected',     barColor: 'var(--danger)'  },
];

const FunnelStats = ({ stats, total }) => {
  const map = Object.fromEntries((stats || []).map((s) => [s._id, s.count]));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(108px,1fr))', gap: 10, marginBottom: 20 }}>
      {FUNNEL_ITEMS.map(({ label, key, barColor }) => {
        const count = map[key] || 0;
        const pct   = Math.min(100, (count / (total || 1)) * 100);
        const cfg   = STATUS_CONFIG[key];
        return (
          <div
            key={key}
            style={{
              position:     'relative',
              overflow:     'hidden',
              background:   'linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, #FFFFFF 4%) 0%, color-mix(in srgb, var(--surface-2) 92%, #FFFFFF 8%) 100%)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding:      '14px 12px',
              textAlign:    'center',
              boxShadow:    'var(--shadow-soft)',
              transition:   'transform 0.22s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.22s ease, border-color 0.22s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
            }}
          >
            <span style={{ position: 'absolute', inset: 'auto -20px -24px auto', width: 74, height: 74, borderRadius: '50%', background: barColor, opacity: 0.08 }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: cfg?.color || 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {count}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, marginBottom: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: barColor, width: `${pct}%`, minWidth: count ? 4 : 0, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Kanban card ──────────────────────────────────────────────────────────────
const KanbanCard = ({ application, onClick }) => {
  const { company, createdAt } = application;
  return (
    <div
      onClick={() => onClick(application)}
      style={{
        background:   'linear-gradient(180deg, color-mix(in srgb, var(--surface) 95%, #FFFFFF 5%) 0%, color-mix(in srgb, var(--surface-2) 92%, #FFFFFF 8%) 100%)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding:      '14px',
        cursor:       'pointer',
        transition:   'transform 0.22s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.22s ease, border-color 0.22s ease',
        boxShadow:    'var(--shadow-soft)',
        minHeight:    146,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = 'translateY(-3px)';
        e.currentTarget.style.boxShadow   = 'var(--shadow-hover)';
        e.currentTarget.style.borderColor = 'rgba(17,17,17,0.24)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = 'var(--shadow-soft)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <CompanyLogo logo={company?.logo} name={company?.name} size="sm" />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company?.name}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35 }}>{company?.sector}</p>
        </div>
      </div>

      {company?.ctc?.max > 0 && (
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          ₹{company.ctc.min}–{company.ctc.max} LPA
        </p>
      )}
      {company?.roles?.length > 0 && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6, lineHeight: 1.35 }}>
          {company.roles.slice(0, 2).join(', ')}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 999, background: 'rgba(17,17,17,0.08)', color: 'var(--accent)', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {application.status}
        </span>
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        Applied {new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </p>
    </div>
  );
};

// ─── Table row ────────────────────────────────────────────────────────────────
const TableRow = ({ application, onClick }) => {
  const { company, status, createdAt, interviewSlot } = application;
  return (
    <tr
      onClick={() => onClick(application)}
      style={{ cursor: 'pointer', transition: 'background 0.15s ease', borderBottom: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompanyLogo logo={company?.logo} name={company?.name} size="sm" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{company?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{company?.sector}</p>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
        {company?.roles?.slice(0, 2).join(', ') || '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <StatusBadge status={status} />
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
        {interviewSlot?.date
          ? new Date(interviewSlot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          : '—'}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
        {new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
      </td>
    </tr>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const StudentApplicationsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [stats,        setStats]        = useState({ stats: [], total: 0 });
  const [loading,      setLoading]      = useState(true);
  const [view,         setView]         = useState('kanban');
  const [selected,     setSelected]     = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  const handledApplyState = useRef(false);
  const handledFocusState = useRef(false);
  const [filters, setFilters] = useState({ search: '', status: '', company: '', recency: 'all' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        applicationService.getMyApps(),
        applicationService.getMyStats(),
      ]);

      // Backend wraps responses as { success, data: { applications } }
      // axios response is: res.data = { success, data: { applications } }
      const appsData  = appsRes.data?.data ?? appsRes.data;
      const statsData = statsRes.data?.data ?? statsRes.data;

      setApplications(appsData?.applications ?? []);
      setStats({
        stats: statsData?.stats ?? [],
        total: statsData?.total ?? 0,
      });
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (handledFocusState.current) return;
    const focusApplicationId = location.state?.focusApplicationId;
    if (!focusApplicationId || applications.length === 0) return;

    const match = applications.find((app) => app._id === focusApplicationId);
    if (!match) return;

    handledFocusState.current = true;
    openDetail(match);
    navigate(location.pathname, { replace: true, state: null });
  }, [applications, location.pathname, location.state, navigate]);

  // Show apply-result toast when we arrive from the company detail page
  useEffect(() => {
    if (handledApplyState.current) return;

    const applyToast = location.state?.applyToast;
    const applyToastType = location.state?.applyToastType;
    if (!applyToast) return;

    handledApplyState.current = true;
    const showToast = applyToastType === 'error' ? toast.error : toast.success;
    showToast(applyToast, { id: 'application-flow-toast' });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleWithdraw = async (id) => {
    try {
      await applicationService.withdraw(id);
      toast.success('Application withdrawn');
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to withdraw');
    }
  };

  const openDetail = (app) => { setSelected(app); setModalOpen(true); };

  const filteredApplications = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    return applications.filter((app) => {
      const searchText = `${app.company?.name || ''} ${app.company?.sector || ''} ${(app.company?.roles || []).join(' ')} ${app.company?.location || ''}`.toLowerCase();
      const searchMatch = !filters.search || searchText.includes(filters.search.toLowerCase());
      const statusMatch = !filters.status || app.status === filters.status;
      const companyMatch = !filters.company || String(app.company?._id || '') === filters.company;

      let recencyMatch = true;
      if (filters.recency === '7d') {
        recencyMatch = new Date(app.createdAt).getTime() >= now - weekMs;
      } else if (filters.recency === '30d') {
        recencyMatch = new Date(app.createdAt).getTime() >= now - (30 * weekMs / 7);
      } else if (filters.recency === '90d') {
        recencyMatch = new Date(app.createdAt).getTime() >= now - (90 * weekMs / 7);
      }

      return searchMatch && statusMatch && companyMatch && recencyMatch;
    });
  }, [applications, filters]);

  const companyOptions = useMemo(() => {
    const seen = new Map();
    applications.forEach((app) => {
      if (app.company?._id && app.company?.name) seen.set(String(app.company._id), app.company.name);
    });
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [applications]);

  const exportCsv = () => {
    if (!filteredApplications.length) {
      toast.error('No applications to export');
      return;
    }

    const rows = [
      ['Company', 'Role', 'Status', 'Applied Date', 'Interview Slot'],
      ...filteredApplications.map((app) => [
        app.company?.name || '',
        (app.company?.roles || []).slice(0, 2).join(' / '),
        app.status,
        new Date(app.createdAt).toLocaleDateString('en-IN'),
        app.interviewSlot?.date ? new Date(app.interviewSlot.date).toLocaleDateString('en-IN') : '',
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applications-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Group by status for kanban
  const grouped = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = filteredApplications.filter((a) => a.status === col.id);
    return acc;
  }, {});

  const hasAny = filteredApplications.length > 0;
  const statusCountMap = Object.fromEntries((stats.stats || []).map((s) => [s._id, s.count]));
  const nextInterview = applications
    .filter((app) => app.interviewSlot?.date)
    .sort((a, b) => new Date(a.interviewSlot.date) - new Date(b.interviewSlot.date))[0];
  const visibleKanbanColumns = KANBAN_COLUMNS.filter((col) => grouped[col.id]?.length > 0 || ['applied', 'shortlisted', 'offer'].includes(col.id));

  const renderKanbanColumn = (col, isMobile = false) => {
    const cfg = STATUS_CONFIG[col.id];
    const items = grouped[col.id] || [];

    return (
      <div key={col.id} style={{ width: isMobile ? '100%' : 232, display: 'flex', flexDirection: 'column', gap: 8, scrollSnapAlign: 'start' }}>
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        isMobile ? '10px 12px' : '9px 12px',
            borderRadius:   'var(--radius-input)',
            background:     `linear-gradient(180deg, ${cfg.bg} 0%, color-mix(in srgb, ${cfg.bg} 72%, #FFFFFF 28%) 100%)`,
            border:         `1px solid ${cfg.border}`,
            boxShadow:      'var(--shadow-soft)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{col.label}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: cfg.bg,
              color: cfg.color,
            }}
          >
            {items.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
          {items.map((app) => <KanbanCard key={app._id} application={app} onClick={openDetail} />)}
          {items.length === 0 && (
            <div
              style={{
                height:         64,
                borderRadius:   'var(--radius-card)',
                border:         '1.5px dashed var(--border)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter" style={{ padding: 'clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1480, margin: '0 auto', width: '100%' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="hero-shell hero-shell--student" style={{ padding: 'clamp(12px, 4vw, 20px) clamp(12px, 4.4vw, 22px)', borderRadius: 'var(--radius-card)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(17,17,17,0.08)', color: 'var(--accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Sparkles size={11} /> Student workspace
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: 'rgba(38,38,38,0.09)', color: 'var(--warning)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Bell size={11} /> Stay updated
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(21px,3vw,34px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
            My Applications
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 720 }}>
            Track every company you applied to, keep an eye on interviews, and review the full placement journey from one clean place.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(17,17,17,0.08)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}>
              <Building2 size={11} /> {stats.total} total applications
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: 'rgba(38,38,38,0.09)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}>
              <Clock3 size={11} /> {nextInterview ? 'Upcoming interview scheduled' : 'No upcoming interview yet'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 8 }}>
            {[['Applied', statusCountMap.applied || 0], ['Shortlisted', statusCountMap.shortlisted || 0], ['Offers', statusCountMap.offer || 0]].map(([label, value]) => (
              <div key={label} style={{ padding: '12px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(10px)' }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>{value}</p>
                <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <button
              onClick={exportCsv}
              className="w-full sm:w-auto justify-center"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Download size={14} /> Export
            </button>

            <div className="flex w-full sm:w-auto items-stretch gap-2 p-1.5 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)]">
              {[{ id: 'kanban', icon: LayoutGrid }, { id: 'table', icon: List }].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className="flex-1 sm:flex-none"
                  style={{
                    padding:      '7px 10px',
                    borderRadius: 7,
                    border:       'none',
                    cursor:       'pointer',
                    background:   view === id ? 'var(--surface)' : 'transparent',
                    color:        view === id ? 'var(--accent)' : 'var(--text-muted)',
                    boxShadow:    view === id ? 'var(--shadow-soft)' : 'none',
                    transition:   'all 0.15s ease',
                  }}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Search company or role"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <select className="input" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
          <option value="">All statuses</option>
          {Object.keys(KANBAN_COLUMNS.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})).map((status) => (
            <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select className="input" value={filters.company} onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))}>
          <option value="">All companies</option>
          {companyOptions.map((company) => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
        <select className="input" value={filters.recency} onChange={(e) => setFilters((prev) => ({ ...prev, recency: e.target.value }))}>
          <option value="all">Any time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* ── Funnel stats ───────────────────────────────────────────── */}
      {!loading && hasAny && (
        <div style={{ padding: 'clamp(12px, 3.8vw, 16px)', borderRadius: 'var(--radius-card)', background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, #FFFFFF 4%) 0%, color-mix(in srgb, var(--surface-2) 92%, #FFFFFF 8%) 100%)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
          <FunnelStats stats={stats.stats} total={stats.total} />
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <CompanyCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!loading && !hasAny && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(48px, 14vw, 88px) clamp(14px, 4vw, 24px)', textAlign: 'center', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)', background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, #FFFFFF 4%) 0%, color-mix(in srgb, var(--surface-2) 94%, #FFFFFF 6%) 100%)', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(180deg, rgba(17,17,17,0.09) 0%, rgba(38,38,38,0.07) 100%)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Briefcase size={30} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontSize: 21, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>No applications yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 420, lineHeight: 1.7 }}>Browse companies and hit Apply to get started. Once you begin, this page will become your command center for tracking progress.</p>
          <button
            onClick={() => navigate('/student/companies')}
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          8,
              padding:      '11px 22px',
              background:   'var(--accent)',
              color:        'var(--text-reverse)',
              fontWeight:   700,
              fontSize:     14,
              borderRadius: 'var(--radius-input)',
              border:       'none',
              cursor:       'pointer',
              transition:   'background 0.18s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            Browse Companies <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── Kanban view ────────────────────────────────────────────── */}
      {!loading && hasAny && view === 'kanban' && (
        <>
          <div className="sm:hidden" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Swipe cards to view columns
          </div>
          <div className="flex flex-col gap-12 md:hidden">
            {visibleKanbanColumns.map((col) => renderKanbanColumn(col, true))}
          </div>
          <div className="hidden md:flex" style={{ gap: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain', scrollSnapType: 'x proximity', paddingBottom: 16, marginLeft: -4, paddingLeft: 4 }}>
            {visibleKanbanColumns.map((col) => renderKanbanColumn(col, false))}
          </div>
        </>
      )}

      {/* ── Table view ─────────────────────────────────────────────── */}
      {!loading && hasAny && view === 'table' && (
        <div style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, #FFFFFF 4%) 0%, color-mix(in srgb, var(--surface-2) 92%, #FFFFFF 8%) 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
          <div className="sm:hidden" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Compact table cards
          </div>
          <div className="sm:hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredApplications.map((app, idx) => (
              <button
                key={app._id}
                onClick={() => openDetail(app)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 8,
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderBottom: idx < filteredApplications.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                  <CompanyLogo logo={app.company?.logo} name={app.company?.name} size="sm" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.company?.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.company?.roles?.slice(0, 2).join(', ') || app.company?.sector || 'Role not set'}</p>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
                  <StatusBadge status={app.status} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden sm:block" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}>
            <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Company', 'Role', 'Status', 'Interview', 'Applied', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding:       '10px 16px',
                        textAlign:     'left',
                        fontSize:      11,
                        fontWeight:    700,
                        color:         'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace:    'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <TableRow key={app._id} application={app} onClick={openDetail} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Detail modal ───────────────────────────────────────────── */}
      <ApplicationDetailModal
        application={selected}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
};

export default StudentApplicationsPage;