'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Loader2, Sun, Moon, Globe, LogOut, ChevronDown, UserCheck } from 'lucide-react';
import api from '@/lib/api';
import { AdminTab } from '@/types/admin';
import { useSidebar } from '@/context/SidebarContext';
import { usePreference } from '@/context/PreferenceContext';
import { useAuth } from '@/context/AuthContext';
import { playNavClickSound } from '@/lib/sound';

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
  const { user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.full_name?.trim() || adminName;
  const displayEmail = user?.email || adminEmail;

  // Debounced search effect with AbortController
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
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
        setShowSearchDropdown(true);
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
        setShowSearchDropdown(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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
    <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border/40 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Menu & Breadcrumb Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            playNavClickSound();
            if (onOpenMobileSidebar) onOpenMobileSidebar();
            openMobile();
          }}
          className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer group active:scale-95"
          aria-label={t('admin.workspaceTitle')}
        >
          <Menu className="w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" />
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

      {/* Center/Right: Global Search & Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar (Real /admin/search API) */}
        <div ref={searchRef} className="relative hidden sm:block w-60 md:w-80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults && setShowSearchDropdown(true)}
              placeholder={t('admin.topbar.searchPlaceholder')}
              className="w-full bg-muted/30 border border-border/50 rounded-xl pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 p-2 space-y-2 fade-in">
              {/* Users */}
              {searchResults.users.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">{t('admin.overview.roleStudents')} & {t('admin.overview.roleAdmins')}</div>
                  {searchResults.users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        playNavClickSound();
                        onSelectTab('users');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted flex items-center justify-between text-xs text-foreground transition-colors cursor-pointer group active:scale-98"
                    >
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">{u.full_name}</span>
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
                      onClick={() => {
                        playNavClickSound();
                        onSelectTab('courses');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted flex items-center justify-between text-xs text-foreground transition-colors cursor-pointer group active:scale-98"
                    >
                      <span className="font-medium text-foreground truncate max-w-[180px] group-hover:text-primary transition-colors">{c.title}</span>
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
                      onClick={() => {
                        playNavClickSound();
                        onSelectTab('teacher-approvals');
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted flex items-center justify-between text-xs text-foreground transition-colors cursor-pointer group active:scale-98"
                    >
                      <span className="font-medium text-amber-600 dark:text-amber-400 group-hover:underline">{r.full_name}</span>
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

        {/* Header Profile Dropdown (Single Centralized Location) */}
        <div ref={profileMenuRef} className="relative pl-2 border-l border-border/40">
          <button
            onClick={() => {
              playNavClickSound();
              setShowProfileMenu(!showProfileMenu);
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/60 transition-all cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group active:scale-95"
            aria-label={t('admin.topbar.profileMenu')}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-200 shadow-xs">
              {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-semibold text-foreground leading-tight max-w-[130px] truncate group-hover:text-primary transition-colors">{displayName}</span>
              <span className="block text-[10px] text-muted-foreground max-w-[130px] truncate">{displayEmail}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 group-hover:scale-125 ${showProfileMenu ? 'rotate-180 text-primary' : ''}`} />
          </button>

          {/* Accessible Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 p-1.5 space-y-1.5 text-xs fade-in"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
            >
              {/* User identity card */}
              <div className="p-2.5 bg-muted/40 rounded-lg">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.topbar.signedInAs')}</p>
                <p className="font-bold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  <UserCheck className="w-3 h-3" />
                  <span>{t('admin.overview.roleAdmins')}</span>
                </div>
              </div>

              <div className="h-[1px] bg-border/40 my-1" />

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  playNavClickSound();
                  toggleTheme();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer min-h-[40px] group active:scale-98"
                role="menuitem"
              >
                <span className="flex items-center gap-2 font-medium">
                  {isMounted && theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400 group-hover:scale-125 group-hover:rotate-45 transition-transform duration-200" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-500 group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-200" />
                  )}
                  {t('common.toggleTheme')}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{theme}</span>
              </button>

              {/* Language Switch */}
              <button
                onClick={() => {
                  playNavClickSound();
                  setLanguage(language === 'en' ? 'vi' : 'en');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer min-h-[40px] group active:scale-98"
                role="menuitem"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Globe className="w-4 h-4 text-primary group-hover:scale-125 group-hover:rotate-180 transition-transform duration-300" />
                  {t('common.changeLanguage')}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'en' ? 'EN' : 'VI'}</span>
              </button>

              <div className="h-[1px] bg-border/40 my-1" />

              {/* Logout button */}
              <button
                onClick={() => {
                  playNavClickSound();
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold transition-colors cursor-pointer min-h-[40px] group active:scale-98"
                role="menuitem"
              >
                <LogOut className="w-4 h-4 group-hover:scale-125 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
