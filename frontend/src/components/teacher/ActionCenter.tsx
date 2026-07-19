'use client';

import React from 'react';
import { AlertCircle, Clock, FileWarning, ArrowRight, ShieldAlert, MailWarning, CheckCircle2 } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';
import { User } from '@/context/AuthContext';
import Link from 'next/link';

interface CourseMinimal {
  id: number;
  title: string;
  status: string;
  chapters_count?: number;
  lessons_count?: number;
}

interface ActionCenterProps {
  user: User | null;
  courses: CourseMinimal[];
  draftCount: number;
}

export default function ActionCenter({ user, courses, draftCount }: ActionCenterProps) {
  const { t, language } = usePreference();

  const approvalStatus = user?.teacher_profile?.approval_status || 'pending';
  const isEmailUnverified = Boolean(user && user.email_verified === false);

  // Find courses missing content (0 lessons or 0 chapters)
  const emptyCourses = courses.filter(
    (c) => (c.chapters_count === 0 || c.lessons_count === 0)
  );

  const hasItems =
    approvalStatus !== 'approved' ||
    isEmailUnverified ||
    draftCount > 0 ||
    emptyCourses.length > 0;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
          {t('actionCenterTitle')}
        </h3>
      </div>

      {!hasItems ? (
        /* Compact Clean Success State when no items need attention */
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{t('actionCenterCleanTitle')}</p>
            <p className="text-[11px] text-muted-foreground">{t('actionCenterCleanDesc')}</p>
          </div>
        </div>
      ) : (
        /* Full-Width Attention Items Stack */
        <div className="space-y-2.5">
          
          {/* Pending Approval Alert */}
          {approvalStatus === 'pending' && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300">
              <div className="flex items-start gap-3 min-w-0">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs min-w-0">
                  <p className="font-bold truncate">
                    {language === 'en' ? 'Registration Approval Pending' : 'Tài khoản đang chờ duyệt'}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {t('teacherPendingMessage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejected Approval Alert */}
          {approvalStatus === 'rejected' && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300">
              <div className="flex items-start gap-3 min-w-0">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs min-w-0">
                  <p className="font-bold truncate">
                    {language === 'en' ? 'Registration Rejected' : 'Yêu cầu đăng ký bị từ chối'}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {user?.teacher_profile?.rejection_reason || (language === 'en' ? 'No specific reason provided.' : 'Không có lý do cụ thể.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email Unverified Alert */}
          {isEmailUnverified && (
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-3 text-indigo-700 dark:text-indigo-300">
              <div className="flex items-start gap-3 min-w-0">
                <MailWarning className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs min-w-0">
                  <p className="font-bold truncate">
                    {language === 'en' ? 'Email Not Verified' : 'Email chưa được xác thực'}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {language === 'en'
                      ? 'Verify your email to enable full account permissions.'
                      : 'Xác thực email để mở khóa toàn bộ tính năng.'}
                  </p>
                </div>
              </div>
              <Link
                href="/verify-email"
                className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-all shrink-0 cursor-pointer"
              >
                {t('clickToVerifyLink')}
              </Link>
            </div>
          )}

          {/* Draft Courses Needing Publishing */}
          {draftCount > 0 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300">
              <div className="flex items-start gap-3 min-w-0">
                <FileWarning className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs min-w-0">
                  <p className="font-bold truncate">
                    {language === 'en' ? 'Draft Courses Available' : 'Khóa học bản nháp'}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {t('draftsNeedPublishing', { count: String(draftCount) })}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/teacher/courses?status=draft"
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>{t('viewDetails') || 'View drafts'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Courses Missing Content (List per affected course) */}
          {emptyCourses.map((c) => (
            <div
              key={`empty-course-${c.id}`}
              className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-amber-700 dark:text-amber-300"
            >
              <div className="flex items-start gap-3 min-w-0">
                <FileWarning className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-0.5 text-xs min-w-0">
                  <p className="font-bold truncate">
                    {t('courseIncompleteTitle').replace('{title}', c.title)}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {t('courseIncompleteDesc')}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/teacher/courses/${c.id}`}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/90 transition-all shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>{t('completeSyllabus')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
