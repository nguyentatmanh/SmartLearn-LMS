'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import AppHeader from '@/components/Header';
import { 
  ArrowLeft, Loader2, BookOpen, CheckCircle, Video, FileText, 
  ExternalLink, ChevronRight, CheckCircle2, Download 
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

export const dynamic = 'force-dynamic';

export default function LessonViewerPage() {
  const { id: courseId, lessonId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = usePreference();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
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

      // Fetch lesson materials
      try {
        const matRes = await api.get(`/lessons/${lessonId}/materials`);
        setMaterials(matRes.data);
      } catch (err) {
        console.error('Failed to load lesson materials:', err);
      }

      // Check if this lesson is completed
      if (user && user.role === 'student') {
        try {
          const progressRes = await api.get(`/progress/${lessonId}`);
          setIsCompleted(progressRes.data.is_completed);
        } catch (err) {
          console.error('Failed to load progress state:', err);
        }
      }
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
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const ytVideoId = getYouTubeId(lesson.video_url);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      
      {/* Top Navbar Header */}
      <AppHeader />

      {/* Main Container */}
      <div className="flex-grow flex flex-col lg:flex-row relative">
        
        {/* Left Side: Lesson Content */}
        <main className="flex-grow p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 fade-in">
          
          {/* Back action */}
          <div>
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToSyllabus')}
            </button>
          </div>

          {/* Title and Progress Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border">
            <div className="space-y-1 min-w-0 flex-1 pr-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{lesson.title}</h1>
            </div>

            {user?.role === 'student' && (
              <button
                onClick={handleToggleComplete}
                disabled={submittingProgress}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  isCompleted 
                    ? 'bg-success/15 border-success/20 text-success' 
                    : 'bg-primary hover:bg-primary/95 border-transparent text-primary-foreground shadow-md shadow-primary/10'
                } hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/20`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {t('completed')}
                  </>
                ) : (
                  t('markCompleted')
                )}
              </button>
            )}
          </div>

          {/* Embedded Video (YouTube) */}
          {ytVideoId && (
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-border bg-black">
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
            <div className="glass p-4 rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{t('lectureMaterial')}</p>
                  <p className="text-xs text-muted-foreground truncate" title={lesson.document_url}>{lesson.document_url}</p>
                </div>
              </div>
              <a
                href={lesson.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-3.5 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {t('openDoc')} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>
          )}

          {/* Text Content */}
          {lesson.content ? (
            <div className="text-foreground/90 leading-relaxed text-sm sm:text-base whitespace-pre-line border border-border rounded-2xl p-6 bg-muted/20 break-words">
              {lesson.content}
            </div>
          ) : (
            !ytVideoId && !lesson.document_url && (
              <p className="text-muted-foreground text-xs italic">{t('noTextContent')}</p>
            )
          )}

          {/* Lesson Materials (Phase A upload integration) */}
          {materials.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {t('materialsTitle')} ({materials.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {materials.map((m) => {
                  const isLink = m.material_type === 'external_link';
                  const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${m.download_url}`;
                  
                  return (
                    <div key={m.id} className="glass p-3 rounded-xl border border-border flex items-center justify-between gap-3 hover:border-primary/45 transition-colors">
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

        </main>

        {/* Right Side: Course Lesson Outline Navigation Sidebar */}
        <aside className="w-full lg:w-80 glass lg:border-l border-border p-6 flex flex-col gap-6 shrink-0 lg:max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-extrabold text-sm text-foreground">{t('courseNavigation')}</h3>
          </div>

          <div className="space-y-6">
            {course.chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pr-2 break-words">
                  {chapter.title}
                </h4>
                
                <div className="space-y-1">
                  {chapter.lessons.map((les) => (
                    <button
                      key={les.id}
                      onClick={() => router.push(`/courses/${courseId}/lessons/${les.id}`)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                        les.id === lesson.id
                          ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                          : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-transparent'
                      }`}
                    >
                      {les.video_url ? (
                        <Video className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate flex-1">{les.title}</span>
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
