'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMounted } from '@/hooks/useIsMounted';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact' | 'drawer' | 'footer';
  className?: string;
}

export default function LanguageSwitcher({
  variant = 'pill',
  className = '',
}: LanguageSwitcherProps) {
  const { language, setLanguage, isArabic } = useLanguage();
  const mounted = useIsMounted();

  if (!mounted) {
    return (
      <div className="w-16 h-7 bg-transparent rounded animate-pulse" />
    );
  }

  // COMPACT NAVBAR PILL (Gold / Charcoal luxury toggle)
  if (variant === 'compact' || variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 bg-[#1F1F1F] rounded-full border border-[#DCC9A6]/50 shadow-sm ${className}`}
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 text-[11px] font-sans font-bold uppercase tracking-wider rounded-full transition-all ${
            language === 'en'
              ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
              : 'text-neutral-300 hover:text-white'
          }`}
          title="Switch to English"
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ar')}
          className={`px-2.5 py-1 text-[11px] font-sans font-bold rounded-full transition-all ${
            language === 'ar'
              ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
              : 'text-neutral-300 hover:text-white'
          }`}
          title="التحويل للغة العربية"
        >
          عربي
        </button>
      </div>
    );
  }

  // DRAWER EXPANDED ROW (for mobile navigation menu)
  if (variant === 'drawer') {
    return (
      <div className={`p-3 bg-[#1F1F1F] border border-[#333333] rounded-xl flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2 text-xs font-medium text-[#DCC9A6]">
          <Globe className="w-4 h-4 text-[#DCC9A6]" />
          <span>{isArabic ? 'لغة الموقع' : 'Language / اللغة'}</span>
        </div>
        <div className="flex items-center gap-1 bg-black p-0.5 rounded-lg border border-[#333333]">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              language === 'en'
                ? 'bg-[#DCC9A6] text-[#1F1F1F]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              language === 'ar'
                ? 'bg-[#DCC9A6] text-[#1F1F1F]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            العربية
          </button>
        </div>
      </div>
    );
  }

  // FOOTER ROW
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-[#DCC9A6]" />
      <span className="text-xs text-[#8E8A85]">
        {isArabic ? 'اللغة:' : 'Language:'}
      </span>
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="px-3 py-1 text-xs font-bold font-sans uppercase tracking-wider bg-[#141414] text-[#DCC9A6] border border-[#333333] hover:border-[#DCC9A6] rounded transition-all active:scale-95"
      >
        {isArabic ? 'English (EN)' : 'العربية (AR)'}
      </button>
    </div>
  );
}
