import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Building2, BookOpen, X, Command } from 'lucide-react';
import useSearch, { useRecentSearches } from '../../hooks/useSearch';
import { CompanyLogo } from './CompanyCard';

// Highlight matching text in a string
const Highlight = ({ text = '', query = '' }) => {
  if (!query.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-[var(--accent-soft)] text-[var(--accent)] rounded px-0.5 not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
};

const GlobalSearchBar = () => {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const dropRef   = useRef(null);
  const wrapperRef = useRef(null);
  const [mobileDropStyle, setMobileDropStyle] = useState(null);
  const { query, setQuery, suggestions, loading, clearSuggestions } = useSearch(250);
  const { get: getRecent, add: addRecent, clear: clearRecent } = useRecentSearches();

  const [open,   setOpen]   = useState(false);
  const [recent, setRecent] = useState([]);

  // Refresh recent on open
  useEffect(() => { if (open) setRecent(getRecent()); }, [open]);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!open) {
      setMobileDropStyle(null);
      return;
    }

    const positionDropdown = () => {
      if (typeof window === 'undefined') return;

      if (window.innerWidth >= 768) {
        setMobileDropStyle(null);
        return;
      }

      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(window.innerWidth - 16, rect.width + 4);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const top = rect.bottom + 8;

      setMobileDropStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
      });
    };

    positionDropdown();
    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);

    return () => {
      window.removeEventListener('resize', positionDropdown);
      window.removeEventListener('scroll', positionDropdown, true);
    };
  }, [open]);

  const handleSubmit = (q) => {
    const term = (q || query).trim();
    if (!term) return;
    addRecent(term);
    setRecent(getRecent());
    setOpen(false);
    clearSuggestions();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const hasContent = query.length >= 2 && (suggestions.companies?.length || suggestions.roles?.length);
  const showRecent = !query && recent.length > 0;
  const showDrop   = open && (hasContent || showRecent);

  return (
    <div ref={wrapperRef} className="relative hidden md:block w-64 lg:w-80">
      {/* Input */}
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search companies, roles…"
          className="w-full pl-8 pr-16 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
        />
        {/* Kbd hint */}
        {!query && (
          <div className="absolute right-2.5 flex items-center gap-0.5 pointer-events-none">
            <kbd className="flex items-center justify-center w-5 h-5 rounded bg-[var(--color-border)] text-[var(--color-text-muted)]">
              <Command size={10} />
            </kbd>
            <kbd className="flex items-center justify-center px-1.5 h-5 rounded bg-[var(--color-border)] text-[9px] font-bold text-[var(--color-text-muted)]">K</kbd>
          </div>
        )}
        {query && (
          <button onClick={() => { setQuery(''); clearSuggestions(); }} className="absolute right-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDrop && (
        <div
          ref={dropRef}
          className={`card p-2 z-50 animate-slide-down shadow-card-dark max-h-[420px] overflow-y-auto ${mobileDropStyle ? '' : 'absolute top-full mt-2 left-0 right-0'}`}
          style={mobileDropStyle || undefined}
        >

          {/* Recent searches */}
          {showRecent && (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Recent</span>
                <button onClick={() => { clearRecent(); setRecent([]); }} className="text-[10px] text-[var(--color-text-muted)] hover:text-danger-500 transition-colors">Clear</button>
              </div>
              {recent.map(r => (
                <button key={r} onClick={() => handleSubmit(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors text-left">
                  <Clock size={13} className="text-[var(--color-text-muted)] shrink-0" />
                  {r}
                </button>
              ))}
            </>
          )}

          {/* Company suggestions */}
          {suggestions.companies?.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5 mt-1">
                <Building2 size={11} className="text-[var(--color-text-muted)]" />
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Companies</span>
              </div>
              {suggestions.companies.map(c => (
                <button key={c._id}
                  onClick={() => { setOpen(false); navigate(`/companies/${c._id}`); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors text-left">
                  <CompanyLogo logo={c.logo} name={c.name} size="xs" />
                  <span><Highlight text={c.name} query={query} /></span>
                  <span className="ml-auto text-xs text-[var(--color-text-muted)]">{c.sector}</span>
                </button>
              ))}
            </>
          )}

          {/* Role suggestions */}
          {suggestions.roles?.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5 mt-1">
                <BookOpen size={11} className="text-[var(--color-text-muted)]" />
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Roles</span>
              </div>
              {suggestions.roles.map(r => (
                <button key={r} onClick={() => handleSubmit(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors text-left">
                  <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
                  <Highlight text={r} query={query} />
                </button>
              ))}
            </>
          )}

          {/* Search all results CTA */}
          {query.trim() && (
            <button onClick={() => handleSubmit()}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg mt-1 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors border-t border-[var(--color-border)]">
              <Search size={13} />
              Search all results for "<span className="truncate max-w-[180px]">{query}</span>"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
