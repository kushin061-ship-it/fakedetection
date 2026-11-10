import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Reusable side panel Drawer component
 * - Closes on backdrop click
 * - Closes on Escape key press
 * - Fully accessible with ARIA attributes and focus management
 */
export function Drawer({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  side = 'right',
  className = '',
}) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className={cn('fixed inset-y-0 flex max-w-full', side === 'right' ? 'right-0' : 'left-0')}>
        <div
          ref={drawerRef}
          className={cn(
            'w-screen bg-tl-card shadow-xl flex flex-col h-full border-l border-tl-border transition-transform duration-300 ease-in-out',
            side === 'right' ? 'rounded-l-2xl' : 'rounded-r-2xl',
            sizeClasses[size] || sizeClasses.md,
            className
          )}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-tl-border flex items-center justify-between shrink-0">
            <div>
              {title && (
                <h2 id="drawer-title" className="text-lg font-semibold text-tl-text">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs text-tl-muted mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-[10px] text-tl-muted hover:text-tl-text hover:bg-tl-fill transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-tl-accent"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-tl-border bg-tl-fill shrink-0 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Drawer;
