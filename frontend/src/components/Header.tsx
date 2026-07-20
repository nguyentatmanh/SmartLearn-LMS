'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { GraduationCap, Sun, Moon, Languages, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';

export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isHomepage = !pathname || pathname === '/';
  const isAuth = mounted && isAuthenticated;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const getDashboardUrl = () => {
    if (user?.role === 'admin') return '/dashboard/admin';
    return user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
  };

  // Close mobile menu on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const navLinks = [
    { href: '#features', labelKey: 'navFeatures' },
    { href: '#solutions', labelKey: 'navSolutions' },
    { href: '#how-it-works', labelKey: 'navHowItWorks' },
    { href: '#responsible-ai', labelKey: 'navResponsibleAI' },
  ];

  return (
    <header suppressHydrationWarning className="sticky top-0 z-40 w-full bg-card/90 backdrop-blur-md border-b border-border transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring px-1 py-0.5"
          aria-label="SmartLearn LMS Home"
        >
          <GraduationCap className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            SmartLearn <span className="text-primary">LMS</span>
          </span>
        </Link>

        {/* Section Navigation Links — desktop only, homepage only */}
        {isHomepage && (
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-muted-foreground" aria-label="Page sections">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-3 py-1.5 rounded-lg hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t(link.labelKey as any)}
              </a>
            ))}
          </nav>
        )}

        {/* Desktop Controls */}
        <nav className="hidden md:flex items-center gap-2">
          {isAuth && (
            <Link
              href={getDashboardUrl()}
              className="text-[13px] font-medium hover:text-primary transition-colors duration-150 flex items-center gap-1.5 px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('dashboard')}
            </Link>
          )}

          {/* Theme Toggle — no title attr */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label={mounted && isMounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
          >
            {mounted && isMounted && theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px] text-amber-400" />
            ) : (
              <Moon className="h-[18px] w-[18px] text-indigo-500" />
            )}
          </button>

          {/* Language Toggle — no title attr */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-lg hover:bg-muted text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            <span>{language === 'en' ? 'EN' : 'VI'}</span>
          </button>

          {/* Auth Actions */}
          {isAuth ? (
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold hover:bg-rose-500/10 hover:text-rose-600 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 ml-1.5">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-[13px] font-semibold text-foreground hover:text-primary transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-[13px] font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile trigger */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors duration-150"
            aria-label={mounted && isMounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
          >
            {mounted && isMounted && theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px] text-amber-400" />
            ) : (
              <Moon className="h-[18px] w-[18px] text-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors duration-150"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border py-4 px-5 space-y-3">
          {isHomepage && (
            <div className="space-y-1 pb-3 border-b border-border">
              {navLinks.map((link) => (
                <a
                  key={`mobile-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors duration-150"
                >
                  {t(link.labelKey as any)}
                </a>
              ))}
            </div>
          )}

          {isAuth && (
            <Link
              href={getDashboardUrl()}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium hover:text-primary border-b border-border"
            >
              {t('dashboard')}
            </Link>
          )}

          {/* Language Switch */}
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <span className="text-xs text-muted-foreground font-medium">Ngôn ngữ / Language</span>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-lg bg-surface-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-muted transition-colors duration-150"
              aria-label="Switch language"
            >
              <Languages className="h-3.5 w-3.5" />
              {language === 'en' ? 'English' : 'Tiếng Việt'}
            </button>
          </div>

          {/* Auth */}
          {isAuth ? (
            <button
              onClick={() => { setMobileMenuOpen(false); logout(); }}
              className="w-full py-2.5 rounded-lg text-center text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-lg border border-border text-center text-xs font-semibold hover:bg-muted transition-colors duration-150"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 rounded-lg bg-primary text-primary-foreground text-center text-xs font-bold hover:opacity-90 transition-opacity duration-150"
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
