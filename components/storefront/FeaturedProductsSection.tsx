'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { useLanguage } from '@/context/LanguageContext';

interface FeaturedProductsSectionProps {
  products: Product[];
}

export default function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const { isArabic } = useLanguage();

  // ONLY available in-stock and featured products
  const featuredAvailable = products.filter(
    (p) => p.featured && (p.stockQuantity ?? 0) > 0
  );

  // If there are no featured available products, cleanly remove the section
  if (featuredAvailable.length === 0) {
    return null;
  }

  const displayProducts = featuredAvailable.slice(0, 6);
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-white border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase mb-1">
            <Star className="w-3.5 h-3.5 fill-[#DCC9A6] text-[#B67355]" />
            <span>{isArabic ? 'مختارات الأتليه الحصرية' : 'Signature Boutique Curation'}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
            {isArabic ? 'القطع المميزة' : 'FEATURED PIECES'}
          </h2>
          <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
          <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
            {isArabic
              ? 'تصاميم استثنائية تميز علامتنا بأناقة فريدة وأقمشة طبيعية فاخرة.'
              : 'Our handpicked signature designs crafted with exceptional fabrics and timeless tailoring.'}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {displayProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {/* View All Featured Pieces CTA */}
        <div className="mt-14 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-3 bg-[#1F1F1F] text-[#DCC9A6] px-10 py-4 text-xs font-sans uppercase tracking-[0.2em] font-bold hover:bg-[#B67355] hover:text-white transition-all shadow-md active:scale-[0.99] group"
          >
            <span>{isArabic ? 'استكشاف التشكيلة الكاملة' : 'Explore Entire Collection'}</span>
            <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
