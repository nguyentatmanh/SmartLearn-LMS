'use client';

import React from 'react';
import Link from 'next/link';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { RoleSidebar, NavItemConfig } from '@/components/dashboard/RoleSidebar';
import { TeacherHeader } from './TeacherHeader';
import { usePreference } from '@/context/PreferenceContext';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpenCheck,
  UsersRound,
  FolderOpen,
  BarChart3,
  Menu
} from 'lucide-react';

export const TEACHER_NAV_ICON_STYLES: Record<
  string,
  {
    activeTile: string;
    inactiveTile: string;
    activeIcon: string;
    inactiveIcon: string;
  }
> = {
  dashboard: {
    activeTile: 'bg-indigo-600 border-indigo-600 shadow-sm',
    inactiveTile: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
    activeIcon: 'text-white',
    inactiveIcon: 'text-indigo-600 dark:text-indigo-400',
  },
  courses: {
    activeTile: 'bg-emerald-600 border-emerald-600 shadow-sm',
    inactiveTile: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
    activeIcon: 'text-white',
    inactiveIcon: 'text-emerald-600 dark:text-emerald-400',
  },
  students: {
    activeTile: 'bg-blue-600 border-blue-600 shadow-sm',
    inactiveTile: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/50',
    activeIcon: 'text-white',
    inactiveIcon: 'text-blue-600 dark:text-blue-400',
  },
  materials: {
    activeTile: 'bg-amber-300 border-amber-400 shadow-sm',
    inactiveTile: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/50',
    activeIcon: 'text-amber-950',
    inactiveIcon: 'text-amber-700 dark:text-amber-400',
  },
  analytics: {
    activeTile: 'bg-violet-600 border-violet-600 shadow-sm',
    inactiveTile: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40 hover:bg-violet-100 dark:hover:bg-violet-900/50',
    activeIcon: 'text-white',
    inactiveIcon: 'text-violet-600 dark:text-violet-400',
  },
};

function TeacherLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, openMobile } = useSidebar();
  const { t } = usePreference();

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      href: '/dashboard/teacher',
      labelKey: 'teacher.nav.dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'courses',
      href: '/dashboard/teacher/courses',
      labelKey: 'teacher.nav.courses',
      icon: BookOpenCheck,
    },
    {
      id: 'students',
      href: '/dashboard/teacher/students',
      labelKey: 'teacher.nav.students',
      icon: UsersRound,
    },
    {
      id: 'materials',
      href: '/dashboard/teacher/materials',
      labelKey: 'teacher.nav.materials',
      icon: FolderOpen,
    },
    {
      id: 'analytics',
      href: '/dashboard/teacher/analytics',
      labelKey: 'teacher.nav.analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-foreground">
            SmartLearn <span className="text-primary">LMS</span>
          </span>
        </Link>
        <button
          onClick={openMobile}
          className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('sidebarOpenNav' as any) || 'Open menu'}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 flex min-w-0">
        <RoleSidebar
          role="teacher"
          workspaceTitleKey="teacherWorkspaceTitle"
          navItems={navItems}
          hideFooterControls={true}
        />

        <main
          className={`flex-1 min-w-0 overflow-x-hidden focus:outline-none transition-all duration-200 ease-out flex flex-col ${
            isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
          tabIndex={-1}
        >
          <TeacherHeader />
          <div className="flex-1 p-4 sm:p-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function TeacherSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <TeacherLayoutInner>{children}</TeacherLayoutInner>
    </SidebarProvider>
  );
}
