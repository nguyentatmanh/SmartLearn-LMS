'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search, Shield, UserX, UserCheck, Eye, RefreshCw, AlertTriangle,
  User as UserIcon, Mail, Calendar, Clock, ShieldCheck, CheckCircle2,
  XCircle, Award, BookOpen, GraduationCap, FileText, Activity, ShieldAlert
} from 'lucide-react';
import api from '@/lib/api';
import { UserItem, UserDetailResponse } from '@/types/admin';
import { AdminDetailDrawer } from '../AdminDetailDrawer';
import { AdminConfirmModal } from '../AdminConfirmModal';
import { VerifyEmailModal } from '../modals/VerifyEmailModal';
import { usePreference } from '@/context/PreferenceContext';

export const UsersTab: React.FC = () => {
  const { t, formatDate, formatNumber, formatError } = usePreference();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');

  // Drawer & Detail state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<{ status?: number; message: string } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'profile' | 'summary' | 'activity'>('overview');

  // In-Memory Cache (60s TTL)
  const detailCacheRef = useRef<Map<number, { data: UserDetailResponse; timestamp: number }>>(new Map());
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCachedDetail = (userId: number): UserDetailResponse | null => {
    const cached = detailCacheRef.current.get(userId);
    if (cached && Date.now() - cached.timestamp < 60000) {
      return cached.data;
    }
    return null;
  };

  const setCachedDetail = (userId: number, data: UserDetailResponse) => {
    detailCacheRef.current.set(userId, { data, timestamp: Date.now() });
  };

  const invalidateCacheEntry = (userId: number) => {
    detailCacheRef.current.delete(userId);
  };

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [targetActiveState, setTargetActiveState] = useState(false);

  // Manual Verify Email Modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyTargetUser, setVerifyTargetUser] = useState<UserItem | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request race protection
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, page_size: 15 };
      if (search.trim()) params.q = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.is_active = activeFilter === 'true';
      if (verificationFilter) params.email_verified = verificationFilter === 'true';

      const res = await api.get<{ items: UserItem[]; total: number; unverified_count?: number; total_pages: number }>('/admin/users', { params });
      setUsers(res.data.items);
      setTotal(res.data.total);
      if (typeof res.data.unverified_count === 'number') {
        setUnverifiedCount(res.data.unverified_count);
      }
      setTotalPages(res.data.total_pages);
    } catch (err: unknown) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, activeFilter, verificationFilter]);

  // Handle URL searchParam userId integration
  const userIdParam = searchParams.get('userId');
  useEffect(() => {
    if (userIdParam) {
      const parsedId = parseInt(userIdParam, 10);
      if (!isNaN(parsedId)) {
        setIsDrawerOpen(true);
        if (!selectedUser || selectedUser.id !== parsedId) {
          const found = users.find((u) => u.id === parsedId);
          if (found) {
            setSelectedUser(found);
          } else {
            setSelectedUser({
              id: parsedId,
              email: '',
              full_name: `User #${parsedId}`,
              role: 'student',
              is_active: true,
              email_verified: false,
              is_approved: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
        const cached = getCachedDetail(parsedId);
        if (cached) {
          setUserDetail(cached);
          setIsDetailLoading(false);
        } else {
          fetchUserDetail(parsedId);
        }
      }
    } else {
      setIsDrawerOpen(false);
      setUserDetail(null);
    }
  }, [userIdParam, users]);

  const fetchUserDetail = async (userId: number, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCachedDetail(userId);
      if (cached) {
        setUserDetail(cached);
        setIsDetailLoading(false);
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsDetailLoading(true);
    setDetailError(null);

    try {
      const res = await api.get<UserDetailResponse>(`/admin/users/${userId}`, {
        signal: controller.signal
      });
      setCachedDetail(userId, res.data);
      setUserDetail(res.data);
      if (!selectedUser || selectedUser.id !== res.data.id) {
        setSelectedUser({
          id: res.data.id,
          email: res.data.email,
          full_name: res.data.full_name,
          role: res.data.role,
          is_active: res.data.is_active,
          email_verified: res.data.email_verified,
          is_approved: res.data.is_approved,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at
        });
      }
    } catch (err: unknown) {
      if (axiosIsCancel(err)) {
        return;
      }
      const status = getErrorStatus(err);
      setDetailError({
        status,
        message: formatError(err)
      });
    } finally {
      if (!controller.signal.aborted) {
        setIsDetailLoading(false);
      }
    }
  };

  const axiosIsCancel = (err: unknown): boolean => {
    return (
      typeof err === 'object' &&
      err !== null &&
      ('name' in err && (err.name === 'CanceledError' || err.name === 'AbortError'))
    );
  };

  const getErrorStatus = (err: unknown): number | undefined => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const res = (err as { response?: { status?: number } }).response;
      return res?.status;
    }
    return undefined;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handlePrefetchUser = (userId: number) => {
    if (getCachedDetail(userId)) return;
    api.get<UserDetailResponse>(`/admin/users/${userId}`)
      .then((res) => setCachedDetail(userId, res.data))
      .catch(() => {});
  };

  const handleRowMouseEnter = (userId: number) => {
    if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current);
    prefetchTimeoutRef.current = setTimeout(() => {
      handlePrefetchUser(userId);
    }, 150);
  };

  const handleRowMouseLeave = () => {
    if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current);
  };

  const handleOpenUserDetail = (u: UserItem) => {
    setSelectedUser(u);
    setIsDrawerOpen(true);
    setActiveDetailTab('overview');

    const cached = getCachedDetail(u.id);
    if (cached) {
      setUserDetail(cached);
      setIsDetailLoading(false);
    } else {
      setUserDetail(null);
      fetchUserDetail(u.id);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('userId', String(u.id));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setUserDetail(null);
    setDetailError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('userId');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleOpenRoleModal = (u: UserItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedUser(u);
    setTargetRole(u.role);
    setErrorMessage(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenActiveModal = (u: UserItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedUser(u);
    setTargetActiveState(!u.is_active);
    setErrorMessage(null);
    setIsActiveModalOpen(true);
  };

  const handleRoleChangeConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.patch(`/admin/users/${selectedUser.id}/role`, { role: targetRole });
      invalidateCacheEntry(selectedUser.id);
      setIsRoleModalOpen(false);
      fetchUsers();
      if (selectedUser.id) {
        fetchUserDetail(selectedUser.id, true);
      }
    } catch (err: unknown) {
      setErrorMessage(formatError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleActiveToggleConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.patch(`/admin/users/${selectedUser.id}/active`, { is_active: targetActiveState });
      invalidateCacheEntry(selectedUser.id);
      setIsActiveModalOpen(false);
      fetchUsers();
      if (selectedUser.id) {
        fetchUserDetail(selectedUser.id, true);
      }
    } catch (err: unknown) {
      setErrorMessage(formatError(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Helper Display Name Generator with Fallback Sequence
  const getDisplayName = (u: UserItem | UserDetailResponse | null): string => {
    if (!u) return t('admin.users.thUser');
    if (u.full_name && u.full_name.trim()) return u.full_name;
    if (u.email) return u.email.split('@')[0];
    return t('admin.users.detailUnnamedAccount');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const currentDisplayUser = userDetail || selectedUser;

  // Deterministic Avatar Color helper based on user ID
  const getAvatarBg = (id: number) => {
    const colors = [
      'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    ];
    return colors[id % colors.length];
  };

  const handleOpenVerifyModal = (u: UserItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVerifyTargetUser(u);
    setIsVerifyModalOpen(true);
  };

  const handleConfirmVerifyEmail = async (reason: string) => {
    if (!verifyTargetUser) return;
    try {
      const res = await api.post<UserDetailResponse>(`/admin/users/${verifyTargetUser.id}/verify-email`, { reason });
      invalidateCacheEntry(verifyTargetUser.id);
      fetchUsers();
      if (selectedUser && selectedUser.id === verifyTargetUser.id) {
        setUserDetail(res.data);
      }
    } catch (err: unknown) {
      throw new Error(formatError(err));
    }
  };

  const hasActiveFilters = Boolean(search.trim() || roleFilter || activeFilter || verificationFilter);

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setActiveFilter('');
    setVerificationFilter('');
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
      {/* 1. Page Header */}
      <div className="pb-4 border-b border-border/40 space-y-1">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <span>{t('admin.workspaceTitle')}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{t('admin.users.headerTitle')}</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('admin.users.headerTitle')}
          </h1>
          <div className="text-xs text-muted-foreground font-medium">
            <span>{t('admin.users.showingCount')} <strong className="text-foreground">{total}</strong> {t('admin.users.filterRoleUser')}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('admin.users.headerDesc')}
        </p>
      </div>

      {/* 2. Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-4 border border-border/50 rounded-xl shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
            className="w-full bg-muted/30 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
          >
            <option value="">{t('admin.users.filterAllRoles')}</option>
            <option value="student">{t('admin.users.filterRoleStudent')}</option>
            <option value="teacher">{t('admin.users.filterRoleTeacher')}</option>
            <option value="admin">{t('admin.users.filterRoleAdmin')}</option>
          </select>

          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
          >
            <option value="">{t('admin.users.filterAllStatuses')}</option>
            <option value="true">{t('admin.users.filterActive')}</option>
            <option value="false">{t('admin.users.filterInactive')}</option>
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
            className="bg-muted/30 border border-border/50 text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] cursor-pointer"
          >
            <option value="">{t('admin.users.filterAllVerification')}</option>
            <option value="true">{t('admin.users.filterVerified')}</option>
            <option value="false">{t('admin.users.filterUnverified')}</option>
          </select>

          {unverifiedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setVerificationFilter(verificationFilter === 'false' ? '' : 'false');
                setPage(1);
              }}
              className={`px-3 py-2 min-h-[44px] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border ${
                verificationFilter === 'false'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/20'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('admin.users.quickFilterUnverified').replace('{count}', unverifiedCount.toString())}</span>
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 min-h-[44px] text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title={t('admin.users.clearFilters')}
            >
              <XCircle className="w-4 h-4" />
              <span>{t('admin.users.clearFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Users Table with Sticky Header */}
      <div className="bg-card border border-border/50 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-foreground border-collapse">
            <thead className="sticky top-0 bg-muted/95 backdrop-blur-xs border-b border-border/40 text-muted-foreground font-semibold text-xs z-10">
              <tr>
                <th className="p-4">{t('admin.users.thUser')}</th>
                <th className="p-4">{t('admin.users.thRole')}</th>
                <th className="p-4">{t('admin.users.thStatus')}</th>
                <th className="p-4">{t('admin.users.thEmailVerified')}</th>
                <th className="p-4">{t('admin.users.thCreatedAt')}</th>
                <th className="p-4 text-right">{t('admin.users.thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-muted/60 rounded-md w-36" /></td>
                    <td className="p-4"><div className="h-4 bg-muted/60 rounded-md w-16" /></td>
                    <td className="p-4"><div className="h-4 bg-muted/60 rounded-md w-20" /></td>
                    <td className="p-4"><div className="h-4 bg-muted/60 rounded-md w-20" /></td>
                    <td className="p-4"><div className="h-4 bg-muted/60 rounded-md w-24" /></td>
                    <td className="p-4 text-right"><div className="h-4 bg-muted/60 rounded-md w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground space-y-2">
                    <UserX className="w-8 h-8 mx-auto text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">{t('admin.users.noUsersFound')}</p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        {t('admin.users.clearFilters')}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const displayName = getDisplayName(u);
                  const avatarStyle = getAvatarBg(u.id);
                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleOpenUserDetail(u)}
                      onMouseEnter={() => handleRowMouseEnter(u.id)}
                      onMouseLeave={handleRowMouseLeave}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${avatarStyle}`}>
                            {getInitials(displayName)}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {displayName}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : u.role === 'teacher'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {u.role === 'student' ? t('admin.users.filterRoleStudent') : u.role === 'teacher' ? t('admin.users.filterRoleTeacher') : t('admin.users.filterRoleAdmin')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                          u.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {u.is_active ? t('admin.users.filterActive') : t('admin.users.filterInactive')}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('admin.users.badgeVerified')}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              <XCircle className="w-3.5 h-3.5 text-amber-500" />
                              {t('admin.users.badgeUnverified')}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleOpenVerifyModal(u, e)}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-all cursor-pointer min-h-[32px]"
                              title={t('admin.users.modalVerifyTitle')}
                            >
                              {t('admin.users.btnVerifyEmail')}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground text-[11px]">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenUserDetail(u)}
                            onFocus={() => handlePrefetchUser(u.id)}
                            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                            title={t('admin.users.tooltipViewDetails')}
                            aria-label={t('admin.users.tooltipViewDetails')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!u.email_verified && (
                            <button
                              onClick={(e) => handleOpenVerifyModal(u, e)}
                              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-600 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                              title={t('admin.users.modalVerifyTitle')}
                              aria-label={t('admin.users.modalVerifyTitle')}
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleOpenRoleModal(u, e)}
                            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                            title={t('admin.users.btnChangeRole')}
                            aria-label={t('admin.users.btnChangeRole')}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenActiveModal(u, e)}
                            className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                              u.is_active
                                ? 'text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10'
                                : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10'
                            }`}
                            title={u.is_active ? t('admin.users.btnDeactivate') : t('admin.users.btnActivate')}
                            aria-label={u.is_active ? t('admin.users.btnDeactivate') : t('admin.users.btnActivate')}
                          >
                            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Full Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-muted/20">
            <div className="text-muted-foreground">
              {t('admin.users.paginationText').replace('{page}', page.toString()).replace('{totalPages}', totalPages.toString()).replace('{total}', total.toString())}
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="px-2.5 py-1.5 rounded-lg border border-border/50 bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors min-h-[36px] cursor-pointer"
              >
                « First
              </button>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border/50 bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors min-h-[36px] cursor-pointer"
              >
                ‹ Prev
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pNum = page;
                if (page <= 3) pNum = i + 1;
                else if (page >= totalPages - 2) pNum = totalPages - 4 + i;
                else pNum = page - 2 + i;

                if (pNum < 1 || pNum > totalPages) return null;

                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors min-h-[36px] min-w-[36px] cursor-pointer ${
                      page === pNum
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border/50 hover:bg-muted text-foreground'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border/50 bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors min-h-[36px] cursor-pointer"
              >
                Next ›
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-2.5 py-1.5 rounded-lg border border-border/50 bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors min-h-[36px] cursor-pointer"
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account Detail Drawer */}
      <AdminDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        selectedUserId={selectedUser?.id}
        title={getDisplayName(currentDisplayUser)}
        subtitle={currentDisplayUser ? `User ID: #${currentDisplayUser.id}` : ''}
        footer={
          currentDisplayUser ? (
            <div className="flex flex-wrap items-center gap-2 w-full justify-end">
              <button
                onClick={() => handleOpenRoleModal(currentDisplayUser as UserItem)}
                className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-xl border border-border transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>{t('admin.users.tooltipChangeRole')}</span>
              </button>
              <button
                onClick={() => handleOpenActiveModal(currentDisplayUser as UserItem)}
                className={`px-3 py-2 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 min-h-[44px] ${
                  currentDisplayUser.is_active
                    ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                {currentDisplayUser.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>{currentDisplayUser.is_active ? t('admin.users.filterInactive') : t('admin.users.filterActive')}</span>
              </button>
            </div>
          ) : null
        }
      >
        {isDetailLoading && !userDetail ? (
          <div className="space-y-6 animate-pulse">
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-full bg-muted/60" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted/60 rounded w-1/3" />
                <div className="h-3 bg-muted/60 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-muted/60 rounded w-1/4" />
              <div className="h-20 bg-muted/40 rounded-2xl border border-border" />
            </div>
          </div>
        ) : detailError ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="font-bold text-foreground text-sm">
              {detailError.status === 404
                ? t('admin.users.detailNotFoundDesc', { id: String(selectedUser?.id || userIdParam || '') })
                : t('admin.users.detailNotFoundTitle')}
            </h3>
            <p className="text-xs text-muted-foreground">{detailError.message}</p>
            {(selectedUser || userIdParam) && (
              <button
                onClick={() => fetchUserDetail(selectedUser?.id || parseInt(userIdParam || '0', 10), true)}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('admin.users.detailRetry')}</span>
              </button>
            )}
          </div>
        ) : currentDisplayUser ? (
          <div className="space-y-6">
            {/* Header Identity Box */}
            <div className="p-4 bg-muted/30 rounded-2xl border border-border flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-base flex items-center justify-center flex-shrink-0 shadow-sm">
                {getInitials(getDisplayName(currentDisplayUser))}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground text-sm truncate">{getDisplayName(currentDisplayUser)}</h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{currentDisplayUser.email}</p>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    currentDisplayUser.role === 'admin'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                      : currentDisplayUser.role === 'teacher'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}>
                    {currentDisplayUser.role === 'student' ? t('admin.users.filterRoleStudent') : currentDisplayUser.role === 'teacher' ? t('admin.users.filterRoleTeacher') : t('admin.users.filterRoleAdmin')}
                  </span>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    currentDisplayUser.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {currentDisplayUser.is_active ? t('admin.users.badgeActive') : t('admin.users.badgeInactive')}
                  </span>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    currentDisplayUser.email_verified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentDisplayUser.email_verified ? t('admin.users.badgeVerified') : t('admin.users.badgeUnverified')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Header Navigation */}
            <div className="flex border-b border-border gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveDetailTab('overview')}
                className={`pb-2 px-3 border-b-2 transition-colors min-h-[44px] ${
                  activeDetailTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('admin.users.detailTabOverview')}
              </button>
              {(currentDisplayUser.role === 'student' || currentDisplayUser.role === 'teacher') && (
                <button
                  onClick={() => setActiveDetailTab('profile')}
                  className={`pb-2 px-3 border-b-2 transition-colors min-h-[44px] ${
                    activeDetailTab === 'profile'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('admin.users.detailTabProfile')}
                </button>
              )}
              {userDetail?.profile?.type && (userDetail.profile.student_details || userDetail.profile.teacher_details) && (
                <button
                  onClick={() => setActiveDetailTab('summary')}
                  className={`pb-2 px-3 border-b-2 transition-colors min-h-[44px] ${
                    activeDetailTab === 'summary'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('admin.users.detailTabSummary')}
                </button>
              )}
              {userDetail && userDetail.recent_activities.length > 0 && (
                <button
                  onClick={() => setActiveDetailTab('activity')}
                  className={`pb-2 px-3 border-b-2 transition-colors min-h-[44px] ${
                    activeDetailTab === 'activity'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('admin.users.detailTabActivity')}
                </button>
              )}
            </div>

            {/* TAB CONTENT */}
            {activeDetailTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border border-border">
                  <div className="font-bold text-foreground text-xs flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" />
                    <span>{t('admin.users.detailIdentity')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">Full Name</span>
                      <p className="font-medium text-foreground mt-0.5">{getDisplayName(currentDisplayUser)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">User ID</span>
                      <p className="font-medium text-foreground mt-0.5">#{currentDisplayUser.id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border border-border">
                  <div className="font-bold text-foreground text-xs flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>{t('admin.users.detailContact')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">Email</span>
                      <p className="font-medium text-foreground mt-0.5 truncate">{currentDisplayUser.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">Phone</span>
                      <p className="font-medium text-foreground mt-0.5">{userDetail?.phone_number || t('admin.users.detailNotProvided')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border border-border">
                  <div className="font-bold text-foreground text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{t('admin.users.detailAccountStatus')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.thCreatedAt')}</span>
                      <p className="font-medium text-foreground mt-0.5">{formatDate(currentDisplayUser.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.detailLastLogin')}</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {userDetail?.last_login_at ? formatDate(userDetail.last_login_at) : t('admin.users.detailNeverLoggedIn')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Verification Section */}
                <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border border-border">
                  <div className="font-bold text-foreground text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>{t('admin.users.drawerVerificationSection')}</span>
                    </div>
                    {!currentDisplayUser.email_verified && (
                      <button
                        onClick={() => handleOpenVerifyModal(currentDisplayUser as UserItem)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('admin.users.btnVerifyEmail')}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.drawerVerificationStatus')}</span>
                      <p className={`font-medium mt-0.5 ${currentDisplayUser.email_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {currentDisplayUser.email_verified ? t('admin.users.badgeVerified') : t('admin.users.badgeUnverified')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.drawerVerificationSource')}</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {(() => {
                          const src = userDetail?.email_verification_source || currentDisplayUser.email_verification_source;
                          if (src === 'otp') return t('admin.users.sourceOtp');
                          if (src === 'admin_override') {
                            if (userDetail?.email_verified_by?.full_name) {
                              return t('admin.users.sourceAdminOverride').replace('{name}', userDetail.email_verified_by.full_name);
                            }
                            return t('admin.users.sourceFormerAdmin');
                          }
                          if (currentDisplayUser.email_verified) return t('admin.users.sourceUnknown');
                          return '-';
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.drawerVerificationDate')}</span>
                      <p className="font-medium text-foreground mt-0.5">
                        {userDetail?.email_verified_at ? formatDate(userDetail.email_verified_at) : (currentDisplayUser.email_verified_at ? formatDate(currentDisplayUser.email_verified_at) : '-')}
                      </p>
                    </div>
                    {userDetail?.email_verification_note && (
                      <div className="col-span-2 pt-2 border-t border-border/40">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.drawerVerificationNote')}</span>
                        <p className="font-medium text-foreground mt-0.5 italic text-xs bg-muted/40 p-2.5 rounded-xl border border-border/40 leading-relaxed">
                          "{userDetail.email_verification_note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeDetailTab === 'profile' && (
              <div className="space-y-4 text-xs">
                {currentDisplayUser.role === 'student' && (
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                    <div className="font-bold text-foreground text-xs flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-500" />
                      <span>{t('admin.users.detailStudentProfile')}</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      {t('admin.users.detailStudentProfileEmpty')}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Account Name</span>
                        <p className="font-medium text-foreground mt-0.5">{getDisplayName(currentDisplayUser)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">User Email</span>
                        <p className="font-medium text-foreground mt-0.5 truncate">{currentDisplayUser.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentDisplayUser.role === 'teacher' && userDetail?.profile?.teacher_details && (
                  <>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                      <div className="font-bold text-foreground text-xs flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-amber-500" />
                        <span>{t('admin.users.detailTeacherProfile')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.detailFaculty')}</span>
                          <p className="font-medium text-foreground mt-0.5">{userDetail.profile.teacher_details.faculty}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.detailDepartment')}</span>
                          <p className="font-medium text-foreground mt-0.5">{userDetail.profile.teacher_details.department}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.detailSpecialization')}</span>
                          <p className="font-medium text-foreground mt-0.5">{userDetail.profile.teacher_details.specialization}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.detailTeacherCode')}</span>
                          <p className="font-medium text-foreground mt-0.5">{userDetail.profile.teacher_details.teacher_code || t('admin.users.detailNotProvided')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-2">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.detailApprovalStatus')}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          userDetail.profile.teacher_details.approval_status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : userDetail.profile.teacher_details.approval_status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {userDetail.profile.teacher_details.approval_status === 'approved'
                            ? t('admin.users.statusApproved')
                            : userDetail.profile.teacher_details.approval_status === 'rejected'
                            ? t('admin.users.statusRejected')
                            : t('admin.users.statusPending')}
                        </span>
                        {userDetail.profile.teacher_details.reviewer_name && (
                          <span className="text-muted-foreground text-[11px]">
                            {t('admin.users.detailReviewedBy', { name: userDetail.profile.teacher_details.reviewer_name })}
                          </span>
                        )}
                      </div>
                      {userDetail.profile.teacher_details.rejection_reason && (
                        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                          <span className="font-bold block text-[10px] uppercase">{t('admin.users.detailRejectionReason')}</span>
                          <p className="mt-0.5">{userDetail.profile.teacher_details.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {userDetail.profile.teacher_details.bio && (
                      <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-1">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold">{t('admin.users.detailBio')}</span>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap mt-1">
                          {userDetail.profile.teacher_details.bio}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeDetailTab === 'summary' && userDetail?.profile && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {userDetail.profile.student_details && (
                  <>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] uppercase font-bold">{t('admin.users.detailStatEnrolled')}</span>
                      </div>
                      <p className="text-xl font-extrabold text-foreground mt-2">
                        {formatNumber(userDetail.profile.student_details.enrolled_courses_count)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Activity className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] uppercase font-bold">{t('admin.users.detailStatActive')}</span>
                      </div>
                      <p className="text-xl font-extrabold text-foreground mt-2">
                        {formatNumber(userDetail.profile.student_details.active_courses_count)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] uppercase font-bold">{t('admin.users.detailStatCompleted')}</span>
                      </div>
                      <p className="text-xl font-extrabold text-foreground mt-2">
                        {formatNumber(userDetail.profile.student_details.completed_courses_count)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="text-[10px] uppercase font-bold">{t('admin.users.detailStatLessons')}</span>
                      </div>
                      <p className="text-xl font-extrabold text-foreground mt-2">
                        {formatNumber(userDetail.profile.student_details.completed_lessons_count)}
                      </p>
                    </div>
                  </>
                )}

                {userDetail.profile.teacher_details && (
                  <>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] uppercase font-bold">{t('admin.users.detailStatTotalCourses')}</span>
                      </div>
                      <p className="text-xl font-extrabold text-foreground mt-2">
                        {formatNumber(userDetail.profile.teacher_details.total_courses)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] uppercase font-bold">{t('admin.users.detailStatPublishedCourses')}</span>
                      </div>
                      <p className="text-xl font-extrabold text-foreground mt-2">
                        {formatNumber(userDetail.profile.teacher_details.published_courses)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-2xl border border-border col-span-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] uppercase font-bold">{t('admin.users.detailStatTotalStudents')}</span>
                      </div>
                      <p className="text-xl font-extrabold text-foreground mt-2">
                        {formatNumber(userDetail.profile.teacher_details.total_students)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeDetailTab === 'activity' && userDetail && (
              <div className="space-y-3 text-xs">
                {userDetail.recent_activities.length === 0 ? (
                  <p className="text-muted-foreground text-center p-6">{t('admin.users.detailNoActivities')}</p>
                ) : (
                  userDetail.recent_activities.map((act) => (
                    <div key={act.id} className="p-3 bg-muted/20 rounded-xl border border-border space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          act.activity_category === 'target'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}>
                          {act.activity_category === 'target'
                            ? t('admin.users.detailActivityCategoryTarget')
                            : t('admin.users.detailActivityCategoryActor')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(act.created_at)}</span>
                      </div>
                      <p className="font-semibold text-foreground text-xs">{act.description}</p>
                      {act.ip_address && (
                        <p className="text-[10px] text-muted-foreground">IP: {act.ip_address}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}
      </AdminDetailDrawer>

      {/* Role Change Modal */}
      <AdminConfirmModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onConfirm={handleRoleChangeConfirm}
        title={t('admin.users.changeRoleTitle')}
        description={selectedUser ? t('admin.users.changeRoleDesc', { name: getDisplayName(selectedUser), email: selectedUser.email }) : ''}
        isLoading={actionLoading}
      >
        <div className="space-y-3">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <label className="block text-xs font-bold text-foreground">{t('admin.users.thRole')}</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as 'student' | 'teacher' | 'admin')}
            className="w-full bg-muted/40 border border-border text-foreground text-xs rounded-xl p-2.5 focus:outline-none min-h-[44px]"
          >
            <option value="student">{t('admin.users.filterRoleStudent')}</option>
            <option value="teacher">{t('admin.users.filterRoleTeacher')}</option>
            <option value="admin">{t('admin.users.filterRoleAdmin')}</option>
          </select>
        </div>
      </AdminConfirmModal>

      {/* Active Toggle Modal */}
      <AdminConfirmModal
        isOpen={isActiveModalOpen}
        onClose={() => setIsActiveModalOpen(false)}
        onConfirm={handleActiveToggleConfirm}
        title={t('admin.users.toggleStatusTitle')}
        description={selectedUser ? (targetActiveState ? t('admin.users.toggleStatusDescInactive', { name: getDisplayName(selectedUser) }) : t('admin.users.toggleStatusDescActive', { name: getDisplayName(selectedUser) })) : ''}
        isDanger={!targetActiveState}
        isLoading={actionLoading}
      >
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </AdminConfirmModal>

      {/* Manual Email Verification Modal */}
      <VerifyEmailModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onConfirm={handleConfirmVerifyEmail}
        user={verifyTargetUser}
      />
    </div>
  );
};
