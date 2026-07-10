'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import { GraduationCap, BookOpen, Search, LogOut, Loader2, Sparkles, BookCheck, Sun, Moon, Globe } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  status: string;
  teacher_name: string;
  is_enrolled: boolean;
  progress_percentage: number;
}

export default function StudentDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollSubmitting, setEnrollSubmitting] = useState<number | null>(null);

  // Router guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'teacher') {
        router.push('/dashboard/teacher');
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch catalog
      const catalogRes = await api.get('/courses');
      setCourses(catalogRes.data);

      // Fetch enrolled
      const enrolledRes = await api.get('/courses/student/enrolled');
      setEnrolledCourses(enrolledRes.data);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchData();
    }
  }, [user]);

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

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Filter out courses that student is already enrolled in for the browse catalog
  const filteredCatalog = courses
    .filter(c => !enrolledCourses.some(ec => ec.id === c.id))
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 glass lg:border-r border-border lg:min-h-dvh flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t('appName')}
            </span>
          </div>

          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('studentPanel')}
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm transition-all text-left">
              <BookOpen className="h-4 w-4" />
              {t('myLearning')}
            </button>
          </div>
        </div>

        {/* User Card & Settings */}
        <div className="mt-8 pt-6 border-t border-border space-y-4">
          {/* Theme & Language row inside sidebar */}
          <div className="flex items-center justify-between gap-2 p-1 bg-muted/40 rounded-xl border border-border">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex justify-center"
              aria-label="Toggle theme appearance"
            >
              {isMounted && theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </button>
            <div className="h-4 w-[1px] bg-border shrink-0" />
            <button
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className="flex-1 p-2 rounded-lg hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1"
              aria-label="Toggle language preference"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'EN' : 'VI'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center uppercase shrink-0">
              {user?.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10 max-w-7xl mx-auto w-full fade-in">
        
        {/* Welcome Banner */}
        <div className="glass p-6 sm:p-8 rounded-2xl border border-border relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('welcomeStudent', { name: user?.full_name || '' })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('studentDesc')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            {t('studentBadge')}
          </div>
        </div>

        {/* Section 1: Enrolled Courses */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <BookCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-extrabold tracking-tight">
              {t('enrolledCourses')} ({enrolledCourses.length})
            </h2>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="glass p-10 text-center rounded-2xl border border-border space-y-4">
              <p className="text-muted-foreground text-sm">{t('noEnrolled')}</p>
              <p className="text-xs text-muted-foreground/60">{t('noEnrolledSub')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((c) => (
                <div key={c.id} className="glass rounded-xl p-5 border border-border space-y-4 flex flex-col justify-between glass-hover">
                  <div className="space-y-2">
                    <div className="aspect-[16/9] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">
                      Instructor: {c.teacher_name}
                    </span>
                    <h3 className="font-extrabold text-base line-clamp-1 text-foreground" title={c.title}>
                      {c.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{t('progress')}</span>
                      <span className="font-bold text-primary">{c.progress_percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${c.progress_percentage}%` }} />
                    </div>
                    
                    <button
                      onClick={() => router.push(`/courses/${c.id}`)}
                      className="w-full mt-2 py-2.5 bg-muted hover:bg-muted/80 text-foreground transition-all rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-extrabold tracking-tight">{t('browseCourses')}</h2>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              />
            </div>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="glass p-10 text-center rounded-2xl border border-border">
              <p className="text-muted-foreground text-xs">{t('noCatalog')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalog.map((c) => (
                <div key={c.id} className="glass rounded-xl p-5 border border-border space-y-4 flex flex-col justify-between glass-hover">
                  <div className="space-y-2">
                    <div className="aspect-[16/9] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>
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

                  <div className="pt-2 border-t border-border/50">
                    <button
                      onClick={() => handleEnroll(c.id)}
                      disabled={enrollSubmitting !== null}
                      className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 transition-all rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
  );
}
