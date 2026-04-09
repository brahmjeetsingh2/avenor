import React from 'react';
import { Calendar, Clock, Link as LinkIcon, MapPin, FileText, User } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { StatusBadge, STATUS_CONFIG } from '../../utils/applicationStatus';
import { CompanyLogo } from '../../components/shared/CompanyCard';

const TimelineStep = ({ entry, isLast }) => {
  const cfg = STATUS_CONFIG[entry.status] || {};
  return (
    <div className="flex gap-3 items-stretch">
      <div className="flex flex-col items-center pt-0.5">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm ${cfg.bg} ${cfg.border}`}>
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-[var(--color-border)] mt-1 min-h-[20px]" />}
      </div>
      <div className="pb-4 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--surface-2)] px-4 py-3 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={entry.status} />
          <span className="text-xs text-[var(--color-text-muted)]">
            {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {entry.note && <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-6">{entry.note}</p>}
        {entry.updatedBy?.name && (
          <p className="text-xs text-[var(--color-text-muted)] mt-2 flex items-center gap-1">
            <User size={10} /> {entry.updatedBy.name}
          </p>
        )}
      </div>
    </div>
  );
};

const ApplicationDetailModal = ({ application, isOpen, onClose, onWithdraw }) => {
  if (!application) return null;
  const { company, status, statusHistory = [], interviewSlot, coordinatorNotes, createdAt } = application;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Application Detail" size="md">
      <div className="space-y-5">
        {/* Company header */}
        <div className="relative overflow-hidden p-4 rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(17,17,17,0.1)_0%,rgba(58,58,58,0.08)_100%)] shadow-[var(--shadow-soft)]">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(255,255,255,0.34), transparent 36%)' }} />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
            <CompanyLogo logo={company?.logo} name={company?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[var(--color-text-primary)] truncate">{company?.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{company?.sector} · {company?.type}</p>
            </div>
            <div className="sm:ml-auto self-start sm:self-auto">
              <StatusBadge status={status} size="md" />
            </div>
          </div>
        </div>

        {/* Interview slot */}
        {interviewSlot?.date && (
          <div className="p-4 rounded-2xl border border-[rgba(17,17,17,0.16)] bg-[linear-gradient(180deg,rgba(17,17,17,0.08)_0%,rgba(17,17,17,0.03)_100%)] space-y-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-[0.12em]">Interview Slot</p>
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">Scheduled</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)] bg-[var(--surface)] border border-[var(--color-border)] rounded-xl px-3 py-2">
                <Calendar size={14} className="text-[var(--accent)]" />
                {new Date(interviewSlot.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {interviewSlot.time && (
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)] bg-[var(--surface)] border border-[var(--color-border)] rounded-xl px-3 py-2">
                  <Clock size={14} className="text-[var(--accent)]" /> {interviewSlot.time}
                </div>
              )}
              {interviewSlot.link && (
                <a href={interviewSlot.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--accent)] hover:opacity-80 col-span-1 sm:col-span-2 font-semibold bg-[var(--surface)] border border-[var(--color-border)] rounded-xl px-3 py-2">
                  <LinkIcon size={14} /> Join Link
                </a>
              )}
              {interviewSlot.venue && (
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)] col-span-1 sm:col-span-2 bg-[var(--surface)] border border-[var(--color-border)] rounded-xl px-3 py-2">
                  <MapPin size={14} className="text-[var(--accent)]" /> {interviewSlot.venue}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coordinator notes */}
        {coordinatorNotes && (
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-[var(--accent)]" />
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Notes from Coordinator</p>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-6">{coordinatorNotes}</p>
          </div>
        )}

        {/* Status timeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Status History</p>
            <span className="text-[11px] text-[var(--text-muted)]">{statusHistory.length} update{statusHistory.length === 1 ? '' : 's'}</span>
          </div>
          <div>
            {[...statusHistory].reverse().map((entry, i, arr) => (
              <TimelineStep key={entry._id || i} entry={entry} isLast={i === arr.length - 1} />
            ))}
          </div>
        </div>

        {/* Applied date */}
        <p className="text-xs text-[var(--color-text-muted)] text-center border-t border-[var(--color-border)] pt-3">
          Applied on {new Date(createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* Withdraw */}
        {!['offer', 'rejected'].includes(status) && onWithdraw && (
          <button
            onClick={() => { onWithdraw(application._id); onClose(); }}
            className="w-full text-sm text-danger-500 hover:text-danger-600 font-semibold py-2.5 rounded-xl hover:bg-danger-500/10 transition-colors border border-danger-500/10 hover:border-danger-500/20 bg-[var(--surface)]"
          >
            Withdraw Application
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ApplicationDetailModal;
