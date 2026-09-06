'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/types';
import { INITIAL_PRODUCTS } from '@/lib/seedData';
import ShopSetModal from './ShopSetModal';

interface HeroSectionProps {
  products?: Product[];
}

type HotspotId = 'top' | 'pants';

export default function HeroSection({ products = [] }: HeroSectionProps) {
  const { t, isArabic } = useLanguage();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveHotspot(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find Chevron Top from products or seed
  const chevronProduct: Product =
    products.find(
      (p) => p.id === 'prod-1788716511841' || p.name.toUpperCase().includes('CHEVRON')
    ) ||
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-1788716511841') ||
    INITIAL_PRODUCTS[0];

  // Find Pants from products or seed
  const pantsProduct: Product =
    products.find(
      (p) =>
        p.id === 'prod-relaxed-denim-pants' ||
        p.category === 'bottoms' ||
        p.name.toUpperCase().includes('PANTS') ||
        p.name.toUpperCase().includes('DENIM')
    ) ||
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-relaxed-denim-pants') ||
    INITIAL_PRODUCTS[1];

  const topHref = `/product/${chevronProduct.id}`;
  const pantsHref = `/product/${pantsProduct.id}`;

  return (
    <section className="relative bg-[#F6F3EE] overflow-hidden border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[660px] items-center gap-8 py-8 lg:py-10">
          
          {/* Left Column: Typography & CTA */}
          <motion.div
            initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-5 flex flex-col justify-center space-y-6 z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EDE3CF] border border-[#DCC9A6] text-[#B67355] text-[11px] font-sans font-semibold tracking-[0.2em] uppercase w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.hero.tagline}</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1F1F1F] leading-[1.15]">
              {t.hero.headlinePart1} <br />
              <span className="italic font-normal text-gold-gradient">{t.hero.headlinePart2}</span>
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#8E8A85] font-normal leading-relaxed max-w-md">
              {t.hero.description}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/collections"
                className="bg-[#1F1F1F] text-[#DCC9A6] px-8 py-4 text-xs font-sans uppercase tracking-[0.2em] font-bold text-center hover:bg-[#B67355] hover:text-white transition-all shadow-lg flex items-center justify-center gap-3 group active:scale-[0.99]"
              >
                <span>{t.hero.shopCollection}</span>
                <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>

              <Link
                href="/collections/new-in"
                className="border border-[#1F1F1F] text-[#1F1F1F] px-8 py-4 text-xs font-sans uppercase tracking-[0.2em] font-medium text-center hover:bg-[#1F1F1F] hover:text-[#DCC9A6] transition-all"
              >
                {t.hero.newArrivals}
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Visual Boutique Editorial Showcase with Interactive Look Hotspots */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="lg:col-span-7 relative h-[520px] sm:h-[600px] lg:h-[680px] w-full flex items-center justify-center select-none"
            ref={containerRef}
          >
            {/* Soft decorative background frame */}
            <div className="absolute inset-4 sm:inset-6 bg-[#EBE5DA] rounded-sm -rotate-1 border border-[#DCC9A6]/40" />

            {/* High-res Editorial Image Container */}
            <div className="relative w-full h-full rounded-sm overflow-hidden shadow-2xl border border-[#E8E2D8] bg-white group">
              <Image
                src="/images/hero-editorial.jpg"
                alt="ARMIA Boutique Signature Look"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-top sm:object-center transform transition-transform duration-1000 group-hover:scale-[1.02]"
              />

              {/* Gentle luxury vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

              {/* Editorial "Shop The Look" Top Badge */}
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1F1F1F]/80 backdrop-blur-md border border-[#DCC9A6]/50 rounded text-white shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DCC9A6] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DCC9A6]"></span>
                  </span>
                  <span className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-[#DCC9A6]">
                    {isArabic ? 'تسوقي الإطلالة التفاعلية' : 'Shop The Look • Tap Pieces'}
                  </span>
                </div>
              </div>

              {/* ========================================================= */}
              {/* HOTSPOT 1: CHEVRON TOP (Chest / Torso area: Y 33%, X 50%) */}
              {/* ========================================================= */}
              <div
                className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: '33%', left: '50%' }}
              >
                {/* Hotspot Trigger Button */}
                <button
                  type="button"
                  onClick={() => setActiveHotspot(activeHotspot === 'top' ? null : 'top')}
                  aria-label="Shop Chevron Top"
                  className="relative group/pin p-2 focus:outline-none focus:ring-2 focus:ring-[#DCC9A6] rounded-full"
                >
                  {/* Glowing radiating pulse */}
                  <span className="absolute inset-0 rounded-full bg-[#DCC9A6]/40 animate-ping" />
                  
                  {/* Outer circle */}
                  <span
                    className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all duration-300 shadow-xl backdrop-blur-md ${
                      activeHotspot === 'top'
                        ? 'bg-[#B67355] border-white text-white scale-110 ring-4 ring-[#DCC9A6]/50'
                        : 'bg-[#1F1F1F]/90 border-[#DCC9A6] text-[#DCC9A6] hover:bg-[#B67355] hover:text-white hover:scale-105'
                    }`}
                  >
                    {activeHotspot === 'top' ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4 transition-transform duration-300 group-hover/pin:rotate-90" />
                    )}
                  </span>

                  {/* Desktop Label Preview (when not expanded) */}
                  {activeHotspot !== 'top' && (
                    <span className="hidden sm:inline-flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1F1F1F]/90 backdrop-blur-md border border-[#DCC9A6]/40 rounded text-[11px] font-sans font-medium text-[#F6F3EE] tracking-wide whitespace-nowrap shadow-md opacity-90 group-hover/pin:opacity-100 transition-opacity">
                      {isArabic ? 'توب شيفرون' : 'Chevron Top'} • {chevronProduct.price} EGP
                    </span>
                  )}
                </button>

                {/* Popover Product Card: Chevron Top */}
                <AnimatePresence>
                  {activeHotspot === 'top' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="absolute top-11 sm:top-12 -left-28 sm:-left-36 w-64 sm:w-72 bg-[#1F1F1F]/95 backdrop-blur-xl border border-[#DCC9A6]/60 rounded p-4 shadow-2xl text-white z-40"
                    >
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={() => setActiveHotspot(null)}
                        className="absolute top-3 right-3 text-[#8E8A85] hover:text-[#DCC9A6] transition-colors p-1"
                        aria-label="Close"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Category */}
                      <span className="text-[10px] text-[#DCC9A6] uppercase tracking-[0.2em] font-sans font-semibold block mb-1">
                        {isArabic ? chevronProduct.categoryArabic || 'بلوزات وتوبات' : 'Tops & Blouses'}
                      </span>

                      {/* Product Name */}
                      <h4 className="font-serif text-base font-semibold text-white leading-snug">
                        {isArabic && chevronProduct.nameArabic ? chevronProduct.nameArabic : chevronProduct.name}
                      </h4>

                      {/* Price & Stock */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-serif font-bold text-gold-gradient">
                          {chevronProduct.discountPrice || chevronProduct.price} EGP
                        </span>
                        {chevronProduct.discountPrice && (
                          <span className="text-xs text-[#8E8A85] line-through">
                            {chevronProduct.price} EGP
                          </span>
                        )}
                        <span className="text-[10px] font-sans text-emerald-400 font-medium ml-auto">
                          {isArabic ? 'متوفر للتسليم' : 'In Stock'}
                        </span>
                      </div>

                      {/* Specs micro-tag */}
                      <p className="text-[11px] font-sans text-[#A8A49E] mt-1 line-clamp-1">
                        {isArabic
                          ? 'كتان قطني فاخر • قصة عصرية بدون أكمام'
                          : '100% Textured Linen • Sleeveless Cut'}
                      </p>

                      {/* CTA: Shop Now */}
                      <div className="mt-4 pt-3 border-t border-[#DCC9A6]/20">
                        <Link
                          href={topHref}
                          className="w-full bg-[#B67355] text-white hover:bg-[#DCC9A6] hover:text-[#1F1F1F] py-2.5 px-4 text-xs font-sans uppercase tracking-[0.2em] font-bold rounded flex items-center justify-center gap-2 transition-all shadow-md group/btn"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'تسوقي التوب الآن' : 'Shop Top Now'}</span>
                          <ArrowIcon className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ========================================================= */}
              {/* HOTSPOT 2: RELAXED PANTS (Legs / Thigh area: Y 62%, X 46%) */}
              {/* ========================================================= */}
              <div
                className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: '62%', left: '46%' }}
              >
                {/* Hotspot Trigger Button */}
                <button
                  type="button"
                  onClick={() => setActiveHotspot(activeHotspot === 'pants' ? null : 'pants')}
                  aria-label="Shop Relaxed Denim Pants"
                  className="relative group/pin p-2 focus:outline-none focus:ring-2 focus:ring-[#DCC9A6] rounded-full"
                >
                  {/* Glowing radiating pulse */}
                  <span className="absolute inset-0 rounded-full bg-[#DCC9A6]/40 animate-ping" />
                  
                  {/* Outer circle */}
                  <span
                    className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all duration-300 shadow-xl backdrop-blur-md ${
                      activeHotspot === 'pants'
                        ? 'bg-[#B67355] border-white text-white scale-110 ring-4 ring-[#DCC9A6]/50'
                        : 'bg-[#1F1F1F]/90 border-[#DCC9A6] text-[#DCC9A6] hover:bg-[#B67355] hover:text-white hover:scale-105'
                    }`}
                  >
                    {activeHotspot === 'pants' ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4 transition-transform duration-300 group-hover/pin:rotate-90" />
                    )}
                  </span>

                  {/* Desktop Label Preview (when not expanded) */}
                  {activeHotspot !== 'pants' && (
                    <span className="hidden sm:inline-flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1F1F1F]/90 backdrop-blur-md border border-[#DCC9A6]/40 rounded text-[11px] font-sans font-medium text-[#F6F3EE] tracking-wide whitespace-nowrap shadow-md opacity-90 group-hover/pin:opacity-100 transition-opacity">
                      {isArabic ? 'بنطال جينز' : 'Relaxed Denim Pants'} • {pantsProduct.price} EGP
                    </span>
                  )}
                </button>

                {/* Popover Product Card: Relaxed Denim Pants */}
                <AnimatePresence>
                  {activeHotspot === 'pants' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="absolute bottom-11 sm:bottom-12 -left-28 sm:-left-36 w-64 sm:w-72 bg-[#1F1F1F]/95 backdrop-blur-xl border border-[#DCC9A6]/60 rounded p-4 shadow-2xl text-white z-40"
                    >
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={() => setActiveHotspot(null)}
                        className="absolute top-3 right-3 text-[#8E8A85] hover:text-[#DCC9A6] transition-colors p-1"
                        aria-label="Close"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Category */}
                      <span className="text-[10px] text-[#DCC9A6] uppercase tracking-[0.2em] font-sans font-semibold block mb-1">
                        {isArabic ? pantsProduct.categoryArabic || 'بناطيل وتنانير' : 'Bottoms & Trousers'}
                      </span>

                      {/* Product Name */}
                      <h4 className="font-serif text-base font-semibold text-white leading-snug">
                        {isArabic && pantsProduct.nameArabic ? pantsProduct.nameArabic : pantsProduct.name}
                      </h4>

                      {/* Price & Stock */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-serif font-bold text-gold-gradient">
                          {pantsProduct.discountPrice || pantsProduct.price} EGP
                        </span>
                        {pantsProduct.discountPrice && (
                          <span className="text-xs text-[#8E8A85] line-through">
                            {pantsProduct.price} EGP
                          </span>
                        )}
                        <span className="text-[10px] font-sans text-emerald-400 font-medium ml-auto">
                          {isArabic ? 'متوفر للتسليم' : 'In Stock'}
                        </span>
                      </div>

                      {/* Specs micro-tag */}
                      <p className="text-[11px] font-sans text-[#A8A49E] mt-1 line-clamp-1">
                        {isArabic
                          ? 'دنيم قطني فاخر مغسول • خصر عالي مريح'
                          : '100% Premium Washed Denim • High-Rise Cut'}
                      </p>

                      {/* CTA: Shop Now */}
                      <div className="mt-4 pt-3 border-t border-[#DCC9A6]/20">
                        <Link
                          href={pantsHref}
                          className="w-full bg-[#B67355] text-white hover:bg-[#DCC9A6] hover:text-[#1F1F1F] py-2.5 px-4 text-xs font-sans uppercase tracking-[0.2em] font-bold rounded flex items-center justify-center gap-2 transition-all shadow-md group/btn"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'تسوقي البنطال الآن' : 'Shop Pants Now'}</span>
                          <ArrowIcon className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Floating Bottom Luxury Showcase Bar */}
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 bg-[#1F1F1F]/90 backdrop-blur-md p-3.5 sm:p-4 border border-[#DCC9A6]/40 rounded text-white shadow-2xl z-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Look Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#DCC9A6] uppercase tracking-[0.25em] font-sans font-semibold">
                        {isArabic ? 'إطلالة الأتليه الحصرية' : 'Signature Atelier Look'}
                      </span>
                    </div>
                    <p className="font-serif text-sm font-semibold truncate text-white">
                      {isArabic ? 'طقم التوب والبنطال المتكامل' : 'Chevron Top & Relaxed Denim Pants'}
                    </p>
                  </div>

                  {/* Interactive Quick Pieces Pills */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveHotspot(activeHotspot === 'top' ? null : 'top')}
                      className={`text-[11px] font-sans px-2.5 py-1.5 rounded border transition-all ${
                        activeHotspot === 'top'
                          ? 'bg-[#DCC9A6] text-[#1F1F1F] border-[#DCC9A6] font-semibold'
                          : 'bg-white/10 text-[#F6F3EE] border-[#DCC9A6]/40 hover:bg-[#DCC9A6]/20'
                      }`}
                    >
                      {isArabic ? 'التوب' : 'Top'} ({chevronProduct.price} EGP)
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveHotspot(activeHotspot === 'pants' ? null : 'pants')}
                      className={`text-[11px] font-sans px-2.5 py-1.5 rounded border transition-all ${
                        activeHotspot === 'pants'
                          ? 'bg-[#DCC9A6] text-[#1F1F1F] border-[#DCC9A6] font-semibold'
                          : 'bg-white/10 text-[#F6F3EE] border-[#DCC9A6]/40 hover:bg-[#DCC9A6]/20'
                      }`}
                    >
                      {isArabic ? 'البنطال' : 'Pants'} ({pantsProduct.price} EGP)
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSetModalOpen(true)}
                      className="bg-[#DCC9A6] text-[#1F1F1F] hover:bg-[#B67355] hover:text-white px-3.5 py-1.5 text-[11px] font-sans uppercase tracking-wider font-bold rounded flex items-center gap-1.5 transition-all shadow"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'تسوق الطقم' : 'Shop Set'}</span>
                      <ArrowIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Interactive Size Selection Modal for the 2-Piece Set */}
      <ShopSetModal
        isOpen={isSetModalOpen}
        onClose={() => setIsSetModalOpen(false)}
        topProduct={chevronProduct}
        pantsProduct={pantsProduct}
      />
    </section>
  );
}

