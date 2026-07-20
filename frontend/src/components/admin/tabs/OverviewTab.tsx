'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, GraduationCap, BookOpen, CheckCircle2, AlertTriangle, 
  RefreshCw, Download, UserPlus, ShieldCheck, MailWarning, 
  ChevronRight, ArrowUpRight, ShieldAlert, Settings
} from 'lucide-react';
import api from '@/lib/api';
import { OverviewData, AdminTab } from '@/types/admin';
import { usePreference } from '@/context/PreferenceContext';

interface OverviewTabProps {
  onSelectTab: (tab: AdminTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onSelectTab }) => {
  const { t, formatDate, formatNumber, formatError } = usePreference();
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/overview');
      setData(res.data);
    } catch (err: unknown) {
      console.error('Failed to load admin overview:', err);
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-muted/60 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border/40" />
          ))}
        </div>
        <div className="h-16 bg-card rounded-xl border border-border/40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-card rounded-xl border border-border/40 lg:col-span-2" />
          <div className="h-64 bg-card rounded-xl border border-border/40" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-card border border-rose-500/20 rounded-2xl text-center space-y-4 m-6 max-w-lg mx-auto shadow-sm">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="font-bold text-base text-foreground">{t('common.error')}</h3>
          <p className="text-xs text-muted-foreground">{error || t('errors.GENERIC_ERROR')}</p>
        </div>
        <button
          onClick={fetchOverview}
          className="px-4 py-2.5 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> {t('common.retry')}
        </button>
      </div>
    );
  }

  const { metrics, attention_items, recent_audit_logs } = data;
  const totalUsers = metrics.total_users || 1;
  const studentPercent = Math.round((metrics.students / totalUsers) * 100);
  const teacherPercent = Math.round((metrics.teachers / totalUsers) * 100);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>{t('admin.workspaceTitle')}</span>
            <span>/</span>
            <span className="text-foreground font-medium">{t('admin.overview.breadcrumb')}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('admin.overview.title')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t('admin.overview.description')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab('users')}
            className="px-4 py-2.5 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('admin.overview.btnManageUsers')}</span>
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className="px-4 py-2.5 min-h-[44px] bg-muted hover:bg-muted/80 text-foreground border border-border/50 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>{t('admin.overview.btnExportSummary')}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div
          onClick={() => onSelectTab('users')}
          className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.overview.kpiTotalAccounts')}</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {formatNumber(metrics.total_users)}
            </span>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatNumber(metrics.students)} học viên • {formatNumber(metrics.teachers)} giảng viên</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>

        {/* Pending Teacher Applications */}
        <div
          onClick={() => onSelectTab('teacher-approvals')}
          className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.overview.kpiPendingTeachers')}</span>
            <div className="relative">
              <GraduationCap className="w-5 h-5 text-amber-500" />
              {metrics.pending_teacher_requests > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {formatNumber(metrics.pending_teacher_requests)}
            </span>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('admin.overview.kpiPendingTeachersSub')}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>

        {/* Course Catalog */}
        <div
          onClick={() => onSelectTab('courses')}
          className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.overview.kpiPublishedCatalog')}</span>
            <BookOpen className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {formatNumber(metrics.published_courses)}
            </span>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatNumber(metrics.pending_course_reviews)} chờ duyệt • {formatNumber(metrics.draft_courses)} nháp</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div
          onClick={() => onSelectTab('users')}
          className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs hover:border-blue-500/40 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.overview.kpiActiveUsers')}</span>
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {formatNumber(metrics.active_users)}
            </span>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('admin.overview.kpiActiveUsersSub', { count: formatNumber(metrics.unverified_users) })}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Priority Attention Center */}
      {attention_items.length > 0 ? (
        <div className="bg-card border border-amber-500/30 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">{t('admin.overview.attentionTitle')}</h2>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-full">
              {attention_items.length} {t('admin.overview.attentionItemsCount' as any) || 'mục cần xử lý'}
            </span>
          </div>

          <div className="divide-y divide-border/40">
            {attention_items.map((item) => (
              <div
                key={item.id}
                className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  {item.action_tab === 'teacher-approvals' ? (
                    <GraduationCap className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : item.action_tab === 'courses' ? (
                    <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <MailWarning className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-foreground block">{item.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.action_tab === 'teacher-approvals'
                        ? t('admin.overview.pendingTeacherDesc', { count: item.count })
                        : item.action_tab === 'courses'
                        ? t('admin.overview.pendingCourseDesc', { count: item.count })
                        : t('admin.overview.unverifiedUsersDesc', { count: item.count })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTab(item.action_tab)}
                  className="px-3 py-1.5 min-h-[44px] text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <span>Xem ngay</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Compact Calm Status Strip when Healthy */
        <div className="bg-card border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold text-foreground">{t('admin.overview.allOperational')}</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground hidden sm:inline">{t('admin.overview.noCriticalIssues')}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Cập nhật vừa xong</span>
        </div>
      )}

      {/* 4. Operational Content (Main Column & Secondary Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Operational Audit Stream */}
        <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{t('admin.overview.auditTitle')}</h2>
            </div>
            <button
              onClick={() => onSelectTab('audit-logs')}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>{t('admin.overview.btnViewAuditLogs')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-border/40 text-xs">
            {recent_audit_logs.length > 0 ? (
              recent_audit_logs.map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        log.result === 'success'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {log.event_type}
                    </span>
                    <span className="text-foreground font-medium">
                      {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                    <span>Thực hiện: {log.actor_id || 'System'}</span>
                    <span>{formatDate(log.created_at, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <ShieldAlert className="w-6 h-6 mx-auto text-muted-foreground/40" />
                <p className="font-medium text-foreground">{t('admin.overview.noAuditEvents')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Column: Account Breakdown & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Account Breakdown Summary */}
          <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-semibold text-foreground pb-2 border-b border-border/40">
              {t('admin.overview.accountBreakdown')}
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1 text-muted-foreground">
                  <span>Học viên ({studentPercent}%)</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatNumber(metrics.students)}</span>
                </div>
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${studentPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-muted-foreground">
                  <span>Giảng viên ({teacherPercent}%)</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatNumber(metrics.teachers)}</span>
                </div>
                <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${teacherPercent}%` }} />
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('admin.users.badgeActive')}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatNumber(metrics.active_users)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('admin.users.badgeUnverified')}</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{formatNumber(metrics.unverified_users)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Quick Shortcuts */}
          <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-semibold text-foreground pb-2 border-b border-border/40">
              Lối tắt quản lý
            </h3>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => onSelectTab('teacher-approvals')}
                className="w-full p-2.5 rounded-lg hover:bg-muted/60 text-foreground font-medium flex items-center justify-between transition-colors min-h-[44px] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  <span>Duyệt yêu cầu giảng viên</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => onSelectTab('courses')}
                className="w-full p-2.5 rounded-lg hover:bg-muted/60 text-foreground font-medium flex items-center justify-between transition-colors min-h-[44px] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>Kiểm duyệt khóa học</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => onSelectTab('settings')}
                className="w-full p-2.5 rounded-lg hover:bg-muted/60 text-foreground font-medium flex items-center justify-between transition-colors min-h-[44px] cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  <span>Cấu hình hệ thống</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
