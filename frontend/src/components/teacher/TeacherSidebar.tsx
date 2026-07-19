'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import {
  GraduationCap, LayoutDashboard, BookOpen, FileText,
  LogOut, Sun, Moon, Globe, Menu, X, ChevronLeft, ChevronRight,
  UserCheck, Clock, ShieldAlert
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: string }>;
}

export default function TeacherSidebar({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = usePreference();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Restore collapsed preference on client
    const savedCollapsed = localStorage.getItem('teacher_sidebar_collapsed');
    if (savedCollapsed === 'true') {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem('teacher_sidebar_collapsed', String(nextState));
  };

  const getDisplayName = () => {
    if (user?.full_name?.trim()) return user.full_name.trim();
    if (user?.email) {
      const parts = user.email.split('@');
      if (parts[0]) return parts[0];
      return user.email;
    }
    return t('greetingFallbackTeacher');
  };
  const displayName = getDisplayName();
  const approvalStatus = user?.teacher_profile?.approval_status || 'pending';

  const navItems: NavItem[] = [
    { href: '/dashboard/teacher', labelKey: 'teacherNavDashboard', icon: LayoutDashboard },
    { href: '/dashboard/teacher/courses', labelKey: 'teacherNavCourses', icon: BookOpen },
    { href: '/dashboard/teacher/materials', labelKey: 'teacherNavMaterials', icon: FileText },
  ];

  const isActive = (itemHref: string) => {
    return itemHref === '/dashboard/teacher'
      ? pathname === '/dashboard/teacher'
      : pathname.startsWith(itemHref);
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-3.5 relative">
      <div className="space-y-5">
        {/* Brand Header & Toggle */}
        <div className="flex items-center justify-between px-1.5 pt-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 overflow-hidden group"
            onClick={() => setDrawerOpen(false)}
            title="SmartLearn LMS"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            {!collapsed && (
              <span className="text-base font-extrabold tracking-tight text-foreground whitespace-nowrap">
                SmartLearn <span className="text-primary">LMS</span>
              </span>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1" aria-label="Teacher workspace navigation">
          {!collapsed && (
            <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {t('teacherWorkspaceTitle')}
            </div>
          )}

          {navItems.map((item) => {
            const active = isActive(item.href);
            const label = t(item.labelKey as any);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all relative group ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{label}</span>}

                {/* Collapsed Floating Tooltip */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-semibold rounded-lg shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-border">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls & User Details */}
      <div className="space-y-2.5 pt-3 border-t border-border/60">
        {/* Theme & Language Toggle */}
        <div className={`flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60 ${collapsed ? 'flex-col' : 'justify-between'}`}>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex justify-center flex-1 w-full cursor-pointer"
            aria-label="Toggle theme"
            title={mounted ? (theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : 'Toggle theme'}
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />
            ) : (
              <span className="h-4 w-4 animate-pulse bg-muted-foreground/20 rounded-full" />
            )}
          </button>
          {!collapsed && <div className="h-4 w-[1px] bg-border shrink-0" />}
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="p-1.5 rounded-lg hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 flex-1 w-full cursor-pointer"
            aria-label="Toggle language"
            title="Switch language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{mounted ? (language === 'en' ? 'EN' : 'VI') : 'EN'}</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/50 ${collapsed ? 'justify-center p-1.5' : ''}`}>
          <div className="h-8 w-8 bg-primary/15 text-primary font-bold rounded-lg flex items-center justify-center uppercase shrink-0 text-xs border border-primary/20">
            {displayName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-foreground">{displayName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {approvalStatus === 'approved' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <UserCheck className="h-3 w-3" /> {t('adminLabelApproved')}
                  </span>
                )}
                {approvalStatus === 'pending' && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> {t('adminLabelPending')}
                  </span>
                )}
                {approvalStatus === 'rejected' && (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                    <ShieldAlert className="h-3 w-3" /> {t('adminLabelRejected')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border/60 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 text-xs font-extrabold transition-colors text-muted-foreground cursor-pointer ${collapsed ? 'px-2' : ''}`}
          title={t('logout')}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-200">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-foreground">
            SmartLearn <span className="text-primary">LMS</span>
          </span>
        </Link>
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-card border-r border-border/60 z-50 transition-all duration-300 ease-in-out shrink-0 lg:static lg:z-auto ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${drawerOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden focus:outline-none" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
