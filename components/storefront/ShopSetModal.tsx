'use client';

import React, { useState } from 'react';
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
  const { addToCart, setIsCartOpen } = useCart();
  const { isArabic } = useLanguage();
  const { success } = useToast();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const topSizes = topProduct.sizes && topProduct.sizes.length > 0 ? topProduct.sizes : ['M', 'L', 'XL', 'XXL'];
  const pantsSizes = pantsProduct.sizes && pantsProduct.sizes.length > 0 ? pantsProduct.sizes : ['S', 'M', 'L', 'XL'];

  const [selectedTopSize, setSelectedTopSize] = useState<string>(topSizes[0]);
  const [selectedPantsSize, setSelectedPantsSize] = useState<string>(pantsSizes[1] || pantsSizes[0]);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const topPrice = topProduct.discountPrice || topProduct.price || 500;
  const pantsPrice = pantsProduct.discountPrice || pantsProduct.price || 380;
  const totalPrice = topPrice + pantsPrice;

  const topImage = topProduct.imageUrls?.[0] || '/images/hero-editorial.jpg';
  const pantsImage = pantsProduct.imageUrls?.[0] || '/images/pants-editorial.jpg';

  const handleAddSetToCart = () => {
    setIsAdding(true);

    // 1. Add Top
    addToCart(
      {
        productId: topProduct.id,
        name: topProduct.name,
        price: topPrice,
        originalPrice: topProduct.price || 500,
        quantity: 1,
        selectedColor: topProduct.colors?.[0] || { name: 'Oatmeal Beige', hex: '#DCC9A6' },
        selectedSize: selectedTopSize,
        imageUrl: topImage,
        category: topProduct.category || 'tops',
      },
      false
    );

    // 2. Add Pants & open cart
    addToCart(
      {
        productId: pantsProduct.id,
        name: pantsProduct.name,
        price: pantsPrice,
        originalPrice: pantsProduct.price || 450,
        quantity: 1,
        selectedColor: pantsProduct.colors?.[0] || { name: 'Light Wash Denim', hex: '#87CEEB' },
        selectedSize: selectedPantsSize,
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

    setTimeout(() => {
      setIsAdding(false);
      onClose();
      setIsCartOpen(true);
    }, 300);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative bg-[#FAF8F5] border border-[#DCC9A6] w-full max-w-xl shadow-2xl rounded-sm overflow-hidden z-10 my-auto"
        >
          {/* Header */}
          <div className="bg-[#1F1F1F] text-white p-5 flex items-center justify-between border-b border-[#DCC9A6]/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#B67355] text-white rounded">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#DCC9A6] uppercase tracking-[0.25em] font-sans font-semibold block">
                  {isArabic ? 'إطلالة متكاملة' : 'Curated Atelier Set'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#FAF8F5]">
                  {isArabic ? 'اختاري مقاسات الطقم' : 'Select Sizes for the Set'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-[#8E8A85] hover:text-white p-1 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Two Products Size Selection */}
          <div className="p-6 space-y-6">
            
            {/* Piece 1: Chevron Top */}
            <div className="bg-white border border-[#E8E2D8] rounded p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-20 bg-[#F6F3EE] rounded overflow-hidden shrink-0 border border-[#E8E2D8]">
                  <Image
                    src={topImage}
                    alt={topProduct.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-[#B67355] font-sans font-semibold">
                    {isArabic ? 'القطعة الأولى • توب' : 'Piece 01 • Top'}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#1F1F1F] truncate">
                    {isArabic && topProduct.nameArabic ? topProduct.nameArabic : topProduct.name}
                  </h4>
                  <p className="font-serif text-sm font-semibold text-[#B67355] mt-0.5">
                    {topPrice} EGP
                  </p>
                </div>
              </div>

              {/* Size Selector for Top */}
              <div className="mt-3.5 pt-3 border-t border-[#E8E2D8]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    {isArabic ? 'مقاس التوب:' : 'Select Top Size:'}
                  </label>
                  <span className="text-xs font-sans text-[#B67355] font-bold">
                    {selectedTopSize}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topSizes.map((size) => {
                    const isSelected = selectedTopSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedTopSize(size)}
                        className={`min-w-[48px] px-3 py-2 text-xs font-sans font-semibold tracking-wider transition-all rounded-sm border ${
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

            {/* Piece 2: Relaxed Denim Pants */}
            <div className="bg-white border border-[#E8E2D8] rounded p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-20 bg-[#F6F3EE] rounded overflow-hidden shrink-0 border border-[#E8E2D8]">
                  <Image
                    src={pantsImage}
                    alt={pantsProduct.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-[#B67355] font-sans font-semibold">
                    {isArabic ? 'القطعة الثانية • بنطال' : 'Piece 02 • Pants'}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#1F1F1F] truncate">
                    {isArabic && pantsProduct.nameArabic ? pantsProduct.nameArabic : pantsProduct.name}
                  </h4>
                  <p className="font-serif text-sm font-semibold text-[#B67355] mt-0.5">
                    {pantsPrice} EGP
                  </p>
                </div>
              </div>

              {/* Size Selector for Pants */}
              <div className="mt-3.5 pt-3 border-t border-[#E8E2D8]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-sans font-semibold text-[#1F1F1F] uppercase tracking-wider">
                    {isArabic ? 'مقاس البنطال:' : 'Select Pants Size:'}
                  </label>
                  <span className="text-xs font-sans text-[#B67355] font-bold">
                    {selectedPantsSize}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pantsSizes.map((size) => {
                    const isSelected = selectedPantsSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedPantsSize(size)}
                        className={`min-w-[48px] px-3 py-2 text-xs font-sans font-semibold tracking-wider transition-all rounded-sm border ${
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

            {/* Set Summary & Total */}
            <div className="bg-[#EDE3CF]/50 border border-[#DCC9A6] p-4 rounded flex items-center justify-between">
              <div>
                <span className="text-[11px] font-sans uppercase tracking-widest text-[#8E8A85] block">
                  {isArabic ? 'إجمالي الطقم (قطعتين):' : 'Total Set Price (2 Items):'}
                </span>
                <span className="font-serif text-xl font-bold text-[#1F1F1F]">
                  {totalPrice} EGP
                </span>
              </div>
              <div className="text-right text-[11px] font-sans text-[#B67355]">
                <span>✓ {isArabic ? 'معاينة مجانية عند الاستلام' : 'Free Inspection on Delivery'}</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleAddSetToCart}
              disabled={isAdding}
              className="w-full bg-[#1F1F1F] text-[#DCC9A6] hover:bg-[#B67355] hover:text-white py-4 px-6 text-xs font-sans uppercase tracking-[0.25em] font-bold rounded flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isAdding
                  ? (isArabic ? 'جاري الإضافة...' : 'Adding Both Pieces...')
                  : (isArabic ? 'إضافة الطقم بالكامل إلى الحقيبة' : 'Add Full Set to Cart')}
              </span>
              <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
