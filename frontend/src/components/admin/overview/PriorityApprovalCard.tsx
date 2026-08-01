'use client';

import React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import { PriorityApprovalItem } from '@/types/admin';
import { usePreference } from '@/context/PreferenceContext';
import { playNavClickSound } from '@/lib/sound';

interface PriorityApprovalCardProps {
  items: PriorityApprovalItem[];
  onAccept?: (id: number, type: 'course' | 'teacher') => void;
  onReject?: (id: number, type: 'course' | 'teacher') => void;
}

export const PriorityApprovalCard: React.FC<PriorityApprovalCardProps> = ({
  items,
  onAccept,
  onReject,
}) => {
  const { t } = usePreference();

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t('admin.overview.priorityApprovals')}
      </h3>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`} className="space-y-3">
            {/* Item Header */}
            <div className="flex items-start gap-3">
              {/* Avatar / Icon */}
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center shrink-0 border border-border/50 overflow-hidden group">
                {item.submittedByAvatar ? (
                  <img
                    src={item.submittedByAvatar}
                    alt={item.submittedBy}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                ) : item.type === 'course' ? (
                  <BookOpen className="w-4 h-4 text-emerald-500 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-amber-500 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-200" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('admin.overview.instructor')}: {item.submittedBy}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pl-[52px]">
              <button
                onClick={() => {
                  playNavClickSound();
                  onAccept?.(item.id, item.type);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer min-h-[36px] shadow-xs"
              >
                {t('admin.overview.accept')}
              </button>
              <button
                onClick={() => {
                  playNavClickSound();
                  onReject?.(item.id, item.type);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-card hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 text-foreground text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer min-h-[36px]"
              >
                {t('admin.overview.reject')}
              </button>
            </div>

            {/* Divider (not on last item) */}
            {items.indexOf(item) < items.length - 1 && (
              <div className="border-t border-border/30" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
