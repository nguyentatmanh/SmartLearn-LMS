'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import AppHeader from '@/components/Header';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, Edit3, ArrowRight } from 'lucide-react';

function maskEmail(emailStr: string): string {
  if (!emailStr || !emailStr.includes('@')) return emailStr;
  const [local, domain] = emailStr.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function VerifyEmailForm() {
  const { t } = usePreference();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchEmail = searchParams.get('email');
  
  // Resolve initial email
  const initialEmail =
    user?.email ||
    searchEmail ||
    (typeof window !== 'undefined' ? localStorage.getItem('pending_verify_email') : '') ||
    '';

  const [email, setEmail] = useState(initialEmail);
  const [isLocked, setIsLocked] = useState(Boolean(user?.email || searchEmail || initialEmail));
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Sync email when auth user loads or param changes
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setIsLocked(true);
    } else if (searchEmail) {
      setEmail(searchEmail);
      setIsLocked(true);
    }
  }, [user, searchEmail]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Verification submit handler
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMsg(t('emailLabel') + ' is required.');
      return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setErrorMsg(t('otpPlaceholder'));
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.post('/auth/verify-email-otp', {
        email: targetEmail,
        otp: otp.trim(),
      });

      if (isAuthenticated && user) {
        // Update cached user in localStorage if logged in
        const updatedUser = { ...user, email_verified: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSuccessMsg(t('verifySuccessAuth'));

        setTimeout(() => {
          if (user.role === 'teacher') router.push('/dashboard/teacher');
          else if (user.role === 'admin') router.push('/dashboard/admin');
          else router.push('/dashboard/student');
        }, 1500);
      } else {
        setSuccessMsg(t('verifySuccess'));
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Email verification error:', err);
      if (err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg(t('loginUnverifiedError'));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    const targetEmail = email.trim();
    if (!targetEmail && !isAuthenticated) {
      setErrorMsg(t('emailLabel') + ' is required.');
      return;
    }
    if (cooldown > 0) return;

    setIsResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.post('/auth/resend-email-otp', { email: targetEmail });
      setSuccessMsg(t('genericResendSuccess'));
      setCooldown(60);
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      if (err.response?.status === 429) {
        setErrorMsg(err.response.data.detail);
      } else if (err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg(t('genericResendSuccess'));
      }
    } finally {
      setIsResending(false);
    }
  };

  const maskedDisplay = maskEmail(email);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      <AppHeader />

      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="w-full max-w-md bg-card/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-border/70 relative shadow-2xl space-y-6">
          
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-1 text-primary">
              <Mail className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {t('verifyEmailTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('verifyEmailSubtitle').replace(
                '{email}',
                email ? maskedDisplay : (t('verifyingForEmail') || 'your email')
              )}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/25 text-danger text-xs rounded-2xl">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-success/10 border border-success/25 text-success text-xs rounded-2xl text-left">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            
            {/* Email Field (Locked Badge vs Input) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {t('emailLabel')}
                </label>
                {!isAuthenticated && isLocked && (
                  <button
                    type="button"
                    onClick={() => setIsLocked(false)}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>{t('changeEmailLink')}</span>
                  </button>
                )}
              </div>

              {isLocked ? (
                <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border border-border/80 rounded-2xl text-sm font-semibold text-foreground">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate font-mono">{maskedDisplay}</span>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                    {isAuthenticated ? 'Authenticated' : 'Prefilled'}
                  </span>
                </div>
              ) : (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-muted/40 border border-border/80 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              )}
            </div>

            {/* OTP Code Input */}
            <div className="space-y-1.5 text-center">
              <label htmlFor="otp" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-left">
                {t('otpLabel')}
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('otpPlaceholder')}
                className="text-center font-mono tracking-[0.5em] text-2xl bg-muted/40 border border-border/80 rounded-2xl py-3.5 px-4 w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('verifyBtnLoading')}</span>
                </>
              ) : (
                <>
                  <span>{t('verifyBtn')}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Cooldown & Sign In Nav */}
          <div className="pt-2 text-center flex flex-col items-center justify-center gap-3 text-xs border-t border-border/60">
            <button
              type="button"
              disabled={cooldown > 0 || isResending}
              onClick={handleResend}
              className="font-bold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
              {cooldown > 0 
                ? t('resendBtnCooldown').replace('{seconds}', cooldown.toString())
                : t('resendBtn')}
            </button>

            {!isAuthenticated && (
              <span className="text-muted-foreground">
                {t('hasAccount')}{' '}
                <Link href="/login" className="text-primary hover:underline font-bold">
                  {t('signInNow')}
                </Link>
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
