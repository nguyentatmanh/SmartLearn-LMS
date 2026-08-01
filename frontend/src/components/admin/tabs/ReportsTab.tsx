'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3, Calendar, RefreshCw, FileSpreadsheet, RotateCcw,
  Users, BookOpen, GraduationCap, Activity, AlertCircle, TrendingUp
} from 'lucide-react';
import api from '@/lib/api';
import { usePreference } from '@/context/PreferenceContext';

type PresetKey = '7d' | '30d' | '90d' | 'custom';

export const ReportsTab: React.FC = () => {
  const { t, formatNumber, formatDate } = usePreference();

  const [preset, setPreset] = useState<PresetKey>('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [granularity, setGranularity] = useState('day');

  const [reportData, setReportData] = useState<{
    granularity: string;
    date_from: string;
    date_to: string;
    metrics: {
      new_users: number;
      new_courses: number;
      new_enrollments: number;
      active_accounts_in_window: number;
    };
    time_series: Array<{
      bucket: string;
      new_users: number;
      new_enrollments: number;
      new_courses: number;
    }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Apply quick date preset helper
  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    setDateError(null);
    if (key === 'custom') return;

    const end = new Date();
    const start = new Date();
    const daysMap: Record<'7d' | '30d' | '90d', number> = { '7d': 7, '30d': 30, '90d': 90 };
    start.setDate(end.getDate() - daysMap[key]);

    setDateFrom(start.toISOString().split('T')[0]);
    setDateTo(end.toISOString().split('T')[0]);
  };

  useEffect(() => {
    applyPreset('30d');
  }, []);

  const fetchReports = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateError(t('admin.reports.invalidRange' as any) || 'Ngày bắt đầu không thể sau ngày kết thúc');
      return;
    }
    setDateError(null);
    setIsLoading(true);

    try {
      const params: Record<string, string> = { granularity };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.get('/admin/reports', { params });
      setReportData(res.data);
    } catch (err: unknown) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchReports();
    }
  }, [dateFrom, dateTo, granularity]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilters = () => {
    applyPreset('30d');
    setGranularity('day');
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = { granularity };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await api.get('/admin/reports/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `smartlearn_report_${granularity}_${dateFrom || 'all'}_to_${dateTo || 'now'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: unknown) {
      console.error('CSV export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const maxBucketCount = Math.max(
    1,
    ...(reportData?.time_series?.map((d) => Math.max(d.users ?? d.new_users ?? 0, d.enrollments ?? d.new_enrollments ?? 0)) || [1])
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>{t('admin.workspaceTitle')}</span>
            <span>/</span>
            <span className="text-foreground font-medium">{t('admin.reports.headerTitle')}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('admin.reports.headerTitle')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t('admin.reports.headerDesc')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="px-4 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isExporting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          <span>{t('admin.reports.btnExportCSV')}</span>
        </button>
      </div>

      {/* 2. Date Filter & Presets Toolbar */}
      <form onSubmit={handleFilterSubmit} className="p-4 bg-card border border-border/50 rounded-xl space-y-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Preset Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">{t('admin.reports.presetLabel')}:</span>
            <button
              type="button"
              onClick={() => applyPreset('7d')}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                preset === '7d'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 hover:bg-muted text-foreground border-border/50'
              }`}
            >
              {t('admin.reports.preset7d')}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('30d')}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                preset === '30d'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 hover:bg-muted text-foreground border-border/50'
              }`}
            >
              {t('admin.reports.preset30d')}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('90d')}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                preset === '90d'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 hover:bg-muted text-foreground border-border/50'
              }`}
            >
              {t('admin.reports.preset90d')}
            </button>
            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                preset === 'custom'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 hover:bg-muted text-foreground border-border/50'
              }`}
            >
              {t('admin.reports.presetCustom')}
            </button>
          </div>

          {/* Granularity & Reset */}
          <div className="flex items-center gap-2">
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
            >
              <option value="day">{t('admin.reports.granularityDaily')}</option>
              <option value="week">{t('admin.reports.granularityWeekly')}</option>
              <option value="month">{t('admin.reports.granularityMonthly')}</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2.5 min-h-[44px] min-w-[44px] bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title={t('admin.reports.resetFilters')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Inputs row when custom or refining */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPreset('custom'); }}
              className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
            <span className="text-muted-foreground text-xs">{t('admin.reports.dateTo')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPreset('custom'); }}
              className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 min-h-[44px] bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            {t('admin.reports.applyRange')}
          </button>
        </div>

        {dateError && (
          <div className="flex items-center gap-2 text-xs text-rose-500 font-medium pt-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </form>

      {/* 3. 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: New Users */}
        <div className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.reports.metricNewUsers')}</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {isLoading ? '...' : formatNumber(reportData?.metrics?.new_users || 0)}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">{t('admin.reports.metricNewUsersSub')}</span>
          </div>
        </div>

        {/* Metric 2: New Enrollments */}
        <div className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.reports.metricNewEnrollments')}</span>
            <GraduationCap className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {isLoading ? '...' : formatNumber(reportData?.metrics?.new_enrollments || 0)}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">{t('admin.reports.metricNewEnrollmentsSub')}</span>
          </div>
        </div>

        {/* Metric 3: Active Accounts */}
        <div className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.reports.metricActiveAccounts')}</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {isLoading ? '...' : formatNumber(reportData?.metrics?.active_accounts_in_window ?? reportData?.metrics?.active_accounts_period ?? 0)}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">{t('admin.reports.metricActiveAccountsSub')}</span>
          </div>
        </div>

        {/* Metric 4: New Courses */}
        <div className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.reports.metricNewCourses')}</span>
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
              {isLoading ? '...' : formatNumber(reportData?.metrics?.new_courses || 0)}
            </span>
            <span className="block text-[11px] text-muted-foreground mt-1">{t('admin.reports.metricNewCoursesSub')}</span>
          </div>
        </div>
      </div>

      {/* 4. Dynamic Time-Series Analytics Chart Section */}
      <div className="bg-card border border-border/50 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t('admin.reports.chartTitle')}</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-500" />
              <span className="text-muted-foreground">{t('admin.reports.legendUsers')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground">{t('admin.reports.legendEnrollments')}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 bg-muted/20 animate-pulse rounded-xl" />
        ) : !reportData?.time_series || reportData.time_series.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p>{t('admin.reports.noTimeSeriesData')}</p>
          </div>
        ) : (
          <div className="pt-4 pb-2 overflow-x-auto">
            <div className="min-w-[600px] h-64 flex items-end justify-between gap-2 px-4 border-b border-border/50">
              {reportData.time_series.map((bucketItem, idx) => {
                const rawLabel = String(bucketItem.bucket || bucketItem.date || `Bucket ${idx + 1}`);
                const displayLabel = rawLabel.includes('T') ? rawLabel.split('T')[0] : rawLabel;
                const shortLabel = displayLabel.length > 10 ? displayLabel.substring(5) : displayLabel;

                const usersCount = bucketItem.users ?? bucketItem.new_users ?? 0;
                const enrollsCount = bucketItem.enrollments ?? bucketItem.new_enrollments ?? 0;

                const userHeight = Math.round((usersCount / maxBucketCount) * 100);
                const enrollHeight = Math.round((enrollsCount / maxBucketCount) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-popover text-popover-foreground text-[10px] p-2 rounded-lg border border-border shadow-md pointer-events-none whitespace-nowrap z-20">
                      <div className="font-bold border-b border-border/40 pb-0.5 mb-1">{displayLabel}</div>
                      <div>Tài khoản mới: <strong>{usersCount}</strong></div>
                      <div>Ghi danh mới: <strong>{enrollsCount}</strong></div>
                    </div>

                    {/* Dual bar bars */}
                    <div className="w-full flex items-end justify-center gap-1 h-52">
                      <div
                        className="w-3.5 bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                        style={{ height: `${Math.max(4, userHeight)}%` }}
                        title={`Users: ${usersCount}`}
                      />
                      <div
                        className="w-3.5 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                        style={{ height: `${Math.max(4, enrollHeight)}%` }}
                        title={`Enrollments: ${enrollsCount}`}
                      />
                    </div>
                    {/* Date label */}
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-2" title={displayLabel}>
                      {shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
