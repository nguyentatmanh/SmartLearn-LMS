'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { Sun, Moon, Languages, Menu, X, LayoutDashboard } from 'lucide-react';
import SmartLearnLogo from '@/components/brand/SmartLearnLogo';

export default function LandingHeader() {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuth = mounted && isAuthenticated;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const getDashboardUrl = () => {
    if (user?.role === 'admin') return '/dashboard/admin';
    return user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
  };

  // ScrollSpy using IntersectionObserver
  useEffect(() => {
    if (!mounted) return;

    const sectionIds = ['home', 'features', 'solutions', 'how-it-works', 'security'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            // Replace history state subtly to keep URL in sync without adding scroll history entries
            if (entry.target.id === 'home') {
              if (window.location.hash) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            } else {
              if (window.location.hash !== `#${entry.target.id}`) {
                window.history.replaceState(null, '', `#${entry.target.id}`);
              }
            }
          }
        });
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: 0.1,
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [mounted]);

  // Initial Deep-Link Hash Handling
  useEffect(() => {
    if (!mounted) return;
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const targetElement = document.getElementById(hash);
      if (targetElement) {
        setTimeout(() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          targetElement.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
          setActiveSection(hash);
        }, 100);
      }
    }
  }, [mounted]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { id: 'features', href: '#features', labelKey: 'landing.navFeatures' },
    { id: 'solutions', href: '#solutions', labelKey: 'landing.navSolutions' },
    { id: 'how-it-works', href: '#how-it-works', labelKey: 'landing.navHowItWorks' },
    { id: 'security', href: '#security', labelKey: 'landing.navSecurity' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (targetId === 'home') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      window.history.pushState(null, '', window.location.pathname);
      setActiveSection('home');
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      window.history.pushState(null, '', `#${targetId}`);
      setActiveSection(targetId);
    }
  };

  return (
    <header
      suppressHydrationWarning
      className="fixed inset-x-0 top-0 z-50 h-[var(--landing-header-height)] border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--landing-surface)',
        borderColor: 'var(--landing-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 xl:px-10 h-full flex items-center justify-between">

        {/* Brand Logo (Links to / and smooth scrolls to top) */}
        <Link
          href="/"
          onClick={(e) => handleNavClick(e, 'home')}
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] py-1"
          aria-label="SmartLearn LMS Home"
        >
          <SmartLearnLogo variant="full" markSize={48} className="w-[210px] lg:w-[235px]" />
        </Link>

        {/* Centered Section Navigation with Active Indicator */}
        <nav className="hidden lg:flex items-center gap-1 text-[15px] font-medium" aria-label="Page sections">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.id)}
                aria-current={isActive ? 'location' : undefined}
                className="relative px-4 py-2.5 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)]"
                style={{
                  color: isActive ? 'var(--landing-primary)' : 'var(--landing-muted)',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span>{t(link.labelKey)}</span>
                <span
                  className={`absolute bottom-0 left-4 right-4 h-[2.5px] rounded-full transition-all duration-200 ${
                    isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                  style={{ backgroundColor: 'var(--landing-primary)' }}
                  aria-hidden="true"
                />
              </a>
            );
          })}
        </nav>

        {/* Desktop Controls & Action Area */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] cursor-pointer"
            style={{ color: 'var(--landing-muted)' }}
            aria-label={mounted && isMounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
          >
            {mounted && isMounted && theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5" style={{ color: 'var(--landing-primary)' }} />
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)] cursor-pointer"
            style={{ color: 'var(--landing-muted)', backgroundColor: 'var(--landing-soft)' }}
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            <span>{language === 'en' ? 'EN' : 'VI'}</span>
          </button>

          {/* Auth Actions */}
          {isAuth ? (
            <Link
              href={getDashboardUrl()}
              className="h-[48px] px-6 rounded-[12px] text-sm font-semibold text-white shadow-md transition-all duration-150 hover:shadow-lg active:translate-y-[1px] flex items-center justify-center gap-2"
              style={{ background: 'var(--landing-gradient)' }}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('dashboard')}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold transition-colors duration-150 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)]"
                style={{ color: 'var(--landing-fg)' }}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="h-[48px] px-6 rounded-[12px] text-sm font-semibold text-white shadow-md transition-all duration-150 hover:shadow-lg active:translate-y-[1px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-primary)]"
                style={{ background: 'var(--landing-gradient)' }}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors duration-150"
            style={{ color: 'var(--landing-muted)' }}
            aria-label={mounted && isMounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
          >
            {mounted && isMounted && theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5" style={{ color: 'var(--landing-primary)' }} />
            )}
          </button>

          <button
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg transition-colors duration-150"
            style={{ color: 'var(--landing-muted)' }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="landing-mobile-menu"
          className="md:hidden py-5 px-6 space-y-4 border-t"
          style={{
            backgroundColor: 'var(--landing-surface)',
            borderColor: 'var(--landing-border)',
          }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="space-y-1.5 pb-4" style={{ borderBottom: '1px solid var(--landing-border)' }}>
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={`mobile-${link.id}`}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.id)}
                  aria-current={isActive ? 'location' : undefined}
                  className="block py-2.5 text-base font-medium transition-colors duration-150"
                  style={{
                    color: isActive ? 'var(--landing-primary)' : 'var(--landing-fg)',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {t(link.labelKey)}
                </a>
              );
            })}
          </div>

          <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--landing-border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--landing-muted)' }}>
              Ngôn ngữ / Language
            </span>
            <button
              onClick={toggleLanguage}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors duration-150"
              style={{ color: 'var(--landing-fg)', backgroundColor: 'var(--landing-soft)' }}
              aria-label="Switch language"
            >
              <Languages className="h-4 w-4" />
              {language === 'en' ? 'English' : 'Tiếng Việt'}
            </button>
          </div>

          {isAuth ? (
            <Link
              href={getDashboardUrl()}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-3.5 rounded-xl text-center text-sm font-semibold text-white transition-all duration-150"
              style={{ background: 'var(--landing-gradient)' }}
            >
              {t('dashboard')}
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 rounded-xl text-center text-sm font-semibold transition-colors duration-150"
                style={{
                  color: 'var(--landing-fg)',
                  border: '1px solid var(--landing-border)',
                }}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="h-[48px] rounded-[12px] flex items-center justify-center text-sm font-bold text-white transition-all duration-150"
                style={{ background: 'var(--landing-gradient)' }}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
