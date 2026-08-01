'use client';

import React from 'react';

interface SmartLearnLogoProps {
  variant?: 'full' | 'mark' | 'compact';
  className?: string;
  markSize?: number;
  showWordmark?: boolean;
}

export default function SmartLearnLogo({
  variant = 'full',
  className = '',
  markSize,
  showWordmark = true,
}: SmartLearnLogoProps) {
  // Freestanding logo mark size (48px for full header logo)
  const size = markSize || (variant === 'compact' ? 36 : variant === 'mark' ? 44 : 48);

  if (variant === 'mark' || !showWordmark) {
    return (
      <span className={`inline-flex items-center shrink-0 ${className}`}>
        <img
          src="/brand/smartlearn-mark.svg"
          alt="SmartLearn LMS Logo"
          width={size}
          height={size}
          className="shrink-0 object-contain"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      <img
        src="/brand/smartlearn-mark.svg"
        alt="SmartLearn LMS Logo"
        width={size}
        height={size}
        className="shrink-0 object-contain"
      />
      <span className="flex items-baseline leading-none select-none">
        <span className={`font-extrabold tracking-tight text-foreground ${variant === 'compact' ? 'text-lg' : 'text-xl lg:text-2xl'}`}>
          SmartLearn
        </span>
        <span className={`font-semibold ml-1.5 ${variant === 'compact' ? 'text-sm' : 'text-base lg:text-lg'}`} style={{ color: '#7367E8' }}>
          LMS
        </span>
      </span>
    </span>
  );
}
