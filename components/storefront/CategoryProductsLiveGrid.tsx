'use client';

import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/storefront/ProductCard';
import { Product } from '@/types';
import { useLiveProducts } from '@/hooks/useLiveProducts';

interface CategoryProductsLiveGridProps {
  initialProducts: Product[];
  category: string;
}

export default function CategoryProductsLiveGrid({
  initialProducts,
  category,
}: CategoryProductsLiveGridProps) {
  const isCuration = category === 'best-sellers' || category === 'new-in';
  const allLive = useLiveProducts(initialProducts, isCuration ? 'all' : category);

  // STRICTLY filter for available products (stock > 0)
  let availableProducts = allLive.filter((p) => (p.stockQuantity ?? 0) > 0);

  if (category === 'best-sellers') {
    availableProducts = availableProducts.filter((p) => p.featured);
    if (availableProducts.length === 0) {
      availableProducts = allLive.filter((p) => (p.stockQuantity ?? 0) > 0);
    }
    availableProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  } else if (category === 'new-in') {
    availableProducts = availableProducts.filter((p) => p.isNewArrival || p.category === 'new-in');
    if (availableProducts.length === 0) {
      availableProducts = allLive.filter((p) => (p.stockQuantity ?? 0) > 0);
    }
  }

  if (availableProducts.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-[#E8E2D8] p-8 rounded">
        <p className="font-serif text-base text-[#1F1F1F] mb-4">
          No pieces are currently available in this collection.
        </p>
        <Link
          href="/collections"
          className="bg-[#1F1F1F] text-[#DCC9A6] px-6 py-2.5 text-xs font-sans uppercase tracking-widest hover:bg-[#B67355] transition-colors inline-block"
        >
          Browse All Available Pieces
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {availableProducts.map((prod) => (
        <ProductCard key={prod.id} product={prod} />
      ))}
    </div>
  );
}
