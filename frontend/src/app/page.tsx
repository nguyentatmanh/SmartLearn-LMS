'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import AppHeader from '@/components/Header';
import { Brain, ShieldCheck, Sparkles, BookOpen, Clock, BarChart3, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const { t } = usePreference();

  const getDashboardUrl = () => {
    if (user?.role === 'admin') return '/dashboard/admin';
    return user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* Decorative Radial Gradients */}
      <div className="absolute top-[-10%] left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-primary/5 blur-[100px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] rounded-full bg-primary/5 blur-[80px] sm:blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <AppHeader />

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center py-16 lg:py-24 relative z-10 fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text content block */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-primary/20 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t('heroTagline')}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {t('heroTitle')}<br />
              <span className="bg-gradient-to-r from-primary to-ring bg-clip-text text-transparent">
                {t('heroAccent')}
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t('heroDesc')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href={isAuthenticated ? getDashboardUrl() : "/register"}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('heroCTA1')}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={isAuthenticated ? getDashboardUrl() : "/login"}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold border border-border hover:bg-muted/80 text-foreground transition-all flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('heroCTA2')}
              </Link>
            </div>
          </div>

          {/* Graphical Mockup Card */}
          <div className="lg:col-span-5 relative flex justify-center w-full px-4 sm:px-0">
            <div className="w-full max-w-md glass rounded-2xl p-6 border border-border relative shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1 shadow-md">
                <Brain className="h-3 w-3" /> AI Active
              </div>

              <div className="space-y-4">
                <div className="h-4 w-1/3 bg-muted rounded-full" />
                <div className="h-8 w-3/4 bg-gradient-to-r from-primary to-ring rounded-lg" />
                
                <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{t('heroMockExam')}</span>
                    <span className="text-primary font-semibold">{t('heroMockQues')}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-primary rounded-full" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium">{t('heroMockProg')}</span>
                    <span className="text-muted-foreground">{t('heroMockTime')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="glass p-3 rounded-xl text-center space-y-1.5 hover:bg-muted/40 transition-colors">
                    <BookOpen className="h-4 w-4 text-primary mx-auto" />
                    <div className="text-[10px] font-semibold text-muted-foreground">{t('heroMockLessons')}</div>
                  </div>
                  <div className="glass p-3 rounded-xl text-center space-y-1.5 hover:bg-muted/40 transition-colors">
                    <Clock className="h-4 w-4 text-primary/80 mx-auto" />
                    <div className="text-[10px] font-semibold text-muted-foreground">{t('heroMockQuiz')}</div>
                  </div>
                  <div className="glass p-3 rounded-xl text-center space-y-1.5 hover:bg-muted/40 transition-colors">
                    <BarChart3 className="h-4 w-4 text-primary/70 mx-auto" />
                    <div className="text-[10px] font-semibold text-muted-foreground">{t('heroMockStats')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="border-t border-border py-16 bg-muted/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('featureTitle')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="glass p-6 rounded-xl space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">{t('feature1Title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('feature1Desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass p-6 rounded-xl space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">{t('feature2Title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('feature2Desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass p-6 rounded-xl space-y-4 hover:shadow-lg transition-all duration-300">
              <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-lg">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">{t('feature3Title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('feature3Desc')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>{t('footerText')}</p>
      </footer>

    </div>
  );
}
