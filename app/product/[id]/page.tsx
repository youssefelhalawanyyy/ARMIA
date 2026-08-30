'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import { Product, ProductColor } from '@/types';
import { getProductById, getProducts } from '@/lib/productService';
import { useCart } from '@/context/CartContext';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'wholesale' | 'shipping'>('specs');

  const { addToCart, toggleWishlist, isWishlisted } = useCart();

  useEffect(() => {
    async function load() {
      if (!productId) return;
      setLoading(true);
      const data = await getProductById(productId);
      if (data) {
        setProduct(data);
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        const related = await getProducts(data.category);
        setRelatedProducts(related.filter((p) => p.id !== data.id).slice(0, 4));
      }
      setLoading(false);
    }
    load();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 w-full flex-grow flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center flex-grow">
          <h2 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-3">
            Product Not Found
          </h2>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            The piece you are looking for may have been archived or removed from the catalog.
          </p>
          <Link
            href="/collections"
            className="bg-[#1F1F1F] text-[#DCC9A6] px-8 py-3 text-xs uppercase tracking-widest font-sans inline-block"
          >
            Return to Collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFav = isWishlisted(product.id);
  const mainImage = product.imageUrls[selectedImageIndex] || product.imageUrls[0] || '';

  const handleAddToCart = () => {
    if (!selectedColor) return;

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.discountPrice || product.price,
        originalPrice: product.price,
        quantity,
        selectedColor,
        selectedSize: selectedSize || (product.sizes[0] || 'Standard'),
        imageUrl: product.imageUrls[0] || '',
        category: product.category,
      },
      true // open drawer immediately
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-sans text-[#8E8A85] mb-8">
            <Link href="/" className="hover:text-[#1F1F1F] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/collections" className="hover:text-[#1F1F1F] transition-colors">
              Collections
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/collections/${product.category}`}
              className="hover:text-[#1F1F1F] uppercase transition-colors"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#1F1F1F] font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>

          {/* Product Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* Left: Gallery (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Image Display */}
              <div className="relative aspect-[3/4] w-full bg-white border border-[#E8E2D8] overflow-hidden shadow-sm">
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover object-center"
                />

                {/* Floating Tags */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  {product.discountPrice && (
                    <span className="bg-[#B67355] text-white text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 shadow-md">
                      Special Offer
                    </span>
                  )}
                  {product.isNewArrival && !product.discountPrice && (
                    <span className="bg-[#1F1F1F] text-[#DCC9A6] text-[10px] font-sans font-semibold uppercase tracking-widest px-3 py-1 shadow-md">
                      New Arrival
                    </span>
                  )}
                </div>

                {/* Floating Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8E2D8] flex items-center justify-center text-[#1F1F1F] hover:text-[#B67355] hover:border-[#B67355] transition-all shadow-md"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFav ? 'fill-[#B67355] text-[#B67355]' : 'text-[#1F1F1F]'
                    }`}
                  />
                </button>
              </div>

              {/* Thumbnails list */}
              {product.imageUrls.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.imageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 aspect-[3/4] shrink-0 border-2 overflow-hidden transition-all ${
                        selectedImageIndex === idx
                          ? 'border-[#B67355] opacity-100 shadow-md'
                          : 'border-[#E8E2D8] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info & Purchase Controls (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                {/* Category & Status */}
                <div className="flex items-center justify-between text-xs font-sans uppercase tracking-[0.2em] text-[#8E8A85] mb-2">
                  <span>ARMIA ATELIER • {product.category}</span>
                  {product.stockQuantity > 0 ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock ({product.stockQuantity} pieces)
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">Out of Stock</span>
                  )}
                </div>

                {/* Product Title */}
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F1F1F]">
                  {product.name}
                </h1>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-3">
                  {product.discountPrice ? (
                    <>
                      <span className="font-serif text-2xl sm:text-3xl font-bold text-[#B67355]">
                        EGP {product.discountPrice.toFixed(2)}
                      </span>
                      <span className="font-sans text-base text-[#8E8A85] line-through">
                        EGP {product.price.toFixed(2)}
                      </span>
                      <span className="text-xs bg-[#EDE3CF] text-[#B67355] px-2 py-0.5 font-sans font-semibold">
                        Save EGP {(product.price - product.discountPrice).toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1F1F]">
                      EGP {product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-4 text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
                  {product.description}
                </p>

                {/* Color Selector */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#E8E2D8]">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F]">
                        Color:{' '}
                        <span className="font-normal text-[#8E8A85]">
                          {selectedColor?.name || 'Select a color'}
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      {product.colors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setSelectedColor(c)}
                          className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-sans transition-all ${
                            selectedColor?.name === c.name
                              ? 'border-[#B67355] bg-white shadow-sm ring-1 ring-[#B67355]'
                              : 'border-[#E8E2D8] bg-white hover:border-[#8E8A85]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F]">
                        Size:{' '}
                        <span className="font-normal text-[#8E8A85]">{selectedSize}</span>
                      </label>
                      <span className="text-[11px] text-[#B67355] font-sans">
                        {product.specs?.modelInfo || 'True to size'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-[48px] px-3.5 py-2.5 text-xs font-sans font-medium uppercase tracking-wider border transition-all ${
                            selectedSize === s
                              ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F] font-bold shadow-md'
                              : 'bg-white text-[#1F1F1F] border-[#E8E2D8] hover:border-[#B67355]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Bag CTA */}
                <div className="mt-8 pt-6 border-t border-[#E8E2D8] space-y-4">
                  <div className="flex items-stretch gap-4">
                    {/* Quantity Counter */}
                    <div className="flex items-center border border-[#E8E2D8] bg-white px-2">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2 text-[#1F1F1F] hover:text-[#B67355] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-sans font-semibold text-xs text-[#1F1F1F]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                        className="p-2 text-[#1F1F1F] hover:text-[#B67355] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Bag Button */}
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stockQuantity <= 0}
                      className="flex-1 bg-[#1F1F1F] text-[#DCC9A6] py-4 px-6 text-xs uppercase tracking-[0.25em] font-sans font-bold flex items-center justify-center gap-3 hover:bg-[#B67355] hover:text-white transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Shopping Bag</span>
                    </button>
                  </div>

                  {/* Cash on Delivery Guarantee */}
                  <div className="bg-white border border-[#E8E2D8] p-3.5 flex items-center gap-3 text-xs font-sans text-[#1F1F1F]">
                    <ShieldCheck className="w-5 h-5 text-[#B67355] shrink-0" />
                    <div>
                      <span className="font-semibold block">Cash on Delivery (COD)</span>
                      <span className="text-[#8E8A85] text-[11px]">
                        Pay in cash upon doorstep delivery across all Egyptian Governorates.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Specifications & Details Tabs */}
                <div className="mt-8 border-t border-[#E8E2D8] pt-6">
                  <div className="flex border-b border-[#E8E2D8]">
                    <button
                      onClick={() => setActiveTab('specs')}
                      className={`pb-2.5 px-4 text-xs font-sans uppercase tracking-wider font-semibold transition-colors relative ${
                        activeTab === 'specs'
                          ? 'text-[#B67355]'
                          : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                      }`}
                    >
                      Fabric & Specs
                      {activeTab === 'specs' && (
                        <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#B67355]" />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('wholesale')}
                      className={`pb-2.5 px-4 text-xs font-sans uppercase tracking-wider font-semibold transition-colors relative ${
                        activeTab === 'wholesale'
                          ? 'text-[#B67355]'
                          : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                      }`}
                    >
                      Wholesale Inquiries
                      {activeTab === 'wholesale' && (
                        <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#B67355]" />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('shipping')}
                      className={`pb-2.5 px-4 text-xs font-sans uppercase tracking-wider font-semibold transition-colors relative ${
                        activeTab === 'shipping'
                          ? 'text-[#B67355]'
                          : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                      }`}
                    >
                      Delivery & Returns
                      {activeTab === 'shipping' && (
                        <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#B67355]" />
                      )}
                    </button>
                  </div>

                  <div className="py-4 text-xs font-sans text-[#8E8A85] leading-relaxed">
                    {activeTab === 'specs' && (
                      <div className="space-y-2.5 bg-white p-4 border border-[#E8E2D8]">
                        <div className="flex justify-between border-b border-[#E8E2D8]/50 pb-1.5">
                          <span className="font-semibold text-[#1F1F1F]">Fabric Composition:</span>
                          <span>{product.specs?.fabric || 'Premium Blend'}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E8E2D8]/50 pb-1.5">
                          <span className="font-semibold text-[#1F1F1F]">Fit & Silhouette:</span>
                          <span>{product.specs?.fit || 'Tailored Regular Fit'}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#E8E2D8]/50 pb-1.5">
                          <span className="font-semibold text-[#1F1F1F]">Care Instructions:</span>
                          <span>{product.specs?.care || 'Dry clean recommended'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-[#1F1F1F]">Origin:</span>
                          <span>{product.specs?.origin || 'Handcrafted in Egypt'}</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'wholesale' && (
                      <div className="bg-white p-4 border border-[#E8E2D8] space-y-2">
                        <p className="text-[#1F1F1F] font-semibold">
                          Interested in stocking this piece in your boutique?
                        </p>
                        <p>
                          We offer special wholesale volume pricing for registered fashion boutiques and retailers across Egypt and the MENA region.
                        </p>
                        <Link
                          href="/contact"
                          className="inline-block mt-2 text-xs font-semibold text-[#B67355] underline uppercase tracking-wider"
                        >
                          Inquire about Wholesale Pricing →
                        </Link>
                      </div>
                    )}

                    {activeTab === 'shipping' && (
                      <div className="bg-white p-4 border border-[#E8E2D8] space-y-2">
                        <p className="text-[#1F1F1F] font-semibold">
                          Delivery Timeline across Egypt:
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Greater Cairo & Giza: 24 - 48 Hours</li>
                          <li>Alexandria & Delta Governorates: 2 - 3 Days</li>
                          <li>Upper Egypt & Coastal Cities: 3 - 4 Days</li>
                        </ul>
                        <p className="pt-2 text-[11px]">
                          Easy 14-day exchange and returns with courier doorstep inspection.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related / You May Also Like Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-[#E8E2D8]">
              <div className="text-center mb-10">
                <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
                  Complete Your Look
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1F1F1F]">
                  YOU MAY ALSO ADORE
                </h2>
                <div className="w-10 h-[1px] bg-[#DCC9A6] mx-auto mt-2" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
