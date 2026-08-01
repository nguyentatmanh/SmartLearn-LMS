'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import HeroIllustration from './HeroIllustration';

export default function LandingHero() {
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

  const handleHeroCTA = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuth) {
      e.preventDefault();
      const target = document.getElementById('features');
      if (target) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
        window.history.pushState(null, '', '#features');
      }
    }
  };

  return (
    <section id="home" className="landing-screen-section bg-[var(--landing-bg)] overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[520px] -z-10 opacity-30 pointer-events-none landing-pulse-slow"
        style={{
          background: 'radial-gradient(ellipse at 35% 20%, var(--landing-soft) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 xl:px-10 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.04fr_0.96fr] items-center gap-12 lg:gap-16">

          {/* Left Column: Restrained Staggered Entrance Sequence */}
          <div className="space-y-6 text-center lg:text-left relative max-w-[760px]">

            {/* Main Headline */}
            <h1
              className="text-[40px] sm:text-[52px] lg:text-[62px] 2xl:text-[68px] leading-[1.06] tracking-[-0.045em] font-extrabold"
              style={{ color: 'var(--landing-fg)' }}
            >
              <span className="inline-block landing-animate-fade-up" style={{ animationDelay: '0ms' }}>
                {t('landing.heroLine1')}{' '}
              </span>
              <span className="inline-block landing-gradient-text landing-animate-fade-up" style={{ animationDelay: '100ms' }}>
                {t('landing.heroLine2')}
              </span>
            </h1>

            {/* Long Subtle Circuit-Line Accent (Desktop only) */}
            <div
              className="hidden lg:block absolute -right-24 top-[45%] -translate-y-1/2 w-[320px] h-[12px] pointer-events-none opacity-20"
              aria-hidden="true"
            >
              <svg width="320" height="12" viewBox="0 0 320 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 6 H260 L280 2 H310" stroke="url(#hero-long-circuit-grad)" strokeWidth="1.5" strokeDasharray="6 4" />
                <path d="M40 10 H220 L240 10 H290" stroke="url(#hero-long-circuit-grad)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="310" cy="2" r="3" fill="#06B6D4" />
                <circle cx="290" cy="10" r="2.5" fill="#7367E8" />
                <defs>
                  <linearGradient id="hero-long-circuit-grad" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5B46D8" stopOpacity="0" />
                    <stop offset="40%" stopColor="#7367E8" />
                    <stop offset="80%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#2FAE91" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Hero Slogan */}
            <p
              className="mt-4 text-[22px] sm:text-[28px] lg:text-[32px] 2xl:text-[36px] font-normal leading-snug text-[#746C9F] landing-animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              {t('landing.heroSlogan')}
            </p>

            {/* Single Dominant Primary CTA */}
            <div
              className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start landing-animate-fade-up"
              style={{ animationDelay: '320ms' }}
            >
              <a
                href={isAuth ? getDashboardUrl() : '#features'}
                onClick={handleHeroCTA}
                className="landing-interactive-btn w-full sm:w-[240px] h-[58px] px-8 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl flex items-center justify-center gap-2.5 group text-[16px] cursor-pointer"
                style={{ background: 'var(--landing-gradient)' }}
              >
                <span>{isAuth ? t('dashboard') : t('landing.heroCTAPrimary')}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-200" aria-hidden="true" />
              </a>
            </div>

            {/* Trust Line */}
            <div
              className="pt-2 flex items-center justify-center lg:justify-start gap-2 text-[13px] landing-animate-fade-up"
              style={{ animationDelay: '420ms', color: 'var(--landing-muted)' }}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--landing-success)' }} aria-hidden="true" />
              <span>
                {t('landing.trustSecurity')} · {t('landing.trustRoles')} · {t('landing.trustProgress')}
              </span>
            </div>

          </div>

          {/* Right Column: Hero Illustration Entrance */}
          <div
            className="w-full flex justify-center lg:justify-end landing-animate-hero-scale"
            style={{ animationDelay: '250ms' }}
          >
            <HeroIllustration />
          </div>

        </div>
      </div>
    </section>
  );
}
