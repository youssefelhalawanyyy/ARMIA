'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowRight, ArrowLeft, Check, Plus, ExternalLink } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import ShopSetModal from './ShopSetModal';
import { INITIAL_PRODUCTS } from '@/lib/seedData';

interface ShopTheLookSectionProps {
  products?: Product[];
}

export default function ShopTheLookSection({ products = [] }: ShopTheLookSectionProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const { isArabic } = useLanguage();
  const { success } = useToast();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  // Resolve top & pants from products or seed
  const topProduct =
    products.find((p) => p.id === 'prod-1788716511841' || p.name.toUpperCase().includes('CHEVRON')) ||
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-1788716511841') ||
    INITIAL_PRODUCTS[0];

  const pantsProduct =
    products.find(
      (p) =>
        p.id === 'prod-relaxed-denim-pants' ||
        p.category === 'bottoms' ||
        p.name.toUpperCase().includes('PANTS') ||
        p.name.toUpperCase().includes('DENIM')
    ) ||
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-relaxed-denim-pants') ||
    INITIAL_PRODUCTS[1];

  const topSizes = topProduct.sizes && topProduct.sizes.length > 0 ? topProduct.sizes : ['M', 'L', 'XL', 'XXL'];
  const pantsSizes = pantsProduct.sizes && pantsProduct.sizes.length > 0 ? pantsProduct.sizes : ['S', 'M', 'L', 'XL'];

  const [selectedTopSize, setSelectedTopSize] = useState<string>(topSizes[0]);
  const [selectedPantsSize, setSelectedPantsSize] = useState<string>(pantsSizes[1] || pantsSizes[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const topPrice = topProduct.discountPrice || topProduct.price || 500;
  const pantsPrice = pantsProduct.discountPrice || pantsProduct.price || 380;
  const totalPrice = topPrice + pantsPrice;

  const topImage = topProduct.imageUrls?.[0] || '/images/hero-editorial.jpg';
  const pantsImage = pantsProduct.imageUrls?.[0] || '/images/pants-editorial.jpg';

  const handleAddBothToCart = () => {
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
      setIsCartOpen(true);
    }, 300);
  };

  return (
    <section className="py-14 sm:py-20 bg-[#F6F3EE] border-b border-[#E8E2D8] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EDE3CF] border border-[#DCC9A6] text-[#B67355] text-[11px] font-sans font-semibold tracking-[0.2em] uppercase rounded-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تشكيلة الأتليه المختارة • طقم قطعتين' : 'Curated Atelier Edit • 2-Piece Set'}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
            {isArabic ? 'تسوقي الإطلالة المتكاملة' : 'Shop The Signature Set'}
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#8E8A85] mt-2.5">
            {isArabic
              ? 'احصلي على الطقم الكامل بنقرة واحدة مع تحديد المقاسات المناسبة لكل قطعة'
              : 'Add both signature pieces to your cart together with your preferred sizes in one seamless step.'}
          </p>
        </div>

        {/* Products Grid & Set Action Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Piece 1: CHEVRON TOP */}
          <div className="lg:col-span-4 bg-white border border-[#E8E2D8] rounded-sm p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              {/* Product Image */}
              <div className="relative aspect-[3/4] w-full bg-[#FAF8F5] rounded-sm overflow-hidden border border-[#E8E2D8] mb-4 group">
                <Image
                  src={topImage}
                  alt={topProduct.name}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 bg-[#1F1F1F]/80 backdrop-blur-md text-[#DCC9A6] text-[10px] font-sans font-semibold uppercase tracking-widest px-2.5 py-1 rounded">
                  {isArabic ? 'القطعة 01' : 'Piece 01'}
                </span>
              </div>

              {/* Title & Category */}
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B67355] font-sans font-semibold block">
                {isArabic ? 'بلوزات وتوبات' : 'Tops & Blouses'}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1F1F1F] mt-1">
                {isArabic && topProduct.nameArabic ? topProduct.nameArabic : topProduct.name}
              </h3>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-lg font-bold text-[#B67355]">
                  EGP {topPrice.toFixed(2)}
                </span>
                {topProduct.discountPrice && (
                  <span className="font-sans text-xs text-[#8E8A85] line-through">
                    EGP {topProduct.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Size Selector for Top */}
            <div className="mt-6 pt-4 border-t border-[#E8E2D8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-sans font-semibold text-[#1F1F1F] uppercase tracking-wider">
                  {isArabic ? 'المقاس:' : 'Size:'} <span className="text-[#B67355]">{selectedTopSize}</span>
                </span>
                <Link
                  href={`/product/${topProduct.id}`}
                  className="text-[11px] font-sans text-[#8E8A85] hover:text-[#1F1F1F] inline-flex items-center gap-1 transition-colors"
                >
                  <span>{isArabic ? 'تفاصيل' : 'Details'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {topSizes.map((size) => {
                  const isSelected = selectedTopSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedTopSize(size)}
                      className={`min-w-[44px] px-3 py-1.5 text-xs font-sans font-semibold tracking-wider transition-all rounded-sm border ${
                        isSelected
                          ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F] shadow-sm'
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

          {/* Piece 2: RELAXED DENIM PANTS */}
          <div className="lg:col-span-4 bg-white border border-[#E8E2D8] rounded-sm p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              {/* Product Image */}
              <div className="relative aspect-[3/4] w-full bg-[#FAF8F5] rounded-sm overflow-hidden border border-[#E8E2D8] mb-4 group">
                <Image
                  src={pantsImage}
                  alt={pantsProduct.name}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 bg-[#1F1F1F]/80 backdrop-blur-md text-[#DCC9A6] text-[10px] font-sans font-semibold uppercase tracking-widest px-2.5 py-1 rounded">
                  {isArabic ? 'القطعة 02' : 'Piece 02'}
                </span>
              </div>

              {/* Title & Category */}
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B67355] font-sans font-semibold block">
                {isArabic ? 'بناطيل وتنانير' : 'Bottoms & Trousers'}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1F1F1F] mt-1">
                {isArabic && pantsProduct.nameArabic ? pantsProduct.nameArabic : pantsProduct.name}
              </h3>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-lg font-bold text-[#B67355]">
                  EGP {pantsPrice.toFixed(2)}
                </span>
                {pantsProduct.discountPrice && (
                  <span className="font-sans text-xs text-[#8E8A85] line-through">
                    EGP {pantsProduct.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Size Selector for Pants */}
            <div className="mt-6 pt-4 border-t border-[#E8E2D8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-sans font-semibold text-[#1F1F1F] uppercase tracking-wider">
                  {isArabic ? 'المقاس:' : 'Size:'} <span className="text-[#B67355]">{selectedPantsSize}</span>
                </span>
                <Link
                  href={`/product/${pantsProduct.id}`}
                  className="text-[11px] font-sans text-[#8E8A85] hover:text-[#1F1F1F] inline-flex items-center gap-1 transition-colors"
                >
                  <span>{isArabic ? 'تفاصيل' : 'Details'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {pantsSizes.map((size) => {
                  const isSelected = selectedPantsSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedPantsSize(size)}
                      className={`min-w-[44px] px-3 py-1.5 text-xs font-sans font-semibold tracking-wider transition-all rounded-sm border ${
                        isSelected
                          ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F] shadow-sm'
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

          {/* Set Action & Summary Card (4 cols) */}
          <div className="lg:col-span-4 bg-[#1F1F1F] text-white border border-[#DCC9A6]/40 rounded-sm p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B67355]/30 border border-[#DCC9A6]/40 text-[#DCC9A6] text-[10px] font-sans font-semibold tracking-[0.2em] uppercase rounded-sm mb-4">
                <Sparkles className="w-3 h-3" />
                <span>{isArabic ? 'وفر الوقت والتنسيق' : 'Curated Look Set'}</span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#FAF8F5] leading-snug">
                {isArabic ? 'طقم التوب والبنطال الكامل' : 'Complete 2-Piece Signature Set'}
              </h3>

              <p className="font-sans text-xs text-[#A8A49E] mt-3 leading-relaxed">
                {isArabic
                  ? 'تم تنسيق هذه الإطلالة بأيدي خبراء أتليه أرميا لتمنحكِ مظهراً راقياً ومريحاً بأعلى معايير الحياكة المصرية الفاخرة.'
                  : 'Artfully paired by ARMIA Atelier stylists for effortless modern elegance in premium natural textures.'}
              </p>

              {/* Set breakdown */}
              <div className="mt-6 space-y-2.5 pt-6 border-t border-[#DCC9A6]/20 text-xs font-sans">
                <div className="flex justify-between items-center text-[#FAF8F5]">
                  <span>1x {topProduct.name} ({selectedTopSize})</span>
                  <span>{topPrice} EGP</span>
                </div>
                <div className="flex justify-between items-center text-[#FAF8F5]">
                  <span>1x {pantsProduct.name} ({selectedPantsSize})</span>
                  <span>{pantsPrice} EGP</span>
                </div>
                <div className="pt-3 border-t border-[#DCC9A6]/30 flex justify-between items-baseline">
                  <span className="font-serif text-sm font-semibold text-[#DCC9A6] uppercase tracking-wider">
                    {isArabic ? 'إجمالي الطقم:' : 'Set Total:'}
                  </span>
                  <span className="font-serif text-2xl font-bold text-gold-gradient">
                    {totalPrice} EGP
                  </span>
                </div>
              </div>

              {/* Micro-perks */}
              <div className="mt-6 space-y-2 text-[11px] font-sans text-[#8E8A85]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#DCC9A6] shrink-0" />
                  <span>{isArabic ? 'معاينة وفحص مجاني قبل الدفع' : 'Inspect before payment'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#DCC9A6] shrink-0" />
                  <span>{isArabic ? 'استبدال مجاني خلال 14 يوماً' : '14-Day Free Exchange'}</span>
                </div>
              </div>
            </div>

            {/* Add Set Button */}
            <div className="mt-8 pt-6 border-t border-[#DCC9A6]/20">
              <button
                type="button"
                onClick={handleAddBothToCart}
                disabled={isAdding}
                className="w-full bg-[#B67355] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] text-white py-4 px-6 text-xs font-sans uppercase tracking-[0.2em] font-bold rounded flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 group"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isAdding
                    ? (isArabic ? 'جاري الإضافة...' : 'Adding Set...')
                    : (isArabic ? 'تسوق الطقم (إضافة القطعتين)' : 'Shop Set (Add Both)')}
                </span>
                <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Reusable Modal for Custom Sizing */}
      <ShopSetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topProduct={topProduct}
        pantsProduct={pantsProduct}
      />
    </section>
  );
}
