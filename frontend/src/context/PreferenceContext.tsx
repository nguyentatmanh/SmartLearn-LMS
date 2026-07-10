'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey, LanguageCode } from '@/lib/i18n';

type Theme = 'light' | 'dark';

interface PreferenceContextType {
  theme: Theme;
  language: LanguageCode;
  toggleTheme: () => void;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  isMounted: boolean;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export function PreferenceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize with localStorage on client mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLanguage = localStorage.getItem('language') as LanguageCode;

    const initialTheme = savedTheme || 'dark';
    const initialLanguage = savedLanguage || 'en';

    setTheme(initialTheme);
    setLanguage(initialLanguage);

    // Apply the class to documentElement immediately
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);

    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };

  const changeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    const dict = translations[language] || translations['en'];
    let translated = dict[key] || translations['en'][key] || String(key);
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translated = translated.replace(`{${paramKey}}`, value);
      });
    }
    
    return translated;
  };

  return (
    <PreferenceContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setLanguage: changeLanguage,
        t,
        isMounted,
      }}
    >
      {children}
    </PreferenceContext.Provider>
  );
}

export function usePreference() {
  const context = useContext(PreferenceContext);
  if (context === undefined) {
    throw new Error('usePreference must be used within a PreferenceProvider');
  }
  return context;
}
