'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { UsersRound, KeyRound, Bot, BarChart3 } from 'lucide-react';

export default function BenefitStrip() {
  const { t } = usePreference();

  const benefits = [
    {
      icon: UsersRound,
      titleKey: 'benefit1Title',
      descKey: 'benefit1Desc',
      iconColor: 'text-indigo-500',
    },
    {
      icon: KeyRound,
      titleKey: 'benefit2Title',
      descKey: 'benefit2Desc',
      iconColor: 'text-emerald-500',
    },
    {
      icon: Bot,
      titleKey: 'benefit3Title',
      descKey: 'benefit3Desc',
      iconColor: 'text-violet-500',
    },
    {
      icon: BarChart3,
      titleKey: 'benefit4Title',
      descKey: 'benefit4Desc',
      iconColor: 'text-cyan-500',
    },
  ];

  return (
    <section className="py-8 border-y border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
          {benefits.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3"
              >
                <IconComponent className={`h-5 w-5 ${item.iconColor} shrink-0 mt-0.5`} aria-hidden="true" />
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-[13px] font-semibold text-foreground">
                    {t(item.titleKey as any)}
                  </h3>
                  <p className="text-[12px] text-muted-foreground leading-snug">
                    {t(item.descKey as any)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
