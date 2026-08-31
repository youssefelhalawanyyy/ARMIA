'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Clock, Flame } from 'lucide-react';
import { useIsMounted } from '@/hooks/useIsMounted';

interface FlashDealCountdownProps {
  endTime: string;
  title?: string;
  discountBadge?: string;
  compact?: boolean;
}

export default function FlashDealCountdown({
  endTime,
  title = 'LIMITED TIME SPECIAL OFFER',
  discountBadge,
  compact = false,
}: FlashDealCountdownProps) {
  const mounted = useIsMounted();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!endTime) return;

    const calculateTime = () => {
      const difference = new Date(endTime).getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
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
      <div className="inline-flex items-center gap-1.5 bg-[#FAF7F2] text-[#B67355] px-2.5 py-1 text-[11px] font-mono border border-[#DCC9A6] shadow-sm rounded">
        <Zap className="w-3 h-3 text-[#B67355] fill-current animate-pulse" />
        <span className="font-bold text-[#1F1F1F]">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    );
  }

  // FULL LUXURY CASHMERE & GOLD FLASH SALE CARD (for Product Details Page)
  return (
    <div className="bg-[#FAF7F2] border border-[#DCC9A6] p-4 sm:p-5 text-[#1F1F1F] shadow-sm relative overflow-hidden rounded-xl">
      {/* Background ambient luxury light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#DCC9A6]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D8] pb-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#B67355] flex items-center justify-center text-white shadow-sm animate-pulse">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#B67355]">
                ⚡ FLASH DEAL
              </span>
              {discountBadge && (
                <span className="bg-[#B67355] text-white text-[10px] font-bold px-2 py-0.5 rounded font-sans uppercase shadow-sm">
                  {discountBadge}
                </span>
              )}
            </div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-[#1F1F1F] tracking-wide truncate max-w-[240px] sm:max-w-xs mt-0.5">
              {title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#8E8A85] font-sans">
          <Clock className="w-3.5 h-3.5 text-[#B67355]" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Ends In:</span>
        </div>
      </div>

      {/* Digital Countdown Timer Boxes - Warm Ivory & Crisp White */}
      <div className="grid grid-cols-4 gap-2.5 text-center">
        {/* Days */}
        <div className="bg-white border border-[#E8E2D8] py-2.5 px-1.5 rounded-lg shadow-sm">
          <span className="block font-mono text-xl sm:text-2xl font-bold text-[#1F1F1F] tracking-tight">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans font-bold tracking-widest text-[#8E8A85] mt-0.5">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="bg-white border border-[#E8E2D8] py-2.5 px-1.5 rounded-lg shadow-sm">
          <span className="block font-mono text-xl sm:text-2xl font-bold text-[#1F1F1F] tracking-tight">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans font-bold tracking-widest text-[#8E8A85] mt-0.5">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="bg-white border border-[#E8E2D8] py-2.5 px-1.5 rounded-lg shadow-sm">
          <span className="block font-mono text-xl sm:text-2xl font-bold text-[#1F1F1F] tracking-tight">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans font-bold tracking-widest text-[#8E8A85] mt-0.5">
            Mins
          </span>
        </div>

        {/* Seconds */}
        <div className="bg-white border border-[#B67355]/40 py-2.5 px-1.5 rounded-lg shadow-sm relative overflow-hidden">
          <span className="block font-mono text-xl sm:text-2xl font-black text-[#B67355] tracking-tight animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans font-bold tracking-widest text-[#B67355] mt-0.5">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}
