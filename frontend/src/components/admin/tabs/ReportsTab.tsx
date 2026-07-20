'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Calendar, RefreshCw, FileSpreadsheet } from 'lucide-react';
import api from '@/lib/api';
import { usePreference } from '@/context/PreferenceContext';

export const ReportsTab: React.FC = () => {
  const { t, formatNumber } = usePreference();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [granularity, setGranularity] = useState('day');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params: any = { granularity };
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
    fetchReports();
  }, [granularity]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params: any = { granularity };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await api.get('/admin/reports/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `smartlearn_report_${granularity}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: unknown) {
      console.error('CSV export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 fade-in">
      {/* Date Filter & Export Header */}
      <form onSubmit={handleFilterSubmit} className="p-4 bg-card border border-border/50 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
            <span className="text-muted-foreground text-xs">{t('admin.reports.dateTo')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
          </div>

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
            type="submit"
            className="px-4 py-2 min-h-[44px] bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            {t('admin.reports.applyRange')}
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="px-4 py-2 min-h-[44px] bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          {t('admin.reports.btnExportCSV')}
        </button>
      </form>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.reports.metricNewUsers')}</span>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{isLoading ? '...' : formatNumber(reportData?.metrics?.new_users || 0)}</span>
            <span className="block text-xs text-muted-foreground mt-1">{t('admin.reports.metricNewUsersSub')}</span>
          </div>
        </div>

        <div className="p-5 bg-card border border-border/50 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <span className="text-xs font-semibold text-muted-foreground">{t('admin.reports.metricNewCourses')}</span>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{isLoading ? '...' : formatNumber(reportData?.metrics?.new_courses || 0)}</span>
            <span className="block text-xs text-muted-foreground mt-1">{t('admin.reports.metricNewCoursesSub')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
