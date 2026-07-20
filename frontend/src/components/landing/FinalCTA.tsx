'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
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
    <section className="py-16 lg:py-20">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-2xl bg-card border border-border text-center space-y-5 relative overflow-hidden">
          
          <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t('finalCTATitle')}
            </h2>
            <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
              {t('finalCTASub')}
            </p>
          </div>

          <div>
            <Link
              href={isAuth ? getDashboardUrl() : "/register"}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 shadow-sm"
            >
              <span>{isAuth ? t('dashboard') : t('finalCTABtn')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
