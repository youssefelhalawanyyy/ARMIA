import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { getProducts } from '@/lib/productService';
import { getCategories } from '@/lib/categoryService';
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
  
  const [products, allCategories] = await Promise.all([
    getProducts(categoryParam),
    getCategories(true),
  ]);

  // STRICTLY filter for available products (stock > 0)
  let availableProducts = products.filter((p) => (p.stockQuantity ?? 0) > 0);

  // If curation route (best-sellers, new-in) has 0 specific items, fall back to all available products so it is never empty
  if (availableProducts.length === 0 && (categoryParam === 'best-sellers' || categoryParam === 'new-in')) {
    const all = await getProducts('all');
    availableProducts = all.filter((p) => (p.stockQuantity ?? 0) > 0);
  }

  // If best-sellers, prioritize featured items to the top
  if (categoryParam === 'best-sellers') {
    availableProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  const matchedCat = allCategories.find(
    (c) => c.slug.toLowerCase() === categoryParam || c.id.toLowerCase() === categoryParam
  );

  let title = matchedCat ? matchedCat.name.toUpperCase() : categoryParam.toUpperCase().replace(/-/g, ' ');
  let titleArabic = matchedCat?.nameArabic;
  let description = matchedCat?.description || 'Handpicked pieces designed with meticulous attention to detail and modern elegance.';

  if (categoryParam === 'best-sellers') {
    title = 'BEST SELLERS';
    titleArabic = 'الأكثر مبيعاً';
    description = 'Our signature best-selling boutique creations, loved for their impeccable tailoring and luxurious comfort.';
  } else if (categoryParam === 'new-in') {
    title = 'NEW IN';
    titleArabic = 'وصل حديثاً';
    description = 'The latest seasonal curation designed for your signature style.';
  }

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
            {titleArabic && (
              <p className="text-sm font-sans text-[#B67355] mt-1" dir="rtl">
                {titleArabic}
              </p>
            )}
            <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
            <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
              {description}
            </p>
          </div>

          {/* Product Grid - ONLY Available Products */}
          {availableProducts.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {availableProducts.map((prod) => (
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
