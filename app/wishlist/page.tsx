'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { getProducts } from '@/lib/productService';
import { Heart, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const prods = await getProducts('all');
      setAllProducts(prods);
      setLoading(false);
    }
    load();
  }, []);

  const wishlistedProducts = allProducts.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              Personal Wishlist
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              SAVED PIECES
            </h1>
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              Keep track of your favorite ARMIA silhouettes and add them to your shopping bag anytime.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin" />
            </div>
          ) : wishlistedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E8E2D8] p-8 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#F6F3EE] flex items-center justify-center mx-auto mb-4 border border-[#E8E2D8]">
                <Heart className="w-6 h-6 text-[#8E8A85]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1F1F1F] mb-1">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-[#8E8A85] font-sans mb-6">
                Explore our collections and tap the heart icon on any piece to save it here.
              </p>
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 bg-[#1F1F1F] text-[#DCC9A6] px-6 py-3 text-xs uppercase tracking-[0.2em] font-sans font-bold hover:bg-[#B67355] hover:text-white transition-colors"
              >
                <span>Browse Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {wishlistedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
