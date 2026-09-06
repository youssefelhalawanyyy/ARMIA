'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Truck,
  RotateCcw,
  Sparkles,
  Zap,
  Ruler,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import FlashDealCountdown from '@/components/storefront/FlashDealCountdown';
import CompleteTheLook from '@/components/storefront/CompleteTheLook';
import SizeGuideModal from '@/components/storefront/SizeGuideModal';
import { Product, ProductColor } from '@/types';
import { getProductById, getProducts } from '@/lib/productService';
import { INITIAL_PRODUCTS } from '@/lib/seedData';
import { getActiveFlashDealForProduct } from '@/lib/discountService';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`armia_prod_${productId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return INITIAL_PRODUCTS.find((p) => p.id === productId) || null;
  });

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [allAvailableProducts, setAllAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !product);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAutoScrollPlaying, setIsAutoScrollPlaying] = useState(true);
  const [isGalleryHovered, setIsGalleryHovered] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(() => {
    if (product?.colors && product.colors.length > 0) return product.colors[0];
    return null;
  });
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (product?.sizes && product.sizes.length > 0) return product.sizes[0];
    return '';
  });
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'wholesale' | 'shipping'>('specs');

  const { addToCart, toggleWishlist, isWishlisted, discounts } = useCart();
  const { t, isArabic } = useLanguage();
  const ChevronIcon = isArabic ? ChevronLeft : ChevronRight;

  useEffect(() => {
    async function load() {
      if (!productId) return;
      if (!product) {
        setLoading(true);
      }
      const data = await getProductById(productId);
      if (data) {
        setProduct(data);
        setSelectedColor((prev) => prev || (data.colors?.[0] ?? null));
        setSelectedSize((prev) => prev || (data.sizes?.[0] ?? ''));
        setLoading(false);

        // Fetch related & upselling look pieces in the background non-blockingly
        getProducts(data.category).then((related) => {
          const availableRelated = related.filter((p) => p.id !== data.id && (p.stockQuantity ?? 0) > 0);
          setRelatedProducts(availableRelated.slice(0, 4));
        });

        getProducts('all').then((all) => {
          const availableAll = all.filter((p) => p.id !== data.id && (p.stockQuantity ?? 0) > 0);
          setAllAvailableProducts(availableAll);
        });
      } else {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  // Smart Auto-Scroll Effect for Product Photos
  useEffect(() => {
    const imagesCount = product?.imageUrls?.length || 0;
    if (imagesCount <= 1 || !isAutoScrollPlaying || isGalleryHovered) {
      return;
    }

    const intervalStepMs = 40;
    const durationMs = 4000;
    const stepIncrement = (intervalStepMs / durationMs) * 100;

    const timer = setInterval(() => {
      setGalleryProgress((prev) => {
        if (prev >= 100) {
          setSelectedImageIndex((current) => (current + 1) % imagesCount);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalStepMs);

    return () => clearInterval(timer);
  }, [product?.imageUrls?.length, isAutoScrollPlaying, isGalleryHovered]);

  const handleSelectImage = (idx: number) => {
    setSelectedImageIndex(idx);
    setGalleryProgress(0);
  };

  const handlePrevImage = () => {
    const imagesCount = product?.imageUrls?.length || 0;
    if (imagesCount <= 1) return;
    setSelectedImageIndex((prev) => (prev - 1 + imagesCount) % imagesCount);
    setGalleryProgress(0);
  };

  const handleNextImage = () => {
    const imagesCount = product?.imageUrls?.length || 0;
    if (imagesCount <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % imagesCount);
    setGalleryProgress(0);
  };

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsGalleryHovered(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsGalleryHovered(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      handleNextImage();
    } else if (diff < -40) {
      handlePrevImage();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Atelier High-Res Zoom Studio State
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  useEffect(() => {
    if (!isZoomOpen) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomOpen(false);
        setZoomScale(1);
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === '+' || e.key === '=') {
        setZoomScale((prev) => Math.min(3, prev + 0.5));
      } else if (e.key === '-') {
        setZoomScale((prev) => Math.max(1, prev - 0.5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomOpen]);

  const handleOpenZoom = (initialIdx?: number) => {
    if (typeof initialIdx === 'number') {
      setSelectedImageIndex(initialIdx);
    }
    setZoomScale(1);
    setPanPosition({ x: 50, y: 50 });
    setIsZoomOpen(true);
  };

  const handleCloseZoom = () => {
    setIsZoomOpen(false);
    setZoomScale(1);
    setPanPosition({ x: 50, y: 50 });
  };

  const handleToggleZoomScale = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale > 1) {
      setZoomScale(1);
      setPanPosition({ x: 50, y: 50 });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const clickY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setPanPosition({ x: clickX, y: clickY });
      setZoomScale(2.5);
    }
  };

  const handleZoomMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPanPosition({ x, y });
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
    } else if (e.deltaY > 0) {
      setZoomScale((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))));
    }
  };

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
            {isArabic ? 'المنتج غير متوفر' : 'Product Not Found'}
          </h2>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            {isArabic
              ? 'القطعة التي تبحثين عنها قد تم أرشفتها أو لم تعد متوفرة في التشكيلة الحالية.'
              : 'The piece you are looking for may have been archived or removed from the catalog.'}
          </p>
          <Link
            href="/collections"
            className="bg-[#1F1F1F] text-[#DCC9A6] px-8 py-3 text-xs uppercase tracking-widest font-sans inline-block"
          >
            {t.cart.explorePieces}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFav = isWishlisted(product.id);
  const mainImage = product.imageUrls[selectedImageIndex] || product.imageUrls[0] || '';

  // Check if there is an active single-item Flash Deal with countdown
  const flashDeal = getActiveFlashDealForProduct(product.id, discounts, product.name);

  // Only add the special offer countdown when there is an active flash deal / special offer on this item
  const countdownEndTime = flashDeal?.endTime || null;
  const countdownTitle =
    (isArabic && flashDeal?.titleArabic ? flashDeal.titleArabic : flashDeal?.title) ||
    (isArabic ? `عرض خاص لفترة محدودة على ${product.name}` : `⚡ Special Offer: Limited Time Price on ${product.name}`);
  const discountBadge = flashDeal
    ? flashDeal.type === 'percentage'
      ? `${flashDeal.value}% OFF`
      : `EGP ${flashDeal.value} OFF`
    : undefined;

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

  const getStockForCombination = (colorName?: string, sizeName?: string): number => {
    if (!product) return 0;
    if (!product.variants || product.variants.length === 0) {
      return product.stockQuantity;
    }
    if (!colorName || !sizeName) return product.stockQuantity;
    const match = product.variants.find((v) => v.color === colorName && v.size === sizeName);
    return match !== undefined ? Number(match.quantity) : product.stockQuantity;
  };

  const currentCombinationStock = getStockForCombination(selectedColor?.name, selectedSize);
  const isCombinationSoldOut = currentCombinationStock === 0;

  const handleAddToCart = () => {
    if (!selectedColor || isCombinationSoldOut || product.stockQuantity === 0) return;

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
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
              {t.nav.home}
            </Link>
            <ChevronIcon className="w-3 h-3" />
            <Link href="/collections" className="hover:text-[#1F1F1F] transition-colors">
              {t.nav.collections}
            </Link>
            <ChevronIcon className="w-3 h-3" />
            <Link
              href={`/collections/${product.category}`}
              className="hover:text-[#1F1F1F] uppercase transition-colors"
            >
              {product.category}
            </Link>
            <ChevronIcon className="w-3 h-3" />
            <span className="text-[#1F1F1F] font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>

          {/* Product Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* Left: Gallery (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Image Display with Smart Auto-Scroll & Click-to-Zoom */}
              <div
                onClick={() => handleOpenZoom(selectedImageIndex)}
                className="relative aspect-[3/4] w-full bg-white border border-[#E8E2D8] overflow-hidden shadow-sm rounded-sm group select-none cursor-zoom-in"
                onMouseEnter={() => setIsGalleryHovered(true)}
                onMouseLeave={() => setIsGalleryHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Luxury Story-style Progress Bars (shown when multiple images) */}
                {product.imageUrls.length > 1 && (
                  <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5 pointer-events-none">
                    {product.imageUrls.map((_, idx) => {
                      const isPast = idx < selectedImageIndex;
                      const isCurrent = idx === selectedImageIndex;
                      const fillWidth = isPast ? 100 : isCurrent ? galleryProgress : 0;
                      return (
                        <div
                          key={idx}
                          className="h-1 flex-1 bg-black/25 backdrop-blur-sm rounded-full overflow-hidden"
                        >
                          <div
                            className={`h-full transition-all ease-linear ${
                              isCurrent
                                ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                                : isPast
                                ? 'bg-[#DCC9A6]'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${fillWidth}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Animated Image with Cross-fade & Subtle Scale */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImageIndex}
                    initial={{ opacity: 0, scale: 1.01 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <Image
                      src={product.imageUrls[selectedImageIndex] || mainImage}
                      alt={product.name}
                      fill
                      priority
                      className="object-cover object-center"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Interactive Navigation Arrows (Smooth Glassmorphism) */}
                {product.imageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      aria-label="Previous Photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-md border border-[#E8E2D8] flex items-center justify-center text-[#1F1F1F] hover:text-[#B67355] hover:bg-white hover:scale-105 transition-all shadow-md z-20 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      aria-label="Next Photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-md border border-[#E8E2D8] flex items-center justify-center text-[#1F1F1F] hover:text-[#B67355] hover:bg-white hover:scale-105 transition-all shadow-md z-20 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Floating Tags (positioned below story progress bars) */}
                <div className="absolute top-6 left-4 flex flex-col gap-1.5 z-20 pointer-events-none">
                  {flashDeal ? (
                    <span className="bg-[#B67355] text-white text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 shadow-md flex items-center gap-1.5 rounded-sm">
                      <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                      <span>{flashDeal.type === 'percentage' ? `${flashDeal.value}% FLASH DEAL` : `EGP ${flashDeal.value} OFF`}</span>
                    </span>
                  ) : product.discountPrice ? (
                    <span className="bg-[#B67355] text-white text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 shadow-md rounded-sm">
                      {t.product.sale}
                    </span>
                  ) : product.isNewArrival ? (
                    <span className="bg-[#1F1F1F] text-[#DCC9A6] text-[10px] font-sans font-semibold uppercase tracking-widest px-3 py-1 shadow-md rounded-sm">
                      {t.product.newIn}
                    </span>
                  ) : null}
                </div>

                {/* Floating Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-6 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-[#E8E2D8] flex items-center justify-center text-[#1F1F1F] hover:text-[#B67355] hover:border-[#B67355] transition-all shadow-md z-20"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFav ? 'fill-[#B67355] text-[#B67355]' : 'text-[#1F1F1F]'
                    }`}
                  />
                </button>

                {/* Floating Zoom Action Pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenZoom(selectedImageIndex);
                  }}
                  className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-[#1F1F1F]/80 hover:bg-[#B67355] backdrop-blur-md text-white text-[11px] font-sans px-3 py-1.5 rounded-full border border-white/20 shadow-lg transition-all cursor-pointer group/zoom"
                  title={isArabic ? 'تكبير فائق الدقة' : 'Click to Zoom High-Res'}
                >
                  <ZoomIn className="w-3.5 h-3.5 group-hover/zoom:scale-110 transition-transform" />
                  <span className="text-[10px] tracking-wide uppercase font-semibold">
                    {isArabic ? 'تكبير' : 'Zoom'}
                  </span>
                </button>

                {/* Smart Creative Control Pill at Bottom Corner */}
                {product.imageUrls.length > 1 && (
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 bg-[#1F1F1F]/80 backdrop-blur-md text-white text-[11px] font-sans px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                    <span className="font-mono tracking-wider">
                      {String(selectedImageIndex + 1).padStart(2, '0')} / {String(product.imageUrls.length).padStart(2, '0')}
                    </span>
                    <span className="w-px h-3 bg-white/30" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoScrollPlaying((prev) => !prev);
                      }}
                      className="hover:text-[#DCC9A6] transition-colors flex items-center gap-1.5 cursor-pointer"
                      title={isAutoScrollPlaying ? (isArabic ? 'إيقاف التمرير التلقائي' : 'Pause Auto-Scroll') : (isArabic ? 'تشغيل التمرير التلقائي' : 'Play Auto-Scroll')}
                    >
                      {isAutoScrollPlaying ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span className="text-[10px] text-[#DCC9A6]">
                            {isGalleryHovered ? (isArabic ? 'متوقف مؤقتاً' : 'Paused') : (isArabic ? 'تلقائي' : 'Auto')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span className="text-[10px] opacity-80">{isArabic ? 'تشغيل' : 'Play'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails list with active gold ring & subtle count badges */}
              {product.imageUrls.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {product.imageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectImage(idx)}
                      className={`relative w-20 aspect-[3/4] shrink-0 border-2 overflow-hidden transition-all duration-300 rounded-sm cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#B67355] ring-2 ring-[#B67355]/40 opacity-100 shadow-md scale-[1.03]'
                          : 'border-[#E8E2D8] opacity-60 hover:opacity-100 hover:border-[#DCC9A6]'
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1 rounded">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
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
                  {isCombinationSoldOut || product.stockQuantity === 0 ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>{isCombinationSoldOut ? (isArabic ? 'المقاس المحدد غير متوفر' : 'Sold Out in Selected Color') : t.product.outOfStock}</span>
                    </span>
                  ) : currentCombinationStock <= 3 ? (
                    <span className="text-[#B67355] font-bold flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#B67355]" />
                      <span>{isArabic ? `كمية محدودة - متبقي ${currentCombinationStock} قطع فقط!` : `Low Stock - Only ${currentCombinationStock} Left!`}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {t.product.inStock} ({currentCombinationStock} {isArabic ? 'قطعة' : 'pieces'})
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F1F1F]">
                  {isArabic && product.nameArabic ? product.nameArabic : product.name}
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
                      <span className="text-xs bg-[#EDE3CF] text-[#B67355] px-2 py-0.5 font-sans font-semibold rounded">
                        {t.product.save} EGP {savingsAmount.toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1F1F]">
                      EGP {product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* FLASH DEAL COUNTDOWN TIMER - Positioned directly beneath the price */}
                {countdownEndTime && (
                  <div className="my-3.5">
                    <FlashDealCountdown
                      endTime={countdownEndTime}
                      title={countdownTitle}
                      discountBadge={discountBadge}
                    />
                  </div>
                )}

                {/* Description */}
                <p className="mt-4 text-xs sm:text-sm text-[#8E8A85] font-sans leading-relaxed">
                  {isArabic && product.descriptionArabic ? product.descriptionArabic : product.description}
                </p>

                {/* Color Selector */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[#E8E2D8]">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F]">
                        {t.product.selectColor}:{' '}
                        <span className="font-normal text-[#8E8A85]">
                          {(isArabic && selectedColor?.nameArabic ? selectedColor.nameArabic : selectedColor?.name) || (isArabic ? 'اختاري اللون' : 'Select a color')}
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      {product.colors.map((c) => {
                        const colorLabel = isArabic && c.nameArabic ? c.nameArabic : c.name;
                        return (
                          <button
                            key={c.name}
                            onClick={() => setSelectedColor(c)}
                            className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-sans transition-all rounded ${
                              selectedColor?.name === c.name
                                ? 'border-[#B67355] bg-white shadow-sm ring-1 ring-[#B67355]'
                                : 'border-[#E8E2D8] bg-white hover:border-[#8E8A85]'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="font-medium text-[#1F1F1F]">{colorLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-sans uppercase tracking-wider font-semibold text-[#1F1F1F]">
                        {t.product.selectSize}:{' '}
                        <span className="font-normal text-[#8E8A85]">
                          {selectedSize || (isArabic ? 'اختاري المقاس' : 'Select a size')}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#B67355] hover:text-[#1F1F1F] font-semibold underline underline-offset-4 transition-colors"
                      >
                        <Ruler className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'دليل المقاسات' : 'Size Guide & Chart'}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {product.sizes.map((s) => {
                        const stockForSize = getStockForCombination(selectedColor?.name, s);
                        const isOutOfStock = stockForSize === 0;

                        return (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`px-4 py-2 text-xs font-sans font-medium uppercase tracking-wider transition-all rounded flex items-center gap-1.5 ${
                              selectedSize === s
                                ? 'bg-[#1F1F1F] text-[#DCC9A6] border border-[#1F1F1F] shadow-sm'
                                : isOutOfStock
                                ? 'bg-[#F2EFE9] text-[#A0A0A0] border border-[#E8E2D8] line-through opacity-60 hover:border-[#A0A0A0]'
                                : 'bg-white text-[#1F1F1F] border border-[#E8E2D8] hover:border-[#B67355]'
                            }`}
                          >
                            <span>{s}</span>
                            {isOutOfStock ? (
                              <span className="text-[9px] text-red-500 font-bold no-underline inline-block">
                                ({isArabic ? 'نفد' : 'Sold'})
                              </span>
                            ) : stockForSize === 1 ? (
                              <span className={`text-[9px] font-bold no-underline inline-block px-1.5 py-0.5 rounded ${
                                selectedSize === s ? 'bg-[#B67355] text-white' : 'bg-amber-100 text-[#B67355]'
                              }`}>
                                {isArabic ? 'باقي 1 فقط' : '1 left only'}
                              </span>
                            ) : stockForSize === 2 ? (
                              <span className={`text-[9px] font-bold no-underline inline-block px-1.5 py-0.5 rounded ${
                                selectedSize === s ? 'bg-[#B67355] text-white' : 'bg-amber-100 text-[#B67355]'
                              }`}>
                                {isArabic ? 'باقي 2' : '2 left'}
                              </span>
                            ) : stockForSize === 3 ? (
                              <span className={`text-[9px] font-bold no-underline inline-block px-1.5 py-0.5 rounded ${
                                selectedSize === s ? 'bg-[#B67355] text-white' : 'bg-amber-100 text-[#B67355]'
                              }`}>
                                {isArabic ? 'باقي 3' : '3 left'}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart Controls */}
                <div className="mt-8 pt-6 border-t border-[#E8E2D8] space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Quantity Counter */}
                    <div className="flex items-center border border-[#E8E2D8] bg-white rounded">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isCombinationSoldOut}
                        className="p-3 text-[#1F1F1F] hover:bg-[#F6F3EE] transition-colors disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-4 text-xs font-mono font-bold text-[#1F1F1F]">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity(Math.min(currentCombinationStock || 99, quantity + 1))
                        }
                        disabled={isCombinationSoldOut}
                        className="p-3 text-[#1F1F1F] hover:bg-[#F6F3EE] transition-colors disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart CTA */}
                    <button
                      onClick={handleAddToCart}
                      disabled={isCombinationSoldOut || product.stockQuantity === 0}
                      className="flex-1 bg-[#1F1F1F] text-[#DCC9A6] py-3.5 px-6 text-xs uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-lg active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-[#1F1F1F] disabled:hover:text-[#DCC9A6] rounded"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {isCombinationSoldOut
                          ? (isArabic ? 'هذا المقاس غير متوفر بهذا اللون' : 'Sold Out in Selected Color')
                          : product.stockQuantity === 0
                          ? t.product.outOfStock
                          : t.product.addToCart}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Value Guarantees */}
                <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-[#E8E2D8] text-xs font-sans text-[#8E8A85]">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-[#B67355] shrink-0" />
                    <span>{t.product.guarantees.cod}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#B67355] shrink-0" />
                    <span>{t.product.guarantees.inspect}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-[#B67355] shrink-0" />
                    <span>{t.product.guarantees.exchange}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#B67355] shrink-0" />
                    <span>{t.product.guarantees.egyptCraft}</span>
                  </div>
                </div>
              </div>

              {/* Informational Tabs (Specs / Wholesale / Shipping) */}
              <div className="mt-8 pt-6 border-t border-[#E8E2D8]">
                <div className="flex border-b border-[#E8E2D8] text-xs font-sans uppercase tracking-wider font-semibold">
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`pb-3 pr-6 rtl:pr-0 rtl:pl-6 transition-colors relative ${
                      activeTab === 'specs' ? 'text-[#B67355]' : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                    }`}
                  >
                    {t.product.tabs.fabricAndFit}
                    {activeTab === 'specs' && (
                      <span className="absolute bottom-0 left-0 right-6 rtl:right-0 rtl:left-6 h-[2px] bg-[#B67355]" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('shipping')}
                    className={`pb-3 px-6 transition-colors relative ${
                      activeTab === 'shipping' ? 'text-[#B67355]' : 'text-[#8E8A85] hover:text-[#1F1F1F]'
                    }`}
                  >
                    {t.product.tabs.delivery}
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
                    {t.product.tabs.wholesale}
                    {activeTab === 'wholesale' && (
                      <span className="absolute bottom-0 left-6 right-6 h-[2px] bg-[#B67355]" />
                    )}
                  </button>
                </div>

                <div className="py-4 text-xs font-sans text-[#8E8A85] space-y-2">
                  {activeTab === 'specs' && (
                    <div className="space-y-1.5">
                      <p>
                        <strong className="text-[#1F1F1F]">{isArabic ? 'الخامة والأقمشة:' : 'Fabric:'}</strong>{' '}
                        {(isArabic && product.specs?.fabricArabic ? product.specs.fabricArabic : product.specs?.fabric) || (isArabic ? 'كتان فرنسي طبيعي 100% مع معالجة فاخرة' : '100% Premium Organic Linen & Cotton Blend')}
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">{isArabic ? 'القصّة والمقاس:' : 'Fit:'}</strong>{' '}
                        {(isArabic && product.specs?.fitArabic ? product.specs.fitArabic : product.specs?.fit) || (isArabic ? 'قصّة عصرية مريحة وأنيقة' : 'Relaxed Tailored Silhouette')}
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">{isArabic ? 'العناية بالقطعة:' : 'Care:'}</strong>{' '}
                        {(isArabic && product.specs?.careArabic ? product.specs.careArabic : product.specs?.care) || (isArabic ? 'تنظيف جاف أو غسيل يدوي بماء بارد' : 'Dry clean or gentle hand wash cold. Do not tumble dry.')}
                      </p>
                      {(product.specs?.origin || product.specs?.originArabic) && (
                        <p>
                          <strong className="text-[#1F1F1F]">{isArabic ? 'بلد الصنع:' : 'Origin:'}</strong>{' '}
                          {isArabic && product.specs?.originArabic ? product.specs.originArabic : product.specs?.origin}
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === 'shipping' && (
                    <div className="space-y-1.5">
                      <p>
                        <strong className="text-[#1F1F1F]">{isArabic ? 'القاهرة والجيزة:' : 'Cairo & Giza:'}</strong>{' '}
                        {isArabic ? 'توصيل خلال 24–48 ساعة (50 ج.م).' : 'Delivered within 24–48 hours (EGP 50).'}
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">{isArabic ? 'الإسكندرية ومحافظات الدلتا:' : 'Alexandria & Delta:'}</strong>{' '}
                        {isArabic ? 'توصيل خلال 2–3 أيام عمل (65 ج.م).' : '2–3 business days (EGP 65).'}
                      </p>
                      <p>
                        <strong className="text-[#1F1F1F]">{isArabic ? 'الصعيد والقناة والساحل:' : 'Upper Egypt & Coast:'}</strong>{' '}
                        {isArabic ? 'توصيل خلال 3–4 أيام عمل (80 ج.م).' : '3–4 business days (EGP 80).'}
                      </p>
                      <p className="text-emerald-700 font-medium">
                        {isArabic ? '* شحن مجاني لكافة محافظات مصر للطلبات التي تتجاوز 1,500 ج.م.' : '* Free shipping across Egypt for orders over EGP 1,500.'}
                      </p>
                    </div>
                  )}

                  {activeTab === 'wholesale' && (
                    <div className="space-y-2">
                      <p>
                        {isArabic
                          ? 'هل ترغبين في تزويد بوتيكك أو متجرك بأحدث تشكيلات أرميا بوتيك؟'
                          : 'Looking to stock ARMIA Boutique collections in your store or boutique?'}
                      </p>
                      <p>
                        {isArabic
                          ? 'نوفر أسعار جملة حصرية للطلبات التي تزيد عن 10 قطع في مصر والخليج العربي.'
                          : 'We offer specialized wholesale pricing for orders of 10+ pieces across Egypt and the Gulf.'}
                      </p>
                      <Link
                        href="/contact"
                        className="inline-block text-[#B67355] font-semibold underline underline-offset-4"
                      >
                        {isArabic ? 'تواصلي مع فريق خدمة الجملة ←' : 'Contact our wholesale concierge →'}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Complete The Look Curated Outfit Bundle */}
          <CompleteTheLook currentProduct={product} allProducts={allAvailableProducts} />

          {/* Related Products Grid */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-[#E8E2D8]">
              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
                  {t.product.relatedSubtitle}
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#1F1F1F]">
                  {t.product.relatedTitle}
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

      {/* Bilingual Size Guide & Measurements Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        product={product}
        selectedSize={selectedSize}
        onSelectSize={(s) => setSelectedSize(s)}
      />

      {/* Atelier High-Res Zoom Studio Lightbox Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0A]/95 backdrop-blur-2xl text-white flex flex-col justify-between select-none overflow-hidden"
          >
            {/* Top Bar / Header */}
            <div className="relative z-30 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
              {/* Product Info & High-Res Tag */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase bg-[#DCC9A6] text-[#1F1F1F] font-bold rounded-sm">
                  {isArabic ? 'فحص فائق الدقة' : 'HIGH-RES STUDIO'}
                </span>
                <div>
                  <h3 className="font-serif text-sm sm:text-base font-medium tracking-wide text-white">
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-sans text-white/50 tracking-wider">
                    {isArabic ? 'استكشاف تفاصيل القماش والخياطة' : 'Inspect fabric texture & stitching'}
                  </p>
                </div>
              </div>

              {/* Center Controls: Zoom Level & Presets */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-2.5 sm:px-4 py-1.5 rounded-full border border-white/15 shadow-inner">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(1, Number((prev - 0.5).toFixed(1))))}
                  disabled={zoomScale <= 1}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title={isArabic ? 'تصغير (-)' : 'Zoom Out (-)'}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <div className="min-w-[56px] text-center">
                  <span className="font-mono text-xs font-semibold text-[#DCC9A6]">
                    {Math.round(zoomScale * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(3.5, Number((prev + 0.5).toFixed(1))))}
                  disabled={zoomScale >= 3.5}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title={isArabic ? 'تكبير (+)' : 'Zoom In (+)'}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-4 bg-white/20 mx-1 hidden sm:inline-block" />

                {/* Quick Toggle 1x / 2.5x */}
                <button
                  type="button"
                  onClick={() => {
                    if (zoomScale > 1) {
                      setZoomScale(1);
                      setPanPosition({ x: 50, y: 50 });
                    } else {
                      setZoomScale(2.5);
                      setPanPosition({ x: 50, y: 50 });
                    }
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-sans font-medium rounded-full bg-white/10 hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{zoomScale > 1 ? (isArabic ? 'إعادة ضبط (1x)' : 'Reset (1x)') : (isArabic ? 'ماكرو (2.5x)' : 'Macro (2.5x)')}</span>
                </button>
              </div>

              {/* Right: Counter & Close */}
              <div className="flex items-center gap-3">
                {product.imageUrls.length > 1 && (
                  <span className="font-mono text-xs text-white/60 tracking-widest hidden sm:inline-block">
                    {String(selectedImageIndex + 1).padStart(2, '0')} / {String(product.imageUrls.length).padStart(2, '0')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCloseZoom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 transition-colors text-xs font-sans cursor-pointer group"
                  title={isArabic ? 'إغلاق (Esc)' : 'Close (Esc)'}
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span className="hidden sm:inline-block font-mono text-[11px] text-white/70">ESC</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas Center Stage */}
            <div
              className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-2 sm:p-6"
              onWheel={handleWheelZoom}
            >
              {/* Prev Image Arrow */}
              {product.imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  aria-label="Previous image"
                  className="absolute left-3 sm:left-6 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-[#DCC9A6] hover:text-[#1F1F1F] border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-xl cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Image Arrow */}
              {product.imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="Next image"
                  className="absolute right-3 sm:right-6 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-[#DCC9A6] hover:text-[#1F1F1F] border border-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-xl cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Pan & Zoom Image Container */}
              <div
                onClick={handleToggleZoomScale}
                onMouseMove={handleZoomMouseMove}
                className={`relative w-full h-full max-w-4xl max-h-[75vh] flex items-center justify-center overflow-hidden select-none rounded-md transition-all ${
                  zoomScale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              >
                <div
                  className="relative w-full h-full flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: `${panPosition.x}% ${panPosition.y}%`,
                    transition: zoomScale === 1 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                  }}
                >
                  <Image
                    src={product.imageUrls[selectedImageIndex] || mainImage}
                    alt={`${product.name} zoom view`}
                    fill
                    sizes="100vw"
                    priority
                    className="object-contain pointer-events-none drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Bar: Thumbnails & Clever Guidance */}
            <div className="relative z-30 px-4 sm:px-6 py-3 border-t border-white/10 bg-black/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Guidance Hint */}
              <div className="text-[11px] font-sans text-white/60 text-center sm:text-left">
                {isArabic ? (
                  <span>
                    💡 <strong className="text-[#DCC9A6]">تلميح:</strong> انقري للتكبير • حرّكي الماوس لاستكشاف أدق تفاصيل الخامة • عجلة الماوس لتكبير مرن
                  </span>
                ) : (
                  <span>
                    💡 <strong className="text-[#DCC9A6]">Pro Tip:</strong> Click to zoom • Pan mouse across fabric • Scroll wheel or +/- to adjust • Esc to close
                  </span>
                )}
              </div>

              {/* Modal Thumbnails Carousel */}
              {product.imageUrls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                  {product.imageUrls.map((url, idx) => {
                    const isSelected = selectedImageIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedImageIndex(idx);
                          setGalleryProgress(0);
                        }}
                        className={`relative w-12 h-16 rounded overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'border-[#DCC9A6] ring-2 ring-[#DCC9A6]/50 scale-105 opacity-100'
                            : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/60'
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
