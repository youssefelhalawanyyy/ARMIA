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
  title = 'LIMITED TIME FLASH DEAL',
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

  // COMPACT VERSION (for product cards or headers)
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-[#1F1F1F] text-[#DCC9A6] px-2.5 py-1 text-[11px] font-mono border border-[#DCC9A6]/40 shadow-sm rounded">
        <Zap className="w-3 h-3 text-[#E5A84B] animate-pulse" />
        <span className="font-bold text-[#E5A84B]">
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    );
  }

  // FULL LUXURY FLASH SALE CARD (for Product Details Page)
  return (
    <div className="bg-gradient-to-r from-[#141414] via-[#1F1F1F] to-[#141414] border-2 border-[#DCC9A6] p-4 text-white shadow-xl relative overflow-hidden rounded-xl my-4">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#B67355]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#333333] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#B67355] flex items-center justify-center text-white shadow-md animate-pulse">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#DCC9A6]">
                ⚡ FLASH DEAL
              </span>
              {discountBadge && (
                <span className="bg-[#B67355] text-white text-[10px] font-bold px-2 py-0.5 rounded font-sans uppercase">
                  {discountBadge}
                </span>
              )}
            </div>
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              {title}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#DCC9A6] font-sans">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wider">Ends In:</span>
        </div>
      </div>

      {/* Digital Countdown Timer Boxes */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {/* Days */}
        <div className="bg-[#000000] border border-[#333333] p-2 rounded-lg shadow-inner">
          <span className="block font-mono text-xl sm:text-2xl font-black text-[#DCC9A6] tracking-tight">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans tracking-widest text-[#8E8A85] mt-0.5">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="bg-[#000000] border border-[#333333] p-2 rounded-lg shadow-inner">
          <span className="block font-mono text-xl sm:text-2xl font-black text-[#DCC9A6] tracking-tight">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans tracking-widest text-[#8E8A85] mt-0.5">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="bg-[#000000] border border-[#333333] p-2 rounded-lg shadow-inner">
          <span className="block font-mono text-xl sm:text-2xl font-black text-[#DCC9A6] tracking-tight">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans tracking-widest text-[#8E8A85] mt-0.5">
            Mins
          </span>
        </div>

        {/* Seconds */}
        <div className="bg-[#000000] border border-[#B67355]/60 p-2 rounded-lg shadow-inner relative overflow-hidden">
          <span className="block font-mono text-xl sm:text-2xl font-black text-[#E5A84B] tracking-tight animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="block text-[9px] uppercase font-sans tracking-widest text-[#B67355] mt-0.5 font-bold">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}
