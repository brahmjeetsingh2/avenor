import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

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
  variant = 'default',
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

  const isSalary = variant === 'salary';
  const overlayClass = isSalary
    ? 'fixed inset-0 z-[1000] isolate bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden'
    : 'fixed inset-0 z-[1000] isolate bg-black/40 flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden';
  const shellClass = isSalary
    ? `w-[calc(100%-0.5rem)] sm:w-full ${sizes[size]} modal-shell rounded-2xl border border-[var(--color-border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)] overflow-hidden flex flex-col max-h-[calc(100dvh-0.5rem)] sm:max-h-[calc(100vh-4rem)] animate-slide-up`
    : `w-full ${sizes[size]} modal-shell rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[100dvh] sm:max-h-[calc(100vh-4rem)] animate-slide-up`;
  const headerClass = isSalary
    ? 'flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--surface)_86%,var(--surface-2)_14%)]'
    : 'flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]';
  const closeBtnClass = isSalary
    ? 'p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--surface-2)] ml-auto transition-colors'
    : 'p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] ml-auto transition-colors';
  const bodyBaseClass = isSalary
    ? `${fitContent ? 'max-h-[70vh]' : 'flex-1 min-h-0'} overflow-y-auto bg-[var(--surface)] px-5 py-4 ${bodyClassName}`
    : `${fitContent ? 'max-h-[70vh]' : 'flex-1 min-h-0'} overflow-y-auto px-5 py-4 ${bodyClassName}`;
  const footerClass = isSalary
    ? 'flex-shrink-0 px-5 py-3 border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row sm:gap-2.5 gap-2 bg-[color-mix(in_srgb,var(--surface)_88%,var(--surface-2)_12%)]'
    : 'flex-shrink-0 px-5 py-3 border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row sm:gap-2.5 gap-2 bg-[var(--surface)]';

  const modalNode = (
    <div className={overlayClass} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      {/* Modal container - handles all scrolling */}
      <div className={shellClass}>
        {/* Header */}
        {(title || showClose) && (
          <div className={headerClass}>
            {title && (
              <h3 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className={closeBtnClass}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        {/* Body - scrollable */}
        <div className={bodyBaseClass}>
          {children}
        </div>
        {/* Footer - always sticky at bottom */}
        {footer && (
          <div className={footerClass}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalNode;

  return createPortal(modalNode, document.body);
};

export default Modal;
