import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Check,
  Eye, EyeOff, ChevronDown, Clock, Tag,
  Lightbulb, User, Building2, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import experienceService from '../../services/experienceService';
import companyService from '../../services/companyService';
import useAuth from '../../hooks/useAuth';
import { ROUND_CFG, DifficultyStars } from '../../utils/experienceHelpers';
import Button from '../../components/ui/Button';

/* ─── Constants ──────────────────────────────────────────────────────── */
const STEPS = [
  { label: 'Company & Role', icon: Building2 },
  { label: 'Rounds',         icon: Clock      },
  { label: 'Verdict & Tips', icon: Lightbulb  },
  { label: 'Preview',        icon: Eye        },
];

const ROUND_TYPES  = Object.entries(ROUND_CFG).map(([id, cfg]) => ({ id, ...cfg }));
const EMPTY_ROUND  = { type: 'technical', questions: [''], experience: '', duration: '' };
const EXPERIENCE_DRAFT_KEY = 'avenor:experience-draft';

const VERDICT_CFG = [
  { id: 'selected',   label: 'Selected',   emoji: '🎉',
    active: 'border-[var(--status-success)]/25 bg-[var(--status-success)]/10 text-[var(--status-success)]' },
  { id: 'rejected',   label: 'Rejected',   emoji: '❌',
    active: 'border-[var(--danger)]/25  bg-[var(--danger)]/10  text-[var(--danger)]'  },
  { id: 'waitlisted', label: 'Waitlisted', emoji: '⏳',
    active: 'border-[var(--warning)]/25 bg-[var(--warning)]/10 text-[var(--warning)]' },
];

/* ─── Shared field label ─────────────────────────────────────────────── */
const Label = ({ children, required, hint }) => (
  <div className="flex items-baseline justify-between mb-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
      {children}
      {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
    </label>
    {hint && <span className="text-[10px] text-[var(--text-muted)] font-medium">{hint}</span>}
  </div>
);

/* ─── Error message ──────────────────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? <p className="text-[11px] text-[var(--danger)] font-medium mt-1">{msg}</p> : null;

/* ─── Shared input class ─────────────────────────────────────────────── */
const ic = (err) =>
  `input text-sm transition-all duration-200 ${err ? 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(255,69,58,0.12)]' : ''}`;

/* ─── Step progress bar ──────────────────────────────────────────────── */
const StepProgress = ({ current, total }) => (
  <div className="mb-8">
    {/* Step labels */}
    <div className="flex items-center justify-between mb-3">
      {STEPS.map((s, i) => {
        const done    = i < current;
        const active  = i === current;
        const StepIcon = s.icon;
        return (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <div className={`
              w-8 h-8 rounded-xl flex items-center justify-center
              transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${done   ? 'bg-[var(--status-success)] text-[var(--text-reverse)] scale-95'         : ''}
              ${active ? 'bg-[var(--accent)] text-[var(--text-reverse)] shadow-[0_0_16px_rgba(17,17,17,0.28)]' : ''}
              ${!done && !active ? 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]' : ''}
            `}>
              {done
                ? <Check size={13} strokeWidth={2.5} />
                : <StepIcon size={13} />
              }
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block
              transition-colors duration-200
              ${active ? 'text-[var(--accent)]' : done ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>

    {/* Progress track */}
    <div className="relative h-1 bg-[var(--border)] rounded-pill overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-pill transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{
          width: `${(current / (total - 1)) * 100}%`,
          background: 'linear-gradient(90deg, var(--accent) 0%, #3d3d3d 100%)',
        }}
      />
    </div>
  </div>
);

/* ─── Toggle switch ──────────────────────────────────────────────────── */
const Toggle = ({ on, color = 'bg-[var(--accent)]' }) => (
  <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors duration-200
    ${on ? color : 'bg-[var(--border)]'}`}>
    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
      ${on ? 'translate-x-4' : 'translate-x-0'}`} />
  </div>
);

/* ─── Round card ─────────────────────────────────────────────────────── */
const RoundCard = ({ round, ri, roundCount, onSetRound, onRemoveRound, onAddQuestion, onRemoveQuestion, onSetQuestion }) => {
  const [open, setOpen] = useState(true);
  const cfg = ROUND_CFG[round.type] || {};

  return (
    <div className={`
      rounded-2xl border overflow-hidden
      transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
      ${open ? 'border-[var(--border)]' : 'border-[var(--border)]/60'}
      bg-[var(--surface)]
    `}>
      {/* Round header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none
          hover:bg-[var(--surface-2)] transition-colors duration-150"
        onClick={() => setOpen(p => !p)}
      >
        {/* Number badge */}
        <span className="w-7 h-7 rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]
          text-xs font-bold flex items-center justify-center shrink-0 border border-[var(--accent)]/20">
          {ri + 1}
        </span>

        {/* Type select — stop propagation so clicking it doesn't toggle collapse */}
        <div onClick={e => e.stopPropagation()} className="relative">
          <select
            value={round.type}
            onChange={e => onSetRound(ri, 'type', e.target.value)}
            className="input text-sm h-9 py-0 pl-3 pr-8 appearance-none w-auto min-w-[140px]"
          >
            {ROUND_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2
            text-[var(--text-muted)] pointer-events-none" />
        </div>

        {/* Duration */}
        <div onClick={e => e.stopPropagation()}>
          <input
            value={round.duration}
            onChange={e => onSetRound(ri, 'duration', e.target.value)}
            placeholder="Duration…"
            className="input text-sm h-9 py-0 w-32"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Collapse chevron */}
          <ChevronDown size={14}
            className={`text-[var(--text-muted)] transition-transform duration-200
              ${open ? 'rotate-180' : ''}`} />

          {roundCount > 1 && (
            <button
              onClick={e => { e.stopPropagation(); onRemoveRound(ri); }}
              className="p-1.5 rounded-lg text-[var(--text-muted)]
                hover:text-[var(--danger)] hover:bg-[var(--danger)]/12
                transition-all duration-150"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible body */}
      <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[var(--border)]">

          {/* Questions */}
          <div className="space-y-2 pt-3">
            <Label>Questions Asked</Label>
            <div className="space-y-2">
              {round.questions.map((q, qi) => (
                <div key={qi} className="flex gap-2 items-start group/q animate-slide-up"
                  style={{ animationDelay: `${qi * 40}ms` }}>
                  <span className="w-5 h-9 flex items-center justify-center text-[10px]
                    font-bold text-[var(--text-muted)] shrink-0 mt-0">
                    {qi + 1}
                  </span>
                  <input
                    value={q}
                    onChange={e => onSetQuestion(ri, qi, e.target.value)}
                    placeholder={`Question ${qi + 1}…`}
                    className="input text-sm flex-1"
                  />
                  {round.questions.length > 1 && (
                    <button
                      onClick={() => onRemoveQuestion(ri, qi)}
                      className="p-2 rounded-xl text-[var(--text-muted)]
                        hover:text-[var(--danger)] hover:bg-[var(--danger)]/12
                        transition-all duration-150 opacity-0 group-hover/q:opacity-100 mt-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => onAddQuestion(ri)}
              className="flex items-center gap-1.5 text-xs font-semibold
                text-[var(--accent)] hover:text-[var(--accent)]/80
                transition-colors duration-150 mt-1"
            >
              <Plus size={12} /> Add question
            </button>
          </div>

          {/* Experience textarea */}
          <div>
            <Label hint="Optional">Your Experience</Label>
            <textarea
              value={round.experience}
              onChange={e => onSetRound(ri, 'experience', e.target.value)}
              placeholder="Describe how the round went, what you felt, any round-specific tips…"
              rows={3}
              className="input text-sm h-auto py-3 resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Preview row ────────────────────────────────────────────────────── */
const PreviewRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3
    border-b border-[var(--border)] last:border-0">
    <span className="text-sm text-[var(--text-muted)]">{label}</span>
    <span className="text-sm text-[var(--text-primary)] font-semibold text-right max-w-[60%] truncate">
      {value}
    </span>
  </div>
);

/* ─── Main page ──────────────────────────────────────────────────────── */
const PostExperiencePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step,      setStep]      = useState(0);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [form, setForm] = useState({
    company: '', role: '', year: new Date().getFullYear(), batch: '',
    rounds: [{ ...EMPTY_ROUND }],
    verdict: 'selected', difficulty: 3,
    tips: '', isAnonymous: false, tags: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const key = `${EXPERIENCE_DRAFT_KEY}:${user?._id || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {}
  }, [user?._id]);

  useEffect(() => {
    const key = `${EXPERIENCE_DRAFT_KEY}:${user?._id || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(form));
  }, [form, user?._id]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    companyService.getAll({ limit: 100 }).then(r => setCompanies(r.data)).catch(() => {});
  }, []);

  /* Reset mount anim on step change */
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, [step]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  /* Round helpers */
  const addRound    = () => setForm(p => ({ ...p, rounds: [...p.rounds, { ...EMPTY_ROUND }] }));
  const removeRound = (i) => setForm(p => ({ ...p, rounds: p.rounds.filter((_, idx) => idx !== i) }));
  const setRound    = (i, k, v) => setForm(p => {
    const rounds = [...p.rounds];
    rounds[i] = { ...rounds[i], [k]: v };
    return { ...p, rounds };
  });
  const addQuestion    = (ri) => setForm(p => {
    const r = [...p.rounds];
    r[ri] = { ...r[ri], questions: [...r[ri].questions, ''] };
    return { ...p, rounds: r };
  });
  const removeQuestion = (ri, qi) => setForm(p => {
    const r = [...p.rounds];
    r[ri].questions = r[ri].questions.filter((_, i) => i !== qi);
    return { ...p, rounds: r };
  });
  const setQuestion = (ri, qi, v) => setForm(p => {
    const r = [...p.rounds];
    const q = [...r[ri].questions];
    q[qi] = v;
    r[ri] = { ...r[ri], questions: q };
    return { ...p, rounds: r };
  });

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.company)       e.company = 'Select a company';
      if (!form.role.trim())   e.role    = 'Role is required';
    }
    if (s === 1 && form.rounds.length === 0) e.rounds = 'Add at least one round';
    return e;
  };

  const handleNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        rounds: form.rounds.map(r => ({ ...r, questions: r.questions.filter(q => q.trim()) })),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const res = await experienceService.create(payload);
      toast.success('Experience posted! 🎉');
      localStorage.removeItem(`${EXPERIENCE_DRAFT_KEY}:${user?._id || 'guest'}`);

      if (user?.role === 'alumni') {
        navigate('/alumni/experiences', {
          state: {
            experienceSummary: {
              company: companyName,
              role: form.role,
            },
          },
        });
      } else {
        navigate(`/experiences/${res.data.experience._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post experience');
    } finally {
      setLoading(false);
    }
  };

  const companyName = companies.find(c => c._id === form.company)?.name || '—';

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
            onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
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
              Share Your Experience
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {STEPS[step].label}
            </p>
          </div>
        </div>

        {/* ── Step progress ───────────────────────────────────────── */}
        <StepProgress current={step} total={STEPS.length} />

        {/* ── Card ────────────────────────────────────────────────── */}
        <div className={`
          card p-6 space-y-5
          transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>

          {/* ══ STEP 0: Company & Role ══════════════════════════════ */}
          {step === 0 && (
            <>
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
                  placeholder="e.g. Software Development Engineer, Data Analyst…"
                  className={ic(errors.role)}
                />
                <FieldError msg={errors.role} />
              </div>

              {/* Year + Batch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Year</Label>
                  <div className="relative">
                    <select
                      value={form.year}
                      onChange={e => set('year', Number(e.target.value))}
                      className="input text-sm appearance-none pr-9"
                    >
                      {[2025,2024,2023,2022,2021,2020].map(y =>
                        <option key={y} value={y}>{y}</option>
                      )}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2
                      text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <Label hint="Optional">Your Batch</Label>
                  <input
                    value={form.batch}
                    onChange={e => set('batch', e.target.value)}
                    placeholder="e.g. 2025"
                    maxLength={4}
                    className="input text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* ══ STEP 1: Rounds ══════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-3">
              {errors.rounds && (
                <p className="text-sm text-[var(--danger)] font-medium">{errors.rounds}</p>
              )}

              {form.rounds.map((round, ri) => (
                <div
                  key={ri}
                  className="animate-slide-up"
                  style={{ animationDelay: `${ri * 60}ms` }}
                >
                  <RoundCard
                    round={round} ri={ri} roundCount={form.rounds.length}
                    onSetRound={setRound} onRemoveRound={removeRound}
                    onAddQuestion={addQuestion} onRemoveQuestion={removeQuestion}
                    onSetQuestion={setQuestion}
                  />
                </div>
              ))}

              {/* Add round */}
              <button
                onClick={addRound}
                className="w-full flex items-center justify-center gap-2
                  py-3.5 rounded-2xl border-2 border-dashed border-[var(--border)]
                  text-sm font-semibold text-[var(--text-muted)]
                  hover:border-[var(--accent)]/40 hover:text-[var(--accent)]
                  hover:bg-[var(--accent)]/4
                  transition-all duration-200"
              >
                <Plus size={15} /> Add Another Round
              </button>
            </div>
          )}

          {/* ══ STEP 2: Verdict & Tips ══════════════════════════════ */}
          {step === 2 && (
            <>
              {/* Verdict */}
              <div>
                <Label required>Final Verdict</Label>
                <div className="grid grid-cols-3 gap-2.5 mt-1">
                  {VERDICT_CFG.map(v => (
                    <button
                      key={v.id}
                      onClick={() => set('verdict', v.id)}
                      className={`
                        py-3.5 rounded-xl border-2 text-sm font-bold
                        transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                        flex flex-col items-center gap-1.5
                        ${form.verdict === v.id
                          ? `${v.active} scale-[1.02] shadow-[0_0_0_1px_currentColor]/10`
                          : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-2)] hover:border-[var(--border)] hover:bg-[var(--surface)]'
                        }
                      `}
                    >
                      <span className="text-xl leading-none">{v.emoji}</span>
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <Label hint="1 = Easy · 5 = Very Hard">Overall Difficulty</Label>
                <div className="flex items-center gap-2 mt-1">
                  {[1,2,3,4,5].map(d => (
                    <button
                      key={d}
                      onClick={() => set('difficulty', d)}
                      className={`
                        w-11 h-11 rounded-xl border-2 font-bold text-sm
                        transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                        ${form.difficulty === d
                          ? 'bg-[var(--warning)]/15 border-[var(--warning)]/25 text-[var(--warning)] scale-110 shadow-[0_0_12px_rgba(38,38,38,0.15)]'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--warning)]/30 hover:bg-[var(--warning)]/10'
                        }
                      `}
                    >
                      {d}
                    </button>
                  ))}
                  <DifficultyStars value={form.difficulty} size={16} className="ml-2" />
                </div>
              </div>

              {/* Tips */}
              <div>
                <Label hint="Optional">Tips for Juniors</Label>
                <div className="relative">
                  <textarea
                    value={form.tips}
                    onChange={e => set('tips', e.target.value)}
                    placeholder="What should juniors know? What helped you? What would you do differently?"
                    rows={4}
                    className="input text-sm h-auto py-3 resize-none leading-relaxed"
                  />
                  {form.tips.length > 0 && (
                    <span className="absolute bottom-2.5 right-3 text-[10px]
                      text-[var(--text-muted)] font-medium pointer-events-none">
                      {form.tips.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label hint="Comma separated">Tags</Label>
                <div className="relative">
                  <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2
                    text-[var(--text-muted)] pointer-events-none" />
                  <input
                    value={form.tags}
                    onChange={e => set('tags', e.target.value)}
                    placeholder="e.g. DSA, system design, puzzles, STAR method"
                    className="input text-sm pl-9"
                  />
                </div>
                {/* Live tag preview */}
                {form.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                      <span key={i}
                        className="chip text-[11px] py-0.5 px-2.5 animate-fade-in">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous toggle */}
              <button
                type="button"
                onClick={() => set('isAnonymous', !form.isAnonymous)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-xl border-2
                  cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                  ${form.isAnonymous
                    ? 'border-[var(--accent)]/40 bg-[var(--accent)]/6'
                    : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border)]'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={15}
                    className={form.isAnonymous ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                  <div className="text-left">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Post Anonymously</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Your name won't be shown on this experience
                    </p>
                  </div>
                </div>
                <Toggle on={form.isAnonymous} />
              </button>
            </>
          )}

          {/* ══ STEP 3: Preview ═════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Summary card */}
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--text-primary)] text-base">{companyName}</p>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                      {form.role} · {form.year}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${
                    form.verdict === 'selected'   ? 'badge-success' :
                    form.verdict === 'rejected'   ? 'badge-danger'  : 'badge-warning'
                  }`}>
                    {form.verdict.charAt(0).toUpperCase() + form.verdict.slice(1)}
                  </span>
                </div>

                <DifficultyStars value={form.difficulty} />

                {/* Round type chips */}
                <div className="flex flex-wrap gap-1.5">
                  {form.rounds.map((r, i) => (
                    <span key={i}
                      className={`badge text-[10px] ${ROUND_CFG[r.type]?.bg} ${ROUND_CFG[r.type]?.color}`}>
                      {ROUND_CFG[r.type]?.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metadata rows */}
              <div className="rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
                {[
                  { label: 'Rounds',    value: `${form.rounds.length} round${form.rounds.length !== 1 ? 's' : ''}` },
                  { label: 'Total Qs', value: form.rounds.reduce((a, r) => a + r.questions.filter(q => q.trim()).length, 0) },
                  { label: 'Posted as', value: form.isAnonymous ? 'Anonymous' : 'Your name' },
                  { label: 'Tags',      value: form.tags || 'None' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3
                    text-sm hover:bg-[var(--surface-2)] transition-colors duration-150">
                    <span className="text-[var(--text-muted)]">{label}</span>
                    <span className="text-[var(--text-primary)] font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Tips preview */}
              {form.tips && (
                <div className="p-3.5 rounded-xl bg-[var(--accent)]/6 border border-[var(--accent)]/15">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-2">
                    Tips for Juniors
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{form.tips}</p>
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
              className="btn-primary gap-2 h-11 px-6 rounded-input font-semibold relative overflow-hidden group"
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
              className="btn-primary gap-2 h-11 px-6 rounded-input font-semibold relative overflow-hidden group"
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-transparent via-white/10 to-transparent
                -translate-x-full group-hover:translate-x-full
                transition-all duration-700 pointer-events-none" />
              <Check size={15} className="relative z-10" />
              <span className="relative z-10">Post Experience</span>
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PostExperiencePage;