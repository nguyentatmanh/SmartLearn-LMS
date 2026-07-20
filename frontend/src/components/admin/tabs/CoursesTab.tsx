'use client';

import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, RefreshCw, Eye, MessageSquare, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { CourseItem } from '@/types/admin';
import { AdminDetailDrawer } from '../AdminDetailDrawer';
import { AdminConfirmModal } from '../AdminConfirmModal';
import { usePreference } from '@/context/PreferenceContext';

export const CoursesTab: React.FC = () => {
  const { t, formatNumber, formatError } = usePreference();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');

  // Selected item & Modals
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 15 };
      if (search.trim()) params.q = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (reviewFilter) params.review_status = reviewFilter;

      const res = await api.get('/admin/courses', { params });
      setCourses(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (err: unknown) {
      console.error('Failed to fetch admin courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, statusFilter, reviewFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  const handleApproveReviewConfirm = async () => {
    if (!selectedCourse) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.post(`/admin/courses/${selectedCourse.id}/approve-review`);
      setIsApproveModalOpen(false);
      fetchCourses();
    } catch (err: unknown) {
      setErrorMsg(formatError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChangesConfirm = async () => {
    if (!selectedCourse) return;
    if (!reviewNote.trim()) {
      setErrorMsg(t('errors.REQUIRED_REVIEW_NOTE'));
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await api.post(`/admin/courses/${selectedCourse.id}/request-changes`, { review_note: reviewNote.trim() });
      setIsNotesModalOpen(false);
      fetchCourses();
    } catch (err: unknown) {
      setErrorMsg(formatError(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 fade-in">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 border border-border/50 rounded-xl shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.courses.searchPlaceholder')}
            className="w-full bg-muted/30 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
          >
            <option value="">{t('admin.courses.filterAllStatuses')}</option>
            <option value="draft">{t('admin.courses.filterDraft')}</option>
            <option value="published">{t('admin.courses.filterPublished')}</option>
            <option value="archived">{t('admin.courses.filterArchived')}</option>
          </select>

          <select
            value={reviewFilter}
            onChange={(e) => { setReviewFilter(e.target.value); setPage(1); }}
            className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
          >
            <option value="">{t('admin.courses.filterAllModeration')}</option>
            <option value="pending">{t('admin.courses.filterPending')}</option>
            <option value="approved">{t('admin.courses.filterApproved')}</option>
            <option value="changes_requested">{t('admin.courses.filterChangesRequested')}</option>
            <option value="not_submitted">{t('admin.courses.filterNotSubmitted')}</option>
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/40 text-xs">
              <tr>
                <th className="px-6 py-3.5">{t('admin.courses.thTitle')}</th>
                <th className="px-6 py-3.5">{t('admin.courses.thInstructor')}</th>
                <th className="px-6 py-3.5">{t('admin.courses.thStatus')}</th>
                <th className="px-6 py-3.5">{t('admin.courses.thModeration')}</th>
                <th className="px-6 py-3.5">{t('admin.courses.thRevision')}</th>
                <th className="px-6 py-3.5 text-right">{t('admin.courses.thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <span className="block mt-2 font-semibold">{t('common.loading')}</span>
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    {t('admin.courses.noCoursesFound')}
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">
                      <div>{c.title}</div>
                      <div className="text-[11px] text-muted-foreground font-normal">{c.category || 'General'}</div>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      <div>{c.teacher?.full_name || `Teacher #${c.teacher_id}`}</div>
                      <div className="text-[11px] text-muted-foreground">{c.teacher?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        c.status === 'draft' ? 'bg-muted text-muted-foreground' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {c.status === 'published' ? t('admin.courses.filterPublished') : c.status === 'draft' ? t('admin.courses.filterDraft') : t('admin.courses.filterArchived')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        c.review_status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30' :
                        c.review_status === 'approved' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' :
                        c.review_status === 'changes_requested' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {c.review_status === 'pending' ? t('admin.courses.filterPending') : c.review_status === 'approved' ? t('admin.courses.filterApproved') : c.review_status === 'changes_requested' ? t('admin.courses.filterChangesRequested') : t('admin.courses.filterNotSubmitted')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      v{c.content_revision}
                      {c.approved_revision ? <span className="text-emerald-600 dark:text-emerald-400 text-[10px] ml-1">(Appr v{c.approved_revision})</span> : null}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedCourse(c); setIsDrawerOpen(true); }}
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
                        title={t('admin.audit.thDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {c.review_status === 'pending' && (
                        <>
                          <button
                            onClick={() => { setSelectedCourse(c); setIsApproveModalOpen(true); setErrorMsg(null); }}
                            className="px-3 py-2 min-h-[44px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                          >
                            <CheckCircle className="w-4 h-4" /> {t('admin.teacherApprovals.btnApprove')}
                          </button>
                          <button
                            onClick={() => { setSelectedCourse(c); setReviewNote(''); setIsNotesModalOpen(true); setErrorMsg(null); }}
                            className="px-3 py-2 min-h-[44px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                          >
                            <MessageSquare className="w-4 h-4" /> {t('admin.courses.filterChangesRequested')}
                          </button>
                        </>
                      )}
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
        title={selectedCourse?.title || t('admin.courses.thTitle')}
        subtitle={`ID: #${selectedCourse?.id}`}
      >
        {selectedCourse && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-muted-foreground font-bold uppercase text-[10px]">{t('admin.courses.thRevision')}</span>
              <p className="font-semibold text-foreground mt-0.5">Content Rev: v{selectedCourse.content_revision} | Approved Rev: {selectedCourse.approved_revision ? `v${selectedCourse.approved_revision}` : 'None'}</p>
            </div>
            {selectedCourse.review_note && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-300">
                <span className="font-bold block uppercase text-[10px]">{t('admin.courses.feedbackNoteLabel')}</span>
                <p className="mt-1 leading-relaxed">{selectedCourse.review_note}</p>
              </div>
            )}
          </div>
        )}
      </AdminDetailDrawer>

      {/* Approve Review Modal */}
      <AdminConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApproveReviewConfirm}
        title={t('admin.courses.modalApproveTitle')}
        description={selectedCourse ? t('admin.courses.modalApproveDesc', { revision: selectedCourse.content_revision, title: selectedCourse.title }) : ''}
        confirmText={t('admin.teacherApprovals.btnApprove')}
        isLoading={actionLoading}
      >
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </AdminConfirmModal>

      {/* Request Changes Modal */}
      <AdminConfirmModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        onConfirm={handleRequestChangesConfirm}
        title={t('admin.courses.modalFeedbackTitle')}
        description={selectedCourse ? t('admin.courses.modalFeedbackDesc', { title: selectedCourse.title }) : ''}
        confirmText={t('admin.courses.filterChangesRequested')}
        isDanger={true}
        isLoading={actionLoading}
      >
        <div className="space-y-3">
          {errorMsg && <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs rounded-xl">{errorMsg}</div>}
          <label className="block text-xs font-bold text-foreground">{t('admin.courses.feedbackNoteLabel')}</label>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder={t('admin.courses.feedbackNotePlaceholder')}
            className="w-full bg-muted/40 border border-border text-foreground text-xs rounded-xl p-2.5 min-h-[90px] focus:outline-none"
          />
        </div>
      </AdminConfirmModal>
    </div>
  );
};
