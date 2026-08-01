'use client';

import React from 'react';
import Link from 'next/link';
import { usePreference } from '@/context/PreferenceContext';
import { GraduationCap, BookOpenCheck, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import Reveal from './motion/Reveal';

export default function LandingRoleSolutions() {
  const { t } = usePreference();

  const roles = [
    {
      titleKey: 'landing.studentCardTitle',
      icon: GraduationCap,
      iconColor: '#5B46D8',
      iconBg: 'rgba(91, 70, 216, 0.1)',
      items: ['landing.studentItem1', 'landing.studentItem2', 'landing.studentItem3'],
    },
    {
      titleKey: 'landing.teacherCardTitle',
      icon: BookOpenCheck,
      iconColor: '#7367E8',
      iconBg: 'rgba(115, 103, 232, 0.1)',
      items: ['landing.teacherItem1', 'landing.teacherItem2', 'landing.teacherItem3'],
    },
    {
      titleKey: 'landing.adminCardTitle',
      icon: ShieldCheck,
      iconColor: '#2FAE91',
      iconBg: 'rgba(47, 174, 145, 0.1)',
      items: ['landing.adminItem1', 'landing.adminItem2', 'landing.adminItem3'],
    },
  ];

  return (
    <section id="solutions" className="landing-screen-section bg-[var(--landing-soft)] border-t border-[var(--landing-border)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 xl:px-10 py-12 lg:py-16 space-y-12">

        {/* Section Header */}
        <Reveal className="text-center max-w-2xl mx-auto space-y-3">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--landing-fg)' }}
          >
            {t('landing.solutionsTitle')}
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--landing-muted)' }}>
            {t('landing.solutionsSub')}
          </p>
        </Reveal>

        {/* 3 Role Cards with Staggered Scroll Reveal & Micro-Interactions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {roles.map((role, idx) => {
            const IconComp = role.icon;
            return (
              <Reveal key={idx} delayMs={idx * 90}>
                <div
                  className="landing-interactive-card rounded-2xl p-6 lg:p-8 space-y-5 flex flex-col justify-between h-full group focus-within:ring-2 focus-within:ring-[var(--landing-primary)]"
                  style={{
                    backgroundColor: 'var(--landing-surface)',
                    border: '1px solid var(--landing-border)',
                  }}
                >
                  <div className="space-y-5">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-3">
                      <div
                        className="landing-interactive-icon h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: role.iconBg }}
                      >
                        <IconComp className="h-5 w-5" style={{ color: role.iconColor }} aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--landing-fg)' }}>
                        {t(role.titleKey)}
                      </h3>
                    </div>

                    {/* Feature Items */}
                    <ul className="space-y-3">
                      {role.items.map((itemKey, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="h-4 w-4 shrink-0 mt-0.5"
                            style={{ color: 'var(--landing-success)' }}
                            aria-hidden="true"
                          />
                          <span className="text-[14px] leading-relaxed" style={{ color: 'var(--landing-fg)' }}>
                            {t(itemKey)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Link with Arrow Translation */}
                  <div className="pt-2">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 text-[14px] font-semibold transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)]"
                      style={{ color: 'var(--landing-primary)' }}
                    >
                      <span>{t('register')}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
