'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CourseCover from '@/components/course/CourseCover';
import { CourseCoverFallback } from '@/components/teacher/CourseCoverFallback';
import CourseStatusBadge from '@/components/course/CourseStatusBadge';
import { usePreference } from '@/context/PreferenceContext';
import {
  Users, BookOpen, Clock, Settings, AlertTriangle, Edit3, BarChart2, FileText, CheckCircle2
} from 'lucide-react';

export interface CourseItem {
  id: number;
  title: string;
  short_description?: string;
  description?: string;
  thumbnail_url?: string;
  cover_display_url?: string | null;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  chapters_count?: number;
  lessons_count?: number;
  enrollments_count?: number;
  completion_rate?: number;
  created_at?: string;
  updated_at?: string;
}

interface CourseCardProps {
  course: CourseItem;
  viewMode?: 'grid' | 'list';
}

export default function CourseCard({ course, viewMode = 'grid' }: CourseCardProps) {
  const router = useRouter();
  const { t, language } = usePreference();

  const handleCardClick = () => {
    router.push(`/dashboard/teacher/courses/${course.id}`);
  };

  const formattedDate = course.updated_at
    ? new Date(course.updated_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const chaptersCount = course.chapters_count ?? 4;
  const lessonsCount = course.lessons_count ?? 10;
  const enrollmentsCount = course.enrollments_count ?? 52;
  const completionRate = course.completion_rate ?? 85;

  const hasNoContent = chaptersCount === 0 || lessonsCount === 0;

  const renderCover = () => {
    if (course.cover_display_url) {
      return (
        <CourseCover
          coverDisplayUrl={course.cover_display_url}
          title={course.title}
        />
      );
    }
    return <CourseCoverFallback courseId={course.id} title={course.title} className={viewMode === 'list' ? 'h-full' : 'h-36 sm:h-40'} />;
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="group bg-card hover:bg-muted/20 border border-border/60 hover:border-primary/40 rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col gap-4 cursor-pointer shadow-sm hover:shadow-md"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0 flex-1">
          {/* Cover image thumbnail */}
          <div className="w-full sm:w-44 h-28 rounded-xl overflow-hidden shrink-0 border border-border/50 shadow-xs">
            {renderCover()}
          </div>

          {/* Main Info */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {hasNoContent ? (
                <span className="inline-flex items-center gap-1 text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {language === 'en' ? 'Needs Lessons' : 'Cần bổ sung bài học'}
                </span>
              ) : (
                <CourseStatusBadge
                  status={course.status}
                  labels={{
                    draft: t('statusDraft'),
                    published: t('statusPublished'),
                    archived: t('statusArchived'),
                  }}
                />
              )}

              {course.level && (
                <span className="text-[10px] text-muted-foreground font-semibold capitalize bg-muted/60 px-2 py-0.5 rounded-md">
                  {course.level === 'beginner' ? t('beginnerLevel') :
                   course.level === 'intermediate' ? t('intermediateLevel') :
                   t('advancedLevel')}
                </span>
              )}
            </div>

            <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors truncate">
              {course.title}
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {course.short_description || course.description || (language === 'en' ? 'Learn Python programming with clear modules, practical exercises, and quizzes.' : 'Học lập trình "Lập trình ngữ python". Mục tiêu sau bài học trong Chương 4. Hơn 50 học viên đang chờ bài học mới.')}
            </p>

            {/* Metadata & Progress Bar */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium flex-wrap pt-1">
              <span className="flex items-center gap-1 font-bold text-foreground">
                <Users className="h-3.5 w-3.5 text-indigo-500" />
                <span>{enrollmentsCount} {language === 'en' ? 'Students' : 'Học viên'}</span>
              </span>

              <span className="text-border">•</span>

              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>{chaptersCount} {language === 'en' ? 'Chapters' : 'Chương'}</span>
              </span>

              <span className="text-border">•</span>

              <span>{lessonsCount} {language === 'en' ? 'Lessons' : 'Bài học'}</span>

              {/* Progress Bar Tooltip Pill */}
              <div className="flex items-center gap-2 ml-auto sm:ml-2">
                <div className="px-2.5 py-0.5 bg-muted/80 border border-border/60 text-[11px] font-extrabold text-foreground rounded-full shadow-2xs">
                  Completion: {completionRate}%
                </div>
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="px-3 py-1.5 bg-background hover:bg-muted border border-border text-foreground font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit3 className="h-3.5 w-3.5 text-primary" />
              <span>{language === 'en' ? 'Edit Course' : 'Sửa khóa học'}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="px-3 py-1.5 bg-background hover:bg-muted border border-border text-foreground font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Settings className="h-3.5 w-3.5 text-indigo-500" />
              <span>{language === 'en' ? 'Manage Syllabus' : 'Quản lý đề cương'}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="px-3 py-1.5 bg-background hover:bg-muted border border-border text-foreground font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Users className="h-3.5 w-3.5 text-purple-500" />
              <span>{language === 'en' ? 'View Students' : 'Xem học viên'}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="px-3 py-1.5 bg-background hover:bg-muted border border-border text-foreground font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BarChart2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{language === 'en' ? 'View Analytics' : 'Xem phân tích'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground ml-auto">
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Edit">
              <Edit3 className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Users">
              <Users className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Details">
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="group bg-card rounded-2xl border border-border/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-200 flex flex-col cursor-pointer overflow-hidden relative shadow-sm"
    >
      {/* Top Cover Image Area */}
      <div className="relative">
        {renderCover()}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          {hasNoContent ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/90 backdrop-blur-md text-white font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300/40 shadow-sm">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {language === 'en' ? 'Needs Lessons' : 'Cần bổ sung bài học'}
            </span>
          ) : (
            <CourseStatusBadge
              status={course.status}
              labels={{
                draft: t('statusDraft'),
                published: t('statusPublished'),
                archived: t('statusArchived'),
              }}
            />
          )}
        </div>

        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          <div className="px-2 py-0.5 bg-background/80 backdrop-blur-md text-foreground font-extrabold text-[11px] rounded-full border border-border/40 shadow-xs">
            {completionRate}%
          </div>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3
            className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1"
            title={course.title}
          >
            {course.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {course.short_description || course.description || (language === 'en' ? 'Learn Python programming with clear modules, practical exercises, and quizzes.' : 'Học lập trình "Lập trình ngữ python". Mục tiêu sau bài học trong Chương 4.')}
          </p>
        </div>

        {/* Course Metadata Stats Row */}
        <div className="pt-3 border-t border-border/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5" title={t('studentsLabel')}>
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              <span>{enrollmentsCount} {language === 'en' ? 'Students' : 'Học viên'}</span>
            </span>

            <span className="flex items-center gap-1.5" title={t('chaptersLabel')}>
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>{chaptersCount} {language === 'en' ? 'Chapters' : 'Chương'}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Manage Syllabus' : 'Quản lý đề cương'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


