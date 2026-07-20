'use client';

import React from 'react';
import Link from 'next/link';
import { usePreference } from '@/context/PreferenceContext';
import { GraduationCap } from 'lucide-react';

export default function PublicFooter() {
  const { t } = usePreference();

  return (
    <footer className="bg-card border-t border-border py-10 text-foreground">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-2.5 col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <span className="text-base font-semibold tracking-tight text-foreground">
                SmartLearn <span className="text-primary">LMS</span>
              </span>
            </Link>
            <p className="text-[12px] text-muted-foreground leading-relaxed max-w-[240px]">
              {t('footerDesc')}
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('footerColProduct')}
            </h4>
            <ul className="space-y-1.5 text-[13px] text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors duration-150">
                  {t('navFeatures')}
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-foreground transition-colors duration-150">
                  {t('navSolutions')}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground transition-colors duration-150">
                  {t('navHowItWorks')}
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('footerColPlatform')}
            </h4>
            <ul className="space-y-1.5 text-[13px] text-muted-foreground">
              <li>
                <a href="#responsible-ai" className="hover:text-foreground transition-colors duration-150">
                  {t('navResponsibleAI')}
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors duration-150">
                  {t('login')}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors duration-150">
                  {t('register')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('footerColLegal')}
            </h4>
            <ul className="space-y-1.5 text-[13px] text-muted-foreground">
              <li>{t('footerLinkSecurity')}</li>
              <li>{t('footerLinkPrivacy')}</li>
              <li>{t('footerLinkTerms')}</li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between text-[12px] text-muted-foreground gap-2">
          <p>© 2026 {t('footerRights')}</p>
          <p>Powered by Next.js, FastAPI & PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
