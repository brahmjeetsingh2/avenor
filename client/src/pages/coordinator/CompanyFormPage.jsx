import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, ArrowLeft, ArrowRight, X, Check,
  Building2, FileText, Shield, Eye, Globe,
  MapPin, Calendar, IndianRupee, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/* ─── Constants ──────────────────────────────────────────────────────── */
const SECTORS  = ['Technology','Finance','Consulting','Core Engineering','Analytics','E-Commerce','Healthcare','Other'];
const TYPES    = [
  { id: 'product',  label: 'Product'  },
  { id: 'service',  label: 'Service'  },
  { id: 'startup',  label: 'Startup'  },
  { id: 'psu',      label: 'PSU'      },
  { id: 'mnc',      label: 'MNC'      },
];
const BRANCHES = [
  'Computer Science','Information Technology','Electronics & Communication',
  'Electrical Engineering','Mechanical Engineering','Civil Engineering',
  'Chemical Engineering','Other',
];

const STEPS = [
  { label: 'Basic Info',      icon: Building2 },
  { label: 'Details & Roles', icon: FileText   },
  { label: 'Eligibility',     icon: Shield     },
  { label: 'Review',          icon: Eye        },
];

const EMPTY = {
  name: '', logo: '', description: '', sector: '', type: '',
  ctc: { min: '', max: '' },
  roles: [],
  eligibility: { cgpa: '', branches: [], backlogs: '' },
  documents: [],
  applicationDeadline: '',
  websiteUrl: '',
  location: '',
};

/* ─── Shared atoms ───────────────────────────────────────────────────── */
const Label = ({ children, required, hint }) => (
  <div className="flex items-baseline justify-between mb-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
      {children}
      {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
    </label>
    {hint && <span className="text-[10px] text-[var(--text-muted)] font-medium">{hint}</span>}
  </div>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-[11px] text-[var(--danger)] font-medium mt-1">{msg}</p> : null;

const ic = (err) =>
  `input text-sm transition-all duration-200 ${err
    ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(255,69,58,0.12)]' : ''}`;

/* ─── Step progress indicator ────────────────────────────────────────── */
const StepIndicator = ({ current }) => (
  <div className="mb-8">
    {/* Icon steps */}
    <div className="flex items-center justify-between mb-3">
      {STEPS.map((s, idx) => {
        const done   = idx < current;
        const active = idx === current;
        const StepIcon = s.icon;
        return (
          <div key={s.label} className="flex flex-col items-center gap-1.5 flex-1">
            <div className={`
              w-9 h-9 rounded-xl flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${done
                ? 'bg-[var(--status-success)] text-[var(--text-reverse)] scale-95'
                : active
                  ? 'bg-[var(--accent)] text-[var(--text-reverse)] shadow-[0_0_20px_rgba(17,17,17,0.28)]'
                  : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]'
              }
            `}>
              {done ? <Check size={14} strokeWidth={2.5} /> : <StepIcon size={14} />}
            </div>
            <span className={`
              text-[9px] font-bold uppercase tracking-wider hidden sm:block
              transition-colors duration-200
              ${active ? 'text-[var(--accent)]' : done ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}
            `}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>

    {/* Progress bar */}
    <div className="relative h-1 bg-[var(--border)] rounded-pill overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-pill transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{
          width: `${(current / (STEPS.length - 1)) * 100}%`,
          background: 'linear-gradient(90deg, var(--accent) 0%, #3d3d3d 100%)',
        }}
      />
    </div>
  </div>
);

/* ─── Pill chip selector ─────────────────────────────────────────────── */
const PillChip = ({ label, active, onClick, activeClass }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      px-3 py-1.5 rounded-xl text-xs font-semibold border
      transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
      ${active
        ? activeClass
        : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]/30 hover:bg-[var(--surface)]'
      }
    `}
  >
    {active && <Check size={10} className="inline mr-1 opacity-80" />}
    {label}
  </button>
);

/* ─── Role tag ───────────────────────────────────────────────────────── */
const RoleTag = ({ role, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
    bg-[var(--accent)]/10 text-[var(--accent)]
    border border-[var(--accent)]/20 text-xs font-semibold
    animate-fade-in">
    {role}
    <button
      onClick={() => onRemove(role)}
      className="hover:text-[var(--danger)] transition-colors duration-150"
    >
      <X size={11} />
    </button>
  </span>
);

/* ─── Review row ─────────────────────────────────────────────────────── */
const ReviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between px-4 py-3
    text-sm hover:bg-[var(--surface-2)] transition-colors duration-150
    border-b border-[var(--border)] last:border-0">
    <span className="text-[var(--text-muted)] font-medium">{label}</span>
    <span className="text-[var(--text-primary)] font-semibold text-right max-w-[60%]">{value}</span>
  </div>
);

/* ─── Main page ──────────────────────────────────────────────────────── */
const CompanyFormPage = () => {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const isEditing = !!id;

  const [step,      setStep]      = useState(0);
  const [form,      setForm]      = useState(EMPTY);
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [mounted,   setMounted]   = useState(false);
  const [roleFocus, setRoleFocus] = useState(false);

  /* Mount animation — resets on step change */
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, [step]);

  /* Load existing company if editing */
  useEffect(() => {
    if (!isEditing) return;
    companyService.getById(id).then(res => {
      const c = res.data?.company || {};
      setForm({
        name:        c.name        || '',
        logo:        c.logo        || '',
        description: c.description || '',
        sector:      c.sector      || '',
        type:        c.type        || '',
        ctc:         { min: c.ctc?.min || '', max: c.ctc?.max || '' },
        roles:       c.roles       || [],
        eligibility: {
          cgpa:     c.eligibility?.cgpa     || '',
          branches: c.eligibility?.branches || [],
          backlogs: c.eligibility?.backlogs ?? '',
        },
        documents:           c.documents           || [],
        applicationDeadline: c.applicationDeadline
          ? c.applicationDeadline.split('T')[0] : '',
        websiteUrl: c.websiteUrl || '',
        location:   c.location   || '',
      });
    }).catch(() => toast.error('Failed to load company'));
  }, [id, isEditing]);

  const set = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
    if (errors[path]) setErrors(e => ({ ...e, [path]: '' }));
  };

  const addRole = () => {
    const r = roleInput.trim();
    if (!r || form.roles.includes(r)) { setRoleInput(''); return; }
    set('roles', [...form.roles, r]);
    setRoleInput('');
  };

  const removeRole = r => set('roles', form.roles.filter(x => x !== r));

  const toggleBranch = b => {
    const branches = form.eligibility.branches.includes(b)
      ? form.eligibility.branches.filter(x => x !== b)
      : [...form.eligibility.branches, b];
    set('eligibility.branches', branches);
  };

  const validate = s => {
    const errs = {};
    if (s === 0) {
      if (!form.name.trim()) errs.name   = 'Company name is required';
      if (!form.sector)      errs.sector = 'Sector is required';
      if (!form.type)        errs.type   = 'Company type is required';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        ctc: { min: Number(form.ctc.min) || 0, max: Number(form.ctc.max) || 0 },
        eligibility: {
          ...form.eligibility,
          cgpa:     Number(form.eligibility.cgpa)     || 0,
          backlogs: Number(form.eligibility.backlogs) || 0,
        },
      };
      if (isEditing) {
        await companyService.update(id, payload);
        toast.success('Company updated');
      } else {
        await companyService.create(payload);
        toast.success('Company created');
      }
      navigate('/coordinator/companies');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[var(--bg)]">
      <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 page-enter">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className={`
          flex items-center gap-3 mb-8
          transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
        `}>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center
              bg-[var(--surface-2)] border border-[var(--border)]
              text-[var(--text-muted)] hover:text-[var(--text-primary)]
              hover:bg-[var(--surface)] hover:border-[var(--accent)]/25
              transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-h2 font-bold text-[var(--text-primary)] tracking-tight">
              {isEditing ? 'Edit Company' : 'Add Company'}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {isEditing
                ? 'Update company details and eligibility'
                : 'Add a new company to the placement calendar'}
            </p>
          </div>
        </div>

        {/* ── Step indicator ───────────────────────────────────────── */}
        <StepIndicator current={step} />

        {/* ── Card ────────────────────────────────────────────────── */}
        <div className={`
          card p-6 space-y-5
          transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>

          {/* ══ STEP 0: Basic Info ══════════════════════════════════ */}
          {step === 0 && (
            <>
              {/* Company name */}
              <div>
                <Label required>Company Name</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Google, Infosys, ISRO"
                  error={errors.name}
                  className={ic(errors.name)}
                />
                <FieldError msg={errors.name} />
              </div>

              {/* Logo URL */}
              <div>
                <Label hint="Optional">Company Logo URL</Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Globe size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                    <Input
                      name="logo"
                      value={form.logo}
                      onChange={e => set('logo', e.target.value)}
                      placeholder="https://logo.clearbit.com/google.com"
                      className="input text-sm pl-9"
                    />
                  </div>
                  {/* Logo preview */}
                  {form.logo && (
                    <div className="w-10 h-10 rounded-xl border border-[var(--border)]
                      bg-white flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={form.logo} alt=""
                        className="w-8 h-8 object-contain"
                        onError={e => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">
                  clearbit.com/logo works great for most companies
                </p>
              </div>

              {/* Sector */}
              <div>
                <Label required>Sector</Label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(s => (
                    <PillChip
                      key={s} label={s}
                      active={form.sector === s}
                      onClick={() => set('sector', s)}
                      activeClass="bg-[var(--accent)]/15 border-[var(--accent)]/40 text-[var(--accent)]"
                    />
                  ))}
                </div>
                <FieldError msg={errors.sector} />
              </div>

              {/* Company type */}
              <div>
                <Label required>Company Type</Label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <PillChip
                      key={t.id} label={t.label}
                      active={form.type === t.id}
                      onClick={() => set('type', t.id)}
                      activeClass="bg-[#555555]/12 border-[#555555]/35 text-[#555555]"
                    />
                  ))}
                </div>
                <FieldError msg={errors.type} />
              </div>
            </>
          )}

          {/* ══ STEP 1: Details & Roles ═════════════════════════════ */}
          {step === 1 && (
            <>
              {/* Description */}
              <div>
                <Label hint="Optional">Description</Label>
                <div className="relative">
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Brief description of the company, what they do, culture…"
                    rows={4}
                    className="input text-sm h-auto py-3 resize-none leading-relaxed"
                  />
                  {form.description.length > 0 && (
                    <span className="absolute bottom-2.5 right-3 text-[10px]
                      text-[var(--text-muted)] font-medium pointer-events-none">
                      {form.description.length}
                    </span>
                  )}
                </div>
              </div>

              {/* CTC range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min CTC (LPA)</Label>
                  <div className="relative">
                    <IndianRupee size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                    <input
                      type="number" value={form.ctc.min}
                      onChange={e => set('ctc.min', e.target.value)}
                      placeholder="e.g. 8"
                      className="input text-sm pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Max CTC (LPA)</Label>
                  <div className="relative">
                    <IndianRupee size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                    <input
                      type="number" value={form.ctc.max}
                      onChange={e => set('ctc.max', e.target.value)}
                      placeholder="e.g. 20"
                      className="input text-sm pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Location + Website */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                    <Input
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                      placeholder="Bangalore, Remote…"
                      className="input text-sm pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label>Website URL</Label>
                  <div className="relative">
                    <Globe size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                    <Input
                      value={form.websiteUrl}
                      onChange={e => set('websiteUrl', e.target.value)}
                      placeholder="https://google.com"
                      className="input text-sm pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <Label>Application Deadline</Label>
                <div className="relative">
                  <Calendar size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2
                    text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type="date"
                    value={form.applicationDeadline}
                    onChange={e => set('applicationDeadline', e.target.value)}
                    className="input text-sm pl-8"
                  />
                </div>
              </div>

              {/* Roles */}
              <div>
                <Label hint="Press Enter to add">Job Roles</Label>
                <div className="flex gap-2">
                  <input
                    value={roleInput}
                    onChange={e => setRoleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRole())}
                    onFocus={() => setRoleFocus(true)}
                    onBlur={() => setRoleFocus(false)}
                    placeholder="e.g. SDE, Data Analyst, DevOps…"
                    className={`input text-sm flex-1 transition-all duration-200
                      ${roleFocus ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(17,17,17,0.11)]' : ''}`}
                  />
                  <button
                    type="button" onClick={addRole}
                    className="btn-primary w-11 h-11 rounded-input shrink-0 flex items-center
                      justify-center relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100
                      bg-gradient-to-r from-transparent via-white/10 to-transparent
                      -translate-x-full group-hover:translate-x-full
                      transition-all duration-700 pointer-events-none" />
                    <Plus size={15} className="relative z-10" />
                  </button>
                </div>
                {form.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.roles.map(r => (
                      <RoleTag key={r} role={r} onRemove={removeRole} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ STEP 2: Eligibility ═════════════════════════════════ */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Minimum CGPA</Label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={form.eligibility.cgpa}
                    onChange={e => set('eligibility.cgpa', e.target.value)}
                    placeholder="e.g. 6.5"
                    className="input text-sm"
                  />
                </div>
                <div>
                  <Label>Max Backlogs Allowed</Label>
                  <input
                    type="number" min="0"
                    value={form.eligibility.backlogs}
                    onChange={e => set('eligibility.backlogs', e.target.value)}
                    placeholder="e.g. 0"
                    className="input text-sm"
                  />
                </div>
              </div>

              {/* Branch selector */}
              <div>
                <Label hint="Leave empty for all branches">Eligible Branches</Label>
                <div className="flex flex-wrap gap-2">
                  {BRANCHES.map(b => {
                    const selected = form.eligibility.branches.includes(b);
                    return (
                      <PillChip
                        key={b} label={b}
                        active={selected}
                        onClick={() => toggleBranch(b)}
                        activeClass="bg-[var(--status-success)]/12 border-[var(--status-success)]/25 text-[var(--status-success)]"
                      />
                    );
                  })}
                </div>
                {form.eligibility.branches.length > 0 && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-2 font-medium">
                    {form.eligibility.branches.length} branch{form.eligibility.branches.length !== 1 ? 'es' : ''} selected
                  </p>
                )}
              </div>
            </>
          )}

          {/* ══ STEP 3: Review ══════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Company card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl
                bg-[var(--surface-2)] border border-[var(--border)]">
                {form.logo ? (
                  <div className="w-14 h-14 rounded-xl bg-white border border-[var(--border)]
                    flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                    <img
                      src={form.logo} alt={form.name}
                      className="w-full h-full object-contain"
                      onError={e => e.target.style.display = 'none'}
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20
                    flex items-center justify-center shrink-0">
                    <Building2 size={22} className="text-[var(--accent)]" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-[var(--text-primary)] text-base leading-tight">
                    {form.name || '—'}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5 capitalize">
                    {form.type && `${form.type} · `}{form.sector || '—'}
                  </p>
                  {/* Type + sector chips */}
                  <div className="flex gap-1.5 mt-2">
                    {form.type && (
                      <span className="badge badge-accent text-[10px]">{form.type}</span>
                    )}
                    {form.sector && (
                      <span className="badge badge-muted text-[10px]">{form.sector}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata rows */}
              <div className="rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
                {[
                  { label: 'CTC',      value: form.ctc.max ? `₹${form.ctc.min}–${form.ctc.max} LPA` : 'Not set' },
                  { label: 'Location', value: form.location    || 'Not set' },
                  { label: 'Deadline', value: form.applicationDeadline || 'Not set' },
                  { label: 'Min CGPA', value: form.eligibility.cgpa    || 'Not set' },
                  { label: 'Roles',    value: form.roles.join(', ')    || 'Not set' },
                  {
                    label: 'Branches',
                    value: form.eligibility.branches.length
                      ? form.eligibility.branches.join(', ')
                      : 'All branches',
                  },
                ].map(({ label, value }) => (
                  <ReviewRow key={label} label={label} value={value} />
                ))}
              </div>

              {/* Description preview */}
              {form.description && (
                <div className="p-3.5 rounded-xl bg-[var(--accent)]/6 border border-[var(--accent)]/15">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
                    Description
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {form.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div className={`
          flex items-center justify-between mt-5
          transition-all duration-500 delay-100 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
        `}>
          <Button
            variant="ghost"
            onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
            className="btn-ghost gap-2 h-11 px-5 rounded-input font-semibold"
          >
            <ArrowLeft size={15} />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              className="btn-primary gap-2 h-11 px-6 rounded-input font-semibold
                relative overflow-hidden group"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-transparent via-white/10 to-transparent
                -translate-x-full group-hover:translate-x-full
                transition-all duration-700 pointer-events-none" />
              <span className="relative z-10">Continue</span>
              <ArrowRight size={15} className="relative z-10" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={loading}
              className="btn-primary gap-2 h-11 px-6 rounded-input font-semibold
                relative overflow-hidden group"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-transparent via-white/10 to-transparent
                -translate-x-full group-hover:translate-x-full
                transition-all duration-700 pointer-events-none" />
              <Check size={15} className="relative z-10" />
              <span className="relative z-10">
                {isEditing ? 'Save Changes' : 'Create Company'}
              </span>
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CompanyFormPage;