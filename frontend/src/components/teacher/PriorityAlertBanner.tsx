'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Edit3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';
import Link from 'next/link';

interface PriorityAlertBannerProps {
  urgentCourseTitle?: string;
  urgentCourseId?: number;
  urgentMessage?: string;
  hasUrgentItems?: boolean;
}

export default function PriorityAlertBanner({
  urgentCourseTitle = 'Lập trình Python',
  urgentCourseId,
  urgentMessage,
  hasUrgentItems = true
}: PriorityAlertBannerProps) {
  const { t, language } = usePreference();

  const defaultMessage = language === 'en'
    ? `Course "${urgentCourseTitle}" is missing 2 lessons in Chapter 4. Over 50 active students are waiting for new content.`
    : `Khóa học "${urgentCourseTitle}" còn thiếu 2 bài học trong Chương 4. Hơn 50 học viên đang chờ bài học mới.`;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-300/80 dark:border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm relative overflow-hidden">
      {/* Top Banner Header */}
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4" />
        </div>
        <h3 className="font-extrabold text-xs tracking-wide uppercase text-amber-900 dark:text-amber-200">
          {t('actionCenterTitle') || 'Công việc cần chú ý'}
        </h3>
      </div>

      {!hasUrgentItems ? (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p className="font-bold">{t('actionCenterCleanTitle') || 'Mọi công việc đều hoàn tất!'}</p>
        </div>
      ) : (
        /* Alert Content Card */
        <div className="bg-card/90 dark:bg-card/70 border border-amber-200/80 dark:border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm backdrop-blur-xs">
          {/* Left Description Box */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-extrabold text-sm text-foreground truncate">
                {urgentCourseTitle}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {urgentMessage || defaultMessage}
              </p>
            </div>
          </div>

          {/* Right CTA Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end flex-wrap">
            <Link
              href={urgentCourseId ? `/dashboard/teacher/courses/${urgentCourseId}` : '/dashboard/teacher/courses'}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Quick Update Lesson' : 'Cập nhật bài học nhanh'}</span>
            </Link>

            <Link
              href="/dashboard/teacher/courses?status=draft"
              className="px-4 py-2.5 bg-background hover:bg-muted border border-border text-foreground font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
            >
              <span>{language === 'en' ? 'View Full Task List' : 'Xem danh sách đầy đủ công việc'}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
