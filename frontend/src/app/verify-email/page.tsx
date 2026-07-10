'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { usePreference } from '@/context/PreferenceContext';
import AppHeader from '@/components/Header';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

function VerifyEmailForm() {
  const { t } = usePreference();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  // Sync email search parameter if present
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Verification request handler
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setErrorMsg('Verification code must be exactly 6 numeric digits.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.post('/auth/verify-email-otp', { email, otp });
      setSuccessMsg(t('verifySuccess'));
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Email verification failed. Please check the code and try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend request handler
  const handleResend = async () => {
    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (cooldown > 0) return;

    setIsResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.post('/auth/resend-email-otp', { email });
      setSuccessMsg(t('genericResendSuccess'));
      setCooldown(60); // Reset timer
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg('Failed to resend verification code. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
      <AppHeader />
      
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md glass rounded-2xl p-6 sm:p-8 border border-border relative shadow-xl space-y-6 fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-2">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{t('verifyEmailTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('verifyEmailSubtitle').replace('{email}', email || 'your email')}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/25 text-danger text-sm rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 p-3 bg-success/10 border border-success/25 text-success text-sm rounded-lg text-left">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-background/50 border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-1 text-center">
              <label htmlFor="otp" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-left">
                {t('otpLabel')}
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center font-mono tracking-[0.5em] text-2xl bg-background/50 border border-border rounded-lg p-3 w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-muted-foreground/50"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg p-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('verifyBtnLoading')}
                </>
              ) : (
                t('verifyBtn')
              )}
            </button>
          </form>

          {/* Cooldown controls */}
          <div className="pt-2 text-center flex flex-col items-center justify-center gap-2 text-sm border-t border-border/50">
            <button
              type="button"
              disabled={cooldown > 0 || isResending}
              onClick={handleResend}
              className="font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
              {cooldown > 0 
                ? t('resendBtnCooldown').replace('{seconds}', cooldown.toString())
                : t('resendBtn')}
            </button>

            <span className="text-xs text-muted-foreground">
              {t('hasAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('signInNow')}
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
