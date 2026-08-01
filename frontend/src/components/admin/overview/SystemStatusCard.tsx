'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';

interface SystemStatusCardProps {
  isHealthy: boolean;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ isHealthy }) => {
  const { t } = usePreference();

  return (
    <div
      className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card p-6 shadow-sm"
      role="status"
      aria-live="polite"
      aria-label={`${t('admin.overview.systemStatus')}: ${isHealthy ? t('admin.overview.statusStable') : 'Unstable'}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">
          {t('admin.overview.systemStatus')}
        </h3>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="sr-only">
          {isHealthy ? 'System is healthy and operational' : 'System requires attention'}
        </span>
        {/* Pulsing LED Dot */}
        <span
          className={`w-3 h-3 rounded-full shrink-0 ${
            isHealthy ? 'bg-emerald-500 pulse-led' : 'bg-rose-500'
          }`}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold text-foreground">
          {t('admin.overview.statusStable')}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('admin.overview.statusDescription')}
      </p>
    </div>
  );
};
