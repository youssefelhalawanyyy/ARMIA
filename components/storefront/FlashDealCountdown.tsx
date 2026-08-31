'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Clock, Flame, Sparkles, Timer } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMounted } from '@/hooks/useIsMounted';

interface FlashDealCountdownProps {
  endTime: string;
  title?: string;
  discountBadge?: string;
  compact?: boolean;
}

export default function FlashDealCountdown({
  endTime,
  title,
  discountBadge,
  compact = false,
}: FlashDealCountdownProps) {
  const mounted = useIsMounted();
  const { isArabic } = useLanguage();

  const defaultTitle = isArabic ? 'عرض خاص حصري لفترة محدودة' : 'EXCLUSIVE LIMITED TIME OFFER';
  const displayTitle = title || defaultTitle;

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalRemainingMs: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalRemainingMs: 0,
  });

  useEffect(() => {
    if (!endTime) return;

    const targetDate = new Date(endTime).getTime();

    const calculateTime = () => {
      const difference = targetDate - Date.now();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalRemainingMs: 0,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalRemainingMs: difference,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!mounted || timeLeft.isExpired) {
    return null;
  }

  // COMPACT VERSION (for product cards, lists, or headers)
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#DCC9A6] px-2.5 py-1 text-[11px] font-mono border border-[#333333] shadow-sm rounded-lg backdrop-blur-sm group hover:border-[#DCC9A6] transition-colors">
        <Zap className="w-3.5 h-3.5 text-[#B67355] fill-current animate-pulse shrink-0" />
        <span className="font-bold text-white tracking-wider">
          {timeLeft.days > 0 ? `${timeLeft.days}${isArabic ? 'ي ' : 'd '}` : ''}
          {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
          <span className="text-[#DCC9A6] font-extrabold">{String(timeLeft.seconds).padStart(2, '0')}</span>
        </span>
      </div>
    );
  }

  // FULL LUXURY FLASH SALE CARD (for Product Details Page)
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1F1F1F] via-[#171717] to-[#121212] border border-[#B67355]/40 p-4 sm:p-5 text-white shadow-xl">
      {/* Ambient background glow & radial highlights */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#B67355]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#DCC9A6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#333333] pb-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#B67355] to-[#DCC9A6] flex items-center justify-center text-[#1F1F1F] shadow-lg shadow-[#B67355]/20 animate-pulse">
            <Flame className="w-4 h-4 fill-current text-[#1F1F1F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#DCC9A6]">
                {isArabic ? '⚡ عرض استثنائي محدود' : '⚡ EXCLUSIVE FLASH DEAL'}
              </span>
              {discountBadge && (
                <span className="bg-[#B67355] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-sans uppercase shadow-sm tracking-wider">
                  {discountBadge}
                </span>
              )}
            </div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-[240px] sm:max-w-xs mt-0.5">
              {displayTitle}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#242424] border border-[#3A3A3A] rounded-full text-xs text-[#DCC9A6]">
          <Timer className="w-3.5 h-3.5 text-[#B67355] animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-sans font-semibold text-[11px] tracking-wider uppercase">
            {isArabic ? 'ينتهي العرض قريباً' : 'Ending Soon'}
          </span>
        </div>
      </div>

      {/* Digital Countdown Timer Boxes */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center relative z-10" dir="ltr">
        {/* Days */}
        <div className="group bg-[#141414]/90 border border-[#333333] hover:border-[#DCC9A6]/60 p-2.5 sm:p-3 rounded-xl shadow-inner transition-all flex flex-col items-center justify-center">
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none group-hover:scale-105 transition-transform">
            {String(timeLeft.days).padStart(2, '0')}
          </div>
          <span className="text-[9px] uppercase font-sans font-bold tracking-widest text-[#8E8A85] mt-1.5">
            {isArabic ? 'يوم' : 'Days'}
          </span>
        </div>

        {/* Hours */}
        <div className="group bg-[#141414]/90 border border-[#333333] hover:border-[#DCC9A6]/60 p-2.5 sm:p-3 rounded-xl shadow-inner transition-all flex flex-col items-center justify-center">
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none group-hover:scale-105 transition-transform">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <span className="text-[9px] uppercase font-sans font-bold tracking-widest text-[#8E8A85] mt-1.5">
            {isArabic ? 'ساعة' : 'Hours'}
          </span>
        </div>

        {/* Minutes */}
        <div className="group bg-[#141414]/90 border border-[#333333] hover:border-[#DCC9A6]/60 p-2.5 sm:p-3 rounded-xl shadow-inner transition-all flex flex-col items-center justify-center">
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#DCC9A6] tracking-tight leading-none group-hover:scale-105 transition-transform">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <span className="text-[9px] uppercase font-sans font-bold tracking-widest text-[#8E8A85] mt-1.5">
            {isArabic ? 'دقيقة' : 'Mins'}
          </span>
        </div>

        {/* Seconds */}
        <div className="group bg-[#141414]/90 border border-[#B67355]/60 hover:border-[#B67355] p-2.5 sm:p-3 rounded-xl shadow-inner transition-all flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-[#B67355] animate-pulse" />
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#B67355] tracking-tight leading-none group-hover:scale-105 transition-transform animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <span className="text-[9px] uppercase font-sans font-bold tracking-widest text-[#DCC9A6] mt-1.5">
            {isArabic ? 'ثانية' : 'Secs'}
          </span>
        </div>
      </div>

      {/* Subtle Bottom Guarantee Tag */}
      <div className="mt-3.5 pt-2.5 border-t border-[#2A2A2A] flex items-center justify-between text-[11px] text-[#8E8A85] font-sans">
        <span className="flex items-center gap-1 text-[#DCC9A6]">
          <Sparkles className="w-3.5 h-3.5 text-[#B67355]" />
          <span>{isArabic ? 'شحن فوري ومعاينة مجانية عند الاستلام' : 'Express Delivery & Free Inspection on Arrival'}</span>
        </span>
        <span className="font-mono text-[10px] text-[#666666]">ARMIA ATELIER</span>
      </div>
    </div>
  );
}
