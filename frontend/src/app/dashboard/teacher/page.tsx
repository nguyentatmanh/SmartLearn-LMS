'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';

import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import DashboardHeader from '@/components/teacher/DashboardHeader';
import { TeacherStatsGrid, DashboardStats } from '@/components/teacher/StatCard';
import ActionCenter from '@/components/teacher/ActionCenter';
import FilterToolbar, { StatusFilter, SortOption, ViewMode } from '@/components/teacher/FilterToolbar';
import CourseCard, { CourseItem } from '@/components/teacher/CourseCard';
import CourseCardSkeleton from '@/components/teacher/CourseCardSkeleton';
import RecentCourses from '@/components/teacher/RecentCourses';
import RecentActivity from '@/components/teacher/RecentActivity';
import SectionErrorState from '@/components/common/SectionErrorState';
import EmptyState from '@/components/common/EmptyState';

import { Plus, Loader2, FolderClosed, AlertCircle, BookOpen } from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  short_description: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type CourseSchemaType = z.infer<typeof courseSchema>;

export default function TeacherDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { language, t, isMounted } = usePreference();
  const router = useRouter();

  // Dashboard state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Sectional Error States
  const [courseError, setCourseError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Filter & Search Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: 'draft',
      short_description: '',
      description: '',
    },
  });

  // Role Guard
  useEffect(() => {
    if (isMounted && !authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'student') {
        router.push('/dashboard/student');
      } else if (user.role === 'admin') {
        router.push('/dashboard/admin');
      }
    }
  }, [user, authLoading, router, isMounted]);

  // Fetch Courses independently
  const fetchCourses = async () => {
    setLoadingCourses(true);
    setCourseError(null);
    try {
      const res = await api.get('/courses/teacher/my-courses');
      const data = res.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];
      setCourses(items);
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      setCourseError(
        err.response?.data?.detail ||
        err.message ||
        (language === 'en' ? 'Failed to fetch course list.' : 'Không thể tải danh sách khóa học.')
      );
    } finally {
      setLoadingCourses(false);
    }
  };

  // Fetch Stats independently (with fallback derivation)
  const fetchStats = async (currentCoursesList: CourseItem[] = courses) => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const res = await api.get('/courses/teacher/my-stats');
      setStats(res.data);
    } catch (err: any) {
      console.warn('Failed to load real stats, deriving from courses:', err);
      // Derive stats client-side as resilient fallback
      setStats({
        total_courses: currentCoursesList.length,
        published_courses: currentCoursesList.filter((c) => c.status === 'published').length,
        draft_courses: currentCoursesList.filter((c) => c.status === 'draft').length,
        archived_courses: currentCoursesList.filter((c) => c.status === 'archived').length,
        total_students: currentCoursesList.reduce((acc, c) => acc + (c.enrollments_count || 0), 0),
        total_materials: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAllData = async () => {
    await fetchCourses();
    await fetchStats();
  };

  useEffect(() => {
    if (isMounted && user && user.role === 'teacher') {
      fetchAllData();
    }
  }, [user, isMounted]);

  // Handle Course Creation
  const onSubmitCreate = async (data: CourseSchemaType) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await api.post('/courses', {
        title: data.title,
        short_description: data.short_description || null,
        description: data.description || null,
        status: data.status,
      });
      reset();
      setShowCreateModal(false);
      // Redirect directly to the course management workspace
      router.push(`/dashboard/teacher/courses/${res.data.id}`);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setCreateError(err.response.data.detail);
      } else {
        setCreateError(language === 'en' ? 'Failed to create course.' : 'Không thể tạo khóa học.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered & Sorted Courses Memo
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => {
        // Status filter
        if (statusFilter !== 'all' && c.status !== statusFilter) {
          return false;
        }
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const titleMatch = c.title.toLowerCase().includes(q);
          const descMatch = (c.short_description || c.description || '').toLowerCase().includes(q);
          return titleMatch || descMatch;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'students') {
          return (b.enrollments_count || 0) - (a.enrollments_count || 0);
        }
        return 0;
      });
  }, [courses, statusFilter, searchTerm, sortBy]);

  const draftCount = useMemo(() => courses.filter((c) => c.status === 'draft').length, [courses]);
  const approvalStatus = user?.teacher_profile?.approval_status || 'pending';

  // Hydration Guard
  if (!mounted) return null;

  // Authentication Loading Guard
  if (authLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading..." />
      </div>
    );
  }

  return (
    <TeacherSidebar>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* 1. Header Workspace Bar */}
        <DashboardHeader
          user={user}
          onCreateCourse={() => setShowCreateModal(true)}
        />

        {/* 2. Overview Statistics */}
        <TeacherStatsGrid
          stats={stats}
          loading={loadingStats}
          error={statsError}
          onRetry={() => fetchStats()}
        />

        {/* 3. Action Center (Requires Attention) */}
        <ActionCenter
          user={user}
          courses={courses}
          draftCount={draftCount}
        />

        {/* 4. Lower Dashboard: Recent Courses (60%) & Recent Activity (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RecentCourses courses={courses} />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity courses={courses} />
          </div>
        </div>

        {/* 5. Course Catalog Section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                {t('myCourses')} {!loadingCourses && !courseError && `(${courses.length})`}
              </h2>
            </div>
          </div>

          {/* Search, Status Tabs & Layout Controls */}
          <FilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalResults={filteredCourses.length}
          />

          {/* Course List Content Area */}
          {loadingCourses ? (
            <CourseCardSkeleton count={6} viewMode={viewMode} />
          ) : courseError ? (
            <SectionErrorState
              title={t('teacherLoadCoursesError')}
              message={courseError}
              onRetry={fetchCourses}
            />
          ) : filteredCourses.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-3xl p-6">
              <EmptyState
                icon={<FolderClosed className="h-7 w-7 text-muted-foreground" />}
                title={searchTerm ? t('emptyNoCatalogTitle') : t('emptyNoCoursesCreatedTitle')}
                description={searchTerm ? t('emptyNoCatalogDesc') : t('emptyNoCoursesCreatedDesc')}
                action={
                  !searchTerm && approvalStatus === 'approved' ? (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20"
                    >
                      {t('createCourse')}
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'space-y-3'
              }
            >
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 text-foreground">
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <h3 className="text-lg font-extrabold">{t('createCourseTitle')}</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-danger/10 border border-danger/25 text-danger text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t('courseTitleLabel')} *
                  </label>
                  <input
                    type="text"
                    placeholder={t('courseTitlePlaceholder')}
                    {...register('title')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                  {errors.title && <span className="text-xs text-danger">{errors.title.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t('shortDescriptionLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Brief course summary...' : 'Tóm tắt ngắn về khóa học...'}
                    {...register('short_description')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t('descLabel')}
                  </label>
                  <textarea
                    placeholder={t('descPlaceholder')}
                    rows={3}
                    {...register('description')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground resize-none"
                  />
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {language === 'en'
                    ? 'A draft course will be created. You can add cover images, chapters, lessons, and materials in the Course Workspace.'
                    : 'Khóa học bản nháp sẽ được tạo. Bạn có thể thêm ảnh bìa, chương, bài học và tài liệu trong Không gian Quản lý Khóa học.'}
                </p>

                <div className="flex gap-3 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('creating')}
                      </>
                    ) : (
                      t('create')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </TeacherSidebar>
  );
}
