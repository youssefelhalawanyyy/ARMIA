'use client';

import React from 'react';
import HeroSection from '@/components/storefront/HeroSection';
import ShopTheLookSection from '@/components/storefront/ShopTheLookSection';
import ValueProps from '@/components/storefront/ValueProps';
import CategorySection from '@/components/storefront/CategorySection';
import FeaturedProductsSection from '@/components/storefront/FeaturedProductsSection';
import NewArrivalsSection from '@/components/storefront/NewArrivalsSection';
import { Product } from '@/types';
import { useLiveProducts } from '@/hooks/useLiveProducts';

interface HomePageLiveProps {
  initialProducts: Product[];
}

export default function HomePageLive({ initialProducts }: HomePageLiveProps) {
  // Real-time live synchronization with Firestore and cross-tab updates
  const products = useLiveProducts(initialProducts, 'all');

  return (
    <main className="flex-grow">
      {/* 1. Hero Section ("Design for Your Style") */}
      <HeroSection products={products} />

      {/* 2. Shop The Look / Signature Set Section */}
      <ShopTheLookSection products={products} />

      {/* 3. Value Propositions Bar (Premium Quality, Wholesale, Fast Shipping, Support) */}
      <ValueProps />

      {/* 4. Shop by Category (Only shows configured categories) */}
      <div className="optimize-paint">
        <CategorySection />
      </div>

      {/* 5. Featured Pieces (Automatically updates when admin adds or marks product as featured) */}
      <div className="optimize-paint">
        <FeaturedProductsSection products={products} />
      </div>

      {/* 6. New Arrivals Grid (Automatically updates when admin adds new product) */}
      <div className="optimize-paint">
        <NewArrivalsSection products={products} />
      </div>
    </main>
  );
}
