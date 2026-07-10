'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { GraduationCap, BookOpen, Plus, Loader2, LogOut, Sparkles, FolderClosed, Settings, Sun, Moon, Globe } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type CourseSchemaType = z.infer<typeof courseSchema>;

export default function TeacherDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: 'draft',
      description: '',
      thumbnail_url: '',
    },
  });

  // Router guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'student') {
        router.push('/dashboard/student');
      }
    }
  }, [user, authLoading, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses/teacher/my-courses');
      setCourses(res.data);
    } catch (e) {
      console.error('Failed to load teacher courses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchCourses();
    }
  }, [user]);

  const onSubmit = async (data: CourseSchemaType) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      await api.post('/courses', {
        title: data.title,
        description: data.description || null,
        thumbnail_url: data.thumbnail_url || null,
        status: data.status,
      });
      reset();
      setShowCreateModal(false);
      await fetchCourses();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setCreateError(err.response.data.detail);
      } else {
        setCreateError('Failed to create course. Please try again.');
      }
    } finally {
      setIsCreating(false);
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
              {t('teacherPanel')}
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm transition-all text-left">
              <BookOpen className="h-4 w-4" />
              {t('myCourses')}
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
        
        {/* Welcome and Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t('teacherDesc')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('welcomeTeacher', { name: user?.full_name || '' })}</h1>
          </div>
          
          {user?.teacher_profile?.approval_status === 'approved' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 shrink-0 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Plus className="h-4 w-4" />
              {t('createCourse')}
            </button>
          )}
        </div>

        {/* Approval status banner */}
        {user?.teacher_profile?.approval_status === 'pending' && (
          <div className="p-4 bg-warning/10 border border-warning/25 text-warning rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{language === 'en' ? 'Pending Verification' : 'Chờ phê duyệt'}</p>
              <p className="text-xs mt-0.5 leading-relaxed">{t('teacherPendingMessage')}</p>
            </div>
          </div>
        )}

        {user?.teacher_profile?.approval_status === 'rejected' && (
          <div className="p-4 bg-danger/10 border border-danger/25 text-danger rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{language === 'en' ? 'Registration Rejected' : 'Yêu cầu bị từ chối'}</p>
              <p className="text-xs mt-0.5 leading-relaxed">
                {language === 'en' 
                  ? `Your teacher registration request was rejected. Reason: ${user?.teacher_profile?.rejection_reason || 'No reason provided.'}`
                  : `Yêu cầu đăng ký giáo viên của bạn đã bị từ chối. Lý do: ${user?.teacher_profile?.rejection_reason || 'Không có lý do được cung cấp.'}`}
              </p>
            </div>
          </div>
        )}

        {/* Course Grid */}
        <section className="space-y-6">
          {courses.length === 0 ? (
            <div className="glass p-16 text-center rounded-2xl border border-border space-y-4">
              <FolderClosed className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-lg">{t('noCoursesCreated')}</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {t('noCoursesSub')}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <div key={c.id} className="glass rounded-xl p-5 border border-border space-y-4 flex flex-col justify-between glass-hover">
                  <div className="space-y-2">
                    <div className="aspect-[16/9] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        c.status === 'published' ? 'bg-success/10 text-success border-success/20' :
                        c.status === 'draft' ? 'bg-warning/10 text-warning border-warning/20' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {c.status === 'published' ? t('statusPublished') : c.status === 'draft' ? t('statusDraft') : t('statusArchived')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base line-clamp-1 text-foreground" title={c.title}>{c.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{c.description || 'No description available.'}</p>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <button
                      onClick={() => router.push(`/courses/${c.id}`)}
                      className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground transition-all rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      {t('manageSyllabus')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="w-full max-w-md glass border border-border rounded-2xl p-6 shadow-2xl space-y-6 bg-card text-foreground">
              
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <h3 className="text-lg font-bold">{t('createCourseTitle')}</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-danger/10 border border-danger/25 text-danger text-xs rounded-lg flex items-center gap-2">
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('courseTitleLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('courseTitlePlaceholder')}
                    {...register('title')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                  {errors.title && (
                    <span className="text-xs text-danger">{errors.title.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('descLabel')}</label>
                  <textarea
                    placeholder={t('descPlaceholder')}
                    rows={3}
                    {...register('description')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('thumbnailLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('thumbnailPlaceholder')}
                    {...register('thumbnail_url')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                  {errors.thumbnail_url && (
                    <span className="text-xs text-danger">{errors.thumbnail_url.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('statusLabel')}</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  >
                    <option value="draft" className="bg-card text-foreground">{t('statusDraftOption')}</option>
                    <option value="published" className="bg-card text-foreground">{t('statusPublishedOption')}</option>
                    <option value="archived" className="bg-card text-foreground">{t('statusArchivedOption')}</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 text-sm font-bold transition-all flex items-center justify-center gap-1.5"
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

      </main>
    </div>
  );
}
