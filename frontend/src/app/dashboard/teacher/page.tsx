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
import { 
  GraduationCap, BookOpen, Plus, Loader2, LogOut, Sparkles, 
  FolderClosed, Settings, Sun, Moon, Globe, Menu, X, 
  AlertCircle, CheckCircle2, XCircle, FileText 
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  short_description?: string;
  description: string;
  thumbnail_url: string;
  category?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  specialization?: string;
  estimated_duration?: string;
  prerequisites?: string;
  learning_outcomes?: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  short_description: z.string().optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  specialization: z.string().optional(),
  estimated_duration: z.string().optional(),
  prerequisites: z.string().optional(),
  learning_outcomes: z.string().optional(),
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: 'draft',
      level: 'beginner',
      short_description: '',
      description: '',
      thumbnail_url: '',
      category: '',
      specialization: '',
      estimated_duration: '',
      prerequisites: '',
      learning_outcomes: '',
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
    if (isMounted && user && user.role === 'teacher') {
      fetchCourses();
    }
  }, [user, isMounted]);

  const onSubmit = async (data: CourseSchemaType) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      await api.post('/courses', {
        title: data.title,
        short_description: data.short_description || null,
        description: data.description || null,
        thumbnail_url: data.thumbnail_url || null,
        category: data.category || null,
        level: data.level,
        specialization: data.specialization || null,
        estimated_duration: data.estimated_duration || null,
        prerequisites: data.prerequisites || null,
        learning_outcomes: data.learning_outcomes || null,
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

  // Derive stats
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === 'published').length;
  const draftCourses = courses.filter(c => c.status === 'draft').length;
  const archivedCourses = courses.filter(c => c.status === 'archived').length;

  // Safe greeting name extraction
  const getGreetingName = () => {
    if (user?.full_name?.trim()) {
      return user.full_name.trim();
    }
    if (user?.email) {
      const localPart = user.email.split('@')[0];
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
    return t('greetingFallbackTeacher');
  };
  const displayName = getGreetingName();

  const approvalStatus = user?.teacher_profile?.approval_status || 'pending';

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
              {t('teacherPanel')}
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm transition-all text-left">
              <BookOpen className="h-4 w-4" />
              {t('myCourses')}
            </button>
            <button
              onClick={() => router.push('/dashboard/teacher/materials')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground font-semibold text-sm transition-all text-left mt-1"
            >
              <FileText className="h-4 w-4" />
              {t('teacherMaterialsWorkspace')}
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
        
        {/* Welcome and Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Sparkles className="h-3 w-3" />
                {t('teacherDesc')}
              </span>
              
              {/* Approval status badge */}
              {approvalStatus === 'approved' && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/15 text-success border border-success/20">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('adminLabelApproved')}
                </span>
              )}
              {approvalStatus === 'pending' && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/15 text-warning border border-warning/20">
                  <AlertCircle className="h-3 w-3" />
                  {t('adminLabelPending')}
                </span>
              )}
              {approvalStatus === 'rejected' && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/20">
                  <XCircle className="h-3 w-3" />
                  {t('adminLabelRejected')}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('welcomeTeacher', { name: displayName })}
            </h1>
          </div>
          
          {approvalStatus === 'approved' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground transition-all text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 shrink-0 hover:scale-[1.01] active:scale-[0.99] focus:outline-none"
            >
              <Plus className="h-4 w-4" />
              {t('createCourse')}
            </button>
          )}
        </div>

        {/* Approval status alerts */}
        {approvalStatus === 'pending' && (
          <div className="p-5 bg-warning/10 border border-warning/25 text-warning rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm">
                {language === 'en' ? 'Registration Pending Approval' : 'Đăng ký đang chờ duyệt'}
              </p>
              <p className="text-xs mt-1 leading-relaxed">{t('teacherPendingMessage')}</p>
            </div>
          </div>
        )}

        {approvalStatus === 'rejected' && (
          <div className="p-5 bg-danger/10 border border-danger/25 text-danger rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm">
                {language === 'en' ? 'Registration Rejected' : 'Yêu cầu đăng ký bị từ chối'}
              </p>
              <p className="text-xs mt-1 leading-relaxed">
                {language === 'en' 
                  ? `Your teacher registration request was rejected. Reason: ${user?.teacher_profile?.rejection_reason || 'No reason provided.'}`
                  : `Yêu cầu đăng ký giáo viên của bạn đã bị từ chối. Lý do: ${user?.teacher_profile?.rejection_reason || 'Không có lý do cụ thể.'}`}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {language === 'en' ? 'Total Courses' : 'Tổng số khóa học'}
              </span>
              <span className="text-2xl font-extrabold block text-foreground">
                {totalCourses}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Created curriculum
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <FolderClosed className="h-6 w-6" />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {language === 'en' ? 'Published' : 'Đã xuất bản'}
              </span>
              <span className="text-2xl font-extrabold block text-foreground">
                {publishedCourses}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Available to students
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-success/10 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {language === 'en' ? 'Drafts' : 'Bản nháp'}
              </span>
              <span className="text-2xl font-extrabold block text-foreground">
                {draftCourses}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Under development
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-warning/10 text-warning">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {language === 'en' ? 'Archived' : 'Lưu trữ'}
              </span>
              <span className="text-2xl font-extrabold block text-foreground">
                {archivedCourses}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Inactive curriculum
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
              <XCircle className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* Course Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <FolderClosed className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-extrabold tracking-tight">
              {language === 'en' ? 'My Courses' : 'Khóa học của tôi'} ({courses.length})
            </h2>
          </div>

          {courses.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl border border-border flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <FolderClosed className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">{t('emptyNoCoursesCreatedTitle')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('emptyNoCoursesCreatedDesc')}</p>
              </div>
              
              {approvalStatus === 'approved' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-xs font-bold transition-all"
                >
                  {t('createCourse')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
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

                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                        c.status === 'published' ? 'bg-success/15 text-success border-success/20' :
                        c.status === 'draft' ? 'bg-warning/15 text-warning border-warning/20' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {c.status === 'published' ? t('statusPublished') : c.status === 'draft' ? t('statusDraft') : t('statusArchived')}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base line-clamp-1 text-foreground" title={c.title}>{c.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{c.description || 'No description available.'}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/50">
                    <button
                      onClick={() => router.push(`/courses/${c.id}`)}
                      className="w-full py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 focus:outline-none"
                    >
                      <Settings className="h-3.5 w-3.5" />
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
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
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
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
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
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('thumbnailLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('thumbnailPlaceholder')}
                    {...register('thumbnail_url')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                  {errors.thumbnail_url && (
                    <span className="text-xs text-danger">{errors.thumbnail_url.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('statusLabel')}</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
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
                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
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
