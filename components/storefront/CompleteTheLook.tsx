'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Plus, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product, ProductColor } from '@/types';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface CompleteTheLookProps {
  currentProduct: Product;
  allProducts: Product[];
}

export default function CompleteTheLook({ currentProduct, allProducts }: CompleteTheLookProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const { isArabic } = useLanguage();
  const { success } = useToast();

  // Prioritize FEATURED and IN-STOCK products for the curated upselling bundle
  const pairedProduct =
    allProducts.find(
      (p) => p.featured && p.id !== currentProduct.id && (p.stockQuantity ?? 0) > 0
    ) ||
    allProducts.find(
      (p) =>
        p.id !== currentProduct.id &&
        (p.stockQuantity ?? 0) > 0 &&
        (p.category !== currentProduct.category || p.category === 'sets' || p.category === 'outerwear')
    ) ||
    allProducts.find(
      (p) => p.id !== currentProduct.id && (p.stockQuantity ?? 0) > 0
    );

  // States for main product selection
  const [mainColor, setMainColor] = useState<ProductColor>(
    currentProduct.colors?.[0] || { name: 'Standard', hex: '#DCC9A6' }
  );
  const [mainSize, setMainSize] = useState<string>(
    currentProduct.sizes?.[0] || 'M'
  );

  // States for paired product selection
  const [pairedColor, setPairedColor] = useState<ProductColor>(
    pairedProduct?.colors?.[0] || { name: 'Standard', hex: '#1F1F1F' }
  );
  const [pairedSize, setPairedSize] = useState<string>(
    pairedProduct?.sizes?.[0] || 'M'
  );

  const [addingBundle, setAddingBundle] = useState(false);

  if (!pairedProduct) return null;

  const originalTotal = currentProduct.price + pairedProduct.price;
  const bundleDiscountRate = 0.10; // 10% Bundle Discount
  const bundleSavings = originalTotal * bundleDiscountRate;
  const bundleTotal = originalTotal - bundleSavings;

  const handleAddBundleToCart = () => {
    setAddingBundle(true);

    // 1. Add main product
    addToCart({
      productId: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      quantity: 1,
      selectedColor: mainColor,
      selectedSize: mainSize,
      imageUrl: currentProduct.imageUrls?.[0] || '',
      category: currentProduct.category,
    }, false);

    // 2. Add paired product & open cart
    addToCart({
      productId: pairedProduct.id,
      name: pairedProduct.name,
      price: pairedProduct.price,
      quantity: 1,
      selectedColor: pairedColor,
      selectedSize: pairedSize,
      imageUrl: pairedProduct.imageUrls?.[0] || '',
      category: pairedProduct.category,
    }, true);

    success(
      isArabic
        ? 'تمت إضافة الإطلالة بالكامل (قطعتين) إلى حقيبة التسوق!'
        : 'Complete outfit look (2 items) added to your cart!',
      isArabic ? 'إطلالة متكاملة' : 'Outfit Added'
    );

    setTimeout(() => {
      setAddingBundle(false);
      setIsCartOpen(true);
    }, 300);
  };

  return (
    <section className="mt-16 pt-12 border-t border-[#E8E2D8] font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#DCC9A6] fill-current" />
            <span>{isArabic ? 'تنسيق الأتليه المقترح' : 'Atelier Curated Styling'}</span>
          </span>
          <h3 className="font-serif text-2xl font-bold text-[#1F1F1F] mt-1">
            {isArabic ? 'نسّقي إطلالتكِ المتكاملة' : 'Complete The Look'}
          </h3>
        </div>

        <span className="inline-flex items-center gap-1 bg-[#FAF7F2] text-[#B67355] border border-[#DCC9A6] text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto shadow-sm">
          <span>{isArabic ? 'وفّري 10% عند شراء الإطلالة معاً' : 'Bundle & Save 10% on Look'}</span>
        </span>
      </div>

      <div className="bg-[#FAF7F2] border border-[#E8E2D8] p-5 sm:p-7 rounded-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Piece 1: Current Product */}
          <div className="lg:col-span-4 flex items-center gap-4 bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-sm">
            <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-[#F6F3EE] rounded-lg overflow-hidden shrink-0">
              {currentProduct.imageUrls?.[0] && (
                <Image
                  src={currentProduct.imageUrls[0]}
                  alt={currentProduct.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-[#B67355] font-bold">
                {isArabic ? 'القطعة الأساسية' : 'Main Piece'}
              </span>
              <h4 className="font-serif font-bold text-sm text-[#1F1F1F] truncate">
                {isArabic && currentProduct.nameArabic ? currentProduct.nameArabic : currentProduct.name}
              </h4>
              <p className="font-serif font-bold text-[#1F1F1F] text-xs">
                EGP {currentProduct.price.toFixed(2)}
              </p>

              {/* Main Product Size Selector */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#8E8A85]">{isArabic ? 'المقاس:' : 'Size:'}</span>
                <select
                  value={mainSize}
                  onChange={(e) => setMainSize(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#E8E2D8] text-xs px-2 py-0.5 rounded font-bold text-[#1F1F1F] focus:outline-none"
                >
                  {currentProduct.sizes?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Plus Divider */}
          <div className="lg:col-span-1 flex justify-center text-[#B67355]">
            <div className="w-8 h-8 rounded-full bg-white border border-[#DCC9A6] flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {/* Piece 2: Recommended Pairing Product */}
          <div className="lg:col-span-4 flex items-center gap-4 bg-white p-4 rounded-xl border border-[#E8E2D8] shadow-sm">
            <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-[#F6F3EE] rounded-lg overflow-hidden shrink-0">
              {pairedProduct.imageUrls?.[0] && (
                <Image
                  src={pairedProduct.imageUrls[0]}
                  alt={pairedProduct.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-emerald-700 font-bold">
                {isArabic ? 'تنسيق الأسلوب' : 'Matching Style'}
              </span>
              <h4 className="font-serif font-bold text-sm text-[#1F1F1F] truncate">
                {isArabic && pairedProduct.nameArabic ? pairedProduct.nameArabic : pairedProduct.name}
              </h4>
              <p className="font-serif font-bold text-[#1F1F1F] text-xs">
                EGP {pairedProduct.price.toFixed(2)}
              </p>

              {/* Paired Product Size Selector */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#8E8A85]">{isArabic ? 'المقاس:' : 'Size:'}</span>
                <select
                  value={pairedSize}
                  onChange={(e) => setPairedSize(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#E8E2D8] text-xs px-2 py-0.5 rounded font-bold text-[#1F1F1F] focus:outline-none"
                >
                  {pairedProduct.sizes?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & 1-Click Add Action */}
          <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-[#DCC9A6] flex flex-col justify-between space-y-3 text-center shadow-sm">
            <div>
              <span className="text-[10px] text-[#8E8A85] block uppercase tracking-wider">
                {isArabic ? 'إجمالي القطعتين معاً' : 'Bundle Price (2 Pieces)'}
              </span>
              <div className="flex items-baseline justify-center gap-2 mt-0.5">
                <span className="font-serif text-lg font-bold text-[#1F1F1F]">
                  EGP {bundleTotal.toFixed(2)}
                </span>
                <span className="text-xs text-[#8E8A85] line-through">
                  EGP {originalTotal.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                {isArabic ? `وفّري EGP ${bundleSavings.toFixed(2)}` : `Save EGP ${bundleSavings.toFixed(2)} (10% OFF)`}
              </span>
            </div>

            <button
              type="button"
              disabled={addingBundle}
              onClick={handleAddBundleToCart}
              className="w-full bg-[#1F1F1F] hover:bg-[#B67355] text-white py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#DCC9A6]" />
              <span>{isArabic ? 'إضافة الإطلالة بالكامل' : 'Add Complete Look'}</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
