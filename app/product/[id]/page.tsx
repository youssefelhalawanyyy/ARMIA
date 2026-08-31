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
  Truck,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import FlashDealCountdown from '@/components/storefront/FlashDealCountdown';
import { Product, ProductColor } from '@/types';
import { getProductById, getProducts } from '@/lib/productService';
import { getActiveFlashDealForProduct } from '@/lib/discountService';
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

  const { addToCart, toggleWishlist, isWishlisted, discounts } = useCart();

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

  // Check if there is an active single-item Flash Deal with countdown
  const flashDeal = getActiveFlashDealForProduct(product.id, discounts);

  let effectivePrice = product.discountPrice || product.price;
  let savingsAmount = 0;

  if (flashDeal) {
    if (flashDeal.type === 'percentage') {
      effectivePrice = product.price - (product.price * flashDeal.value) / 100;
      savingsAmount = (product.price * flashDeal.value) / 100;
    } else if (flashDeal.type === 'fixed_amount') {
      effectivePrice = Math.max(0, product.price - flashDeal.value);
      savingsAmount = Math.min(product.price, flashDeal.value);
    }
  } else if (product.discountPrice) {
    savingsAmount = product.price - product.discountPrice;
  }

  const handleAddToCart = () => {
    if (!selectedColor) return;

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: effectivePrice,
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
                  {flashDeal ? (
                    <span className="bg-[#141414] text-[#E5A84B] border border-[#E5A84B] text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 shadow-lg flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                      <span>{flashDeal.type === 'percentage' ? `${flashDeal.value}% FLASH DEAL` : `EGP ${flashDeal.value} OFF`}</span>
                    </span>
                  ) : product.discountPrice ? (
                    <span className="bg-[#B67355] text-white text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 shadow-md">
                      Special Offer
                    </span>
                  ) : product.isNewArrival ? (
                    <span className="bg-[#1F1F1F] text-[#DCC9A6] text-[10px] font-sans font-semibold uppercase tracking-widest px-3 py-1 shadow-md">
                      New Arrival
                    </span>
                  ) : null}
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
                  {flashDeal || product.discountPrice ? (
                    <>
                      <span className="font-serif text-2xl sm:text-3xl font-bold text-[#B67355]">
                        EGP {effectivePrice.toFixed(2)}
                      </span>
                      <span className="font-sans text-base text-[#8E8A85] line-through">
                        EGP {product.price.toFixed(2)}
                      </span>
                      <span className="text-xs bg-[#EDE3CF] text-[#B67355] px-2 py-0.5 font-sans font-semibold">
                        Save EGP {savingsAmount.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1F1F]">
                      EGP {product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* FLASH DEAL COUNTDOWN TIMER (If active for this specific item) */}
                {flashDeal && flashDeal.endTime && (
                  <FlashDealCountdown
                    endTime={flashDeal.endTime}
                    title={flashDeal.title}
                    discountBadge={
                      flashDeal.type === 'percentage'
                        ? `${flashDeal.value}% OFF`
                        : `EGP ${flashDeal.value} OFF`
                    }
                  />
                )}

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
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="font-medium text-[#1F1F1F]">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F]">
                        Size:{' '}
                        <span className="font-normal text-[#8E8A85]">
                          {selectedSize || 'Select a size'}
                        </span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`px-4 py-2 text-xs font-sans font-medium uppercase tracking-wider transition-all ${
                            selectedSize === s
                              ? 'bg-[#1F1F1F] text-[#DCC9A6] border border-[#1F1F1F] shadow-sm'
                              : 'bg-white text-[#1F1F1F] border border-[#E8E2D8] hover:border-[#B67355]'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart Controls */}
                <div className="mt-8 pt-6 border-t border-[#E8E2D8] space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Quantity Counter */}
                    <div className="flex items-center border border-[#E8E2D8] bg-white">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 text-[#1F1F1F] hover:bg-[#F6F3EE] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 text-xs font-mono font-bold text-[#1F1F1F]">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))
                        }
                        className="p-3 text-[#1F1F1F] hover:bg-[#F6F3EE] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart CTA */}
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stockQuantity === 0}
                      className="flex-1 bg-[#1F1F1F] text-[#DCC9A6] py-3.5 px-6 text-xs uppercase tracking-[0.25em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-lg active:scale-[0.99] disabled:opacity-40"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Shopping Bag'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Value Guarantees */}
                <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-[#E8E2D8] text-xs font-sans text-[#8E8A85]">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-[#B67355]" />
                    <span>Doorstep COD Delivery</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#B67355]" />
                    <span>Inspection before paying</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-[#B67355]" />
                    <span>14-day exchange policy</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#B67355]" />
                    <span>Handcrafted in Egypt</span>
                  </div>
                </div>
              </div>

              {/* Informational Tabs (Specs / Wholesale / Shipping) */}
              <div className="mt-8 pt-6 border-t border-[#E8E2D8]">
                <div className="flex border-b border-[#E8E2D8] text-xs font-sans uppercase tracking-wider font-semibold">
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`pb-3 pr-6 transition-colors relative ${
                      activeTab === 'specs' ? 'text-[#B67355]' : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                    }`}
                  >
                    Fabric & Fit
                    {activeTab === 'specs' && (
                      <span className="absolute bottom-0 left-0 right-6 h-[2px] bg-[#B67355]" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('shipping')}
                    className={`pb-3 px-6 transition-colors relative ${
                      activeTab === 'shipping' ? 'text-[#B67355]' : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                    }`}
                  >
                    Delivery & COD
                    {activeTab === 'shipping' && (
                      <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#B67355]" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('wholesale')}
                    className={`pb-3 px-6 transition-colors relative ${
                      activeTab === 'wholesale' ? 'text-[#B67355]' : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                    }`}
                  >
                    Wholesale
                    {activeTab === 'wholesale' && (
                      <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#B67355]" />
                    )}
                  </button>
                </div>

                <div className="py-4 text-xs font-sans text-[#8E8A85] space-y-2">
                  {activeTab === 'specs' && (
                    <div className="space-y-1.5">
                      <p>
                        <strong className="text-[#1F1F1F]">Fabric:</strong>{' '}
                        {product.specs?.fabric || '100% Premium Organic Linen & Cotton Blend'}
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">Fit:</strong>{' '}
                        {product.specs?.fit || 'Relaxed Tailored Silhouette'}
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">Care:</strong>{' '}
                        {product.specs?.care || 'Dry clean or gentle hand wash cold. Do not tumble dry.'}
                      </p>
                      {product.specs?.origin && (
                        <p>
                          <strong className="text-[#1F1F1F]">Origin:</strong> {product.specs.origin}
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'shipping' && (
                    <div className="space-y-1.5">
                      <p>
                        <strong className="text-[#1F1F1F]">Cairo & Giza:</strong> Delivered within 24–48 hours (EGP 50).
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">Alexandria & Delta:</strong> 2–3 business days (EGP 65).
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">Upper Egypt & Coast:</strong> 3–4 business days (EGP 80).
                      </p>
                      <p className="text-emerald-700 font-medium">
                        * Free shipping across Egypt for orders over EGP 1,500.
                      </p>
                    </div>
                  )}

                  {activeTab === 'wholesale' && (
                    <div className="space-y-2">
                      <p>
                        Looking to stock ARMIA Boutique collections in your store or boutique?
                      </p>
                      <p>
                        We offer specialized wholesale pricing for orders of 10+ pieces across Egypt and the Gulf.
                      </p>
                      <Link
                        href="/contact"
                        className="inline-block text-[#B67355] font-semibold underline underline-offset-4"
                      >
                        Contact our wholesale concierge →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Grid */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-[#E8E2D8]">
              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
                  Complete Your Look
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1F1F1F]">
                  YOU MAY ALSO ADORE
                </h2>
                <div className="w-12 h-[1px] bg-[#DCC9A6] mx-auto mt-2" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
