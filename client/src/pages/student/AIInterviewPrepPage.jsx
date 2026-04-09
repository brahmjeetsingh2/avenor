import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Sparkles, ChevronDown, Printer,
  RotateCcw, AlertCircle, CheckSquare, Square,
  Zap, BookOpen, Users, Lightbulb, List, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import StudentAIPrepPage from './StudentAIPrepPage';

const API_BASE = '/api';

/* ─── Keyframes injected once ─────────────────────────────────────────────── */
const STYLES = `
@keyframes ht-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0);     }
}
@keyframes ht-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ht-scale-in {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1);    }
}
@keyframes ht-shimmer {
  0%   { background-position: -400% 0; }
  100% { background-position:  400% 0; }
}
@keyframes ht-spin {
  to { transform: rotate(360deg); }
}
@keyframes ht-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1);    }
  50%       { opacity: .5; transform: scale(1.3); }
}
@keyframes ht-bar-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes ht-typing {
  0%, 60%, 100% { opacity: .2; transform: translateY(0);   }
  30%            { opacity: 1;  transform: translateY(-4px); }
}
@keyframes ht-glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(17,17,17,0.15); }
  50%       { box-shadow: 0 0 40px rgba(17,17,17,0.30); }
}
@keyframes ht-check-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.25); }
  100% { transform: scale(1); opacity: 1; }
}

.ht-fade-up   { animation: ht-fade-up   0.4s cubic-bezier(0.2,0.8,0.2,1) both; }
.ht-scale-in  { animation: ht-scale-in  0.35s cubic-bezier(0.2,0.8,0.2,1) both; }
.ht-fade-in   { animation: ht-fade-in   0.3s ease both; }
.ht-glow-live { animation: ht-glow-pulse 2s ease-in-out infinite; }

.ht-skeleton {
  background: linear-gradient(90deg,
    var(--surface-2) 25%,
    var(--border)    50%,
    var(--surface-2) 75%
  );
  background-size: 400% 100%;
  animation: ht-shimmer 1.8s linear infinite;
  border-radius: 6px;
}

.ht-typing-dot {
  display: inline-block;
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--accent);
}
.ht-typing-dot:nth-child(1) { animation: ht-typing 1.2s 0s    infinite; }
.ht-typing-dot:nth-child(2) { animation: ht-typing 1.2s 0.2s  infinite; }
.ht-typing-dot:nth-child(3) { animation: ht-typing 1.2s 0.4s  infinite; }
`;

const injectStyles = () => {
  if (!document.getElementById('ai-prep-styles')) {
    const el = document.createElement('style');
    el.id = 'ai-prep-styles';
    el.textContent = STYLES;
    document.head.appendChild(el);
  }
};

/* ─── Rate limit badge ──────────────────────────────────────────────────────── */
const RateBadge = ({ used, limit }) => {
  const remaining = limit - used;
  const color = remaining === 0 ? 'var(--danger)' : remaining <= 2 ? 'var(--warning)' : 'var(--status-success)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 12, height: 4, borderRadius: 999,
              background: i < used ? 'var(--accent)' : 'var(--border)',
              transition: `background 0.3s ease ${i * 60}ms`,
            }}
          />
        ))}
      </div>
      <span style={{ fontWeight: 600, color }}>{remaining}/{limit} left today</span>
    </div>
  );
};

/* ─── Searchable company dropdown ───────────────────────────────────────────── */
const CompanySelect = ({ companies, value, onChange }) => {
  const [search, setSearch] = useState('');
  const [open,   setOpen]   = useState(false);
  const ref                 = useRef(null);
  const selected            = companies.find(c => c._id === value);
  const filtered            = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '12px 16px',
          borderRadius:   'var(--radius-input)',
          border:         `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          background:     'var(--surface)',
          fontSize:       14,
          textAlign:      'left',
          cursor:         'pointer',
          transition:     'border-color 0.18s ease, box-shadow 0.18s ease',
          boxShadow:      open ? '0 0 0 3px rgba(17,17,17,0.11)' : 'none',
          color:          selected ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight:     selected ? 600 : 400,
          outline:        'none',
        }}
      >
        {selected ? selected.name : 'Select a company…'}
        <ChevronDown
          size={15}
          style={{
            color:      'var(--text-muted)',
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          className="ht-scale-in"
          style={{
            position:     'absolute',
            top:          'calc(100% + 6px)',
            left:         0, right: 0,
            background:   'var(--surface)',
            border:       '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            boxShadow:    'var(--shadow-hover)',
            zIndex:       40,
            maxHeight:    240,
            overflowY:    'auto',
            padding:      6,
          }}
        >
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies…"
            style={{
              width:        '100%',
              padding:      '8px 12px',
              fontSize:     13,
              borderRadius: 8,
              border:       '1px solid var(--border)',
              background:   'var(--surface-2)',
              color:        'var(--text-primary)',
              outline:      'none',
              marginBottom: 4,
              boxSizing:    'border-box',
            }}
          />
          {filtered.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px' }}>No companies found</p>
          ) : filtered.map(c => (
            <button
              key={c._id}
              onClick={() => { onChange(c._id); setSearch(''); setOpen(false); }}
              style={{
                width:        '100%',
                display:      'flex',
                alignItems:   'center',
                gap:          10,
                padding:      '9px 12px',
                borderRadius: 8,
                fontSize:     13,
                textAlign:    'left',
                cursor:       'pointer',
                border:       'none',
                background:   c._id === value ? 'rgba(17,17,17,0.09)' : 'transparent',
                color:        c._id === value ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight:   c._id === value ? 700 : 400,
                transition:   'background 0.12s ease',
              }}
              onMouseEnter={e => { if (c._id !== value) e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={e => { if (c._id !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {c.logo && (
                <img src={c.logo} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'contain', background: '#fff' }}
                  onError={e => e.target.style.display = 'none'} />
              )}
              {c.name}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{c.sector}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Section config ────────────────────────────────────────────────────────── */
const SECTION_ICONS = {
  'Interview Process Overview': BookOpen,
  'Round-wise Breakdown':       List,
  'Top Asked Questions':        ClipboardList,
  'Preparation Checklist':      CheckSquare,
  'Tips from Seniors':          Lightbulb,
};

const SECTION_STYLE = {
  'Interview Process Overview': { iconBg: 'rgba(17,17,17,0.09)',  iconColor: 'var(--accent)'   },
  'Round-wise Breakdown':       { iconBg: 'rgba(17,17,17,0.08)',  iconColor: 'var(--accent)'   },
  'Top Asked Questions':        { iconBg: 'rgba(38,38,38,0.10)',  iconColor: 'var(--warning)'  },
  'Preparation Checklist':      { iconBg: 'rgba(34, 197, 94, 0.12)',   iconColor: 'var(--status-success)'  },
  'Tips from Seniors':          { iconBg: 'rgba(38,38,38,0.10)',  iconColor: 'var(--warning)'  },
};

/* ─── Checklist item ────────────────────────────────────────────────────────── */
const ChecklistItem = ({ text, id }) => {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ai-checklist-${id}`) || 'false'); } catch { return false; }
  });

  const toggle = () => {
    const next = !checked;
    setChecked(next);
    try { localStorage.setItem(`ai-checklist-${id}`, JSON.stringify(next)); } catch {}
  };

  return (
    <label
      style={{
        display:    'flex',
        alignItems: 'flex-start',
        gap:        10,
        cursor:     'pointer',
        padding:    '8px 0',
        transition: 'opacity 0.2s ease',
      }}
    >
      <button
        onClick={toggle}
        style={{ flexShrink: 0, marginTop: 1, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
      >
        {checked
          ? <CheckSquare size={16} style={{ color: 'var(--status-success)', animation: 'ht-check-pop 0.3s cubic-bezier(0.2,0.8,0.2,1)' }} />
          : <Square      size={16} style={{ color: 'var(--text-muted)', transition: 'color 0.15s ease' }} />}
      </button>
      <span style={{
        fontSize:        13,
        lineHeight:      1.65,
        color:           checked ? 'var(--text-muted)' : 'var(--text-secondary)',
        textDecoration:  checked ? 'line-through' : 'none',
        transition:      'color 0.2s ease, text-decoration 0.2s ease',
      }}>
        {text}
      </span>
    </label>
  );
};

/* ─── Content renderer ──────────────────────────────────────────────────────── */
const renderContent = (content, sectionKey) => {
  const isChecklist = sectionKey === 'Preparation Checklist';
  const lines = content.split('\n').filter(Boolean);

  return lines.map((line, i) => {
    const checkMatch = line.match(/^-\s*\[[ xX]?\]\s*(.+)/);
    if (checkMatch && isChecklist) {
      return <ChecklistItem key={i} text={checkMatch[1]} id={`${sectionKey}-${i}`} />;
    }
    if (line.match(/^\*\*(.+)\*\*$/)) {
      return (
        <p key={i} style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 14, marginBottom: 4, fontSize: 13 }}>
          {line.replace(/\*\*/g, '')}
        </p>
      );
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginLeft: 16 }}>
          {line.replace(/^[-•]\s*/, '').replace(/\*\*(.+?)\*\*/g, (_, m) => m)}
        </li>
      );
    }
    if (line.match(/^\d+\.\s/)) {
      return (
        <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{line.match(/^\d+\./)[0]}</strong>{' '}
          {line.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, (_, m) => m)}
        </p>
      );
    }
    if (line.trim()) {
      return (
        <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {line.replace(/\*\*(.+?)\*\*/g, (_, m) => m)}
        </p>
      );
    }
    return null;
  });
};

/* ─── Parse sections ────────────────────────────────────────────────────────── */
const parseIntoSections = (text) => {
  const sectionHeaders = Object.keys(SECTION_ICONS);
  const sections = {};
  let currentSection = null;
  let currentContent = [];
  for (const line of text.split('\n')) {
    const header = sectionHeaders.find(h => line.includes(h));
    if (header) {
      if (currentSection) sections[currentSection] = currentContent.join('\n');
      currentSection = header; currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  if (currentSection) sections[currentSection] = currentContent.join('\n');
  return sections;
};

/* ─── Section card ──────────────────────────────────────────────────────────── */
const SectionCard = ({ title, content, animating, index }) => {
  const Icon = SECTION_ICONS[title] || BookOpen;
  const s    = SECTION_STYLE[title] || SECTION_STYLE['Interview Process Overview'];
  const isChecklist = title === 'Preparation Checklist';

  return (
    <div
      className="ht-fade-up"
      style={{
        animationDelay: `${index * 60}ms`,
        background:     'var(--surface)',
        border:         `1px solid ${animating ? 'rgba(17,17,17,0.24)' : 'var(--border)'}`,
        borderRadius:   'var(--radius-card)',
        padding:        '20px 22px',
        boxShadow:      animating ? '0 0 32px rgba(17,17,17,0.09)' : 'var(--shadow-soft)',
        transition:     'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.iconBg, flexShrink: 0 }}>
          <Icon size={16} style={{ color: s.iconColor }} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', flex: 1 }}>{title}</h3>
        {animating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <span className="ht-typing-dot" />
              <span className="ht-typing-dot" />
              <span className="ht-typing-dot" />
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Generating</span>
          </div>
        )}
      </div>

      {/* Accent line */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 14, borderRadius: 1 }} />

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isChecklist ? 0 : 6 }}>
        {renderContent(content, title)}
      </div>
    </div>
  );
};

/* ─── Streaming skeleton card ───────────────────────────────────────────────── */
const SkeletonCard = ({ index }) => (
  <div
    className="ht-fade-up"
    style={{
      animationDelay: `${index * 80}ms`,
      background:     'var(--surface)',
      border:         '1px solid rgba(17,17,17,0.15)',
      borderRadius:   'var(--radius-card)',
      padding:        '20px 22px',
      boxShadow:      '0 0 24px rgba(17,17,17,0.07)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div className="ht-skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div className="ht-skeleton" style={{ height: 14, width: 160, borderRadius: 6 }} />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          <span className="ht-typing-dot" />
          <span className="ht-typing-dot" />
          <span className="ht-typing-dot" />
        </div>
        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Generating</span>
      </div>
    </div>
    <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[80, 95, 70, 85].map((w, i) => (
        <div key={i} className="ht-skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 4 }} />
      ))}
    </div>
  </div>
);

/* ─── Input form card ───────────────────────────────────────────────────────── */
const FormCard = ({ companies, companyId, setCompanyId, role, setRole, rateLimit, onGenerate }) => (
  <div
    className="ht-scale-in"
    style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius-panel)',
      padding:      'clamp(20px,4vw,32px)',
      boxShadow:    'var(--shadow-soft)',
      marginBottom: 24,
      display:      'flex',
      flexDirection:'column',
      gap:          20,
    }}
  >
    {/* Company selector */}
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
        Company <span style={{ color: 'var(--danger)' }}>*</span>
      </label>
      <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />
    </div>

    {/* Role input */}
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
        Target Role{' '}
        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>(optional — leave blank for general prep)</span>
      </label>
      <input
        value={role}
        onChange={e => setRole(e.target.value)}
        placeholder="e.g. Software Engineer, Data Analyst, DevOps…"
        style={{
          width:        '100%',
          height:       44,
          padding:      '0 14px',
          borderRadius: 'var(--radius-input)',
          border:       '1px solid var(--border)',
          background:   'var(--surface)',
          color:        'var(--text-primary)',
          fontSize:     14,
          outline:      'none',
          boxSizing:    'border-box',
          transition:   'border-color 0.18s ease, box-shadow 0.18s ease',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.11)'; }}
        onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>

    {/* Info banner */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 'var(--radius-input)', background: 'rgba(17,17,17,0.06)', border: '1px solid rgba(17,17,17,0.14)' }}>
      <Sparkles size={14} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        AI will analyse past interview experiences from your seniors and generate a personalised prep guide. The more experiences posted, the better the guide.
      </p>
    </div>

    {/* Generate button */}
    <button
      onClick={onGenerate}
      disabled={!companyId || rateLimit.remaining <= 0}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            10,
        width:          '100%',
        height:         48,
        borderRadius:   'var(--radius-input)',
        border:         'none',
        background:     !companyId || rateLimit.remaining <= 0 ? 'var(--surface-2)' : 'var(--accent)',
        color:          !companyId || rateLimit.remaining <= 0 ? 'var(--text-muted)' : 'var(--text-reverse)',
        fontSize:       15,
        fontWeight:     700,
        cursor:         !companyId || rateLimit.remaining <= 0 ? 'not-allowed' : 'pointer',
        transition:     'background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
        boxShadow:      !companyId || rateLimit.remaining <= 0 ? 'none' : '0 0 24px rgba(17,17,17,0.22)',
      }}
      onMouseEnter={e => { if (companyId && rateLimit.remaining > 0) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 36px rgba(17,17,17,0.30)'; } }}
      onMouseLeave={e => { if (companyId && rateLimit.remaining > 0) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(17,17,17,0.22)'; } }}
    >
      <Zap size={16} />
      {rateLimit.remaining <= 0 ? 'Daily Limit Reached' : 'Generate Prep Guide'}
    </button>

    {rateLimit.remaining <= 0 && (
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
        You've used all {rateLimit.limit} AI requests for today. Resets at midnight.
      </p>
    )}
  </div>
);

/* ─── Main page ─────────────────────────────────────────────────────────────── */
const AIInterviewPrepPage = ({ initialTab = 'prep' }) => {
  const [searchParams]         = useSearchParams();
  const navigate                = useNavigate();
  const { token }               = useAuthStore();
  const [activeTab, setActiveTab] = useState(() => {
    const view = searchParams.get('view');
    if (view === 'history') return 'history';
    return initialTab === 'history' ? 'history' : 'prep';
  });

  const [companies,  setCompanies]  = useState([]);
  const [companyId,  setCompanyId]  = useState(searchParams.get('company') || '');
  const [role,       setRole]       = useState(searchParams.get('role')    || '');
  const [rateLimit,  setRateLimit]  = useState({ used: 0, remaining: 5, limit: 5 });
  const [streaming,  setStreaming]  = useState(false);
  const [streamText, setStreamText] = useState('');
  const [sections,   setSections]   = useState({});
  const [meta,       setMeta]       = useState(null);
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    injectStyles();
    companyService.getAll({ limit: 100 }, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      setCompanies(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    }).catch(() => {});
    fetch(`${API_BASE}/ai/rate-limit`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (!controller.signal.aborted && d.success) setRateLimit(d.data); })
      .catch(() => {});

    return () => {
      controller.abort();
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (streamText) setSections(parseIntoSections(streamText));
  }, [streamText]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'history' || initialTab === 'history') {
      setActiveTab('history');
      return;
    }
    setActiveTab('prep');
  }, [searchParams, initialTab]);

  const handleGenerate = useCallback(async () => {
    if (!companyId) { toast.error('Please select a company'); return; }
    if (rateLimit.remaining <= 0) { toast.error('Daily limit reached. Try again tomorrow.'); return; }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setStreaming(true);
    setStreamText('');
    setSections({});
    setMeta(null);
    setError('');
    setDone(false);

    try {
      const res = await fetch(`${API_BASE}/ai/interview-prep`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ companyId, role }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Request failed'); }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      let generatedText = '';

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const lines     = event.split('\n');
          const eventType = lines.find(l => l.startsWith('event:'))?.replace('event: ', '').trim();
          const dataLine  = lines.find(l => l.startsWith('data:'))?.replace('data: ', '').trim();
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine);
            if      (eventType === 'meta')  { setRateLimit({ used: data.used, remaining: data.remaining, limit: data.limit }); }
            else if (eventType === 'chunk') {
              generatedText += data.text || '';
              setStreamText(prev => prev + data.text);
            }
            else if (eventType === 'done')  {
              setMeta({ companyName: data.companyName, experienceCount: data.experienceCount });
              setDone(true);
              setStreaming(false);

              // Persist AI prep history for student progress tracking.
              fetch(`${API_BASE}/ai/history/prep`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  companyId,
                  role: role || 'Software Engineer',
                  prepContent: generatedText,
                  experienceCount: data.experienceCount || 0,
                }),
              }).catch(() => {});
            }
            else if (eventType === 'error') { throw new Error(data.message); }
          } catch (parseErr) {
            if (parseErr.message !== 'Unexpected end of JSON input') { setError(parseErr.message); setStreaming(false); }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') { setError(err.message || 'Something went wrong. Please try again.'); setStreaming(false); }
    }
  }, [companyId, role, token, rateLimit.remaining]);

  const handlePrint = () => window.print();
  const handleReset = () => { setStreamText(''); setSections({}); setMeta(null); setError(''); setDone(false); };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      navigate('/student/ai-history');
    } else {
      navigate('/student/ai-prep');
    }
  };

  const hasContent       = Object.keys(sections).length > 0;
  const orderedSections  = Object.keys(SECTION_ICONS).filter(k => sections[k]);
  const pendingSections  = streaming ? Object.keys(SECTION_ICONS).filter(k => !sections[k]) : [];

  return (
    <div
      className="page-enter print:p-0"
      style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(16px,4vw,24px)' }}
    >
      {/* ── Page header ──────────────────────────────────────────── */}
      <div
        className="ht-fade-up"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Animated icon */}
          <div
            className={streaming ? 'ht-glow-live' : ''}
            style={{
              width:          48, height: 48,
              borderRadius:   14,
              background:     'var(--accent)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
              transition:     'box-shadow 0.4s ease',
            }}
          >
            <BrainCircuit size={22} color="var(--text-reverse)" style={{ animation: streaming ? 'ht-spin 3s linear infinite' : 'none' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AI Interview Prep
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Powered by senior experiences + Groq AI</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeTab === 'prep' && <RateBadge used={rateLimit.used} limit={rateLimit.limit} />}
          {activeTab === 'prep' && done && (
            <button
              onClick={handlePrint}
              className="print:hidden"
              style={{
                display:      'inline-flex', alignItems: 'center', gap: 6,
                fontSize:     12, fontWeight: 600,
                padding:      '7px 14px', borderRadius: 'var(--radius-pill)',
                border:       '1px solid var(--border)',
                background:   'var(--surface-2)',
                color:        'var(--text-muted)',
                cursor:       'pointer',
                transition:   'color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(17,17,17,0.24)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)';   e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <Printer size={13} /> Save PDF
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <button
          onClick={() => handleTabChange('prep')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: 999,
            border: `1px solid ${activeTab === 'prep' ? 'rgba(17,17,17,0.24)' : 'var(--border)'}`,
            background: activeTab === 'prep' ? 'rgba(17,17,17,0.09)' : 'var(--surface-2)',
            color: activeTab === 'prep' ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <BrainCircuit size={14} /> Prep Guide
        </button>
        <button
          onClick={() => handleTabChange('history')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: 999,
            border: `1px solid ${activeTab === 'history' ? 'rgba(17,17,17,0.24)' : 'var(--border)'}`,
            background: activeTab === 'history' ? 'rgba(17,17,17,0.09)' : 'var(--surface-2)',
            color: activeTab === 'history' ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <BookOpen size={14} /> Prep History
        </button>
      </div>

      {activeTab === 'history' && <StudentAIPrepPage embedded />}

      {/* ── Input form ───────────────────────────────────────────── */}
      {activeTab === 'prep' && !streaming && !done && (
        <FormCard
          companies={companies}
          companyId={companyId}
          setCompanyId={setCompanyId}
          role={role}
          setRole={setRole}
          rateLimit={rateLimit}
          onGenerate={handleGenerate}
        />
      )}

      {/* ── Error state ──────────────────────────────────────────── */}
      {activeTab === 'prep' && error && (
        <div
          className="ht-fade-up"
          style={{
            display:      'flex', alignItems: 'flex-start', gap: 14,
            padding:      '16px 20px', marginBottom: 20,
            background:   'rgba(255,69,58,0.07)',
            border:       '1px solid rgba(255,69,58,0.25)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>Generation Failed</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{error}</p>
            {error.includes('GROQ_API_KEY') && (
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 8, textDecoration: 'none' }}
              >
                Get your free Groq API key →
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Stream / result content ──────────────────────────────── */}
      {activeTab === 'prep' && (streaming || done || hasContent) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="print:gap-6">

          {/* Meta bar */}
          {(streaming || done) && (
            <div
              className="ht-fade-in print:hidden"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {meta ? (
                  <>
                    <Users size={14} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Based on{' '}
                      <strong style={{ color: 'var(--accent)' }}>{meta.experienceCount}</strong>
                      {' '}senior {meta.experienceCount === 1 ? 'experience' : 'experiences'} from{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{meta.companyName}</strong>
                      {meta.experienceCount === 0 && (
                        <span style={{ color: 'var(--warning)', fontSize: 12, marginLeft: 6 }}>(using general knowledge)</span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span className="ht-typing-dot" />
                      <span className="ht-typing-dot" />
                      <span className="ht-typing-dot" />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Analysing senior experiences…</span>
                  </>
                )}
              </div>
              {done && (
                <button
                  onClick={handleReset}
                  style={{
                    display:      'inline-flex', alignItems: 'center', gap: 6,
                    fontSize:     12, fontWeight: 600,
                    padding:      '7px 14px', borderRadius: 'var(--radius-pill)',
                    border:       '1px solid var(--border)',
                    background:   'var(--surface-2)',
                    color:        'var(--text-secondary)',
                    cursor:       'pointer',
                    transition:   'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(17,17,17,0.24)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <RotateCcw size={12} /> New Search
                </button>
              )}
            </div>
          )}

          {/* Skeleton cards while no sections yet */}
          {streaming && !hasContent &&
            Object.keys(SECTION_ICONS).map((_, i) => <SkeletonCard key={i} index={i} />)}

          {/* Rendered sections */}
          {orderedSections.map((key, i) => (
            <SectionCard
              key={key}
              title={key}
              content={sections[key]}
              animating={streaming && i === orderedSections.length - 1}
              index={i}
            />
          ))}

          {/* Pending skeleton cards while still streaming */}
          {pendingSections.map((_, i) => (
            <SkeletonCard key={`pending-${i}`} index={orderedSections.length + i} />
          ))}

          {/* Print header (hidden on screen) */}
          <div style={{ display: 'none' }} className="print:block">
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>AI Interview Prep Guide</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {meta?.companyName} · Generated by Avenor AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterviewPrepPage;