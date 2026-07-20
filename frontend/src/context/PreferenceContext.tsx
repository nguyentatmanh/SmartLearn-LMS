'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey, LanguageCode } from '@/lib/i18n';

type Theme = 'light' | 'dark';

interface PreferenceContextType {
  theme: Theme;
  language: LanguageCode;
  toggleTheme: () => void;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatError: (error: unknown) => string;
  isMounted: boolean;
}

const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

export function PreferenceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isMounted, setIsMounted] = useState(false);

  // Synchronize with localStorage on client mount in hydration-safe manner
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      const savedLanguage = localStorage.getItem('language') as LanguageCode;

      const initialTheme = savedTheme || 'dark';
      const initialLanguage = savedLanguage === 'vi' ? 'vi' : 'en';

      setTheme(initialTheme);
      setLanguage(initialLanguage);

      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(initialTheme);
    } catch (e) {
      console.error('Failed to access localStorage for preferences:', e);
    } finally {
      setIsMounted(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };

  const changeLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    try {
      localStorage.setItem('language', lang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const activeLang = isMounted ? language : 'en';
    const dict = translations[activeLang] || translations['en'];
    const fallbackDict = translations['en'];
    
    let translated = (dict as Record<string, string>)[key] || (fallbackDict as Record<string, string>)[key];
    
    if (!translated) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n Warning] Missing translation key "${key}" for language "${activeLang}".`);
      }
      translated = key;
    }
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translated = translated.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return translated;
  };

  const formatDate = (dateInput: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return String(dateInput);
      
      const activeLang = isMounted ? language : 'en';
      const locale = activeLang === 'vi' ? 'vi-VN' : 'en-US';
      const defaultOptions: Intl.DateTimeFormatOptions = options || {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
    } catch (e) {
      return String(dateInput);
    }
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    try {
      const activeLang = isMounted ? language : 'en';
      const locale = activeLang === 'vi' ? 'vi-VN' : 'en-US';
      return new Intl.NumberFormat(locale, options).format(num);
    } catch (e) {
      return String(num);
    }
  };

  const formatError = (error: unknown): string => {
    if (!error) return t('errors.GENERIC_ERROR');
    
    let rawMsg = '';
    let errCode = '';

    if (typeof error === 'string') {
      rawMsg = error;
    } else if (typeof error === 'object' && error !== null) {
      const errObj = error as Record<string, any>;
      if (errObj.response?.data?.detail) {
        const detail = errObj.response.data.detail;
        if (typeof detail === 'string') {
          rawMsg = detail;
        } else if (typeof detail === 'object' && detail !== null) {
          errCode = detail.code || '';
          rawMsg = detail.message || detail.detail || '';
        }
      } else if (errObj.message) {
        rawMsg = errObj.message;
      }
    }

    if (errCode && (translations.en as Record<string, string>)[`errors.${errCode}`]) {
      return t(`errors.${errCode}`);
    }

    if (rawMsg) {
      if (rawMsg.includes('LAST_ADMIN_PROTECTED')) return t('errors.LAST_ADMIN_PROTECTED');
      if (rawMsg.includes('COURSE_CHANGED_DURING_REVIEW')) return t('errors.COURSE_CHANGED_DURING_REVIEW');
      if (rawMsg.includes('ADMIN_POLICY_LOCKOUT_RISK')) return t('errors.ADMIN_POLICY_LOCKOUT_RISK');
      return rawMsg;
    }

    return t('errors.GENERIC_ERROR');
  };

  return (
    <PreferenceContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setLanguage: changeLanguage,
        t,
        formatDate,
        formatNumber,
        formatError,
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
