import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import HeroSection from '@/components/storefront/HeroSection';
import ValueProps from '@/components/storefront/ValueProps';
import CategorySection from '@/components/storefront/CategorySection';
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
        <HeroSection />

        {/* 2. Value Propositions Bar (Premium Quality, Wholesale, Fast Shipping, Support) */}
        <ValueProps />

        {/* 3. Shop by Category (Dresses, Sets, Tops, Bottoms, Outerwear, New In) */}
        <CategorySection />

        {/* 4. New Arrivals Grid with EGP Pricing & Wishlist Hearts */}
        <NewArrivalsSection products={products} />
      </main>

      {/* Storefront Footer */}
      <Footer />
    </div>
  );
}
