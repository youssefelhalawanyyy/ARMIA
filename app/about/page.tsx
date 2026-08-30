import React from 'react';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import BrandLogo from '@/components/common/BrandLogo';
import { Sparkles, ShieldCheck, Gem } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              Our Story & Heritage
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1F1F1F]">
              DESIGN FOR YOUR STYLE
            </h1>
            <div className="w-16 h-[1px] bg-[#DCC9A6] mx-auto mt-4 mb-4" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
              Founded on the belief that luxury is defined by effortless craftsmanship, exceptional fabrics, and timeless silhouettes.
            </p>
          </div>

          {/* Editorial Visual */}
          <div className="relative aspect-[16/9] w-full bg-white border border-[#E8E2D8] overflow-hidden mb-16 shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=85"
              alt="ARMIA Atelier & Studio"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="font-serif text-lg sm:text-xl font-bold">The ARMIA Boutique Studio</p>
              <p className="text-xs text-[#DCC9A6] font-sans uppercase tracking-widest">
                Cairo, Egypt
              </p>
            </div>
          </div>

          {/* Atelier Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white border border-[#E8E2D8] p-6 space-y-3">
              <Gem className="w-6 h-6 text-[#B67355]" />
              <h3 className="font-serif text-base font-bold text-[#1F1F1F]">
                Curated Organic Fabrics
              </h3>
              <p className="text-xs text-[#8E8A85] font-sans leading-relaxed">
                We hand-select pure Egyptian cottons, French linens, and heavyweight fluid satins to ensure unparalleled breathability and drape.
              </p>
            </div>

            <div className="bg-white border border-[#E8E2D8] p-6 space-y-3">
              <Sparkles className="w-6 h-6 text-[#B67355]" />
              <h3 className="font-serif text-base font-bold text-[#1F1F1F]">
                Tailored Silhouettes
              </h3>
              <p className="text-xs text-[#8E8A85] font-sans leading-relaxed">
                Every pattern is precision-drafted to flatter diverse body shapes with flowing lines, relaxed tailoring, and understated elegance.
              </p>
            </div>

            <div className="bg-white border border-[#E8E2D8] p-6 space-y-3">
              <ShieldCheck className="w-6 h-6 text-[#B67355]" />
              <h3 className="font-serif text-base font-bold text-[#1F1F1F]">
                Wholesale & Retail
              </h3>
              <p className="text-xs text-[#8E8A85] font-sans leading-relaxed">
                Proudly supplying discerning boutique retailers and private clients across Egyptian governorates with dependable quality.
              </p>
            </div>
          </div>

          {/* Brand Quote Box */}
          <div className="bg-[#1F1F1F] text-[#F6F3EE] p-8 sm:p-12 text-center border border-[#333333] space-y-4">
            <BrandLogo variant="gold" size="sm" showTagline={false} href="" />
            <blockquote className="font-serif text-xl sm:text-2xl italic max-w-xl mx-auto leading-relaxed text-[#DCC9A6]">
              &ldquo;Elegance is not about standing out, but being remembered for your timeless grace.&rdquo;
            </blockquote>
            <p className="text-xs text-[#8E8A85] font-sans uppercase tracking-[0.2em]">
              ARMIA Boutique Atelier
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
