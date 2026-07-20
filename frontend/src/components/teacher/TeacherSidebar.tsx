'use client';

import React from 'react';
import Link from 'next/link';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { RoleSidebar } from '@/components/dashboard/RoleSidebar';
import { usePreference } from '@/context/PreferenceContext';
import { GraduationCap, LayoutDashboard, BookOpen, FileText, Menu } from 'lucide-react';

function TeacherLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, openMobile } = useSidebar();
  const { t } = usePreference();

  const navItems = [
    { id: 'dashboard', href: '/dashboard/teacher', labelKey: 'teacherNavDashboard', icon: LayoutDashboard },
    { id: 'courses', href: '/dashboard/teacher/courses', labelKey: 'teacherNavCourses', icon: BookOpen },
    { id: 'materials', href: '/dashboard/teacher/materials', labelKey: 'teacherNavMaterials', icon: FileText },
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
        />

        <main
          className={`flex-1 min-w-0 overflow-x-hidden focus:outline-none transition-all duration-200 ease-out ${
            isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
          tabIndex={-1}
        >
          {children}
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
