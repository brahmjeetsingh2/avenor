import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, TrendingUp, Users, Building2, Award, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import dashboardService from '../../services/dashboardService';
import Button from '../../components/ui/Button';

const LIGHT_PALETTE = ['#1f1f1f', '#3d3d3d', '#4a4a4a', '#2a2a2a', '#1a1a1a', '#555555', '#6b6b6b', '#F9F9F9'];
const DARK_PALETTE = ['#F5F5F5', '#D0D0D0', '#B8B8B8', '#A7A7A7', '#8A8A8A', '#707070', '#555555', '#3d3d3d'];
const LIGHT_SERIES = {
  applied: '#1f1f1f',
  shortlisted: '#1a1a1a',
  interviews: '#4a4a4a',
  offers: '#2a2a2a',
  total: '#6A6860',
  placed: '#2a2a2a',
};
const DARK_SERIES = {
  applied: '#F5F5F5',
  shortlisted: '#D0D0D0',
  interviews: '#A7A7A7',
  offers: '#B8B8B8',
  total: '#A7A7A7',
  placed: '#F5F5F5',
};
const YEARS = ['2025', '2024', '2023', '2022'];

const ChartTip = ({ active, payload, label }) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;

  return (
    <div className="card px-3 py-2.5 text-xs space-y-1 shadow-card-dark">
      {label ? <p className="font-bold text-[var(--color-text-primary)] mb-1">{label}</p> : null}
      {payload.map((point) => (
        <div key={point.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: point.color }} />
          <span className="text-[var(--color-text-muted)]">{point.name}:</span>
          <span className="font-bold text-[var(--color-text-primary)]">{point.value}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, sub, color }) => (
  <div className="card p-5">
    <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">{label}</p>
    {sub ? <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p> : null}
  </div>
);

const CoordinatorAnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [branches, setBranches] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  const fetchAll = useCallback(async () => {
    if (requestRef.current) requestRef.current.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    try {
      const [statsRes, funnelRes, branchRes, timelineRes] = await Promise.all([
        dashboardService.getStats({ year }, { signal: controller.signal }),
        dashboardService.getFunnel({ signal: controller.signal }),
        dashboardService.getBranches({ signal: controller.signal }),
        dashboardService.getTimeline({ year }, { signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      setStats(statsRes || null);
      setFunnel(Array.isArray(funnelRes?.funnel) ? funnelRes.funnel : []);
      setBranches(Array.isArray(branchRes?.branches) ? branchRes.branches : []);
      setTimeline(Array.isArray(timelineRes?.timeline) ? timelineRes.timeline : []);
    } catch {
      if (controller.signal.aborted) return;
      toast.error('Failed to load analytics');
      setStats(null);
      setFunnel([]);
      setBranches([]);
      setTimeline([]);
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

  const funnelData = useMemo(() => ([
    { name: 'Applied', value: safeFunnel.reduce((sum, item) => sum + (Number(item.applied) || 0), 0), fill: '#1f1f1f' },
    { name: 'Shortlisted', value: safeFunnel.reduce((sum, item) => sum + (Number(item.shortlisted) || 0), 0), fill: '#1a1a1a' },
    { name: 'Interviews', value: safeFunnel.reduce((sum, item) => sum + (Number(item.test) || 0), 0), fill: '#4a4a4a' },
    { name: 'Offers', value: safeFunnel.reduce((sum, item) => sum + (Number(item.offer) || 0), 0), fill: '#2a2a2a' },
  ].filter((item) => item.value > 0)), [safeFunnel]);

  const sectorData = useMemo(() => {
    const sectorMap = {};
    safeFunnel.forEach((item) => {
      const sector = item.sector || 'Other';
      sectorMap[sector] = (sectorMap[sector] || 0) + (Number(item.offer) || 0);
    });

    return Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [safeFunnel]);

  const chartPalette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const chartSeries = isDark ? DARK_SERIES : LIGHT_SERIES;

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-[1200px] mx-auto overflow-x-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 card skeleton" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-64 card skeleton" />
          ))}
        </div>
        <div className="h-64 card skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 page-enter space-y-6 max-w-[1200px] mx-auto overflow-x-hidden">
      <section className="hero-shell hero-shell--coordinator px-5 py-4">
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Analytics</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Placement season insights</p>
          </div>

          <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-text-primary)] outline-none focus:border-primary-500 w-full sm:w-auto"
            >
              {YEARS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={13} />} onClick={fetchAll} className="w-full sm:w-auto">
              Refresh
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={handleExport} loading={exporting} className="w-full sm:w-auto">
              Export
            </Button>
          </div>
        </div>
      </section>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard label="Total Students" value={stats.totalStudents} color="text-primary-600" sub="registered" />
          <StatCard label="Placement Rate" value={`${stats.placedPct}%`} color="text-primary-600" sub={`${stats.placed} placed`} />
          <StatCard label="Average CTC" value={`₹${Number(stats.avgCTC).toFixed(1)}L`} color="text-primary-500" sub={`Max ₹${stats.maxCTC}L`} />
          <StatCard label="Total Offers" value={stats.offerCount} color="text-primary-600" sub={`${stats.totalCompanies} companies`} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5 reveal-up-sm" style={{ animationDelay: '0.04s' }}>
          <h2 className="font-display font-bold text-base text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" /> Overall Funnel
          </h2>
          {funnelData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
              No application data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: isMobile ? 0 : 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={isMobile ? 66 : 80} />
                <Tooltip content={<ChartTip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'var(--color-border)' }} />
                <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]} maxBarSize={32}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={chartSeries[entry.name.toLowerCase()] || entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 reveal-up-sm" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display font-bold text-base text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
            <Building2 size={16} className="text-primary-600" /> Offers by Sector
          </h2>
          {sectorData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
              No offer data yet
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <ResponsiveContainer width={isMobile ? '100%' : '55%'} height={isMobile ? 200 : 180}>
                <PieChart>
                  <Pie data={sectorData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {sectorData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [value, props?.payload?.name]}
                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sectorData.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chartPalette[index % chartPalette.length] }} />
                    <span className="text-[var(--color-text-muted)] truncate flex-1">{item.name}</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 reveal-up-sm" style={{ animationDelay: '0.14s' }}>
        <h2 className="font-display font-bold text-base text-[var(--color-text-primary)] mb-5">
          Monthly Activity — {year}
        </h2>
        {safeTimeline.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No activity data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={safeTimeline} margin={{ top: 0, right: isMobile ? 0 : 8, left: isMobile ? 0 : -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              {!isMobile && <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-text-muted)' }} />}
              <Line type="monotone" dataKey="applied" stroke={chartSeries.applied} strokeWidth={2} dot={false} name="Applied" />
              <Line type="monotone" dataKey="shortlisted" stroke={chartSeries.shortlisted} strokeWidth={2} dot={false} name="Shortlisted" />
              <Line type="monotone" dataKey="offers" stroke={chartSeries.offers} strokeWidth={2.5} dot={{ r: 3, fill: chartSeries.offers }} name="Offers" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {safeBranches.length > 0 && (
        <div className="card overflow-hidden p-0 reveal-up-sm" style={{ animationDelay: '0.18s' }}>
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
              <Users size={16} className="text-primary-600" /> Branch-wise Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] table-rows-stagger">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Branch', 'Total Students', 'Placed', 'Placement %', 'Progress'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeBranches.map((branch, index) => {
                  const branchName = typeof branch.branch === 'string' ? branch.branch : 'Unknown';
                  const percentage = Math.min(100, Number(branch.pct || 0));

                  return (
                    <tr key={`${branchName}-${index}`} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors">
                      <td className="px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)]">{branchName}</td>
                      <td className="px-5 py-3 text-sm text-[var(--color-text-secondary)]">{branch.total || 0}</td>
                      <td className="px-5 py-3 text-sm font-bold text-primary-600">{branch.placed || 0}</td>
                      <td className="px-5 py-3 text-sm font-bold text-[var(--color-text-primary)]">{Number(branch.pct || 0)}%</td>
                      <td className="px-5 py-3 w-40">
                        <div className="w-full h-2 rounded-full bg-[var(--color-border)]">
                          <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorAnalyticsPage;
