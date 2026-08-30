'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-[#F6F3EE] overflow-hidden border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[640px] items-center gap-8 py-8 lg:py-0">
          
          {/* Left Column: Typography & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-5 flex flex-col justify-center space-y-6 z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EDE3CF] border border-[#DCC9A6] text-[#B67355] text-[11px] font-sans font-semibold tracking-[0.2em] uppercase w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autumn / Winter Boutique Edition</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1F1F1F] leading-[1.12]">
              DESIGN <br />
              <span className="italic font-normal text-gold-gradient">FOR YOUR</span> <br />
              STYLE
            </h1>

            <p className="font-sans text-sm sm:text-base text-[#8E8A85] font-normal leading-relaxed max-w-md">
              Carefully selected pieces for your boutique. Tailored silhouettes, premium Egyptian and French fabrics, designed for effortless elegance.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/collections"
                className="bg-[#1F1F1F] text-[#DCC9A6] px-8 py-4 text-xs font-sans uppercase tracking-[0.25em] font-bold text-center hover:bg-[#B67355] hover:text-white transition-all shadow-lg flex items-center justify-center gap-3 group active:scale-[0.99]"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/collections/new-in"
                className="border border-[#1F1F1F] text-[#1F1F1F] px-8 py-4 text-xs font-sans uppercase tracking-[0.25em] font-medium text-center hover:bg-[#1F1F1F] hover:text-[#DCC9A6] transition-all"
              >
                New Arrivals
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Visual Boutique Editorial Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="lg:col-span-7 relative h-[420px] sm:h-[500px] lg:h-[600px] w-full flex items-center justify-center"
          >
            {/* Soft decorative background frame */}
            <div className="absolute inset-4 sm:inset-6 bg-[#EBE5DA] rounded-sm -rotate-1 border border-[#DCC9A6]/40" />

            {/* High-res Image of the curated clothing rack with warm neutral garments */}
            <div className="relative w-full h-full rounded-sm overflow-hidden shadow-2xl border border-[#E8E2D8]">
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=85"
                alt="ARMIA Boutique Clothing Collection"
                fill
                priority
                className="object-cover object-center transform hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Floating Luxury Tag */}
              <div className="absolute bottom-6 left-6 right-6 bg-[#1F1F1F]/90 backdrop-blur-md p-4 border border-[#DCC9A6]/40 flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] text-[#DCC9A6] uppercase tracking-[0.25em] font-sans font-semibold">
                    Editorial Collection
                  </span>
                  <p className="font-serif text-sm font-semibold">
                    Linen Sets & Tailored Outerwear
                  </p>
                </div>
                <Link
                  href="/collections/sets"
                  className="text-xs text-[#DCC9A6] underline hover:text-white transition-colors uppercase tracking-wider font-sans"
                >
                  Explore →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
