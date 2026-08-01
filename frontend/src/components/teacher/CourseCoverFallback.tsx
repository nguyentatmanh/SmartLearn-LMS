'use client';

import React from 'react';
import { BookOpen, GraduationCap, Code, Sparkles, Laptop } from 'lucide-react';

interface CourseCoverFallbackProps {
  courseId: number;
  title: string;
  className?: string;
}

const GRADIENT_THEMES = [
  {
    bg: 'bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-800 dark:to-violet-950',
    icon: BookOpen,
    badgeBg: 'bg-white/15 text-indigo-100 border-indigo-300/30',
  },
  {
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-950',
    icon: GraduationCap,
    badgeBg: 'bg-white/15 text-emerald-100 border-emerald-300/30',
  },
  {
    bg: 'bg-gradient-to-br from-blue-600 to-cyan-700 dark:from-blue-800 dark:to-cyan-950',
    icon: Code,
    badgeBg: 'bg-white/15 text-blue-100 border-blue-300/30',
  },
  {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-700 dark:to-orange-950',
    icon: Sparkles,
    badgeBg: 'bg-white/15 text-amber-100 border-amber-300/30',
  },
  {
    bg: 'bg-gradient-to-br from-rose-600 to-pink-700 dark:from-rose-800 dark:to-pink-950',
    icon: Laptop,
    badgeBg: 'bg-white/15 text-rose-100 border-rose-300/30',
  },
];

export const CourseCoverFallback: React.FC<CourseCoverFallbackProps> = ({
  courseId,
  title,
  className = 'h-40',
}) => {
  const themeIndex = Math.abs(courseId || 0) % GRADIENT_THEMES.length;
  const theme = GRADIENT_THEMES[themeIndex];
  const IconComponent = theme.icon;

  return (
    <div
      className={`relative w-full ${className} ${theme.bg} overflow-hidden flex flex-col justify-between p-4 rounded-t-xl select-none`}
      aria-hidden="true"
    >
      {/* Decorative Geometric Overlay Grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Top Badge */}
      <div className="flex items-center justify-between z-10">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${theme.badgeBg}`}
        >
          <IconComponent className="w-3.5 h-3.5" />
          SmartLearn Course
        </span>
      </div>

      {/* Decorative Large Background Icon */}
      <IconComponent className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 pointer-events-none transform -rotate-12" />

      {/* Title Overlay */}
      <div className="z-10 mt-auto pt-2">
        <h4 className="text-white font-bold text-sm sm:text-base line-clamp-2 drop-shadow-sm leading-tight">
          {title}
        </h4>
      </div>
    </div>
  );
};
