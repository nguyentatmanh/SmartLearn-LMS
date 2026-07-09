'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { GraduationCap, BookOpen, Search, LogOut, Loader2, Sparkles, BookCheck, Check } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  status: string;
  teacher_name: string;
  is_enrolled: boolean;
  progress_percentage: number;
}

export default function StudentDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrollSubmitting, setEnrollSubmitting] = useState<number | null>(null);

  // Router guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'teacher') {
        router.push('/dashboard/teacher');
      }
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch catalog
      const catalogRes = await api.get('/courses');
      setCourses(catalogRes.data);

      // Fetch enrolled
      const enrolledRes = await api.get('/courses/student/enrolled');
      setEnrolledCourses(enrolledRes.data);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchData();
    }
  }, [user]);

  const handleEnroll = async (courseId: number) => {
    setEnrollSubmitting(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      await fetchData();
    } catch (e) {
      console.error('Enrollment failed:', e);
    } finally {
      setEnrollSubmitting(null);
    }
  };

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-slate-400">Loading student workspace...</p>
        </div>
      </div>
    );
  }

  // Filter out courses that student is already enrolled in for the browse catalog
  const filteredCatalog = courses
    .filter(c => !enrolledCourses.some(ec => ec.id === c.id))
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b0f19]">
      
      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 glass lg:border-r border-white/5 lg:min-h-screen flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-violet-500" />
            <span className="font-extrabold text-lg tracking-tight">SmartLearn</span>
          </div>

          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Student Panel
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-600/10 text-violet-400 font-semibold text-sm transition-colors text-left">
              <BookOpen className="h-4 w-4" />
              My Learning
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-violet-500/20 text-violet-400 font-bold rounded-full flex items-center justify-center uppercase">
              {user?.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main dashboard content */}
      <main className="flex-grow p-6 lg:p-10 space-y-10 max-w-7xl mx-auto w-full">
        
        {/* Welcome Banner */}
        <div className="glass p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1 relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.full_name}!
            </h1>
            <p className="text-sm text-slate-400">
              Ready to learn? Access your courses below or browse available subjects.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            SmartLearn Student
          </div>
        </div>

        {/* Section 1: Enrolled Courses */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <BookCheck className="h-5 w-5 text-violet-400" />
            <h2 className="text-xl font-bold">Enrolled Courses ({enrolledCourses.length})</h2>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="glass p-10 text-center rounded-2xl border border-white/5 space-y-4">
              <p className="text-slate-400 text-sm">You are not enrolled in any courses yet.</p>
              <p className="text-xs text-slate-500">Browse the catalog below to find a course and click Enroll!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((c) => (
                <div key={c.id} className="glass rounded-xl p-5 border border-white/5 space-y-4 flex flex-col justify-between glass-hover">
                  <div className="space-y-2">
                    <div className="h-32 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-slate-600" />
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-violet-400 tracking-wider uppercase">
                      Instructor: {c.teacher_name}
                    </span>
                    <h3 className="font-bold text-base line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.description || 'No description available.'}</p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-bold text-violet-400">{c.progress_percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${c.progress_percentage}%` }} />
                    </div>
                    
                    <button
                      onClick={() => router.push(`/courses/${c.id}`)}
                      className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg text-xs font-bold"
                    >
                      Enter Course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Browse Catalog */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold">Browse Courses</h2>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-white/5 rounded-xl text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="glass p-10 text-center rounded-2xl border border-white/5">
              <p className="text-slate-500 text-xs">No new courses available in the catalog matching your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalog.map((c) => (
                <div key={c.id} className="glass rounded-xl p-5 border border-white/5 space-y-4 flex flex-col justify-between glass-hover">
                  <div className="space-y-2">
                    <div className="h-32 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-slate-600" />
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                      Instructor: {c.teacher_name}
                    </span>
                    <h3 className="font-bold text-base line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.description || 'No description available.'}</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleEnroll(c.id)}
                      disabled={enrollSubmitting !== null}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 transition-colors rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {enrollSubmitting === c.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        'Enroll Now'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
