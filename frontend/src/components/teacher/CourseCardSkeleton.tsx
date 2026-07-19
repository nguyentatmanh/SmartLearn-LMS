'use client';

import React from 'react';

interface CourseCardSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export default function CourseCardSkeleton({ count = 3, viewMode = 'grid' }: CourseCardSkeletonProps) {
  const items = Array.from({ length: count });

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-card/80 border border-border/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse"
          >
            <div className="w-full sm:w-28 h-20 rounded-xl bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <div className="h-4 w-20 bg-muted/60 rounded-md" />
                <div className="h-3 w-16 bg-muted/40 rounded-md" />
              </div>
              <div className="h-5 w-3/4 bg-muted/70 rounded-md" />
              <div className="h-3.5 w-1/2 bg-muted/40 rounded-md" />
            </div>
            <div className="h-9 w-28 bg-muted/60 rounded-xl shrink-0 self-end sm:self-center" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((_, i) => (
        <div
          key={i}
          className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden flex flex-col animate-pulse"
        >
          {/* Cover image placeholder */}
          <div className="h-40 bg-muted/60 w-full relative">
            <div className="absolute top-3 left-3 h-5 w-16 bg-muted/80 rounded-full" />
          </div>
          {/* Card body */}
          <div className="p-5 flex-1 flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted/60 rounded-full" />
              <div className="h-3 w-16 bg-muted/40 rounded-md" />
            </div>
            <div className="h-5 w-4/5 bg-muted/70 rounded-md" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 w-full bg-muted/40 rounded-md" />
              <div className="h-3.5 w-2/3 bg-muted/40 rounded-md" />
            </div>
            {/* Footer */}
            <div className="pt-4 mt-auto border-t border-border/40 flex justify-between items-center gap-2">
              <div className="h-3 w-24 bg-muted/40 rounded-md" />
              <div className="h-8 w-24 bg-muted/60 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
