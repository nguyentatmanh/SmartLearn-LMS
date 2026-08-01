'use client';

import React, { useState, useEffect } from 'react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import {
  BarChart3, Users, BookOpen, Percent, Trophy, Clock,
  Loader2, AlertCircle, TrendingUp, Calendar, ArrowUpRight
} from 'lucide-react';

interface CoursePerformanceItem {
  course_id: number;
  title: string;
  status: string;
  enrolled_students_count: number;
  completion_rate_pct: number;
  average_progress_pct: number;
}

interface RecentEnrollmentItem {
  student_id: number;
  student_name: string;
  course_id: number;
  course_title: string;
  enrolled_at: string;
}

interface AnalyticsData {
  total_unique_students: number;
  total_enrollments: number;
  average_progress_pct: number;
  completion_rate_pct: number;
  course_performance: CoursePerformanceItem[];
  recent_enrollments: RecentEnrollmentItem[];
  last_activity_at?: string;
}

export default function TeacherAnalyticsPage() {
  const { t, language } = usePreference();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/teacher/analytics');
        setData(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || t('errors.GENERIC_ERROR') || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [t]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return t('teacher.analytics.noActivity') || 'No activity';
    return new Date(isoString).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TeacherSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {t('teacher.analytics.title') || 'Teaching Operations Analytics'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                {t('teacher.analytics.lastActivity') || 'Last Student Activity'}:{' '}
                <strong className="text-foreground">{formatDate(data?.last_activity_at)}</strong>
              </span>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-medium">{t('loading') || 'Loading analytics...'}</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-card border border-border/60 rounded-2xl text-center space-y-3 text-rose-500 shadow-sm">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-indigo-500/30 transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t('teacher.common.uniqueStudents') || 'Unique Students'}
                  </p>
                  <p className="text-2xl font-black text-foreground tracking-tight">
                    {data.total_unique_students}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-blue-500/30 transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t('teacher.common.totalEnrollments') || 'Total Enrollments'}
                  </p>
                  <p className="text-2xl font-black text-foreground tracking-tight">
                    {data.total_enrollments}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-emerald-500/30 transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t('teacher.analytics.avgProgress') || 'Average Progress'}
                  </p>
                  <p className="text-2xl font-black text-foreground tracking-tight">
                    {data.average_progress_pct}%
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-amber-500/30 transition-all">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t('teacher.analytics.completionRate') || 'Completion Rate'}
                  </p>
                  <p className="text-2xl font-black text-foreground tracking-tight">
                    {data.completion_rate_pct}%
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Course Performance Breakdown */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="font-bold text-sm text-foreground">
                  {t('teacher.analytics.coursePerformance') || 'Course Performance Breakdown'}
                </h3>
              </div>

              {data.course_performance.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No active courses to display.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-3 px-4">Course Title</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Students Enrolled</th>
                        <th className="py-3 px-4">Average Progress</th>
                        <th className="py-3 px-4">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {data.course_performance.map((c) => (
                        <tr key={c.course_id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-foreground max-w-xs truncate">
                            {c.title}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                c.status === 'published'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {c.enrolled_students_count}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-32 space-y-1">
                              <span className="text-[11px] font-bold">{c.average_progress_pct}%</span>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${c.average_progress_pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-foreground">
                            {c.completion_rate_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Enrollments */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h3 className="font-bold text-sm text-foreground">
                  {t('teacher.analytics.recentEnrollments') || 'Recent Enrollments'}
                </h3>
              </div>

              {data.recent_enrollments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No recent enrollments.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.recent_enrollments.map((env, idx) => (
                    <div
                      key={`recent-env-${idx}`}
                      className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-foreground truncate">{env.student_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Enrolled in <strong className="text-foreground">{env.course_title}</strong>
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-primary" />
                        {new Date(env.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </TeacherSidebar>
  );
}
