'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { BookOpenCheck, ClipboardCheck, Bot, BarChart3, UsersRound, ShieldCheck } from 'lucide-react';

export default function FeatureGrid() {
  const { t } = usePreference();

  const features = [
    {
      icon: BookOpenCheck,
      titleKey: 'feat1Title',
      descKey: 'feat1Desc',
      iconColor: 'text-indigo-500 bg-indigo-500/10',
    },
    {
      icon: ClipboardCheck,
      titleKey: 'feat2Title',
      descKey: 'feat2Desc',
      iconColor: 'text-blue-500 bg-blue-500/10',
    },
    {
      icon: Bot,
      titleKey: 'feat3Title',
      descKey: 'feat3Desc',
      iconColor: 'text-violet-500 bg-violet-500/10',
    },
    {
      icon: BarChart3,
      titleKey: 'feat4Title',
      descKey: 'feat4Desc',
      iconColor: 'text-cyan-500 bg-cyan-500/10',
    },
    {
      icon: UsersRound,
      titleKey: 'feat5Title',
      descKey: 'feat5Desc',
      iconColor: 'text-indigo-500 bg-indigo-500/10',
    },
    {
      icon: ShieldCheck,
      titleKey: 'feat6Title',
      descKey: 'feat6Desc',
      iconColor: 'text-emerald-500 bg-emerald-500/10',
    },
  ];

  return (
    <section id="features" className="py-16 lg:py-20 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('featuresSectionTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('featuresSectionSub')}
          </p>
        </div>

        {/* Feature Cards — non-interactive, subtle hover only */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-card border border-border space-y-3"
              >
                <div className={`h-9 w-9 rounded-lg ${feat.iconColor} flex items-center justify-center shrink-0`}>
                  <IconComp className="h-[18px] w-[18px]" aria-hidden="true" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground">
                  {t(feat.titleKey as any)}
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {t(feat.descKey as any)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
