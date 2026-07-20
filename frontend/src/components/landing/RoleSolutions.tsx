'use client';

import React, { useState } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { GraduationCap, BookOpenCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

type RoleKey = 'learner' | 'educator' | 'admin';

export default function RoleSolutions() {
  const { t } = usePreference();
  const [activeTab, setActiveTab] = useState<RoleKey>('learner');

  const tabs = [
    {
      id: 'learner' as RoleKey,
      labelKey: 'roleTabLearner',
      icon: GraduationCap,
      titleKey: 'learnerTitle',
      items: ['learnerItem1', 'learnerItem2', 'learnerItem3', 'learnerItem4'],
      accent: 'text-indigo-500',
    },
    {
      id: 'educator' as RoleKey,
      labelKey: 'roleTabEducator',
      icon: BookOpenCheck,
      titleKey: 'educatorTitle',
      items: ['educatorItem1', 'educatorItem2', 'educatorItem3', 'educatorItem4'],
      accent: 'text-violet-500',
    },
    {
      id: 'admin' as RoleKey,
      labelKey: 'roleTabAdmin',
      icon: ShieldCheck,
      titleKey: 'adminTitle',
      items: ['adminItem1', 'adminItem2', 'adminItem3', 'adminItem4'],
      accent: 'text-emerald-500',
    },
  ];

  const currentTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  // Keyboard arrow navigation for tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (idx + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (idx - 1 + tabs.length) % tabs.length;
    }
    if (next !== idx) {
      setActiveTab(tabs[next].id);
      // Focus the new tab
      const el = document.getElementById(`tab-${tabs[next].id}`);
      el?.focus();
    }
  };

  return (
    <section id="solutions" className="py-16 lg:py-20 bg-surface-2 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('solutionsSectionTitle')}
          </h2>
        </div>

        {/* Tab Controls */}
        <div
          role="tablist"
          aria-label="Role-based solutions"
          className="flex flex-wrap items-center justify-center gap-1 p-1 bg-card rounded-xl border border-border max-w-sm mx-auto"
        >
          {tabs.map((tab, idx) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <IconComp className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t(tab.labelKey as any)}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Panel */}
        <div
          id={`panel-${currentTabData.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentTabData.id}`}
          className="p-6 sm:p-8 rounded-xl bg-card border border-border max-w-3xl mx-auto space-y-5"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <currentTabData.icon className={`h-5 w-5 ${currentTabData.accent} shrink-0`} aria-hidden="true" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              {t(currentTabData.titleKey as any)}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentTabData.items.map((itemKey, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-surface-2 flex items-start gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-[13px] text-foreground leading-relaxed">
                  {t(itemKey as any)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
