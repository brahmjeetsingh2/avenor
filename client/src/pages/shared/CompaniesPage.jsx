import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, LayoutGrid, List, Building2, SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import companyService from '../../services/companyService';
import useAuth from '../../hooks/useAuth';
import CompanyCard from '../../components/shared/CompanyCard';
import CompanyFilters from '../../components/shared/CompanyFilters';
import { CompanyCardSkeleton } from '../../components/shared/Skeleton';

const EMPTY_FILTERS = { stage: '', sector: '', type: '', ctcMin: '', ctcMax: '', branch: '' };

const themedSurface = 'linear-gradient(180deg, color-mix(in srgb, var(--surface) 97%, var(--text-primary) 3%) 0%, color-mix(in srgb, var(--surface-2) 94%, var(--text-primary) 6%) 100%)';
const themedWash = 'color-mix(in srgb, var(--surface-2) 84%, var(--text-primary) 16%)';

const EmptyState = ({ hasFilters, onClear, isCoordinator, onCreate }) => (
  <div className="card" style={{ gridColumn: '1 / -1', padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
    <div style={{ width: 68, height: 68, borderRadius: 18, background: themedWash, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: 'var(--shadow-soft)' }}>
      <Building2 size={28} style={{ color: 'var(--text-muted)' }} />
    </div>
    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
      {hasFilters ? 'No matching companies' : 'No companies published yet'}
    </h3>
    <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 420, lineHeight: 1.7, marginBottom: 20 }}>
      {hasFilters
        ? 'Try changing filters or search keywords to discover more opportunities.'
        : isCoordinator
          ? 'Add your first company and open applications for students.'
          : 'Your placement coordinator will publish opportunities here soon.'}
    </p>
    {hasFilters && (
      <button
        type="button"
        onClick={onClear}
        className="btn-secondary"
      >
        Clear Filters
      </button>
    )}
    {!hasFilters && isCoordinator && (
      <button
        type="button"
        onClick={onCreate}
        className="btn-primary"
      >
        <Plus size={15} /> Add First Company
      </button>
    )}
  </div>
);

const CompaniesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordinator';
  const isStudent = user?.role === 'student';

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const hasFilters = Object.values(filters).some(Boolean) || search;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, search, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await companyService.getAll(params);
      setCompanies(res.data || []);
      setPagination(res.pagination || {});
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearch('');
    setSearchInput('');
    setPage(1);
  };

  return (
    <div className="page-enter" style={{ padding: 'clamp(14px,2.4vw,24px)', maxWidth: 1480, margin: '0 auto', overflowX: 'hidden' }}>
      <section className="hero-shell hero-shell--coordinator" style={{ padding: 'clamp(16px,2.2vw,24px)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Explore Companies
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Discover active opportunities, track deadlines, and apply before cutoffs.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-accent" style={{ fontSize: 11 }}>
              {pagination.total ?? 0} companies
            </span>
            {isCoordinator && (
              <button
                type="button"
                onClick={() => navigate('/coordinator/companies/new')}
                className="btn-primary"
                style={{ height: 40, padding: '0 16px', fontSize: 13 }}
              >
                <Plus size={14} /> Add Company
              </button>
            )}
          </div>
        </div>
      </section>

      <div>
        <main style={{ minWidth: 0 }}>
          <div className="card" style={{ padding: 12, marginBottom: 14, background: themedSurface, boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search by company, sector, role..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    paddingLeft: 36,
                    paddingRight: 12,
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--border)',
                    background: themedWash,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen((p) => !p)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 40,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-input)',
                  border: `1px solid ${filtersOpen || hasFilters ? 'var(--border-strong)' : 'var(--border)'}`,
                  background: filtersOpen || hasFilters ? themedWash : 'transparent',
                  color: filtersOpen || hasFilters ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={14} /> Filters
                {hasFilters && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
              </button>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  height: 40,
                  padding: '0 3px',
                  borderRadius: 10,
                  background: themedWash,
                  border: '1px solid var(--border)',
                }}
              >
                {[{ id: 'grid', icon: LayoutGrid }, { id: 'list', icon: List }].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: view === id ? 'var(--surface)' : 'transparent',
                      color: view === id ? 'var(--accent)' : 'var(--text-muted)',
                      boxShadow: view === id ? 'var(--shadow-soft)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div
            className={!loading && companies.length > 0 ? 'stagger-children' : ''}
            style={{
              display: 'grid',
              gap: view === 'list' ? 0 : 16,
              gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
              width: '100%',
              maxWidth: 'none',
            }}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <CompanyCardSkeleton key={i} />)
              : companies.length === 0
                ? (
                  <EmptyState
                    hasFilters={hasFilters}
                    onClear={handleClearFilters}
                    isCoordinator={isCoordinator}
                    onCreate={() => navigate('/coordinator/companies/new')}
                  />
                )
                : companies.map((c) => (
                  <CompanyCard
                    key={c._id}
                    company={c}
                    showApply={isStudent}
                    view={view}
                    onApply={(company) => navigate(`/companies/${company._id}`)}
                  />
                ))}
          </div>

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 28 }}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary"
                style={{ height: 40, padding: '0 16px', fontSize: 13, opacity: page === 1 ? 0.45 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>

              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 56, textAlign: 'center' }}>
                {page} / {pagination.pages}
              </span>

              <button
                type="button"
                disabled={page === pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary"
                style={{ height: 40, padding: '0 16px', fontSize: 13, opacity: page === pagination.pages ? 0.45 : 1, cursor: page === pagination.pages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>

      {filtersOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
              background: 'transparent',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(420px, 100vw)',
              height: '100vh',
              borderRadius: '20px 0 0 20px',
              padding: 16,
              overflowY: 'auto',
              animation: 'fadeSlideUp 0.2s ease',
              background: themedSurface,
              boxShadow: 'var(--shadow-elevated)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: themedWash,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>
            <CompanyFilters filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
