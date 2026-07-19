'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface CourseCoverProps {
  coverDisplayUrl?: string | null;
  title: string;
  className?: string;
  aspectRatio?: string;
}

/**
 * Reusable course cover image component with loading state,
 * error fallback (gradient + icon), and accessible alt text.
 * Never shows the browser's broken image icon.
 */
export default function CourseCover({ coverDisplayUrl, title, className = '', aspectRatio = 'aspect-[16/9]' }: CourseCoverProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(coverDisplayUrl ? 'loading' : 'error');

  // Deterministic gradient from title for fallback
  const hash = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;

  const fallback = (
    <div
      className={`w-full h-full flex flex-col items-center justify-center ${aspectRatio}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue}, 45%, 25%) 0%, hsl(${(hue + 40) % 360}, 55%, 18%) 100%)` }}
    >
      <BookOpen className="h-8 w-8 text-white/30" />
      <span className="text-[10px] text-white/25 mt-1 font-medium">SmartLearn</span>
    </div>
  );

  if (!coverDisplayUrl || status === 'error') {
    return <div className={`overflow-hidden rounded-xl ${className}`}>{fallback}</div>;
  }

  return (
    <div className={`overflow-hidden rounded-xl relative ${className} ${aspectRatio}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 bg-muted/50 animate-pulse" />
      )}
      <img
        src={coverDisplayUrl}
        alt={title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        loading="lazy"
      />
    </div>
  );
}
