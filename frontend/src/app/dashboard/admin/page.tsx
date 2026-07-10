'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import { 
  GraduationCap, Users, Check, X, Shield, Lock, Unlock, Settings, 
  Globe, Sun, Moon, LogOut, Search, FileText, AlertTriangle, Loader2 
} from 'lucide-react';

interface UserProfile {
  full_name: string;
  phone_number?: string;
  date_of_birth?: string;
}

interface TeacherProfile {
  faculty: string;
  department: string;
  specialization: string;
  academic_title?: string;
  teacher_code?: string;
  bio?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
}

interface User {
  id: number;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  profile?: UserProfile;
  teacher_profile?: TeacherProfile;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rejection Modal state
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Router guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        if (user.role === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/dashboard/student');
        }
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data);

      // Fetch pending requests
      const requestsRes = await api.get('/admin/teacher-requests');
      setPendingRequests(requestsRes.data);
    } catch (e) {
      console.error('Failed to load admin workspace data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const showNotification = (text: string, type: 'success' | 'danger') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  const handleApprove = async (teacherId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/teachers/${teacherId}/approve`);
      showNotification(t('adminTeacherApproved'), 'success');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to approve teacher.';
      showNotification(detail, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (teacher: User) => {
    setSelectedTeacher(teacher);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!selectedTeacher) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/teachers/${selectedTeacher.id}/reject`, {
        rejection_reason: rejectionReason || null
      });
      showNotification(t('adminTeacherRejected'), 'success');
      setSelectedTeacher(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to reject teacher.';
      showNotification(detail, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/active`, {
        is_active: !currentStatus
      });
      showNotification(
        !currentStatus ? t('adminUserActivated') : t('adminUserDeactivated'), 
        'success'
      );
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to update account status.';
      showNotification(detail, 'danger');
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'student' | 'teacher' | 'admin') => {
    try {
      await api.patch(`/admin/users/${userId}/role`, {
        role: newRole
      });
      showNotification('User role updated successfully.', 'success');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to change user role.';
      showNotification(detail, 'danger');
    }
  };

  // Filtered users for database tab
  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    const fullName = u.profile?.full_name?.toLowerCase() || '';
    const email = u.email.toLowerCase();
    return fullName.includes(search) || email.includes(search) || u.role.includes(search);
  });

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 glass lg:border-r border-border lg:min-h-dvh flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t('appName')}
            </span>
          </div>

          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('adminPanel')}
            </div>
            
            <button 
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all text-left ${
                activeTab === 'requests' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Check className="h-4 w-4" />
              {t('adminRequestsTab')}
              {pendingRequests.length > 0 && (
                <span className="ml-auto px-2 py-0.5 text-[10px] bg-danger text-danger-foreground rounded-full font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all text-left ${
                activeTab === 'users' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Users className="h-4 w-4" />
              {t('adminUsersTab')}
            </button>
          </div>
        </div>

        {/* User Card & Settings */}
        <div className="mt-8 pt-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between gap-2 p-1 bg-muted/40 rounded-xl border border-border">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex justify-center"
              aria-label="Toggle theme appearance"
            >
              {isMounted && theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </button>
            <div className="h-4 w-[1px] bg-border shrink-0" />
            <button
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className="flex-1 p-2 rounded-lg hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1"
              aria-label="Toggle language preference"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'EN' : 'VI'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center uppercase shrink-0">
              {user?.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10 max-w-7xl mx-auto w-full fade-in overflow-x-hidden">
        
        {/* Welcome and Stats Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'en' ? 'Admin Workspace' : 'Không gian Quản trị'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'en' 
                ? 'Review user accounts, update roles, and approve teacher credentials.' 
                : 'Xem xét các tài khoản người dùng, cập nhật vai trò và duyệt giảng viên.'}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-36 glass p-4 rounded-xl border border-border text-center">
              <span className="block text-xs font-bold text-muted-foreground uppercase">{t('adminSummaryUsers')}</span>
              <span className="text-2xl font-extrabold mt-1 block">{users.length}</span>
            </div>
            <div className="flex-1 md:w-36 glass p-4 rounded-xl border border-border text-center">
              <span className="block text-xs font-bold text-muted-foreground uppercase">{t('adminSummaryPending')}</span>
              <span className="text-2xl font-extrabold mt-1 block text-warning">{pendingRequests.length}</span>
            </div>
          </div>
        </div>

        {/* Global Notification */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 fade-in ${
            message.type === 'success' 
              ? 'bg-success/10 border-success/25 text-success' 
              : 'bg-danger/10 border-danger/25 text-danger'
          }`}>
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{message.text}</p>
          </div>
        )}

        {/* TAB 1: TEACHER APPROVAL REQUESTS */}
        {activeTab === 'requests' && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              {t('adminRequestsTab')}
            </h2>

            {pendingRequests.length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-border">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-bold text-base text-muted-foreground">{t('adminNoPending')}</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="glass p-6 rounded-xl border border-border space-y-4 hover:border-primary/30 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-4">
                      <div>
                        <h4 className="font-extrabold text-base text-foreground">{req.profile?.full_name}</h4>
                        <p className="text-xs text-muted-foreground">{req.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleApprove(req.id)}
                          className="px-4 py-2 bg-success text-success-foreground hover:bg-success/90 transition-all rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('adminBtnApprove')}
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleOpenReject(req)}
                          className="px-4 py-2 bg-danger text-danger-foreground hover:bg-danger/90 transition-all rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t('adminBtnReject')}
                        </button>
                      </div>
                    </div>

                    {/* Teacher profile details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="block font-bold text-muted-foreground">{t('facultyLabel')}</span>
                        <span className="font-semibold text-foreground">{req.teacher_profile?.faculty}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-muted-foreground">{t('departmentLabel')}</span>
                        <span className="font-semibold text-foreground">{req.teacher_profile?.department}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-muted-foreground">{t('specializationLabel')}</span>
                        <span className="font-semibold text-foreground">{req.teacher_profile?.specialization}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-muted-foreground">
                          {language === 'en' ? 'Teacher Code' : 'Mã giáo viên'}
                        </span>
                        <span className="font-semibold text-foreground">{req.teacher_profile?.teacher_code || 'N/A'}</span>
                      </div>
                    </div>

                    {req.teacher_profile?.bio && (
                      <div className="p-3 bg-muted/40 rounded-lg text-xs border border-border">
                        <span className="block font-bold text-muted-foreground mb-1">
                          {language === 'en' ? 'Statement / Biography' : 'Lời giới thiệu / Tiểu sử'}
                        </span>
                        <p className="text-muted-foreground italic leading-relaxed">{req.teacher_profile.bio}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: USERS DATABASE */}
        {activeTab === 'users' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('adminUsersTab')}
              </h2>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search user...' : 'Tìm người dùng...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="glass border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold">
                      <th className="p-4">{t('adminColName')}</th>
                      <th className="p-4">{t('adminColEmail')}</th>
                      <th className="p-4">{t('adminColRole')}</th>
                      <th className="p-4">{t('adminColStatus')}</th>
                      <th className="p-4">{t('adminColActive')}</th>
                      <th className="p-4 text-right">{t('adminColActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          {t('adminNoUsers')}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-all">
                          <td className="p-4 font-bold text-foreground">
                            {u.profile?.full_name || 'N/A'}
                          </td>
                          <td className="p-4 text-muted-foreground font-mono">
                            {u.email}
                          </td>
                          <td className="p-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                              className="bg-muted/60 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary text-foreground"
                            >
                              <option value="student">{t('studentRole')}</option>
                              <option value="teacher">{t('teacherRole')}</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {u.role === 'teacher' && u.teacher_profile ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.teacher_profile.approval_status === 'approved' 
                                  ? 'bg-success/10 text-success border-success/20' 
                                  : u.teacher_profile.approval_status === 'pending'
                                  ? 'bg-warning/10 text-warning border-warning/20'
                                  : 'bg-danger/10 text-danger border-danger/20'
                              }`}>
                                {u.teacher_profile.approval_status === 'approved' 
                                  ? t('adminLabelApproved') 
                                  : u.teacher_profile.approval_status === 'pending'
                                  ? t('adminLabelPending')
                                  : t('adminLabelRejected')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                u.is_active 
                                  ? 'bg-success/10 text-success border-success/30 hover:bg-success/20' 
                                  : 'bg-danger/10 text-danger border-danger/30 hover:bg-danger/20'
                              }`}
                              title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {u.is_active ? (
                                <Unlock className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-muted-foreground/40 font-mono text-[10px]">ID: {u.id}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* REJECTION MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
          <div className="w-full max-w-md glass border border-border rounded-2xl p-6 shadow-2xl space-y-6 bg-card text-foreground">
            
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold">{t('adminModalRejectTitle')}</h3>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                {language === 'en' ? 'Reject registration request for: ' : 'Từ chối yêu cầu đăng ký của: '}
                <strong className="text-foreground block mt-0.5 text-sm">{selectedTeacher.profile?.full_name} ({selectedTeacher.email})</strong>
              </div>

              {/* Rejection reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{t('adminModalRejectReasonLabel')}</label>
                <textarea
                  placeholder={t('adminModalRejectReasonPlaceholder')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRejectSubmit}
                className="px-4 py-2 bg-danger text-danger-foreground rounded-xl text-xs font-bold hover:bg-danger/95 shadow-md shadow-danger/10 flex items-center gap-1 cursor-pointer"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('adminBtnSubmitReject')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
