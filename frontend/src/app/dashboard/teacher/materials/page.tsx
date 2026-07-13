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
import axios from 'axios';
import { 
  GraduationCap, BookOpen, Plus, Loader2, LogOut, Sparkles, 
  FolderClosed, Settings, Sun, Moon, Globe, Menu, X, 
  AlertCircle, CheckCircle2, XCircle, FileText, Link2, 
  Archive, Download, ExternalLink, Search, Eye
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
}

interface Lesson {
  id: number;
  title: string;
  course_id: number;
}

interface Material {
  id: number;
  course_id: number;
  lesson_id?: number;
  uploaded_by?: number;
  title: string;
  description?: string;
  original_filename: string;
  mime_type?: string;
  file_extension?: string;
  size_bytes?: number;
  external_url?: string;
  material_type: string;
  visibility: string;
  is_downloadable: boolean;
  is_active: boolean;
  created_at: string;
  download_url?: string;
}

const linkSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  external_url: z.string().url('Must be a valid URL'),
  visibility: z.enum(['teacher_only', 'enrolled_students', 'public']),
});

type LinkSchemaType = z.infer<typeof linkSchema>;

export default function TeacherMaterials() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const router = useRouter();
  
  // Data lists
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  // Filters state
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, active, archived
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadType, setUploadType] = useState('document');
  const [uploadVisibility, setUploadVisibility] = useState('enrolled_students');
  const [uploadDownloadable, setUploadDownloadable] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Link state
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkCourseId, setLinkCourseId] = useState<number | ''>('');
  const [linkLessonId, setLinkLessonId] = useState<number | ''>('');

  // Upload course/lesson select
  const [uploadCourseId, setUploadCourseId] = useState<number | ''>('');
  const [uploadLessonId, setUploadLessonId] = useState<number | ''>('');

  const {
    register: registerLink,
    handleSubmit: handleSubmitLink,
    reset: resetLink,
    formState: { errors: linkErrors },
  } = useForm<LinkSchemaType>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      visibility: 'enrolled_students',
      description: '',
    }
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

  // Fetch courses and lessons
  const fetchMetadata = async () => {
    try {
      const coursesRes = await api.get('/courses/teacher/my-courses');
      setCourses(coursesRes.data);
      
      // Fetch lessons for each course to aggregate
      const allLessons: Lesson[] = [];
      for (const course of coursesRes.data) {
        const detailsRes = await api.get(`/courses/${course.id}`);
        if (detailsRes.data && detailsRes.data.chapters) {
          for (const chap of detailsRes.data.chapters) {
            if (chap.lessons) {
              allLessons.push(...chap.lessons);
            }
          }
        }
      }
      setLessons(allLessons);
    } catch (e) {
      console.error('Failed to load courses metadata:', e);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      // Map filter properties
      const params: any = {
        page: 1,
        page_size: 100,
      };
      
      if (selectedCourse) params.course_id = parseInt(selectedCourse);
      if (selectedLesson) params.lesson_id = parseInt(selectedLesson);
      if (selectedType) params.material_type = selectedType;
      if (selectedVisibility) params.visibility = selectedVisibility;
      if (selectedStatus === 'active') params.is_active = true;
      if (selectedStatus === 'archived') params.is_active = false;
      if (searchQuery.trim()) params.search = searchQuery;
      
      const res = await api.get('/teacher/materials', { params });
      setMaterials(res.data);
    } catch (e) {
      console.error('Failed to load materials:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && user && user.role === 'teacher') {
      fetchMetadata();
    }
  }, [user, isMounted]);

  useEffect(() => {
    if (isMounted && user && user.role === 'teacher') {
      fetchMaterials();
    }
  }, [user, isMounted, selectedCourse, selectedLesson, selectedType, selectedVisibility, selectedStatus, searchQuery]);

  // Handle file upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    if (!uploadCourseId) {
      setUploadError('Please select a course');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadTitle.trim()) formData.append('title', uploadTitle);
    if (uploadDescription.trim()) formData.append('description', uploadDescription);
    formData.append('material_type', uploadType);
    formData.append('visibility', uploadVisibility);
    formData.append('is_downloadable', String(uploadDownloadable));

    const token = localStorage.getItem('token');
    const endpoint = uploadLessonId 
      ? `/api/v1/lessons/${uploadLessonId}/materials/upload`
      : `/api/v1/courses/${uploadCourseId}/materials/upload`;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percent);
            }
          },
        }
      );

      // Reset
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadCourseId('');
      setUploadLessonId('');
      setUploadProgress(null);
      setShowUploadModal(false);
      await fetchMaterials();
    } catch (err: any) {
      console.error(err);
      setUploadProgress(null);
      if (err.response && err.response.data && err.response.data.detail) {
        setUploadError(err.response.data.detail);
      } else {
        setUploadError('Failed to upload file. Please check file type/size limits.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle external link submission
  const onSubmitLink = async (data: LinkSchemaType) => {
    if (!linkCourseId) {
      setLinkError('Please select a course');
      return;
    }

    setIsSubmittingLink(true);
    setLinkError(null);

    const endpoint = linkLessonId
      ? `/lessons/${linkLessonId}/materials/link`
      : `/courses/${linkCourseId}/materials/link`;

    try {
      await api.post(endpoint, {
        title: data.title,
        description: data.description || null,
        external_url: data.external_url,
        visibility: data.visibility,
      });

      resetLink();
      setLinkCourseId('');
      setLinkLessonId('');
      setShowLinkModal(false);
      await fetchMaterials();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setLinkError(err.response.data.detail);
      } else {
        setLinkError('Failed to create link. Please try again.');
      }
    } finally {
      setIsSubmittingLink(false);
    }
  };

  // Archive (soft delete)
  const handleArchive = async (materialId: number) => {
    try {
      await api.post(`/materials/${materialId}/archive`);
      await fetchMaterials();
    } catch (e) {
      console.error('Failed to archive material:', e);
    }
  };

  // Helper formatting
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return '';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter lessons based on course selection in modals
  const filteredLessonsForUpload = lessons.filter(l => l.course_id === uploadCourseId);
  const filteredLessonsForLink = lessons.filter(l => l.course_id === linkCourseId);

  if (!isMounted || authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-foreground">{"SmartLearn "}<span className="text-primary">{"LMS"}</span></span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
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
            <button 
              onClick={() => router.push('/dashboard/teacher')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted font-semibold text-sm transition-all text-left"
            >
              <BookOpen className="h-4 w-4" />
              {t('myCourses')}
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm transition-all text-left mt-1">
              <FileText className="h-4 w-4" />
              {t('teacherMaterialsWorkspace')}
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="mt-8 pt-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between gap-2 p-1 bg-muted/40 rounded-xl border border-border">
            <button onClick={toggleTheme} className="flex-1 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex justify-center">
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
            <div className="h-4 w-[1px] bg-border shrink-0" />
            <button onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')} className="flex-1 p-2 rounded-lg hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'EN' : 'VI'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 p-1 rounded-xl">
            <div className="h-10 w-10 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center uppercase shrink-0">
              {user?.full_name?.charAt(0) || 'T'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          </div>
          
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs font-bold transition-all">
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full fade-in overflow-x-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('materialsTitle')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Manage, organize, and upload teaching materials for courses and lessons.' : 'Quản lý, tổ chức và tải lên tài liệu giảng dạy cho các khóa học và bài học.'}
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              {t('addExternalLink')}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              {t('uploadMaterial')}
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <section className="glass p-5 rounded-2xl border border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('courseLabel')}</label>
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setSelectedLesson(''); }}
              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
            >
              <option value="">{language === 'en' ? 'All Courses' : 'Tất cả khóa học'}</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('lessonLabel')}</label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              disabled={!selectedCourse}
              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground disabled:opacity-50"
            >
              <option value="">{language === 'en' ? 'All Lessons' : 'Tất cả bài học'}</option>
              {lessons.filter(l => l.course_id === parseInt(selectedCourse)).map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('materialTypeLabel')}</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
            >
              <option value="">{language === 'en' ? 'All Types' : 'Tất cả các loại'}</option>
              <option value="syllabus">{t('typeSyllabus')}</option>
              <option value="slide">{t('typeSlide')}</option>
              <option value="document">{t('typeDocument')}</option>
              <option value="source_code">{t('typeSourceCode')}</option>
              <option value="dataset">{t('typeDataset')}</option>
              <option value="image">{t('typeImage')}</option>
              <option value="video">{t('typeVideo')}</option>
              <option value="external_link">{t('typeExternalLink')}</option>
              <option value="other">{t('typeOther')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'en' ? 'Status & Visibility' : 'Trạng thái & Hiển thị'}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
            >
              <option value="all">{language === 'en' ? 'Active & Archived' : 'Hoạt động & Lưu trữ'}</option>
              <option value="active">{language === 'en' ? 'Active Only' : 'Chỉ hoạt động'}</option>
              <option value="archived">{language === 'en' ? 'Archived Only' : 'Chỉ lưu trữ'}</option>
            </select>
          </div>

          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'en' ? 'Search' : 'Tìm kiếm'}</label>
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'en' ? 'Search title...' : 'Tìm tiêu đề...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
          </div>
        </section>

        {/* Materials Table Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t('loading')}</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="glass p-16 text-center rounded-2xl border border-border flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground">{t('noMaterials')}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t('noMaterialsSub')}</p>
            </div>
          </div>
        ) : (
          <div className="glass border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">{t('materialTitleLabel')}</th>
                    <th className="p-4">{t('materialTypeLabel')}</th>
                    <th className="p-4">{language === 'en' ? 'Attached to' : 'Đính kèm ở'}</th>
                    <th className="p-4">{t('materialVisibilityLabel')}</th>
                    <th className="p-4">{language === 'en' ? 'Size' : 'Kích thước'}</th>
                    <th className="p-4">{language === 'en' ? 'Status' : 'Trạng thái'}</th>
                    <th className="p-4 text-right">{t('adminColActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {materials.map((m) => {
                    const courseTitle = courses.find(c => c.id === m.course_id)?.title || 'Course';
                    const lessonTitle = m.lesson_id ? lessons.find(l => l.id === m.lesson_id)?.title : null;
                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-bold">
                          <div className="space-y-0.5">
                            <span className="block text-foreground">{m.title}</span>
                            <span className="block text-[10px] text-muted-foreground/80 font-normal truncate max-w-xs">{m.description || m.original_filename}</span>
                          </div>
                        </td>
                        <td className="p-4 capitalize">
                          <span className="flex items-center gap-1.5">
                            {m.material_type === 'external_link' ? <Link2 className="h-3.5 w-3.5 text-sky-400" /> : <FileText className="h-3.5 w-3.5 text-primary" />}
                            {m.material_type === 'external_link' ? t('typeExternalLink') : m.material_type}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5 text-[10px]">
                            <span className="block text-muted-foreground max-w-[150px] truncate">{courseTitle}</span>
                            {lessonTitle && (
                              <span className="block text-primary/80 font-medium max-w-[150px] truncate">{"→ "}{lessonTitle}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            m.visibility === 'public' ? 'bg-success/15 text-success border-success/20' :
                            m.visibility === 'teacher_only' ? 'bg-danger/15 text-danger border-danger/20' :
                            'bg-primary/15 text-primary border-primary/20'
                          }`}>
                            {m.visibility === 'public' ? t('visibilityPublic') : m.visibility === 'teacher_only' ? t('visibilityTeacherOnly') : t('visibilityEnrolled')}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {m.material_type === 'external_link' ? '—' : formatBytes(m.size_bytes)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            m.is_active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {m.is_active ? (language === 'en' ? 'Active' : 'Hoạt động') : (language === 'en' ? 'Archived' : 'Đã lưu trữ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {m.material_type === 'external_link' ? (
                              <a
                                href={m.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-muted text-sky-400 hover:text-sky-500 transition-colors"
                                title="Open Link"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${m.download_url}`}
                                download
                                className="p-1.5 rounded-lg hover:bg-muted text-primary hover:text-primary-dark transition-colors"
                                title="Download File"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                            
                            {m.is_active && (
                              <button
                                onClick={() => handleArchive(m.id)}
                                className="p-1.5 rounded-lg hover:bg-muted text-warning hover:text-warning-dark transition-colors"
                                title={t('archiveMaterial')}
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload File Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="w-full max-w-md glass border border-border rounded-2xl p-6 shadow-2xl space-y-5 bg-card text-foreground">
              
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <h3 className="text-lg font-bold">{t('uploadMaterial')}</h3>
                <button
                  onClick={() => { setShowUploadModal(false); setUploadError(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-danger/10 border border-danger/25 text-danger text-xs rounded-lg flex items-center gap-2">
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('courseLabel')} *</label>
                  <select
                    value={uploadCourseId}
                    onChange={(e) => {
                      setUploadCourseId(e.target.value ? parseInt(e.target.value) : '');
                      setUploadLessonId('');
                    }}
                    required
                    className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="">{language === 'en' ? 'Select Target Course' : 'Chọn khóa học đích'}</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('lessonLabel')} ({language === 'en' ? 'Optional' : 'Tùy chọn'})</label>
                  <select
                    value={uploadLessonId}
                    onChange={(e) => setUploadLessonId(e.target.value ? parseInt(e.target.value) : '')}
                    disabled={!uploadCourseId}
                    className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground disabled:opacity-50"
                  >
                    <option value="">{language === 'en' ? 'Course Level (None)' : 'Cấp khóa học (Không chọn)'}</option>
                    {filteredLessonsForUpload.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('materialFileLabel')} *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setUploadFile(e.target.files[0]);
                        if (!uploadTitle.trim()) {
                          setUploadTitle(e.target.files[0].name.split('.')[0]);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-xs text-foreground focus:outline-none"
                  />
                  <span className="text-[10px] text-muted-foreground/80 block mt-1">
                    {language === 'en' 
                      ? 'Supported: PDF, DOCX, PPTX, JPG, PNG, ZIP. Limit: 30 MB.' 
                      : 'Định dạng hỗ trợ: PDF, DOCX, PPTX, JPG, PNG, ZIP. Giới hạn: 30 MB.'}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('materialTitleLabel')}</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder={language === 'en' ? 'Custom display title' : 'Tiêu đề hiển thị tùy chỉnh'}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('materialDescLabel')}</label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={2}
                    placeholder={t('descPlaceholder')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('materialTypeLabel')}</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                    >
                      <option value="document">{t('typeDocument')}</option>
                      <option value="syllabus">{t('typeSyllabus')}</option>
                      <option value="slide">{t('typeSlide')}</option>
                      <option value="source_code">{t('typeSourceCode')}</option>
                      <option value="dataset">{t('typeDataset')}</option>
                      <option value="image">{t('typeImage')}</option>
                      <option value="other">{t('typeOther')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('materialVisibilityLabel')}</label>
                    <select
                      value={uploadVisibility}
                      onChange={(e) => setUploadVisibility(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                    >
                      <option value="enrolled_students">{t('visibilityEnrolled')}</option>
                      <option value="teacher_only">{t('visibilityTeacherOnly')}</option>
                      <option value="public">{t('visibilityPublic')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="uploadDownloadable"
                    checked={uploadDownloadable}
                    onChange={(e) => setUploadDownloadable(e.target.checked)}
                    className="h-4 w-4 text-primary bg-muted/40 border-border rounded"
                  />
                  <label htmlFor="uploadDownloadable" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                    {t('materialDownloadableLabel')}
                  </label>
                </div>

                {/* Real-time upload progress tracking */}
                {isUploading && uploadProgress !== null && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>
                        {uploadProgress < 100 
                          ? t('uploadProgress', { percent: uploadProgress })
                          : (language === 'en' ? '100% - Committing to secure database...' : '100% - Đang ghi vào cơ sở dữ liệu an toàn...')}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full transition-all duration-300 ${uploadProgress < 100 ? 'bg-primary' : 'bg-success animate-pulse'}`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => { setShowUploadModal(false); setUploadError(null); }}
                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {language === 'en' ? 'Uploading...' : 'Đang tải lên...'}
                      </>
                    ) : (
                      language === 'en' ? 'Upload' : 'Tải lên'
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* Link Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="w-full max-w-md glass border border-border rounded-2xl p-6 shadow-2xl space-y-5 bg-card text-foreground">
              
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <h3 className="text-lg font-bold">{t('addExternalLink')}</h3>
                <button
                  onClick={() => { setShowLinkModal(false); setLinkError(null); }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              {linkError && (
                <div className="p-3 bg-danger/10 border border-danger/25 text-danger text-xs rounded-lg flex items-center gap-2">
                  <span>{linkError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitLink(onSubmitLink)} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('courseLabel')} *</label>
                  <select
                    value={linkCourseId}
                    onChange={(e) => {
                      setLinkCourseId(e.target.value ? parseInt(e.target.value) : '');
                      setLinkLessonId('');
                    }}
                    required
                    className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="">{language === 'en' ? 'Select Target Course' : 'Chọn khóa học đích'}</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('lessonLabel')} ({language === 'en' ? 'Optional' : 'Tùy chọn'})</label>
                  <select
                    value={linkLessonId}
                    onChange={(e) => setLinkLessonId(e.target.value ? parseInt(e.target.value) : '')}
                    disabled={!linkCourseId}
                    className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground disabled:opacity-50"
                  >
                    <option value="">{language === 'en' ? 'Course Level (None)' : 'Cấp khóa học (Không chọn)'}</option>
                    {filteredLessonsForLink.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('materialTitleLabel')} *</label>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Link Title' : 'Tiêu đề liên kết'}
                    {...registerLink('title')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                  {linkErrors.title && (
                    <span className="text-xs text-danger">{linkErrors.title.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('externalUrlLabel')} *</label>
                  <input
                    type="text"
                    placeholder="https://example.com/materials/..."
                    {...registerLink('external_url')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                  {linkErrors.external_url && (
                    <span className="text-xs text-danger">{linkErrors.external_url.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('materialDescLabel')}</label>
                  <textarea
                    placeholder={t('descPlaceholder')}
                    rows={2}
                    {...registerLink('description')}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t('materialVisibilityLabel')}</label>
                  <select
                    {...registerLink('visibility')}
                    className="w-full px-4 py-2.5 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                  >
                    <option value="enrolled_students">{t('visibilityEnrolled')}</option>
                    <option value="teacher_only">{t('visibilityTeacherOnly')}</option>
                    <option value="public">{t('visibilityPublic')}</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    disabled={isSubmittingLink}
                    onClick={() => { setShowLinkModal(false); setLinkError(null); }}
                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLink}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingLink ? (
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
