'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import AppHeader from '@/components/Header';
import { 
  GraduationCap, BookOpen, Plus, Loader2, ArrowLeft, 
  Trash2, Lock, FileText, Video, ChevronRight, Download, ExternalLink
} from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  order_index: number;
  video_url?: string;
  document_url?: string;
}

interface Chapter {
  id: number;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Teacher {
  id: number;
  full_name: string;
  email: string;
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  status: string;
  teacher_id: number;
  teacher: Teacher;
  chapters: Chapter[];
}

export const dynamic = 'force-dynamic';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = usePreference();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Creation state for teachers
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<number | null>(null);
  
  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonDoc, setLessonDoc] = useState('');
  const [lessonType, setLessonType] = useState('text');
  const [lessonDuration, setLessonDuration] = useState('10');
  const [lessonVisibility, setLessonVisibility] = useState('enrolled_students');
  const [lessonStatus, setLessonStatus] = useState('published');
  const [lessonIsRequired, setLessonIsRequired] = useState(true);
  const [lessonIsVisible, setLessonIsVisible] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);

      // Fetch course-level materials
      try {
        const matRes = await api.get(`/courses/${id}/materials`);
        // Filter out lesson-specific materials to show only course-level files
        const courseLevelFiles = matRes.data.filter((m: any) => !m.lesson_id);
        setCourseMaterials(courseLevelFiles);
      } catch (err) {
        console.error('Failed to load course materials:', err);
      }

      if (user && user.role === 'student') {
        const enrollRes = await api.get('/courses/student/enrolled');
        const enrolledList: any[] = enrollRes.data;
        setIsEnrolled(enrolledList.some((c) => c.id === parseInt(id as string)));
      }
    } catch (e) {
      console.error('Failed to load course details:', e);
      router.push(user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchCourseDetails();
    }
  }, [id, user, authLoading]);

  const handleEnroll = async () => {
    setEnrollLoading(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      setIsEnrolled(true);
      await fetchCourseDetails();
    } catch (e) {
      console.error('Enrollment failed:', e);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;
    setSubmitting(true);
    try {
      const maxIndex = course?.chapters?.reduce((max, ch) => Math.max(max, ch.order_index), 0) || 0;
      await api.post(`/courses/${id}/chapters`, {
        title: chapterTitle,
        order_index: maxIndex + 1,
      });
      setChapterTitle('');
      setShowChapterModal(false);
      await fetchCourseDetails();
    } catch (e) {
      console.error('Failed to create chapter:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm('Are you sure you want to delete this chapter? All lessons inside will be deleted.')) return;
    try {
      await api.delete(`/chapters/${chapterId}`);
      await fetchCourseDetails();
    } catch (e) {
      console.error('Failed to delete chapter:', e);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || targetChapterId === null) return;
    setSubmitting(true);
    try {
      const ch = course?.chapters.find(c => c.id === targetChapterId);
      const maxIndex = ch?.lessons?.reduce((max, les) => Math.max(max, les.order_index), 0) || 0;

      await api.post(`/courses/${id}/lessons`, {
        title: lessonTitle,
        description: lessonDescription || null,
        content: lessonContent || null,
        chapter_id: targetChapterId,
        order_index: maxIndex + 1,
        video_url: lessonVideo || null,
        document_url: lessonDoc || null,
        lesson_type: lessonType,
        estimated_duration: parseInt(lessonDuration) || 10,
        visibility: lessonVisibility,
        status: lessonStatus,
        is_required: lessonIsRequired,
        is_visible: lessonIsVisible,
      });

      setLessonTitle('');
      setLessonDescription('');
      setLessonContent('');
      setLessonVideo('');
      setLessonDoc('');
      setLessonType('text');
      setLessonDuration('10');
      setLessonVisibility('enrolled_students');
      setLessonStatus('published');
      setLessonIsRequired(true);
      setLessonIsVisible(true);
      setShowLessonModal(false);
      await fetchCourseDetails();
    } catch (e) {
      console.error('Failed to create lesson:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      await fetchCourseDetails();
    } catch (e) {
      console.error('Failed to delete lesson:', e);
    }
  };

  if (authLoading || loading || !course) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const isCourseOwner = user?.role === 'teacher' && course.teacher_id === user.id;

  return (
    <div className="min-h-dvh bg-background text-foreground pb-20 transition-colors duration-300">
      
      {/* Decorative Gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <AppHeader />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 sm:space-y-10 relative z-10 fade-in">
        
        {/* Back Link */}
        <div>
          <button
            onClick={() => router.push(user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToDashboard')}
          </button>
        </div>

        {/* Course Banner */}
        <div className="glass p-6 sm:p-8 rounded-2xl border border-border space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <span className="text-xs font-bold text-primary capitalize">
                Instructor: {course.teacher.full_name}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{course.title}</h1>
            </div>
            
            {/* Enrollment / Status Button */}
            {user?.role === 'student' && (
              isEnrolled ? (
                <span className="px-4 py-2.5 bg-success/15 border border-success/20 text-success rounded-xl text-xs font-bold shrink-0 self-start">
                  {t('enrolledBadge')}
                </span>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrollLoading}
                  className="px-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 transition-all rounded-xl text-sm font-bold shadow-lg shadow-primary/10 shrink-0 self-start hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {enrollLoading ? t('loading') : t('enrollInCourse')}
                </button>
              )
            )}

            {isCourseOwner && (
              <span className="px-3 py-1 bg-warning/15 border border-warning/20 text-warning rounded-full text-xs font-bold capitalize shrink-0 self-start">
                {course.status === 'published' ? t('statusPublished') : course.status === 'draft' ? t('statusDraft') : t('statusArchived')}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed break-words">
            {course.description || 'No course description provided.'}
          </p>
        </div>

        {/* Course Level Materials */}
        {courseMaterials.length > 0 && (
          <div className="glass p-6 rounded-2xl border border-border space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {language === 'en' ? 'Course Resources' : 'Tài liệu khóa học'} ({courseMaterials.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courseMaterials.map((m) => {
                const isLink = m.material_type === 'external_link';
                const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${m.download_url}`;
                
                return (
                  <div key={m.id} className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between gap-3 hover:border-primary/45 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isLink ? (
                        <ExternalLink className="h-4 w-4 text-sky-400 shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-foreground" title={m.title}>{m.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.description || m.original_filename}</p>
                      </div>
                    </div>
                    
                    {isLink ? (
                      <a
                        href={m.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0 text-sky-400"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      m.is_downloadable ? (
                        <a
                          href={downloadUrl}
                          download
                          className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
                        >
                          Download <Download className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic shrink-0 px-2.5 py-1.5">View Only</span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Syllabus / Content Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-extrabold tracking-tight">{t('courseSyllabus')}</h2>
            </div>
            
            {isCourseOwner && (
              <button
                onClick={() => setShowChapterModal(true)}
                className="px-3.5 py-2 bg-primary hover:bg-primary/95 text-primary-foreground transition-all rounded-lg text-xs font-bold flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('addChapter')}
              </button>
            )}
          </div>

          {course.chapters.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl border border-border">
              <p className="text-muted-foreground text-xs leading-relaxed">{t('noChapters')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {course.chapters.map((chapter) => (
                <div key={chapter.id} className="glass rounded-xl p-5 border border-border space-y-4">
                  
                  {/* Chapter Header */}
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <h3 className="font-extrabold text-base text-foreground break-words pr-2">
                      {chapter.title}
                    </h3>
                    
                    {isCourseOwner && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setTargetChapterId(chapter.id);
                            setShowLessonModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-md text-[10px] font-bold flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <Plus className="h-3 w-3" /> {t('addLesson')}
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="p-1.5 hover:bg-danger/10 hover:text-danger rounded-md transition-colors border border-transparent hover:border-danger/20"
                          title="Delete Chapter"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lessons list */}
                  {chapter.lessons.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-2">{t('noLessonsInChapter')}</p>
                  ) : (
                    <div className="space-y-2.5 pl-1">
                      {chapter.lessons.map((lesson) => {
                        const canAccessLesson = isCourseOwner || isEnrolled;
                        
                        return (
                          <div
                            key={lesson.id}
                            className={`flex justify-between items-center p-3 rounded-xl border transition-all text-left ${
                              canAccessLesson
                                ? 'bg-muted/40 border-border hover:border-primary/40 cursor-pointer hover:bg-muted/60'
                                : 'bg-muted/10 border-border/60 opacity-60'
                            }`}
                            onClick={() => {
                              if (canAccessLesson) {
                                router.push(`/courses/${id}/lessons/${lesson.id}`);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-4">
                              {lesson.video_url ? (
                                <Video className="h-4 w-4 text-primary shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 text-primary/80 shrink-0" />
                              )}
                              <span className="text-sm font-semibold truncate text-foreground">{lesson.title}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isCourseOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(lesson.id);
                                  }}
                                  className="p-1.5 hover:bg-danger/10 hover:text-danger rounded-md transition-colors border border-transparent hover:border-danger/20"
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canAccessLesson ? (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal: Add Chapter */}
        {showChapterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="w-full max-w-sm glass border border-border rounded-2xl p-6 shadow-2xl space-y-4 bg-card text-foreground">
              <h3 className="text-lg font-bold">{t('addChapter')}</h3>
              <form onSubmit={handleAddChapter} className="space-y-4">
                <input
                  type="text"
                  placeholder={t('chapterTitlePlaceholder')}
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  required
                />
                <div className="flex gap-2 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowChapterModal(false)}
                    className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-xs font-bold transition-colors"
                  >
                    {submitting ? t('adding') : t('addChapter')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Lesson */}
        {showLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto fade-in">
            <div className="w-full max-w-lg glass border border-border rounded-2xl p-6 shadow-2xl space-y-4 bg-card text-foreground max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold">{t('addLesson')}</h3>
              <form onSubmit={handleAddLesson} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('lessonTitleLabel')} *</label>
                  <input
                    type="text"
                    placeholder={t('lessonTitlePlaceholder')}
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('descLabel')}</label>
                  <textarea
                    placeholder={t('descPlaceholder')}
                    rows={2}
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('lessonContentLabel')}</label>
                  <textarea
                    placeholder={t('lessonContentPlaceholder')}
                    rows={3}
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">{t('lessonTypeLabel')}</label>
                    <select
                      value={lessonType}
                      onChange={(e) => setLessonType(e.target.value)}
                      className="w-full px-4 py-2 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                    >
                      <option value="text">Text Lesson</option>
                      <option value="youtube_url">YouTube Video</option>
                      <option value="local_video">Local Upload Video</option>
                      <option value="documents">Documents Only</option>
                      <option value="mixed">Mixed Structure</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">{t('estimatedDurationMinLabel')}</label>
                    <input
                      type="number"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(e.target.value)}
                      className="w-full px-4 py-2 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">{t('materialVisibilityLabel')}</label>
                    <select
                      value={lessonVisibility}
                      onChange={(e) => setLessonVisibility(e.target.value)}
                      className="w-full px-4 py-2 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                    >
                      <option value="enrolled_students">{t('visibilityEnrolled')}</option>
                      <option value="teacher_only">{t('visibilityTeacherOnly')}</option>
                      <option value="public">{t('visibilityPublic')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">{t('statusLabel')}</label>
                    <select
                      value={lessonStatus}
                      onChange={(e) => setLessonStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-muted/60 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="lessonIsRequired"
                      checked={lessonIsRequired}
                      onChange={(e) => setLessonIsRequired(e.target.checked)}
                      className="h-4 w-4 text-primary bg-muted/40 border-border rounded"
                    />
                    <label htmlFor="lessonIsRequired" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                      {t('isRequiredLabel')}
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="lessonIsVisible"
                      checked={lessonIsVisible}
                      onChange={(e) => setLessonIsVisible(e.target.checked)}
                      className="h-4 w-4 text-primary bg-muted/40 border-border rounded"
                    />
                    <label htmlFor="lessonIsVisible" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                      {t('isVisibleLabel')}
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('videoLinkLabel')} ({language === 'en' ? 'YouTube/External' : 'YouTube/Ngoài'})</label>
                  <input
                    type="text"
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    value={lessonVideo}
                    onChange={(e) => setLessonVideo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('docLinkLabel')} ({language === 'en' ? 'Drive/External' : 'Drive/Ngoài'})</label>
                  <input
                    type="text"
                    placeholder="e.g. https://drive.google.com/..."
                    value={lessonDoc}
                    onChange={(e) => setLessonDoc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowLessonModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-xs font-bold transition-colors"
                  >
                    {submitting ? t('adding') : t('addLesson')}
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
