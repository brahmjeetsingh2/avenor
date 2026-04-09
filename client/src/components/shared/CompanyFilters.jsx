import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { STAGES } from './StagePipeline';

const SECTORS = ['Technology', 'Finance', 'Consulting', 'Core Engineering', 'Analytics', 'E-Commerce', 'Healthcare', 'Other'];
const TYPES   = [{ id: 'product', label: 'Product' }, { id: 'service', label: 'Service' }, { id: 'startup', label: 'Startup' }, { id: 'psu', label: 'PSU' }, { id: 'mnc', label: 'MNC' }];
const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Other'];

const FilterChip = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
      active
        ? 'bg-[var(--surface-2)] border-[var(--accent)]/35 text-[var(--accent)] shadow-[var(--shadow-soft)]'
        : 'bg-[var(--surface-2)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] hover:shadow-[var(--shadow-soft)]'
    }`}
  >
    {label}
  </button>
);

const Section = ({ title, children }) => (
  <div className="space-y-2.5">
    <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.14em]">{title}</p>
    {children}
  </div>
);

const CompanyFilters = ({ filters, onChange, onClear, className = '' }) => {
  const set = (key, val) => onChange({ ...filters, [key]: filters[key] === val ? '' : val });
  const hasActive = Object.values(filters).some((v) => v !== '' && v !== undefined);

  return (
    <aside className={`space-y-5 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
          <SlidersHorizontal size={15} /> Filters
        </div>
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-[var(--danger)] hover:opacity-80 font-semibold transition-colors"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Stage */}
      <Section title="Stage">
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <FilterChip key={s.id} label={s.label} active={filters.stage === s.id} onClick={() => set('stage', s.id)} />
          ))}
        </div>
      </Section>

      {/* Sector */}
      <Section title="Sector">
        <div className="flex flex-wrap gap-1.5">
          {SECTORS.map((s) => (
            <FilterChip key={s} label={s} active={filters.sector === s} onClick={() => set('sector', s)} />
          ))}
        </div>
      </Section>

      {/* Type */}
      <Section title="Company Type">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <FilterChip key={t.id} label={t.label} active={filters.type === t.id} onClick={() => set('type', t.id)} />
          ))}
        </div>
      </Section>

      {/* CTC Range */}
      <Section title="CTC Range (LPA)">
        <div className="flex items-center gap-2">
          <input
            type="number" placeholder="Min" min={0} value={filters.ctcMin || ''}
            onChange={(e) => onChange({ ...filters, ctcMin: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--surface)] text-[var(--color-text-primary)] text-xs outline-none transition-colors focus:border-[var(--accent)] focus:shadow-[var(--shadow-soft)]"
          />
          <span className="text-[var(--color-text-muted)] text-xs shrink-0">to</span>
          <input
            type="number" placeholder="Max" min={0} value={filters.ctcMax || ''}
            onChange={(e) => onChange({ ...filters, ctcMax: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--surface)] text-[var(--color-text-primary)] text-xs outline-none transition-colors focus:border-[var(--accent)] focus:shadow-[var(--shadow-soft)]"
          />
        </div>
      </Section>

      {/* Branch */}
      <Section title="Branch Eligibility">
        <select
          value={filters.branch || ''}
          onChange={(e) => onChange({ ...filters, branch: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--surface)] text-[var(--color-text-primary)] text-xs outline-none transition-colors focus:border-[var(--accent)] focus:shadow-[var(--shadow-soft)]"
        >
          <option value="">All branches</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Section>
    </aside>
  );
};

export default CompanyFilters;
