'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { UserPlus, LayoutGrid, TrendingUp } from 'lucide-react';
import Reveal from './motion/Reveal';

export default function HowItWorks() {
  const { t } = usePreference();

  const steps = [
    {
      num: '01',
      titleKey: 'landing.step1Title',
      descKey: 'landing.step1Desc',
      icon: UserPlus,
      iconColor: '#5B46D8',
    },
    {
      num: '02',
      titleKey: 'landing.step2Title',
      descKey: 'landing.step2Desc',
      icon: LayoutGrid,
      iconColor: '#7367E8',
    },
    {
      num: '03',
      titleKey: 'landing.step3Title',
      descKey: 'landing.step3Desc',
      icon: TrendingUp,
      iconColor: '#2FAE91',
    },
  ];

  return (
    <section id="how-it-works" className="landing-screen-section bg-[var(--landing-surface)] border-t border-[var(--landing-border)]">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 xl:px-10 py-12 lg:py-16 space-y-14">

        {/* Section Header */}
        <Reveal className="text-center max-w-2xl mx-auto space-y-3">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--landing-fg)' }}
          >
            {t('landing.howTitle')}
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--landing-muted)' }}>
            {t('landing.howSub')}
          </p>
        </Reveal>

        {/* 3-Step Flow with Animated Connecting Line & Sequential Node Reveals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-[2px] landing-timeline-line"
            style={{ backgroundColor: 'var(--landing-border)' }}
            aria-hidden="true"
          />

          {steps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <Reveal key={idx} delayMs={idx * 120}>
                <div className="relative text-center space-y-4 group">
                  {/* Step Number Circle with Interactive Spring Scale */}
                  <div className="relative inline-flex flex-col items-center">
                    <div
                      className="landing-interactive-icon h-[104px] w-[104px] rounded-full flex items-center justify-center relative z-10 shadow-sm"
                      style={{
                        backgroundColor: 'var(--landing-bg)',
                        border: '2px solid var(--landing-border)',
                      }}
                    >
                      <div className="text-center">
                        <span
                          className="block text-2xl font-extrabold tracking-tight"
                          style={{ color: 'var(--landing-primary)' }}
                        >
                          {step.num}
                        </span>
                        <IconComp className="h-5 w-5 mx-auto mt-0.5" style={{ color: step.iconColor }} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <h3 className="text-[16px] font-bold" style={{ color: 'var(--landing-fg)' }}>
                    {t(step.titleKey)}
                  </h3>
                  <p
                    className="text-[14px] leading-relaxed max-w-xs mx-auto"
                    style={{ color: 'var(--landing-muted)' }}
                  >
                    {t(step.descKey)}
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
