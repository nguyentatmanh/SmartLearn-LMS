'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Users, GraduationCap, BookOpen, CheckCircle2, AlertTriangle,
  RefreshCw, Download, UserPlus
} from 'lucide-react';
import api from '@/lib/api';
import {
  OverviewData, AdminTab, StatCardData,
  PriorityApprovalItem, RecentActivityEntry
} from '@/types/admin';
import { usePreference } from '@/context/PreferenceContext';

// Modular overview sub-components
import { StatCard } from '@/components/admin/overview/StatCard';
import { ActivityChart } from '@/components/admin/overview/ActivityChart';
import { QuickManagementWidget } from '@/components/admin/overview/QuickManagementWidget';
import { PriorityApprovalCard } from '@/components/admin/overview/PriorityApprovalCard';
import { SystemStatusCard } from '@/components/admin/overview/SystemStatusCard';
import { UserDistributionChart } from '@/components/admin/overview/UserDistributionChart';
import { RecentActivityLogs } from '@/components/admin/overview/RecentActivityLogs';

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

  // ─── Loading Skeleton ─────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-muted/60 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-card rounded-xl border border-border/40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-card rounded-xl border border-border/40 lg:col-span-2" />
          <div className="h-80 bg-card rounded-xl border border-border/40 space-y-4">
            <div className="h-36 bg-muted/20 rounded-xl m-3" />
            <div className="h-28 bg-muted/20 rounded-xl m-3" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-40 bg-card rounded-xl border border-border/40" />
          <div className="h-40 bg-card rounded-xl border border-border/40" />
          <div className="h-40 bg-card rounded-xl border border-border/40" />
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="p-8 bg-card border border-rose-500/20 rounded-2xl text-center space-y-4 m-6 max-w-lg mx-auto shadow-sm">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="font-bold text-base text-foreground">{t('common.error') || 'Error'}</h3>
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

  // ─── Derived Data ─────────────────────────────────────────
  const { metrics, attention_items, recent_audit_logs } = data;

  return (
    <OverviewContent
      metrics={metrics}
      attentionItems={attention_items}
      recentAuditLogs={recent_audit_logs}
      onSelectTab={onSelectTab}
      t={t}
      formatDate={formatDate}
      formatNumber={formatNumber}
    />
  );
};

// ═══════════════════════════════════════════════════════════
// Pure presentation component — extracted for clean separation
// ═══════════════════════════════════════════════════════════

interface OverviewContentProps {
  metrics: OverviewData['metrics'];
  attentionItems: OverviewData['attention_items'];
  recentAuditLogs: OverviewData['recent_audit_logs'];
  onSelectTab: (tab: AdminTab) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
}

const OverviewContent: React.FC<OverviewContentProps> = ({
  metrics,
  attentionItems,
  recentAuditLogs,
  onSelectTab,
  t,
  formatDate,
  formatNumber,
}) => {
  const totalUsers = metrics.total_users || 1;
  const adminCount = metrics.admins || Math.max(0, totalUsers - metrics.students - metrics.teachers);

  // ─── Memoized Stat Card Configurations ──────────────────
  const statCards: StatCardData[] = useMemo(() => [
    {
      id: 'total-accounts',
      label: t('admin.overview.kpiTotalAccounts'),
      value: metrics.total_users,
      subtitle: `${formatNumber(metrics.students)} ${t('admin.users.filterRoleStudent')} • ${formatNumber(metrics.teachers)} ${t('admin.users.filterRoleTeacher')}`,
      trend: { value: 5, direction: 'up' as const, label: t('admin.overview.trendUp') },
      icon: Users,
      iconColor: 'text-indigo-500',
      hoverBorderColor: 'hover:border-indigo-500/40',
      sparklineData: [3, 5, 4, 7, 6, 8, 7],
      onClick: () => onSelectTab('users'),
    },
    {
      id: 'pending-teachers',
      label: t('admin.overview.kpiPendingTeachers'),
      value: metrics.pending_teacher_requests,
      subtitle: t('admin.overview.kpiPendingTeachersSub'),
      icon: GraduationCap,
      iconColor: 'text-amber-500',
      hoverBorderColor: 'hover:border-amber-500/40',
      sparklineData: [0, 1, 0, 2, 1, 0, metrics.pending_teacher_requests],
      onClick: () => onSelectTab('teacher-approvals'),
    },
    {
      id: 'published-courses',
      label: t('admin.overview.kpiPublishedCatalog'),
      value: metrics.published_courses,
      subtitle: `${formatNumber(metrics.pending_course_reviews)} ${t('admin.courses.filterPending')} • ${formatNumber(metrics.draft_courses)} ${t('admin.courses.filterDraft')}`,
      icon: BookOpen,
      iconColor: 'text-emerald-500',
      hoverBorderColor: 'hover:border-emerald-500/40',
      sparklineData: [1, 1, 2, 1, 3, 2, metrics.published_courses],
      onClick: () => onSelectTab('courses'),
    },
    {
      id: 'active-accounts',
      label: t('admin.overview.kpiActiveUsers'),
      value: metrics.active_users,
      subtitle: t('admin.overview.kpiActiveUsersSub', { count: formatNumber(metrics.active_users) }),
      icon: CheckCircle2,
      iconColor: 'text-sky-500',
      hoverBorderColor: 'hover:border-sky-500/40',
      sparklineData: [5, 6, 6, 7, 7, 7, metrics.active_users],
      onClick: () => onSelectTab('users'),
    },
  ], [metrics, t, formatNumber, onSelectTab]);

  // ─── Priority Approval Items (derived from attention_items + mock enrichment) ──
  const priorityApprovals: PriorityApprovalItem[] = useMemo(() => {
    const items: PriorityApprovalItem[] = [];

    // Add pending course mock items if there are pending course reviews
    if (metrics.pending_course_reviews > 0) {
      items.push({
        id: 1,
        type: 'course',
        title: 'Lập trình Python',
        submittedBy: 'Nguyễn Tất Mạnh',
        submittedAt: new Date().toISOString(),
      });
    }

    // Add pending teacher mock items
    if (metrics.pending_teacher_requests > 0) {
      items.push({
        id: 2,
        type: 'teacher',
        title: 'Đăng ký giảng viên',
        submittedBy: 'Trần Văn B',
        submittedAt: new Date().toISOString(),
      });
    }

    return items;
  }, [metrics]);

  // ─── Recent Activity Entries (derived from audit logs) ──
  const recentActivities: RecentActivityEntry[] = useMemo(() => {
    if (recentAuditLogs.length > 0) {
      return recentAuditLogs.slice(0, 5).map((log) => {
        const typeMap: Record<string, RecentActivityEntry['type']> = {
          'user.update': 'update',
          'user.create': 'register',
          'user.register': 'register',
          'settings.update': 'config',
          'course.review': 'review',
          'course.approve': 'review',
          'teacher.approve': 'review',
          'teacher.reject': 'review',
        };

        return {
          id: log.id,
          userName: log.actor_id ? `User #${log.actor_id}` : 'System',
          action: `${log.event_type} — ${log.target_type}${log.target_id ? ` #${log.target_id}` : ''}`,
          timestamp: formatDate(log.created_at, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          type: typeMap[log.event_type] || 'update',
        };
      });
    }

    // Fallback mock data when no audit logs exist
    return [
      {
        id: 1,
        userName: 'Nguyễn Văn A',
        action: t('admin.overview.newEnrollments') + ' — Khóa học Python',
        timestamp: t('admin.overview.hoursAgo', { count: '2' }),
        type: 'update' as const,
      },
      {
        id: 2,
        userName: 'Lê Thị B',
        action: t('admin.overview.userActivity') + ' — Hồ sơ #123',
        timestamp: t('admin.overview.hoursAgo', { count: '2' }),
        type: 'register' as const,
      },
      {
        id: 3,
        userName: 'System Admin',
        action: 'Thay đổi cấu hình bảo mật',
        timestamp: t('admin.overview.hoursAgo', { count: '2' }),
        type: 'config' as const,
      },
    ];
  }, [recentAuditLogs, formatDate, t]);

  // System health check
  const isSystemHealthy = attentionItems.length === 0;

  // ─── Approval Handlers ────────────────────────────────────
  const handleAcceptApproval = (id: number, type: 'course' | 'teacher') => {
    if (type === 'course') {
      onSelectTab('courses');
    } else {
      onSelectTab('teacher-approvals');
    }
  };

  const handleRejectApproval = (id: number, type: 'course' | 'teacher') => {
    if (type === 'course') {
      onSelectTab('courses');
    } else {
      onSelectTab('teacher-approvals');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ═══ 1. Page Header ═══════════════════════════════════ */}
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

      {/* ═══ 2. KPI Stat Cards (4-Column Grid) ════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.id} data={card} />
        ))}
      </div>

      {/* ═══ 3. Middle Section (Chart + Right Sidebar) ════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activity Analytics Chart (2/3 width) */}
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>

        {/* Right: Quick Management + Priority Approvals + Recent Logs (1/3 width) */}
        <div className="space-y-6">
          <QuickManagementWidget onSelectTab={onSelectTab} />

          {priorityApprovals.length > 0 && (
            <PriorityApprovalCard
              items={priorityApprovals}
              onAccept={handleAcceptApproval}
              onReject={handleRejectApproval}
            />
          )}

          <RecentActivityLogs entries={recentActivities} />
        </div>
      </div>

      {/* ═══ 4. Bottom Section (3-Column: Status + Distribution + Legacy) ═ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status */}
        <SystemStatusCard isHealthy={isSystemHealthy} />

        {/* User Distribution Donut Chart */}
        <UserDistributionChart
          students={metrics.students}
          teachers={metrics.teachers}
          admins={adminCount}
        />

        {/* Account Breakdown (retained from original as a compact stats panel) */}
        <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t('admin.overview.accountBreakdown')}
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('admin.users.filterActive')}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatNumber(metrics.active_users)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('admin.users.badgeUnverified')}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatNumber(metrics.unverified_users)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('admin.overview.roleStudents')}</span>
              <span className="font-bold text-foreground tabular-nums">
                {formatNumber(metrics.students)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('admin.overview.roleTeachers')}</span>
              <span className="font-bold text-foreground tabular-nums">
                {formatNumber(metrics.teachers)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('admin.overview.roleAdmins')}</span>
              <span className="font-bold text-foreground tabular-nums">
                {formatNumber(adminCount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
