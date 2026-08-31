'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, BellRing, Sparkles, X, Check } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/pushNotificationService';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export default function PushNotificationPrompt() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isArabic } = useLanguage();
  const { success, info } = useToast();

  const [visible, setVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [isGranted, setIsGranted] = useState(false);

  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      setIsGranted(true);
      return;
    }

    if (Notification.permission === 'denied') {
      return;
    }

    const dismissed = localStorage.getItem('armia_push_prompt_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const res = await requestNotificationPermission(user?.uid, user?.displayName || undefined);
      if (res.granted) {
        setIsGranted(true);
        setVisible(false);
        success(
          isArabic
            ? 'تم تفعيل إشعارات الـ VIP بنجاح! ستصلكِ عروض الخصومات وتحديثات الكولكشن فور نزولها ✨'
            : 'VIP Notifications enabled! You will now receive private drop and flash deal alerts ✨',
          isArabic ? 'إشعارات VIP' : 'VIP Alerts'
        );
      } else {
        setVisible(false);
        info(res.message);
      }
    } catch {
      setVisible(false);
    } finally {
      setEnabling(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('armia_push_prompt_dismissed', 'true');
    }
  };

  if (isAdminRoute || !visible || isGranted) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-auto animate-bounceSubtle font-sans">
      <div className="bg-[#1F1F1F] text-white border border-[#DCC9A6] p-4 rounded-2xl shadow-2xl backdrop-blur-md relative flex items-start gap-3.5">
        
        {/* Glow Icon */}
        <div className="w-10 h-10 rounded-xl bg-[#B67355] flex items-center justify-center text-white shrink-0 shadow-md">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>

        {/* Text */}
        <div className="space-y-1 pr-6 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#DCC9A6]">
              ARMIA VIP Concierge
            </span>
            <Sparkles className="w-3 h-3 text-[#DCC9A6] fill-current" />
          </div>

          <h4 className="font-serif font-bold text-sm text-white leading-snug">
            {isArabic ? 'تفعيل تنبيهات الخصومات الحصرية' : 'Get VIP Flash Deal Alerts'}
          </h4>

          <p className="text-[11px] text-[#CCCCCC] leading-relaxed">
            {isArabic
              ? 'اشتركي في إشعارات الهاتف لتصلكِ عروض الخصم الحصرية ومواعيد نزول التشكيلات الجديدة قبل الجميع.'
              : 'Receive instant alerts on private drops, flash sales, and special discounts directly on your screen.'}
          </p>

          {/* Action Button */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={enabling}
              onClick={handleEnable}
              className="bg-[#DCC9A6] hover:bg-white text-[#1F1F1F] px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5 fill-current" />
              <span>{isArabic ? 'تفعيل الإشعارات' : 'Enable Alerts'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#8E8A85] hover:text-white text-xs px-2 py-1"
            >
              {isArabic ? 'لاحقاً' : 'Later'}
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-[#8E8A85] hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
