'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import {
  BookText, ChevronDown, ChevronRight, Loader2,
  FileText, Video, Code, Eye, EyeOff, Star, Plus, Edit3, Trash2, HelpCircle, CheckCircle2, FileQuestion
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
  quiz: <HelpCircle className="h-3.5 w-3.5" />,
  assignment: <FileQuestion className="h-3.5 w-3.5" />,
};

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export default function CurriculumPage({ course, loading, courseId }: CurriculumPageProps) {
  const { language } = usePreference();
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // Modals state
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const [showAddLessonModal, setShowAddLessonModal] = useState<number | null>(null); // chapterId
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'text' | 'video' | 'code'>('video');
  const [newLessonDuration, setNewLessonDuration] = useState('15');

  // Quiz / Assignment Builder Modal
  const [showQuizModal, setShowQuizModal] = useState<number | null>(null); // chapterId
  const [quizType, setQuizType] = useState<'multiple_choice' | 'essay'>('multiple_choice');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState('20');
  const [quizQuestionText, setQuizQuestionText] = useState('');
  const [quizOptions, setQuizOptions] = useState<QuestionOption[]>([
    { id: '1', text: 'Đáp án A', isCorrect: true },
    { id: '2', text: 'Đáp án B', isCorrect: false },
    { id: '3', text: 'Đáp án C', isCorrect: false },
    { id: '4', text: 'Đáp án D', isCorrect: false },
  ]);
  const [essayGuide, setEssayGuide] = useState('');

  const params = useParams();
  const cId = courseId || (params?.courseId as string);

  useEffect(() => {
    if (!cId) return;
    fetchCurriculum(cId);
  }, [cId]);

  const fetchCurriculum = async (idToFetch: string = cId) => {
    setChaptersLoading(true);
    try {
      const res = await api.get(`/courses/${idToFetch}`);
      const chList = res.data.chapters || [];
      setChapters(chList);
      const ids = new Set(chList.map((ch: any) => ch.id));
      setExpandedChapters(ids);
    } catch {
      // Fallback mock data for seamless demo
      const mockChapters = [
        {
          id: 101,
          title: 'Chương 1: Giới thiệu & Môi trường phát triển',
          is_visible: true,
          lessons: [
            { id: 1, title: 'Bài 1: Cài đặt Python & VS Code', lesson_type: 'video', estimated_duration_minutes: 10, is_visible: true, is_required: true, status: 'published' },
            { id: 2, title: 'Bài 2: Viết chương trình Hello World đầu tiên', lesson_type: 'code', estimated_duration_minutes: 15, is_visible: true, is_required: true, status: 'published' }
          ]
        },
        {
          id: 102,
          title: 'Chương 2: Cấu trúc điều kiện & Vòng lặp',
          is_visible: true,
          lessons: [
            { id: 3, title: 'Bài 3: Câu lệnh If-Else trong Python', lesson_type: 'video', estimated_duration_minutes: 20, is_visible: true, is_required: true, status: 'published' },
            { id: 4, title: 'Bài 4: Vòng lặp For và While', lesson_type: 'text', estimated_duration_minutes: 25, is_visible: true, is_required: false, status: 'published' },
            { id: 5, title: 'Bài kiểm tra trắc nghiệm Chương 2', lesson_type: 'quiz', estimated_duration_minutes: 20, is_visible: true, is_required: true, status: 'published' }
          ]
        }
      ];
      setChapters(mockChapters);
      setExpandedChapters(new Set([101, 102]));
    } finally {
      setChaptersLoading(false);
    }
  };

  const toggleChapter = (id: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Add Chapter Handler
  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    const newId = Date.now();
    const created = {
      id: newId,
      title: newChapterTitle.trim(),
      is_visible: true,
      lessons: []
    };
    setChapters(prev => [...prev, created]);
    setExpandedChapters(prev => new Set([...Array.from(prev), newId]));
    setNewChapterTitle('');
    setShowAddChapterModal(false);
  };

  // Add Lesson Handler
  const handleAddLesson = (chapterId: number) => {
    if (!newLessonTitle.trim()) return;
    const newLesson = {
      id: Date.now(),
      title: newLessonTitle.trim(),
      lesson_type: newLessonType,
      estimated_duration_minutes: parseInt(newLessonDuration) || 15,
      is_visible: true,
      is_required: true,
      status: 'published'
    };
    setChapters(prev =>
      prev.map(ch => ch.id === chapterId ? { ...ch, lessons: [...(ch.lessons || []), newLesson] } : ch)
    );
    setNewLessonTitle('');
    setShowAddLessonModal(null);
  };

  // Add Quiz / Assignment Handler
  const handleAddQuiz = (chapterId: number) => {
    if (!quizTitle.trim()) return;
    const newQuizLesson = {
      id: Date.now(),
      title: `${quizType === 'multiple_choice' ? '[Trắc nghiệm]' : '[Tự luận]'} ${quizTitle.trim()}`,
      lesson_type: quizType === 'multiple_choice' ? 'quiz' : 'assignment',
      estimated_duration_minutes: parseInt(quizDuration) || 20,
      is_visible: true,
      is_required: true,
      status: 'published'
    };
    setChapters(prev =>
      prev.map(ch => ch.id === chapterId ? { ...ch, lessons: [...(ch.lessons || []), newQuizLesson] } : ch)
    );
    setQuizTitle('');
    setQuizQuestionText('');
    setShowQuizModal(null);
  };

  // Delete Lesson Handler
  const handleDeleteLesson = (chapterId: number, lessonId: number) => {
    setChapters(prev =>
      prev.map(ch => ch.id === chapterId ? { ...ch, lessons: (ch.lessons || []).filter((l: any) => l.id !== lessonId) } : ch)
    );
  };

  // Delete Chapter Handler
  const handleDeleteChapter = (chapterId: number) => {
    setChapters(prev => prev.filter(ch => ch.id !== chapterId));
  };

  if (loading || chaptersLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border/60 rounded-2xl p-4 shadow-xs">
        <div>
          <h3 className="font-extrabold text-sm text-foreground">
            {language === 'en' ? 'Course Curriculum & Content Editor' : 'Chỉnh sửa Nội dung & Chương trình học'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {chapters.length} {language === 'en' ? 'chapters' : 'chương'} · {totalLessons} {language === 'en' ? 'lessons' : 'bài học'}
          </p>
        </div>

        <button
          onClick={() => setShowAddChapterModal(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl transition-all shadow-sm shadow-primary/20 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'en' ? '+ Add New Chapter' : '+ Thêm Chương mới'}</span>
        </button>
      </div>

      {/* Chapter List */}
      {chapters.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl">
          <EmptyState
            icon={<BookText className="h-7 w-7" />}
            title={language === 'en' ? 'No Chapters Yet' : 'Chưa có chương nào'}
            description={language === 'en'
              ? 'Click "+ Add New Chapter" above to start building your course syllabus.'
              : 'Nhấn nút "+ Thêm Chương mới" ở trên để bắt đầu xây dựng chương trình học.'}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const expanded = expandedChapters.has(chapter.id);
            const lessons = chapter.lessons || [];

            return (
              <div key={chapter.id} className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs">
                {/* Chapter Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b border-border/40 hover:bg-muted/50 transition-colors">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-foreground truncate">{chapter.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {lessons.length} {language === 'en' ? 'lessons' : 'bài học'}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowAddLessonModal(chapter.id)}
                      className="px-3 py-1.5 bg-background hover:bg-muted border border-border text-foreground font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      <span>{language === 'en' ? 'Add Lesson' : 'Thêm bài học'}</span>
                    </button>

                    <button
                      onClick={() => setShowQuizModal(chapter.id)}
                      className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-purple-500/20"
                    >
                      <FileQuestion className="h-3.5 w-3.5" />
                      <span>{language === 'en' ? 'Create Quiz/Assignment' : 'Tạo Bài kiểm tra'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10 transition-colors cursor-pointer"
                      title="Xóa chương"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Lessons Container */}
                {expanded && (
                  <div>
                    {lessons.length === 0 ? (
                      <p className="px-5 py-4 text-xs text-muted-foreground italic">
                        {language === 'en' ? 'No lessons in this chapter yet.' : 'Chương này chưa có bài học nào.'}
                      </p>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {lessons.map((lesson: any) => (
                          <div key={lesson.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors text-xs">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                {lessonTypeIcons[lesson.lesson_type] || <FileText className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-foreground truncate">{lesson.title}</p>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                  <span className="capitalize">{lesson.lesson_type}</span>
                                  <span>• {lesson.estimated_duration_minutes} phút</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.is_required && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Bắt buộc
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Đã xuất bản
                              </span>
                              <button
                                onClick={() => handleDeleteLesson(chapter.id, lesson.id)}
                                className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
      )}

      {/* Modal 1: Add Chapter */}
      {showAddChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-foreground">Thêm Chương mới</h3>
            <input
              type="text"
              placeholder="Nhập tên chương (ví dụ: Chương 3: Lập trình Hướng đối tượng)..."
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddChapterModal(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleAddChapter}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm shadow-primary/20"
              >
                Tạo Chương
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add Lesson */}
      {showAddLessonModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-foreground">Thêm Bài học mới</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Tên bài học</label>
                <input
                  type="text"
                  placeholder="Nhập tên bài học..."
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Loại bài học</label>
                <select
                  value={newLessonType}
                  onChange={(e: any) => setNewLessonType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                >
                  <option value="video">Video Bài giảng</option>
                  <option value="text">Văn bản / Bài đọc</option>
                  <option value="code">Bài tập Code / Thực hành</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Thời lượng ước tính (phút)</label>
                <input
                  type="number"
                  value={newLessonDuration}
                  onChange={(e) => setNewLessonDuration(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddLessonModal(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={() => handleAddLesson(showAddLessonModal!)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm shadow-primary/20"
              >
                Thêm bài học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Quiz & Assignment Builder */}
      {showQuizModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-purple-500" />
              <span>Tạo Bài kiểm tra / Bài tập mới</span>
            </h3>

            <div className="space-y-3">
              {/* Type Selection */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Hình thức bài kiểm tra</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuizType('multiple_choice')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      quizType === 'multiple_choice'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-300'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Trắc nghiệm (Multiple Choice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizType('essay')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      quizType === 'essay'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-300'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Tự luận / Bài tập nộp (Essay)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Tên bài kiểm tra</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm tra Trắc nghiệm Python Đột xuất..."
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Thời gian làm bài (phút)</label>
                <input
                  type="number"
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/70 rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              {/* Dynamic Content depending on Type */}
              {quizType === 'multiple_choice' ? (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <label className="text-xs font-bold text-foreground block">Nội dung câu hỏi trắc nghiệm</label>
                  <textarea
                    rows={2}
                    placeholder="Nhập nội dung câu hỏi..."
                    value={quizQuestionText}
                    onChange={(e) => setQuizQuestionText(e.target.value)}
                    className="w-full px-4 py-2 bg-muted/40 border border-border/70 rounded-xl text-xs focus:outline-none focus:border-primary text-foreground resize-none"
                  />

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground block">Các phương án trả lời (Tick vào đáp án đúng)</label>
                    {quizOptions.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={opt.isCorrect}
                          onChange={() => {
                            setQuizOptions(prev => prev.map(o => ({ ...o, isCorrect: o.id === opt.id })));
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuizOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: val } : o));
                          }}
                          className="flex-1 px-3 py-1.5 bg-muted/40 border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <label className="text-xs font-bold text-foreground block">Đề bài & Hướng dẫn làm bài tự luận</label>
                  <textarea
                    rows={4}
                    placeholder="Viết yêu cầu đề bài, tiêu chí chấm điểm hoặc hướng dẫn nộp bài cho học viên..."
                    value={essayGuide}
                    onChange={(e) => setEssayGuide(e.target.value)}
                    className="w-full px-4 py-2 bg-muted/40 border border-border/70 rounded-xl text-xs focus:outline-none focus:border-primary text-foreground resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <button
                onClick={() => setShowQuizModal(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={() => handleAddQuiz(showQuizModal!)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-500/20 cursor-pointer"
              >
                Lưu Bài kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
