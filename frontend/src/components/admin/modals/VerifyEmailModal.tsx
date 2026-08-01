'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X, CheckCircle2, User, Mail, Shield, AlertTriangle } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';

interface UserVerificationTarget {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_approved: boolean;
}

interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  user: UserVerificationTarget | null;
}

export const VerifyEmailModal: React.FC<VerifyEmailModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user
}) => {
  const { t } = usePreference();
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setIsConfirmed(false);
      setErrorMsg(null);
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // Focus textarea on open
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !mounted || !user) return null;

  const trimmedReason = reason.trim();
  const isValidReason = trimmedReason.length >= 10 && trimmedReason.length <= 500;
  const canSubmit = isValidReason && isConfirmed && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm(trimmedReason);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || t('admin.users.toastVerifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-email-modal-title"
      aria-describedby="verify-email-modal-desc"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-start justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 id="verify-email-modal-title" className="text-lg font-bold text-foreground">
                {t('admin.users.modalVerifyTitle')}
              </h3>
              <p id="verify-email-modal-desc" className="text-xs text-muted-foreground mt-0.5">
                {t('admin.users.modalVerifyDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={t('cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* User Target Card */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {t('admin.users.userFullName')}
              </span>
              <span className="font-medium text-foreground">{user.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {t('admin.users.userEmail')}
              </span>
              <span className="font-mono text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {t('admin.users.userRole')}
              </span>
              <span className="capitalize font-medium text-foreground">{user.role}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="font-semibold text-muted-foreground">
                {t('admin.users.userActiveStatus')}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                user.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {user.is_active ? t('admin.users.badgeActive') : t('admin.users.badgeInactive')}
              </span>
            </div>
            {user.role === 'teacher' && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">
                  {t('admin.users.userApprovalStatus')}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                  user.is_approved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {user.is_approved ? t('admin.users.statusApproved') : t('admin.users.statusPending')}
                </span>
              </div>
            )}
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              {t('admin.users.modalVerifyWarning')}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="verify-reason" className="text-xs font-semibold text-foreground">
                {t('admin.users.reasonLabel')}
              </label>
              <span className={`text-[11px] font-mono ${
                trimmedReason.length < 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {t('admin.users.reasonMinLengthNote').replace('{current}', trimmedReason.length.toString())}
              </span>
            </div>
            <textarea
              id="verify-reason"
              ref={textareaRef}
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.users.reasonPlaceholder')}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-normal select-none">
              {t('admin.users.confirmCheckbox')}
            </span>
          </label>

          {/* Footer Controls */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 min-h-[44px] text-xs font-bold rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-5 py-2.5 min-h-[44px] text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {t('admin.users.btnConfirmVerify')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
