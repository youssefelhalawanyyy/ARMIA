'use client';

import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMounted } from '@/hooks/useIsMounted';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact' | 'drawer' | 'footer' | 'floating';
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
      <div className="w-16 h-7 bg-transparent rounded-full border border-[#DCC9A6]/20 animate-pulse" />
    );
  }

  // COMPACT NAVBAR PILL (Gold / Charcoal luxury toggle)
  if (variant === 'compact' || variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 bg-[#1F1F1F] rounded-full border border-[#DCC9A6]/60 shadow-sm select-none ${className}`}
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 sm:px-3 py-1 text-[11px] font-sans font-bold uppercase tracking-wider rounded-full transition-all duration-200 active:scale-95 ${
            language === 'en'
              ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-md font-extrabold'
              : 'text-[#DCC9A6]/70 hover:text-white'
          }`}
          title="Switch to English"
          aria-label="Switch to English"
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ar')}
          className={`px-2.5 sm:px-3 py-1 text-[11px] font-sans font-bold rounded-full transition-all duration-200 active:scale-95 ${
            language === 'ar'
              ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-md font-extrabold'
              : 'text-[#DCC9A6]/70 hover:text-white'
          }`}
          title="التحويل للغة العربية"
          aria-label="التحويل للغة العربية"
        >
          عربي
        </button>
      </div>
    );
  }

  // DRAWER EXPANDED ROW (for mobile navigation menu)
  if (variant === 'drawer') {
    return (
      <div className={`p-3 bg-[#1F1F1F] border border-[#333333] rounded-xl flex items-center justify-between shadow-md ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#DCC9A6]">
          <Globe className="w-4 h-4 text-[#B67355]" />
          <span>{isArabic ? 'لغة الموقع / Language' : 'Language / لغة الموقع'}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-lg border border-[#333333]">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all active:scale-95 flex items-center gap-1 ${
              language === 'en'
                ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {language === 'en' && <Check className="w-3 h-3 text-[#1F1F1F]" />}
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all active:scale-95 flex items-center gap-1 ${
              language === 'ar'
                ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {language === 'ar' && <Check className="w-3 h-3 text-[#1F1F1F]" />}
            <span>العربية</span>
          </button>
        </div>
      </div>
    );
  }

  // FLOATING MOBILE QUICK TOGGLE
  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className={`inline-flex items-center gap-1.5 bg-[#1F1F1F]/90 text-[#DCC9A6] border border-[#DCC9A6]/50 px-3 py-1.5 text-xs font-bold rounded-full shadow-lg backdrop-blur-md active:scale-95 transition-all ${className}`}
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-[#B67355]" />
        <span>{isArabic ? 'English' : 'عربي'}</span>
      </button>
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
        className="px-3 py-1 text-xs font-bold font-sans uppercase tracking-wider bg-[#141414] text-[#DCC9A6] border border-[#333333] hover:border-[#DCC9A6] rounded transition-all active:scale-95 shadow-sm"
      >
        {isArabic ? 'English (EN)' : 'العربية (AR)'}
      </button>
    </div>
  );
}
