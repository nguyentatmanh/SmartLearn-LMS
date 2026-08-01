'use client';

import React, { useMemo, useState } from 'react';
import { usePreference } from '@/context/PreferenceContext';

interface UserDistributionChartProps {
  students: number;
  teachers: number;
  admins: number;
}

interface DistributionSegment {
  name: string;
  value: number;
  color: string;
  percent: number;
  dashArray: string;
  dashOffset: number;
}

const COLORS = {
  students: '#6366f1',  // Indigo
  teachers: '#f59e0b',  // Amber
  admins: '#10b981',    // Emerald
};

export const UserDistributionChart: React.FC<UserDistributionChartProps> = ({
  students,
  teachers,
  admins,
}) => {
  const { t } = usePreference();
  const [hoveredSegment, setHoveredSegment] = useState<DistributionSegment | null>(null);

  const total = useMemo(() => students + teachers + admins || 1, [students, teachers, admins]);

  // Radius & circumference for SVG circle
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.74

  const segments: DistributionSegment[] = useMemo(() => {
    const data = [
      { name: t('admin.overview.roleStudents'), value: students, color: COLORS.students },
      { name: t('admin.overview.roleTeachers'), value: teachers, color: COLORS.teachers },
      { name: t('admin.overview.roleAdmins'), value: admins, color: COLORS.admins },
    ];

    let accumulatedPercent = 0;

    return data.map((item) => {
      const percent = Math.round((item.value / total) * 100);
      const segmentFraction = item.value / total;
      const strokeLength = segmentFraction * circumference;
      const spaceLength = circumference - strokeLength;

      const dashOffset = -accumulatedPercent * circumference;
      accumulatedPercent += segmentFraction;

      return {
        ...item,
        percent,
        dashArray: `${strokeLength} ${spaceLength}`,
        dashOffset,
      };
    });
  }, [students, teachers, admins, total, circumference, t]);

  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {t('admin.overview.userDistribution')}
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Donut Chart */}
        <div className="relative w-[130px] h-[130px] shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full transform -rotate-90"
            onMouseLeave={() => setHoveredSegment(null)}
          >
            {/* Background Circle track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="16"
              className="text-muted/20"
            />

            {/* Segments */}
            {segments.map((seg) => (
              <circle
                key={seg.name}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={hoveredSegment?.name === seg.name ? "20" : "16"}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredSegment(seg)}
              />
            ))}
          </svg>

          {/* Donut Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-lg font-bold text-foreground tabular-nums">
              {hoveredSegment ? hoveredSegment.value : total}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {hoveredSegment ? hoveredSegment.name : t('admin.summaryUsers') || 'Total'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5 flex-1 w-full" role="list" aria-label="User distribution legend">
          {segments.map((item) => (
            <div
              key={item.name}
              onMouseEnter={() => setHoveredSegment(item)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors cursor-pointer ${
                hoveredSegment?.name === item.name ? 'bg-muted/60' : ''
              }`}
              role="listitem"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">
                  {item.name} <span className="font-semibold text-foreground">({item.percent}%)</span>
                </span>
              </div>
              <span className="font-bold text-foreground tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
