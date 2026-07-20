'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';

interface AdminDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  selectedUserId?: number | null;
}

export const AdminDetailDrawer: React.FC<AdminDetailDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  selectedUserId
}) => {
  const { t } = usePreference();
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const contentScrollerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset internal drawer content scroll when opening or switching account
  useEffect(() => {
    if (isOpen && contentScrollerRef.current) {
      contentScrollerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [isOpen, selectedUserId]);

  // Background Scroll Lock & Focus Management
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Keyboard accessibility (Escape key & Focus trap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end overflow-hidden pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200 ease-out motion-reduce:transition-none"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative w-full sm:w-[560px] md:w-[600px] h-[100dvh] bg-card border-l border-border shadow-2xl text-foreground flex flex-col overflow-hidden transform transition-transform duration-200 ease-out motion-reduce:transition-none translate-x-0 pb-[env(safe-area-inset-bottom)]"
      >
        {/* NON-SCROLLING HEADER */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-border flex items-center justify-between bg-card text-card-foreground gap-3 z-10">
          {/* Mobile Back button */}
          <button
            onClick={onClose}
            className="sm:hidden flex items-center gap-1.5 p-2 rounded-xl text-primary font-semibold text-xs hover:bg-primary/10 transition-colors min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('admin.users.detailBack')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('admin.users.detailBack')}</span>
          </button>

          <div className="min-w-0 flex-1">
            <h2 id="drawer-title" className="text-lg sm:text-xl font-bold text-foreground truncate">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
          </div>

          {/* Desktop Close button */}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="hidden sm:flex p-2.5 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('admin.users.detailClose')}
            title={t('admin.users.detailClose')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INDEPENDENTLY SCROLLING CONTENT */}
        <div
          ref={contentScrollerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6"
        >
          {children}
        </div>

        {/* NON-SCROLLING ACTION FOOTER */}
        {footer && (
          <div className="shrink-0 p-4 sm:p-6 border-t border-border bg-card text-card-foreground flex flex-wrap items-center justify-end gap-3 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
