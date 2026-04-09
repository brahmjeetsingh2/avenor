import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GraduationCap,
  Building2,
  Award,
  BrainCircuit,
  DollarSign,
  Search,
  Compass,
  ListChecks,
  Target,
  UserCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronRight,
  Briefcase,
  Bell,
  BarChart2,
  FileText,
  Star,
  Zap,
} from 'lucide-react';
import BrandLogo from '../components/shared/BrandLogo';

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */
const steps = [
  { icon: Compass, title: 'Discover Opportunities', desc: 'Find relevant roles without noise.' },
  { icon: ListChecks, title: 'Track Applications', desc: 'Stay on top of every stage and deadline.' },
  { icon: Target, title: 'Reach Outcomes', desc: 'Make decisions with clarity and confidence.' },
];

const whatYouCanDo = [
  { title: 'Application Tracking', desc: 'Track applications across companies.' },
  { title: 'Real-Time Updates', desc: 'Get real-time updates and deadlines.' },
  { title: 'Structured Preparation', desc: 'Prepare using structured experiences.' },
  { title: 'Offer Comparison', desc: 'Compare offers with clarity.' },
];

const roles = [
  { icon: GraduationCap, name: 'Students', desc: 'Track cycles. Prepare smarter. Choose better.' },
  { icon: Building2, name: 'Coordinators', desc: 'Coordinate drives with clarity and confidence.' },
  { icon: Award, name: 'Alumni', desc: 'Guide students through practical, timely support.' },
];

const flow = [
  { icon: GraduationCap, title: 'Student', desc: 'Discovers relevant opportunities.' },
  { icon: ListChecks, title: 'Application', desc: 'Tracks each stage with deadlines.' },
  { icon: UserCheck, title: 'Interview', desc: 'Prepares with structured experiences.' },
  { icon: Award, title: 'Offer', desc: 'Compares outcomes with confidence.' },
];

const supportFeatures = [
  { icon: BrainCircuit, title: 'Interview Prep', desc: 'Role-specific preparation, without noise.' },
  { icon: DollarSign, title: 'Salary Insights', desc: 'Real outcomes to guide smart decisions.' },
  { icon: Search, title: 'Experience Search', desc: 'Find practical interview notes quickly.' },
];

const testimonials = [
{ quote: 'During placement season, Avenor kept my applications, deadlines, and interview rounds in one clean timeline.', name: 'Mehul Luthra', role: 'Student', rating: 5 },
{ quote: 'As a coordinator, I could track student progress and communicate updates without messy spreadsheets and scattered groups.', name: 'Brahmjeet Singh', role: 'Coordinator', rating: 4.5 },
{ quote: 'As an alum, I can share interview experiences in a structured way so juniors get practical guidance, not generic advice.', name: 'Akshansh Vij', role: 'Alumni', rating: 4 },
{ quote: 'The interview prep flow felt practical for Indian campus processes, especially for OA to final round transitions.', name: 'Ansh Mehta', role: 'Student', rating: 5 },
{ quote: 'The offer comparison and salary context made mentorship conversations more realistic for students evaluating final choices.', name: 'Harsh Chaudhary', role: 'Alumni', rating: 4 },
{ quote: 'Salary insights helped me compare PPO and full-time offers with better clarity instead of relying on random chats.', name: 'Manveer Singh', role: 'Student', rating: 5 },
{ quote: 'Avenor made our placement cycle calmer by centralizing alerts, stage updates, and key deadlines for the whole batch.', name: 'H.S Chaggar', role: 'Coordinator', rating: 4.5 },
{ quote: 'Experience Search gave me branch-specific prep notes that were actually relevant to the companies I shortlisted.', name: 'Gurleen Kaur', role: 'Student', rating: 5 },
];



/* ─────────────────────────────────────────────────────────────
   KANBAN PREVIEW — real interactive demo
───────────────────────────────────────────────────────────── */
const kanbanData = {
  Applied: [
    { company: 'Stripe', role: 'SDE Intern', date: 'Apr 2', tag: 'Tech', tagColor: '#6366f1' },
    { company: 'Zepto', role: 'Product Analyst', date: 'Apr 5', tag: 'Product', tagColor: '#0ea5e9' },
  ],
  'In Review': [
    { company: 'Goldman Sachs', role: 'Quant Analyst', date: 'Mar 28', tag: 'Finance', tagColor: '#10b981' },
  ],
  Interview: [
    { company: 'Google', role: 'SWE Intern', date: 'Mar 20', tag: 'Tech', tagColor: '#6366f1' },
    { company: 'BCG', role: 'Summer Analyst', date: 'Mar 22', tag: 'Consulting', tagColor: '#f59e0b' },
  ],
  Offer: [
    { company: 'Microsoft', role: 'SDE Intern', date: 'Mar 15', tag: 'Tech', tagColor: '#6366f1' },
  ],
};

const KanbanPreview = () => {
  const [activeCard, setActiveCard] = useState(null);
  const cols = Object.keys(kanbanData);
  const colColors = { Applied: '#94a3b8', 'In Review': '#f59e0b', Interview: '#6366f1', Offer: '#10b981' };

  return (
    <div className="landing-kanban-preview" style={{ fontFamily: 'inherit', userSelect: 'none' }}>
      <div className="landing-kanban-rail" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        {cols.map((col) => (
          <div key={col} className="landing-kanban-column" style={{ flex: '0 0 160px', minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '8px', padding: '0 2px',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colColors[col], flexShrink: 0,
              }} />
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</span>
              <span style={{
                marginLeft: 'auto', fontSize: '10px', fontWeight: 600,
                background: 'rgba(120,120,120,0.1)', borderRadius: '999px',
                padding: '1px 6px', color: 'var(--text-muted)',
              }}>{kanbanData[col].length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {kanbanData[col].map((card, i) => (
                <div
                  key={i}
                  className="landing-kanban-task"
                  onMouseEnter={() => setActiveCard(`${col}-${i}`)}
                  onMouseLeave={() => setActiveCard(null)}
                  style={{
                    background: activeCard === `${col}-${i}`
                      ? 'rgba(255,255,255,0.55)'
                      : 'rgba(255,255,255,0.32)',
                    border: `1px solid ${activeCard === `${col}-${i}` ? 'rgba(120,120,120,0.28)' : 'rgba(120,120,120,0.15)'}`,
                    borderRadius: '10px',
                    padding: '9px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: activeCard === `${col}-${i}` ? 'translateY(-2px)' : 'none',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{card.company}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{card.role}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 500,
                      background: `${card.tagColor}18`,
                      color: card.tagColor,
                      borderRadius: '999px', padding: '2px 7px',
                    }}>{card.tag}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{card.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   STATS COUNTER
───────────────────────────────────────────────────────────── */
const useCounter = (target, duration = 1800, started = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return count;
};

const StatCard = ({ value, suffix, label, started }) => {
  const count = useCounter(value, 1600, started);
  return (
    <div className="landing-stat-card" style={{
      textAlign: 'center',
      padding: '20px 16px',
      borderRadius: '16px',
      border: '1px solid rgba(120,120,120,0.15)',
      background: 'rgba(255,255,255,0.28)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ANIMATED WORD REVEAL
───────────────────────────────────────────────────────────── */
const WordReveal = ({ text, className, style, started, baseDelay = 0 }) => {
  const words = text.split(' ');
  return (
    <span className={className} style={{ ...style, display: 'inline' }}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: started ? 1 : 0,
            transform: started ? 'translateY(0)' : 'translateY(18px)',
            transition: `opacity 0.55s ease ${baseDelay + i * 60}ms, transform 0.55s ease ${baseDelay + i * 60}ms`,
            marginRight: i < words.length - 1 ? '0.27em' : 0,
          }}
        >
          {word}
        </span>
      ))}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────
   DOT GRID BACKGROUND
───────────────────────────────────────────────────────────── */
const DotGrid = ({ scrollY }) => (
  <div
    style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'radial-gradient(circle, rgba(120,120,120,0.18) 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 100%)',
      transform: `translateY(${scrollY * 0.04}px)`,
    }}
  />
);

/* ─────────────────────────────────────────────────────────────
   SHIMMER CARD
───────────────────────────────────────────────────────────── */
const ShimmerCard = ({ children, style, className }) => {
  const ref = useRef(null);
  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
    el.style.setProperty('--shimmer-opacity', '1');
  }, []);
  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.setProperty('--shimmer-opacity', '0');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`landing-premium-card ${className || ''}`.trim()}
      style={{
        position: 'relative', overflow: 'hidden',
        '--mx': '50%', '--my': '50%', '--shimmer-opacity': '0',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(200px circle at var(--mx) var(--my), rgba(255,255,255,0.18), transparent 70%)',
        opacity: 'var(--shimmer-opacity)',
        transition: 'opacity 0.3s ease',
      }} />
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   OFFER COMPARISON PREVIEW
───────────────────────────────────────────────────────────── */
const OfferCompare = () => {
  const offers = [
    { company: 'Google', role: 'SWE Intern', ctc: '₹2.4L/mo', location: 'Bengaluru', perks: ['Relocation', 'MacBook', 'Gym'], highlight: true },
    { company: 'Goldman Sachs', role: 'Quant Intern', ctc: '₹1.8L/mo', location: 'Mumbai', perks: ['Housing', 'Food'], highlight: false },
    { company: 'Microsoft', role: 'SDE Intern', ctc: '₹2.0L/mo', location: 'Hyderabad', perks: ['Relocation', 'Device'], highlight: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {offers.map((o, i) => (
        <div key={i} className="landing-offer-row" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '12px',
          background: o.highlight ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.25)',
          border: `1px solid ${o.highlight ? 'rgba(99,102,241,0.3)' : 'rgba(120,120,120,0.15)'}`,
          transition: 'transform 0.2s ease',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: o.highlight ? 'rgba(99,102,241,0.15)' : 'rgba(120,120,120,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: o.highlight ? '#6366f1' : 'var(--text-secondary)',
            flexShrink: 0,
          }}>{o.company[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{o.company} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '11px' }}>· {o.role}</span></div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.location}</div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: o.highlight ? '#6366f1' : 'var(--text-primary)', flexShrink: 0 }}>{o.ctc}</div>
          {o.highlight && <Star size={13} style={{ color: '#6366f1', flexShrink: 0 }} />}
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ACTIVITY FEED PREVIEW
───────────────────────────────────────────────────────────── */
const ActivityFeed = () => {
  const items = [
    { icon: CheckCircle2, color: '#10b981', text: 'Offer received from Microsoft', time: '2h ago' },
    { icon: Bell, color: '#f59e0b', text: 'Interview scheduled — Google, Apr 12', time: '5h ago' },
    { icon: FileText, color: '#6366f1', text: 'New experience shared: MAANG SDE', time: '1d ago' },
    { icon: TrendingUp, color: '#0ea5e9', text: 'Salary insight updated for Finance roles', time: '2d ago' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="landing-activity-row" style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '9px 11px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.28)',
            border: '1px solid rgba(120,120,120,0.13)',
            backdropFilter: 'blur(8px)',
          }}>
            <Icon size={14} style={{ color: item.color, marginTop: '1px', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.45 }}>{item.text}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   FLOATING BADGE
───────────────────────────────────────────────────────────── */
const FloatingBadge = ({ children, style }) => (
  <div className="landing-floating-badge" style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '999px',
    border: '1px solid rgba(120,120,120,0.2)',
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(12px)',
    fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    ...style,
  }}>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   ANIMATED PROGRESS BAR
───────────────────────────────────────────────────────────── */
const ProgressBar = ({ label, value, color, started, delay = 0 }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}%</span>
    </div>
    <div className="landing-progress-track" style={{ height: '5px', borderRadius: '999px', background: 'rgba(120,120,120,0.12)', overflow: 'hidden' }}>
      <div className="landing-progress-fill" style={{
        height: '100%', borderRadius: '999px',
        background: color,
        width: started ? `${value}%` : '0%',
        transition: `width 1.2s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
      }} />
    </div>
  </div>
);

const MobileHeroPreview = ({ started, compact = false }) => {
  const quickStats = [
    { label: 'Applications', value: '12', icon: Briefcase, color: '#6366f1' },
    { label: 'Interviews', value: '4', icon: UserCheck, color: '#f59e0b' },
    { label: 'Offers', value: '1', icon: Award, color: '#10b981' },
  ];

  return (
    <div className="landing-mobile-hero-preview" style={{
      opacity: started ? 1 : 0,
      transform: started ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.5s ease 120ms, transform 0.5s ease 120ms',
      borderRadius: 16,
      border: '1px solid rgba(120,120,120,0.16)',
      background: 'rgba(255,255,255,0.52)',
      backdropFilter: 'blur(14px)',
      padding: 'clamp(10px, 3.2vw, 14px)',
      boxShadow: '0 16px 34px -22px rgba(0,0,0,0.24)',
    }}>
      <div className="landing-mobile-quickstats" style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
        {quickStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="landing-mobile-quickstat-card" style={{
            borderRadius: 10,
            border: '1px solid rgba(120,120,120,0.14)',
            background: 'rgba(255,255,255,0.62)',
            padding: '10px 8px',
            textAlign: 'center',
            minWidth: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Icon size={14} style={{ color }} />
            </div>
            <p style={{ margin: 0, fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.05 }}>{value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="landing-mobile-today" style={{ borderRadius: 10, border: '1px solid rgba(120,120,120,0.14)', background: 'rgba(255,255,255,0.62)', padding: '10px 12px' }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Today</p>
        <div className="landing-mobile-today-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, minWidth: 0, lineHeight: 1.35, overflowWrap: 'anywhere' }}>Google interview tomorrow</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
            <Clock size={12} /> 18h
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────────────────────── */
const LandingPage = () => {
  const [visibleSections, setVisibleSections] = useState({ 0: true });
  const sectionRefs = useRef([]);
  const carouselRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 769 : false));
  const [isNarrowMobile, setIsNarrowMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 360 : false));
  const dragState = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const testimonialAutoplayState = useRef({ lastTs: 0, paused: false, pausedUntil: 0 });

  const pauseTestimonialsAutoplay = useCallback((ms = 900) => {
    if (typeof performance === 'undefined') return;
    testimonialAutoplayState.current.pausedUntil = performance.now() + ms;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 769);
      setIsNarrowMobile(width <= 360);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.getAttribute('data-section-index'));
          setVisibleSections((prev) => ({ ...prev, [idx]: true }));
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    );
    sectionRefs.current.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const rail = carouselRef.current;
    if (!rail) return;

    let rafId = 0;

    const step = (ts) => {
      const autoplay = testimonialAutoplayState.current;
      if (!autoplay.lastTs) autoplay.lastTs = ts;

      const delta = Math.min(64, ts - autoplay.lastTs);
      autoplay.lastTs = ts;

      const paused = autoplay.paused || dragState.current.active || document.hidden || ts < autoplay.pausedUntil;

      if (!paused) {
        const half = rail.scrollWidth / 2;
        const pxPerSecond = isMobile ? 52 : 62;
        rail.scrollLeft += (pxPerSecond * delta) / 1000;
        if (half > 0 && rail.scrollLeft >= half) rail.scrollLeft -= half;
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(rafId);
      testimonialAutoplayState.current.lastTs = 0;
    };
  }, [isMobile]);

  /* flow step cycler */
  useEffect(() => {
    if (!visibleSections[2]) return;
    const id = setInterval(() => setActiveFlowStep((p) => (p + 1) % flow.length), 1800);
    return () => clearInterval(id);
  }, [visibleSections[2]]);

  const setSectionRef = (idx) => (node) => { sectionRefs.current[idx] = node; };

  const reveal = (idx, delay = 0) => ({
    style: {
      opacity: visibleSections[idx] ? 1 : 0,
      transform: visibleSections[idx] ? 'translateY(0)' : 'translateY(22px)',
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  });

  const handleRailPointerDown = (e) => {
    if (e.button !== 0) return;
    const rail = carouselRef.current;
    if (!rail) return;
    rail.setPointerCapture?.(e.pointerId);
    dragState.current = { active: true, startX: e.clientX, startScrollLeft: rail.scrollLeft };
    testimonialAutoplayState.current.paused = true;
    pauseTestimonialsAutoplay(1200);
  };
  const handleRailPointerMove = (e) => {
    if (!dragState.current.active) return;
    const rail = carouselRef.current;
    if (!rail) return;
    e.preventDefault();
    rail.scrollLeft = dragState.current.startScrollLeft - (e.clientX - dragState.current.startX);
  };
  const handleRailPointerUp = () => {
    dragState.current.active = false;
    testimonialAutoplayState.current.paused = false;
    pauseTestimonialsAutoplay(900);
  };
  const handleRailTouchStart = () => {
    testimonialAutoplayState.current.paused = true;
    pauseTestimonialsAutoplay(1400);
  };
  const handleRailTouchEnd = () => {
    testimonialAutoplayState.current.paused = false;
    pauseTestimonialsAutoplay(1600);
  };

  return (
    <div className="landing-page-root min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        ref={setSectionRef(0)}
        data-section-index={0}
        className="landing-section landing-hero-section relative w-full px-4 sm:px-6 pt-24 pb-28 md:pt-32 md:pb-36"
        style={{ overflow: 'hidden' }}
      >
        {!isMobile && <DotGrid scrollY={scrollY} />}

        {/* ambient glow blobs */}
        {!isMobile && <div style={{
          position: 'absolute', top: '-8rem', left: '-4rem', width: 'min(36rem,72vw)', height: 'min(36rem,72vw)',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 72%)',
          pointerEvents: 'none', transform: `translateY(${scrollY * 0.07}px)`,
        }} />}
        {!isMobile && <div style={{
          position: 'absolute', top: '4rem', right: '-6rem', width: 'min(32rem,68vw)', height: 'min(32rem,68vw)',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 72%)',
          pointerEvents: 'none', transform: `translateY(${scrollY * 0.04}px)`,
        }} />}

        <div className="relative max-w-7xl mx-auto text-center">

          <BrandLogo size="lg" className="mx-auto mb-8" style={{ ...reveal(0).style }} />

          <h1
            className="mx-auto max-w-4xl font-semibold leading-[1.02] tracking-[-0.025em] text-[var(--text-primary)]"
            style={{ fontSize: 'clamp(1.75rem,5vw,4.2rem)', ...reveal(0).style, transitionDelay: '60ms' }}
          >
            <WordReveal text="Move from effort" started={visibleSections[0]} baseDelay={80} />
            <br />
            <WordReveal text="to offer." started={visibleSections[0]} baseDelay={300} style={{ color: 'var(--text-primary)' }} />
          </h1>

          <p {...reveal(0)} style={{ ...reveal(0).style, transitionDelay: '420ms', marginTop: '1.5rem' }}
            className="mx-auto max-w-xl text-[15px] leading-[1.65] text-[var(--text-secondary)]">
            A clear system for managing opportunities, applications, and outcomes — built for every student, coordinator, and mentor.
          </p>

          <div className="landing-hero-actions" {...reveal(0)} style={{ ...reveal(0).style, transitionDelay: '520ms', marginTop: '2.5rem', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              className="landing-hero-login inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="landing-hero-cta btn-primary h-12 px-8 rounded-xl text-[15px] font-semibold justify-center transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
            >
              Get Started <ArrowRight size={15} />
            </Link>
            <a
              href="#platform"
              className="landing-hero-cta landing-secondary-cta"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '48px', padding: '0 22px', borderRadius: '12px',
                border: '1px solid rgba(120,120,120,0.22)',
                background: 'rgba(255,255,255,0.3)',
                backdropFilter: 'blur(12px)',
                fontSize: '15px', fontWeight: 500,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'none'; }}
            >
              See how it works <ChevronRight size={14} />
            </a>
          </div>

          {/* HERO DASHBOARD PREVIEW */}
          <div
            {...reveal(0)}
            style={{
              ...reveal(0).style,
              transitionDelay: '620ms',
              marginTop: isMobile ? '1.25rem' : '4rem',
              transform: `${visibleSections[0] ? `translateY(${Math.min(scrollY * 0.035, 20)}px)` : 'translateY(24px)'}`,
              position: 'relative',
            }}
          >
            {isMobile ? (
              <MobileHeroPreview started={!!visibleSections[0]} compact={isNarrowMobile} />
            ) : (
              <>
            {/* glow under card */}
            <div style={{
              position: 'absolute', bottom: '-2rem', left: '15%', right: '15%', height: '4rem',
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.18), transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div className="landing-hero-preview-shell landing-hero-preview landing-hero-preview-inner" style={{
              width: '100%', maxWidth: '780px', margin: '0 auto',
              borderRadius: '20px',
              border: '1px solid rgba(120,120,120,0.18)',
              background: 'rgba(255,255,255,0.46)',
              backdropFilter: 'blur(20px)',
              padding: 'clamp(12px, 3.8vw, 20px)',
              boxShadow: '0 24px 60px -20px rgba(0,0,0,0.22)',
            }}>
              {/* top bar */}
              <div className="landing-hero-windowbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 2px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <div style={{
                  flex: 1, height: '26px', borderRadius: '7px',
                  background: 'rgba(120,120,120,0.08)',
                  border: '1px solid rgba(120,120,120,0.1)',
                  display: 'flex', alignItems: 'center', paddingLeft: '10px', gap: '6px',
                }}>
                  <Search size={10} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>avenor.app/dashboard</span>
                </div>
              </div>

              {/* dashboard grid */}
              <div className="landing-preview-stats-grid landing-hero-topstats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                {[
                  { label: 'Applications', value: '12', icon: Briefcase, color: '#6366f1' },
                  { label: 'Interviews', value: '4', icon: UserCheck, color: '#f59e0b' },
                  { label: 'Offers', value: '1', icon: Award, color: '#10b981' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="landing-preview-mini-card" style={{
                    padding: 'clamp(10px, 3.3vw, 12px) clamp(10px, 3.8vw, 14px)', borderRadius: '12px',
                    border: '1px solid rgba(120,120,120,0.13)',
                    background: 'rgba(255,255,255,0.55)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
                  </div>
                ))}
              </div>

              <KanbanPreview />
            </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <section
        ref={setSectionRef(8)}
        data-section-index={8}
        className="landing-section w-full px-4 sm:px-6 py-16 md:py-20"
      >
        <div className="max-w-4xl mx-auto">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
          }}>
            {[
              { value: 1200, suffix: '+', label: 'Students onboarded' },
              { value: 340, suffix: '+', label: 'Companies tracked' },
              { value: 860, suffix: '+', label: 'Experiences shared' },
              { value: 94, suffix: '%', label: 'Placement rate' },
            ].map((s) => (
              <StatCard key={s.label} {...s} started={!!visibleSections[8]} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ONE PLATFORM ─────────────────────────────────────── */}
      <section ref={setSectionRef(1)} data-section-index={1} className="landing-section w-full px-4 sm:px-6 py-24 md:py-28" id="platform">
        <div className="max-w-7xl mx-auto">
          <div {...reveal(1)} style={{ ...reveal(1).style, marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '10px' }}>The system</p>
            <h2 style={{ fontSize: 'clamp(2rem,3.8vw,2.2rem)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              One platform. Every step.
            </h2>
          </div>

          <div className="landing-steps-grid" style={{ display: 'grid', gap: 'clamp(12px, 3vw, 20px)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {steps.map(({ icon: Icon, title, desc }, idx) => (
              <ShimmerCard
                key={title}
                style={{
                  ...reveal(1, 120 + idx * 130).style,
                  borderRadius: '20px',
                  border: '1px solid rgba(120,120,120,0.16)',
                  background: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(16px)',
                  padding: '28px 28px',
                  transition: `all 0.65s ease ${120 + idx * 130}ms, transform 0.25s ease`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  border: '1px solid rgba(120,120,120,0.18)',
                  background: 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '20px',
                }}>
                  <Icon size={19} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Step {idx + 1}</div>
                <h3 style={{ fontSize: '22px', fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--text-primary)', marginBottom: '10px' }}>{title}</h3>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{desc}</p>
              </ShimmerCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section ref={setSectionRef(2)} data-section-index={2} className="landing-section w-full px-4 sm:px-6 py-24 md:py-28" id="how-it-works">
        <div className="max-w-7xl mx-auto landing-journey-grid" style={{ display: 'grid', gap: 'clamp(20px, 5vw, 48px)', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'center' }}>
          <div {...reveal(2)}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '10px' }}>The journey</p>
            <h2 style={{ fontSize: 'clamp(1.75rem,3.4vw,2.1rem)', fontWeight: 500, letterSpacing: '-0.018em', marginBottom: '2rem' }}>
              How it works
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {flow.map(({ icon: Icon, title, desc }, idx) => {
                const isActive = activeFlowStep === idx && !!visibleSections[2];
                return (
                  <div
                    key={title}
                    onClick={() => setActiveFlowStep(idx)}
                    {...reveal(2, 100 + idx * 110)}
                    style={{
                      ...reveal(2, 100 + idx * 110).style,
                      position: 'relative', paddingLeft: '44px', paddingBottom: idx < flow.length - 1 ? '28px' : 0,
                      cursor: 'pointer',
                    }}
                  >
                    {/* connector line */}
                    {idx < flow.length - 1 && (
                      <div style={{
                        position: 'absolute', left: '15px', top: '28px',
                        width: '1px', bottom: 0,
                        background: isActive
                          ? 'linear-gradient(to bottom, rgba(99,102,241,0.5), rgba(120,120,120,0.15))'
                          : 'rgba(120,120,120,0.15)',
                        transition: 'background 0.4s ease',
                      }} />
                    )}
                    {/* step circle */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0,
                      width: 30, height: 30, borderRadius: '50%',
                      border: `1.5px solid ${isActive ? 'rgba(99,102,241,0.7)' : 'rgba(120,120,120,0.2)'}`,
                      background: isActive ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.35s ease',
                      backdropFilter: 'blur(8px)',
                    }}>
                      <Icon size={13} style={{ color: isActive ? '#6366f1' : 'var(--text-secondary)', transition: 'color 0.35s' }} />
                    </div>
                    <h3 style={{
                      fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      marginBottom: '3px', transition: 'color 0.35s',
                    }}>{title}</h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--text-secondary)' }}>{desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: real activity feed */}
          <div
            {...reveal(2, 160)}
            style={{
              ...reveal(2, 160).style,
              transform: visibleSections[2] ? `translateY(${Math.min(scrollY * 0.02, 12)}px)` : 'translateY(24px)',
            }}
          >
            <div style={{
              borderRadius: '20px', border: '1px solid rgba(120,120,120,0.16)',
              background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(16px)',
              padding: '22px',
            }} className="landing-block-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent activity</span>
                <Bell size={13} style={{ color: 'var(--text-muted)' }} />
              </div>
              <ActivityFeed />
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Readiness</p>
                <ProgressBar label="Profile complete" value={88} color="#6366f1" started={!!visibleSections[2]} delay={200} />
                <ProgressBar label="Applications filed" value={64} color="#10b981" started={!!visibleSections[2]} delay={350} />
                <ProgressBar label="Interview prep" value={45} color="#f59e0b" started={!!visibleSections[2]} delay={500} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU CAN DO ──────────────────────────────────── */}
      <section ref={setSectionRef(3)} data-section-index={3} className="landing-section w-full px-4 sm:px-6 py-24 md:py-28" id="glance">
        <div className="max-w-7xl mx-auto">
          <div {...reveal(3)} style={{ ...reveal(3).style, marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem,3.4vw,2rem)', fontWeight: 500, letterSpacing: '-0.018em' }}>What You Can Do</h2>
          </div>
          <div className="landing-glance-grid" style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {whatYouCanDo.map(({ title, desc }, idx) => (
              <ShimmerCard
                key={title}
                {...reveal(3, 90 + idx * 100)}
                style={{
                  ...reveal(3, 90 + idx * 100).style,
                  borderRadius: '18px',
                  border: '1px solid rgba(120,120,120,0.15)',
                  background: 'rgba(255,255,255,0.28)',
                  backdropFilter: 'blur(12px)',
                  padding: '22px 20px',
                  transition: `all 0.65s ease ${90 + idx * 100}ms, transform 0.25s ease, border-color 0.25s ease`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(120,120,120,0.15)'; }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{desc}</p>
              </ShimmerCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESSENTIAL CAPABILITIES ───────────────────────────── */}
      <section ref={setSectionRef(4)} data-section-index={4} className="landing-section w-full px-4 sm:px-6 py-24 md:py-28" id="features">
        <div className="max-w-7xl mx-auto">
          <div {...reveal(4)} style={{ ...reveal(4).style, marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '10px' }}>Capabilities</p>
            <h2 style={{ fontSize: 'clamp(1.75rem,3.4vw,2.2rem)', fontWeight: 500, letterSpacing: '-0.018em' }}>Essential capabilities</h2>
          </div>

          <div className="landing-feature-grid" style={{
            display: 'grid', gap: '20px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            alignItems: 'stretch',
            marginBottom: '20px',
          }}>
            {/* offer compare */}
            <div
              {...reveal(4, 80)}
              style={{
                ...reveal(4, 80).style,
                borderRadius: '20px', border: '1px solid rgba(120,120,120,0.16)',
                background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(16px)',
                padding: '22px',
              }}
              className="landing-block-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Offer comparison</span>
                <BarChart2 size={13} style={{ color: 'var(--text-muted)' }} />
              </div>
              <OfferCompare />
            </div>

            {/* feature highlight text */}
            <div {...reveal(4, 160)} style={{ ...reveal(4, 160).style, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>Feature highlight</p>
              <h3 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', lineHeight: 1.15, fontWeight: 500, letterSpacing: '-0.018em', marginBottom: '16px' }}>
                Stay on top of every opportunity
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--text-secondary)', maxWidth: '440px' }}>
                Avenor keeps opportunities, application progress, and timelines clear so decisions stay informed from start to offer.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['All applications in one board', 'Deadline reminders built-in', 'Salary benchmarks per role'].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="landing-support-grid" style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {supportFeatures.map(({ icon: Icon, title, desc }, idx) => (
              <ShimmerCard
                key={title}
                {...reveal(4, 240 + idx * 100)}
                style={{
                  ...reveal(4, 240 + idx * 100).style,
                  borderRadius: '18px', border: '1px solid rgba(120,120,120,0.15)',
                  background: 'rgba(255,255,255,0.28)', backdropFilter: 'blur(12px)',
                  padding: '20px',
                  transition: `all 0.65s ease ${240 + idx * 100}ms, transform 0.25s ease`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '12px',
                  border: '1px solid rgba(120,120,120,0.15)',
                  background: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px',
                }}>
                  <Icon size={17} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: '6px' }}>{title}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{desc}</p>
              </ShimmerCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section ref={setSectionRef(5)} data-section-index={5} className="landing-section w-full px-4 sm:px-6 py-24 md:py-28" id="testimonials">
        <div className="max-w-7xl mx-auto">
          <div {...reveal(5)} style={{ ...reveal(5).style, marginBottom: '2rem' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '10px' }}>Voices</p>
            <h2 style={{ fontSize: 'clamp(1.75rem,3.4vw,2rem)', fontWeight: 500, letterSpacing: '-0.018em' }}>From the platform</h2>
          </div>

          <div
            ref={carouselRef}
            style={{
              display: 'flex', gap: '16px',
              overflowX: 'auto', cursor: isMobile ? 'auto' : 'grab',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            className={`landing-testimonial-rail select-none ${isMobile ? '' : 'active:cursor-grabbing'}`.trim()}
            onMouseLeave={() => {
              if (!isMobile) handleRailPointerUp();
            }}
            onPointerDown={(e) => { if (!isMobile) handleRailPointerDown(e); }}
            onPointerMove={(e) => { if (!isMobile) handleRailPointerMove(e); }}
            onPointerUp={() => { if (!isMobile) handleRailPointerUp(); }}
            onPointerCancel={() => { if (!isMobile) handleRailPointerUp(); }}
            onTouchStart={handleRailTouchStart}
            onTouchEnd={handleRailTouchEnd}
            onTouchCancel={handleRailTouchEnd}
          >
            {[...testimonials, ...testimonials].map((item, idx) => (
              <ShimmerCard
                key={`${item.name}-${idx}`}
                className="landing-testimonial-card"
                style={{
                  borderRadius: '18px',
                  border: '1px solid rgba(120,120,120,0.16)',
                  background: 'rgba(255,255,255,0.34)',
                  backdropFilter: 'blur(12px)',
                  padding: '22px 22px',
                  minWidth: 'clamp(220px, 78vw, 300px)', maxWidth: 'clamp(220px, 78vw, 300px)',
                  flexShrink: 0,
                  boxShadow: '0 10px 30px -18px rgba(0,0,0,0.3)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', gap: '3px', marginBottom: '12px' }}>
                  {[...Array(5)].map((_, i) => {
                    const fill = Math.max(0, Math.min(1, (item.rating || 0) - i));
                    return (
                      <span key={i} style={{ position: 'relative', width: 12, height: 12, display: 'inline-block' }}>
                        <Star size={12} style={{ color: 'rgba(120,120,120,0.28)', fill: 'none', position: 'absolute', inset: 0 }} />
                        {fill > 0 && (
                          <span style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, overflow: 'hidden' }}>
                            <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b', position: 'absolute', inset: 0 }} />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '16px' }}>"{item.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 600, color: '#6366f1',
                  }}>{item.name[0]}</div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{item.role}</p>
                  </div>
                </div>
              </ShimmerCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────────── */}
      <section ref={setSectionRef(6)} data-section-index={6} className="landing-section w-full px-4 sm:px-6 py-24 md:py-28" id="roles">
        <div className="max-w-7xl mx-auto">
          <div {...reveal(6)} style={{ ...reveal(6).style, marginBottom: '2rem' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)', marginBottom: '10px' }}>Who it's for</p>
            <h2 style={{ fontSize: 'clamp(1.75rem,3.4vw,2rem)', fontWeight: 500, letterSpacing: '-0.018em' }}>Designed for every role</h2>
          </div>

          <div className="landing-roles-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {roles.map(({ icon: Icon, name, desc }, idx) => (
              <ShimmerCard
                key={name}
                {...reveal(6, 90 + idx * 90)}
                style={{
                  ...reveal(6, 90 + idx * 90).style,
                  borderRadius: '20px', border: '1px solid rgba(120,120,120,0.15)',
                  padding: '26px', background: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(12px)',
                  transition: `all 0.65s ease ${90 + idx * 90}ms, transform 0.25s ease`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)'; e.currentTarget.style.border = '1px solid rgba(99,102,241,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.border = '1px solid rgba(120,120,120,0.15)'; }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: '12px',
                  border: '1px solid rgba(120,120,120,0.16)',
                  background: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                }}>
                  <Icon size={17} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 500, letterSpacing: '-0.01em', marginBottom: '7px' }}>{name}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{desc}</p>
              </ShimmerCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section ref={setSectionRef(7)} data-section-index={7} className="landing-section w-full px-4 sm:px-6 pt-12 pb-28 md:pb-32" style={{ position: 'relative', overflow: 'hidden' }}>
        <DotGrid scrollY={scrollY} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '40rem', height: '20rem',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.09), transparent 72%)',
          pointerEvents: 'none',
        }} />

        <div
          {...reveal(7)}
          className="landing-final-cta"
          style={{
            ...reveal(7).style,
            maxWidth: '600px', margin: '0 auto', textAlign: 'center',
            padding: 'clamp(28px, 7vw, 56px) clamp(18px, 5vw, 32px)',
            borderRadius: '24px',
            border: '1px solid rgba(120,120,120,0.18)',
            background: 'rgba(255,255,255,0.38)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px -30px rgba(0,0,0,0.2)',
          }}
        >
          <div className="landing-final-badge-wrap" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            <FloatingBadge><CheckCircle2 size={11} style={{ color: '#10b981' }} /> Free to get started</FloatingBadge>
          </div>
          <h3 style={{ fontSize: 'clamp(1.75rem,3.4vw,2rem)', fontWeight: 500, letterSpacing: '-0.018em', marginBottom: '12px' }}>
            Start your placement journey.
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
            Join students and coordinators who manage their entire placement cycle on Avenor.
          </p>
          <div className="landing-hero-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
            <Link
              to="/login"
              className="landing-hero-login inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary h-12 px-8 rounded-xl text-[15px] font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
            >
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: '6xl', margin: '2.5rem auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BrandLogo size="xs" />
        </div>
      </section>

      <style>{`
        .landing-testimonial-rail::-webkit-scrollbar { display: none; }
        [data-section-index]::-webkit-scrollbar { display: none; }

        .landing-testimonial-rail {
          width: 100%;
          max-width: 100%;
          touch-action: auto;
          overscroll-behavior-x: contain;
          scroll-snap-type: none;
          will-change: scroll-position;
          contain: layout paint;
        }

        .landing-testimonial-card {
          scroll-snap-align: none;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .landing-hero-login {
          color: var(--text-secondary);
          border: 1px solid rgba(120,120,120,0.2);
          background: rgba(255,255,255,0.54);
        }

        .landing-hero-login:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.78);
          border-color: rgba(120,120,120,0.3);
          transform: translateY(-1px);
        }

        .landing-page-root {
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .landing-section {
          width: 100%;
          max-width: 100vw;
        }

        .dark .landing-premium-card,
        .dark .landing-stat-card,
        .dark .landing-block-card,
        .dark .landing-hero-preview,
        .dark .landing-final-cta {
          background: rgba(16,16,16,0.78) !important;
          border-color: rgba(255,255,255,0.14) !important;
          box-shadow: 0 20px 48px -28px rgba(0,0,0,0.82), 0 1px 0 rgba(255,255,255,0.08) inset !important;
        }

        .dark .landing-premium-card:hover,
        .dark .landing-stat-card:hover,
        .dark .landing-block-card:hover {
          border-color: rgba(255,255,255,0.22) !important;
          box-shadow: 0 26px 56px -30px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.12) inset !important;
        }

        .dark .landing-floating-badge {
          background: rgba(20,20,20,0.78) !important;
          border-color: rgba(255,255,255,0.16) !important;
          color: var(--text-secondary) !important;
        }

        .dark .landing-secondary-cta {
          background: rgba(24,24,24,0.86) !important;
          border-color: rgba(255,255,255,0.18) !important;
          color: var(--text-primary) !important;
        }

        .dark .landing-secondary-cta:hover {
          background: rgba(34,34,34,0.9) !important;
          transform: translateY(-2px);
        }

        .dark .landing-preview-mini-card {
          background: rgba(10,10,10,0.9) !important;
          border-color: rgba(255,255,255,0.2) !important;
          box-shadow: 0 10px 26px -18px rgba(0,0,0,0.86), 0 1px 0 rgba(255,255,255,0.07) inset !important;
        }

        .dark .landing-kanban-task,
        .dark .landing-offer-row,
        .dark .landing-activity-row,
        .dark .landing-mobile-hero-preview,
        .dark .landing-mobile-quickstat-card {
          background: rgba(12,12,12,0.86) !important;
          border-color: rgba(255,255,255,0.2) !important;
          box-shadow: 0 14px 34px -22px rgba(0,0,0,0.84), 0 1px 0 rgba(255,255,255,0.07) inset !important;
        }

        .dark .landing-activity-row:hover,
        .dark .landing-kanban-task:hover,
        .dark .landing-mobile-quickstat-card:hover,
        .dark .landing-offer-row:hover {
          border-color: rgba(255,255,255,0.28) !important;
          background: rgba(18,18,18,0.92) !important;
        }

        .dark .landing-hero-login {
          color: #F5F5F5 !important;
          background: linear-gradient(180deg, rgba(26,26,26,0.98) 0%, rgba(18,18,18,0.98) 100%) !important;
          border-color: rgba(255,255,255,0.22) !important;
          box-shadow:
            0 10px 26px -18px rgba(0,0,0,0.92),
            0 1px 0 rgba(255,255,255,0.08) inset !important;
        }

        .dark .landing-hero-login:hover {
          color: #FFFFFF !important;
          background: linear-gradient(180deg, rgba(34,34,34,1) 0%, rgba(24,24,24,1) 100%) !important;
          border-color: rgba(255,255,255,0.32) !important;
          box-shadow:
            0 14px 34px -20px rgba(0,0,0,0.96),
            0 1px 0 rgba(255,255,255,0.12) inset !important;
          transform: translateY(-1px) !important;
        }

        .dark .landing-progress-track {
          background: rgba(255,255,255,0.16) !important;
        }

        @media (max-width: 480px) {
          .landing-hero-preview-shell {
            width: 100% !important;
            max-width: 100% !important;
            padding: 10px !important;
            border-radius: 16px !important;
          }

          .landing-kanban-rail {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            overflow: visible !important;
            padding-bottom: 0 !important;
          }

          .landing-kanban-column {
            flex: none !important;
            width: 100% !important;
          }

          .landing-testimonial-rail {
            gap: 12px !important;
            padding-bottom: 6px !important;
          }

          .landing-testimonial-card {
            min-width: calc(100% - 16px) !important;
            max-width: calc(100% - 16px) !important;
            padding: 16px !important;
          }

          .landing-hero-windowbar {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }

          .landing-hero-windowbar > div:first-child {
            flex-shrink: 0;
          }

          .landing-hero-windowbar > div:last-child {
            flex: 1 1 100%;
            min-width: 0;
            height: auto !important;
            min-height: 26px;
            padding: 6px 10px !important;
          }

          .landing-hero-preview {
            border-radius: 16px !important;
            box-shadow: 0 14px 34px -18px rgba(0,0,0,0.28) !important;
          }

          .landing-preview-stats-grid {
            gap: 8px !important;
          }

          .landing-final-cta {
            padding: 36px 18px !important;
            border-radius: 18px !important;
          }

          .landing-block-card,
          .landing-premium-card,
          .landing-stat-card {
            padding: 16px !important;
          }

          .landing-journey-grid,
          .landing-feature-grid {
            gap: 22px !important;
          }

          .landing-glance-grid,
          .landing-support-grid,
          .landing-roles-grid,
          .landing-steps-grid {
            grid-template-columns: 1fr !important;
          }

          .landing-section {
            padding-top: 3.6rem !important;
            padding-bottom: 3.6rem !important;
          }

          .landing-hero-section {
            padding-top: 5.5rem !important;
          }

          .landing-hero-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .landing-hero-cta {
            width: 100% !important;
            justify-content: center !important;
          }

          .landing-hero-topstats {
            grid-template-columns: 1fr !important;
          }

        }

        @media (max-width: 768px) {
          .landing-hero-preview-shell {
            width: 100% !important;
            max-width: 100% !important;
          }

          .landing-kanban-rail {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            overflow: visible !important;
          }

          .landing-kanban-column {
            width: 100% !important;
            flex: none !important;
          }

          .landing-testimonial-rail {
            display: flex !important;
            gap: 12px !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            cursor: grab !important;
            scroll-behavior: auto !important;
            touch-action: pan-x !important;
          }

          .landing-feature-grid,
          .landing-journey-grid {
            grid-template-columns: 1fr !important;
          }

          .landing-final-cta {
            padding: 42px 22px !important;
          }

          .landing-section {
            padding-top: 4.25rem !important;
            padding-bottom: 4.25rem !important;
          }

          .landing-hero-section {
            padding-top: 6rem !important;
            padding-bottom: 4.75rem !important;
          }

          .landing-hero-actions {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .landing-hero-cta {
            width: 100% !important;
            justify-content: center !important;
          }

          .landing-hero-preview,
          .landing-hero-preview-inner {
            max-width: 100% !important;
            border-radius: 16px !important;
            padding: 12px !important;
            box-shadow: 0 14px 34px -18px rgba(0,0,0,0.26) !important;
          }

          .landing-hero-topstats {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
          }

          .landing-preview-mini-card {
            padding: 10px !important;
            border-radius: 10px !important;
          }

          .landing-preview-mini-card span,
          .landing-preview-mini-card div {
            white-space: normal !important;
          }

          .landing-steps-grid,
          .landing-glance-grid,
          .landing-support-grid,
          .landing-roles-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .landing-premium-card,
          .landing-block-card,
          .landing-stat-card {
            padding: 16px !important;
            border-radius: 14px !important;
          }

          .landing-premium-card h3,
          .landing-block-card h3 {
            font-size: 1.12rem !important;
            line-height: 1.3 !important;
          }

          .landing-premium-card p,
          .landing-block-card p,
          .landing-stat-card p {
            font-size: 14px !important;
            line-height: 1.5 !important;
          }

          .landing-testimonial-card {
            min-width: calc(100% - 24px) !important;
            max-width: calc(100% - 24px) !important;
            padding: 16px !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            box-shadow: 0 8px 20px -16px rgba(0,0,0,0.34) !important;
          }

          .landing-final-cta {
            border-radius: 18px !important;
            padding: 40px 18px !important;
          }

          .landing-final-cta p {
            font-size: 14px !important;
          }
        }

        @media (max-width: 560px) {
          .landing-hero-preview-shell {
            padding: 10px !important;
          }

          .landing-hero-windowbar {
            flex-wrap: wrap !important;
          }

          .landing-hero-section h1 {
            font-size: clamp(1.85rem, 9vw, 2.6rem) !important;
            line-height: 1.08 !important;
          }

          .landing-hero-section p {
            font-size: 14px !important;
            line-height: 1.55 !important;
          }

          .landing-hero-topstats {
            grid-template-columns: 1fr !important;
          }

          .landing-testimonial-card {
            min-width: calc(100% - 16px) !important;
            max-width: calc(100% - 16px) !important;
          }

          .landing-section {
            padding-top: 3.6rem !important;
            padding-bottom: 3.6rem !important;
          }
        }

        @media (max-width: 360px) {
          .landing-section {
            padding-top: 2.9rem !important;
            padding-bottom: 2.9rem !important;
          }

          .landing-hero-section {
            padding-top: 4.75rem !important;
            padding-bottom: 3.2rem !important;
          }

          .landing-hero-section h1 {
            font-size: clamp(1.55rem, 8.8vw, 2.05rem) !important;
            line-height: 1.08 !important;
          }

          .landing-hero-section p {
            font-size: 13px !important;
            line-height: 1.5 !important;
          }

          .landing-hero-actions {
            margin-top: 1.15rem !important;
            gap: 8px !important;
          }

          .landing-hero-cta {
            height: 44px !important;
            font-size: 13px !important;
            padding: 0 14px !important;
          }

          .landing-mobile-hero-preview {
            padding: 10px !important;
            border-radius: 14px !important;
          }

          .landing-mobile-quickstats {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }

          .landing-mobile-quickstat-card {
            padding: 9px 10px !important;
          }

          .landing-mobile-today {
            padding: 9px 10px !important;
          }

          .landing-mobile-today-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }

          .landing-premium-card,
          .landing-block-card,
          .landing-stat-card,
          .landing-testimonial-card {
            padding: 12px !important;
            border-radius: 12px !important;
          }

          .landing-testimonial-card {
            min-width: calc(100% - 12px) !important;
            max-width: calc(100% - 12px) !important;
          }

          .landing-final-cta {
            padding: 26px 14px !important;
            border-radius: 14px !important;
          }

          .landing-final-cta h3 {
            font-size: 1.35rem !important;
            line-height: 1.2 !important;
          }

          .landing-final-cta p {
            font-size: 13px !important;
            line-height: 1.5 !important;
          }
        }

        @keyframes float-badge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;