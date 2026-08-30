import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { getProducts } from '@/lib/productService';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const categoryParam = resolvedParams.category.toLowerCase();
  const products = await getProducts(categoryParam);

  const categoryTitles: Record<string, string> = {
    dresses: 'DRESSES',
    sets: 'SETS & CO-ORDS',
    tops: 'TOPS & BLOUSES',
    bottoms: 'BOTTOMS & PANTS',
    outerwear: 'OUTERWEAR & BLAZERS',
    'new-in': 'NEW ARRIVALS',
    'best-sellers': 'BEST SELLERS',
  };

  const title = categoryTitles[categoryParam] || categoryParam.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb back */}
          <div className="mb-6">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[#8E8A85] hover:text-[#B67355] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Collections</span>
            </Link>
          </div>

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              ARMIA Boutique
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              {title}
            </h1>
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              Handpicked pieces designed with meticulous attention to detail and modern elegance.
            </p>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E8E2D8] p-8">
              <p className="font-serif text-base text-[#1F1F1F] mb-4">
                No items currently available in this category.
              </p>
              <Link
                href="/collections"
                className="bg-[#1F1F1F] text-[#DCC9A6] px-6 py-2.5 text-xs font-sans uppercase tracking-widest hover:bg-[#B67355] transition-colors"
              >
                Browse All Pieces
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
