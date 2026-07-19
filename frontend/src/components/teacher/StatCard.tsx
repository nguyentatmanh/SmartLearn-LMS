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
  total_students: number;
  total_materials: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
}

export function StatCard({ label, value, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-primary/30 transition-all">
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
        {icon}
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
        value={stats.published_courses}
        icon={<CheckCircle2 className="h-5 w-5" />}
        iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />

      <StatCard
        label={t('studentsLabel')}
        value={stats.total_students}
        icon={<Users className="h-5 w-5" />}
        iconBg="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      />

      <StatCard
        label={t('teacherMaterialsWorkspace')}
        value={stats.total_materials}
        icon={<FileText className="h-5 w-5" />}
        iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
    </div>
  );
}
