'use client';

import React from 'react';
import { Plus, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';
import { User } from '@/context/AuthContext';

interface DashboardHeaderProps {
  user: User | null;
  onCreateCourse: () => void;
}

export default function DashboardHeader({ user, onCreateCourse }: DashboardHeaderProps) {
  const { t, language } = usePreference();

  const displayName = user?.full_name?.trim() || user?.email?.split('@')[0] || t('greetingFallbackTeacher');
  const approvalStatus = user?.teacher_profile?.approval_status || 'pending';

  // Format today's date in local language format
  const todayDate = new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left Column: Title, Short Greeting, Approval Badge, Localized Date */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
              {t('teachingOverview')}
            </h1>

            {/* Approval Status Badge */}
            {approvalStatus === 'approved' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('adminLabelApproved')}
              </span>
            )}
            {approvalStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" />
                {t('adminLabelPending')}
              </span>
            )}
            {approvalStatus === 'rejected' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <XCircle className="h-3.5 w-3.5" />
                {t('adminLabelRejected')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
            <span className="font-semibold text-foreground/90">
              {t('welcomeTeacherSimple', { name: displayName })}
            </span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1.5 capitalize">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>{todayDate}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Single Primary CTA */}
        {approvalStatus === 'approved' && (
          <button
            onClick={onCreateCourse}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('createCourse')}</span>
          </button>
        )}

      </div>
    </div>
  );
}
