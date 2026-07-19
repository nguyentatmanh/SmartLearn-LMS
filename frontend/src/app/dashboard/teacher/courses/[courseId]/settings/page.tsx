'use client';

import React, { useState, useEffect } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Loader2, Save, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsPageProps {
  course?: any;
  loading?: boolean;
  courseId?: string;
}

const settingsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  short_description: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  specialization: z.string().optional(),
  estimated_duration: z.string().optional(),
  prerequisites: z.string().optional(),
  learning_outcomes: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type SettingsSchemaType = z.infer<typeof settingsSchema>;

export default function SettingsPage({ course, loading, courseId }: SettingsPageProps) {
  const { language, t } = usePreference();
  const router = useRouter();
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsSchemaType>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        short_description: course.short_description || '',
        description: course.description || '',
        category: course.category || '',
        level: course.level || 'beginner',
        specialization: course.specialization || '',
        estimated_duration: course.estimated_duration || '',
        prerequisites: course.prerequisites || '',
        learning_outcomes: course.learning_outcomes || '',
        status: course.status || 'draft',
      });
    }
  }, [course, reset]);

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit = async (data: SettingsSchemaType) => {
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await api.put(`/courses/${courseId}`, {
        title: data.title,
        short_description: data.short_description || null,
        description: data.description || null,
        category: data.category || null,
        level: data.level,
        specialization: data.specialization || null,
        estimated_duration: data.estimated_duration || null,
        prerequisites: data.prerequisites || null,
        learning_outcomes: data.learning_outcomes || null,
        status: data.status,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || (language === 'en' ? 'Failed to update course.' : 'Cập nhật khóa học thất bại.'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/courses/${courseId}`);
      router.push('/dashboard/teacher/courses');
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || (language === 'en' ? 'Failed to delete course.' : 'Xóa khóa học thất bại.'));
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Status Messages */}
        {saveSuccess && (
          <div className="p-4 bg-success/10 border border-success/25 text-success rounded-xl flex items-center gap-2 text-xs">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{language === 'en' ? 'Course settings saved successfully.' : 'Đã lưu cài đặt khóa học thành công.'}</span>
          </div>
        )}
        {saveError && (
          <div className="p-4 bg-danger/10 border border-danger/25 text-danger rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* General Settings */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm">{language === 'en' ? 'General Settings' : 'Cài đặt chung'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{t('courseTitleLabel')} *</label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              />
              {errors.title && <span className="text-xs text-danger">{errors.title.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Status' : 'Trạng thái'}</label>
              <select
                {...register('status')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              >
                <option value="draft">{t('statusDraft')}</option>
                <option value="published">{t('statusPublished')}</option>
                <option value="archived">{t('statusArchived')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{t('shortDescriptionLabel')}</label>
              <input
                type="text"
                {...register('short_description')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Category' : 'Danh mục'}</label>
              <input
                type="text"
                {...register('category')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Level' : 'Trình độ'}</label>
              <select
                {...register('level')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              >
                <option value="beginner">{t('beginnerLevel')}</option>
                <option value="intermediate">{t('intermediateLevel')}</option>
                <option value="advanced">{t('advancedLevel')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Specialization' : 'Chuyên ngành'}</label>
              <input
                type="text"
                {...register('specialization')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Estimated Duration' : 'Thời lượng dự kiến'}</label>
              <input
                type="text"
                {...register('estimated_duration')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">{t('descLabel')}</label>
            <textarea
              rows={4}
              {...register('description')}
              className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground resize-none"
            />
          </div>
        </div>

        {/* Additional Fields */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm">{language === 'en' ? 'Syllabus Details' : 'Chi tiết Đề cương'}</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Prerequisites' : 'Yêu cầu tiên quyết'}</label>
              <textarea
                rows={2}
                {...register('prerequisites')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Learning Outcomes' : 'Kết quả học tập'}</label>
              <textarea
                rows={3}
                {...register('learning_outcomes')}
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs focus:outline-none focus:border-primary transition-all text-foreground resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saveLoading}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-primary/10"
          >
            {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {language === 'en' ? 'Save Settings' : 'Lưu cài đặt'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-card border border-danger/25 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-danger">{language === 'en' ? 'Danger Zone' : 'Vùng nguy hiểm'}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {language === 'en'
            ? 'Once you delete a course, there is no going back. All materials, chapters, lessons, and student progress records will be permanently deleted.'
            : 'Một khi bạn xóa khóa học, hành động này không thể hoàn tác. Tất cả tài liệu, chương, bài học và lịch sử học tập của học viên sẽ bị xóa vĩnh viễn.'}
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2.5 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-danger/20"
        >
          <Trash2 className="h-4 w-4" />
          {language === 'en' ? 'Delete Course' : 'Xóa khóa học'}
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={language === 'en' ? 'Delete Course?' : 'Xóa khóa học?'}
        description={language === 'en'
          ? 'Are you absolutely sure? This will permanently delete the course and all associated data.'
          : 'Bạn có chắc chắn muốn xóa? Thao tác này sẽ xóa vĩnh viễn khóa học và tất cả dữ liệu liên quan.'}
        confirmLabel={deleteLoading ? (language === 'en' ? 'Deleting...' : 'Đang xóa...') : (language === 'en' ? 'Delete' : 'Xóa')}
        cancelLabel={t('cancel')}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
