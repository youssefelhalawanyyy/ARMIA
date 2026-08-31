'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getCategories, DEFAULT_CATEGORIES } from '@/lib/categoryService';
import { Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const { t, isArabic } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setCategories(data.filter((c) => c.featured !== false));
        }
      })
      .catch((err) => console.warn('Categories load notice:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-16 bg-[#F6F3EE] border-b border-[#E8E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
            {t.categories.subtitle}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1F1F]">
            {t.categories.title}
          </h2>
          <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3" />
        </div>

        {/* Dynamic Category Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat, idx) => {
            const displayName = isArabic && cat.nameArabic ? cat.nameArabic : cat.name;
            const subName = isArabic ? cat.name : cat.nameArabic;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <Link
                  href={`/collections/${cat.slug}`}
                  className="group block relative overflow-hidden bg-white border border-[#E8E2D8] hover:border-[#B67355] transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {/* Image Container with 3:4 aspect ratio */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBE5DA]">
                    <Image
                      src={
                        cat.imageUrl ||
                        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=85'
                      }
                      alt={displayName}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors" />
                  </div>

                  {/* Category Name Label */}
                  <div className="p-3 text-center bg-white border-t border-[#E8E2D8]">
                    <h3 className="font-serif text-xs sm:text-sm font-semibold tracking-[0.15em] text-[#1F1F1F] group-hover:text-[#B67355] transition-colors uppercase truncate">
                      {displayName}
                    </h3>
                    {subName && (
                      <span className="text-[10px] text-[#8E8A85] block font-sans truncate mt-0.5">
                        {subName}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
