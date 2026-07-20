'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Code } from 'lucide-react';
import api from '@/lib/api';
import { AuditLogItem } from '@/types/admin';
import { AdminDetailDrawer } from '../AdminDetailDrawer';
import { usePreference } from '@/context/PreferenceContext';

export const AuditLogTab: React.FC = () => {
  const { t, formatDate, formatNumber } = usePreference();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (eventTypeFilter) params.event_type = eventTypeFilter;
      if (resultFilter) params.result = resultFilter;

      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err: unknown) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, eventTypeFilter, resultFilter]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 fade-in">
      {/* Header Filters */}
      <div className="p-4 bg-card border border-border/50 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{t('admin.audit.headerTitle')}</h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={eventTypeFilter}
            onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
            className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
          >
            <option value="">{t('admin.audit.filterAllEvents')}</option>
            <option value="TEACHER_APPROVED">TEACHER_APPROVED</option>
            <option value="TEACHER_REJECTED">TEACHER_REJECTED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="USER_ACTIVE_TOGGLED">USER_ACTIVE_TOGGLED</option>
            <option value="COURSE_REVIEW_APPROVED">COURSE_REVIEW_APPROVED</option>
            <option value="SYSTEM_SETTINGS_UPDATED">SYSTEM_SETTINGS_UPDATED</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
            className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
          >
            <option value="">{t('admin.audit.filterAllOutcomes')}</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/40 text-xs">
              <tr>
                <th className="px-6 py-3.5">{t('admin.audit.thEventType')}</th>
                <th className="px-6 py-3.5">{t('admin.audit.thResult')}</th>
                <th className="px-6 py-3.5">{t('admin.audit.thTarget')}</th>
                <th className="px-6 py-3.5">{t('admin.audit.thActor')}</th>
                <th className="px-6 py-3.5">{t('admin.audit.thIp')}</th>
                <th className="px-6 py-3.5">{t('admin.audit.thTimestamp')}</th>
                <th className="px-6 py-3.5 text-right">{t('admin.audit.thDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-sans">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <span className="block mt-2 font-semibold">{t('common.loading')}</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-sans">
                    {t('admin.audit.noLogsFound')}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-foreground">
                      {log.event_type}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        log.result === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-foreground">
                      {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {log.actor_id || 'System'}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground font-sans">
                      {formatDate(log.created_at, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => { setSelectedLog(log); setIsDrawerOpen(true); }}
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-muted/60 hover:bg-muted text-foreground font-sans transition-colors cursor-pointer"
                        title={t('admin.audit.thDetails')}
                      >
                        <Code className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
          <span className="text-xs text-muted-foreground">
            {t('common.showingPage', { page: formatNumber(page), totalPages: formatNumber(totalPages), total: formatNumber(total) })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-muted/60 hover:bg-muted text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              {t('common.previous')}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-muted/60 hover:bg-muted text-foreground disabled:opacity-40 transition-colors cursor-pointer"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {/* Details Inspector Drawer */}
      <AdminDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`ID #${selectedLog?.id}`}
        subtitle={selectedLog?.event_type}
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="text-xs">
              <span className="text-muted-foreground font-bold uppercase text-[10px]">{t('admin.audit.drawerPayloadTitle')}</span>
              <pre className="mt-2 p-4 bg-muted/50 rounded-2xl border border-border font-mono text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                {JSON.stringify(selectedLog.sanitized_details || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </AdminDetailDrawer>
    </div>
  );
};
