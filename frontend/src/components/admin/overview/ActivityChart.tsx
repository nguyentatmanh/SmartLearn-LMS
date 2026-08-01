'use client';

import React, { useMemo, useState, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { ActivityDataPoint, ChartPeriod } from '@/types/admin';
import { usePreference } from '@/context/PreferenceContext';

interface ActivityChartProps {
  externalData?: ActivityDataPoint[];
}

/** Deterministic seed generator for smooth mock trends */
function generateMockData(days: number): ActivityDataPoint[] {
  const data: ActivityDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const seed1 = ((dayOfYear * 9301 + 49297) % 233280) / 233280;
    const seed2 = ((dayOfYear * 7919 + 23761) % 173231) / 173231;

    data.push({
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      newEnrollments: Math.floor(seed1 * 14 + 3),
      userActivity: Math.floor(seed2 * 18 + 6),
    });
  }

  return data;
}

const PERIODS: ChartPeriod[] = ['7d', '14d', '30d', '90d'];

export const ActivityChart: React.FC<ActivityChartProps> = ({ externalData }) => {
  const { t } = usePreference();
  const [period, setPeriod] = useState<ChartPeriod>('30d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const periodDays: Record<ChartPeriod, number> = {
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
  };

  const periodLabels: Record<ChartPeriod, string> = {
    '7d': t('admin.overview.period7d'),
    '14d': t('admin.overview.period14d'),
    '30d': t('admin.overview.period30d'),
    '90d': t('admin.overview.period90d'),
  };

  const chartData = useMemo(() => {
    if (externalData && externalData.length > 0) return externalData;
    return generateMockData(periodDays[period]);
  }, [externalData, period]);

  // SVG Chart Dimensions
  const width = 700;
  const height = 240;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = useMemo(() => {
    const vals = chartData.flatMap((d) => [d.newEnrollments, d.userActivity]);
    return Math.max(...vals, 10);
  }, [chartData]);

  // Compute points
  const points = useMemo(() => {
    const len = chartData.length;
    return chartData.map((d, i) => {
      const x = paddingLeft + (i / Math.max(len - 1, 1)) * chartWidth;
      const yEnroll = paddingTop + chartHeight - (d.newEnrollments / maxVal) * chartHeight;
      const yActivity = paddingTop + chartHeight - (d.userActivity / maxVal) * chartHeight;
      return { x, yEnroll, yActivity, data: d };
    });
  }, [chartData, maxVal, chartWidth, chartHeight, paddingLeft, paddingTop]);

  // SVG Path Generators (Smooth curves using cubic Bezier)
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cx = (curr.x + next.x) / 2;
      path += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const enrollPath = buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yEnroll })));
  const activityPath = buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yActivity })));

  const enrollAreaPath = points.length > 0
    ? `${enrollPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  const activityAreaPath = points.length > 0
    ? `${activityPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  // Handle Mouse Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  // Horizontal Grid Lines
  const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

  // X Labels sampling
  const xLabelsCount = Math.min(6, chartData.length);
  const xStep = Math.max(1, Math.floor(chartData.length / xLabelsCount));

  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-card p-6 shadow-sm space-y-4">
      {/* Header with period selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t('admin.overview.activityChart')}
        </h3>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                  period === p
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <button
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors cursor-pointer"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground" role="list" aria-label="Chart legend">
        <div className="flex items-center gap-1.5" role="listitem">
          <span className="w-3 h-1 bg-indigo-500 rounded-full" aria-hidden="true" />
          <span>{t('admin.overview.newEnrollments')}</span>
        </div>
        <div className="flex items-center gap-1.5" role="listitem">
          <span className="w-3 h-1 bg-amber-500 rounded-full" aria-hidden="true" />
          <span>{t('admin.overview.userActivity')}</span>
        </div>
      </div>

      {/* SVG Responsive Area Chart */}
      <div
        ref={containerRef}
        className="w-full relative h-[260px] select-none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
        >
          <defs>
            <linearGradient id="svgEnrollGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="svgActivityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((val) => {
            const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px]"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((p, idx) => {
            if (idx % xStep !== 0 && idx !== points.length - 1) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {p.data.date}
              </text>
            );
          })}

          {/* Gradient Area Paths */}
          <path d={activityAreaPath} fill="url(#svgActivityGradient)" />
          <path d={enrollAreaPath} fill="url(#svgEnrollGradient)" />

          {/* Smooth Lines */}
          <path
            d={activityPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={enrollPath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Hover Crosshair & Data Dots */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={height - paddingBottom}
                stroke="currentColor"
                className="text-foreground/30"
                strokeDasharray="4 4"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.yActivity}
                r="5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.yEnroll}
                r="5"
                fill="#6366f1"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-card border border-slate-200/60 dark:border-slate-700/60 rounded-xl shadow-xl p-3 text-xs z-20 transition-all duration-75"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: '15px',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-semibold text-foreground mb-1.5 border-b border-border/40 pb-1">
              {hoveredPoint.data.date}
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-muted-foreground">{t('admin.overview.newEnrollments')}:</span>
                <span className="font-bold text-foreground">{hoveredPoint.data.newEnrollments}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-muted-foreground">{t('admin.overview.userActivity')}:</span>
                <span className="font-bold text-foreground">{hoveredPoint.data.userActivity}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
