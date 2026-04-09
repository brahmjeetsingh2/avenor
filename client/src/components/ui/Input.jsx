import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className = '',
      inputClassName = '',
      fullWidth = true,
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              w-full bg-[var(--input-bg)] border rounded-xl
              text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]
              text-sm py-2.5 transition-all duration-200 outline-none
              focus:border-[var(--accent)] focus:ring-0 focus:shadow-[var(--input-focus-ring)]
              ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[var(--input-error-ring)]' : 'border-[var(--input-border)]'}
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              ${inputClassName}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 text-[var(--color-text-muted)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-[var(--danger)] font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
