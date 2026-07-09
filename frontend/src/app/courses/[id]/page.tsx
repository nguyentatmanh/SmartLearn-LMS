'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  GraduationCap, BookOpen, Plus, Loader2, ArrowLeft, 
  Trash2, Lock, FileText, Video, ChevronRight, PlaySquare 
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

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
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
      // Find current max order_index to place it at the end
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
      // Get current lessons in chapter to set order_index
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

      // Clear state
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
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-slate-400">Loading course curriculum...</p>
        </div>
      </div>
    );
  }

  const isCourseOwner = user?.role === 'teacher' && course.teacher_id === user.id;

  return (
    <div className="min-h-screen bg-[#0b0f19] pb-20">
      
      {/* Dynamic Radial Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-900/5 blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-40 w-full glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push(user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-violet-500" />
            <span className="font-extrabold text-sm tracking-tight hidden sm:inline-block">SmartLearn</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10 relative z-10">
        
        {/* Course Banner */}
        <div className="glass p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-violet-400 capitalize">
                Instructor: {course.teacher.full_name}
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">{course.title}</h1>
            </div>
            
            {/* Enrollment / Status Button */}
            {user?.role === 'student' && (
              isEnrolled ? (
                <span className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold shrink-0">
                  ✓ Enrolled
                </span>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrollLoading}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-violet-600/10 shrink-0"
                >
                  {enrollLoading ? 'Enrolling...' : 'Enroll in Course'}
                </button>
              )
            )}

            {isCourseOwner && (
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-bold capitalize">
                {course.status} Mode
              </span>
            )}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {course.description || 'No course description provided.'}
          </p>
        </div>

        {/* Syllabus / Content Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-400" />
              <h2 className="text-xl font-bold">Course Syllabus</h2>
            </div>
            
            {isCourseOwner && (
              <button
                onClick={() => setShowChapterModal(true)}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 transition-colors rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Chapter
              </button>
            )}
          </div>

          {course.chapters.length === 0 ? (
            <div className="glass p-12 text-center rounded-2xl border border-white/5">
              <p className="text-slate-500 text-xs">No chapters have been added to this course curriculum yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {course.chapters.map((chapter) => (
                <div key={chapter.id} className="glass rounded-xl p-5 border border-white/5 space-y-4">
                  
                  {/* Chapter Header */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="font-extrabold text-base text-slate-200">
                      {chapter.title}
                    </h3>
                    
                    {isCourseOwner && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTargetChapterId(chapter.id);
                            setShowLessonModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] font-bold flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Lesson
                        </button>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Lessons list */}
                  {chapter.lessons.length === 0 ? (
                    <p className="text-xs text-slate-500 italic pl-4">No lessons in this chapter yet.</p>
                  ) : (
                    <div className="space-y-2.5 pl-2">
                      {chapter.lessons.map((lesson) => {
                        const canAccessLesson = isCourseOwner || isEnrolled;
                        
                        return (
                          <div
                            key={lesson.id}
                            className={`flex justify-between items-center p-3 rounded-lg border transition-all text-left ${
                              canAccessLesson
                                ? 'bg-[#0f172a]/50 border-white/5 hover:border-violet-500/30 cursor-pointer'
                                : 'bg-[#0f172a]/20 border-white/5 opacity-60'
                            }`}
                            onClick={() => {
                              if (canAccessLesson) {
                                router.push(`/courses/${id}/lessons/${lesson.id}`);
                              }
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {lesson.video_url ? (
                                <Video className="h-4 w-4 text-violet-400 shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                              )}
                              <span className="text-sm font-medium">{lesson.title}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              {isCourseOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(lesson.id);
                                  }}
                                  className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canAccessLesson ? (
                                <ChevronRight className="h-4 w-4 text-slate-500" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-slate-600" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm glass border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold">Add New Chapter</h3>
              <form onSubmit={handleAddChapter} className="space-y-4">
                <input
                  type="text"
                  placeholder="Chapter Title (e.g. Chapter 1: Introduction)"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChapterModal(false)}
                    className="flex-1 py-2 rounded-lg border border-white/5 text-xs font-semibold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold"
                  >
                    {submitting ? 'Adding...' : 'Add Chapter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Lesson */}
        {showLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold">Add Lesson to Chapter</h3>
              <form onSubmit={handleAddLesson} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Lesson Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.1 Overview of Relational Databases"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Lesson Content (Markdown support)</label>
                  <textarea
                    placeholder="Write your text lesson notes here..."
                    rows={4}
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Video Link (Optional URL)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    value={lessonVideo}
                    onChange={(e) => setLessonVideo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Document Link (Optional URL)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://drive.google.com/..."
                    value={lessonDoc}
                    onChange={(e) => setLessonDoc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLessonModal(false)}
                    className="flex-1 py-2 rounded-lg border border-white/5 text-xs font-semibold hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold"
                  >
                    {submitting ? 'Adding...' : 'Add Lesson'}
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
