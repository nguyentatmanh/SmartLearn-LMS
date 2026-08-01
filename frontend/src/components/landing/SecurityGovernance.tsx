'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { MailCheck, Lock, UserCheck, FileSearch } from 'lucide-react';
import Reveal from './motion/Reveal';

export default function SecurityGovernance() {
  const { t } = usePreference();

  const principles = [
    {
      icon: MailCheck,
      titleKey: 'landing.secPrinciple1Title',
      descKey: 'landing.secPrinciple1Desc',
      iconColor: '#5B46D8',
      iconBg: 'rgba(91, 70, 216, 0.1)',
    },
    {
      icon: Lock,
      titleKey: 'landing.secPrinciple2Title',
      descKey: 'landing.secPrinciple2Desc',
      iconColor: '#7367E8',
      iconBg: 'rgba(115, 103, 232, 0.1)',
    },
    {
      icon: UserCheck,
      titleKey: 'landing.secPrinciple3Title',
      descKey: 'landing.secPrinciple3Desc',
      iconColor: '#2FAE91',
      iconBg: 'rgba(47, 174, 145, 0.1)',
    },
    {
      icon: FileSearch,
      titleKey: 'landing.secPrinciple4Title',
      descKey: 'landing.secPrinciple4Desc',
      iconColor: '#F59E0B',
      iconBg: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <section id="security" className="landing-screen-section bg-[var(--landing-soft)] border-t border-[var(--landing-border)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 xl:px-10 py-12 lg:py-16 space-y-12">

        {/* Section Header */}
        <Reveal className="text-center max-w-2xl mx-auto space-y-3">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--landing-fg)' }}
          >
            {t('landing.securityTitle')}
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--landing-muted)' }}>
            {t('landing.securitySub')}
          </p>
        </Reveal>

        {/* 4 Principle Cards with Staggered Scroll Reveal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <Reveal key={idx} delayMs={idx * 75}>
                <div
                  tabIndex={0}
                  className="landing-interactive-card rounded-2xl p-6 space-y-4 border h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] cursor-default"
                  style={{
                    backgroundColor: 'var(--landing-surface)',
                    borderColor: 'var(--landing-border)',
                  }}
                >
                  <div
                    className="landing-interactive-icon h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: item.iconBg }}
                  >
                    <IconComp className="h-5 w-5" style={{ color: item.iconColor }} aria-hidden="true" />
                  </div>
                  <h3 className="text-[15px] font-bold" style={{ color: 'var(--landing-fg)' }}>
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--landing-muted)' }}>
                    {t(item.descKey)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
