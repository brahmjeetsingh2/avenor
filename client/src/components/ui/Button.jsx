import React from 'react';
import Spinner from './Spinner';

const variants = {
  primary:
    'bg-[linear-gradient(120deg,rgba(90,90,90,1),rgba(70,70,70,1))] dark:bg-[linear-gradient(120deg,rgba(245,245,245,0.18),rgba(245,245,245,0.1))] hover:brightness-[1.08] dark:hover:brightness-[1.05] text-[var(--text-reverse)] dark:text-[var(--text-primary)] border-transparent dark:border dark:border-[rgba(255,255,255,0.12)] shadow-md dark:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)]',
  secondary:
    'bg-transparent dark:bg-[rgba(255,255,255,0.04)] border-[1.5px] border-[var(--color-border)] dark:border-[var(--border-strong)] text-[var(--color-text-secondary)] dark:text-[var(--color-text-primary)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] hover:bg-[var(--surface-2)] dark:hover:bg-[rgba(255,255,255,0.08)]',
  ghost:
    'bg-transparent dark:bg-transparent border-transparent text-[var(--accent)] dark:text-[var(--text-primary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] dark:hover:bg-[rgba(255,255,255,0.06)]',
  danger:
    'bg-[var(--danger-bg)] hover:bg-[var(--danger-bg-hover)] text-[var(--danger)] border-[var(--danger-border)] shadow-none dark:shadow-[0_12px_24px_-18px_rgba(0,0,0,0.65)]',
  accent:
    'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-reverse)] border-transparent shadow-md dark:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)]',
  success:
    'bg-[var(--success-bg)] hover:bg-[var(--success-bg-hover)] text-[var(--success)] border-[var(--success-border)] shadow-none dark:shadow-[0_12px_24px_-18px_rgba(0,0,0,0.65)]',
  pro:
    'bg-[linear-gradient(90deg,var(--gradient-pro-start),var(--gradient-pro-end))] dark:bg-[linear-gradient(90deg,rgba(245,245,245,0.2),rgba(245,245,245,0.12))] text-[var(--text-reverse)] dark:text-[var(--text-primary)] border-transparent dark:border dark:border-[rgba(255,255,255,0.12)] shadow-md dark:shadow-[0_16px_34px_-24px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)]',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3.5 py-1.5 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-2xl',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        border transition-all duration-200 cursor-pointer hover-lift
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97] select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="text-current" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
