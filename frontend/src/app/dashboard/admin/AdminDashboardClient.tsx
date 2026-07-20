'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { OverviewTab } from '@/components/admin/tabs/OverviewTab';
import { UsersTab } from '@/components/admin/tabs/UsersTab';
import { TeacherApprovalsTab } from '@/components/admin/tabs/TeacherApprovalsTab';
import { CoursesTab } from '@/components/admin/tabs/CoursesTab';
import { ReportsTab } from '@/components/admin/tabs/ReportsTab';
import { AuditLogTab } from '@/components/admin/tabs/AuditLogTab';
import { SettingsTab } from '@/components/admin/tabs/SettingsTab';
import { AdminTab } from '@/types/admin';
import api from '@/lib/api';

function AdminDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get('tab') as AdminTab) || 'overview';
  const { isCollapsed } = useSidebar();

  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam);
  const [pendingTeacherCount, setPendingTeacherCount] = useState(0);
  const [pendingCourseCount, setPendingCourseCount] = useState(0);
  const [adminUser, setAdminUser] = useState<{ full_name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const fetchAdminContext = async () => {
      try {
        const meRes = await api.get('/auth/me');
        setAdminUser(meRes.data);

        const overviewRes = await api.get('/admin/overview');
        if (overviewRes.data?.metrics) {
          setPendingTeacherCount(overviewRes.data.metrics.pending_teacher_requests || 0);
          setPendingCourseCount(overviewRes.data.metrics.pending_course_reviews || 0);
        }
      } catch (err) {
        console.error('Failed to fetch admin context:', err);
      }
    };
    fetchAdminContext();
  }, []);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    router.push(`/dashboard/admin?tab=${tab}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingTeacherCount={pendingTeacherCount}
        pendingCourseCount={pendingCourseCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-out ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <AdminTopBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          adminName={adminUser?.full_name || 'System Administrator'}
          adminEmail={adminUser?.email || 'admin@smartlearn.vn'}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && <OverviewTab onSelectTab={handleSelectTab} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'teacher-approvals' && <TeacherApprovalsTab />}
          {activeTab === 'courses' && <CoursesTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'audit-logs' && <AuditLogTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboardClient() {
  return (
    <SidebarProvider>
      <AdminDashboardInner />
    </SidebarProvider>
  );
}
