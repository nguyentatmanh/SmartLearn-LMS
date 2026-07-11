'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import { 
  GraduationCap, Users, Check, X, Shield, Lock, Unlock, Settings, 
  Globe, Sun, Moon, LogOut, Search, FileText, AlertTriangle, Loader2,
  Menu, CheckCircle2, AlertCircle, HelpCircle, UserCheck
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Rejection Modal state
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Router guard
  useEffect(() => {
    if (isMounted && !authLoading) {
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
  }, [user, authLoading, router, isMounted]);

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
    if (isMounted && user && user.role === 'admin') {
      fetchData();
    }
  }, [user, isMounted]);

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

  // Hydration and loading guard
  if (!isMounted || authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Filtered users for database tab
  const filteredUsers = users.filter((u) => {
    const search = searchTerm.toLowerCase();
    const fullName = u.profile?.full_name?.toLowerCase() || '';
    const email = u.email.toLowerCase();
    return fullName.includes(search) || email.includes(search) || u.role.includes(search);
  });

  // Calculate statistics safely
  const totalUsersCount = users.length;
  const studentsCount = users.filter(u => u.role === 'student').length;
  const teachersCount = users.filter(u => u.role === 'teacher').length;
  const pendingRequestsCount = pendingRequests.length;

  // Safe greeting name extraction
  const getGreetingName = () => {
    if (user?.full_name?.trim()) {
      return user.full_name.trim();
    }
    if (user?.email) {
      const localPart = user.email.split('@')[0];
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
    return t('greetingFallbackAdmin');
  };
  const displayName = getGreetingName();

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('appName')}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all"
          aria-label="Toggle navigation drawer"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay Drawer backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 glass p-6 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:min-h-dvh ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary animate-pulse" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t('appName')}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('adminPanel')}
            </div>
            
            <button 
              onClick={() => {
                setActiveTab('requests');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                activeTab === 'requests' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Check className="h-4 w-4" />
              {t('adminRequestsTab')}
              {pendingRequestsCount > 0 && (
                <span className="ml-auto px-2 py-0.5 text-[10px] bg-danger text-danger-foreground rounded-full font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => {
                setActiveTab('users');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
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
          {/* Theme & Language row inside sidebar */}
          <div className="flex items-center justify-between gap-2 p-1 bg-muted/40 rounded-xl border border-border">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex justify-center"
              aria-label="Toggle theme appearance"
            >
              {theme === 'dark' ? (
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

          <div className="flex items-center gap-3 p-1 rounded-xl">
            <div className="h-10 w-10 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center uppercase shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10 max-w-7xl mx-auto w-full fade-in overflow-x-hidden">
        
        {/* Welcome and Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Shield className="h-3 w-3" />
                {t('greetingFallbackAdmin')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('welcomeAdmin', { name: displayName })}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              {language === 'en' 
                ? 'Review user accounts, update roles, and approve teacher credentials.' 
                : 'Xem xét các tài khoản người dùng, cập nhật vai trò và duyệt giảng viên.'}
            </p>
          </div>
        </div>

        {/* Global Notification banner */}
        {message && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 fade-in ${
            message.type === 'success' 
              ? 'bg-success/15 border-success/20 text-success' 
              : 'bg-danger/15 border-danger/20 text-danger'
          }`}>
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs font-bold">{message.text}</p>
          </div>
        )}

        {/* Stats Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {t('adminSummaryUsers')}
              </span>
              <span className="text-2xl font-extrabold block text-foreground">
                {totalUsersCount}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Registered profiles
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {t('adminStudents')}
              </span>
              <span className="text-2xl font-extrabold block text-foreground">
                {studentsCount}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Active learners
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-success/10 text-success">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {t('adminTeachers')}
              </span>
              <span className="text-2xl font-extrabold block text-foreground">
                {teachersCount}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Course instructors
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-500">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {t('adminTeacherRequests')}
              </span>
              <span className="text-2xl font-extrabold block text-warning">
                {pendingRequestsCount}
              </span>
              <span className="block text-[10px] text-muted-foreground/70">
                Awaiting approval
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-warning/10 text-warning">
              <Check className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* TAB 1: TEACHER APPROVAL REQUESTS */}
        {activeTab === 'requests' && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              {t('adminRequestsTab')}
            </h2>

            {pendingRequests.length === 0 ? (
              <div className="glass p-8 text-center rounded-2xl border border-border flex flex-col items-center justify-center max-w-lg mx-auto space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">{t('adminNoPending')}</h3>
                  <p className="text-xs text-muted-foreground">All teacher applications have been reviewed.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="glass p-6 rounded-2xl border border-border space-y-4 hover:border-primary/20 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-4">
                      <div>
                        <h4 className="font-extrabold text-base text-foreground">{req.profile?.full_name}</h4>
                        <p className="text-xs text-muted-foreground">{req.email}</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          disabled={actionLoading}
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 md:flex-initial px-4 py-2 bg-success text-success-foreground hover:bg-success/90 transition-all rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('adminBtnApprove')}
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleOpenReject(req)}
                          className="flex-1 md:flex-initial px-4 py-2 bg-danger text-danger-foreground hover:bg-danger/90 transition-all rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t('adminBtnReject')}
                        </button>
                      </div>
                    </div>

                    {/* Teacher profile details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
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
                      <div className="p-3 bg-muted/40 rounded-xl text-xs border border-border">
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
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search user...' : 'Tìm người dùng...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            <div className="glass border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold">
                      <th className="p-4">{t('adminColName')}</th>
                      <th className="p-4">{t('adminColEmail')}</th>
                      <th className="p-4">{t('adminColRole')}</th>
                      <th className="p-4">{language === 'en' ? 'Email Verified' : 'Xác minh Email'}</th>
                      <th className="p-4">{t('adminColStatus')}</th>
                      <th className="p-4">{t('adminColActive')}</th>
                      <th className="p-4 text-right">{t('adminColActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
                                className="bg-muted/60 border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground font-semibold"
                              >
                                <option value="student">{t('studentRole')}</option>
                                <option value="teacher">{t('teacherRole')}</option>
                                <option value="admin">Admin</option>
                              </select>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.email_verified 
                                ? 'bg-success/15 text-success border-success/20' 
                                : 'bg-warning/15 text-warning border-warning/20'
                            }`}>
                              {u.email_verified ? t('emailVerified') : t('emailUnverified')}
                            </span>
                          </td>
                          <td className="p-4">
                            {u.role === 'teacher' && u.teacher_profile ? (
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.teacher_profile.approval_status === 'approved' 
                                  ? 'bg-success/15 text-success border-success/20' 
                                  : u.teacher_profile.approval_status === 'pending'
                                  ? 'bg-warning/15 text-warning border-warning/20'
                                  : 'bg-danger/15 text-danger border-danger/20'
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
                              className={`p-1.5 rounded-xl border transition-all ${
                                u.is_active 
                                  ? 'bg-success/15 text-success border-success/25 hover:bg-success/20' 
                                  : 'bg-danger/15 text-danger border-danger/25 hover:bg-danger/20'
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
                            <span className="text-muted-foreground/50 font-mono text-[10px]">ID: {u.id}</span>
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
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                {language === 'en' ? 'Reject registration request for: ' : 'Từ chối yêu cầu đăng ký của: '}
                <strong className="text-foreground block mt-1 text-sm">{selectedTeacher.profile?.full_name} ({selectedTeacher.email})</strong>
              </div>

              {/* Rejection reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{t('adminModalRejectReasonLabel')}</label>
                <textarea
                  placeholder={t('adminModalRejectReasonPlaceholder')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all text-foreground"
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
                className="px-4 py-2 bg-danger text-danger-foreground rounded-xl text-xs font-bold hover:bg-danger/95 shadow-md shadow-danger/10 flex items-center gap-1.5 cursor-pointer"
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
