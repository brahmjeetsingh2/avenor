import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center
        text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
        hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--color-border)] transition-all duration-200
        dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:border-[rgba(255,255,255,0.1)]
        dark:hover:bg-[rgba(255,255,255,0.08)] dark:hover:border-[rgba(255,255,255,0.18)]
        ${className}
      `}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={18} className="transition-transform duration-300 rotate-0 hover:rotate-12" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
