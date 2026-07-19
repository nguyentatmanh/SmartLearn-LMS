'use client';

import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        {icon || <FolderOpen className="h-7 w-7" />}
      </div>
      <h3 className="font-bold text-base text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-5">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
