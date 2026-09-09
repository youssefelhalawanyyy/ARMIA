'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Star,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product } from '@/types';
import { getProducts } from '@/lib/productService';

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    appliedDiscount,
    totalAmount,
    shippingFee,
    shippingSettings,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const [featuredUpsell, setFeaturedUpsell] = useState<Product[]>([]);

  // Body scroll lock while drawer is open
  useEffect(() => {
    if (isCartOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCartOpen]);

  useEffect(() => {
    async function loadUpsell() {
      try {
        const all = await getProducts('all');
        const availableFeatured = all.filter(
          (p) =>
            p.featured &&
            (p.stockQuantity ?? 0) > 0 &&
            !items.some((it) => it.productId === p.id)
        );
        setFeaturedUpsell(availableFeatured);
      } catch (err) {
        console.warn('Upsell fetch notice:', err);
      }
    }
    if (isCartOpen) {
      loadUpsell();
    }
  }, [isCartOpen, items]);

  const { t, isArabic } = useLanguage();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  const freeShippingThreshold = shippingSettings?.freeShippingThreshold || 1500;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Wrapper strictly constrained to 100dvh */}
          <div
            className={`fixed inset-0 pointer-events-none flex ${
              isArabic ? 'justify-start' : 'justify-end'
            }`}
          >
            <motion.div
              initial={{ x: isArabic ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className={`pointer-events-auto relative w-full sm:max-w-md md:max-w-lg h-[100dvh] max-h-[100dvh] bg-[#F6F3EE] shadow-2xl flex flex-col ${
                isArabic ? 'border-r' : 'border-l'
              } border-[#E8E2D8] overflow-hidden`}
            >
              {/* Drawer Header (Fixed at Top) */}
              <div className="shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 bg-white border-b border-[#E8E2D8] z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#B67355]" />
                    <h2 className="font-serif text-base sm:text-lg font-bold tracking-wider text-[#1F1F1F]">
                      {t.cart.title}
                    </h2>
                    <span className="text-[11px] sm:text-xs bg-[#EDE3CF] text-[#1F1F1F] px-2 py-0.5 rounded-full font-sans font-medium">
                      {itemCount} {t.cart.itemsCount}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#8E8A85] hover:text-[#1F1F1F] hover:bg-[#F6F3EE] transition-colors active:scale-95"
                    aria-label="Close cart"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Free Shipping Progress Indicator */}
                <div className="mt-3 pt-2.5 border-t border-[#E8E2D8]/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans gap-2">
                    <span className="flex items-center gap-1.5 text-[#1F1F1F] font-medium truncate">
                      <Truck className="w-3.5 h-3.5 text-[#B67355] shrink-0" />
                      {remainingForFreeShipping === 0 ? (
                        <span className="text-emerald-700 font-semibold truncate">
                          {isArabic
                            ? '🎉 مبروك! حصلتِ على شحن مجاني لكافة أنحاء مصر!'
                            : '🎉 You unlocked Free Delivery across Egypt!'}
                        </span>
                      ) : (
                        <span className="truncate">
                          {isArabic ? (
                            <>
                              أضيفي بقيمة{' '}
                              <strong className="text-[#B67355]">
                                {remainingForFreeShipping.toFixed(2)} ج.م
                              </strong>{' '}
                              للشحن المجاني
                            </>
                          ) : (
                            <>
                              Add{' '}
                              <strong className="text-[#B67355]">
                                EGP {remainingForFreeShipping.toFixed(2)}
                              </strong>{' '}
                              for Free Shipping
                            </>
                          )}
                        </span>
                      )}
                    </span>
                    <span className="text-[#8E8A85] text-[11px] font-mono shrink-0">
                      {Math.round(progressToFreeShipping)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E8E2D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#DCC9A6] to-[#B67355] transition-all duration-500 rounded-full"
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Scrollable Items List (Strictly Bounded Between Header and Sticky Footer) */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-[#EDE3CF] flex items-center justify-center mx-auto text-[#B67355]">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                      {t.cart.emptyTitle}
                    </h3>
                    <p className="text-xs text-[#8E8A85] font-sans max-w-xs mx-auto">
                      {t.cart.emptySubtitle}
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="bg-[#1F1F1F] text-[#DCC9A6] px-6 py-2.5 text-xs font-sans uppercase tracking-wider hover:bg-[#B67355] hover:text-white transition-colors mt-2"
                    >
                      {t.cart.explorePieces}
                    </button>
                  </div>
                ) : (
                  items.map((item, index) => {
                    const colorName = item.selectedColor?.name || 'Standard';
                    const colorHex = item.selectedColor?.hex || '#1F1F1F';
                    const itemSize = item.selectedSize || 'Standard';

                    return (
                      <div
                        key={`${item.productId}-${colorName}-${itemSize}-${index}`}
                        className="flex gap-3 sm:gap-3.5 bg-white p-3 sm:p-3.5 border border-[#E8E2D8] shadow-xs rounded-sm relative group hover:border-[#DCC9A6] transition-colors"
                      >
                        {/* Product Thumbnail */}
                        <div className="relative w-18 sm:w-20 aspect-[3/4] bg-[#F6F3EE] shrink-0 overflow-hidden rounded-xs border border-[#E8E2D8]/60">
                          <Image
                            src={
                              item.imageUrl ||
                              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'
                            }
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 72px, 80px"
                            className="object-cover"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-serif text-xs sm:text-sm font-semibold text-[#1F1F1F] truncate leading-snug">
                                {item.name}
                              </h4>
                              <button
                                onClick={() =>
                                  removeFromCart(
                                    item.productId,
                                    colorName,
                                    itemSize
                                  )
                                }
                                className="text-neutral-400 hover:text-red-600 transition-colors p-1 -mr-1 -mt-1 rounded hover:bg-red-50"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8E8A85] font-sans mt-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                  style={{ backgroundColor: colorHex }}
                                />
                                <span className="truncate max-w-[90px]">{colorName}</span>
                              </div>
                              <span>•</span>
                              <span className="bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.2 rounded-xs text-[10px] font-medium text-[#1F1F1F]">
                                {itemSize}
                              </span>
                            </div>
                          </div>

                          {/* Price & Quantity Controls */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#E8E2D8]/60">
                            <span className="font-serif text-xs sm:text-sm font-bold text-[#1F1F1F]">
                              EGP {(item.price * item.quantity).toFixed(2)}
                            </span>

                            <div className="flex items-center border border-[#E8E2D8] bg-[#FAF7F2] rounded-xs overflow-hidden">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    colorName,
                                    itemSize,
                                    item.quantity - 1
                                  )
                                }
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#1F1F1F] hover:bg-[#E8E2D8] active:bg-[#DCC9A6] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 min-w-[24px] text-center text-xs font-mono font-bold text-[#1F1F1F]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    colorName,
                                    itemSize,
                                    item.quantity + 1
                                  )
                                }
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#1F1F1F] hover:bg-[#E8E2D8] active:bg-[#DCC9A6] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Featured Products Upsell in Cart */}
                {items.length > 0 &&
                  featuredUpsell.filter((p) => !items.some((i) => i.productId === p.id)).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-[#E8E2D8]">
                      <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-sans font-semibold text-[#B67355] uppercase tracking-wider">
                        <Star className="w-3.5 h-3.5 fill-[#DCC9A6] text-[#B67355]" />
                        <span>
                          {isArabic ? 'مختارات مميزة لإكمال إطلالتك' : 'Signature Pieces You May Like'}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {featuredUpsell
                          .filter((p) => !items.some((i) => i.productId === p.id))
                          .slice(0, 2)
                          .map((up) => (
                            <div
                              key={up.id}
                              className="bg-white border border-[#E8E2D8] p-2.5 flex items-center justify-between gap-3 rounded shadow-xs hover:border-[#DCC9A6] transition-colors"
                            >
                              <div className="relative w-12 h-14 bg-[#EDE8E0] shrink-0 overflow-hidden rounded">
                                <Image
                                  src={
                                    up.imageUrls?.[0] ||
                                    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900'
                                  }
                                  alt={up.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <h4 className="font-serif text-xs font-bold text-[#1F1F1F] truncate">
                                  {isArabic && up.nameArabic ? up.nameArabic : up.name}
                                </h4>
                                <span className="font-sans text-[11px] text-[#B67355] font-semibold block mt-0.5">
                                  EGP{' '}
                                  {up.discountPrice
                                    ? up.discountPrice.toFixed(2)
                                    : up.price.toFixed(2)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  addToCart(
                                    {
                                      productId: up.id,
                                      name: up.name,
                                      price: up.discountPrice || up.price,
                                      quantity: 1,
                                      selectedColor:
                                        up.colors?.[0] || { name: 'Standard', hex: '#1F1F1F' },
                                      selectedSize: up.sizes?.[0] || 'Standard',
                                      imageUrl: up.imageUrls?.[0] || '',
                                      category: up.category,
                                    },
                                    false
                                  );
                                }}
                                className="px-3 py-1.5 bg-[#1F1F1F] text-[#DCC9A6] text-[10px] uppercase font-bold tracking-wider hover:bg-[#B67355] hover:text-white transition-colors shrink-0 rounded cursor-pointer active:scale-95"
                              >
                                {isArabic ? '+ إضافة' : '+ Add'}
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Drawer Footer & Checkout Action (Pinned to Bottom with Safe-Area Padding) */}
              {items.length > 0 && (
                <div className="shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 bg-white border-t border-[#E8E2D8] pb-[max(env(safe-area-inset-bottom,0px),1rem)] space-y-3 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                  {/* Applied Discount Notification */}
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="bg-[#FAF7F2] border border-[#DCC9A6] p-2 rounded flex items-center justify-between text-xs text-[#B67355]">
                      <div className="flex items-center gap-1.5 font-medium truncate">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {isArabic && appliedDiscount.titleArabic
                            ? appliedDiscount.titleArabic
                            : appliedDiscount.title}
                        </span>
                      </div>
                      <span className="font-bold font-mono shrink-0">
                        -EGP {discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Summary Breakdown */}
                  <div className="space-y-1.5 text-xs font-sans text-[#8E8A85]">
                    {/* Delivery Price */}
                    <div className="flex justify-between items-center text-xs pb-1.5 border-b border-[#E8E2D8]/60">
                      <span className="flex items-center gap-1.5 text-[#1F1F1F] font-medium">
                        <Truck className="w-3.5 h-3.5 text-[#B67355]" />
                        <span>
                          {t.cart.deliveryPrice ||
                            (isArabic ? 'سعر التوصيل' : 'Delivery Price')}
                        </span>
                        {shippingFee === 0 && (
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                            {isArabic ? 'شحن مجاني' : 'Free Delivery'}
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-[#1F1F1F] font-semibold">
                        {shippingFee === 0 ? (
                          <span className="text-emerald-600 font-bold uppercase tracking-wider">
                            {isArabic ? 'مجاناً' : 'FREE'}
                          </span>
                        ) : (
                          `EGP ${shippingFee.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>{t.cart.subtotal}</span>
                      <span className="font-mono text-[#1F1F1F] font-semibold">
                        EGP {subtotal.toFixed(2)}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#B67355] font-semibold">
                        <span>{t.cart.autoDiscount}</span>
                        <span className="font-mono">-EGP {discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm font-bold text-[#1F1F1F] pt-1.5 border-t border-[#E8E2D8]">
                      <span>{t.cart.estimatedTotal}</span>
                      <span className="font-serif text-base text-[#B67355]">
                        EGP {totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#8E8A85] text-center pt-0.5">
                      {t.cart.shippingNote}
                    </p>
                  </div>

                  {/* Checkout CTA */}
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3.5 sm:py-4 px-6 text-xs sm:text-sm uppercase font-sans font-bold tracking-[0.2em] hover:bg-[#B67355] hover:text-white transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] rounded-xs"
                  >
                    <span>{t.cart.checkoutBtn}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8E8A85] font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B67355]" />
                    <span>{t.product.guarantees.cod}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
