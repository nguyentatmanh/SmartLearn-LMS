'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import { 
  GraduationCap, Users, Check, X, Shield, Lock, Unlock, Settings, 
  Globe, Sun, Moon, LogOut, Search, FileText, AlertTriangle, Loader2,
  Menu, CheckCircle2, AlertCircle, HelpCircle, UserCheck, BookOpen,
  Eye, Trash2, Archive, ShieldCheck, LayoutDashboard, Calendar, Phone,
  FileSpreadsheet, ArrowRight
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
  enrolled_courses_count?: number;
  created_courses_count?: number;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  thumbnail_url?: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: number;
  created_at: string;
  teacher: {
    id: number;
    full_name: string;
    email: string;
  };
  lessons_count: number;
  enrollments_count: number;
}

export default function AdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'requests' | 'courses'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Search & Filters
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userVerifyFilter, setUserVerifyFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  // Modal / Drawer state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Reusable Confirmation Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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
      try {
        const usersRes = await api.get('/admin/users');
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Failed to load admin users:', err);
      }

      // Fetch pending requests
      try {
        const requestsRes = await api.get('/admin/teacher-requests');
        setPendingRequests(requestsRes.data);
      } catch (err) {
        console.error('Failed to load pending teacher requests:', err);
      }

      // Fetch courses
      try {
        const coursesRes = await api.get('/admin/courses');
        setCourses(coursesRes.data);
      } catch (err) {
        console.error('Failed to load admin courses:', err);
      }
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
    }, 5000);
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
    // If attempting to deactivate, trigger confirmation first
    if (currentStatus) {
      setConfirmDialog({
        title: t('adminConfirmTitle'),
        message: language === 'en' 
          ? 'Are you sure you want to deactivate this account? The user will not be able to log in.' 
          : 'Bạn có chắc chắn muốn vô hiệu hóa tài khoản này? Người dùng sẽ không thể đăng nhập.',
        onConfirm: async () => {
          setConfirmDialog(null);
          await executeToggleActive(userId, currentStatus);
        }
      });
    } else {
      await executeToggleActive(userId, currentStatus);
    }
  };

  const executeToggleActive = async (userId: number, currentStatus: boolean) => {
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
    setConfirmDialog({
      title: t('adminConfirmTitle'),
      message: language === 'en' 
        ? `Are you sure you want to change this user's role to ${newRole}?` 
        : `Bạn có chắc chắn muốn đổi vai trò của người dùng này thành ${newRole}?`,
      onConfirm: async () => {
        setConfirmDialog(null);
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
      }
    });
  };

  const handleOpenUserDetail = async (u: User) => {
    setSelectedUser(u);
    setUserDetailLoading(true);
    try {
      const res = await api.get(`/admin/users/${u.id}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error("Failed to load user details", err);
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleCourseStatus = async (courseId: number, newStatus: 'draft' | 'published' | 'archived') => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/courses/${courseId}/status`, { status: newStatus });
      showNotification('Course status updated successfully.', 'success');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to update course status.';
      showNotification(detail, 'danger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCourseDelete = async (courseId: number) => {
    setConfirmDialog({
      title: t('adminConfirmTitle'),
      message: language === 'en'
        ? 'Are you sure you want to permanently delete this course? This action is irreversible.'
        : 'Bạn có chắc chắn muốn xóa vĩnh viễn khóa học này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        setConfirmDialog(null);
        setActionLoading(true);
        try {
          await api.delete(`/admin/courses/${courseId}`);
          showNotification('Course deleted successfully.', 'success');
          await fetchData();
        } catch (err: any) {
          console.error(err);
          const detail = err.response?.data?.detail || 'Failed to delete course.';
          showNotification(detail, 'danger');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Hydration guard
  if (!mounted) {
    return null;
  }

  // Loading guard
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

  // Filters calculations
  const filteredUsers = users.filter((u) => {
    const search = userSearchTerm.toLowerCase();
    const fullName = u.profile?.full_name?.toLowerCase() || '';
    const email = u.email.toLowerCase();
    const matchesSearch = fullName.includes(search) || email.includes(search);
    
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || (userStatusFilter === 'active' ? u.is_active : !u.is_active);
    const matchesVerify = userVerifyFilter === 'all' || (userVerifyFilter === 'verified' ? u.email_verified : !u.email_verified);
    
    return matchesSearch && matchesRole && matchesStatus && matchesVerify;
  });

  const filteredCourses = courses.filter((c) => {
    const search = courseSearchTerm.toLowerCase();
    const title = c.title.toLowerCase();
    const instructor = c.teacher?.full_name?.toLowerCase() || c.teacher?.email?.toLowerCase() || '';
    const matchesSearch = title.includes(search) || instructor.includes(search);
    
    const matchesStatus = courseStatusFilter === 'all' || c.status === courseStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics safely
  const totalUsersCount = users.length;
  const studentsCount = users.filter(u => u.role === 'student').length;
  const teachersCount = users.filter(u => u.role === 'teacher').length;
  const pendingRequestsCount = pendingRequests.length;
  const verifiedEmailsCount = users.filter(u => u.email_verified).length;
  const unverifiedEmailsCount = users.filter(u => !u.email_verified).length;
  const activeUsersCount = users.filter(u => u.is_active).length;
  const inactiveUsersCount = users.filter(u => !u.is_active).length;
  
  const totalCoursesCount = courses.length;
  const publishedCoursesCount = courses.filter(c => c.status === 'published').length;
  const draftCoursesCount = courses.filter(c => c.status === 'draft').length;
  const archivedCoursesCount = courses.filter(c => c.status === 'archived').length;

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
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-foreground">{"SmartLearn "}<span className="text-primary">{"LMS"}</span></span>
        </Link>
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
      <aside className={`fixed inset-y-0 left-0 w-64 glass p-6 flex flex-col justify-between z-45 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:min-h-dvh ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight text-foreground">{"SmartLearn "}<span className="text-primary">{"LMS"}</span></span>
          </Link>

          <div className="space-y-1.5">
            <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('adminPanel')}
            </div>
            
            <button 
              onClick={() => {
                setActiveTab('overview');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                activeTab === 'overview' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('adminOverviewTab')}
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
              {t('adminUsersTabUpgrade')}
            </button>

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
              <UserCheck className="h-4 w-4" />
              {t('adminTeacherRequestsTabUpgrade')}
              {pendingRequestsCount > 0 && (
                <span className="ml-auto px-2 py-0.5 text-[10px] bg-danger text-danger-foreground rounded-full font-bold animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => {
                setActiveTab('courses');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                activeTab === 'courses' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              {t('adminCoursesTab')}
            </button>
          </div>
        </div>

        {/* User Card & Settings */}
        <div className="mt-8 pt-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between gap-2 p-1 bg-muted/40 rounded-xl border border-border">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex justify-center cursor-pointer"
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
              className="flex-1 p-2 rounded-lg hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1 cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-xs font-bold transition-all cursor-pointer"
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
                ? 'Comprehensive console to manage students, approve teacher registration, and moderate courses.' 
                : 'Bảng điều khiển toàn diện để quản lý học viên, phê duyệt tài khoản giáo viên và kiểm duyệt khóa học.'}
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
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-xs font-bold">{message.text}</p>
          </div>
        )}

        {/* -------------------- TAB 1: OVERVIEW -------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Metrics Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('adminTotalUsers')}
                  </span>
                  <span className="text-2xl font-extrabold block text-foreground">
                    {totalUsersCount}
                  </span>
                  <span className="block text-[10px] text-muted-foreground/70">
                    {activeUsersCount} {t('adminStatsActiveTitle').toLowerCase()}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('adminStatsTotalCourses')}
                  </span>
                  <span className="text-2xl font-extrabold block text-foreground">
                    {totalCoursesCount}
                  </span>
                  <span className="block text-[10px] text-muted-foreground/70">
                    {publishedCoursesCount} {t('statusPublished').toLowerCase()}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-success/10 text-success">
                  <BookOpen className="h-6 w-6" />
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
                    {language === 'en' ? 'Awaiting verification' : 'Đang chờ xét duyệt'}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-warning/10 text-warning">
                  <UserCheck className="h-6 w-6" />
                </div>
              </div>

              <div className="glass rounded-2xl p-5 border border-border flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {language === 'en' ? 'Verified Accounts' : 'Email đã xác minh'}
                  </span>
                  <span className="text-2xl font-extrabold block text-info">
                    {verifiedEmailsCount}
                  </span>
                  <span className="block text-[10px] text-muted-foreground/70">
                    {unverifiedEmailsCount} {t('emailUnverified').toLowerCase()}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-info/10 text-info">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </section>

            {/* Quick Actions Panel */}
            <section className="glass rounded-2xl p-6 border border-border space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t('adminQuickActions')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('requests')}
                  className="flex items-center justify-between p-4 bg-muted/30 border border-border hover:border-primary/20 rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div>
                    <span className="font-bold text-sm block text-foreground">{t('adminRequestsTab')}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {pendingRequestsCount} pending applications
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center justify-between p-4 bg-muted/30 border border-border hover:border-primary/20 rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div>
                    <span className="font-bold text-sm block text-foreground">{t('adminUsersTabUpgrade')}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {totalUsersCount} user profiles
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('courses')}
                  className="flex items-center justify-between p-4 bg-muted/30 border border-border hover:border-primary/20 rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div>
                    <span className="font-bold text-sm block text-foreground">{t('adminCoursesTab')}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {totalCoursesCount} total curriculum courses
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </section>

            {/* Needs Attention and System Health Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Needs Attention Column */}
              <div className="lg:col-span-7 glass rounded-2xl p-6 border border-border space-y-4">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-extrabold text-base">{t('adminNeedsAttention')}</h3>
                </div>
                <div className="space-y-3">
                  {pendingRequestsCount > 0 && (
                    <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong>{t('adminNeedsAttentionPendingRequests')}</strong>
                        <p className="text-[11px] text-warning/80 mt-0.5">
                          {pendingRequestsCount} teachers are waiting for profile approval.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('requests')}
                        className="px-3 py-1 bg-warning text-warning-foreground font-bold rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        {t('adminBtnApprove')}
                      </button>
                    </div>
                  )}

                  {unverifiedEmailsCount > 0 && (
                    <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong>{t('adminNeedsAttentionUnverified')}</strong>
                        <p className="text-[11px] text-danger/80 mt-0.5">
                          {unverifiedEmailsCount} users have registered but not verified their email.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('users')}
                        className="px-3 py-1 bg-danger text-danger-foreground font-bold rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        {language === 'en' ? 'Manage' : 'Quản lý'}
                      </button>
                    </div>
                  )}

                  {draftCoursesCount > 0 && (
                    <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong>{t('adminNeedsAttentionDraftCourses')}</strong>
                        <p className="text-[11px] text-primary/80 mt-0.5">
                          {draftCoursesCount} courses are in draft mode and not visible.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('courses')}
                        className="px-3 py-1 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
                      >
                        {language === 'en' ? 'Review' : 'Kiểm duyệt'}
                      </button>
                    </div>
                  )}

                  {pendingRequestsCount === 0 && unverifiedEmailsCount === 0 && draftCoursesCount === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                      {language === 'en' ? 'System is healthy. No items require immediate attention.' : 'Hệ thống bình thường. Không có mục nào cần lưu ý.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Breakdown Column */}
              <div className="lg:col-span-5 glass rounded-2xl p-6 border border-border space-y-4">
                <h3 className="font-extrabold text-base text-foreground">
                  {language === 'en' ? 'Platform Details' : 'Chi tiết nền tảng'}
                </h3>
                <div className="space-y-4 text-xs">
                  {/* Users breakdown */}
                  <div className="space-y-2">
                    <span className="font-bold text-muted-foreground block uppercase text-[10px]">
                      {t('adminUsersTabUpgrade')}
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>{t('adminStudents')}</span>
                        <span className="font-semibold">{studentsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('adminTeachers')}</span>
                        <span className="font-semibold">{teachersCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('greetingFallbackAdmin')}</span>
                        <span className="font-semibold">{users.filter(u => u.role === 'admin').length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[1px] bg-border/60" />

                  {/* Courses breakdown */}
                  <div className="space-y-2">
                    <span className="font-bold text-muted-foreground block uppercase text-[10px]">
                      {t('adminCoursesTab')}
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span>{t('adminStatsPublishedCourses')}</span>
                        <span className="font-semibold text-success">{publishedCoursesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('adminStatsDraftCourses')}</span>
                        <span className="font-semibold text-warning">{draftCoursesCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('adminStatsArchivedCourses')}</span>
                        <span className="font-semibold text-muted-foreground">{archivedCoursesCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------- TAB 2: USERS DATABASE -------------------- */}
        {activeTab === 'users' && (
          <section className="space-y-6">
            
            {/* Search + Filters row */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {t('adminUsersTabUpgrade')}
                </h2>
                
                {/* Search Input */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder={t('adminSearchUsersPlaceholder')}
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>
              </div>

              {/* Filters grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Role filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('adminColRole')}</label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-medium"
                  >
                    <option value="all">{language === 'en' ? 'All Roles' : 'Tất cả vai trò'}</option>
                    <option value="student">{t('studentRole')}</option>
                    <option value="teacher">{t('teacherRole')}</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Status filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{t('adminColStatus')}</label>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-medium"
                  >
                    <option value="all">{language === 'en' ? 'All Status' : 'Tất cả trạng thái'}</option>
                    <option value="active">{t('adminStatsActiveTitle')}</option>
                    <option value="inactive">{t('adminStatsInactiveTitle')}</option>
                  </select>
                </div>

                {/* Verification filter */}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{language === 'en' ? 'Email Verified' : 'Xác minh Email'}</label>
                  <select
                    value={userVerifyFilter}
                    onChange={(e) => setUserVerifyFilter(e.target.value as any)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-medium"
                  >
                    <option value="all">{language === 'en' ? 'All Email Status' : 'Tất cả xác thực'}</option>
                    <option value="verified">{t('emailVerified')}</option>
                    <option value="unverified">{t('emailUnverified')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="glass border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
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
                          {language === 'en' ? 'No users found matching filters.' : 'Không tìm thấy người dùng nào phù hợp bộ lọc.'}
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
                              className="bg-muted/60 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary text-foreground font-semibold cursor-pointer"
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
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
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
                            <button
                              onClick={() => handleOpenUserDetail(u)}
                              className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {t('adminBtnViewDetails')}
                            </button>
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

        {/* -------------------- TAB 3: TEACHER APPROVAL REQUESTS -------------------- */}
        {activeTab === 'requests' && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
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

        {/* -------------------- TAB 4: COURSES MODERATION -------------------- */}
        {activeTab === 'courses' && (
          <section className="space-y-6">
            
            {/* Search + Filter row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {language === 'en' ? 'Course Moderation' : 'Kiểm duyệt khóa học'}
              </h2>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder={t('adminSearchCoursesPlaceholder')}
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                {/* Status selector */}
                <select
                  value={courseStatusFilter}
                  onChange={(e) => setCourseStatusFilter(e.target.value as any)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground font-medium cursor-pointer"
                >
                  <option value="all">{language === 'en' ? 'All Course Status' : 'Tất cả trạng thái'}</option>
                  <option value="published">{t('statusPublished')}</option>
                  <option value="draft">{t('statusDraft')}</option>
                  <option value="archived">{t('statusArchived')}</option>
                </select>
              </div>
            </div>

            {/* Courses Table list */}
            <div className="glass border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold">
                      <th className="p-4">{t('adminCourseTitle')}</th>
                      <th className="p-4">{t('adminCourseInstructor')}</th>
                      <th className="p-4">{t('statusLabel')}</th>
                      <th className="p-4">{t('adminCourseLessonsCount')}</th>
                      <th className="p-4">{t('adminCourseEnrollmentsCount')}</th>
                      <th className="p-4">{language === 'en' ? 'Last Updated' : 'Cập nhật cuối'}</th>
                      <th className="p-4 text-right">{t('adminColActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          {t('adminCourseNoCourses')}
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/20 transition-all">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {c.thumbnail_url ? (
                                <img src={c.thumbnail_url} alt="" className="h-8 w-12 rounded bg-muted object-cover border border-border" />
                              ) : (
                                <div className="h-8 w-12 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                                  LMS
                                </div>
                              )}
                              <div>
                                <span className="font-extrabold text-foreground block">{c.title}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">ID: {c.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <span className="font-bold text-foreground block">{c.teacher?.full_name || 'N/A'}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{c.teacher?.email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                              c.status === 'published'
                                ? 'bg-success/15 text-success border-success/20'
                                : c.status === 'draft'
                                ? 'bg-warning/15 text-warning border-warning/20'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}>
                              {c.status === 'published' ? t('statusPublished') : c.status === 'draft' ? t('statusDraft') : t('statusArchived')}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-foreground">
                            {c.lessons_count}
                          </td>
                          <td className="p-4 font-semibold text-foreground">
                            {c.enrollments_count}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {c.status === 'draft' || c.status === 'archived' ? (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleCourseStatus(c.id, 'published')}
                                  className="px-2.5 py-1.5 bg-success/10 hover:bg-success/20 text-success rounded-xl transition-all font-bold text-[10px] cursor-pointer"
                                  title="Publish Course"
                                >
                                  {t('adminCourseActionPublish')}
                                </button>
                              ) : (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleCourseStatus(c.id, 'draft')}
                                  className="px-2.5 py-1.5 bg-warning/10 hover:bg-warning/20 text-warning rounded-xl transition-all font-bold text-[10px] cursor-pointer"
                                  title="Set to Draft"
                                >
                                  {t('adminCourseActionUnpublish')}
                                </button>
                              )}

                              {c.status !== 'archived' && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleCourseStatus(c.id, 'archived')}
                                  className="p-1.5 bg-muted/60 hover:bg-muted text-muted-foreground rounded-xl transition-all cursor-pointer border border-border"
                                  title="Archive Course"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                disabled={actionLoading}
                                onClick={() => handleCourseDelete(c.id)}
                                className="p-1.5 bg-danger/10 hover:bg-danger/25 text-danger rounded-xl transition-all cursor-pointer"
                                title="Delete Course"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
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

      {/* USER PROFILE DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
          <div className="w-full max-w-lg glass border border-border rounded-2xl p-6 shadow-2xl space-y-6 bg-card text-foreground max-h-[90dvh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t('adminModalUserDetailTitle')}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            {userDetailLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Header profile block */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gradient-to-tr from-primary/30 to-indigo-500/20 text-primary text-xl font-bold rounded-full flex items-center justify-center uppercase shrink-0 border border-primary/20">
                    {selectedUser.profile?.full_name?.charAt(0) || selectedUser.email.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-foreground">
                      {selectedUser.profile?.full_name || 'N/A'}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedUser.email}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[9px] bg-primary/10 text-primary font-bold rounded-full border border-primary/20 capitalize">
                        {selectedUser.role}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                        selectedUser.is_active 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {selectedUser.is_active ? t('adminStatsActiveTitle') : t('adminStatsInactiveTitle')}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                        selectedUser.email_verified 
                          ? 'bg-success/10 text-success border-success/20' 
                          : 'bg-warning/10 text-warning border-warning/20'
                      }`}>
                        {selectedUser.email_verified ? t('emailVerified') : t('emailUnverified')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal & Account details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="block text-muted-foreground font-bold">{t('phoneNumberLabel')}</span>
                      <span className="font-semibold">{selectedUser.profile?.phone_number || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="block text-muted-foreground font-bold">{t('dobLabel')}</span>
                      <span className="font-semibold">{selectedUser.profile?.date_of_birth || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="block text-muted-foreground font-bold">{t('adminCreatedDate')}</span>
                      <span className="font-semibold">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Dynamic counts */}
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      {selectedUser.role === 'teacher' ? (
                        <>
                          <span className="block text-muted-foreground font-bold">{t('adminCreatedCoursesCount')}</span>
                          <span className="font-semibold">{selectedUser.created_courses_count ?? 0}</span>
                        </>
                      ) : (
                        <>
                          <span className="block text-muted-foreground font-bold">{t('adminEnrolledCoursesCount')}</span>
                          <span className="font-semibold">{selectedUser.enrolled_courses_count ?? 0}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Teacher Profile Credentials (if teacher) */}
                {selectedUser.role === 'teacher' && selectedUser.teacher_profile && (
                  <div className="border-t border-border/60 pt-4 space-y-4">
                    <span className="text-xs font-bold text-primary block uppercase tracking-wider">
                      {t('sectionTeacherInfo')}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-muted-foreground font-bold">{t('adminFaculty')}</span>
                        <span className="font-semibold">{selectedUser.teacher_profile.faculty}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground font-bold">{t('adminDepartment')}</span>
                        <span className="font-semibold">{selectedUser.teacher_profile.department}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground font-bold">{t('adminSpecialization')}</span>
                        <span className="font-semibold">{selectedUser.teacher_profile.specialization}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground font-bold">{t('adminAcademicTitle')}</span>
                        <span className="font-semibold">{selectedUser.teacher_profile.academic_title || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground font-bold">{t('adminTeacherCode')}</span>
                        <span className="font-semibold">{selectedUser.teacher_profile.teacher_code || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground font-bold">
                          {language === 'en' ? 'Review Status' : 'Trạng thái kiểm duyệt'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                          selectedUser.teacher_profile.approval_status === 'approved'
                            ? 'bg-success/10 text-success border-success/20'
                            : selectedUser.teacher_profile.approval_status === 'pending'
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-danger/10 text-danger border-danger/20'
                        }`}>
                          {selectedUser.teacher_profile.approval_status === 'approved' 
                            ? t('adminLabelApproved') 
                            : selectedUser.teacher_profile.approval_status === 'pending'
                            ? t('adminLabelPending')
                            : t('adminLabelRejected')}
                        </span>
                      </div>
                    </div>

                    {selectedUser.teacher_profile.bio && (
                      <div className="p-3 bg-muted/40 rounded-xl text-xs border border-border">
                        <span className="block font-bold text-muted-foreground mb-1">{t('adminBio')}</span>
                        <p className="text-muted-foreground italic leading-relaxed">{selectedUser.teacher_profile.bio}</p>
                      </div>
                    )}

                    {selectedUser.teacher_profile.rejection_reason && (
                      <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs">
                        <span className="block font-bold mb-1">{t('adminModalRejectReasonLabel')}</span>
                        <p className="italic">{selectedUser.teacher_profile.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'Đóng'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TEACHER REJECTION MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
          <div className="w-full max-w-md glass border border-border rounded-2xl p-6 shadow-2xl space-y-6 bg-card text-foreground">
            
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold">{t('adminModalRejectTitle')}</h3>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted cursor-pointer"
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

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
          <div className="w-full max-w-sm glass border border-border rounded-2xl p-6 shadow-2xl space-y-5 bg-card text-foreground text-center">
            
            <div className="flex flex-col items-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-warning/10 text-warning flex items-center justify-center border border-warning/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold">{confirmDialog.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>

            <div className="flex gap-3 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                {t('adminLabelNo')}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-extrabold hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
              >
                {t('adminLabelYes')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
