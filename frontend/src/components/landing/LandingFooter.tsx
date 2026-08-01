'use client';

import React from 'react';
import Link from 'next/link';
import { usePreference } from '@/context/PreferenceContext';
import SmartLearnLogo from '@/components/brand/SmartLearnLogo';
import Reveal from './motion/Reveal';

export default function LandingFooter() {
  const { t } = usePreference();

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="py-12"
      style={{
        backgroundColor: 'var(--landing-surface)',
        borderTop: '1px solid var(--landing-border)',
      }}
    >
      <Reveal className="mx-auto w-full max-w-[1440px] px-6 md:px-8 xl:px-10 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand Info */}
          <div className="space-y-3.5 col-span-2 md:col-span-1">
            <Link href="/" aria-label="SmartLearn LMS" className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)]">
              <SmartLearnLogo variant="compact" markSize={32} />
            </Link>
            <p className="text-[14px] font-medium leading-relaxed max-w-[280px]" style={{ color: 'var(--landing-primary)' }}>
              {t('landing.heroSlogan')}
            </p>
            <p className="text-[13px] leading-relaxed max-w-[280px]" style={{ color: 'var(--landing-muted)' }}>
              {t('landing.footerDesc')}
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3.5">
            <h4
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--landing-muted)' }}
            >
              {t('landing.footerProduct')}
            </h4>
            <ul className="space-y-2.5 text-[13px]" style={{ color: 'var(--landing-muted)' }}>
              <li>
                <a
                  href="#features"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('landing.navFeatures')}
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('landing.navHowItWorks')}
                </a>
              </li>
              <li>
                <a
                  href="#security"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('landing.navSecurity')}
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="space-y-3.5">
            <h4
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--landing-muted)' }}
            >
              {t('landing.footerSolutions')}
            </h4>
            <ul className="space-y-2.5 text-[13px]" style={{ color: 'var(--landing-muted)' }}>
              <li>
                <a
                  href="#solutions"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('landing.studentCardTitle')}
                </a>
              </li>
              <li>
                <a
                  href="#solutions"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('landing.teacherCardTitle')}
                </a>
              </li>
              <li>
                <a
                  href="#solutions"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('landing.adminCardTitle')}
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3.5">
            <h4
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--landing-muted)' }}
            >
              {t('landing.footerPlatform')}
            </h4>
            <ul className="space-y-2.5 text-[13px]" style={{ color: 'var(--landing-muted)' }}>
              <li>
                <Link
                  href="/login"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('login')}
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="transition-colors duration-150 hover:text-[var(--landing-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] rounded"
                  style={{ color: 'var(--landing-muted)' }}
                >
                  {t('register')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[12px] gap-2"
          style={{
            borderTop: '1px solid var(--landing-border)',
            color: 'var(--landing-muted)',
          }}
        >
          <p>© {currentYear} SmartLearn LMS. All rights reserved.</p>
        </div>
      </Reveal>
    </footer>
  );
}
