'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { UsersRound, BookOpenCheck, BarChart3, ShieldCheck } from 'lucide-react';
import Reveal from './motion/Reveal';

export default function FeatureHighlights() {
  const { t } = usePreference();

  const features = [
    {
      icon: UsersRound,
      titleKey: 'landing.feature1Title',
      descKey: 'landing.feature1Desc',
      iconColor: '#7367E8',
      bgColor: 'rgba(115, 103, 232, 0.08)',
      hoverBg: 'rgba(115, 103, 232, 0.16)',
      hoverShadow: '0 8px 20px -4px rgba(115, 103, 232, 0.25)',
    },
    {
      icon: BookOpenCheck,
      titleKey: 'landing.feature2Title',
      descKey: 'landing.feature2Desc',
      iconColor: '#2FAE91',
      bgColor: 'rgba(47, 174, 145, 0.08)',
      hoverBg: 'rgba(47, 174, 145, 0.16)',
      hoverShadow: '0 8px 20px -4px rgba(47, 174, 145, 0.25)',
    },
    {
      icon: BarChart3,
      titleKey: 'landing.feature3Title',
      descKey: 'landing.feature3Desc',
      iconColor: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.08)',
      hoverBg: 'rgba(6, 182, 212, 0.16)',
      hoverShadow: '0 8px 20px -4px rgba(6, 182, 212, 0.25)',
    },
    {
      icon: ShieldCheck,
      titleKey: 'landing.feature4Title',
      descKey: 'landing.feature4Desc',
      iconColor: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      hoverBg: 'rgba(245, 158, 11, 0.16)',
      hoverShadow: '0 8px 20px -4px rgba(245, 158, 11, 0.25)',
    },
  ];

  return (
    <section
      id="features"
      className="landing-screen-section bg-[var(--landing-surface)] border-t border-[var(--landing-border)]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 xl:px-10 py-12 lg:py-16 space-y-12">

        {/* Section Header */}
        <Reveal className="text-center max-w-2xl mx-auto space-y-3">
          <span
            className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block"
            style={{ color: 'var(--landing-primary)', backgroundColor: 'var(--landing-soft)' }}
          >
            {t('landing.featuresEyebrow')}
          </span>
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--landing-fg)' }}
          >
            {t('landing.featuresHeading')}
          </h2>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--landing-muted)' }}>
            {t('landing.featuresDesc')}
          </p>
        </Reveal>

        {/* 4 Feature Items with Staggered Scroll Reveal & Icon Micro-Interactions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Reveal key={index} delayMs={index * 80}>
                <div
                  tabIndex={0}
                  className="landing-interactive-card rounded-2xl p-6 space-y-4 border h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] group cursor-default"
                  style={{
                    backgroundColor: 'var(--landing-bg)',
                    borderColor: 'var(--landing-border)',
                  }}
                >
                  <div
                    className="landing-interactive-icon h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: item.bgColor,
                    }}
                  >
                    <IconComponent className="h-6 w-6" style={{ color: item.iconColor }} aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--landing-fg)' }}>
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--landing-muted)' }}>
                      {t(item.descKey)}
                    </p>
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
