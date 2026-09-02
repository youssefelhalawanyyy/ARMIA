import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import HeroSection from '@/components/storefront/HeroSection';
import ValueProps from '@/components/storefront/ValueProps';
import CategorySection from '@/components/storefront/CategorySection';
import FeaturedProductsSection from '@/components/storefront/FeaturedProductsSection';
import NewArrivalsSection from '@/components/storefront/NewArrivalsSection';
import Footer from '@/components/storefront/Footer';
import { getProducts } from '@/lib/productService';

export const revalidate = 60; // ISR revalidation

export default async function HomePage() {
  const products = await getProducts('all');

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      {/* Storefront Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        {/* 1. Hero Section ("Design for Your Style") */}
        <HeroSection products={products} />

        {/* 2. Value Propositions Bar (Premium Quality, Wholesale, Fast Shipping, Support) */}
        <ValueProps />

        {/* 3. Shop by Category (Only shows configured categories) */}
        <CategorySection />

        {/* 4. Featured Pieces (Only shows when admin features products and stock > 0) */}
        <FeaturedProductsSection products={products} />

        {/* 5. New Arrivals Grid (Only shows available products) */}
        <NewArrivalsSection products={products} />
      </main>

      {/* Storefront Footer */}
      <Footer />
    </div>
  );
}
