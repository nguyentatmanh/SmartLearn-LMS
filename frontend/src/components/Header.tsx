'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { GraduationCap, Sun, Moon, Globe, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';

export default function AppHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t, isMounted } = usePreference();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const getDashboardUrl = () => {
    if (user?.role === 'admin') return '/dashboard/admin';
    return user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-border backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-foreground">{"SmartLearn "}<span className="text-primary">{"LMS"}</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated && (
            <Link
              href={getDashboardUrl()}
              className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('dashboard')}
            </Link>
          )}

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all focus:ring-2 focus:ring-ring focus:outline-none"
            aria-label="Toggle theme appearance"
            title="Toggle theme"
          >
            {isMounted && theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>

          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 focus:ring-2 focus:ring-ring focus:outline-none"
            aria-label="Switch language preference"
            title="Switch Language"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{language === 'en' ? 'EN' : 'VI'}</span>
          </button>

          {/* Auth Actions */}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-border hover:bg-red-500/10 hover:text-danger hover:border-danger/30 transition-all flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-sm font-bold bg-primary hover:bg-primary/95 text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/10"
              >
                {t('register')}
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {/* Quick theme toggle for mobile header */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme appearance"
          >
            {isMounted && theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-border py-4 px-6 space-y-4 fade-in">
          {isAuthenticated && (
            <Link
              href={getDashboardUrl()}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-semibold hover:text-primary border-b border-border/50"
            >
              {t('dashboard')}
            </Link>
          )}

          {/* Quick Lang Switch */}
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-xs text-muted-foreground font-semibold">Language / Ngôn ngữ</span>
            <button
              onClick={toggleLanguage}
              className="px-4 py-1.5 rounded-lg border border-border bg-card text-xs font-bold flex items-center gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              {language === 'en' ? 'EN' : 'VI'}
            </button>
          </div>

          {/* Logout or Auth */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full py-3 rounded-xl text-center text-sm font-bold bg-danger/10 hover:bg-danger/25 text-danger border border-danger/20 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 rounded-xl border border-border text-center text-sm font-semibold hover:bg-muted transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 rounded-xl bg-primary text-primary-foreground text-center text-sm font-bold hover:bg-primary/95 transition-colors"
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
