'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { GraduationCap, BookOpen, Plus, Loader2, LogOut, Sparkles, FolderClosed, Edit3, Settings } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  thumbnail_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type CourseSchemaType = z.infer<typeof courseSchema>;

export default function TeacherDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: 'draft',
      description: '',
      thumbnail_url: '',
    },
  });

  // Router guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'student') {
        router.push('/dashboard/student');
      }
    }
  }, [user, authLoading, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses/teacher/my-courses');
      setCourses(res.data);
    } catch (e) {
      console.error('Failed to load teacher courses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchCourses();
    }
  }, [user]);

  const onSubmit = async (data: CourseSchemaType) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      await api.post('/courses', {
        title: data.title,
        description: data.description || null,
        thumbnail_url: data.thumbnail_url || null,
        status: data.status,
      });
      reset();
      setShowCreateModal(false);
      await fetchCourses();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setCreateError(err.response.data.detail);
      } else {
        setCreateError('Failed to create course. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-slate-400">Loading teacher workspace...</p>
        </div>
      </div>
    );
  }

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
              Teacher Panel
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-600/10 text-violet-400 font-semibold text-sm transition-colors text-left">
              <BookOpen className="h-4 w-4" />
              My Courses
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
        
        {/* Welcome and Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              Teacher Dashboard
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.full_name}</h1>
            <p className="text-sm text-slate-400">Manage your course catalog, chapters, and curriculum syllabus.</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-sm font-bold flex items-center gap-2 shadow-lg shadow-violet-600/15 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </button>
        </div>

        {/* Course Grid */}
        <section className="space-y-6">
          {courses.length === 0 ? (
            <div className="glass p-16 text-center rounded-2xl border border-white/5 space-y-4">
              <FolderClosed className="h-12 w-12 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-lg">No courses created yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the &quot;Create Course&quot; button at the top right to start adding chapters and lessons.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <div key={c.id} className="glass rounded-xl p-5 border border-white/5 space-y-4 flex flex-col justify-between glass-hover">
                  <div className="space-y-2">
                    <div className="h-32 bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                      {c.thumbnail_url ? (
                        <img src={c.thumbnail_url} alt={c.title} className="object-cover w-full h-full" />
                      ) : (
                        <BookOpen className="h-10 w-10 text-slate-600" />
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        c.status === 'published' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        c.status === 'draft' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-base line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.description || 'No description available.'}</p>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => router.push(`/courses/${c.id}`)}
                      className="flex-grow py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      Manage Syllabus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Create New Course</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Course Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Introduction to Database Design"
                    {...register('title')}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {errors.title && (
                    <span className="text-xs text-red-400">{errors.title.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    placeholder="Provide a brief course overview..."
                    rows={3}
                    {...register('description')}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Thumbnail Image URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/..."
                    {...register('thumbnail_url')}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  {errors.thumbnail_url && (
                    <span className="text-xs text-red-400">{errors.thumbnail_url.message}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="draft">Draft (hidden from catalog)</option>
                    <option value="published">Published (available for enrollment)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
