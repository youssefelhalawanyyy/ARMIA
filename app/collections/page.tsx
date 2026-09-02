'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { Product } from '@/types';
import { getProducts } from '@/lib/productService';
import { SlidersHorizontal } from 'lucide-react';
import { getCategories } from '@/lib/categoryService';
import { Category } from '@/types';

function CollectionsContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'all';
  const searchFromUrl = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState<string>(searchFromUrl);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const [data, cats] = await Promise.all([
        getProducts('all'),
        getCategories(true),
      ]);
      if (!isMounted) return;
      setProducts(data);

      const combined: Category[] = [...(cats || [])];
      const activeProds = data.filter((p) => (p.stockQuantity ?? 0) > 0);
      const distinctSlugs = Array.from(new Set(activeProds.map((p) => p.category).filter(Boolean)));
      for (const slug of distinctSlugs) {
        if (!combined.some((c) => c.slug === slug || c.id === slug)) {
          combined.push({
            id: slug,
            slug,
            name: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            nameArabic: slug,
            description: '',
            imageUrl: '',
            featured: false,
            orderIndex: combined.length + 1,
          });
        }
      }
      setAvailableCategories(combined);
      setLoading(false);
    }

    load();

    const handleUpdate = () => {
      load();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('armia_categories_updated', handleUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('armia_categories_updated', handleUpdate);
      }
    };
  }, []);

  const activeCategory = selectedCategory || categoryFromUrl;
  const activeSearch = searchQuery !== undefined ? searchQuery : searchFromUrl;

  const filteredProducts = useMemo(() => {
    // ONLY show available products (stock > 0)
    let list = products.filter((p) => (p.stockQuantity ?? 0) > 0);

    if (activeCategory !== 'all') {
      if (activeCategory === 'new-in') {
        list = list.filter((p) => p.isNewArrival || p.category === 'new-in');
      } else {
        list = list.filter((p) => p.category === activeCategory);
      }
    }

    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.specs.fabric.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, activeCategory, activeSearch, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
          ARMIA Boutique
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
          {activeCategory === 'all'
            ? 'ALL COLLECTIONS'
            : activeCategory === 'new-in'
            ? 'NEW ARRIVALS'
            : activeCategory.toUpperCase()}
        </h1>
        <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-3 mb-2" />
        <p className="text-xs sm:text-sm text-[#8E8A85] font-sans">
          Discover timeless essentials, tailored sets, and feminine elegance crafted for your boutique.
        </p>
      </div>

      {/* Category Filter Pills */}
      {availableCategories.length > 0 && (
        <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] transition-all border ${
              activeCategory === 'all'
                ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F] font-semibold shadow-sm'
                : 'bg-white text-[#1F1F1F] border-[#E8E2D8] hover:border-[#B67355]'
            }`}
          >
            ALL PIECES
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat.id || cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] transition-all border ${
                activeCategory === cat.slug
                  ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F] font-semibold shadow-sm'
                  : 'bg-white text-[#1F1F1F] border-[#E8E2D8] hover:border-[#B67355]'
              }`}
            >
              {cat.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Controls Bar: Items Count & Sort */}
      <div className="bg-white border border-[#E8E2D8] p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-sans text-[#8E8A85]">
          Showing <strong className="text-[#1F1F1F]">{filteredProducts.length}</strong> pieces
          {activeSearch && (
            <span className="ml-1">
              for &ldquo;<span className="text-[#B67355]">{activeSearch}</span>&rdquo;
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 text-xs underline text-[#1F1F1F]"
              >
                Clear search
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <label className="text-xs font-sans uppercase tracking-wider text-[#8E8A85] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'name')}
            className="bg-[#F6F3EE] border border-[#E8E2D8] text-xs font-sans px-3 py-1.5 text-[#1F1F1F] focus:outline-none focus:border-[#B67355]"
          >
            <option value="featured">Featured Collection</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] bg-[#EBE5DA] animate-shimmer" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E8E2D8] p-8">
          <h3 className="font-serif text-lg font-semibold text-[#1F1F1F] mb-2">
            No pieces found matching your criteria
          </h3>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            Try selecting another collection or clearing your search filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="bg-[#1F1F1F] text-[#DCC9A6] px-6 py-2.5 text-xs font-sans uppercase tracking-widest hover:bg-[#B67355] transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />
      <main className="flex-grow py-12">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
              <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin mx-auto" />
            </div>
          }
        >
          <CollectionsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
