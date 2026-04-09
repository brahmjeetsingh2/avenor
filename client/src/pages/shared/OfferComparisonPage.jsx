import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, CheckCircle, IndianRupee, MapPin,
  Calendar, AlertTriangle, X, Star, Shield,
  ChevronDown, TrendingUp, Award, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import { offerService } from '../../services/salaryService';
import companyService from '../../services/companyService';
import { CompanyLogo } from '../../components/shared/CompanyCard';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]';

/* ─── Shared helpers ─────────────────────────────────────────────────── */
const isBest  = (val, all, higher = true) =>
  all.length > 1 && (higher ? val === Math.max(...all) : val === Math.min(...all));

const ic = (err) =>
  `input text-sm transition-all duration-200 ${err
    ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(255,69,58,0.12)]'
    : ''}`;

const Label = ({ children, required }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
    {children}{required && <span className="text-[var(--danger)] ml-0.5">*</span>}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-[11px] text-[var(--danger)] font-medium mt-1">{msg}</p> : null;

/* ─── Best tag ───────────────────────────────────────────────────────── */
const BestTag = () => (
  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5
    rounded-md border border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)] ml-1.5 align-middle">
    <Star size={8} fill="currentColor" /> BEST
  </span>
);

/* ─── Toggle ─────────────────────────────────────────────────────────── */
const Toggle = ({ on, color = 'bg-[var(--warning)]' }) => (
  <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors duration-200
    ${on ? color : 'bg-[var(--border)]'}`}>
    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
      ${on ? 'translate-x-4' : 'translate-x-0'}`} />
  </div>
);

/* ─── Table section label row ────────────────────────────────────────── */
const SectionRow = ({ label, children, shaded }) => (
  <tr className={`border-b border-[var(--border)] transition-colors duration-150
    ${shaded ? 'bg-[var(--surface-2)]/60' : 'bg-[var(--surface)]'}`}>
    <td className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest
      text-[var(--text-muted)] w-32 whitespace-nowrap">
      {label}
    </td>
    {children}
  </tr>
);

/* ─── Status badge select ────────────────────────────────────────────── */
const statusCfg = {
  considering: { color: 'text-[var(--accent)]',   bg: 'bg-[var(--accent)]/10   border-[var(--accent)]/25'   },
  accepted:    { color: 'text-[var(--success)]',  bg: 'bg-[var(--success-bg)] border-[var(--success-border)]'  },
  declined:    { color: 'text-[var(--danger)]',   bg: 'bg-[var(--danger)]/10   border-[var(--danger)]/25'   },
};

const OFFER_TEMPLATES = [
  {
    key: 'balanced',
    label: 'Balanced',
    defaults: { base: '', bonus: '', joiningBonus: '', location: '', workMode: 'hybrid', bond: { hasBond: false, duration: '', amount: '' }, perks: 'health insurance, learning budget' },
  },
  {
    key: 'high_ctc',
    label: 'High Compensation',
    defaults: { base: '', bonus: '', joiningBonus: '', location: '', workMode: 'onsite', bond: { hasBond: false, duration: '', amount: '' }, perks: 'yearly bonus, ESOPs' },
  },
  {
    key: 'work_life',
    label: 'Work-Life Friendly',
    defaults: { base: '', bonus: '', joiningBonus: '', location: '', workMode: 'remote', bond: { hasBond: false, duration: '', amount: '' }, perks: 'remote-friendly, flexible hours' },
  },
  {
    key: 'bonded',
    label: 'Bonded Role',
    defaults: { base: '', bonus: '', joiningBonus: '', location: '', workMode: 'onsite', bond: { hasBond: true, duration: '24', amount: '2' }, perks: 'training, mentor support' },
  },
];

const WEIGHT_PRESETS = {
  balanced: { compensation: 35, growth: 20, location: 15, brand: 15, workLife: 15 },
  compensation: { compensation: 50, growth: 20, location: 10, brand: 10, workLife: 10 },
  work_life: { compensation: 20, growth: 15, location: 20, brand: 15, workLife: 30 },
};

const companyBrandScore = (company) => {
  const map = { mnc: 100, product: 90, psu: 88, consulting: 82, analytics: 80, startup: 76, service: 68 };
  return map[company?.type] || 72;
};

/* ─── Add Offer Modal ────────────────────────────────────────────────── */
const AddOfferModal = ({ isOpen, onClose, companies, onAdded }) => {
  const [form, setForm] = useState({
    company: '', role: '', ctc: '', base: '', bonus: '', joiningBonus: '',
    location: '', workMode: 'onsite', joiningDate: '',
    bond: { hasBond: false, duration: '', amount: '' },
    perks: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set     = (k, v) => { setForm(p => ({ ...p, [k]: v }));           setErrors(p => ({ ...p, [k]: '' })); };
  const setBond = (k, v) =>   setForm(p => ({ ...p, bond: { ...p.bond, [k]: v } }));

  const applyTemplate = (templateKey) => {
    const template = OFFER_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;

    setForm((prev) => ({
      ...prev,
      ...template.defaults,
      bond: { ...template.defaults.bond },
    }));
  };

  const handleSubmit = async () => {
    const e = {};
    if (!form.company)      e.company = 'Select a company';
    if (!form.role.trim())  e.role    = 'Role is required';
    if (!form.ctc)          e.ctc     = 'CTC is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      await offerService.create({
        ...form,
        ctc:   Number(form.ctc),
        base:  Number(form.base)  || 0,
        bonus: Number(form.bonus) || 0,
        joiningBonus: Number(form.joiningBonus) || 0,
        perks: form.perks
          ? form.perks.split(',').map(p => p.trim()).filter(Boolean)
          : [],
        bond: {
          hasBond:  form.bond.hasBond,
          duration: Number(form.bond.duration) || 0,
          amount:   Number(form.bond.amount)   || 0,
        },
      });
      toast.success('Offer added to comparison');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title="Add Offer" size="md"
      fitContent
      bodyClassName="pt-4 pb-5"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={onClose}
            className="flex-1 h-11 rounded-input font-semibold border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Cancel
          </Button>
          <Button variant="accent" onClick={handleSubmit} loading={loading}
            className="flex-1 h-11 rounded-input font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)]">
            Add Offer
          </Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Templates */}
        <div className="space-y-2">
          <Label>Quick Templates</Label>
          <div className="flex flex-wrap gap-2">
            {OFFER_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => applyTemplate(template.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--accent)]/35 hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--surface-2)_78%,var(--accent)_22%)] active:scale-[0.98] transition-all ${focusRing}`}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <Label required>Company</Label>
          <div className="relative">
            <select
              value={form.company}
              onChange={e => set('company', e.target.value)}
              className={`${ic(errors.company)} appearance-none pr-9`}
            >
              <option value="">— Select company —</option>
              {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2
              text-[var(--text-muted)] pointer-events-none" />
          </div>
          <FieldError msg={errors.company} />
        </div>

        {/* Role */}
        <div>
          <Label required>Role / Position</Label>
          <input
            value={form.role}
            onChange={e => set('role', e.target.value)}
            placeholder="SDE-1, Analyst, Consultant…"
            className={ic(errors.role)}
          />
          <FieldError msg={errors.role} />
        </div>

        {/* Numeric grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total CTC (LPA)', key: 'ctc',      required: true, error: errors.ctc },
            { label: 'Base (LPA)',       key: 'base'    },
            { label: 'Bonus (LPA)',      key: 'bonus'   },
            { label: 'Joining Bonus (LPA)', key: 'joiningBonus' },
            { label: 'Location',         key: 'location', text: true },
          ].map(({ label, key, required, error, text }) => (
            <div key={key}>
              <Label required={required}>{label}</Label>
              <input
                type={text ? 'text' : 'number'}
                min={text ? undefined : 0}
                step={text ? undefined : 0.1}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={text ? 'e.g. Bangalore' : '0.0'}
                className={ic(!!error)}
              />
              <FieldError msg={error} />
            </div>
          ))}

          {/* Joining date */}
          <div>
            <Label>Joining Date</Label>
            <div className="relative">
              <Calendar size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2
                text-[var(--text-muted)] pointer-events-none" />
              <input
                type="date"
                value={form.joiningDate}
                onChange={e => set('joiningDate', e.target.value)}
                className="input text-sm pl-9"
              />
            </div>
          </div>

          <div>
            <Label>Work Mode</Label>
            <select value={form.workMode} onChange={e => set('workMode', e.target.value)} className="input text-sm">
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Perks */}
        <div>
          <Label>Perks</Label>
          <input
            value={form.perks}
            onChange={e => set('perks', e.target.value)}
            placeholder="Relocation bonus, WFH policy, Free meals…"
            className="input text-sm"
          />
          {form.perks && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.perks.split(',').map(p => p.trim()).filter(Boolean).map((p, i) => (
                <span key={i} className="chip text-[11px] py-0.5 px-2.5 animate-fade-in">{p}</span>
              ))}
            </div>
          )}
        </div>

        {/* Bond toggle */}
        <button
          type="button"
          onClick={() => setBond('hasBond', !form.bond.hasBond)}
          className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2
            cursor-pointer transition-all duration-200
            ${form.bond.hasBond
              ? 'border-[var(--warning-border)] bg-[var(--warning-bg)]'
              : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border)]'
            } ${focusRing}`}
        >
          <div className="flex items-center gap-2.5">
            <Shield size={14}
              className={form.bond.hasBond ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'} />
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Has Bond / Service Agreement
            </span>
          </div>
          <Toggle on={form.bond.hasBond} />
        </button>

        {form.bond.hasBond && (
          <div className="grid grid-cols-2 gap-3 animate-slide-up">
            <div>
              <Label>Duration (months)</Label>
              <input type="number" min={0} value={form.bond.duration}
                onChange={e => setBond('duration', e.target.value)}
                placeholder="e.g. 24" className="input text-sm" />
            </div>
            <div>
              <Label>Penalty (Lakhs)</Label>
              <input type="number" min={0} value={form.bond.amount}
                onChange={e => setBond('amount', e.target.value)}
                placeholder="e.g. 2" className="input text-sm" />
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label>Personal Notes</Label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Why you're considering this offer, growth prospects, team vibe…"
            rows={2}
            className="input text-sm h-auto py-3 resize-none leading-relaxed"
          />
        </div>
      </div>
    </Modal>
  );
};

/* ─── Decision summary card ──────────────────────────────────────────── */
const DecisionCard = ({ label, icon: Icon, iconColor, bg, border, title, sub }) => (
  <div className={`p-4 rounded-2xl ${bg} border ${border} flex flex-col gap-1.5`}>
    <div className="flex items-center gap-2 mb-0.5">
      <Icon size={13} className={iconColor} />
      <p className={`text-[10px] font-bold uppercase tracking-widest ${iconColor}`}>{label}</p>
    </div>
    <p className="font-bold text-[var(--text-primary)] text-sm leading-snug">{title}</p>
    <p className={`text-sm font-semibold ${iconColor}`}>{sub}</p>
  </div>
);

/* ─── Main page ──────────────────────────────────────────────────────── */
const OfferComparisonPage = () => {
  const { user } = useAuth();
  const [offers,    setOffers]    = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [weightPreset, setWeightPreset] = useState('balanced');

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await offerService.getMyOffers();
      setOffers(res.data.offers);
    } catch {
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);
  useEffect(() => {
    companyService.getAll({ limit: 100 })
      .then(r => setCompanies(Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : [])))
      .catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    try {
      await offerService.remove(id);
      toast.success('Offer removed');
      fetchOffers();
    } catch { toast.error('Failed to remove'); }
  };

  const handleStatus = async (id, status) => {
    try {
      await offerService.update(id, { status });
      fetchOffers();
      if (status === 'accepted') toast.success('Offer accepted! 🎉 Congratulations!');
    } catch { toast.error('Failed to update'); }
  };

  const ctcValues   = offers.map(o => o.ctc);
  const bonusValues = offers.map(o => o.bonus || 0);
  const joiningBonusValues = offers.map(o => o.joiningBonus || 0);
  const noBondOffers = offers.filter(o => !o.bond?.hasBond);
  const bestPerks    = offers.length
    ? offers.reduce((a, b) => (b.perks?.length || 0) > (a.perks?.length || 0) ? b : a, offers[0])
    : null;

  const weights = WEIGHT_PRESETS[weightPreset] || WEIGHT_PRESETS.balanced;

  const scoredOffers = useMemo(() => {
    if (!offers.length) return [];

    const maxCtc = Math.max(...offers.map((offer) => Number(offer.ctc) || 0), 1);
    const maxBonus = Math.max(...offers.map((offer) => Number(offer.bonus || 0) + Number(offer.joiningBonus || 0)), 1);
    const preferredLocations = (user?.placementProfile?.preferredLocations || []).map((item) => item.toLowerCase());

    return offers.map((offer) => {
      const compensationScore = ((Number(offer.ctc) || 0) / maxCtc) * 100;
      const growthScore = (((Number(offer.base) || 0) + (Number(offer.bonus) || 0) + (Number(offer.joiningBonus) || 0)) / (maxBonus || 1)) * 100;
      const locationMatch = preferredLocations.length && offer.location
        ? preferredLocations.some((location) => offer.location.toLowerCase().includes(location))
        : (offer.workMode === 'remote' ? 85 : offer.workMode === 'hybrid' ? 75 : 60);
      const brandScore = companyBrandScore(offer.company);
      const workLifeScore = (!offer.bond?.hasBond ? 80 : 40) + (offer.workMode === 'remote' ? 15 : offer.workMode === 'hybrid' ? 10 : 0) + Math.min(10, (offer.perks?.length || 0) * 2);

      const total = (
        compensationScore * (weights.compensation / 100) +
        growthScore * (weights.growth / 100) +
        locationMatch * (weights.location / 100) +
        brandScore * (weights.brand / 100) +
        workLifeScore * (weights.workLife / 100)
      );

      return {
        ...offer,
        score: Math.round(total),
        scoreBreakdown: {
          compensationScore: Math.round(compensationScore),
          growthScore: Math.round(growthScore),
          locationScore: Math.round(locationMatch),
          brandScore: Math.round(brandScore),
          workLifeScore: Math.round(workLifeScore),
        },
      };
    }).sort((a, b) => b.score - a.score);
  }, [offers, user?.placementProfile?.preferredLocations, weights]);

  const topScore = scoredOffers[0];
  const recommendationSummary = scoredOffers.length > 0 ? {
    top: topScore,
    second: scoredOffers[1],
    averageScore: Math.round(scoredOffers.reduce((sum, offer) => sum + offer.score, 0) / scoredOffers.length),
  } : null;

  return (
    <div className="min-h-[calc(100vh-72px)] p-4 md:p-6 lg:p-8 page-enter space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className={`
        flex items-start justify-between flex-wrap gap-4
        transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl border border-[var(--accent)]/20
              bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]
              flex items-center justify-center">
              <IndianRupee size={15} className="text-[var(--accent)]" />
            </div>
            <h1 className="font-display text-h2 font-bold text-[var(--text-primary)] tracking-tight">
              Offer Comparison
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] ml-10.5">
            <strong className="text-[var(--text-primary)]">{offers.length}</strong>
            {' '}offer{offers.length !== 1 ? 's' : ''} · Compare side by side
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => setModalOpen(true)}
          className="h-11 px-5 rounded-input font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)]"
        >
          <Plus size={14} />
          <span>Add Offer</span>
        </Button>
      </div>

      {offers.length > 0 && (
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3 border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Scoring mode</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Pick the lens you want to compare offers with.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(WEIGHT_PRESETS).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setWeightPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-[0.98] ${focusRing} ${weightPreset === preset ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)] shadow-[var(--shadow-soft)]' : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--text-primary)]'}`}
              >
                {preset.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!loading && offers.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in border-[var(--border)]" style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl border border-[var(--border)]
              bg-[color-mix(in_srgb,var(--surface-2)_84%,var(--text-primary)_16%)]
              flex items-center justify-center">
              <IndianRupee size={28} className="text-[var(--text-muted)]" />
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-[var(--border)] scale-125 opacity-40" />
          </div>
          <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mb-2">No offers yet</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs leading-relaxed">
            Add your offers to compare them side by side and make an informed decision.
          </p>
          <Button
            variant="accent"
            onClick={() => setModalOpen(true)}
            className="h-11 px-6 rounded-input font-semibold shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)]"
          >
            <Plus size={14} /> Add First Offer
          </Button>
        </div>
      )}

      {/* ── Comparison table ──────────────────────────────────────── */}
      {offers.length > 0 && (
        <div
          className={`
            card overflow-hidden border-[var(--border)]
            transition-all duration-500 delay-75 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}
        >
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[280px] sm:min-w-[500px] md:min-w-[600px] lg:min-w-[700px]">

              {/* Column headers */}
              <thead>
                <tr className="border-b border-[var(--border)]" style={{ background: themedWash }}>
                  <td className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest
                    text-[var(--text-muted)] w-32">
                    Offer
                  </td>
                  {offers.map((offer, i) => (
                    <td
                      key={offer._id}
                      className="px-5 py-4 min-w-[200px] animate-slide-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo logo={offer.company?.logo} name={offer.company?.name} size="sm" />
                          <div>
                            <p className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                              {offer.company?.name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{offer.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(offer._id)}
                          className="p-1.5 rounded-lg border border-transparent text-[var(--text-muted)]
                            hover:text-[var(--danger)] hover:bg-[var(--danger)]/12
                            hover:border-[var(--danger)]/25 transition-all duration-150 shrink-0
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </thead>

              <tbody>

                {/* Status */}
                <SectionRow label="Status" shaded>
                  {offers.map(o => {
                    const cfg = statusCfg[o.status] || statusCfg.considering;
                    return (
                      <td key={o._id} className="px-5 py-3.5">
                        <div className="relative inline-block">
                          <select
                            value={o.status}
                            onChange={e => handleStatus(o._id, e.target.value)}
                            className={`text-xs font-bold pl-3 pr-7 py-1.5 rounded-lg border
                              outline-none cursor-pointer appearance-none
                              transition-all duration-200
                              ${cfg.color} ${cfg.bg} ${focusRing}`}
                          >
                            <option value="considering">Considering</option>
                            <option value="accepted">Accepted ✓</option>
                            <option value="declined">Declined</option>
                          </select>
                          <ChevronDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2
                            pointer-events-none ${cfg.color}`} />
                        </div>
                      </td>
                    );
                  })}
                </SectionRow>

                {/* Total CTC */}
                <SectionRow label="Total CTC">
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5">
                      <span className={`font-display text-lg font-bold leading-none
                        ${isBest(o.ctc, ctcValues) ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                        ₹{o.ctc} LPA
                      </span>
                      {isBest(o.ctc, ctcValues) && <BestTag />}
                    </td>
                  ))}
                </SectionRow>

                {/* Base */}
                <SectionRow label="Base Salary" shaded>
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">
                      {o.base
                        ? `₹${o.base} LPA`
                        : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                  ))}
                </SectionRow>

                {/* Bonus */}
                <SectionRow label="Bonus">
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">
                      {o.bonus ? (
                        <>
                          <span className={isBest(o.bonus, bonusValues)
                            ? 'text-[var(--success)] font-bold' : ''}>
                            ₹{o.bonus} LPA
                          </span>
                          {isBest(o.bonus, bonusValues) && <BestTag />}
                        </>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                  ))}
                </SectionRow>

                {/* Joining bonus */}
                <SectionRow label="Joining Bonus" shaded>
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">
                      {o.joiningBonus ? (
                        <span className={isBest(o.joiningBonus, joiningBonusValues)
                          ? 'text-[var(--success)] font-bold' : ''}>
                          ₹{o.joiningBonus} LPA
                        </span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                  ))}
                </SectionRow>

                {/* Work mode */}
                <SectionRow label="Work Mode">
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5 text-sm text-[var(--text-secondary)] capitalize">
                      {o.workMode || 'onsite'}
                    </td>
                  ))}
                </SectionRow>

                {/* Location */}
                <SectionRow label="Location" shaded>
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5">
                      {o.location ? (
                        <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                          <MapPin size={11} className="text-[var(--text-muted)] shrink-0" />
                          {o.location}
                        </span>
                      ) : <span className="text-[var(--text-muted)] text-sm">—</span>}
                    </td>
                  ))}
                </SectionRow>

                {/* Joining date */}
                <SectionRow label="Joining Date">
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5">
                      {o.joiningDate ? (
                        <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                          <Calendar size={11} className="text-[var(--text-muted)] shrink-0" />
                          {new Date(o.joiningDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      ) : <span className="text-[var(--text-muted)] text-sm">—</span>}
                    </td>
                  ))}
                </SectionRow>

                {/* Bond */}
                <SectionRow label="Bond" shaded>
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5">
                      {o.bond?.hasBond ? (
                        <span className="inline-flex items-center gap-1.5 text-xs
                          text-[var(--warning)] font-semibold
                          bg-[var(--warning)]/12 border border-[var(--warning)]/20
                          px-2.5 py-1 rounded-lg">
                          <AlertTriangle size={11} />
                          {o.bond.duration}mo · ₹{o.bond.amount}L
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs
                          text-[var(--success)] font-semibold
                          bg-[var(--success-bg)] border border-[var(--success-border)]
                          px-2.5 py-1 rounded-lg">
                          <CheckCircle size={11} />
                          No bond
                        </span>
                      )}
                    </td>
                  ))}
                </SectionRow>

                {/* Perks */}
                <SectionRow label="Perks">
                  {offers.map(o => (
                    <td key={o._id} className="px-5 py-3.5">
                      {o.perks?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {o.perks.map(p => (
                            <span key={p}
                              className="text-[10px] px-2 py-0.5 rounded-md
                                bg-[var(--surface-2)] border border-[var(--border)]
                                text-[var(--text-muted)] font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                    </td>
                  ))}
                </SectionRow>

                {/* Notes (conditional) */}
                {offers.some(o => o.notes) && (
                  <SectionRow label="Notes" shaded>
                    {offers.map(o => (
                      <td key={o._id} className="px-5 py-3.5 text-xs
                        text-[var(--text-muted)] max-w-[200px]">
                        {o.notes || <span className="opacity-40">—</span>}
                      </td>
                    ))}
                  </SectionRow>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Decision summary ──────────────────────────────────────── */}
      {offers.length >= 2 && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div
            className={`
              card p-6 lg:col-span-2 border-[var(--border)]
              transition-all duration-500 delay-150 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-7 h-7 rounded-lg bg-[var(--warning)]/12 border border-[var(--warning)]/20 flex items-center justify-center">
                <Star size={13} className="text-[var(--warning)]" fill="currentColor" />
              </span>
              <h2 className="font-display font-bold text-[var(--text-primary)]">Recommendation Summary</h2>
            </div>

            {recommendationSummary ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <DecisionCard
                  label="Top Match"
                  icon={TrendingUp}
                  iconColor="text-[var(--success)]"
                  bg="bg-[var(--success-bg)]"
                  border="border-[var(--success-border)]"
                  title={recommendationSummary.top?.company?.name || '—'}
                  sub={`${recommendationSummary.top?.score || 0}/100`}
                />
                <DecisionCard
                  label="Runner Up"
                  icon={Award}
                  iconColor="text-[var(--accent)]"
                  bg="bg-[var(--accent)]/5"
                  border="border-[var(--accent)]/20"
                  title={recommendationSummary.second?.company?.name || '—'}
                  sub={recommendationSummary.second ? `${recommendationSummary.second.score}/100` : '—'}
                />
                <DecisionCard
                  label="Average Score"
                  icon={Shield}
                  iconColor="text-[var(--warning)]"
                  bg="bg-[var(--warning)]/10"
                  border="border-[var(--warning)]/20"
                  title={`${recommendationSummary.averageScore}/100`}
                  sub={`${offers.length} offers compared`}
                />
                <DecisionCard
                  label="Highest CTC"
                  icon={TrendingUp}
                  iconColor="text-[var(--success)]"
                  bg="bg-[var(--success-bg)]"
                  border="border-[var(--success-border)]"
                  title={offers.find(o => o.ctc === Math.max(...ctcValues))?.company?.name || '—'}
                  sub={`₹${Math.max(...ctcValues)} LPA`}
                />
              </div>
            ) : null}
          </div>

          <div className={`
              card p-6 border-[var(--border)]
              transition-all duration-500 delay-150 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-7 h-7 rounded-lg bg-[var(--accent)]/12 border border-[var(--accent)]/20 flex items-center justify-center">
                <Zap size={13} className="text-[var(--accent)]" />
              </span>
              <h2 className="font-display font-bold text-[var(--text-primary)]">Why this helps</h2>
            </div>
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <p>Compensation, growth, location, brand, and work-life balance are weighted according to the selected comparison mode.</p>
              <p>Use the templates in the add-offer modal to capture joining bonus, remote/hybrid mode, and bond details consistently.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────── */}
      <AddOfferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        companies={companies}
        onAdded={fetchOffers}
      />
    </div>
  );
};

export default OfferComparisonPage;