'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import ProductCard from '@/components/storefront/ProductCard';
import CompleteTheLook from '@/components/storefront/CompleteTheLook';
import SizeGuideModal from '@/components/storefront/SizeGuideModal';
import SpinProductShowcase from '@/components/storefront/SpinProductShowcase';
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
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(() => {
    if (product?.colors && product.colors.length > 0) return product.colors[0];
    return null;
  });
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (product?.sizes && product.sizes.length > 0) return product.sizes[0];
    return '';
  });
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const belowFoldRef = useRef<HTMLDivElement | null>(null);

  const { addToCart, discounts } = useCart();
  const { t, isArabic } = useLanguage();

  useEffect(() => {
    let active = true;
    async function load() {
      if (!productId) return;
      const data = await getProductById(productId);
      if (!active) return;
      if (data) {
        setProduct(data);
        setSelectedColor((prev) => prev || (data.colors?.[0] ?? null));
        setSelectedSize((prev) => prev || (data.sizes?.[0] ?? ''));
        setLoading(false);

        getProducts(data.category).then((related) => {
          if (!active) return;
          const availableRelated = related.filter(
            (p) => p.id !== data.id && (p.stockQuantity ?? 0) > 0
          );
          setRelatedProducts(availableRelated.slice(0, 4));
        });

        getProducts('all').then((all) => {
          if (!active) return;
          const availableAll = all.filter(
            (p) => p.id !== data.id && (p.stockQuantity ?? 0) > 0
          );
          setAllAvailableProducts(availableAll);
        });
      } else {
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [productId]);

  const imagesCount = product?.imageUrls?.length || 0;

  const handlePrevImage = () => {
    if (imagesCount <= 1) return;
    setSelectedImageIndex((prev) => (prev - 1 + imagesCount) % imagesCount);
  };

  const handleNextImage = () => {
    if (imagesCount <= 1) return;
    setSelectedImageIndex((prev) => (prev + 1) % imagesCount);
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
      } else if (e.key === 'ArrowRight' && imagesCount > 1) {
        setSelectedImageIndex((prev) => (prev + 1) % imagesCount);
      } else if (e.key === 'ArrowLeft' && imagesCount > 1) {
        setSelectedImageIndex((prev) => (prev - 1 + imagesCount) % imagesCount);
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
  }, [isZoomOpen, imagesCount]);

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
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin" />
        </div>
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

  const mainImage = product.imageUrls[selectedImageIndex] || product.imageUrls[0] || '';
  const flashDeal = getActiveFlashDealForProduct(product.id, discounts, product.name);

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

  const handleAddToBag = () => {
    if (!product || isCombinationSoldOut || (product.stockQuantity ?? 0) === 0) return;

    const chosenColor =
      selectedColor || (product.colors?.[0] ?? { name: 'Standard', hex: '#1F1F1F' });
    const chosenSize = selectedSize || (product.sizes?.[0] ?? 'Standard');
    const finalPrice = Number(effectivePrice || product.discountPrice || product.price || 0);
    const origPrice = Number(product.price || finalPrice);

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: finalPrice,
        originalPrice: origPrice,
        quantity: 1,
        selectedColor: chosenColor,
        selectedSize: chosenSize,
        imageUrl: product.imageUrls?.[0] || '',
        category: product.category || 'all',
      },
      false // Let the flying arc + bag bump animation complete cleanly; user clicks BAG/N to open drawer
    );
  };

  const handleScrollToDetails = () => {
    belowFoldRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      {/* Primary Full-Viewport 360° Editorial Product Showcase */}
      <SpinProductShowcase
        product={product}
        effectivePrice={effectivePrice}
        savingsAmount={savingsAmount}
        flashDeal={flashDeal}
        selectedColor={selectedColor}
        onSelectColor={(c) => setSelectedColor(c)}
        selectedSize={selectedSize}
        onSelectSize={(s) => setSelectedSize(s)}
        getStockForCombination={getStockForCombination}
        isCombinationSoldOut={isCombinationSoldOut}
        onAddToBag={handleAddToBag}
        onOpenSizeGuide={() => setSizeGuideOpen(true)}
        onOpenZoom={handleOpenZoom}
        onScrollToDetails={
          relatedProducts.length > 0 || allAvailableProducts.length > 0
            ? handleScrollToDetails
            : undefined
        }
      />

      {/* Below-the-Fold Curated Styling & Related Products */}
      <div ref={belowFoldRef} className="bg-[#F6F3EE] border-t border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <CompleteTheLook currentProduct={product} allProducts={allAvailableProducts} />

          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-[#E8E2D8]">
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
      </div>

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

              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-2.5 sm:px-4 py-1.5 rounded-full border border-white/15 shadow-inner">
                <button
                  type="button"
                  onClick={() =>
                    setZoomScale((prev) => Math.max(1, Number((prev - 0.5).toFixed(1))))
                  }
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
                  onClick={() =>
                    setZoomScale((prev) => Math.min(3.5, Number((prev + 0.5).toFixed(1))))
                  }
                  disabled={zoomScale >= 3.5}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title={isArabic ? 'تكبير (+)' : 'Zoom In (+)'}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-4 bg-white/20 mx-1 hidden sm:inline-block" />

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
                  <span>
                    {zoomScale > 1
                      ? isArabic
                        ? 'إعادة ضبط (1x)'
                        : 'Reset (1x)'
                      : isArabic
                      ? 'ماكرو (2.5x)'
                      : 'Macro (2.5x)'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {product.imageUrls.length > 1 && (
                  <span className="font-mono text-xs text-white/60 tracking-widest hidden sm:inline-block">
                    {String(selectedImageIndex + 1).padStart(2, '0')} /{' '}
                    {String(product.imageUrls.length).padStart(2, '0')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCloseZoom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 transition-colors text-xs font-sans cursor-pointer group"
                  title={isArabic ? 'إغلاق (Esc)' : 'Close (Esc)'}
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                  <span className="hidden sm:inline-block font-mono text-[11px] text-white/70">
                    ESC
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas Center Stage */}
            <div
              className="relative flex-1 w-full overflow-hidden flex items-center justify-center p-2 sm:p-6"
              onWheel={handleWheelZoom}
            >
              {product.imageUrls.length > 1 && (
                <>
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
                </>
              )}

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
                    transition:
                      zoomScale === 1
                        ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        : 'none',
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

            {/* Bottom Bar */}
            <div className="relative z-30 px-4 sm:px-6 py-3 border-t border-white/10 bg-black/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] font-sans text-white/60 text-center sm:text-left">
                {isArabic ? (
                  <span>
                    <strong className="text-[#DCC9A6]">تلميح:</strong> انقري للتكبير • حرّكي الماوس لاستكشاف أدق تفاصيل الخامة • عجلة الماوس لتكبير مرن
                  </span>
                ) : (
                  <span>
                    <strong className="text-[#DCC9A6]">Pro Tip:</strong> Click to zoom • Pan mouse across fabric • Scroll wheel or +/- to adjust • Esc to close
                  </span>
                )}
              </div>

              {product.imageUrls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                  {product.imageUrls.map((url, idx) => {
                    const isSelected = selectedImageIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
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
