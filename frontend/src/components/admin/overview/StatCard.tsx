'use client';

import React from 'react';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StatCardData } from '@/types/admin';
import { playNavClickSound } from '@/lib/sound';

interface StatCardProps {
  data: StatCardData;
}

/** Mini inline SVG sparkline — purely decorative */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;

  const width = 80;
  const height = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 group-hover:scale-105 transition-transform duration-200"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );
}

export const StatCard: React.FC<StatCardProps> = ({ data }) => {
  const {
    label,
    value,
    subtitle,
    trend,
    icon: Icon,
    iconColor,
    hoverBorderColor,
    sparklineData,
    onClick,
  } = data;

  const trendIcon = trend
    ? trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
      ? TrendingDown
      : Minus
    : null;

  const trendColorClass = trend
    ? trend.direction === 'up'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
      : trend.direction === 'down'
      ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
      : 'text-slate-500 bg-slate-500/10'
    : '';

  // Resolve sparkline color from iconColor class
  const sparkColor = iconColor.includes('indigo')
    ? '#6366f1'
    : iconColor.includes('amber')
    ? '#f59e0b'
    : iconColor.includes('emerald')
    ? '#10b981'
    : iconColor.includes('sky')
    ? '#0ea5e9'
    : '#6366f1';

  const handleClick = () => {
    playNavClickSound();
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
      className={`p-5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card shadow-sm hover:shadow-md ${hoverBorderColor} transition-all duration-200 cursor-pointer group flex flex-col justify-between active:scale-[0.98]`}
    >
      {/* Header: Label + Icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
        <div className="p-2 rounded-xl bg-muted/40 group-hover:scale-115 group-hover:rotate-6 transition-all duration-200 shadow-xs">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      {/* Value Row */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight block">
            {value.toLocaleString()}
          </span>

          {/* Trend Badge */}
          {trend && trendIcon && (
            <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendColorClass} group-hover:scale-105 transition-transform duration-200`}>
              {React.createElement(trendIcon, { className: 'w-3 h-3' })}
              {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '')}
              {trend.value}% {trend.label}
            </span>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} color={sparkColor} />
        )}
      </div>

      {/* Footer: Subtitle + Arrow */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{subtitle}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </div>
  );
};
