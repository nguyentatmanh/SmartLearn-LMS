'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import ProductPreview from './ProductPreview';

export default function HeroSection() {
  const { isAuthenticated, user } = useAuth();
  const { t } = usePreference();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAuth = mounted && isAuthenticated;

  const getDashboardUrl = () => {
    if (user?.role === 'admin') return '/dashboard/admin';
    return user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
  };

  return (
    <section className="relative pt-10 pb-14 lg:pt-14 lg:pb-20 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            
            {/* Tagline — subtle, no border */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.08] text-[12px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span>{t('heroTaglineNew')}</span>
            </div>

            {/* Main Headline */}
            <h1
              className="font-extrabold tracking-tight leading-[1.12] text-foreground"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('heroHeadlinePrimary')}{' '}
              <span className="text-primary">
                {t('heroHeadlineAccent')}
              </span>
            </h1>

            {/* Description */}
            <p className="text-[15px] sm:text-base text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-[1.7]">
              {t('heroDescNew')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1">
              <Link
                href={isAuth ? getDashboardUrl() : "/register"}
                className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 shadow-sm flex items-center justify-center gap-2 group text-sm"
              >
                <span>{isAuth ? t('dashboard') : t('heroCTAPrimary')}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-150" aria-hidden="true" />
              </Link>
              
              {!isAuth && (
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold border border-border hover:bg-muted text-foreground transition-colors duration-150 flex items-center justify-center text-sm active:scale-[0.98]"
                >
                  {t('heroCTASecondary')}
                </Link>
              )}
            </div>

            {/* Trust Line */}
            <div className="pt-1 flex items-center justify-center lg:justify-start gap-2 text-[12px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
              <span>{t('heroTrustLine')}</span>
            </div>
          </div>

          {/* Right Product Preview */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <ProductPreview />
          </div>

        </div>
      </div>
    </section>
  );
}
