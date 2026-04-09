import React, { useState, useEffect } from 'react';
import { STAGES } from '../../components/shared/StagePipeline';
import companyService from '../../services/companyService';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

const UpdateStageModal = ({ isOpen, onClose, company, onUpdated }) => {
  const [stage, setStage]      = useState(company?.currentStage || 'announced');
  const [description, setDesc] = useState('');
  const [date, setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');
  const [mounted, setMounted]  = useState(false);
  const [focused, setFocused]  = useState(null);

  /* Stagger mount animation */
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setMounted(true), 30);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  /* Reset on open */
  useEffect(() => {
    if (isOpen) {
      setStage(company?.currentStage || 'announced');
      setDesc('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, company]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await companyService.updateStage(company._id, { stage, description, date });
      onUpdated(res.data.company);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  const selectedStage = STAGES.find(s => s.id === stage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Recruitment Stage"
      size="sm"
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-11 rounded-input font-semibold transition-all duration-200 hover:bg-[var(--surface-2)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="flex-1 h-11 rounded-input font-semibold btn-primary relative overflow-hidden group"
          >
            {/* shimmer sweep on hover */}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              -translate-x-full group-hover:translate-x-full
              transition-transform duration-700 ease-in-out pointer-events-none" />
            <span className="relative z-10">Update Stage</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* ── Error banner ───────────────────────────────────────────── */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            ${error ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl
            border border-[var(--danger)]/20 bg-[var(--danger)]/12
            text-sm text-[var(--danger)] font-medium"
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 4.25a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z"/>
            </svg>
            {error}
          </div>
        </div>

        {/* ── Stage selector ─────────────────────────────────────────── */}
        <div
          className={`space-y-3 transition-all duration-300 delay-[60ms]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              New Stage
            </label>
            {selectedStage && (
              <span className={`badge ${selectedStage.bg} ${selectedStage.color} text-[10px] px-2.5 py-1`}>
                {selectedStage.label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((s, i) => {
              const isSelected = stage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  style={{ transitionDelay: mounted ? `${i * 35}ms` : '0ms' }}
                  className={`
                    relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left
                    text-sm font-semibold overflow-hidden group/stage
                    transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    ${isSelected
                      ? `${s.bg} ${s.border} ${s.color} shadow-[0_0_0_1px_currentColor]/10 scale-[1.02]`
                      : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface-2)] hover:border-[var(--text-muted)]/40 hover:bg-[var(--surface)] hover:text-[var(--text-primary)] hover:scale-[1.01]'
                    }
                  `}
                >
                  {/* Selected glow ring */}
                  {isSelected && (
                    <span className="absolute inset-0 rounded-xl ring-2 ring-current opacity-20 pointer-events-none" />
                  )}

                  {/* Icon wrapper */}
                  <span className={`
                    flex items-center justify-center w-7 h-7 rounded-lg shrink-0
                    transition-all duration-200
                    ${isSelected ? 'bg-current/10' : 'bg-[var(--border)]/60 group-hover/stage:bg-[var(--border)]'}
                  `}>
                    <s.icon size={14} className={isSelected ? '' : 'opacity-70'} />
                  </span>

                  <span className="leading-tight">{s.label}</span>

                  {/* Active checkmark */}
                  {isSelected && (
                    <span className="ml-auto">
                      <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 7l3.5 3.5L12 3.5" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className={`h-px bg-[var(--border)] transition-all duration-300 delay-[120ms]
          ${mounted ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
          style={{ transformOrigin: 'left' }}
        />

        {/* ── Date picker ────────────────────────────────────────────── */}
        <div
          className={`space-y-2 transition-all duration-300 delay-[150ms]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Date
          </label>
          <div className="relative">
            {/* Calendar icon */}
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="12" height="11" rx="2"/>
                <path d="M5 1v4M11 1v4M2 7h12"/>
              </svg>
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={() => setFocused('date')}
              onBlur={() => setFocused(null)}
              className={`
                input pl-10 text-sm cursor-pointer
                transition-all duration-200
                ${focused === 'date' ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(17,17,17,0.11)]' : ''}
              `}
            />
          </div>
        </div>

        {/* ── Notes textarea ─────────────────────────────────────────── */}
        <div
          className={`space-y-2 transition-all duration-300 delay-[200ms]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Notes
            </label>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              Optional
            </span>
          </div>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              onFocus={() => setFocused('notes')}
              onBlur={() => setFocused(null)}
              placeholder="e.g. Test scheduled at 2PM in Lab 3, 200 students shortlisted…"
              rows={3}
              className={`
                input h-auto py-3 text-sm resize-none leading-relaxed
                transition-all duration-200
                ${focused === 'notes' ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(17,17,17,0.11)]' : ''}
              `}
            />
            {/* Character count */}
            {description.length > 0 && (
              <span className="absolute bottom-2.5 right-3 text-[10px] text-[var(--text-muted)] font-medium pointer-events-none">
                {description.length}
              </span>
            )}
          </div>
        </div>

        {/* ── Stage change preview strip ──────────────────────────────── */}
        {selectedStage && company?.currentStage && company.currentStage !== stage && (
          <div className={`
            flex items-center gap-2 px-3.5 py-2.5 rounded-xl
            bg-[var(--accent)]/6 border border-[var(--accent)]/15
            text-xs font-medium text-[var(--text-secondary)]
            transition-all duration-300 delay-[220ms]
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          `}>
            <span className="text-[var(--text-muted)]">
              {STAGES.find(s => s.id === company.currentStage)?.label ?? company.currentStage}
            </span>
            <svg className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7h10M8 3l4 4-4 4"/>
            </svg>
            <span className={`font-semibold ${selectedStage.color}`}>
              {selectedStage.label}
            </span>
          </div>
        )}

      </div>
    </Modal>
  );
};

export default UpdateStageModal;