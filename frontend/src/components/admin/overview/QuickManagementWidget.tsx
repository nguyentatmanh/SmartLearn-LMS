'use client';

import React from 'react';
import { UserPlus, Shield, AlertTriangle } from 'lucide-react';
import { AdminTab } from '@/types/admin';
import { usePreference } from '@/context/PreferenceContext';
import { playNavClickSound } from '@/lib/sound';

interface QuickManagementWidgetProps {
  onSelectTab: (tab: AdminTab) => void;
}

export const QuickManagementWidget: React.FC<QuickManagementWidgetProps> = ({ onSelectTab }) => {
  const { t } = usePreference();

  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t('admin.overview.quickManagement')}
      </h3>

      <div className="space-y-2">
        {/* Create New Account */}
        <button
          onClick={() => {
            playNavClickSound();
            onSelectTab('users');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer min-h-[44px] shadow-sm group"
        >
          <UserPlus className="w-4 h-4 shrink-0 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-200" />
          <span>{t('admin.overview.createAccount')}</span>
        </button>

        {/* Manage Roles */}
        <button
          onClick={() => {
            playNavClickSound();
            onSelectTab('users');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer min-h-[44px] shadow-sm group"
        >
          <Shield className="w-4 h-4 shrink-0 group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-200" />
          <span>{t('admin.overview.manageRoles')}</span>
        </button>

        {/* View Emergency Reports */}
        <button
          onClick={() => {
            playNavClickSound();
            onSelectTab('reports');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-slate-200/50 dark:border-slate-700/50 hover:bg-muted/60 text-foreground text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer min-h-[44px] group"
        >
          <AlertTriangle className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 shrink-0 group-hover:scale-125 transition-transform duration-200" />
          <span>{t('admin.overview.emergencyReports')}</span>
        </button>
      </div>
    </div>
  );
};
