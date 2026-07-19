import React from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
}

export default function StatsCard({ label, value, subtitle, icon, iconBg = 'bg-primary/10 text-primary' }: StatsCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border flex items-center justify-between hover:border-primary/20 transition-colors">
      <div className="space-y-1 min-w-0">
        <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
        <span className="text-2xl font-extrabold block text-foreground">{value}</span>
        {subtitle && (
          <span className="block text-[10px] text-muted-foreground/70 truncate">{subtitle}</span>
        )}
      </div>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}
