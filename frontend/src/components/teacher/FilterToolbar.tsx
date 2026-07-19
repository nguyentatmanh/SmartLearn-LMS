'use client';

import React from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';

export type StatusFilter = 'all' | 'published' | 'draft' | 'archived';
export type SortOption = 'newest' | 'oldest' | 'title' | 'students';
export type ViewMode = 'grid' | 'list';

interface FilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalResults: number;
}

export default function FilterToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
}: FilterToolbarProps) {
  const { t, language } = usePreference();

  const statusTabs: { id: StatusFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'filterAll' },
    { id: 'published', labelKey: 'filterPublished' },
    { id: 'draft', labelKey: 'filterDraft' },
    { id: 'archived', labelKey: 'filterArchived' },
  ];

  return (
    <div className="bg-card border border-border/60 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchCoursesPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/70 rounded-2xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* Controls: Sort Dropdown + View Toggle */}
        <div className="flex items-center gap-3 justify-between md:justify-end shrink-0">
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/70 rounded-2xl px-3 py-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              aria-label={t('sortByLabel')}
            >
              <option value="newest">{t('sortByNewest')}</option>
              <option value="oldest">{t('sortByOldest')}</option>
              <option value="title">{t('sortByTitle')}</option>
              <option value="students">{t('sortByStudents')}</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-muted/40 border border-border/70 rounded-2xl">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-card text-primary shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t('viewGridLabel')}
              aria-label={t('viewGridLabel')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'list'
                  ? 'bg-card text-primary shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t('viewListLabel')}
              aria-label={t('viewListLabel')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5">
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(tab.labelKey as any)}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-muted-foreground font-semibold shrink-0">
          {totalResults} {language === 'en' ? 'courses' : 'khóa học'}
        </span>
      </div>
    </div>
  );
}
