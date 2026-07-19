'use client';

import React, { useState, useEffect } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import {
  BookText, ChevronDown, ChevronRight, Loader2,
  FileText, Video, Code, Eye, EyeOff, Star,
} from 'lucide-react';

interface CurriculumPageProps {
  course?: any;
  loading?: boolean;
  courseId?: string;
}

const lessonTypeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  code: <Code className="h-3.5 w-3.5" />,
};

export default function CurriculumPage({ course, loading, courseId }: CurriculumPageProps) {
  const { language } = usePreference();
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!courseId || loading) return;
    const fetchCurriculum = async () => {
      setChaptersLoading(true);
      try {
        const res = await api.get(`/courses/${courseId}`);
        setChapters(res.data.chapters || []);
        // Expand all by default
        const ids = new Set((res.data.chapters || []).map((ch: any) => ch.id));
        setExpandedChapters(ids);
      } catch {
        setChapters([]);
      } finally {
        setChaptersLoading(false);
      }
    };
    fetchCurriculum();
  }, [courseId, loading]);

  const toggleChapter = (id: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading || chaptersLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={<BookText className="h-7 w-7" />}
          title={language === 'en' ? 'No Chapters Yet' : 'Chưa có chương nào'}
          description={language === 'en'
            ? 'This course curriculum is empty. Use the existing course detail page to add chapters and lessons.'
            : 'Chương trình học của khóa học này đang trống. Sử dụng trang chi tiết khóa học hiện có để thêm chương và bài học.'}
        />
      </div>
    );
  }

  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {chapters.length} {language === 'en' ? 'chapters' : 'chương'} · {totalLessons} {language === 'en' ? 'lessons' : 'bài học'}
        </p>
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        {chapters.map((chapter, idx) => {
          const expanded = expandedChapters.has(chapter.id);
          const lessons = chapter.lessons || [];
          return (
            <div key={chapter.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Chapter header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
              >
                {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{chapter.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {lessons.length} {language === 'en' ? 'lessons' : 'bài học'}
                    {!chapter.is_visible && (
                      <span className="ml-2 text-warning">
                        ({language === 'en' ? 'Hidden' : 'Ẩn'})
                      </span>
                    )}
                  </p>
                </div>
              </button>

              {/* Lessons */}
              {expanded && (
                <div className="border-t border-border">
                  {lessons.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-muted-foreground italic">
                      {language === 'en' ? 'No lessons in this chapter.' : 'Chưa có bài học trong chương này.'}
                    </p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {lessons.map((lesson: any) => (
                        <div key={lesson.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                            {lessonTypeIcons[lesson.lesson_type] || <FileText className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground capitalize">{lesson.lesson_type}</span>
                              <span className="text-[10px] text-muted-foreground">· {lesson.estimated_duration_minutes}m</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {lesson.is_required && <Star className="h-3 w-3 text-amber-500" title={language === 'en' ? 'Required' : 'Bắt buộc'} />}
                            {lesson.is_visible ? (
                              <Eye className="h-3 w-3 text-success" title={language === 'en' ? 'Visible' : 'Hiển thị'} />
                            ) : (
                              <EyeOff className="h-3 w-3 text-muted-foreground" title={language === 'en' ? 'Hidden' : 'Ẩn'} />
                            )}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              lesson.status === 'published' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                            }`}>
                              {lesson.status === 'published' ? (language === 'en' ? 'Published' : 'Đã xuất bản') : (language === 'en' ? 'Draft' : 'Nháp')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
