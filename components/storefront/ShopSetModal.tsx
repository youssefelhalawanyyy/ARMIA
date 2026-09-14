'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Check, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface ShopSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  topProduct: Product;
  pantsProduct: Product;
}

export default function ShopSetModal({
  isOpen,
  onClose,
  topProduct,
  pantsProduct,
}: ShopSetModalProps) {
  const [mounted, setMounted] = useState(false);
  const { addToCart } = useCart();
  const { isArabic } = useLanguage();
  const { success } = useToast();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const topSizes = topProduct.sizes && topProduct.sizes.length > 0 ? topProduct.sizes : ['M', 'L', 'XL', 'XXL'];
  const pantsSizes = pantsProduct.sizes && pantsProduct.sizes.length > 0 ? pantsProduct.sizes : ['S', 'M', 'L', 'XL'];

  const [selectedTopSize, setSelectedTopSize] = useState<string>(topSizes[0]);
  const [selectedPantsSize, setSelectedPantsSize] = useState<string>(pantsSizes[1] || pantsSizes[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Sync initial sizes when products change
  useEffect(() => {
    if (topSizes[0]) setSelectedTopSize(topSizes[0]);
    if (pantsSizes[0]) setSelectedPantsSize(pantsSizes[1] || pantsSizes[0]);
  }, [topProduct, pantsProduct]);

  if (!isOpen || !mounted) return null;

  const topPrice = topProduct.discountPrice || topProduct.price || 500;
  const pantsPrice = pantsProduct.discountPrice || pantsProduct.price || 380;
  const totalPrice = topPrice + pantsPrice;

  const topImage = topProduct.imageUrls?.[0] || '/images/hero-editorial.jpg';
  const pantsImage = pantsProduct.imageUrls?.[0] || '/images/pants-editorial.jpg';

  const handleAddSetToCart = () => {
    setIsAdding(true);

    try {
      // 1. Add Top
      addToCart(
        {
          productId: topProduct.id,
          name: topProduct.name,
          price: topPrice,
          originalPrice: topProduct.price || 500,
          quantity: 1,
          selectedColor: topProduct.colors?.[0] || { name: 'Oatmeal Beige', hex: '#DCC9A6' },
          selectedSize: selectedTopSize || 'M',
          imageUrl: topImage,
          category: topProduct.category || 'tops',
        },
        false
      );

      // 2. Add Pants & open cart drawer
      addToCart(
        {
          productId: pantsProduct.id,
          name: pantsProduct.name,
          price: pantsPrice,
          originalPrice: pantsProduct.price || 450,
          quantity: 1,
          selectedColor: pantsProduct.colors?.[0] || { name: 'Light Wash Denim', hex: '#87CEEB' },
          selectedSize: selectedPantsSize || 'M',
          imageUrl: pantsImage,
          category: pantsProduct.category || 'bottoms',
        },
        true
      );

      success(
        isArabic
          ? `تمت إضافة الطقم بنجاح! التوب (مقاس ${selectedTopSize}) والبنطال (مقاس ${selectedPantsSize})`
          : `Complete 2-piece set added! Top (${selectedTopSize}) & Pants (${selectedPantsSize})`,
        isArabic ? 'طقم الأتليه' : 'Set Added'
      );
    } catch (err) {
      console.error('Error adding set to cart:', err);
    } finally {
      setIsAdding(false);
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative bg-[#FAF8F5] border-2 border-[#DCC9A6] w-full max-w-2xl lg:max-w-3xl shadow-2xl rounded-xl overflow-hidden z-10 my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh]"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          {/* Header (Fixed at top) */}
          <div className="bg-[#1F1F1F] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#DCC9A6]/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#B67355] text-white rounded-md shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#DCC9A6] uppercase tracking-[0.25em] font-sans font-semibold block">
                  {isArabic ? 'إطلالة متكاملة' : 'Curated Atelier Set'}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#FAF8F5]">
                  {isArabic ? 'اختاري مقاسات الطقم' : 'Select Sizes for the Set'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-[#8E8A85] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body: Side-by-side on sm/md screens, stacked on mobile */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Piece 1: Top */}
              <div className="bg-white border border-[#E8E2D8] rounded-lg p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-18 sm:w-16 sm:h-20 bg-[#F6F3EE] rounded-md overflow-hidden shrink-0 border border-[#E8E2D8]">
                      <Image
                        src={topImage}
                        alt={topProduct.name}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#B67355] font-sans font-bold">
                        {isArabic ? 'القطعة الأولى • توب' : 'Piece 01 • Top'}
                      </span>
                      <h4 className="font-serif text-sm sm:text-base font-bold text-[#1F1F1F] truncate mt-0.5">
                        {isArabic && topProduct.nameArabic ? topProduct.nameArabic : topProduct.name}
                      </h4>
                      <p className="font-serif text-sm font-bold text-[#B67355] mt-0.5">
                        {topPrice} EGP
                      </p>
                    </div>
                  </div>

                  {/* Size Selector for Top */}
                  <div className="mt-3.5 pt-3 border-t border-[#E8E2D8]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-sans font-bold text-[#1F1F1F] uppercase tracking-wider">
                        {isArabic ? 'مقاس التوب:' : 'Select Top Size:'}
                      </label>
                      <span className="text-xs font-sans text-[#B67355] font-extrabold bg-[#B67355]/10 px-2 py-0.5 rounded">
                        {selectedTopSize}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {topSizes.map((size) => {
                        const isSelected = selectedTopSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedTopSize(size)}
                            className={`min-w-[42px] px-2.5 py-1.5 text-xs font-sans font-bold tracking-wider transition-all rounded border ${
                              isSelected
                                ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F] shadow-sm scale-105'
                                : 'bg-[#FAF8F5] text-[#1F1F1F] border-[#E8E2D8] hover:border-[#B67355]'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Piece 2: Pants */}
              <div className="bg-white border border-[#E8E2D8] rounded-lg p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-18 sm:w-16 sm:h-20 bg-[#F6F3EE] rounded-md overflow-hidden shrink-0 border border-[#E8E2D8]">
                      <Image
                        src={pantsImage}
                        alt={pantsProduct.name}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#B67355] font-sans font-bold">
                        {isArabic ? 'القطعة الثانية • بنطال' : 'Piece 02 • Pants'}
                      </span>
                      <h4 className="font-serif text-sm sm:text-base font-bold text-[#1F1F1F] truncate mt-0.5">
                        {isArabic && pantsProduct.nameArabic ? pantsProduct.nameArabic : pantsProduct.name}
                      </h4>
                      <p className="font-serif text-sm font-bold text-[#B67355] mt-0.5">
                        {pantsPrice} EGP
                      </p>
                    </div>
                  </div>

                  {/* Size Selector for Pants */}
                  <div className="mt-3.5 pt-3 border-t border-[#E8E2D8]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-sans font-bold text-[#1F1F1F] uppercase tracking-wider">
                        {isArabic ? 'مقاس البنطال:' : 'Select Pants Size:'}
                      </label>
                      <span className="text-xs font-sans text-[#B67355] font-extrabold bg-[#B67355]/10 px-2 py-0.5 rounded">
                        {selectedPantsSize}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {pantsSizes.map((size) => {
                        const isSelected = selectedPantsSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedPantsSize(size)}
                            className={`min-w-[42px] px-2.5 py-1.5 text-xs font-sans font-bold tracking-wider transition-all rounded border ${
                              isSelected
                                ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F] shadow-sm scale-105'
                                : 'bg-[#FAF8F5] text-[#1F1F1F] border-[#E8E2D8] hover:border-[#B67355]'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer: Total Price & CTA Button (Always visible) */}
          <div className="bg-[#FAF8F5] border-t border-[#E8E2D8] p-4 sm:p-5 shrink-0 space-y-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            <div className="bg-[#EDE3CF]/60 border border-[#DCC9A6] p-3 sm:p-3.5 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-sans uppercase tracking-widest text-[#8E8A85] block font-semibold">
                  {isArabic ? 'إجمالي الطقم (قطعتين):' : 'Total Set Price (2 Items):'}
                </span>
                <span className="font-serif text-lg sm:text-xl font-bold text-[#1F1F1F]">
                  {totalPrice} EGP
                </span>
              </div>
              <div className="text-right text-[10px] sm:text-[11px] font-sans text-[#B67355] font-semibold space-y-0.5">
                <div>✓ {isArabic ? 'معاينة مجانية عند الاستلام' : 'Free Inspection on Delivery'}</div>
                <div className="text-[9px] sm:text-[10px] text-[#8E8A85]">✓ {isArabic ? 'استبدال مجاني خلال 14 يوماً' : '14-Day Free Exchange'}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSetToCart}
              disabled={isAdding}
              className="w-full bg-[#1F1F1F] text-[#DCC9A6] hover:bg-[#B67355] hover:text-white py-3.5 sm:py-4 px-6 text-xs sm:text-sm font-sans uppercase tracking-[0.2em] font-extrabold rounded-lg flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.99] disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isAdding
                  ? (isArabic ? 'جاري إضافة القطعتين...' : 'Adding Both Pieces...')
                  : (isArabic ? 'إضافة الطقم بالكامل إلى الحقيبة' : 'Add Full Set to Cart')}
              </span>
              <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
