'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BellRing, Sparkles, X, ArrowRight } from 'lucide-react';
import { listenToLiveBroadcasts, autoSyncPushSubscription } from '@/lib/pushNotificationService';
import { BroadcastNotification } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export default function BroadcastNotificationReceiver() {
  const pathname = usePathname();
  const { isArabic } = useLanguage();
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastNotification | null>(null);

  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    // Only client storefront pages receive and sync storefront notifications
    if (isAdminRoute) return;

    // Automatically ensure the client device has a valid VAPID subscription
    autoSyncPushSubscription().catch(() => {});

    const unsubscribe = listenToLiveBroadcasts((broadcast) => {
      setActiveBroadcast(broadcast);

      // Auto-dismiss in-app banner after 12 seconds if not interacted with
      const timer = setTimeout(() => {
        setActiveBroadcast(null);
      }, 12000);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
    };
  }, [isAdminRoute]);

  // Never render storefront VIP popup banners inside the Admin Portal
  if (isAdminRoute || !activeBroadcast) return null;

  const displayTitle =
    isArabic && activeBroadcast.titleArabic ? activeBroadcast.titleArabic : activeBroadcast.title;
  const displayBody =
    isArabic && activeBroadcast.bodyArabic ? activeBroadcast.bodyArabic : activeBroadcast.body;

  return (
    <aside
      aria-label="VIP Notification Announcement"
      className="fixed top-4 right-4 sm:right-6 left-4 sm:left-auto z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto animate-bounceSubtle font-sans"
    >
      <div className="bg-[#141414]/95 text-white border-2 border-[#DCC9A6] p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl relative flex items-start gap-3.5">
        
        {/* Glowing Badge Icon */}
        <div className="w-10 h-10 rounded-xl bg-[#B67355] flex items-center justify-center text-white shrink-0 shadow-md">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>

        {/* Content */}
        <div className="space-y-1.5 pr-6 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#DCC9A6] bg-[#000000] px-1.5 py-0.5 rounded border border-[#333333]">
              ARMIA VIP ALERT
            </span>
            <Sparkles className="w-3 h-3 text-[#DCC9A6] fill-current" />
          </div>

          <h4 className="font-serif font-bold text-sm text-white leading-snug">
            {displayTitle}
          </h4>

          <p className="text-[11px] text-[#D5D5D5] leading-relaxed">
            {displayBody}
          </p>

          <div className="pt-2 flex items-center gap-2">
            <Link
              href={activeBroadcast.targetUrl || '/'}
              onClick={() => setActiveBroadcast(null)}
              className="bg-[#DCC9A6] hover:bg-white text-[#1F1F1F] px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <span>{isArabic ? 'تسوقي الآن' : 'Shop Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setActiveBroadcast(null)}
              className="text-[#8E8A85] hover:text-white text-xs px-2 py-1"
            >
              {isArabic ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => setActiveBroadcast(null)}
          className="absolute top-3 right-3 text-[#8E8A85] hover:text-white p-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </aside>
  );
}
