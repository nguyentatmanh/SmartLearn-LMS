'use client';

import React from 'react';
import Reveal from './Reveal';

interface StaggerGroupProps {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerMs?: number;
  baseDelayMs?: number;
}

export default function StaggerGroup({
  children,
  className = '',
  itemClassName = '',
  staggerMs = 75,
  baseDelayMs = 0,
}: StaggerGroupProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        return (
          <Reveal
            key={index}
            delayMs={baseDelayMs + index * staggerMs}
            className={itemClassName}
          >
            {child}
          </Reveal>
        );
      })}
    </div>
  );
}
