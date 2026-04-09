import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, PenLine, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import experienceService from '../../services/experienceService';
import useAuth from '../../hooks/useAuth';
import ExperienceCard from '../../components/shared/ExperienceCard';
import { ROUND_CFG } from '../../utils/experienceHelpers';
import { CompanyCardSkeleton } from '../../components/shared/Skeleton';

const VERDICTS    = ['selected', 'rejected', 'waitlisted'];
const YEARS       = [2024, 2023, 2022, 2021, 2020];
const DIFFICULTIES = [1, 2, 3, 4, 5];

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

// ─── Filter pill ──────────────────────────────────────────────────────────────
const FilterPill = ({ label, active, onClick, onClear }) => (
  <button
    onClick={onClick}
    style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          6,
      padding:      '5px 12px',
      borderRadius: 'var(--radius-pill)',
      border:       `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
      background:   active ? themedWash : 'transparent',
      color:        active ? 'var(--accent)' : 'var(--text-muted)',
      fontSize:     12,
      fontWeight:   600,
      cursor:       'pointer',
      transition:   'all 0.15s ease',
      whiteSpace:   'nowrap',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
  >
    {label}
    {active && (
      <span
        onClick={e => { e.stopPropagation(); onClear(); }}
        style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)', opacity: 0.7 }}
      >
        <X size={10} />
      </span>
    )}
  </button>
);

// ─── Filter group label ───────────────────────────────────────────────────────
const FilterLabel = ({ children }) => (
  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
    {children}
  </p>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const ExperienceFeedPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const canPost   = ['student', 'alumni'].includes(user?.role);
  const loaderRef = useRef(null);

  const [experiences,  setExperiences]  = useState([]);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [search,       setSearch]       = useState('');
  const [searchInput,  setSearchInput]  = useState('');
  const [showFilters,  setShowFilters]  = useState(false);
  const [filters, setFilters] = useState({ verdict: '', difficulty: '', year: '', roundType: '' });

  const hasFilters = search || Object.values(filters).some(Boolean);

  const [recommended, setRecommended] = useState([]);
  const [trending,    setTrending]    = useState([]);

  useEffect(() => {
    if (!user?.branch) return;
    experienceService.getFeed({ limit: 3, page: 1 })
      .then(r => setRecommended(r.data.experiences.slice(0, 3)))
      .catch(() => {});
    experienceService.getFeed({ limit: 3, sortBy: 'upvoteCount', page: 1 })
      .then(r => setTrending(r.data.experiences.slice(0, 3)))
      .catch(() => {});
  }, [user]);

  const fetchFeed = useCallback(async (pageNum, reset = false) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = { page: pageNum, limit: 10, search, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res  = await experienceService.getFeed(params);
      const list = res.data.experiences;
      setExperiences(prev => reset || pageNum === 1 ? list : [...prev, ...list]);
      setHasMore(res.pagination.page < res.pagination.pages);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, filters]);

  useEffect(() => { setPage(1); fetchFeed(1, true); }, [search, filters]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        const next = page + 1;
        setPage(next);
        fetchFeed(next);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchFeed]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilter = (key, val) => setFilters(p => ({ ...p, [key]: p[key] === val ? '' : val }));
  const clearAll  = () => { setFilters({ verdict: '', difficulty: '', year: '', roundType: '' }); setSearchInput(''); };

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(12px,4vw,24px)' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Interview Experiences
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Learn from seniors who've been there</p>
        </div>
        {canPost && (
          <button
            onClick={() => navigate('/experiences/new')}
            className="hidden sm:inline-flex items-center"
            style={{
              alignItems:   'center',
              gap:          8,
              padding:      '10px 18px',
              background:   'var(--accent)',
              color:        'var(--text-reverse)',
              fontWeight:   700,
              fontSize:     13,
              borderRadius: 'var(--radius-input)',
              border:       'none',
              cursor:       'pointer',
              boxShadow:    'var(--shadow-soft)',
              transition:   'background 0.18s ease, transform 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <PenLine size={14} /> Share Experience
          </button>
        )}
      </div>

      {/* ── Search + filter bar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div className="experience-toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Search input */}
          <div className="experience-search" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by role, company, questions…"
              style={{
                width:        '100%',
                height:       42,
                paddingLeft:  36,
                paddingRight: 14,
                borderRadius: 'var(--radius-input)',
                border:       '1px solid var(--border)',
                background:   themedSurface,
                color:        'var(--text-primary)',
                fontSize:     14,
                outline:      'none',
                boxSizing:    'border-box',
                transition:   'border-color 0.18s ease, box-shadow 0.18s ease',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent)'; }}
              onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(p => !p)}
            className="experience-toolbar-btn"
            style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          6,
              padding:      '0 16px',
              height:       42,
              borderRadius: 'var(--radius-input)',
              border:       `1px solid ${showFilters || hasFilters ? 'var(--border-strong)' : 'var(--border)'}`,
              background:   showFilters || hasFilters ? themedWash : themedSurface,
              color:        showFilters || hasFilters ? 'var(--accent)' : 'var(--text-muted)',
              fontSize:     13,
              fontWeight:   600,
              cursor:       'pointer',
              transition:   'all 0.15s ease',
              whiteSpace:   'nowrap',
              flexShrink:   0,
            }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasFilters && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            )}
          </button>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="experience-toolbar-btn"
              style={{
                padding:      '0 12px',
                height:       42,
                borderRadius: 'var(--radius-input)',
                border:       '1px solid transparent',
                background:   'transparent',
                color:        'var(--danger)',
                fontSize:     12,
                fontWeight:   600,
                cursor:       'pointer',
                transition:   'background 0.15s ease, border-color 0.15s ease',
                flexShrink:   0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            className="animate-slide-down"
            style={{
              background:   themedSurface,
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding:      'clamp(12px, 3.8vw, 18px) clamp(12px, 4vw, 20px)',
              boxShadow:    'var(--shadow-soft)',
              display:      'flex',
              flexDirection:'column',
              gap:          16,
            }}
          >
            {/* Verdict */}
            <div>
              <FilterLabel>Verdict</FilterLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {VERDICTS.map(v => (
                  <FilterPill key={v}
                    label={v.charAt(0).toUpperCase() + v.slice(1)}
                    active={filters.verdict === v}
                    onClick={() => setFilter('verdict', v)}
                    onClear={() => setFilter('verdict', '')}
                  />
                ))}
              </div>
            </div>

            {/* Round type */}
            <div>
              <FilterLabel>Round Type</FilterLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(ROUND_CFG).map(([key, cfg]) => (
                  <FilterPill key={key}
                    label={cfg.label}
                    active={filters.roundType === key}
                    onClick={() => setFilter('roundType', key)}
                    onClear={() => setFilter('roundType', '')}
                  />
                ))}
              </div>
            </div>

            {/* Year + Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16 }}>
              <div>
                <FilterLabel>Year</FilterLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {YEARS.map(y => (
                    <FilterPill key={y}
                      label={String(y)}
                      active={filters.year === y}
                      onClick={() => setFilter('year', y)}
                      onClear={() => setFilter('year', '')}
                    />
                  ))}
                </div>
              </div>
              <div>
                <FilterLabel>Difficulty</FilterLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {DIFFICULTIES.map(d => (
                    <FilterPill key={d}
                      label={'★'.repeat(d)}
                      active={filters.difficulty === d}
                      onClick={() => setFilter('difficulty', d)}
                      onClear={() => setFilter('difficulty', '')}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Personalised sections ───────────────────────────────────── */}
      {!hasFilters && (recommended.length > 0 || trending.length > 0) && (
        <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recommended.length > 0 && (
            <div className="card" style={{ background: themedSurface, border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 14, boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>Picked For Your Track</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {user?.branch ? `${user.branch} aligned` : 'Based on your profile'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recommended.map(exp => <ExperienceCard key={exp._id} experience={exp} compact />)}
              </div>
            </div>
          )}

          {trending.length > 0 && (
            <div className="card" style={{ background: themedSurface, border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 14, boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>Most Discussed Right Now</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Community momentum</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {trending.map(exp => <ExperienceCard key={`t-${exp._id}`} experience={exp} compact />)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '2px 4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Latest From The Community
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{experiences.length} loaded</span>
          </div>
        </div>
      )}

      {/* ── Feed ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CompanyCardSkeleton key={i} />)
          : experiences.length === 0
            ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(44px, 12vw, 72px) clamp(14px, 4vw, 24px)', textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: themedWash, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: 'var(--shadow-soft)' }}>
                  <BookOpen size={26} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No experiences yet</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>
                  {hasFilters ? 'Try clearing your filters.' : 'Be the first to share your interview experience!'}
                </p>
                {canPost && (
                  <button
                    onClick={() => navigate('/experiences/new')}
                    style={{
                      display:      'inline-flex', alignItems: 'center', gap: 8,
                      padding:      '10px 20px',
                      background:   'var(--accent)',
                      color:        'var(--text-reverse)',
                      fontWeight:   700, fontSize: 13,
                      borderRadius: 'var(--radius-input)',
                      border:       'none', cursor: 'pointer',
                      transition:   'background 0.18s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                  >
                    <PenLine size={14} /> Share First Experience
                  </button>
                )}
              </div>
            )
            : experiences.map(exp => <ExperienceCard key={exp._id} experience={exp} />)
        }

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} style={{ height: 16 }} />

        {/* Load more spinner */}
        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}

        {/* End of feed */}
        {!hasMore && experiences.length > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '14px 0' }}>
            You've seen all experiences
          </p>
        )}
      </div>

      {/* ── FAB (mobile) ───────────────────────────────────────────── */}
      {canPost && (
        <button
          onClick={() => navigate('/experiences/new')}
          className="sm:hidden fixed bottom-6 right-6 flex items-center justify-center"
          style={{
            position:       'fixed',
            bottom:         24, right: 24,
            width:          54, height: 54,
            borderRadius:   '50%',
            background:     'var(--accent)',
            color:          'var(--text-reverse)',
            border:         'none',
            cursor:         'pointer',
            boxShadow:      'var(--shadow-elevated)',
            zIndex:         20,
            transition:     'transform 0.18s ease, background 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <PenLine size={22} />
        </button>
      )}
    </div>
  );
};

export default ExperienceFeedPage;