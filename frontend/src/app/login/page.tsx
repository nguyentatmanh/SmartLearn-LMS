'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import AppHeader from '@/components/Header';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = usePreference();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Invalid email or password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      <AppHeader />
      
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Background decoration */}
        <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md glass rounded-2xl p-6 sm:p-8 border border-border relative shadow-xl space-y-6 fade-in">
          
          {/* Logo and header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{t('loginTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
          </div>

          {/* Global error display */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">{t('emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-danger font-medium">{errors.email.message}</span>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground">{t('passwordLabel')}</label>
                <a href="#" className="text-xs font-semibold text-primary hover:text-primary/85 transition-colors">
                  {t('forgotPass')}
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-danger font-medium">{errors.password.message}</span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground disabled:bg-primary/50 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-primary/10 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('loginBtnLoading')}
                </>
              ) : (
                t('loginBtn')
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-xs text-muted-foreground">
            {t('noAccount')}{' '}
            <Link href="/register" className="font-bold text-primary hover:text-primary/85 transition-colors">
              {t('registerNow')}
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
