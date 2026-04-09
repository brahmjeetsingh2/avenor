import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  footer,
  fitContent = false,
  bodyClassName = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'var(--overlay)' }}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className={`
          relative w-full ${sizes[size]} modal-shell p-0 overflow-hidden
          animate-slide-up z-10 max-h-[calc(100vh-1rem)] sm:max-h-[90vh] flex flex-col
        `}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            {title && (
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--surface-2)] transition-colors ml-auto hover-lift dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--color-text-primary)] dark:border dark:border-[rgba(255,255,255,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        {/* Body */}
        <div
          className={`${fitContent ? 'max-h-[70vh]' : 'flex-1 min-h-0'} overflow-y-auto overscroll-contain p-6 ${bodyClassName}`}
        >
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
