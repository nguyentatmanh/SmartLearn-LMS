'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, Mail, Lock, User, Loader2, AlertCircle, Shield } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'teacher'], {
    required_error: 'Role selection is required',
  }),
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterSchemaType) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await registerUser(data.email, data.password, data.fullName, data.role);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Registration failed. Please make sure email is unique and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md glass rounded-2xl p-8 border border-white/10 relative shadow-2xl space-y-6">
        
        {/* Logo and header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 rounded-xl mb-2">
            <GraduationCap className="h-8 w-8 text-violet-500" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Create Account</h2>
          <p className="text-sm text-slate-400">Join SmartLearn LMS to begin your education journey</p>
        </div>

        {/* Global error display */}
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Registration form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Full Name field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="John Doe"
                {...register('fullName')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            {errors.fullName && (
              <span className="text-xs text-red-400 font-medium">{errors.fullName.message}</span>
            )}
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-400 font-medium">{errors.email.message}</span>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            {errors.password && (
              <span className="text-xs text-red-400 font-medium">{errors.password.message}</span>
            )}
          </div>

          {/* Role selector field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Register as a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('role', 'student')}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'student'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400 shadow-md'
                    : 'border-white/10 bg-slate-900/20 text-slate-400 hover:bg-slate-900/40'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'teacher')}
                className={`py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'teacher'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400 shadow-md'
                    : 'border-white/10 bg-slate-900/20 text-slate-400 hover:bg-slate-900/40'
                }`}
              >
                <Shield className="h-4 w-4" />
                Teacher
              </button>
            </div>
            {errors.role && (
              <span className="text-xs text-red-400 font-medium">{errors.role.message}</span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-violet-600/10 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
