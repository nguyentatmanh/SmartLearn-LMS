'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, UserX, Eye, RefreshCw, GraduationCap } from 'lucide-react';
import api from '@/lib/api';
import { UserItem } from '@/types/admin';
import { AdminDetailDrawer } from '../AdminDetailDrawer';
import { AdminConfirmModal } from '../AdminConfirmModal';
import { usePreference } from '@/context/PreferenceContext';

export const TeacherApprovalsTab: React.FC = () => {
  const { t, formatDate, formatNumber, formatError } = usePreference();
  const [requests, setRequests] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Selected item & Modals
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/teacher-requests', { params: { page, page_size: 15 } });
      setRequests(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err: unknown) {
      console.error('Failed to load teacher requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const handleApproveConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.post(`/admin/teachers/${selectedUser.id}/approve`);
      setIsApproveModalOpen(false);
      fetchRequests();
    } catch (err: unknown) {
      setErrorMsg(formatError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedUser) return;
    if (!rejectionReason.trim()) {
      setErrorMsg(t('errors.REQUIRED_REJECTION_REASON'));
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.post(`/admin/teachers/${selectedUser.id}/reject`, { rejection_reason: rejectionReason.trim() });
      setIsRejectModalOpen(false);
      fetchRequests();
    } catch (err: unknown) {
      setErrorMsg(formatError(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 fade-in">
      {/* Header Info */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t('admin.teacherApprovals.queueHeaderTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('admin.teacherApprovals.queueHeaderDesc')}</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-full">
          {t('admin.teacherApprovals.pendingCount', { count: formatNumber(total) })}
        </span>
      </div>

      {/* Requests Table */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/40 text-xs">
              <tr>
                <th className="px-6 py-3.5">{t('admin.teacherApprovals.thApplicant')}</th>
                <th className="px-6 py-3.5">{t('admin.teacherApprovals.thFacultyDept')}</th>
                <th className="px-6 py-3.5">{t('admin.teacherApprovals.thTeacherCode')}</th>
                <th className="px-6 py-3.5">{t('admin.teacherApprovals.thSubmittedAt')}</th>
                <th className="px-6 py-3.5 text-right">{t('admin.teacherApprovals.thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    <span className="block mt-2 font-semibold">{t('common.loading')}</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    {t('admin.teacherApprovals.noPending')}
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div>{r.full_name}</div>
                      <div className="text-[11px] text-muted-foreground font-normal">{r.email}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      <div>{r.teacher_profile?.faculty || 'N/A'}</div>
                      <div className="text-[11px] text-muted-foreground">{r.teacher_profile?.department || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {r.teacher_profile?.teacher_code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedUser(r); setIsDrawerOpen(true); }}
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
                        title={t('admin.audit.thDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => { setSelectedUser(r); setIsApproveModalOpen(true); setErrorMsg(null); }}
                        className="px-3 py-2 min-h-[44px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                      >
                        <UserCheck className="w-4 h-4" /> {t('admin.teacherApprovals.btnApprove')}
                      </button>

                      <button
                        onClick={() => { setSelectedUser(r); setRejectionReason(''); setIsRejectModalOpen(true); setErrorMsg(null); }}
                        className="px-3 py-2 min-h-[44px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                      >
                        <UserX className="w-4 h-4" /> {t('admin.teacherApprovals.btnReject')}
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

      {/* Details Drawer */}
      <AdminDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedUser?.full_name || t('admin.teacherApprovals.thApplicant')}
        subtitle={`ID: ${selectedUser?.id}`}
      >
        {selectedUser && selectedUser.teacher_profile && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-muted-foreground font-bold uppercase text-[10px]">Email</span>
              <p className="font-semibold text-foreground mt-0.5">{selectedUser.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-bold uppercase text-[10px]">{t('admin.teacherApprovals.thFacultyDept')}</span>
              <p className="font-semibold text-foreground mt-0.5">{selectedUser.teacher_profile.faculty} / {selectedUser.teacher_profile.department}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-bold uppercase text-[10px]">{t('admin.teacherApprovals.thTeacherCode')}</span>
              <p className="font-semibold text-foreground mt-0.5">{selectedUser.teacher_profile.teacher_code || 'N/A'}</p>
            </div>
          </div>
        )}
      </AdminDetailDrawer>

      {/* Approve Modal */}
      <AdminConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApproveConfirm}
        title={t('admin.teacherApprovals.modalApproveTitle')}
        description={selectedUser ? t('admin.teacherApprovals.modalApproveDesc', { name: selectedUser.full_name }) : ''}
        confirmText={t('admin.teacherApprovals.btnApprove')}
        isLoading={actionLoading}
      >
        {errorMsg && <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs rounded-xl">{errorMsg}</div>}
      </AdminConfirmModal>

      {/* Reject Modal */}
      <AdminConfirmModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        title={t('admin.teacherApprovals.modalRejectTitle')}
        description={selectedUser ? t('admin.teacherApprovals.modalRejectDesc', { name: selectedUser.full_name }) : ''}
        confirmText={t('admin.teacherApprovals.btnReject')}
        isDanger={true}
        isLoading={actionLoading}
      >
        <div className="space-y-3">
          {errorMsg && <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs rounded-xl">{errorMsg}</div>}
          <label className="block text-xs font-bold text-foreground">{t('admin.teacherApprovals.rejectionReasonLabel')}</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t('admin.teacherApprovals.rejectionReasonPlaceholder')}
            className="w-full bg-muted/40 border border-border text-foreground text-xs rounded-xl p-2.5 min-h-[80px] focus:outline-none"
          />
        </div>
      </AdminConfirmModal>
    </div>
  );
};
