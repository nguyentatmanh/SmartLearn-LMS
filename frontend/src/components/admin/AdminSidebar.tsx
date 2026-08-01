'use client';

import React from 'react';
import { RoleSidebar, NavItemConfig, GLOBAL_NAV_ICON_STYLES } from '@/components/dashboard/RoleSidebar';
import { AdminTab } from '@/types/admin';
import {
  LayoutDashboard,
  UsersRound,
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  History,
  Settings2
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingTeacherCount?: number;
  pendingCourseCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingTeacherCount = 0,
  pendingCourseCount = 0
}) => {
  const navItems: NavItemConfig[] = [
    {
      id: 'overview',
      labelKey: 'admin.navigation.overview',
      icon: LayoutDashboard,
      onClick: () => onSelectTab('overview'),
      isActive: activeTab === 'overview',
      iconStyle: GLOBAL_NAV_ICON_STYLES['overview']
    },
    {
      id: 'users',
      labelKey: 'admin.navigation.users',
      icon: UsersRound,
      onClick: () => onSelectTab('users'),
      isActive: activeTab === 'users',
      iconStyle: GLOBAL_NAV_ICON_STYLES['users']
    },
    {
      id: 'teacher-approvals',
      labelKey: 'admin.navigation.teacherApprovals',
      icon: GraduationCap,
      badge: pendingTeacherCount,
      onClick: () => onSelectTab('teacher-approvals'),
      isActive: activeTab === 'teacher-approvals',
      iconStyle: GLOBAL_NAV_ICON_STYLES['teacher-approvals']
    },
    {
      id: 'courses',
      labelKey: 'admin.navigation.courses',
      icon: BookOpenCheck,
      badge: pendingCourseCount,
      onClick: () => onSelectTab('courses'),
      isActive: activeTab === 'courses',
      iconStyle: GLOBAL_NAV_ICON_STYLES['courses']
    },
    {
      id: 'reports',
      labelKey: 'admin.navigation.reports',
      icon: BarChart3,
      onClick: () => onSelectTab('reports'),
      isActive: activeTab === 'reports',
      iconStyle: GLOBAL_NAV_ICON_STYLES['reports']
    },
    {
      id: 'audit-logs',
      labelKey: 'admin.navigation.auditLogs',
      icon: History,
      onClick: () => onSelectTab('audit-logs'),
      isActive: activeTab === 'audit-logs',
      iconStyle: GLOBAL_NAV_ICON_STYLES['audit-logs']
    },
    {
      id: 'settings',
      labelKey: 'admin.navigation.settings',
      icon: Settings2,
      onClick: () => onSelectTab('settings'),
      isActive: activeTab === 'settings',
      iconStyle: GLOBAL_NAV_ICON_STYLES['settings']
    }
  ];

  return (
    <RoleSidebar
      role="admin"
      workspaceTitleKey="admin.workspaceTitle"
      navItems={navItems}
      hideFooterControls={true}
    />
  );
};
