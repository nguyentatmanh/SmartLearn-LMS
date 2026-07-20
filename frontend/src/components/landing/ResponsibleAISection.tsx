'use client';

import React from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { Bot, FileText, Target, UserCheck } from 'lucide-react';

export default function ResponsibleAISection() {
  const { t } = usePreference();

  const principles = [
    {
      icon: FileText,
      titleKey: 'aiPrinciple1Title',
      descKey: 'aiPrinciple1Desc',
      iconColor: 'text-violet-500',
    },
    {
      icon: Target,
      titleKey: 'aiPrinciple2Title',
      descKey: 'aiPrinciple2Desc',
      iconColor: 'text-blue-500',
    },
    {
      icon: UserCheck,
      titleKey: 'aiPrinciple3Title',
      descKey: 'aiPrinciple3Desc',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <section id="responsible-ai" className="py-16 lg:py-20 bg-surface-2 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-[12px] font-semibold text-violet-600 dark:text-violet-400">
            <Bot className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>SmartLearn AI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('aiSectionTitle')}
          </h2>

          <p className="text-sm text-muted-foreground">
            {t('aiSectionSub')}
          </p>
        </div>

        {/* 3 Principles — non-interactive cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {principles.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-card border border-border space-y-3"
              >
                <IconComp className={`h-5 w-5 ${item.iconColor}`} aria-hidden="true" />
                <h3 className="text-[15px] font-semibold text-foreground">
                  {t(item.titleKey as any)}
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {t(item.descKey as any)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
