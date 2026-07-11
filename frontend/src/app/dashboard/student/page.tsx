'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import { 
  GraduationCap, BookOpen, Search, LogOut, Loader2, Sparkles, 
  BookCheck, Sun, Moon, Globe, Menu, X, BookOpenCheck, 
  Trophy, Award, Compass, ArrowRight 
} from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Hydration and loading guard
  if (!isMounted || authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate stats & courses safely
  const enrolledCourseIds = new Set(enrolledCourses.map(ec => ec.id));
  const availableCourses = courses.filter(course => !enrolledCourseIds.has(course.id));
  const filteredCatalog = availableCourses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgProgress = enrolledCourses.length
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress_percentage || 0), 0) / enrolledCourses.length)
    : 0;

  const completedCoursesCount = enrolledCourses.filter(c => c.progress_percentage === 150 || c.progress_percentage === 100).length;

  // Safe greeting name extraction
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

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-foreground">{"SmartLearn "}<span className="text-primary">{"LMS"}</span></span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all"
          aria-label="Toggle navigation drawer"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 glass p-6 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:min-h-dvh ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight text-foreground">{"SmartLearn "}<span className="text-primary">{"LMS"}</span></span>
          </Link>

          <div className="space-y-1.5">
            <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('studentPanel')}
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm transition-all text-left">
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
              {theme === 'dark' ? (
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

          <div className="flex items-center gap-3 p-1 rounded-xl">
            <div className="h-10 w-10 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center uppercase shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10 max-w-7xl mx-auto w-full fade-in overflow-x-hidden">
        
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
            className="px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20 text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
          >
            {t('browseCourses')}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          
          {/* Subtle decorative background shapes */}
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
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-success/10 text-success">
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
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-warning/10 text-warning">
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
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-all"
              >
                {t('browseCourses')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((c) => (
                <div key={c.id} className="glass rounded-2xl p-5 border border-border flex flex-col justify-between glass-hover">
                  <div className="space-y-3">
                    <div className="aspect-[16/9] w-full bg-muted rounded-xl flex items-center justify-center overflow-hidden relative">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground/30 space-y-1">
                          <BookOpen className="h-10 w-10" />
                          <span className="text-[10px]">SmartLearn</span>
                        </div>
                      )}
                    </div>
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

                  {/* Progress Indicator */}
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
                      className="w-full mt-2 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all rounded-xl text-xs font-extrabold focus:outline-none"
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
            
            {/* Search Input */}
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
                    <div className="aspect-[16/9] w-full bg-muted rounded-xl flex items-center justify-center overflow-hidden relative">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground/30 space-y-1">
                          <BookOpen className="h-10 w-10" />
                          <span className="text-[10px]">SmartLearn</span>
                        </div>
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

                  <div className="pt-4 mt-4 border-t border-border/50">
                    <button
                      onClick={() => handleEnroll(c.id)}
                      disabled={enrollSubmitting !== null}
                      className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 transition-all rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
