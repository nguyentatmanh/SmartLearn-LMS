'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { ArrowRight } from 'lucide-react';
import Reveal from './motion/Reveal';

export default function LandingCTA() {
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
    <section className="py-16 lg:py-24">
      <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div
            className="landing-interactive-card relative rounded-3xl p-10 sm:p-14 text-center space-y-6 overflow-hidden"
            style={{ background: 'var(--landing-gradient)' }}
          >
            {/* Subtle radial decoration */}
            <div
              className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full -translate-y-1/2 translate-x-1/3 opacity-20 pointer-events-none landing-pulse-slow"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full translate-y-1/2 -translate-x-1/3 opacity-15 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
              aria-hidden="true"
            />

            <div className="space-y-3 max-w-lg mx-auto relative z-10">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                {t('landing.ctaTitle')}
              </h2>
              <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed">
                {t('landing.ctaDesc')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link
                href={isAuth ? getDashboardUrl() : '/register'}
                className="landing-interactive-btn w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-[15px] shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{
                  backgroundColor: 'white',
                  color: '#5B46D8',
                }}
              >
                <span>{isAuth ? t('dashboard') : t('landing.ctaPrimary')}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
              </Link>

              {!isAuth && (
                <Link
                  href="/login"
                  className="landing-interactive-btn w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-[15px] text-white flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{
                    border: '1px solid rgba(255,255,255,0.3)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  {t('landing.ctaSecondary')}
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
