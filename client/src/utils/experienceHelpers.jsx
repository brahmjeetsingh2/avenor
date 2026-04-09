import React from 'react';
import { Star } from 'lucide-react';

// ─── Time ago ─────────────────────────────────────────────────────────────────
export const timeAgo = (date) => {
  const diff   = Date.now() - new Date(date).getTime();
  const mins   = Math.floor(diff / 60000);
  const hours  = Math.floor(diff / 3600000);
  const days   = Math.floor(diff / 86400000);
  const weeks  = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (mins  < 1)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  if (weeks < 4)   return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

// ─── Difficulty stars ─────────────────────────────────────────────────────────
export const DifficultyStars = ({ value, size = 14, className = '' }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        style={{
          color: i <= value ? 'var(--warning)' : 'var(--border)',
          fill:  i <= value ? 'var(--warning)' : 'transparent',
        }}
      />
    ))}
  </div>
);

// ─── Verdict badge ────────────────────────────────────────────────────────────
const VERDICT_CFG = {
  selected: {
    label:  'Selected 🎉',
    color:  'var(--status-success)',
    bg:     'rgba(52, 199, 89, 0.12)',
    border: 'rgba(52, 199, 89, 0.25)',
  },
  rejected: {
    label:  'Rejected',
    color:  'var(--danger)',
    bg:     'rgba(255, 69, 58, 0.12)',
    border: 'rgba(255, 69, 58, 0.25)',
  },
  waitlisted: {
    label:  'Waitlisted',
    color:  'var(--warning)',
    bg:     'rgba(255, 159, 10, 0.12)',
    border: 'rgba(255, 159, 10, 0.25)',
  },
};

export const VerdictBadge = ({ verdict, size = 'sm' }) => {
  const cfg = VERDICT_CFG[verdict] || VERDICT_CFG.rejected;
  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        fontWeight:   600,
        borderRadius: 'var(--radius-pill)',
        border:       `1px solid ${cfg.border}`,
        background:   cfg.bg,
        color:        cfg.color,
        fontSize:     size === 'sm' ? 11 : 12,
        padding:      size === 'sm' ? '2px 10px' : '4px 12px',
        whiteSpace:   'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {cfg.label}
    </span>
  );
};

// ─── Round type label ─────────────────────────────────────────────────────────
export const ROUND_CFG = {
  aptitude: {
    label:  'Aptitude',
    color:  'var(--accent)',
    bg:     'rgba(10, 132, 255, 0.12)',
  },
  technical: {
    label:  'Technical',
    color:  'var(--accent)',
    bg:     'rgba(10, 132, 255, 0.10)',
  },
  hr: {
    label:  'HR',
    color:  'var(--warning)',
    bg:     'rgba(255, 159, 10, 0.12)',
  },
  managerial: {
    label:  'Managerial',
    color:  'var(--warning)',
    bg:     'rgba(255, 159, 10, 0.10)',
  },
  group_discussion: {
    label:  'GD',
    color:  'var(--status-success)',
    bg:     'rgba(52, 199, 89, 0.12)',
  },
  coding: {
    label:  'Coding',
    color:  'var(--status-success)',
    bg:     'rgba(52, 199, 89, 0.10)',
  },
  case_study: {
    label:  'Case Study',
    color:  'var(--text-secondary)',
    bg:     'var(--surface-2)',
  },
};

export const RoundTag = ({ type, className = '' }) => {
  const cfg = ROUND_CFG[type] || {
    label:  type,
    color:  'var(--accent)',
    bg:     'rgba(10, 132, 255, 0.10)',
  };
  return (
    <span
      className={className}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        fontSize:     11,
        fontWeight:   600,
        padding:      '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background:   cfg.bg,
        color:        cfg.color,
        whiteSpace:   'nowrap',
        letterSpacing: '0.03em',
      }}
    >
      {cfg.label}
    </span>
  );
};