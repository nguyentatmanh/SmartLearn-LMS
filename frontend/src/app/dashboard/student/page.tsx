'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { RoleSidebar } from '@/components/dashboard/RoleSidebar';
import api from '@/lib/api';
import CourseCover from '@/components/course/CourseCover';
import { 
  GraduationCap, BookOpen, Search, Loader2, Sparkles, 
  BookCheck, Menu, BookOpenCheck, 
  Trophy, Award, Compass, ArrowRight 
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  cover_display_url?: string | null;
  status: string;
  teacher_name: string;
  is_enrolled: boolean;
  progress_percentage: number;
}

function StudentDashboardContent() {
  const { isCollapsed, openMobile } = useSidebar();
  const { user, authLoading } = useAuth();
  const { t, isMounted } = usePreference();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollSubmitting, setEnrollSubmitting] = useState<number | null>(null);

  // Router guard
  useEffect(() => {
    if (isMounted && !authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (user.role === 'admin') {
        router.push('/dashboard/admin');
      }
    }
  }, [user, authLoading, router, isMounted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const catalogRes = await api.get('/courses');
      setCourses(catalogRes.data);

      const enrolledRes = await api.get('/courses/student/enrolled');
      setEnrolledCourses(enrolledRes.data);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && user && user.role === 'student') {
      fetchData();
    }
  }, [user, isMounted]);

  const handleEnroll = async (courseId: number) => {
    setEnrollSubmitting(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      await fetchData();
    } catch (e) {
      console.error('Enrollment failed:', e);
    } finally {
      setEnrollSubmitting(null);
    }
  };

  if (!mounted) {
    return null;
  }

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const enrolledCourseIds = new Set(enrolledCourses.map(ec => ec.id));
  const availableCourses = courses.filter(course => !enrolledCourseIds.has(course.id));
  const filteredCatalog = availableCourses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgProgress = enrolledCourses.length
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress_percentage || 0), 0) / enrolledCourses.length)
    : 0;

  const completedCoursesCount = enrolledCourses.filter(c => c.progress_percentage === 150 || c.progress_percentage === 100).length;

  const getGreetingName = () => {
    if (user?.full_name?.trim()) {
      return user.full_name.trim();
    }
    if (user?.email) {
      const localPart = user.email.split('@')[0];
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
    return t('greetingFallbackStudent');
  };
  const displayName = getGreetingName();

  const navItems = [
    { id: 'learning', href: '/dashboard/student', labelKey: 'myLearning', icon: BookOpen, isActive: true }
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-foreground">
            SmartLearn <span className="text-primary">LMS</span>
          </span>
        </Link>
        <button
          onClick={openMobile}
          className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('sidebarOpenNav' as any) || 'Open menu'}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 flex min-w-0">
        <RoleSidebar
          role="student"
          workspaceTitleKey="studentPanel"
          navItems={navItems}
        />

        {/* Main Dashboard Content */}
        <main
          className={`flex-grow p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10 max-w-7xl mx-auto w-full fade-in overflow-x-hidden transition-all duration-200 ease-out ${
            isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {/* Welcome Banner Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Sparkles className="h-3 w-3" />
                  {t('studentBadge')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('welcomeStudent', { name: displayName })}
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                {t('studentDesc')}
              </p>
            </div>
            <button
              onClick={() => {
                const catalogElement = document.getElementById('catalog-section');
                if (catalogElement) {
                  catalogElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20 text-xs font-extrabold transition-all duration-150 shrink-0 flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer min-h-[44px]"
            >
              {t('browseCourses')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10 translate-x-10 translate-y-10" />
          </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('enrolledCourses')}
                </span>
                <span className="text-2xl font-extrabold block text-foreground">
                  {enrolledCourses.length}
                </span>
                <span className="block text-[10px] text-muted-foreground/70">
                  Active learning tracks
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                <BookCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('completedLessons')}
                </span>
                <span className="text-2xl font-extrabold block text-foreground">
                  {completedCoursesCount}
                </span>
                <span className="block text-[10px] text-muted-foreground/70">
                  Fully completed courses
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                <Trophy className="h-6 w-6" />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('learningProgress')}
                </span>
                <span className="text-2xl font-extrabold block text-foreground">
                  {avgProgress}%
                </span>
                <span className="block text-[10px] text-muted-foreground/70">
                  Average completion rate
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                <Award className="h-6 w-6" />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('availableCourses')}
                </span>
                <span className="text-2xl font-extrabold block text-foreground">
                  {availableCourses.length}
                </span>
                <span className="block text-[10px] text-muted-foreground/70">
                  New subjects in catalog
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
                <Compass className="h-6 w-6" />
              </div>
            </div>
          </section>

          {/* Section 1: Enrolled Courses */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <BookCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-extrabold tracking-tight">
                {t('enrolledCourses')} ({enrolledCourses.length})
              </h2>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="glass p-8 text-center rounded-2xl border border-border flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpenCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">{t('emptyNoEnrolledTitle')}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t('emptyNoEnrolledDesc')}</p>
                </div>
                <button
                  onClick={() => {
                    const catalogElement = document.getElementById('catalog-section');
                    if (catalogElement) {
                      catalogElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer"
                >
                  {t('browseCourses')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((c) => (
                  <div key={c.id} className="glass rounded-2xl p-5 border border-border flex flex-col justify-between glass-hover">
                    <div className="space-y-3">
                      <CourseCover
                        coverDisplayUrl={c.cover_display_url}
                        title={c.title}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded">
                          Instructor: {c.teacher_name}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base line-clamp-1 text-foreground" title={c.title}>
                        {c.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.description || 'No description available.'}
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 mt-4 border-t border-border/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{t('progress')}</span>
                        <span className="font-bold text-primary">{c.progress_percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300" 
                          style={{ width: `${c.progress_percentage}%` }} 
                        />
                      </div>
                      
                      <button
                        onClick={() => router.push(`/courses/${c.id}`)}
                        className="w-full mt-2 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-150 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98] cursor-pointer min-h-[44px]"
                      >
                        {t('enterCourse')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Browse Catalog */}
          <section id="catalog-section" className="space-y-6 pt-6 border-t border-border/40">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-extrabold tracking-tight">{t('browseCourses')}</h2>
              </div>
              
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-foreground"
                />
              </div>
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="glass p-8 text-center rounded-2xl border border-border flex flex-col items-center justify-center max-w-lg mx-auto space-y-3">
                <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{t('emptyNoCatalogTitle')}</h3>
                  <p className="text-xs text-muted-foreground">{t('emptyNoCatalogDesc')}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCatalog.map((c) => (
                  <div key={c.id} className="glass rounded-2xl p-5 border border-border flex flex-col justify-between glass-hover">
                    <div className="space-y-3">
                      <CourseCover
                        coverDisplayUrl={c.cover_display_url}
                        title={c.title}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase block">
                        Instructor: {c.teacher_name}
                      </span>
                      <h3 className="font-extrabold text-base line-clamp-1 text-foreground" title={c.title}>
                        {c.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.description || 'No description available.'}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/50">
                      <button
                        onClick={() => handleEnroll(c.id)}
                        disabled={enrollSubmitting !== null}
                        className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 transition-all duration-150 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98] cursor-pointer min-h-[44px]"
                      >
                        {enrollSubmitting === c.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {t('enrolling')}
                          </>
                        ) : (
                          t('enrollNow')
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <SidebarProvider>
      <StudentDashboardContent />
    </SidebarProvider>
  );
}
