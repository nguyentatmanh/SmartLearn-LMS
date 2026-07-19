'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';

interface SectionErrorStateProps {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  className?: string;
}

export default function SectionErrorState({
  title,
  message,
  onRetry,
  className = '',
}: SectionErrorStateProps) {
  const { t, language } = usePreference();

  const displayTitle = title || t('sectionErrorTitle');
  const displayMessage = message || t('sectionErrorDesc');

  return (
    <div
      className={`p-6 rounded-2xl border border-danger/20 bg-danger/5 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="p-2.5 rounded-xl bg-danger/10 text-danger shrink-0">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h4 className="font-bold text-sm text-foreground truncate">{displayTitle}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {displayMessage}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <RefreshCw className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{t('teacherRetry')}</span>
        </button>
      )}
    </div>
  );
}
