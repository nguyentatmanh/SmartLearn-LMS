'use client';

import React, { useState, useEffect } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import {
  CheckCircle2, AlertTriangle, BookText, FileText, Users,
  Image as ImageIcon, AlignLeft, Loader2,
} from 'lucide-react';

interface CourseOverviewProps {
  course?: any;
  loading?: boolean;
  courseId?: string;
}

interface ReadinessItem {
  key: string;
  label: string;
  done: boolean;
  icon: React.ReactNode;
}

export default function CourseOverviewPage({ course, loading, courseId }: CourseOverviewProps) {
  const { language } = usePreference();
  const [chapterCount, setChapterCount] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);
  const [materialCount, setMaterialCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!courseId || loading) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [courseDetail, materials, students] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/materials/courses/${courseId}/materials`).catch(() => ({ data: [] })),
          api.get(`/courses/${courseId}/students`).catch(() => ({ data: [] })),
        ]);
        const chapters = courseDetail.data.chapters || [];
        setChapterCount(chapters.length);
        setLessonCount(chapters.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0));
        setMaterialCount(Array.isArray(materials.data) ? materials.data.length : 0);
        setStudentCount(Array.isArray(students.data) ? students.data.length : 0);
      } catch {
        // Stats are best-effort
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [courseId, loading]);

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const readiness: ReadinessItem[] = [
    { key: 'title', label: language === 'en' ? 'Course title' : 'Tên khóa học', done: !!course.title?.trim(), icon: <AlignLeft className="h-4 w-4" /> },
    { key: 'desc', label: language === 'en' ? 'Description' : 'Mô tả', done: !!(course.description?.trim() || course.short_description?.trim()), icon: <AlignLeft className="h-4 w-4" /> },
    { key: 'cover', label: language === 'en' ? 'Cover image' : 'Ảnh bìa', done: !!course.cover_display_url, icon: <ImageIcon className="h-4 w-4" /> },
    { key: 'chapters', label: language === 'en' ? 'At least 1 chapter' : 'Ít nhất 1 chương', done: chapterCount > 0, icon: <BookText className="h-4 w-4" /> },
    { key: 'lessons', label: language === 'en' ? 'At least 1 lesson' : 'Ít nhất 1 bài học', done: lessonCount > 0, icon: <BookText className="h-4 w-4" /> },
  ];

  const completedCount = readiness.filter(r => r.done).length;
  const readinessPercent = Math.round((completedCount / readiness.length) * 100);

  const quickStats = [
    { label: language === 'en' ? 'Chapters' : 'Chương', value: chapterCount, icon: <BookText className="h-5 w-5 text-primary" /> },
    { label: language === 'en' ? 'Lessons' : 'Bài học', value: lessonCount, icon: <BookText className="h-5 w-5 text-success" /> },
    { label: language === 'en' ? 'Materials' : 'Tài liệu', value: materialCount, icon: <FileText className="h-5 w-5 text-amber-500" /> },
    { label: language === 'en' ? 'Students' : 'Học viên', value: studentCount, icon: <Users className="h-5 w-5 text-indigo-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickStats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-foreground">{statsLoading ? '—' : s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Readiness Checklist */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">
            {language === 'en' ? 'Course Readiness' : 'Trạng thái sẵn sàng'}
          </h3>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            readinessPercent === 100
              ? 'bg-success/15 text-success'
              : 'bg-warning/15 text-warning'
          }`}>
            {readinessPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${readinessPercent === 100 ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${readinessPercent}%` }}
          />
        </div>

        <div className="space-y-2.5">
          {readiness.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                item.done ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {item.done ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              </div>
              <span className={`text-sm ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {readinessPercent < 100 && (
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            {language === 'en'
              ? 'Complete all items above before publishing your course. This checklist is informational — it does not block publication.'
              : 'Hoàn thành tất cả các mục trên trước khi xuất bản khóa học. Danh sách này chỉ mang tính thông tin — không chặn việc xuất bản.'}
          </p>
        )}
      </div>

      {/* Course Info Summary */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-bold text-sm">
          {language === 'en' ? 'Course Information' : 'Thông tin khóa học'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: language === 'en' ? 'Category' : 'Danh mục', value: course.category },
            { label: language === 'en' ? 'Level' : 'Trình độ', value: course.level },
            { label: language === 'en' ? 'Specialization' : 'Chuyên ngành', value: course.specialization },
            { label: language === 'en' ? 'Duration' : 'Thời lượng', value: course.estimated_duration },
          ].map((field) => (
            <div key={field.label}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{field.label}</p>
              <p className="text-sm text-foreground mt-0.5">
                {field.value || <span className="text-muted-foreground italic">{language === 'en' ? 'Not set' : 'Chưa cập nhật'}</span>}
              </p>
            </div>
          ))}
        </div>
        {course.description && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {language === 'en' ? 'Description' : 'Mô tả'}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{course.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
