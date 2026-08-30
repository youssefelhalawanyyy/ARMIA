'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

interface NewArrivalsSectionProps {
  products: Product[];
}

export default function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  // Use first 6 products for the homepage grid matching mockup
  const displayProducts = products.slice(0, 6);

  return (
    <section className="py-20 bg-[#F6F3EE] border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Curated Selection</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
            NEW ARRIVALS
          </h2>
          <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
          <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
            Designed for timeless comfort and elevated style. Available for retail and boutique wholesale.
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

        {/* View All CTA Button */}
        <div className="mt-14 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-3 bg-[#1F1F1F] text-[#DCC9A6] px-10 py-4 text-xs font-sans uppercase tracking-[0.25em] font-bold hover:bg-[#B67355] hover:text-white transition-all shadow-md active:scale-[0.99] group"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
