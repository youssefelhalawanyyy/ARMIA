'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-[#F6F3EE] border-t border-[#333333] pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="gold" size="lg" showTagline={true} />
            <p className="text-xs text-[#8E8A85] font-sans leading-relaxed max-w-sm mt-4">
              ARMIA Boutique is dedicated to creating timeless, elegant, and versatile feminine
              fashion. Carefully selected fabrics and tailored silhouettes designed to elevate your everyday style.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#DCC9A6] hover:border-[#DCC9A6] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#DCC9A6] hover:border-[#DCC9A6] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.592 0 9 1.582 9 4.615V8z"/>
                </svg>
              </a>
              <a
                href="mailto:contact@armiaboutique.com"
                className="w-8 h-8 rounded-full border border-[#333333] flex items-center justify-center text-[#DCC9A6] hover:border-[#DCC9A6] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#DCC9A6] uppercase mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-[#8E8A85]">
              <li>
                <Link href="/collections/dresses" className="hover:text-[#DCC9A6] transition-colors">
                  Dresses
                </Link>
              </li>
              <li>
                <Link href="/collections/sets" className="hover:text-[#DCC9A6] transition-colors">
                  Linen & Co-ord Sets
                </Link>
              </li>
              <li>
                <Link href="/collections/tops" className="hover:text-[#DCC9A6] transition-colors">
                  Tops & Blouses
                </Link>
              </li>
              <li>
                <Link href="/collections/bottoms" className="hover:text-[#DCC9A6] transition-colors">
                  Pants & Skirts
                </Link>
              </li>
              <li>
                <Link href="/collections/outerwear" className="hover:text-[#DCC9A6] transition-colors">
                  Blazers & Outerwear
                </Link>
              </li>
              <li>
                <Link href="/collections/new-in" className="hover:text-[#DCC9A6] transition-colors">
                  New In
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#DCC9A6] uppercase mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-[#8E8A85]">
              <li>
                <Link href="/account" className="hover:text-[#DCC9A6] transition-colors">
                  Track My Order
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#DCC9A6] transition-colors">
                  About ARMIA
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#DCC9A6] transition-colors">
                  Wholesale Inquiries
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-[#DCC9A6] transition-colors">
                  Cash on Delivery Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[#DCC9A6] transition-colors">
                  Exchange & Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Boutique Contact */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-[#DCC9A6] uppercase mb-4">
              Contact & Boutique
            </h4>
            <div className="space-y-3 text-xs font-sans text-[#8E8A85]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#DCC9A6] shrink-0 mt-0.5" />
                <span>Cairo & Alexandria, Egypt</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#DCC9A6] shrink-0" />
                <span>+20 100 123 4567</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#DCC9A6] shrink-0" />
                <span>support@armiaboutique.com</span>
              </div>
              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#000000] border border-[#333333] text-[10px] text-[#DCC9A6]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Egyptian Boutique</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#333333] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-sans text-[#8E8A85]">
          <p>© {new Date().getFullYear()} ARMIA BOUTIQUE. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Designed for Your Style</span>
            <span>•</span>
            <Link href="/admin" className="text-[#DCC9A6] hover:underline">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
