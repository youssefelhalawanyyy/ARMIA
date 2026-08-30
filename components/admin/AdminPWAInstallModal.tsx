'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  Smartphone,
  CheckCircle,
  Share,
  PlusSquare,
  Zap,
  Package,
  Printer,
} from 'lucide-react';
import { usePWA } from '@/context/PWAContext';

interface AdminPWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPWAInstallModal({
  isOpen,
  onClose,
}: AdminPWAInstallModalProps) {
  const { isInstalled, promptInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  const [isIOS] = useState(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    }
    return false;
  });

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await promptInstall();
      onClose();
    } catch (e) {
      console.warn('PWA Install prompt notice:', e);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismissForever = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('armia_admin_pwa_dismissed_v2', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 no-print">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-lg bg-[#181818] border-2 border-[#DCC9A6]/60 shadow-2xl p-6 sm:p-8 z-10 text-white overflow-hidden"
        >
          {/* Top Gold Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F2E9DA] via-[#DCC9A6] to-[#B67355]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#8E8A85] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Icon & Branding Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-20 h-20 rounded-2xl bg-[#141414] border-2 border-[#DCC9A6] overflow-hidden shrink-0 shadow-lg p-1.5 flex items-center justify-center">
              <Image
                src="/icons/admin-icon.svg"
                alt="ARMIA Admin App Icon"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] bg-black text-[#DCC9A6] px-2 py-0.5 border border-[#333333]">
                  PWA Mobile & Desktop
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live App
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                ARMIA Admin App
              </h3>
              <p className="text-xs text-[#DCC9A6] font-sans">
                تطبيق إدارة البوتيك والمبيعات والمخزون
              </p>
            </div>
          </div>

          {/* Value Prop Badges */}
          <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs font-sans">
            <div className="bg-[#141414] border border-[#333333] p-2.5 rounded flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-[#DCC9A6] shrink-0" />
              <div>
                <p className="font-semibold text-white text-[11px]">Real-time Orders</p>
                <p className="text-[10px] text-[#8E8A85]">متابعة وتحديث فوري</p>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#333333] p-2.5 rounded flex items-center gap-2.5">
              <Package className="w-4 h-4 text-[#DCC9A6] shrink-0" />
              <div>
                <p className="font-semibold text-white text-[11px]">Stock Control</p>
                <p className="text-[10px] text-[#8E8A85]">إدارة الكتالوج والمخزون</p>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#333333] p-2.5 rounded flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-[#DCC9A6] shrink-0" />
              <div>
                <p className="font-semibold text-white text-[11px]">1-Tap Invoicing</p>
                <p className="text-[10px] text-[#8E8A85]">طباعة فورية للفواتير</p>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#333333] p-2.5 rounded flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-[#DCC9A6] shrink-0" />
              <div>
                <p className="font-semibold text-white text-[11px]">Home Screen App</p>
                <p className="text-[10px] text-[#8E8A85]">وصول سريع من الشاشة</p>
              </div>
            </div>
          </div>

          {/* Platform-Specific Instructions & Triggers */}
          {isInstalled ? (
            <div className="bg-emerald-950/60 border border-emerald-700 p-4 rounded text-center text-xs space-y-1 mb-6">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="font-bold text-emerald-300 text-sm">
                ARMIA Admin App is Installed!
              </p>
              <p className="text-neutral-300 text-[11px]">
                You can launch the app directly from your home screen or desktop application menu.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="bg-[#141414] border border-[#DCC9A6]/40 p-4 rounded space-y-3 mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-[#DCC9A6]">
                <Smartphone className="w-4 h-4" />
                <span>How to Install on iPhone / iPad (Safari):</span>
              </div>
              <ol className="text-xs text-neutral-300 space-y-2 font-sans pl-1">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#333333] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button ( <Share className="w-3.5 h-3.5 inline text-[#DCC9A6]" /> ) in Safari toolbar.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#333333] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> ( <PlusSquare className="w-3.5 h-3.5 inline text-[#DCC9A6]" /> ).
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#333333] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> in top right corner. The <strong>ARMIA Admin</strong> icon will appear on your home screen!
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            /* Android / Chrome / Edge 1-Click Install Button */
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full bg-[#DCC9A6] text-[#1F1F1F] py-3.5 px-4 text-xs uppercase tracking-[0.2em] font-sans font-extrabold flex items-center justify-center gap-2.5 hover:bg-white transition-all shadow-xl active:scale-[0.99] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{installing ? 'Preparing App...' : 'Install Admin App (تثبيت التطبيق)'}</span>
              </button>
              <p className="text-[11px] text-[#8E8A85] text-center font-sans">
                Installs standalone app for Chrome, Edge, Android & macOS.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#333333] text-xs font-sans">
            <button
              type="button"
              onClick={handleDismissForever}
              className="text-[#8E8A85] hover:text-white underline text-[11px] transition-colors"
            >
              Don&apos;t show again
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[#2A2A2A] text-white px-4 py-1.5 rounded hover:bg-[#333333] transition-colors text-[11px] font-medium"
            >
              Continue to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
