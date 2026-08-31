'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ShieldCheck, Smartphone, MessageCircle } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { usePWA } from '@/context/PWAContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { promptInstall, isInstalled } = usePWA();
  const { t, isArabic } = useLanguage();

  return (
    <footer className="bg-[#1F1F1F] text-[#F6F3EE] border-t border-[#333333] pt-16 pb-24 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="gold" size="lg" showTagline={true} />
            <p className="text-xs text-[#8E8A85] font-sans leading-relaxed max-w-sm mt-4">
              {t.footer.aboutText}
            </p>
            
            {/* Install PWA Button */}
            {!isInstalled && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={promptInstall}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#DCC9A6]/50 text-[#DCC9A6] text-xs font-sans font-bold uppercase tracking-wider rounded hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{t.nav.installApp} (PWA)</span>
                </button>
              </div>
            )}

            {/* Social Media & Instant Channels */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/armia.boutique.eg?igsi=OGN5a3pyYXl0NW8w"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#DCC9A6] hover:border-[#DCC9A6] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                aria-label="Instagram"
                title="ARMIA on Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@armia.boutique.eg?_r=1&_t=ZS-99LEBpU9Yps"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#DCC9A6] hover:border-[#DCC9A6] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                aria-label="TikTok"
                title="ARMIA on TikTok"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46 6.27 6.27 0 0 0 1.95-4.46V8.75a8.28 8.28 0 0 0 4.78 1.5V6.8a4.82 4.82 0 0 1-1-.11z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/1DaZbKyCRd/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#DCC9A6] hover:border-[#DCC9A6] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                aria-label="Facebook"
                title="ARMIA on Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.592 0 9 1.582 9 4.615V8z"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/201220859992"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#25D366] hover:border-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
                aria-label="WhatsApp"
                title="WhatsApp 01220859992"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>

              {/* Email */}
              <a
                href="mailto:armiaboutique1@gmail.com"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#DCC9A6] hover:border-[#DCC9A6] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                aria-label="Email"
                title="Email armiaboutique1@gmail.com"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#DCC9A6] uppercase mb-4">
              {t.footer.collections}
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-[#8E8A85]">
              <li>
                <Link href="/collections/dresses" className="hover:text-[#DCC9A6] transition-colors">
                  {isArabic ? 'فساتين' : 'Dresses'}
                </Link>
              </li>
              <li>
                <Link href="/collections/sets" className="hover:text-[#DCC9A6] transition-colors">
                  {isArabic ? 'أطقم كتان وسيتات' : 'Linen & Co-ord Sets'}
                </Link>
              </li>
              <li>
                <Link href="/collections/tops" className="hover:text-[#DCC9A6] transition-colors">
                  {isArabic ? 'بلوزات وتوبات' : 'Tops & Blouses'}
                </Link>
              </li>
              <li>
                <Link href="/collections/bottoms" className="hover:text-[#DCC9A6] transition-colors">
                  {isArabic ? 'بناطيل وتنانير' : 'Pants & Skirts'}
                </Link>
              </li>
              <li>
                <Link href="/collections/outerwear" className="hover:text-[#DCC9A6] transition-colors">
                  {isArabic ? 'بليزر وعبايات' : 'Blazers & Outerwear'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#DCC9A6] uppercase mb-4">
              {t.footer.customerCare}
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-[#8E8A85]">
              <li>
                <Link href="/about" className="hover:text-[#DCC9A6] transition-colors">
                  {t.nav.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#DCC9A6] transition-colors">
                  {isArabic ? 'طلبات الجملة والتواصل' : 'Wholesale & Contact'}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-[#DCC9A6] transition-colors">
                  {t.footer.shippingPolicy}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[#DCC9A6] transition-colors">
                  {t.footer.returnPolicy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Boutique Contact */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#DCC9A6] uppercase mb-4">
              {t.footer.contactUs}
            </h4>
            <div className="space-y-3 text-xs font-sans text-[#8E8A85]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#DCC9A6] shrink-0 mt-0.5" />
                <span>{isArabic ? 'القاهرة والإسكندرية، مصر' : 'Cairo & Alexandria, Egypt'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#DCC9A6] shrink-0" />
                <a href="tel:01220859992" className="hover:text-white transition-colors" dir="ltr">
                  +20 122 085 9992
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href="https://wa.me/201220859992"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#25D366] hover:underline"
                  dir="ltr"
                >
                  WhatsApp: 01220859992
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#DCC9A6] shrink-0" />
                <a href="mailto:armiaboutique1@gmail.com" className="hover:text-white transition-colors">
                  armiaboutique1@gmail.com
                </a>
              </div>
              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#000000] border border-[#333333] text-[10px] text-[#DCC9A6] rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Instapay: 01204000195</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Language Switcher */}
        <div className="border-t border-[#333333] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-sans text-[#8E8A85]">
          <p>© {new Date().getFullYear()} ARMIA BOUTIQUE. {t.footer.rights}</p>
          
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <LanguageSwitcher variant="footer" />
            <span>•</span>
            <span>{t.footer.madeInEgypt}</span>
            <span>•</span>
            <Link href="/admin" className="text-[#DCC9A6] hover:underline">
              {t.nav.adminPortal}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
