'use client';

import React from 'react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import FeatureHighlights from '@/components/landing/FeatureHighlights';
import LandingRoleSolutions from '@/components/landing/LandingRoleSolutions';
import HowItWorks from '@/components/landing/HowItWorks';
import SecurityGovernance from '@/components/landing/SecurityGovernance';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div
      className="landing-page font-landing min-h-dvh flex flex-col overflow-x-clip"
      style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-fg)' }}
    >
      {/* Fixed Landing Header */}
      <LandingHeader />

      {/* Main Content with Top Padding matching Header Height */}
      <main className="flex-grow pt-[var(--landing-header-height)]">
        <LandingHero />
        <FeatureHighlights />
        <LandingRoleSolutions />
        <HowItWorks />
        <SecurityGovernance />
        <LandingCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
