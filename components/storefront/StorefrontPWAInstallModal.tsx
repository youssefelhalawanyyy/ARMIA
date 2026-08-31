'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  X,
  Sparkles,
  Share,
  PlusSquare,
  Zap,
  Smartphone,
} from 'lucide-react';
import { usePWA } from '@/context/PWAContext';
import { useLanguage } from '@/context/LanguageContext';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function StorefrontPWAInstallModal() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const { t, isArabic } = useLanguage();
  const mounted = useIsMounted();

  const [modalOpen, setModalOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  const [isIOS] = useState(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    }
    return false;
  });

  const [isStandalone] = useState(() => {
    if (typeof window !== 'undefined') {
      const nav = window.navigator as { standalone?: boolean };
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        nav.standalone === true
      );
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !isStandalone && !isInstalled) {
      const dismissed = localStorage.getItem('armia_client_pwa_dismissed_v1');
      if (!dismissed) {
        const timer = setTimeout(() => {
          setBannerVisible(true);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [isStandalone, isInstalled]);

  if (!mounted || isStandalone || isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
      setModalOpen(false);
      setBannerVisible(false);
    } else {
      setModalOpen(true);
      setBannerVisible(false);
    }
  };

  const handleDismissBanner = () => {
    setBannerVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('armia_client_pwa_dismissed_v1', 'true');
    }
  };

  return (
    <>
      {/* 1. FLOATING LUXURY MOBILE INSTALL INVITATION PILL */}
      {bannerVisible && !modalOpen && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto animate-bounce-subtle">
          <div className="bg-[#141414]/95 border border-[#DCC9A6] text-white p-3.5 shadow-2xl rounded-2xl flex items-center justify-between gap-3 backdrop-blur-xl">
            {/* App Icon */}
            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-black border border-[#DCC9A6]/40 shrink-0 flex items-center justify-center p-1">
              <Image
                src="/icons/icon.svg"
                alt="ARMIA App Icon"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setModalOpen(true)}>
              <div className="flex items-center gap-1">
                <span className="text-xs font-serif font-bold text-[#DCC9A6] tracking-wide">
                  {t.pwa.appTitle}
                </span>
                <span className="text-[9px] bg-[#B67355] text-white px-1.5 py-0.2 rounded font-sans font-bold uppercase">
                  {t.pwa.appPill}
                </span>
              </div>
              <p className="text-[10px] text-neutral-300 truncate mt-0.5">
                {t.pwa.appDesc}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-[#DCC9A6] text-[#1F1F1F] px-3 py-1.5 text-[11px] font-sans font-bold uppercase tracking-wider rounded-lg shadow hover:bg-white transition-all active:scale-95 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>{t.pwa.getApp}</span>
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-1 text-neutral-400 hover:text-white rounded"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FULL LUXURY INSTALL MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#181818] border-2 border-[#DCC9A6] p-6 sm:p-8 shadow-2xl text-white rounded-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / App Crest */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-black border border-[#DCC9A6] mx-auto mb-3 flex items-center justify-center p-2 shadow-lg">
                <Image
                  src="/icons/icon.svg"
                  alt="ARMIA App Crest"
                  width={52}
                  height={52}
                  className="object-contain"
                />
              </div>

              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-[#DCC9A6] block">
                {t.pwa.officialApp}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                ARMIA BOUTIQUE
              </h3>
              <p className="text-xs text-[#8E8A85] font-sans mt-1">
                {t.pwa.appSubtitle}
              </p>
            </div>

            {/* App Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-[#141414] border border-[#333333] p-3 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#DCC9A6] font-bold">
                  <Zap className="w-3.5 h-3.5 text-[#DCC9A6]" />
                  <span>{t.pwa.featureSpeed}</span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  {t.pwa.featureSpeedDesc}
                </p>
              </div>

              <div className="bg-[#141414] border border-[#333333] p-3 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-[#B67355] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>{t.pwa.featurePerks}</span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  {t.pwa.featurePerksDesc}
                </p>
              </div>
            </div>

            {/* Platform Installation Guide */}
            {isIOS ? (
              /* iOS Safari 3-Step Guide */
              <div className="bg-[#141414] border border-[#DCC9A6]/50 p-4 rounded-xl space-y-3 mb-6">
                <p className="text-xs font-bold text-[#DCC9A6] uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>{t.pwa.iosTitle}</span>
                </p>

                <ol className="space-y-2.5 text-xs text-neutral-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#333333] text-[#DCC9A6] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      {isArabic ? (
                        <>اضغطي على زر المشاركة <Share className="w-3.5 h-3.5 inline text-[#DCC9A6] mx-0.5" /> أسفل متصفح سفاري.</>
                      ) : (
                        <>Tap the <strong className="text-white">Share</strong> button <Share className="w-3.5 h-3.5 inline text-[#DCC9A6] mx-0.5" /> at the bottom of Safari.</>
                      )}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#333333] text-[#DCC9A6] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>
                      {isArabic ? (
                        <>مرري لأسفل واختاري <strong className="text-white">إضافة إلى الشاشة الرئيسية</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#DCC9A6] mx-0.5" />.</>
                      ) : (
                        <>Scroll down and tap <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-[#DCC9A6] mx-0.5" />.</>
                      )}
                    </span>
                  </li>

                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#333333] text-[#DCC9A6] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>
                      {isArabic ? (
                        <>اضغطي على <strong className="text-white">إضافة</strong> في الزاوية العلوية لاكتمال التثبيت.</>
                      ) : (
                        <>Tap <strong className="text-white">Add</strong> in the top right corner to finish.</>
                      )}
                    </span>
                  </li>
                </ol>
              </div>
            ) : isInstallable ? (
              /* Android / Chrome 1-Click Install */
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full bg-[#DCC9A6] text-[#1F1F1F] py-3.5 text-xs uppercase font-extrabold tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.pwa.installButton}</span>
                </button>
              </div>
            ) : (
              /* Generic Browser Instruction */
              <div className="bg-[#141414] border border-[#333333] p-4 rounded-xl text-xs text-neutral-300 mb-6 space-y-2">
                <p className="font-bold text-[#DCC9A6]">
                  {isArabic ? 'للتثبيت عبر الأندرويد أو الكمبيوتر:' : 'To install on Android or Desktop:'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {isArabic
                    ? 'افتحي قائمة المتصفح (⋮) واختاري "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".'
                    : 'Open your browser menu (⋮) and choose "Install app" or "Add to Home screen".'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full text-center text-xs text-neutral-400 hover:text-white py-2"
            >
              {t.pwa.continueBrowser}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
