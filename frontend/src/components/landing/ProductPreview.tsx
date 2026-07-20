'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { Bot, BookOpen, ClipboardCheck, BarChart3, CheckCircle2 } from 'lucide-react';

export default function ProductPreview() {
  const { t } = usePreference();

  return (
    <div
      className="w-full max-w-lg mx-auto bg-card rounded-2xl p-5 border border-border shadow-lg shadow-black/[0.04] dark:shadow-black/[0.2] relative overflow-hidden"
      role="img"
      aria-label="SmartLearn product interface preview"
    >
      {/* Top Banner Row — uses subtle divider, not bordered sub-container */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-gentle-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('mockCourseBadge')}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-2 text-primary text-[11px] font-semibold">
          <Bot className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('mockAIAssistantStatus')}</span>
        </div>
      </div>

      {/* Main Content — surface contrast instead of borders */}
      <div className="mt-4 space-y-3.5">

        {/* Active Course — uses surface-2, no border */}
        <div className="p-3.5 rounded-xl bg-surface-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" aria-hidden="true" />
              <h4 className="text-sm font-semibold text-foreground truncate">
                {t('mockCourseTitle')}
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">
              75%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{t('mockProgressLabel')}</span>
              <span>12 / 16</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: '75%' }}
              />
            </div>
          </div>
        </div>

        {/* Exam Assessment — uses surface-3, no border */}
        <div className="p-3.5 rounded-xl bg-surface-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ClipboardCheck className="h-4 w-4 text-blue-500 shrink-0" aria-hidden="true" />
              <span>{t('mockExamBadge')}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
              {t('mockTimeRemaining')}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border">
            <span className="font-medium">{t('mockQuestionsCount')}</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Auto-grading
            </span>
          </div>
        </div>

        {/* AI Recommendation — subtle tinted surface, no border */}
        <div className="p-3 rounded-xl bg-primary/[0.06] text-xs flex items-start gap-2.5">
          <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-muted-foreground leading-snug">
            {t('mockAIRecommendation')}
          </p>
        </div>

        {/* Quick Shortcuts — surface contrast, no individual borders */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-surface-2 text-center space-y-1 hover:bg-muted transition-colors duration-150">
            <BookOpen className="h-4 w-4 text-indigo-500 mx-auto" aria-hidden="true" />
            <div className="text-[10px] font-semibold text-foreground truncate">{t('mockShortcutLessons')}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2 text-center space-y-1 hover:bg-muted transition-colors duration-150">
            <ClipboardCheck className="h-4 w-4 text-blue-500 mx-auto" aria-hidden="true" />
            <div className="text-[10px] font-semibold text-foreground truncate">{t('mockShortcutExam')}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface-2 text-center space-y-1 hover:bg-muted transition-colors duration-150">
            <BarChart3 className="h-4 w-4 text-cyan-500 mx-auto" aria-hidden="true" />
            <div className="text-[10px] font-semibold text-foreground truncate">{t('mockShortcutAnalytics')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
