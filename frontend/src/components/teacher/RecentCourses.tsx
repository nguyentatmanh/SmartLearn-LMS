'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Users, Edit3, ArrowRight } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';
import { CourseItem } from './CourseCard';

interface RecentCoursesProps {
  courses: CourseItem[];
}

export default function RecentCourses({ courses }: RecentCoursesProps) {
  const { t, language } = usePreference();

  // Get recently updated courses (top 4)
  const recentCourses = [...courses]
    .sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 4);

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
              {t('recentCoursesTitle')}
            </h3>
          </div>
          <Link
            href="/dashboard/teacher/courses"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>{t('viewAll') || 'View all'}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Content List */}
        {recentCourses.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground space-y-1">
            <p className="text-xs font-bold text-foreground">{t('emptyNoCoursesCreatedTitle')}</p>
            <p className="text-[11px] leading-relaxed">{t('emptyNoCoursesCreatedDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentCourses.map((c) => {
              const updatedTime = c.updated_at
                ? new Date(c.updated_at).toLocaleDateString(
                    language === 'vi' ? 'vi-VN' : 'en-US',
                    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                  )
                : null;

              return (
                <div
                  key={`recent-course-${c.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:border-primary/30 transition-all text-xs"
                >
                  {/* Left: Course Name & Meta */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground truncate max-w-xs">{c.title}</p>
                      
                      {/* Status Badge */}
                      {c.status === 'published' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {t('statusPublished') || 'Published'}
                        </span>
                      )}
                      {c.status === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {t('statusDraft') || 'Draft'}
                        </span>
                      )}
                      {c.status === 'archived' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground border border-border">
                          {t('statusArchived') || 'Archived'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                      {updatedTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{updatedTime}</span>
                        </span>
                      )}
                      {c.enrollments_count !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{c.enrollments_count} {t('studentsLabel') || 'students'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Continue Editing Action */}
                  <Link
                    href={`/dashboard/teacher/courses/${c.id}`}
                    className="px-3 py-1.5 bg-card hover:bg-muted border border-border/80 text-foreground font-bold text-xs rounded-lg transition-all shrink-0 flex items-center justify-center gap-1.5 hover:border-primary/40 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-primary" />
                    <span>{t('continueEditing')}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
