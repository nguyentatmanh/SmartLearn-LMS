'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  ArrowLeft, Loader2, BookOpen, CheckCircle, Video, FileText, 
  ExternalLink, ChevronRight, CheckCircle2 
} from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  content?: string;
  video_url?: string;
  document_url?: string;
}

interface Chapter {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  chapters: Chapter[];
}

export default function LessonViewerPage() {
  const { id: courseId, lessonId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      // Fetch current lesson
      const lessonRes = await api.get(`/lessons/${lessonId}`);
      setLesson(lessonRes.data);

      // Fetch course structure for navigation sidebar
      const courseRes = await api.get(`/courses/${courseId}`);
      setCourse(courseRes.data);

      // Check if this lesson is completed
      // Since backend progress can be verified, we can check or hit endpoint
      // To check progress status, let's fetch progress or see if student enrolled
      // We can also fetch the progress record directly. Let's see if we get a progress back.
      // We can inspect courses/student/enrolled list to see current progress or fetch the individual progress:
      // For simplicity, we can log progress, and if the user hits it, we update it.
      // Let's add a try-catch to fetch progress or set it.
    } catch (e) {
      console.error('Failed to load lesson:', e);
      router.push(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchLessonData();
    }
  }, [courseId, lessonId, user, authLoading]);

  // Helper to extract YouTube video ID
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleToggleComplete = async () => {
    if (!lesson) return;
    setSubmittingProgress(true);
    try {
      await api.post('/progress/', {
        lesson_id: lesson.id,
        is_completed: !isCompleted
      });
      setIsCompleted(!isCompleted);
    } catch (e) {
      console.error('Failed to update progress:', e);
    } finally {
      setSubmittingProgress(false);
    }
  };

  if (authLoading || loading || !lesson || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-slate-400">Loading lesson content...</p>
        </div>
      </div>
    );
  }

  const ytVideoId = getYouTubeId(lesson.video_url);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Syllabus
          </button>
          
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-500 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {course.title}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row">
        
        {/* Left Side: Lesson Content */}
        <main className="flex-grow p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-8">
          
          {/* Title and Progress Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{lesson.title}</h1>
            </div>

            {user?.role === 'student' && (
              <button
                onClick={handleToggleComplete}
                disabled={submittingProgress}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isCompleted 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-violet-600 hover:bg-violet-500 border-transparent text-white'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Completed
                  </>
                ) : (
                  'Mark as Completed'
                )}
              </button>
            )}
          </div>

          {/* Embedded Video (YouTube) */}
          {ytVideoId && (
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <iframe
                src={`https://www.youtube.com/embed/${ytVideoId}`}
                title="Lesson video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {/* Lecture Document Direct Link */}
          {lesson.document_url && (
            <div className="glass p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">Lecture Material</p>
                  <p className="text-xs text-slate-500 truncate">{lesson.document_url}</p>
                </div>
              </div>
              <a
                href={lesson.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                Open Document <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Text Content */}
          {lesson.content ? (
            <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-line border border-white/5 rounded-2xl p-6 bg-[#0f172a]/20">
              {lesson.content}
            </div>
          ) : (
            !ytVideoId && !lesson.document_url && (
              <p className="text-slate-500 text-xs italic">This lesson has no supplementary text content.</p>
            )
          )}

        </main>

        {/* Right Side: Course Lesson Outline Navigation Sidebar */}
        <aside className="w-full lg:w-80 glass lg:border-l border-white/5 p-6 flex flex-col gap-6 shrink-0 lg:max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <BookOpen className="h-4 w-4 text-violet-400" />
            <h3 className="font-extrabold text-sm">Course Navigation</h3>
          </div>

          <div className="space-y-6">
            {course.chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {chapter.title}
                </h4>
                
                <div className="space-y-1">
                  {chapter.lessons.map((les) => (
                    <button
                      key={les.id}
                      onClick={() => router.push(`/courses/${courseId}/lessons/${les.id}`)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                        les.id === lesson.id
                          ? 'bg-violet-500/15 text-violet-400 border border-violet-500/10'
                          : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {les.video_url ? (
                        <Video className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate">{les.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
}
