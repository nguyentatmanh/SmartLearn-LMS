'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { PlusCircle, ClipboardCheck, BarChart3 } from 'lucide-react';

export default function ProcessSection() {
  const { t } = usePreference();

  const steps = [
    {
      num: '01',
      titleKey: 'step1Title',
      descKey: 'step1Desc',
      icon: PlusCircle,
      iconColor: 'text-indigo-500',
    },
    {
      num: '02',
      titleKey: 'step2Title',
      descKey: 'step2Desc',
      icon: ClipboardCheck,
      iconColor: 'text-blue-500',
    },
    {
      num: '03',
      titleKey: 'step3Title',
      descKey: 'step3Desc',
      icon: BarChart3,
      iconColor: 'text-cyan-500',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-20 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('howItWorksTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('howItWorksSub')}
          </p>
        </div>

        {/* 3-Step Sequence — minimal cards with step connector feel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div
                key={idx}
                className="relative p-5 rounded-xl bg-card border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary/25 tracking-tight select-none">
                    {step.num}
                  </span>
                  <IconComp className={`h-5 w-5 ${step.iconColor}`} aria-hidden="true" />
                </div>

                <h3 className="text-[15px] font-semibold text-foreground">
                  {t(step.titleKey as any)}
                </h3>

                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {t(step.descKey as any)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
