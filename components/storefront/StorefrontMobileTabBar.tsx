'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  ShoppingBag,
  Heart,
  User,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function StorefrontMobileTabBar() {
  const pathname = usePathname();
  const { itemCount, wishlist, setIsCartOpen } = useCart();
  const mounted = useIsMounted();

  // Hide mobile tab bar on admin pages (admin has its own AdminMobileTabBar)
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navTabs = [
    {
      name: 'Home',
      nameArabic: 'الرئيسية',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
      action: null,
    },
    {
      name: 'Shop',
      nameArabic: 'المجموعات',
      href: '/collections',
      icon: Sparkles,
      isActive: pathname.startsWith('/collections') || pathname.startsWith('/product'),
      action: null,
    },
    {
      name: 'Bag',
      nameArabic: 'الحقيبة',
      href: '#',
      icon: ShoppingBag,
      isActive: false,
      badge: mounted && itemCount > 0 ? itemCount : null,
      action: () => setIsCartOpen(true),
    },
    {
      name: 'Wishlist',
      nameArabic: 'المفضلة',
      href: '/wishlist',
      icon: Heart,
      isActive: pathname === '/wishlist',
      badge: mounted && wishlist.length > 0 ? wishlist.length : null,
      action: null,
    },
    {
      name: 'Account',
      nameArabic: 'حسابي',
      href: '/account',
      icon: User,
      isActive: pathname === '/account',
      action: null,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#141414]/95 backdrop-blur-xl border-t border-[#333333] shadow-[0_-8px_30px_rgba(0,0,0,0.5)] pb-[max(env(safe-area-inset-bottom,0px),6px)] pt-2"
    >
      <div className="max-w-md mx-auto px-3 flex items-center justify-around">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = tab.isActive;

          if (tab.action) {
            return (
              <button
                key={tab.name}
                type="button"
                onClick={tab.action}
                className="relative flex flex-col items-center justify-center py-1 px-3 text-center transition-all duration-200 active:scale-90 group"
              >
                <div className="relative p-1">
                  <Icon className="w-5 h-5 text-[#DCC9A6] group-hover:text-white transition-colors" />

                  {/* Badge */}
                  {tab.badge !== null && (
                    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-[#B67355] text-white text-[10px] font-bold font-mono rounded-full flex items-center justify-center border border-[#141414] animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-sans font-medium tracking-wider text-[#DCC9A6] group-hover:text-white mt-0.5">
                  {tab.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 text-center transition-all duration-200 active:scale-90 ${
                isCurrent ? 'text-[#DCC9A6]' : 'text-[#8E8A85] hover:text-[#DCC9A6]'
              }`}
            >
              {/* Active gold top glow bar */}
              {isCurrent && (
                <span className="absolute -top-2 w-8 h-[2px] bg-gradient-to-r from-transparent via-[#DCC9A6] to-transparent rounded-full shadow-[0_0_8px_#DCC9A6]" />
              )}

              <div className="relative p-1">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isCurrent ? 'scale-110 text-[#DCC9A6]' : 'text-[#8E8A85]'
                  }`}
                />

                {/* Badge */}
                {tab.badge !== null && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-[#B67355] text-white text-[10px] font-bold font-mono rounded-full flex items-center justify-center border border-[#141414]">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-sans tracking-wider mt-0.5 transition-colors ${
                  isCurrent ? 'font-bold text-[#DCC9A6]' : 'font-normal text-[#8E8A85]'
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
