'use client';

import React from 'react';
import { RoleSidebar, NavItemConfig } from '@/components/dashboard/RoleSidebar';
import { AdminTab } from '@/types/admin';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  BarChart3,
  ShieldAlert,
  Settings
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
    { id: 'overview', labelKey: 'admin.navigation.overview', icon: LayoutDashboard, onClick: () => onSelectTab('overview'), isActive: activeTab === 'overview' },
    { id: 'users', labelKey: 'admin.navigation.users', icon: Users, onClick: () => onSelectTab('users'), isActive: activeTab === 'users' },
    { id: 'teacher-approvals', labelKey: 'admin.navigation.teacherApprovals', icon: UserCheck, badge: pendingTeacherCount, onClick: () => onSelectTab('teacher-approvals'), isActive: activeTab === 'teacher-approvals' },
    { id: 'courses', labelKey: 'admin.navigation.courses', icon: BookOpen, badge: pendingCourseCount, onClick: () => onSelectTab('courses'), isActive: activeTab === 'courses' },
    { id: 'reports', labelKey: 'admin.navigation.reports', icon: BarChart3, onClick: () => onSelectTab('reports'), isActive: activeTab === 'reports' },
    { id: 'audit-logs', labelKey: 'admin.navigation.auditLogs', icon: ShieldAlert, onClick: () => onSelectTab('audit-logs'), isActive: activeTab === 'audit-logs' },
    { id: 'settings', labelKey: 'admin.navigation.settings', icon: Settings, onClick: () => onSelectTab('settings'), isActive: activeTab === 'settings' }
  ];

  return (
    <RoleSidebar
      role="admin"
      workspaceTitleKey="admin.workspaceTitle"
      navItems={navItems}
    />
  );
};
