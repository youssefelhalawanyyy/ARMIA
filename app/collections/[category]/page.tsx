import React from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import CategoryProductsLiveGrid from '@/components/storefront/CategoryProductsLiveGrid';
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

          {/* Product Grid with Live Real-time Synchronization */}
          <CategoryProductsLiveGrid
            initialProducts={availableProducts}
            category={categoryParam}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
