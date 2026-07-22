'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import {
  UserCheck, Clock, ShieldAlert, LogOut, Sun, Moon, Globe, ChevronDown, User, Sparkles
} from 'lucide-react';

interface TeacherHeaderProps {
  pageTitle?: string;
}

export function TeacherHeader({ pageTitle }: TeacherHeaderProps) {
  const { user, logout } = useAuth();
  const { theme, language, toggleTheme, setLanguage, t } = usePreference();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const getBreadcrumbs = () => {
    const parent = language === 'vi' ? 'Không gian Giảng viên' : 'Teacher Workspace';
    if (pathname === '/dashboard/teacher' || pathname === '/dashboard/teacher/') {
      return { parent: null, current: t('teacher.nav.dashboard') || (language === 'vi' ? 'Bảng điều khiển' : 'Dashboard') };
    }
    if (pathname.includes('/courses')) return { parent, current: t('teacher.nav.courses') || (language === 'vi' ? 'Khóa học của tôi' : 'My Courses') };
    if (pathname.includes('/students')) return { parent, current: t('teacher.nav.students') || (language === 'vi' ? 'Học viên' : 'Students') };
    if (pathname.includes('/materials')) return { parent, current: t('teacher.nav.materials') || (language === 'vi' ? 'Thư viện tài liệu' : 'Learning Materials') };
    if (pathname.includes('/analytics')) return { parent, current: t('teacher.nav.analytics') || (language === 'vi' ? 'Phân tích giảng dạy' : 'Teaching Analytics') };
    return { parent, current: t('teacher.nav.dashboard') || (language === 'vi' ? 'Bảng điều khiển' : 'Dashboard') };
  };

  const breadcrumbs = getBreadcrumbs();
  const approvalStatus = user?.teacher_profile?.approval_status || 'approved';

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'T';

  return (
    <header className="w-full bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-15 px-4 sm:px-6 py-3 transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Page Title */}
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5" aria-label="Breadcrumb">
            {breadcrumbs.parent ? (
              <>
                <Link href="/dashboard/teacher" className="hover:text-foreground transition-colors">
                  {breadcrumbs.parent}
                </Link>
                <span>/</span>
              </>
            ) : null}
            <span className="text-foreground font-medium truncate">{breadcrumbs.current}</span>
          </nav>
          <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight line-clamp-1">
            {pageTitle || breadcrumbs.current}
          </h1>
        </div>

        {/* Right: Controls & Teacher Profile Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Approval Badge (Show prominent badge only if non-approved) */}
          {approvalStatus === 'pending' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('teacher.status.pending') || 'Pending'}</span>
            </span>
          )}
          {approvalStatus === 'rejected' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('teacher.status.rejected') || 'Rejected'}</span>
            </span>
          )}

          {/* User Profile Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/80 border border-border/50 transition-all cursor-pointer"
              aria-expanded={dropdownOpen}
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary/20">
                {userInitials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-foreground line-clamp-1 leading-tight">
                  {user?.full_name || 'Teacher'}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {t('roles.teacher') || 'Teacher'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card border border-border/60 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95">
                {/* Header Info */}
                <div className="px-4 py-3 border-b border-border/50 space-y-1">
                  <p className="text-xs font-bold text-foreground truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <div className="pt-1 flex items-center gap-1.5">
                    {approvalStatus === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <UserCheck className="w-3 h-3" /> {t('teacher.status.approved') || 'Approved'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> {t('teacher.status.pending') || 'Pending Approval'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preference Controls */}
                <div className="py-1 border-b border-border/50">
                  <button
                    onClick={toggleTheme}
                    className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/70 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{t('common.toggleTheme') || 'Theme Mode'}</span>
                    </span>
                    <span className="text-[10px] capitalize text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded-md">
                      {theme}
                    </span>
                  </button>

                  <button
                    onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                    className="w-full px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/70 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>{t('common.changeLanguage') || 'Language'}</span>
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded-md">
                      {language}
                    </span>
                  </button>
                </div>

                {/* Logout Button */}
                <div className="pt-1">
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout') || 'Log Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
