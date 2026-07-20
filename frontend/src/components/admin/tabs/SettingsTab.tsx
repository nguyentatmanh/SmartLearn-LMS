'use client';

import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle2, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import api from '@/lib/api';
import { SystemSettings } from '@/types/admin';
import { usePreference } from '@/context/PreferenceContext';

export const SettingsTab: React.FC = () => {
  const { t, formatError } = usePreference();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [requireTeacherApproval, setRequireTeacherApproval] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [requireCourseReview, setRequireCourseReview] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data);
      setRequireTeacherApproval(res.data.require_teacher_approval);
      setRequireEmailVerification(res.data.require_email_verification);
      setRequireCourseReview(res.data.require_course_review);
    } catch (err: unknown) {
      console.error('Failed to load system settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.patch('/admin/settings', {
        require_teacher_approval: requireTeacherApproval,
        require_email_verification: requireEmailVerification,
        require_course_review: requireCourseReview
      });
      setSettings(res.data);
      setSuccessMsg(t('admin.settings.btnSave'));
    } catch (err: unknown) {
      setErrorMsg(formatError(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-40 bg-muted/40 rounded-2xl border border-border" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 fade-in max-w-3xl">
      <form onSubmit={handleSaveSettings} className="bg-card border border-border/50 rounded-xl p-6 space-y-6 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
          <Settings className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t('admin.settings.headerTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('admin.settings.headerDesc')}</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Toggle 1 */}
          <div className="flex items-start justify-between p-4 bg-muted/30 border border-border/40 rounded-xl">
            <div>
              <label className="text-xs font-semibold text-foreground block">{t('admin.settings.teacherApprovalLabel')}</label>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t('admin.settings.teacherApprovalDesc')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireTeacherApproval}
              onChange={(e) => setRequireTeacherApproval(e.target.checked)}
              className="w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary/40 cursor-pointer mt-0.5"
            />
          </div>

          {/* Toggle 2 */}
          <div className="flex items-start justify-between p-4 bg-muted/30 border border-border/40 rounded-xl">
            <div>
              <label className="text-xs font-semibold text-foreground block">{t('admin.settings.emailVerificationLabel')}</label>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t('admin.settings.emailVerificationDesc')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireEmailVerification}
              onChange={(e) => setRequireEmailVerification(e.target.checked)}
              className="w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary/40 cursor-pointer mt-0.5"
            />
          </div>

          {/* Toggle 3 */}
          <div className="flex items-start justify-between p-4 bg-muted/30 border border-border/40 rounded-xl">
            <div>
              <label className="text-xs font-semibold text-foreground block">{t('admin.settings.courseReviewLabel')}</label>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t('admin.settings.courseReviewDesc')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireCourseReview}
              onChange={(e) => setRequireCourseReview(e.target.checked)}
              className="w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary/40 cursor-pointer mt-0.5"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('admin.settings.btnSave')}
          </button>
        </div>
      </form>
    </div>
  );
};
