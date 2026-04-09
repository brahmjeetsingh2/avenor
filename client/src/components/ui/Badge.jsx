import React from 'react';

const variants = {
  primary:   'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--border)]',
  accent:    'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--border)]',
  success:   'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]',
  warning:   'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
  danger:    'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]',
  ghost:     'bg-[var(--color-border)] text-[var(--color-text-secondary)] border-transparent',
  announced: 'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--border)]',
  ppt:       'bg-[var(--surface-2)] text-[var(--accent)] border-[var(--border)]',
  test:      'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-border)]',
  interview: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]',
  offer:     'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]',
  closed:    'bg-[var(--color-border)] text-[var(--color-text-muted)] border-transparent',
};

const sizes = {
  xs: 'text-[10px] px-2 py-0.5 rounded-md',
  sm: 'text-xs px-2.5 py-0.5 rounded-lg',
  md: 'text-xs px-3 py-1 rounded-lg',
};

const Badge = ({
  children,
  variant = 'ghost',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold border
        ${variants[variant] || variants.ghost}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success' ? 'bg-[var(--success)]' :
            variant === 'danger'  ? 'bg-[var(--danger)]'  :
            variant === 'warning' ? 'bg-[var(--warning)]' :
            'bg-[var(--accent)]'
          } animate-pulse`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
