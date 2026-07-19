'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CourseCover from '@/components/course/CourseCover';
import CourseStatusBadge from '@/components/course/CourseStatusBadge';
import { usePreference } from '@/context/PreferenceContext';
import {
  Users, BookOpen, Clock, Settings, MoreVertical, ExternalLink, FileText,
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
  created_at?: string;
  updated_at?: string;
}

interface CourseCardProps {
  course: CourseItem;
  viewMode?: 'grid' | 'list';
}

export default function CourseCard({ course, viewMode = 'grid' }: CourseCardProps) {
  const router = Router();
  const { t, language } = usePreference();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCardClick = () => {
    router.push(`/dashboard/teacher/courses/${course.id}`);
  };

  const formattedDate = course.updated_at
    ? new Date(course.updated_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const chaptersCount = course.chapters_count ?? 0;
  const lessonsCount = course.lessons_count ?? 0;
  const enrollmentsCount = course.enrollments_count ?? 0;

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="group bg-card hover:bg-muted/30 border border-border/60 hover:border-primary/40 rounded-2xl p-4 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Cover image thumbnail */}
          <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-border/50">
            <CourseCover
              coverDisplayUrl={course.cover_display_url}
              title={course.title}
            />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CourseStatusBadge
                status={course.status}
                labels={{
                  draft: t('statusDraft'),
                  published: t('statusPublished'),
                  archived: t('statusArchived'),
                }}
              />
              {course.level && (
                <span className="text-[10px] text-muted-foreground font-semibold capitalize bg-muted/60 px-2 py-0.5 rounded-md">
                  {course.level === 'beginner' ? t('beginnerLevel') :
                   course.level === 'intermediate' ? t('intermediateLevel') :
                   t('advancedLevel')}
                </span>
              )}
            </div>

            <h3 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {course.title}
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-1">
              {course.short_description || course.description || (language === 'en' ? 'No description' : 'Chưa có mô tả')}
            </p>
          </div>
        </div>

        {/* Stats & Actions Column */}
        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1" title={t('studentsLabel')}>
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              <span>{enrollmentsCount}</span>
            </span>
            <span className="flex items-center gap-1" title={t('lessonsLabel')}>
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>{lessonsCount}</span>
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{t('manageSyllabus')}</span>
          </button>
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
        <CourseCover
          coverDisplayUrl={course.cover_display_url}
          title={course.title}
        />
        <div className="absolute top-3 left-3 z-10">
          <CourseStatusBadge
            status={course.status}
            labels={{
              draft: t('statusDraft'),
              published: t('statusPublished'),
              archived: t('statusArchived'),
            }}
          />
        </div>
        {course.level && (
          <span className="absolute top-3 right-3 z-10 text-[10px] bg-background/80 backdrop-blur-md text-foreground font-bold px-2 py-0.5 rounded-full border border-border/40 shadow-sm capitalize">
            {course.level === 'beginner' ? t('beginnerLevel') :
             course.level === 'intermediate' ? t('intermediateLevel') :
             t('advancedLevel')}
          </span>
        )}
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3
            className="font-extrabold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1"
            title={course.title}
          >
            {course.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {course.short_description || course.description || (language === 'en' ? 'No description' : 'Chưa có mô tả')}
          </p>
        </div>

        {/* Course Metadata Stats Row */}
        <div className="pt-3 border-t border-border/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5" title={t('studentsLabel')}>
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              <span>{t('enrolledStudentsCount', { count: String(enrollmentsCount) })}</span>
            </span>

            <span className="flex items-center gap-1.5" title={t('chaptersLabel')}>
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>{t('chaptersAndLessons', { chapters: String(chaptersCount), lessons: String(lessonsCount) })}</span>
            </span>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between gap-2">
            {formattedDate && (
              <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{t('lastUpdatedTime', { time: formattedDate })}</span>
              </span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="ml-auto px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>{t('manageSyllabus')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return useRouter();
}
