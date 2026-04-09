import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, Building2, BookOpen,
  ArrowRight, X, Sparkles, Clock, TrendingUp,
} from 'lucide-react';
import { useRecentSearches } from '../../hooks/useSearch';
import searchService from '../../services/searchService';
import ExperienceCard from '../../components/shared/ExperienceCard';
import { CompanyLogo } from '../../components/shared/CompanyCard';
import Countdown from '../../components/shared/Countdown';
import { getStage } from '../../components/shared/StagePipeline';
import { CompanyCardSkeleton } from '../../components/shared/Skeleton';
import Button from '../../components/ui/Button';

/* ─── Constants ──────────────────────────────────────────────────────── */
const VERDICTS = ['selected', 'rejected', 'waitlisted'];
const YEARS    = [2025, 2024, 2023, 2022, 2021];
const SORTS    = [
  { id: 'relevance', label: 'Relevance', icon: Sparkles },
  { id: 'date',      label: 'Latest',    icon: Clock },
  { id: 'upvotes',   label: 'Most Upvoted', icon: TrendingUp },
];

/* ─── Highlight matching text ────────────────────────────────────────── */
const Highlight = ({ text = '', query = '' }) => {
  if (!query?.trim()) return <span>{text}</span>;
  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  );
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? (
            <mark key={i}
              className="bg-[var(--accent)]/20 text-[var(--accent)] rounded-[3px] px-0.5 not-italic font-semibold">
              {part}
            </mark>
          )
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

/* ─── Filter button atom ─────────────────────────────────────────────── */
const FilterBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`
      w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border
      transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
      ${active
        ? 'bg-[var(--accent)]/12 border-[var(--accent)]/35 text-[var(--accent)] shadow-[0_0_0_1px_var(--accent)/10]'
        : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-2)] hover:border-[var(--accent)]/25 hover:text-[var(--text-secondary)] hover:bg-[var(--surface)]'
      }
    `}
  >
    {children}
  </button>
);

/* ─── Section heading ────────────────────────────────────────────────── */
const SectionHeading = ({ icon: Icon, label, count, iconColor }) => (
  <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)]">
    <span className={`flex items-center justify-center w-7 h-7 rounded-lg
      bg-[var(--surface-2)] border border-[var(--border)]`}>
      <Icon size={14} className={iconColor} />
    </span>
    <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-widest">
      {label}
    </h2>
    <span className="badge badge-muted text-[10px] ml-auto">{count}</span>
  </div>
);

/* ─── Company result card ────────────────────────────────────────────── */
const CompanyResult = ({ company, query, index = 0 }) => {
  const stage = getStage(company.currentStage);
  return (
    <Link
      to={`/companies/${company._id}`}
      style={{ animationDelay: `${index * 50}ms` }}
      className="card animate-slide-up p-4 flex items-center gap-4
        hover:border-[var(--accent)]/30 group
        transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
    >
      <CompanyLogo logo={company.logo} name={company.name} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[var(--text-primary)]
          group-hover:text-[var(--accent)] transition-colors duration-200">
          <Highlight text={company.name} query={query} />
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">{company.sector}</span>
          <span className={`badge text-[10px] ${stage.bg} ${stage.color}`}>
            {stage.label}
          </span>
          {company.ctc?.max > 0 && (
            <span className="text-xs font-semibold text-[var(--status-success)]">
              ₹{company.ctc.min}–{company.ctc.max}L
            </span>
          )}
        </div>
      </div>

      {company.applicationDeadline && (
        <Countdown deadline={company.applicationDeadline} />
      )}

      <span className="w-7 h-7 rounded-lg flex items-center justify-center
        bg-[var(--surface-2)] border border-[var(--border)]
        group-hover:bg-[var(--accent)]/10 group-hover:border-[var(--accent)]/30
        transition-all duration-200 shrink-0">
        <ArrowRight size={13}
          className="text-[var(--text-muted)] group-hover:text-[var(--accent)]
            transition-all duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
};

/* ─── Empty / zero-state ─────────────────────────────────────────────── */
const EmptyState = ({ icon: Icon = Search, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
    <div className="relative mb-5">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]
        flex items-center justify-center">
        <Icon size={26} className="text-[var(--text-muted)]" />
      </div>
      {/* faint ring */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-[var(--border)] scale-125 opacity-40" />
    </div>
    <p className="font-display font-bold text-[var(--text-primary)] mb-1.5">{title}</p>
    <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">{subtitle}</p>
  </div>
);

/* ─── Skeleton shimmer rows ──────────────────────────────────────────── */
const SkeletonRows = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="card p-4 flex items-center gap-4"
        style={{ animationDelay: `${i * 60}ms` }}>
        <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 rounded-pill w-2/5" />
          <div className="skeleton h-2.5 rounded-pill w-1/3" />
        </div>
        <div className="skeleton h-8 w-16 rounded-pill" />
      </div>
    ))}
  </div>
);

/* ─── Main page ──────────────────────────────────────────────────────── */
const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { add: addRecent } = useRecentSearches();

  const initialQ = searchParams.get('q') || '';

  const [inputVal,    setInputVal]    = useState(initialQ);
  const [results,     setResults]     = useState({ experiences: [], companies: [] });
  const [loading,     setLoading]     = useState(false);
  const [type,        setType]        = useState(searchParams.get('type') || '');
  const [verdict,     setVerdict]     = useState('');
  const [year,        setYear]        = useState('');
  const [sort,        setSort]        = useState('relevance');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q?.trim()) { setResults({ experiences: [], companies: [] }); return; }
    setLoading(true);
    try {
      const params = { q, sort };
      if (type)    params.type    = type;
      if (verdict) params.verdict = verdict;
      if (year)    params.year    = year;
      const res = await searchService.search(params);
      setResults(res.data);
    } catch {
      setResults({ experiences: [], companies: [] });
    } finally {
      setLoading(false);
    }
  }, [type, verdict, year, sort]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setInputVal(q);
    if (q) { addRecent(q); doSearch(q); }
  }, [searchParams.get('q'), type, verdict, year, sort]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setSearchParams({ q: inputVal.trim() });
  };

  const q            = searchParams.get('q') || '';
  const hasQuery     = q.trim().length > 0;
  const totalResults = (results.experiences?.length || 0) + (results.companies?.length || 0);
  const hasFilters   = type || verdict || year;
  const activeFilterCount = [type, verdict, year].filter(Boolean).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-[var(--bg)] overflow-x-hidden">

      {/* ── Sticky search header ──────────────────────────────────────── */}
      <div className="sticky top-16 z-20
        border-b border-[var(--border)]
        bg-[var(--surface)]/80 backdrop-blur-[20px]
        transition-shadow duration-200">
        <div className="max-w-content mx-auto px-4 sm:px-6 py-1.5 sm:py-2">
          <form onSubmit={handleSubmit} className="max-w-3xl w-full flex flex-wrap sm:flex-nowrap items-center gap-2.5">

            {/* Search input */}
            <div className="relative flex-1 min-w-0 basis-full sm:basis-auto">
              <Search size={15}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
                  ${inputFocused ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Search companies, roles, interview questions…"
                className={`
                  input pl-10 pr-4 text-sm
                  w-full
                  transition-all duration-200
                  ${inputFocused
                    ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(17,17,17,0.11)]'
                    : ''
                  }
                `}
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={() => setInputVal('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-[var(--text-muted)] hover:text-[var(--text-primary)]
                    transition-colors duration-150"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" size="sm" className="btn-primary px-5 h-11 rounded-input shrink-0 w-full sm:w-auto">
              Search
            </Button>

            {/* Filters toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen(p => !p)}
              className={`
                relative flex items-center justify-center gap-2 px-3.5 h-11 rounded-input border
                text-sm font-semibold shrink-0
                w-full sm:w-auto
                transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                ${filtersOpen || hasFilters
                  ? 'bg-[var(--accent)]/12 border-[var(--accent)]/35 text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-2)] hover:border-[var(--accent)]/25 hover:text-[var(--text-primary)]'
                }
              `}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                  bg-[var(--accent)] text-[var(--text-reverse)] text-[9px] font-bold
                  flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      {!hasQuery && !loading ? (
        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 py-6">
          <div className="w-full max-w-4xl card p-6 sm:p-10 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
              <Search size={26} className="text-[var(--text-muted)]" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Search the placement network
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
                Look up companies, roles, and interview experiences. Start with a keyword above to load results.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Companies', 'Roles', 'Interview Questions', 'Experiences'].map((item) => (
                <span key={item} className="chip text-xs px-3 py-1.5 cursor-default">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 w-full px-4 sm:px-6 py-6 gap-6">

          {/* ── Filters sidebar ──────────────────────────────────────── */}
          <aside
            className={`
              shrink-0 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
              ${filtersOpen ? 'w-52 opacity-100' : 'w-0 opacity-0 overflow-hidden'}
            `}
          >
            <div className="space-y-6 pt-1 pr-1">

            {/* Type */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">
                Result Type
              </p>
              {[
                { id: '',           label: 'All Results' },
                { id: 'experience', label: 'Experiences' },
                { id: 'company',    label: 'Companies'   },
              ].map(t => (
                <FilterBtn key={t.id} active={type === t.id} onClick={() => setType(t.id)}>
                  {t.label}
                </FilterBtn>
              ))}
            </div>

            {/* Verdict */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">
                Verdict
              </p>
              {VERDICTS.map(v => (
                <FilterBtn key={v} active={verdict === v}
                  onClick={() => setVerdict(verdict === v ? '' : v)}>
                  <span className="capitalize">{v}</span>
                </FilterBtn>
              ))}
            </div>

            {/* Year */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">
                Year
              </p>
              {YEARS.map(y => (
                <FilterBtn key={y} active={year === String(y)}
                  onClick={() => setYear(year === String(y) ? '' : String(y))}>
                  {y}
                </FilterBtn>
              ))}
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">
                Sort By
              </p>
              {SORTS.map(s => (
                <FilterBtn key={s.id} active={sort === s.id} onClick={() => setSort(s.id)}>
                  <span className="flex items-center gap-2">
                    <s.icon size={11} />
                    {s.label}
                  </span>
                </FilterBtn>
              ))}
            </div>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={() => { setType(''); setVerdict(''); setYear(''); setSort('relevance'); }}
                className="w-full flex items-center justify-center gap-1.5
                  text-xs font-semibold text-[var(--danger)]
                  hover:bg-[var(--danger)]/12 py-2.5 rounded-xl
                  border border-[var(--danger)]/20
                  transition-all duration-200"
              >
                <X size={11} /> Clear all filters
              </button>
            )}
            </div>
          </aside>

          {/* ── Results column ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

          {/* Meta row */}
          {q && !loading && (
            <div className="flex items-center justify-between flex-wrap gap-2 animate-fade-in">
              <p className="text-sm text-[var(--text-secondary)]">
                {totalResults > 0 ? (
                  <>
                    <strong className="text-[var(--text-primary)]">{totalResults}</strong>
                    {' '}result{totalResults !== 1 ? 's' : ''} for{' '}
                    <strong className="text-[var(--accent)]">"{q}"</strong>
                  </>
                ) : (
                  <>No results for <strong className="text-[var(--accent)]">"{q}"</strong></>
                )}
              </p>
              {hasFilters && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {type && (
                    <span className="chip active text-xs py-1 px-2.5">
                      {type}
                      <button onClick={() => setType('')}
                        className="ml-1 hover:text-[var(--danger)] transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {verdict && (
                    <span className="chip active text-xs py-1 px-2.5 capitalize">
                      {verdict}
                      <button onClick={() => setVerdict('')}
                        className="ml-1 hover:text-[var(--danger)] transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {year && (
                    <span className="chip active text-xs py-1 px-2.5">
                      {year}
                      <button onClick={() => setYear('')}
                        className="ml-1 hover:text-[var(--danger)] transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

            {/* Loading */}
            {loading && <SkeletonRows />}

            {/* No results */}
            {!loading && q && totalResults === 0 && (
              <EmptyState
                icon={Search}
                title="No results found"
                subtitle="Try different keywords or clear your filters to broaden the search."
              />
            )}

            {/* Prompt to search */}
            {!loading && !q && (
              <EmptyState
                icon={Search}
                title="What are you looking for?"
                subtitle="Search companies, roles, or interview questions above."
              />
            )}

            {/* ── Companies section ─────────────────────────────────── */}
            {!loading && results.companies?.length > 0 && (!type || type === 'company') && (
              <section className="space-y-3 animate-slide-up">
                <SectionHeading
                  icon={Building2}
                  label="Companies"
                  count={results.companies.length}
                  iconColor="text-[var(--accent)]"
                />
                <div className="space-y-2">
                  {results.companies.map((c, i) => (
                    <CompanyResult key={c._id} company={c} query={q} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Experiences section ───────────────────────────────── */}
            {!loading && results.experiences?.length > 0 && (!type || type === 'experience') && (
              <section className="space-y-3 animate-slide-up" style={{ animationDelay: '80ms' }}>
                <SectionHeading
                  icon={BookOpen}
                  label="Interview Experiences"
                  count={results.experiences.length}
                  iconColor="text-[var(--warning)]"
                />
                <div className="space-y-3">
                  {results.experiences.map((e, i) => (
                    <div
                      key={e._id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      <ExperienceCard experience={e} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;