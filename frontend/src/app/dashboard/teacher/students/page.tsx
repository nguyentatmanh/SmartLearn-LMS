'use client';

import React, { useState, useEffect, useCallback } from 'react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import {
  Users, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  BookOpen, Clock, CheckCircle2, AlertCircle, X, ExternalLink, Loader2
} from 'lucide-react';

interface StudentListItem {
  student_id: number;
  full_name: string;
  email: string;
  avatar_url?: string;
  enrolled_courses_count: number;
  average_progress_pct: number;
  recent_enrolled_at: string;
  last_activity_at?: string;
}

interface StudentCourseSummary {
  course_id: number;
  course_title: string;
  enrolled_at: string;
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
}

interface StudentDetailData {
  student_id: number;
  full_name: string;
  email: string;
  avatar_url?: string;
  enrolled_courses: StudentCourseSummary[];
  last_activity_at?: string;
}

interface CourseOption {
  id: number;
  title: string;
}

export default function TeacherStudentsPage() {
  const { t, language } = usePreference();

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [progressStatus, setProgressStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('enrolled_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Detail Modal State
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Teacher's Courses for Filter
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await api.get('/courses/teacher/my-courses');
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load course options:', err);
      }
    }
    loadCourses();
  }, []);

  // Fetch Student Roster
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        page_size: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
        progress_status: progressStatus,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCourseId !== 'all') params.course_id = parseInt(selectedCourseId);

      const res = await api.get('/teacher/students', { params });
      setStudents(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotalStudents(res.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('errors.GENERIC_ERROR') || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCourseId, progressStatus, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch Student Detail
  const handleViewDetail = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/teacher/students/${studentId}`);
      setStudentDetail(res.data);
    } catch (err: any) {
      console.error('Failed to fetch student details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return t('teacher.analytics.noActivity') || 'No activity';
    return new Date(isoString).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TeacherSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {t('teacher.students.title') || 'Student Roster'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalStudents} {t('teacher.common.uniqueStudents') || 'Unique Students'}
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('teacher.students.searchPlaceholder') || 'Search student by name or email...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-muted/40 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Course Filter */}
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-muted/40 border border-border/60 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">{t('teacher.students.filterAllCourses') || 'All Courses'}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Progress Status Filter */}
            <select
              value={progressStatus}
              onChange={(e) => {
                setProgressStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-muted/40 border border-border/60 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">{t('teacher.students.statusAll') || 'All Statuses'}</option>
              <option value="not_started">{t('teacher.students.statusNotStarted') || 'Not Started'}</option>
              <option value="in_progress">{t('teacher.students.statusInProgress') || 'In Progress'}</option>
              <option value="completed">{t('teacher.students.statusCompleted') || 'Completed'}</option>
            </select>

            {/* Sort Filter */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-muted/40 border border-border/60 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="enrolled_at-desc">Enrolled Date (Newest)</option>
              <option value="enrolled_at-asc">Enrolled Date (Oldest)</option>
              <option value="full_name-asc">Student Name (A-Z)</option>
              <option value="full_name-desc">Student Name (Z-A)</option>
              <option value="progress-desc">Progress (Highest)</option>
              <option value="progress-asc">Progress (Lowest)</option>
            </select>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">{t('loading') || 'Loading...'}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3 text-rose-500">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-bold text-foreground">No students found</p>
              <p className="text-xs">Try adjusting search query or filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/50 text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Courses</th>
                      <th className="py-3.5 px-4">Average Progress</th>
                      <th className="py-3.5 px-4">Recent Enrolled</th>
                      <th className="py-3.5 px-4">Last Activity</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {students.map((student) => {
                      const initials = student.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={student.student_id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{student.full_name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                              <BookOpen className="w-3.5 h-3.5 text-primary" />
                              {student.enrolled_courses_count}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="w-36 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span>{student.average_progress_pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${student.average_progress_pct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                            {formatDate(student.recent_enrolled_at)}
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                            {formatDate(student.last_activity_at)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleViewDetail(student.student_id)}
                              className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold rounded-lg transition-all cursor-pointer text-xs"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-border/50 flex items-center justify-between gap-4 text-xs font-medium">
                <p className="text-muted-foreground">
                  Showing page <span className="font-bold text-foreground">{page}</span> of{' '}
                  <span className="font-bold text-foreground">{totalPages}</span> ({totalStudents} students)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Student Detail Modal */}
        {selectedStudentId !== null && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border/60 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                <h3 className="font-bold text-base text-foreground">
                  {t('teacher.students.detailTitle') || 'Student Progress Details'}
                </h3>
                <button
                  onClick={closeDetail}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {loadingDetail ? (
                  <div className="py-8 text-center text-muted-foreground space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-xs">{t('loading') || 'Loading student detail...'}</p>
                  </div>
                ) : studentDetail ? (
                  <>
                    {/* Student Identity */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                      <div className="w-12 h-12 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-base shrink-0">
                        {studentDetail.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-bold text-foreground text-sm truncate">{studentDetail.full_name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{studentDetail.email}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                          <Clock className="w-3 h-3 text-primary" />
                          <span>Last active: {formatDate(studentDetail.last_activity_at)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Enrolled Courses Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Enrolled Courses ({studentDetail.enrolled_courses.length})
                      </h4>

                      <div className="space-y-2.5">
                        {studentDetail.enrolled_courses.map((c) => (
                          <div
                            key={c.course_id}
                            className="p-3.5 rounded-xl border border-border/50 bg-card space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-bold text-xs text-foreground line-clamp-1">{c.course_title}</h5>
                              <span className="text-[11px] font-bold text-primary shrink-0">
                                {c.progress_percentage}%
                              </span>
                            </div>

                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${c.progress_percentage}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                              <span>
                                {c.completed_lessons} / {c.total_lessons} lessons completed
                              </span>
                              <span>Enrolled: {new Date(c.enrolled_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">Unable to load details.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherSidebar>
  );
}
