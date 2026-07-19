'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import CourseCover from '@/components/course/CourseCover';
import CourseStatusBadge from '@/components/course/CourseStatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import {
  Plus, Loader2, FolderClosed, Settings, Eye, FileText,
  AlertCircle, BookOpen, Users, Calendar, Search, Filter,
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  short_description?: string;
  description: string;
  thumbnail_url: string;
  cover_display_url?: string | null;
  category?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  teacher_id: number;
  chapters_count: number;
  lessons_count: number;
  enrollments_count: number;
  created_at: string;
  updated_at: string;
}

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  short_description: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type CourseSchemaType = z.infer<typeof courseSchema>;

export default function TeacherCoursesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { language, t, isMounted } = usePreference();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

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

  // Router guard
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

  const fetchData = async () => {
    setLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      const coursesRes = await api.get('/courses/teacher/my-courses');
      const data = coursesRes.data;

      // Normalize direct array vs paginated shape
      const fetchedCourses = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setCourses(fetchedCourses);
    } catch (e: any) {
      console.error('Failed to load courses:', e);
      setHasError(true);
      setErrorMessage(e.response?.data?.detail || e.message || 'An error occurred while loading your courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && user && user.role === 'teacher') {
      fetchData();
    }
  }, [user, isMounted]);

  const onSubmit = async (data: CourseSchemaType) => {
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
      // Redirect to the new course workspace
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

  // Filter & Search Logic
  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.short_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Loading guard
  // Hydration guard
  if (!mounted) {
    return null;
  }

  // Loading guard
  if (authLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const approvalStatus = user?.teacher_profile?.approval_status || 'pending';

  return (
    <TeacherSidebar>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/60">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('teacherMyCourses')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Manage your catalog, edit lessons, and track student registration.' : 'Quản lý danh mục bài học, chỉnh sửa học liệu và theo dõi đăng ký học viên.'}
            </p>
          </div>

          {approvalStatus === 'approved' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 shrink-0 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="h-4 w-4" />
              {t('teacherCreateCourse')}
            </button>
          )}
        </div>

        {/* Search and Filters toolbar */}
        {!loading && !hasError && courses.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card/40 p-4 rounded-2xl border border-border/60">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchCoursesPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-foreground"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-muted/40 border border-border rounded-xl">
              {(['all', 'published', 'draft', 'archived'] as const).map((filter) => {
                const labelMap = {
                  all: t('filterAll'),
                  published: t('filterPublished'),
                  draft: t('filterDraft'),
                  archived: t('filterArchived'),
                };
                const active = statusFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      active
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {labelMap[filter]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Section */}
        <section className="space-y-5">
          {loading ? (
            <LoadingSkeleton count={3} type="card" />
          ) : hasError ? (
            <div className="glass p-8 text-center rounded-2xl border border-border flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
              <div className="h-10 w-10 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-foreground">{t('teacherLoadCoursesError')}</h3>
                <p className="text-xs text-muted-foreground">
                  {errorMessage || (language === 'en' ? 'An unexpected error occurred while fetching your courses. Please check your network and try again.' : 'Đã xảy ra lỗi không mong muốn khi tải khóa học. Vui lòng kiểm tra kết nối và thử lại.')}
                </p>
              </div>
              <button
                onClick={fetchData}
                className="px-5 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-xs font-bold transition-all"
              >
                {t('teacherRetry')}
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl">
              <EmptyState
                icon={<FolderClosed className="h-7 w-7" />}
                title={t('emptyNoCoursesCreatedTitle')}
                description={t('emptyNoCoursesCreatedDesc')}
                action={
                  approvalStatus === 'approved' ? (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all"
                    >
                      {t('teacherCreateCourse')}
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-card/25 rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center space-y-2">
              <FolderClosed className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground font-medium">
                {language === 'en' ? 'No courses match your criteria.' : 'Không tìm thấy khóa học nào phù hợp.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => (
                <div
                  key={c.id}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col cursor-pointer"
                  onClick={() => router.push(`/dashboard/teacher/courses/${c.id}`)}
                >
                  {/* Image Header */}
                  <CourseCover
                    coverDisplayUrl={c.cover_display_url}
                    title={c.title}
                  />

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col space-y-3.5">
                    {/* Top Row: status and level */}
                    <div className="flex items-center justify-between">
                      <CourseStatusBadge
                        status={c.status}
                        labels={{
                          draft: t('statusDraft'),
                          published: t('statusPublished'),
                          archived: t('statusArchived'),
                        }}
                      />
                      <div className="flex items-center gap-1.5">
                        {c.category && (
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground capitalize">
                            {c.category}
                          </span>
                        )}
                        {c.level && (
                          <span className="text-[10px] text-muted-foreground font-semibold capitalize">
                            {c.level === 'beginner' ? t('beginnerLevel') :
                             c.level === 'intermediate' ? t('intermediateLevel') :
                             t('advancedLevel')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm line-clamp-1 text-foreground group-hover:text-primary transition-colors" title={c.title}>
                        {c.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.short_description || c.description || (language === 'en' ? 'No description' : 'Chưa có mô tả')}
                      </p>
                    </div>

                    {/* Metadata: counts and update date */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 shrink-0 text-primary/75" />
                        <span className="font-medium truncate">
                          {c.chapters_count} {t('chaptersLabel')}, {c.lessons_count} {t('lessonsLabel')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 shrink-0 text-primary/75" />
                        <span className="font-medium truncate">
                          {c.enrollments_count} {t('studentsLabel')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 mt-0.5 pt-1.5 border-t border-border/40">
                        <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                        <span className="font-medium truncate">
                          {t('lastUpdatedLabel')}: {new Date(c.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions toolbar */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                      {/* Continue Editing */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/teacher/courses/${c.id}`);
                        }}
                        className="py-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 shrink-0"
                        title={t('actionContinueEditing')}
                      >
                        <Settings className="h-3.5 w-3.5" />
                        <span className="truncate max-w-full px-1">{t('actionContinueEditing')}</span>
                      </button>

                      {/* Preview (student view) */}
                      <Link
                        href={`/courses/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        className="py-2 bg-muted hover:bg-foreground hover:text-background text-foreground transition-all rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 shrink-0"
                        title={t('actionPreview')}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="truncate max-w-full px-1">{t('actionPreview')}</span>
                      </Link>

                      {/* Materials */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/teacher/courses/${c.id}/materials`);
                        }}
                        className="py-2 bg-secondary/15 hover:bg-secondary text-secondary-foreground hover:text-white transition-all rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 shrink-0"
                        title={t('actionMaterials')}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span className="truncate max-w-full px-1">{t('actionMaterials')}</span>
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-foreground">
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <h3 className="text-lg font-bold">{t('createCourseTitle')}</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-danger/10 border border-danger/25 text-danger text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('courseTitleLabel')} *</label>
                  <input
                    type="text"
                    placeholder={t('courseTitlePlaceholder')}
                    {...register('title')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                  {errors.title && <span className="text-xs text-danger">{errors.title.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('shortDescriptionLabel')}</label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Brief course summary...' : 'Tóm tắt ngắn về khóa học...'}
                    {...register('short_description')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('descLabel')}</label>
                  <textarea
                    placeholder={t('descPlaceholder')}
                    rows={3}
                    {...register('description')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground resize-none"
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
                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
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
