'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import AppHeader from '@/components/Header';
import { 
  GraduationCap, BookOpen, Plus, Loader2, ArrowLeft, 
  Trash2, Lock, FileText, Video, ChevronRight 
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
  const { t } = usePreference();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Creation state for teachers
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<number | null>(null);
  
  // Lesson form state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');
  const [lessonDoc, setLessonDoc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);

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
        content: lessonContent || null,
        chapter_id: targetChapterId,
        order_index: maxIndex + 1,
        video_url: lessonVideo || null,
        document_url: lessonDoc || null,
      });

      setLessonTitle('');
      setLessonContent('');
      setLessonVideo('');
      setLessonDoc('');
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
            <div className="w-full max-w-md glass border border-border rounded-2xl p-6 shadow-2xl space-y-4 bg-card text-foreground">
              <h3 className="text-lg font-bold">{t('addLesson')}</h3>
              <form onSubmit={handleAddLesson} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('lessonTitleLabel')}</label>
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
                  <label className="text-xs text-muted-foreground font-semibold">{t('lessonContentLabel')}</label>
                  <textarea
                    placeholder={t('lessonContentPlaceholder')}
                    rows={4}
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('videoLinkLabel')}</label>
                  <input
                    type="text"
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    value={lessonVideo}
                    onChange={(e) => setLessonVideo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">{t('docLinkLabel')}</label>
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
                    className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-xs font-bold transition-colors"
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
