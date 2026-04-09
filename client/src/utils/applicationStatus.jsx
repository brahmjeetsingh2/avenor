import React from 'react';

// ─── Status config ────────────────────────────────────────────────────────────
// All colors use CSS variables so dark + light themes work automatically.
export const STATUS_CONFIG = {
  applied: {
    label:  'Applied',
    color:  'var(--accent)',
    bg:     'rgba(10, 132, 255, 0.10)',
    border: 'rgba(10, 132, 255, 0.22)',
    dot:    'var(--accent)',
  },
  shortlisted: {
    label:  'Shortlisted',
    color:  'var(--accent)',
    bg:     'rgba(10, 132, 255, 0.14)',
    border: 'rgba(10, 132, 255, 0.28)',
    dot:    'var(--accent)',
  },
  test: {
    label:  'Test',
    color:  'var(--warning)',
    bg:     'rgba(255, 159, 10, 0.10)',
    border: 'rgba(255, 159, 10, 0.22)',
    dot:    'var(--warning)',
  },
  interview_r1: {
    label:  'Interview R1',
    color:  'var(--warning)',
    bg:     'rgba(255, 159, 10, 0.10)',
    border: 'rgba(255, 159, 10, 0.22)',
    dot:    'var(--warning)',
  },
  interview_r2: {
    label:  'Interview R2',
    color:  'var(--warning)',
    bg:     'rgba(255, 159, 10, 0.12)',
    border: 'rgba(255, 159, 10, 0.25)',
    dot:    'var(--warning)',
  },
  interview_r3: {
    label:  'Interview R3',
    color:  'var(--warning)',
    bg:     'rgba(255, 159, 10, 0.14)',
    border: 'rgba(255, 159, 10, 0.28)',
    dot:    'var(--warning)',
  },
  offer: {
    label:  'Offer 🎉',
    color:  'var(--status-success)',
    bg:     'rgba(52, 199, 89, 0.12)',
    border: 'rgba(52, 199, 89, 0.25)',
    dot:    'var(--status-success)',
  },
  rejected: {
    label:  'Rejected',
    color:  'var(--danger)',
    bg:     'rgba(255, 69, 58, 0.12)',
    border: 'rgba(255, 69, 58, 0.25)',
    dot:    'var(--danger)',
  },
};

export const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export const KANBAN_COLUMNS = [
  { id: 'applied',      label: 'Applied'      },
  { id: 'shortlisted',  label: 'Shortlisted'  },
  { id: 'test',         label: 'Test'         },
  { id: 'interview_r1', label: 'Interview R1' },
  { id: 'interview_r2', label: 'Interview R2' },
  { id: 'interview_r3', label: 'Interview R3' },
  { id: 'offer',        label: 'Offer'        },
  { id: 'rejected',     label: 'Rejected'     },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status, size = 'sm' }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.applied;
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        fontWeight:    600,
        borderRadius:  'var(--radius-pill)',
        border:        `1px solid ${cfg.border}`,
        background:    cfg.bg,
        color:         cfg.color,
        fontSize:      size === 'sm' ? 11 : 12,
        padding:       size === 'sm' ? '2px 10px' : '4px 12px',
        whiteSpace:    'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {/* Dot indicator */}
      <span
        style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   cfg.dot,
          flexShrink:   0,
        }}
      />
      {cfg.label}
    </span>
  );
};