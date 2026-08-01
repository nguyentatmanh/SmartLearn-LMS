'use client';

import React, { useEffect, useRef } from 'react';

export default function HeroIllustration() {
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Disable parallax if user prefers reduced motion or is on touch device
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || isReducedMotion) return;

    let isIntersecting = true;

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isIntersecting) return;
      const { innerWidth, innerHeight } = window;
      // Calculate normalized position -0.5 to 0.5
      const normX = (e.clientX / innerWidth) - 0.5;
      const normY = (e.clientY / innerHeight) - 0.5;

      // Max movement 8px
      targetPos.current = {
        x: normX * 16,
        y: normY * 12,
      };
    };

    const animateParallax = () => {
      // Smooth linear interpolation (lerp)
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;

      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate3d(${currentPos.current.x.toFixed(2)}px, ${currentPos.current.y.toFixed(2)}px, 0)`;
      }

      animationFrameRef.current = requestAnimationFrame(animateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animationFrameRef.current = requestAnimationFrame(animateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[590px] mx-auto flex items-center justify-center">

      {/* Compact Radial Lavender Ambient Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[480px] -z-10 opacity-60 pointer-events-none rounded-full blur-[70px] landing-pulse-slow"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(115, 103, 232, 0.22) 0%, rgba(91, 70, 216, 0.12) 55%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      {/* Parallax & Ambient Float Wrapper */}
      <div ref={parallaxRef} className="w-full h-full landing-ambient-float">
        {/* Standalone High-Fidelity Organic Ed-Tech Illustration SVG */}
        <div className="relative w-full aspect-[5/4] max-h-[500px] flex items-center justify-center">
          <svg
            viewBox="0 0 600 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-contain filter drop-shadow-2xl"
            aria-label="SmartLearn LMS Organic Learning Workspace Illustration"
          >
            <defs>
              <linearGradient id="edtech-glow-grad" x1="0" y1="0" x2="600" y2="480" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5B46D8" />
                <stop offset="50%" stopColor="#7367E8" />
                <stop offset="100%" stopColor="#8B7FFF" />
              </linearGradient>

              <linearGradient id="edtech-screen-grad" x1="100" y1="80" x2="500" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              <linearGradient id="brain-network-grad" x1="300" y1="50" x2="500" y2="250" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="50%" stopColor="#7367E8" />
                <stop offset="100%" stopColor="#5B46D8" />
              </linearGradient>

              <filter id="edtech-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Circuit Connections & Floating Data Particles */}
            <g opacity="0.35" aria-hidden="true">
              <path d="M50 240 L180 240 L220 180" stroke="url(#edtech-glow-grad)" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="50" cy="240" r="4" fill="#06B6D4" />
              <circle cx="220" cy="180" r="5" fill="#7367E8" />

              <path d="M550 200 L450 200 L400 280" stroke="url(#brain-network-grad)" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="550" cy="200" r="4" fill="#8B7FFF" />
              <circle cx="400" cy="280" r="5" fill="#2FAE91" />
            </g>

            {/* Center Digital Learning Tablet / Workspace Frame */}
            <rect x="90" y="90" width="420" height="290" rx="24" fill="url(#edtech-screen-grad)" stroke="#334155" strokeWidth="4" />
            <rect x="105" y="105" width="390" height="260" rx="16" fill="#090D16" />

            {/* Glowing Screen Content — Modules, Progress Cards, Visual Analytics */}
            <rect x="130" y="130" width="160" height="95" rx="12" fill="#1E1E38" stroke="#5B46D8" strokeWidth="1.5" />
            {/* Progress Bar & Curves inside Card */}
            <path d="M145 190 Q175 160 205 175 T265 155" stroke="#2FAE91" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="265" cy="155" r="4" fill="#2FAE91" filter="url(#edtech-glow)" />
            <rect x="145" y="145" width="80" height="8" rx="4" fill="#383868" />
            <rect x="145" y="160" width="50" height="6" rx="3" fill="#26264A" />

            {/* Course Document / Checklist Silhouette */}
            <rect x="130" y="240" width="160" height="105" rx="12" fill="#1E1E38" stroke="#7367E8" strokeWidth="1.5" />
            <rect x="145" y="258" width="18" height="18" rx="4" fill="#5B46D8" />
            <path d="M150 267 L155 272 L160 263" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="175" y="263" width="90" height="8" rx="4" fill="#47477A" />

            <rect x="145" y="290" width="18" height="18" rx="4" fill="#2FAE91" />
            <path d="M150 299 L155 304 L160 295" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="175" y="295" width="70" height="8" rx="4" fill="#47477A" />

            {/* Expressive Human Brain Intelligence Motif (Top Right Floating Vector) */}
            <g transform="translate(310, 80)">
              <path
                d="M 60 40 C 40 20, 10 30, 10 55 C 10 65, 15 75, 25 85 C 10 95, 15 120, 35 125 C 45 130, 60 125, 70 120 C 80 125, 95 130, 105 125 C 125 120, 130 95, 115 85 C 125 75, 130 65, 130 55 C 130 30, 100 20, 80 40 Z"
                fill="url(#brain-network-grad)"
                opacity="0.85"
                filter="url(#edtech-glow)"
              />
              {/* Interconnected Neural Synapses / Circuit Nodes */}
              <circle cx="45" cy="55" r="5" fill="#FFFFFF" />
              <circle cx="70" cy="45" r="5" fill="#FFFFFF" />
              <circle cx="95" cy="60" r="5" fill="#FFFFFF" />
              <circle cx="40" cy="90" r="5" fill="#FFFFFF" />
              <circle cx="70" cy="95" r="6" fill="#06B6D4" />
              <circle cx="100" cy="90" r="5" fill="#FFFFFF" />

              <line x1="45" y1="55" x2="70" y2="45" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="70" y1="45" x2="95" y2="60" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="45" y1="55" x2="40" y2="90" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="70" y1="45" x2="70" y2="95" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.9" />
              <line x1="95" y1="60" x2="100" y2="90" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="40" y1="90" x2="70" y2="95" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="70" y1="95" x2="100" y2="90" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8" />
            </g>

            {/* Stylized Learning Stylus / Pencil Vector Floating Left */}
            <g transform="translate(60, 260) rotate(-25)">
              <rect x="0" y="0" width="14" height="120" rx="7" fill="url(#edtech-glow-grad)" filter="url(#edtech-glow)" />
              <path d="M0 120 L7 140 L14 120 Z" fill="#F59E0B" />
              <circle cx="7" cy="136" r="2.5" fill="#1E1B4B" />
            </g>

            {/* Graduation Cap Diploma Token (Floating Right Bottom) */}
            <g transform="translate(420, 270)">
              <rect x="0" y="0" width="110" height="75" rx="14" fill="#1E1E38" stroke="#06B6D4" strokeWidth="2" />
              <path d="M55 20 L85 32 L55 44 L25 32 Z" fill="#7367E8" />
              <path d="M35 37 V48 C35 52 44 55 55 55 C66 55 75 52 75 48 V37" stroke="#7367E8" strokeWidth="2" />
              <circle cx="55" cy="58" r="3" fill="#2FAE91" />
            </g>

          </svg>
        </div>
      </div>

    </div>
  );
}
