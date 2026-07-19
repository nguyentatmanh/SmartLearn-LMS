'use client';

import React, { useState, useEffect } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import { Users, Loader2, Search, ArrowRight, X, CheckCircle2, Circle } from 'lucide-react';

interface StudentsPageProps {
  course?: any;
  loading?: boolean;
  courseId?: string;
}

interface StudentProgress {
  student_id: number;
  full_name: string;
  email: string;
  enrolled_at: string;
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
}

interface LessonProgressDetail {
  lesson_id: number;
  lesson_title: string;
  chapter_title: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface StudentDetailProgress {
  student_id: number;
  full_name: string;
  email: string;
  enrolled_at: string;
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
  lessons: LessonProgressDetail[];
}

export default function StudentsPage({ course, loading, courseId }: StudentsPageProps) {
  const { language } = usePreference();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailProgress | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!courseId || loading) return;
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const res = await api.get(`/courses/${courseId}/students`);
        setStudents(res.data || []);
      } catch (err) {
        console.error('Failed to load students roster:', err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [courseId, loading]);

  const handleSelectStudent = async (studentId: number) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}/students/${studentId}`);
      setSelectedStudent(res.data);
    } catch (err) {
      console.error('Failed to load student progress detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading || studentsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (students.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={language === 'en' ? 'No Enrolled Students' : 'Chưa có học viên nào'}
          description={language === 'en'
            ? 'No students have enrolled in this course yet.'
            : 'Chưa có học viên nào đăng ký khóa học này.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Search and count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {students.length} {language === 'en' ? 'students enrolled' : 'học viên đã tham gia'}
        </p>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search by name or email...' : 'Tìm kiếm theo tên hoặc email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold">
                <th className="p-4">{language === 'en' ? 'Full Name' : 'Họ và tên'}</th>
                <th className="p-4">{language === 'en' ? 'Email' : 'Email'}</th>
                <th className="p-4">{language === 'en' ? 'Enrollment Date' : 'Ngày đăng ký'}</th>
                <th className="p-4 text-center">{language === 'en' ? 'Progress' : 'Tiến độ'}</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                    {language === 'en' ? 'No matching students.' : 'Không tìm thấy học viên nào phù hợp.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-bold text-foreground">{s.full_name}</td>
                    <td className="p-4 text-muted-foreground">{s.email}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(s.enrolled_at).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden shrink-0">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${s.progress_percentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-foreground shrink-0 w-8 text-right">
                          {s.progress_percentage}%
                        </span>
                        <span className="text-[10px] text-muted-foreground/80 shrink-0">
                          ({s.completed_lessons}/{s.total_lessons})
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSelectStudent(s.student_id)}
                        className="p-2 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-lg transition-colors inline-flex items-center gap-1 font-bold text-[10px]"
                      >
                        {language === 'en' ? 'View Details' : 'Xem chi tiết'}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Detail Drawer/Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end p-0 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl text-foreground">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border p-4 shrink-0">
              <div>
                <h3 className="font-bold text-base">{selectedStudent.full_name}</h3>
                <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Summary Stats */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {language === 'en' ? 'Course Progress' : 'Tiến độ khóa học'}
                  </span>
                  <span className="font-bold text-sm text-primary">{selectedStudent.progress_percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${selectedStudent.progress_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>{language === 'en' ? 'Completed Lessons' : 'Bài học đã hoàn thành'}</span>
                  <span>
                    {selectedStudent.completed_lessons} / {selectedStudent.total_lessons}
                  </span>
                </div>
              </div>

              {/* Lesson Checklist */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  {language === 'en' ? 'Lesson Progress Details' : 'Chi tiết tiến độ bài học'}
                </h4>

                {selectedStudent.lessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {language === 'en' ? 'No lessons in this course.' : 'Khóa học này chưa có bài học nào.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudent.lessons.map((lesson) => (
                      <div
                        key={lesson.lesson_id}
                        className="p-3 border border-border/60 bg-muted/10 rounded-xl flex items-start gap-3"
                      >
                        <div className="shrink-0 mt-0.5">
                          {lesson.is_completed ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{lesson.lesson_title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{lesson.chapter_title}</p>
                        </div>
                        {lesson.is_completed && lesson.completed_at && (
                          <span className="text-[9px] text-muted-foreground/80 shrink-0">
                            {new Date(lesson.completed_at).toLocaleDateString(
                              language === 'en' ? 'en-US' : 'vi-VN'
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
