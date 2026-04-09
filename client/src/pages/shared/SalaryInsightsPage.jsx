import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine,
} from 'recharts';
import {
  IndianRupee, Plus, TrendingUp, Shield, X,
  ArrowUpRight, ChevronDown, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { salaryService } from '../../services/salaryService';
import companyService from '../../services/companyService';

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

import { CompanyLogo } from '../../components/shared/CompanyCard';
import { CompanyCardSkeleton } from '../../components/shared/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

/* ─── Palette for chart bars ─────────────────────────────────────────── */
const BAR_COLORS_LIGHT = [
  '#1f1f1f', '#2c2c2c', '#3a3a3a', '#474747', '#555555',
  '#616161', '#6d6d6d', '#7a7a7a', '#878787', '#949494',
];

const BAR_COLORS_DARK = [
  '#f5f5f5', '#e0e0e0', '#cecece', '#bdbdbd', '#acacac',
  '#9b9b9b', '#8b8b8b', '#7c7c7c', '#6d6d6d', '#5f5f5f',
];

/* ─── Shared input class ─────────────────────────────────────────────── */
const inputCls = (err = false) =>
  `input text-sm ${err ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(255,69,58,0.12)]' : ''}`;

/* ─── Field label ────────────────────────────────────────────────────── */
const Label = ({ children, required }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
    {children}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
  </label>
);

/* ─── Submit Salary Modal ────────────────────────────────────────────── */
const SubmitSalaryModal = ({ isOpen, onClose, companies, onSubmitted }) => {
  const [form, setForm] = useState({
    company: '', role: '', ctc: '', base: '', bonus: '',
    stockOptions: '', joiningBonus: '', location: '',
    year: new Date().getFullYear(), batch: '',
    bond: { hasBond: false, duration: '', amount: '' },
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set     = (k, v) => { setForm(p => ({ ...p, [k]: v }));           setErrors(p => ({ ...p, [k]: '' })); };
  const setBond = (k, v) =>   setForm(p => ({ ...p, bond: { ...p.bond, [k]: v } }));

  const handleSubmit = async () => {
    const e = {};
    if (!form.company)            e.company = 'Select a company';
    if (!form.role.trim())        e.role    = 'Role is required';
    if (!form.ctc || form.ctc <= 0) e.ctc   = 'Enter total CTC';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      await salaryService.submit({
        ...form,
        ctc:          Number(form.ctc),
        base:         Number(form.base)         || 0,
        bonus:        Number(form.bonus)        || 0,
        stockOptions: Number(form.stockOptions) || 0,
        joiningBonus: Number(form.joiningBonus) || 0,
        bond: {
          hasBond:  form.bond.hasBond,
          duration: Number(form.bond.duration) || 0,
          amount:   Number(form.bond.amount)   || 0,
        },
      });
      toast.success('Salary data submitted anonymously 🙏');
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title="Share Salary Data" size="md"
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button variant="ghost" onClick={onClose}
            className="flex-1 h-11 rounded-input font-semibold">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}
            className="flex-1 h-11 btn-primary rounded-input font-semibold relative overflow-hidden group">
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              -translate-x-full group-hover:translate-x-full
              transition-all duration-700 pointer-events-none" />
            <Lock size={13} className="relative z-10" />
            <span className="relative z-10">Submit Anonymously</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Privacy banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl
          border border-[var(--success-border)]" style={{background: 'color-mix(in srgb, var(--success-bg) 50%, var(--surface) 50%)'}}>
          <Shield size={15} className="text-[var(--success)] mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-[var(--success)] leading-relaxed">
            Your identity is <strong>never</strong> shown. This helps your juniors negotiate better offers.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4">

          {/* Company */}
          <div className="col-span-2 space-y-1.5">
            <Label required>Company</Label>
            <div className="relative">
              <select
                value={form.company}
                onChange={e => set('company', e.target.value)}
                className={`${inputCls(!!errors.company)} appearance-none pr-9`}
              >
                <option value="">— Select company —</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2
                text-[var(--text-muted)] pointer-events-none" />
            </div>
            {errors.company && (
              <p className="text-[11px] text-[var(--danger)] font-medium">{errors.company}</p>
            )}
          </div>

          {/* Role */}
          <div className="col-span-2 space-y-1.5">
            <Label required>Role / Position</Label>
            <input
              value={form.role}
              onChange={e => set('role', e.target.value)}
              placeholder="e.g. SDE-1, Data Analyst, Consultant…"
              className={inputCls(!!errors.role)}
            />
            {errors.role && (
              <p className="text-[11px] text-[var(--danger)] font-medium">{errors.role}</p>
            )}
          </div>

          {/* Numeric fields */}
          {[
            { label: 'Total CTC (LPA)', key: 'ctc',          required: true, error: errors.ctc },
            { label: 'Base Salary (LPA)', key: 'base' },
            { label: 'Annual Bonus (LPA)', key: 'bonus' },
            { label: 'Stock Options (LPA)', key: 'stockOptions' },
            { label: 'Joining Bonus (LPA)', key: 'joiningBonus' },
            { label: 'Location', key: 'location', text: true },
          ].map(({ label, key, required, error, text }) => (
            <div key={key} className="space-y-1.5">
              <Label required={required}>{label}</Label>
              <input
                type={text ? 'text' : 'number'}
                min={text ? undefined : 0}
                step={text ? undefined : 0.1}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={text ? 'e.g. Bangalore' : '0.0'}
                className={inputCls(!!error)}
              />
              {error && <p className="text-[11px] text-[var(--danger)] font-medium">{error}</p>}
            </div>
          ))}

          {/* Year */}
          <div className="space-y-1.5">
            <Label>Year</Label>
            <div className="relative">
              <select
                value={form.year}
                onChange={e => set('year', Number(e.target.value))}
                className="input text-sm appearance-none pr-9"
              >
                {[2025,2024,2023,2022,2021].map(y =>
                  <option key={y} value={y}>{y}</option>
                )}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2
                text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border)]" />

        {/* Bond toggle */}
        <button
          type="button"
          onClick={() => setBond('hasBond', !form.bond.hasBond)}
          className={`w-full flex items-center justify-between p-3.5 rounded-lg border-2 cursor-pointer
            transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${
              form.bond.hasBond
                ? 'border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning-bg)_50%,var(--surface)_50%)]'
                : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border)]'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <Shield size={15}
              className={form.bond.hasBond ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'} />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Has Bond / Service Agreement
            </p>
          </div>
          {/* Toggle pill */}
          <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200
            ${
              form.bond.hasBond ? 'bg-[var(--warning)]' : 'bg-[var(--border)]'
            }`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
              ${form.bond.hasBond ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {form.bond.hasBond && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div className="space-y-1.5">
              <Label>Duration (months)</Label>
              <input type="number" min={0} value={form.bond.duration}
                onChange={e => setBond('duration', e.target.value)}
                placeholder="e.g. 24" className="input text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Penalty (Lakhs)</Label>
              <input type="number" min={0} value={form.bond.amount}
                onChange={e => setBond('amount', e.target.value)}
                placeholder="e.g. 2" className="input text-sm" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ─── Custom chart tooltip ───────────────────────────────────────────── */
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card p-3.5 space-y-1.5 text-xs min-w-[130px]
      border border-[var(--border)]" style={{background: themedWash, boxShadow: 'var(--shadow-hover)'}}>
      <p className="font-bold text-[var(--text-primary)] text-sm">{d.name}</p>
      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--text-muted)]">Avg</span>
          <span className="font-semibold text-[var(--accent)]">₹{d.avg}L</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--text-muted)]">Max</span>
          <span className="font-semibold text-[var(--text-primary)]">₹{d.max}L</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--text-muted)]">Reports</span>
          <span className="font-semibold text-[var(--text-secondary)]">{d.count}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Salary card ────────────────────────────────────────────────────── */
const SalaryCard = ({ stat, index = 0 }) => {
  const { company, avgCtc, medianCtc, maxCtc, minCtc, count, bondCount, roles } = stat;

  return (
    <div
      className="card p-5 border-[var(--border)] group
        transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        animate-slide-up hover:shadow-[var(--shadow-hover)]"
      style={{ animationDelay: `${index * 55}ms`, background: themedSurface, boxShadow: 'var(--shadow-soft)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <CompanyLogo logo={company?.logo} name={company?.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--text-primary)] truncate
            group-hover:text-[var(--accent)] transition-colors duration-200">
            {company?.name}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {company?.sector}
            <span className="mx-1.5 opacity-40">·</span>
            {count} report{count !== 1 ? 's' : ''}
          </p>
        </div>
        <ArrowUpRight size={14}
          className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100
            group-hover:text-[var(--accent)] transition-all duration-200 shrink-0" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Avg',    val: avgCtc?.toFixed(1),    color: 'text-[var(--accent)]',   bg: 'color-mix(in srgb, var(--accent) 12%, transparent)' },
          { label: 'Median', val: medianCtc?.toFixed(1), color: 'text-[var(--text-secondary)]',  bg: 'var(--surface-2)' },
          { label: 'Max',    val: maxCtc?.toFixed(1),    color: 'text-[var(--text-primary)]',  bg: 'var(--surface-2)' },
        ].map(({ label, val, color, bg }) => (
          <div key={label}
            className="text-center p-2.5 rounded-xl border border-[var(--border)]" style={{background: bg}}>
            <p className={`font-display text-lg font-bold ${color} leading-none`}>
              ₹{val}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium uppercase tracking-wide">
              {label} LPA
            </p>
          </div>
        ))}
      </div>

      {/* Range row */}
      <div className="flex items-center justify-between text-xs mb-3">
        <p className="text-[var(--text-muted)]">
          Range:&nbsp;
          <span className="text-[var(--text-secondary)] font-semibold">
            ₹{minCtc?.toFixed(1)}–₹{maxCtc?.toFixed(1)} LPA
          </span>
        </p>
        {bondCount > 0 && (
          <span className="flex items-center gap-1 text-[var(--warning)] font-semibold">
            <Shield size={11} />
            {bondCount} with bond
          </span>
        )}
      </div>

      {/* CTC range bar */}
      <div className="relative h-1 rounded-pill bg-[var(--border)] overflow-hidden mb-4">
        <div
          className="absolute h-full rounded-pill bg-[var(--accent)]"
          style={{
            left: `${Math.max(0, ((minCtc / (maxCtc || 1)) * 100))}%`,
            right: 0,
          }}
        />
      </div>

      {/* Role chips */}
      {roles?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {roles.slice(0, 3).map(r => (
            <span key={r}
              className="text-[10px] px-2 py-1 rounded-lg
                bg-[var(--surface-2)] border border-[var(--border)]
                text-[var(--text-muted)] font-medium">
              {r}
            </span>
          ))}
          {roles.length > 3 && (
            <span className="text-[10px] px-2 py-1 rounded-lg
              bg-[var(--surface-2)] border border-[var(--border)]
              text-[var(--text-muted)] font-medium">
              +{roles.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Stat summary pill ──────────────────────────────────────────────── */
const StatPill = ({ label, value, color = 'text-[var(--accent)]', index = 0 }) => (
  <div
    className="flex-1 min-w-[120px] p-4 rounded-lg
      border border-[var(--border)]
      animate-slide-up"
    style={{ animationDelay: `${index * 60}ms`, background: themedSurface, boxShadow: 'var(--shadow-soft)' }}
  >
    <p className={`font-display text-2xl font-bold ${color} leading-none`}>{value}</p>
    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium uppercase tracking-widest">
      {label}
    </p>
  </div>
);

/* ─── Skeleton card ──────────────────────────────────────────────────── */
const SalaryCardSkeleton = () => (
  <div className="card p-5 space-y-4 border-[var(--border)]" style={{background: themedSurface, boxShadow: 'var(--shadow-soft)'}}>
    <div className="flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 rounded-pill w-2/5" />
        <div className="skeleton h-2.5 rounded-pill w-1/3" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
    </div>
    <div className="skeleton h-2 rounded-pill w-full" />
    <div className="flex gap-1.5">
      <div className="skeleton h-6 w-16 rounded-lg" />
      <div className="skeleton h-6 w-20 rounded-lg" />
    </div>
  </div>
);

/* ─── Main page ──────────────────────────────────────────────────────── */
const SalaryInsightsPage = () => {
  const [stats,     setStats]     = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [year,      setYear]      = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [isDark,    setIsDark]    = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      const res = await salaryService.getStats(params);
      setStats(res.data.stats);
    } catch {
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    companyService.getAll({ limit: 100 })
      .then(r => setCompanies(r.data))
      .catch(() => {});
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

  const totalReports = stats.reduce((a, s) => a + s.count, 0);
  const avgAll       = stats.length
    ? (stats.reduce((a, s) => a + s.avgCtc, 0) / stats.length).toFixed(1)
    : '—';
  const topCtc = stats.length
    ? Math.max(...stats.map(s => s.maxCtc)).toFixed(1)
    : '—';

  const chartPalette = isDark ? BAR_COLORS_DARK : BAR_COLORS_LIGHT;

  const chartData = stats.slice(0, 10).map((s, i) => ({
    name:  s.company?.name?.split(' ')[0] || '?',
    avg:   parseFloat(s.avgCtc?.toFixed(1)),
    max:   parseFloat(s.maxCtc?.toFixed(1)),
    count: s.count,
    color: chartPalette[i % chartPalette.length],
  }));

  return (
    <div className="min-h-[calc(100vh-72px)] p-4 md:p-6 lg:p-8 page-enter space-y-8">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div
        className={`flex items-start justify-between flex-wrap gap-4
          transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl border border-[var(--accent)]/25
              flex items-center justify-center" style={{background: 'color-mix(in srgb, var(--accent) 12%, transparent)'}}>
              <IndianRupee size={15} className="text-[var(--accent)]" />
            </div>
            <h1 className="font-display text-h2 font-bold text-[var(--text-primary)] tracking-tight">
              Salary Insights
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] ml-10.5">
            Anonymous data from&nbsp;
            <strong className="text-[var(--text-primary)]">{totalReports}</strong>
            &nbsp;verified reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="input text-sm appearance-none pr-8 w-auto min-w-[120px]"
            >
              <option value="">All years</option>
              {[2025,2024,2023,2022,2021].map(y =>
                <option key={y} value={y}>{y}</option>
              )}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2
              text-[var(--text-muted)] pointer-events-none" />
          </div>
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => setModalOpen(true)}
            className="btn-primary h-11 px-5 rounded-input font-semibold relative overflow-hidden group"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              -translate-x-full group-hover:translate-x-full
              transition-all duration-700 pointer-events-none" />
            <span className="relative z-10">Share Salary</span>
          </Button>
        </div>
      </div>

      {/* ── Summary stat pills ─────────────────────────────────────── */}
      {!loading && stats.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <StatPill label="Total Reports"    value={totalReports}       color="text-[var(--accent)]"   index={0} />
          <StatPill label="Companies"        value={stats.length}       color="text-[var(--text-primary)]"  index={1} />
          <StatPill label="Avg CTC (LPA)"    value={`₹${avgAll}`}       color="text-[var(--text-primary)]"  index={2} />
          <StatPill label="Highest Pkg (LPA)" value={`₹${topCtc}`}     color="text-[var(--text-primary)]"   index={3} />
        </div>
      )}

      {/* ── Bar chart ──────────────────────────────────────────────── */}
      {!loading && chartData.length > 0 && (
        <div
          className="card p-6 animate-slide-up border-[var(--border)]"
          style={{ animationDelay: '100ms', background: themedSurface, boxShadow: 'var(--shadow-soft)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg border border-[var(--accent)]/25
                flex items-center justify-center" style={{background: 'color-mix(in srgb, var(--accent) 12%, transparent)'}}>
                <TrendingUp size={14} className="text-[var(--accent)]" />
              </span>
              <h2 className="font-display font-bold text-[var(--text-primary)] text-base">
                Average CTC — Top 10
              </h2>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: 'var(--accent)'}} />Avg
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              barCategoryGap="30%">
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v}L`}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: isDark ? 'rgba(245,245,245,0.12)' : 'rgba(17,17,17,0.04)', radius: 8 }}
              />
              <Bar dataKey="avg" radius={[8, 8, 0, 0]} maxBarSize={44}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={isDark ? 0.96 : 0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Cards grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SalaryCardSkeleton key={i} />)}
        </div>
      ) : stats.length === 0 ? (
        <div className="card p-12 text-center border-[var(--border)]" style={{background: themedSurface, boxShadow: 'var(--shadow-soft)'}}>
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-2xl border border-[var(--border)]" style={{background: themedWash}}>
            <IndianRupee size={28} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mb-2">
            No salary data yet
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs leading-relaxed mx-auto">
            Be the first to share — it's 100% anonymous and helps your juniors negotiate better.
          </p>
          <Button
            leftIcon={<Plus size={15} />}
            onClick={() => setModalOpen(true)}
            className="btn-primary h-11 px-6 rounded-input font-semibold"
          >
            Share Salary Data
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s, i) => <SalaryCard key={s._id} stat={s} index={i} />)}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────── */}
      <SubmitSalaryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        companies={companies}
        onSubmitted={fetchStats}
      />
    </div>
  );
};

export default SalaryInsightsPage;