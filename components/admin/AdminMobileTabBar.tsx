'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Store,
  Smartphone,
  LogOut,
  X,
  Plus,
} from 'lucide-react';
import { usePWA } from '@/context/PWAContext';
import { useAuth } from '@/context/AuthContext';

interface AdminMobileTabBarProps {
  onOpenInstallModal: () => void;
}

export default function AdminMobileTabBar({ onOpenInstallModal }: AdminMobileTabBarProps) {
  const pathname = usePathname();
  const { isInstalled } = usePWA();
  const { user, logout } = useAuth();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const tabs = [
    {
      name: 'Overview',
      arabic: 'الرئيسية',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Orders',
      arabic: 'الطلبات',
      href: '/admin/orders',
      icon: ShoppingBag,
    },
    {
      name: 'Catalog',
      arabic: 'المنتجات',
      href: '/admin/products',
      icon: Package,
    },
    {
      name: 'Store',
      arabic: 'المتجر',
      href: '/',
      icon: Store,
      external: true,
    },
  ];

  return (
    <>
      {/* Quick Action Drawer Popup (Triggered from mobile menu) */}
      {quickMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1C1C1C] border-t-2 border-[#DCC9A6] p-6 rounded-t-3xl space-y-4 shadow-2xl pb-10">
            <div className="flex items-center justify-between border-b border-[#333333] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#DCC9A6] text-[#1F1F1F] flex items-center justify-center font-serif font-bold text-sm">
                  A
                </div>
                <div>
                  <p className="font-bold text-xs text-white">
                    {user?.displayName || 'ARMIA Administrator'}
                  </p>
                  <p className="text-[10px] text-[#8E8A85] font-mono">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => setQuickMenuOpen(false)}
                className="p-1.5 rounded-full bg-[#2A2A2A] text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2 pt-1 text-xs">
              {!isInstalled && (
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    onOpenInstallModal();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-[#141414] border border-[#DCC9A6]/40 text-[#DCC9A6] rounded-xl font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-[#DCC9A6]" />
                    <span>Install Mobile App (PWA)</span>
                  </div>
                  <span className="text-[10px] bg-[#DCC9A6] text-[#1F1F1F] px-2 py-0.5 rounded font-bold">
                    INSTALL
                  </span>
                </button>
              )}

              <Link
                href="/admin/products"
                onClick={() => setQuickMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 bg-[#141414] border border-[#333333] text-white rounded-xl active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-4 h-4 text-[#B67355]" />
                  <span className="font-semibold">Add New Product to Catalog</span>
                </div>
                <span className="text-neutral-500 text-[11px]">→</span>
              </Link>

              <Link
                href="/"
                target="_blank"
                onClick={() => setQuickMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 bg-[#141414] border border-[#333333] text-white rounded-xl active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <Store className="w-4 h-4 text-[#DCC9A6]" />
                  <span className="font-semibold">Live Customer Storefront</span>
                </div>
                <span className="text-neutral-500 text-[11px]">↗</span>
              </Link>

              <button
                onClick={() => {
                  setQuickMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl font-bold text-xs uppercase tracking-wider mt-2 active:scale-[0.98] transition-transform"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out from Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED MOBILE NATIVE BOTTOM APP NAVIGATION BAR */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#161616]/95 backdrop-blur-2xl border-t border-[#333333] shadow-[0_-10px_35px_rgba(0,0,0,0.7)] px-2 py-1.5 no-print"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-around gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            if (tab.external) {
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  target="_blank"
                  className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[#8E8A85] hover:text-[#DCC9A6] active:scale-90 transition-all"
                >
                  <div className="relative p-1">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">
                    {tab.name}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl active:scale-90 transition-all ${
                  isActive
                    ? 'text-[#DCC9A6]'
                    : 'text-[#8E8A85] hover:text-white'
                }`}
              >
                {/* Active Indicator Background Pill */}
                {isActive && (
                  <span className="absolute inset-x-2 top-0 bottom-0 bg-[#DCC9A6]/10 rounded-xl border border-[#DCC9A6]/30 -z-10" />
                )}

                <div className="relative p-1">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#DCC9A6] drop-shadow-[0_0_8px_rgba(220,201,166,0.5)]' : ''}`} />
                  
                  {/* Subtle Gold dot for active tab */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#DCC9A6]" />
                  )}
                </div>

                <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${isActive ? 'font-extrabold text-[#DCC9A6]' : 'font-medium'}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
