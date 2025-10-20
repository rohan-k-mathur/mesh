// components/ui/FloatingSheet.tsx
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface FloatingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: 'left' | 'right';
  width?: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBackdrop?: boolean;
  icon?: React.ReactNode;
}

export function FloatingSheet({
  open,
  onOpenChange,
  side,
  width = 400,
  title,
  subtitle,
  children,
  showBackdrop = true,
  icon,
}: FloatingSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted) return null;

  const sheetContent = (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className={clsx(
            'fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        className={clsx(
          'fixed top-0 bottom-0 z-50 flex flex-col',
          'bg-white/95 backdrop-blur-md border-slate-200 shadow-2xl',
          'transition-transform duration-300 ease-out',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          open 
            ? 'translate-x-0' 
            : side === 'left' 
              ? '-translate-x-full' 
              : 'translate-x-full'
        )}
        style={{ width }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900 truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-slate-500 truncate">{subtitle}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onOpenChange(false)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6 space-y-4">
            {children}
          </div>
        </div>

        {/* Optional: Resize handle */}
        <div
          className={clsx(
            'absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400/50 transition-colors',
            side === 'left' ? 'right-0' : 'left-0'
          )}
          aria-hidden="true"
        />
      </div>
    </>
  );

  return createPortal(sheetContent, document.body);
}

// Floating toggle button
interface SheetToggleButtonProps {
  side: 'left' | 'right';
  open: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export function SheetToggleButton({
  side,
  open,
  onClick,
  icon,
  label,
  badge,
}: SheetToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'fixed z-30 flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-white/10 backdrop-blur-lg  shadow-lg',
        'hover:shadow-xl hover:scale-105',
        'transition-all duration-200',
        'group',
        side === 'left' ? 'left-4' : 'right-4',
        'top-24'
      )}
      aria-label={label}
      aria-expanded={open}
    >
      {/* Icon */}
      <div className={clsx(
        'w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors',
        open && 'text-indigo-600'
      )}>
        {icon}
      </div>

      {/* Label (hidden when open) */}
      <span className={clsx(
        'text-sm font-medium text-slate-700 transition-all duration-200',
        open ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
      )}>
        {label}
      </span>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}

      {/* Open indicator */}
      {open && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full" />
      )}
    </button>
  );
}