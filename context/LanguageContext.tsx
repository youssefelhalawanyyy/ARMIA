'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, Translations, translations } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: Language;
  direction: 'ltr' | 'rtl';
  isArabic: boolean;
  t: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'armia_language_v1';

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with safe default or detection if in browser
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (stored === 'ar' || stored === 'en') {
        setLanguageState(stored);
        return;
      }

      // Auto-detect based on device / mobile / browser language
      const userLang = window.navigator.language || (window.navigator as { userLanguage?: string }).userLanguage || '';
      if (userLang.toLowerCase().startsWith('ar')) {
        setLanguageState('ar');
      } else {
        setLanguageState('en');
      }
    } catch {
      // ignore
    }
  }, []);

  const direction: 'ltr' | 'rtl' = useMemo(() => (language === 'ar' ? 'rtl' : 'ltr'), [language]);
  const isArabic = language === 'ar';
  const t = translations[language] || translations.en;

  // Synchronize document attributes whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = direction;
      
      if (isArabic) {
        document.body.classList.add('font-arabic');
      } else {
        document.body.classList.remove('font-arabic');
      }
    }
  }, [language, direction, isArabic]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch {
        // ignore
      }
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        isArabic,
        t,
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
