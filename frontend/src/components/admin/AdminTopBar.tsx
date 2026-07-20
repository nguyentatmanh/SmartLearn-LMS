'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { AdminTab } from '@/types/admin';
import { useSidebar } from '@/context/SidebarContext';
import { usePreference } from '@/context/PreferenceContext';

interface SearchResult {
  users: Array<{ id: number; full_name: string; email: string; role: string }>;
  courses: Array<{ id: number; title: string; status: string }>;
  teacher_requests: Array<{ id: number; full_name: string; email: string }>;
}

interface AdminTopBarProps {
  activeTab: AdminTab;
  onOpenMobileSidebar?: () => void;
  onSelectTab: (tab: AdminTab) => void;
  adminName?: string;
  adminEmail?: string;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onSelectTab,
  adminName = 'Administrator',
  adminEmail = 'admin@smartlearn.vn'
}) => {
  const { openMobile } = useSidebar();
  const { t } = usePreference();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search effect with AbortController
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowDropdown(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/admin/search', {
          params: { q: searchQuery.trim(), limit: 5 },
          signal: controller.signal
        });
        setSearchResults(res.data);
        setShowDropdown(true);
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          console.error('Search error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabTitle = (tab: AdminTab) => {
    switch (tab) {
      case 'overview': return t('admin.topbar.overview');
      case 'users': return t('admin.topbar.users');
      case 'teacher-approvals': return t('admin.topbar.teacherApprovals');
      case 'courses': return t('admin.topbar.courses');
      case 'reports': return t('admin.topbar.reports');
      case 'audit-logs': return t('admin.topbar.auditLogs');
      case 'settings': return t('admin.topbar.settings');
      default: return t('admin.workspaceTitle');
    }
  };

  return (
    <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border/40 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu & Breadcrumb Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (onOpenMobileSidebar) onOpenMobileSidebar();
            openMobile();
          }}
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label={t('admin.workspaceTitle')}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('admin.workspaceTitle')}</span>
          <span>/</span>
          <span className="font-semibold text-foreground">{getTabTitle(activeTab)}</span>
        </div>
        <span className="sm:hidden text-sm font-semibold text-foreground truncate">
          {getTabTitle(activeTab)}
        </span>
      </div>

      {/* Center/Right: Search Bar & Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div ref={searchRef} className="relative hidden sm:block w-56 md:w-72">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults && setShowDropdown(true)}
              placeholder={t('admin.users.searchPlaceholder')}
              className="w-full bg-muted/30 border border-border/50 rounded-xl pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchResults && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 p-2 space-y-2">
              {/* Users */}
              {searchResults.users.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">{t('admin.overview.roleStudents')} & {t('admin.overview.roleAdmins')}</div>
                  {searchResults.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { onSelectTab('users'); setShowDropdown(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted flex items-center justify-between text-xs text-foreground transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-foreground">{u.full_name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{u.role}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Courses */}
              {searchResults.courses.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">{t('admin.navigation.courses')}</div>
                  {searchResults.courses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { onSelectTab('courses'); setShowDropdown(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted flex items-center justify-between text-xs text-foreground transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-foreground truncate max-w-[180px]">{c.title}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{c.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Teacher Requests */}
              {searchResults.teacher_requests.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">{t('admin.overview.kpiPendingTeachers')}</div>
                  {searchResults.teacher_requests.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { onSelectTab('teacher-approvals'); setShowDropdown(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted flex items-center justify-between text-xs text-foreground transition-colors cursor-pointer"
                    >
                      <span className="font-medium text-amber-600 dark:text-amber-400">{r.full_name}</span>
                      <span className="text-[10px] text-amber-500">{t('admin.courses.filterPending')}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.users.length === 0 && searchResults.courses.length === 0 && searchResults.teacher_requests.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">{t('admin.users.noUsersFound')}</div>
              )}
            </div>
          )}
        </div>

        {/* Admin Avatar Profile Summary */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border/40">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-semibold text-foreground leading-tight">{adminName}</span>
            <span className="block text-[10px] text-muted-foreground">{adminEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
