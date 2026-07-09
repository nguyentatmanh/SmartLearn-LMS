'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, Brain, ShieldCheck, Sparkles, BookOpen, Clock, BarChart3, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden">
      
      {/* Decorative Radial Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-violet-500" />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              SmartLearn <span className="text-violet-500">LMS</span>
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href={user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'}
                  className="text-sm font-semibold hover:text-violet-400 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold hover:text-violet-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center py-20 lg:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-violet-500/20 text-xs font-semibold text-violet-400">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              Next-Generation Online Education
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
              AI-Powered Learning &<br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Online Exams
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0">
              Create curriculum-aligned courses, structure lessons, build robust question banks, and administer secure timed assessments with real-time AI study support and class analytics.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 transition-colors shadow-xl shadow-violet-600/20 flex items-center justify-center gap-2 group"
              >
                Start Learning Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center"
              >
                Administer Exams
              </Link>
            </div>
          </div>

          {/* Graphical Mockup Card */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-md glass rounded-2xl p-6 border border-white/10 relative shadow-2xl relative">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-violet-600 text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg shadow-violet-600/30">
                <Brain className="h-3 w-3" /> AI Active
              </div>

              <div className="space-y-4">
                <div className="h-4 w-1/3 bg-slate-800 rounded-full" />
                <div className="h-8 w-3/4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg" />
                
                <div className="border border-white/5 rounded-xl p-4 bg-[#141b2e]/60 space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Mock Exam Set #1</span>
                    <span className="text-violet-400">40 Questions</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-violet-500 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Progress: 66% Completed</span>
                    <span className="text-slate-400">Time Limit: 60m</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="glass p-3 rounded-xl text-center space-y-1.5">
                    <BookOpen className="h-4 w-4 text-violet-400 mx-auto" />
                    <div className="text-[10px] text-slate-400">Lessons</div>
                  </div>
                  <div className="glass p-3 rounded-xl text-center space-y-1.5">
                    <Clock className="h-4 w-4 text-indigo-400 mx-auto" />
                    <div className="text-[10px] text-slate-400">Timed Quiz</div>
                  </div>
                  <div className="glass p-3 rounded-xl text-center space-y-1.5">
                    <BarChart3 className="h-4 w-4 text-purple-400 mx-auto" />
                    <div className="text-[10px] text-slate-400">Analytics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="border-t border-white/5 py-16 bg-[#0c1222]/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 bg-violet-500/10 text-violet-400 flex items-center justify-center rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Role-Based Workspaces</h3>
              <p className="text-sm text-slate-400">
                Customized, secure dashboards for Students and Teachers. Strict backend object-level permission models prevent unauthorized actions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 flex items-center justify-center rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Comprehensive Assessment</h3>
              <p className="text-sm text-slate-400">
                Design custom quizzes for self-practice or administer strictly timed exams with auto-grading, randomized questions, and immutable attempts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass p-6 rounded-xl space-y-4">
              <div className="h-10 w-10 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-lg">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">AI Support (Roadmap)</h3>
              <p className="text-sm text-slate-400">
                Auto-generate questions from syllabus PDFs, get contextual help on wrong answers, and consult the AI Study Assistant for enrolled lectures.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>© 2026 SmartLearn LMS. Powered by FastAPI, Next.js & PostgreSQL.</p>
      </footer>

    </div>
  );
}
