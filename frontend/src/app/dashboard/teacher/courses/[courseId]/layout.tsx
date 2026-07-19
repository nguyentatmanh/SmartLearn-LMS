'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import CourseCover from '@/components/course/CourseCover';
import CourseStatusBadge from '@/components/course/CourseStatusBadge';
import api from '@/lib/api';
import {
  Loader2, ArrowLeft, LayoutDashboard, BookText, FileText,
  Users, Settings, ChevronRight,
} from 'lucide-react';

interface CourseData {
  id: number;
  title: string;
  short_description?: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  cover_display_url?: string | null;
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

interface TabDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export default function CourseWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { language, t, isMounted } = usePreference();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMounted && !authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher' && user.role !== 'admin') {
        router.push('/dashboard/student');
      }
    }
  }, [user, authLoading, router, isMounted]);

  useEffect(() => {
    if (!isMounted || !user || !courseId) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/courses/${courseId}`);
        const c = res.data;
        // Ownership check
        if (c.teacher_id !== user.id && user.role !== 'admin') {
          setError(language === 'en' ? 'Access denied. You do not own this course.' : 'Truy cập bị từ chối. Bạn không sở hữu khóa học này.');
          return;
        }
        setCourse(c);
      } catch (e: any) {
        setError(e.response?.data?.detail || (language === 'en' ? 'Failed to load course.' : 'Không thể tải khóa học.'));
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, user, isMounted]);

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

  if (error) {
    return (
      <TeacherSidebar>
        <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
          <p className="text-danger font-semibold">{error}</p>
          <Link href="/dashboard/teacher/courses" className="text-primary text-sm font-semibold hover:underline">
            ← {t('backToDashboard')}
          </Link>
        </div>
      </TeacherSidebar>
    );
  }

  const basePath = `/dashboard/teacher/courses/${courseId}`;
  const tabs: TabDef[] = [
    { key: 'overview', label: language === 'en' ? 'Overview' : 'Tổng quan', icon: <LayoutDashboard className="h-4 w-4" />, href: basePath },
    { key: 'curriculum', label: language === 'en' ? 'Curriculum' : 'Chương trình', icon: <BookText className="h-4 w-4" />, href: `${basePath}/curriculum` },
    { key: 'materials', label: language === 'en' ? 'Materials' : 'Tài liệu', icon: <FileText className="h-4 w-4" />, href: `${basePath}/materials` },
    { key: 'students', label: language === 'en' ? 'Students' : 'Học viên', icon: <Users className="h-4 w-4" />, href: `${basePath}/students` },
    { key: 'settings', label: language === 'en' ? 'Settings' : 'Cài đặt', icon: <Settings className="h-4 w-4" />, href: `${basePath}/settings` },
  ];

  const activeTab = (() => {
    if (pathname.includes('/curriculum')) return 'curriculum';
    if (pathname.includes('/materials')) return 'materials';
    if (pathname.includes('/students')) return 'students';
    if (pathname.includes('/settings')) return 'settings';
    return 'overview';
  })();

  return (
    <TeacherSidebar>
      <div className="flex flex-col min-h-[calc(100dvh-57px)] lg:min-h-dvh">
        {/* Course workspace header */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Link href="/dashboard/teacher/courses" className="hover:text-foreground transition-colors font-medium">
                {t('myCourses')}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-semibold truncate max-w-[200px]">
                {loading ? '...' : course?.title}
              </span>
            </div>

            {/* Course info */}
            {loading ? (
              <div className="flex gap-4 items-center">
                <div className="h-14 w-24 bg-muted/50 rounded-lg animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted/40 rounded animate-pulse" />
                </div>
              </div>
            ) : course && (
              <div className="flex gap-4 items-center">
                <div className="w-20 shrink-0 hidden sm:block">
                  <CourseCover
                    coverDisplayUrl={course.cover_display_url}
                    title={course.title}
                    aspectRatio="aspect-[16/10]"
                    className="rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold truncate">{course.title}</h1>
                    <CourseStatusBadge
                      status={course.status}
                      labels={{ draft: t('statusDraft'), published: t('statusPublished'), archived: t('statusArchived') }}
                    />
                  </div>
                  {course.short_description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.short_description}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tab navigation */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-0 overflow-x-auto -mb-px" aria-label="Course workspace tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { course, loading, courseId });
              }
              return child;
            })}
          </div>
        </div>
      </div>
    </TeacherSidebar>
  );
}
