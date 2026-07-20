'use client';

import React from 'react';
import AppHeader from '@/components/Header';
import HeroSection from '@/components/landing/HeroSection';
import BenefitStrip from '@/components/landing/BenefitStrip';
import FeatureGrid from '@/components/landing/FeatureGrid';
import RoleSolutions from '@/components/landing/RoleSolutions';
import ProcessSection from '@/components/landing/ProcessSection';
import ResponsibleAISection from '@/components/landing/ResponsibleAISection';
import FinalCTA from '@/components/landing/FinalCTA';
import PublicFooter from '@/components/landing/PublicFooter';

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col justify-between bg-background text-foreground transition-colors duration-200 overflow-x-hidden">
      {/* 1. Public Header */}
      <AppHeader />

      {/* 2. Main Landing Page Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />

        {/* 4 Compact Platform Benefits Strip */}
        <BenefitStrip />

        {/* 6 Core Feature Cards Grid */}
        <FeatureGrid />

        {/* Role-Based Interactive Tabbed Solutions */}
        <RoleSolutions />

        {/* 3-Step Visual Workflow */}
        <ProcessSection />

        {/* Responsible AI Standards Section */}
        <ResponsibleAISection />

        {/* Final Registration Call-to-Action */}
        <FinalCTA />
      </main>

      {/* 3. Public Footer */}
      <PublicFooter />
    </div>
  );
}
