import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import HomePageLive from '@/components/storefront/HomePageLive';
import Footer from '@/components/storefront/Footer';
import { getProducts } from '@/lib/productService';

export const revalidate = 60; // ISR revalidation

export default async function HomePage() {
  const products = await getProducts('all');

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      {/* Storefront Navigation Bar */}
      <Navbar />

      {/* Main Content with Instant Real-Time Synchronization */}
      <HomePageLive initialProducts={products} />

      {/* Storefront Footer */}
      <div className="optimize-paint">
        <Footer />
      </div>
    </div>
  );
}
