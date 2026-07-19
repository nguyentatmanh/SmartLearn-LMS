'use client';

import React from 'react';
import { Activity, BookOpen, Clock } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';
import { CourseItem } from './CourseCard';

interface ActivityItem {
  id: string;
  type: 'course' | 'material';
  title: string;
  timestamp: string;
  courseId?: number;
}

interface RecentActivityProps {
  courses: CourseItem[];
}

export default function RecentActivity({ courses }: RecentActivityProps) {
  const { t, language } = usePreference();

  // Derive activity items from recently updated courses
  const activities: ActivityItem[] = courses
    .filter((c) => c.updated_at)
    .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
    .slice(0, 4)
    .map((c) => ({
      id: `course-${c.id}`,
      type: 'course',
      title: c.title,
      timestamp: new Date(c.updated_at!).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      courseId: c.id,
    }));

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
              {t('recentActivityTitle')}
            </h3>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground space-y-1">
            <p className="text-xs font-bold text-foreground">{t('noActivityYet')}</p>
            <p className="text-[11px] leading-relaxed">{t('noActivitySub')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {language === 'en' ? 'Course syllabus updated' : 'Đề cương khóa học đã cập nhật'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
