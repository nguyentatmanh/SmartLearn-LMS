'use client';

import React from 'react';
import { BookOpen, CheckCircle2, Users, FileText } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';
import SectionErrorState from '@/components/common/SectionErrorState';

export interface DashboardStats {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  archived_courses: number;
  total_unique_students?: number;
  total_students?: number;
  total_enrollments?: number;
  total_materials: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  sparklineColor?: string;
  showSparkline?: boolean;
}

export function StatCard({ label, value, icon, iconBg, sparklineColor = '#10B981', showSparkline = false }: StatCardProps) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden group">
      <div className="space-y-1 min-w-0 z-10">
        <p className="text-xs font-semibold text-muted-foreground truncate">{label}</p>
        <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
      </div>

      <div className="flex items-center gap-2 z-10 shrink-0">
        {showSparkline && (
          <div className="w-16 h-8 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg className="w-full h-full" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2 24C10 20 15 26 25 18C35 10 40 16 58 4"
                stroke={sparklineColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 24C10 20 15 26 25 18C35 10 40 16 58 4V30H2V24Z"
                fill={`url(#gradient-${sparklineColor.replace('#', '')})`}
                opacity="0.25"
              />
              <defs>
                <linearGradient id={`gradient-${sparklineColor.replace('#', '')}`} x1="30" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor={sparklineColor} stopOpacity="0.8" />
                  <stop offset="1" stopColor={sparklineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface TeacherStatsGridProps {
  stats: DashboardStats | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function TeacherStatsGrid({ stats, loading, error, onRetry }: TeacherStatsGridProps) {
  const { t } = usePreference();

  if (error) {
    return (
      <SectionErrorState
        title={t('sectionErrorTitle')}
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted/40 rounded-2xl animate-pulse border border-border/40" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const uniqueStudents = stats.total_unique_students ?? stats.total_students ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={t('adminStatsTotalCourses')}
        value={stats.total_courses}
        icon={<BookOpen className="h-5 w-5" />}
        iconBg="bg-primary/10 text-primary"
      />

      <StatCard
        label={t('adminStatsPublishedCourses')}
        value={stats.draft_courses || stats.published_courses}
        icon={<CheckCircle2 className="h-5 w-5" />}
        iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        sparklineColor="#10B981"
        showSparkline={true}
      />

      <StatCard
        label={t('teacher.common.uniqueStudents') || t('studentsLabel')}
        value={uniqueStudents}
        icon={<Users className="h-5 w-5" />}
        iconBg="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        sparklineColor="#8B5CF6"
        showSparkline={true}
      />

      <StatCard
        label={t('teacherMaterialsWorkspace')}
        value={stats.total_materials}
        icon={<FileText className="h-5 w-5" />}
        iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        sparklineColor="#F59E0B"
        showSparkline={true}
      />
    </div>
  );
}
