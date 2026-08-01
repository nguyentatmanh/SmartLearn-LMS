'use client';

import React from 'react';
import { FileEdit, UserPlus, Settings2, ClipboardCheck } from 'lucide-react';
import { RecentActivityEntry } from '@/types/admin';
import { usePreference } from '@/context/PreferenceContext';

interface RecentActivityLogsProps {
  entries: RecentActivityEntry[];
}

const ACTIVITY_ICONS: Record<RecentActivityEntry['type'], {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}> = {
  update: {
    icon: FileEdit,
    colorClass: 'text-sky-500',
    bgClass: 'bg-sky-500/10',
  },
  register: {
    icon: UserPlus,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
  config: {
    icon: Settings2,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
  },
  review: {
    icon: ClipboardCheck,
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
  },
};

export const RecentActivityLogs: React.FC<RecentActivityLogsProps> = ({ entries }) => {
  const { t } = usePreference();

  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t('admin.overview.recentLogs')}
      </h3>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {t('admin.overview.noAuditEvents')}
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const config = ACTIVITY_ICONS[entry.type];
            const Icon = config.icon;

            return (
              <div key={entry.id} className="flex items-start gap-3">
                {/* Activity Icon */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.bgClass}`}
                  aria-hidden="true"
                >
                  <Icon className={`w-4 h-4 ${config.colorClass}`} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{entry.userName}</span>
                    <span className="text-muted-foreground"> - {entry.action}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {entry.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
