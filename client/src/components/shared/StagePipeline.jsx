import React from 'react';
import { CheckCircle, Megaphone, Presentation, ClipboardList, Users, Gift, XCircle } from 'lucide-react';

export const STAGES = [
  { id: 'announced', label: 'Announced', icon: Megaphone,      color: 'text-[var(--accent)]',    bg: 'bg-[var(--surface-2)]',    border: 'border-[var(--border)]' },
  { id: 'ppt',       label: 'PPT',       icon: Presentation,   color: 'text-[var(--accent)]',    bg: 'bg-[var(--surface-2)]',    border: 'border-[var(--border)]' },
  { id: 'test',      label: 'Test',      icon: ClipboardList,  color: 'text-[var(--accent)]',    bg: 'bg-[var(--surface-2)]',    border: 'border-[var(--border)]' },
  { id: 'interview', label: 'Interview', icon: Users,          color: 'text-[var(--accent)]',    bg: 'bg-[var(--surface-2)]',    border: 'border-[var(--border)]' },
  { id: 'offer',     label: 'Offer',     icon: Gift,           color: 'text-[var(--accent)]',    bg: 'bg-[var(--surface-2)]',    border: 'border-[var(--border)]' },
  { id: 'closed',    label: 'Closed',    icon: XCircle,        color: 'text-[var(--color-text-muted)]', bg: 'bg-[var(--color-border)]', border: 'border-[var(--color-border)]' },
];

export const getStage = (id) => STAGES.find((s) => s.id === id) || STAGES[0];

const StagePipeline = ({ currentStage, compact = false }) => {
  const currentIdx = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className={`flex items-center w-full ${compact ? 'gap-0' : 'gap-0'}`}>
      {STAGES.map((stage, idx) => {
        const isDone    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const Icon      = stage.icon;

        return (
          <React.Fragment key={stage.id}>
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              {/* Circle */}
              <div
                className={`
                  flex items-center justify-center rounded-full border-2 transition-all
                  ${compact ? 'w-7 h-7' : 'w-9 h-9'}
                  ${isDone    ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--text-reverse)]' : ''}
                  ${isCurrent ? `${stage.bg} ${stage.border} ${stage.color}` : ''}
                  ${!isDone && !isCurrent ? 'bg-[var(--color-border)] border-[var(--color-border)] text-[var(--color-text-muted)]' : ''}
                `}
              >
                {isDone
                  ? <CheckCircle size={compact ? 14 : 16} />
                  : <Icon size={compact ? 12 : 15} />
                }
              </div>
              {/* Label */}
              {!compact && (
                <span className={`text-[10px] font-semibold text-center leading-tight ${
                  isCurrent ? stage.color : isDone ? 'text-[var(--accent)]' : 'text-[var(--color-text-muted)]'
                }`}>
                  {stage.label}
                </span>
              )}
            </div>
            {/* Connector line */}
            {idx < STAGES.length - 1 && (
              <div className={`h-0.5 flex-shrink-0 w-full max-w-[24px] transition-colors ${
                idx < currentIdx ? 'bg-[var(--accent)]' : 'bg-[var(--color-border)]'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StagePipeline;
