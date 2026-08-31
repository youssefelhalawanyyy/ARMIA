'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    appliedDiscount,
    totalAmount,
    shippingSettings,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const { t, isArabic, direction } = useLanguage();
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

          <div className={`fixed inset-y-0 ${isArabic ? 'left-0 pr-10' : 'right-0 pl-10'} max-w-full flex`}>
            <motion.div
              initial={{ x: isArabic ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[#F6F3EE] shadow-2xl flex flex-col justify-between border-l border-[#E8E2D8]"
            >
              {/* Drawer Header */}
              <div className="p-6 bg-white border-b border-[#E8E2D8]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#B67355]" />
                    <h2 className="font-serif text-lg font-bold tracking-wider text-[#1F1F1F]">
                      {t.cart.title}
                    </h2>
                    <span className="text-xs bg-[#EDE3CF] text-[#1F1F1F] px-2 py-0.5 rounded-full font-sans font-medium">
                      {itemCount} {t.cart.itemsCount}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 text-[#8E8A85] hover:text-[#1F1F1F] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Free Shipping Progress Indicator */}
                <div className="mt-4 pt-3 border-t border-[#E8E2D8]/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="flex items-center gap-1.5 text-[#1F1F1F] font-medium">
                      <Truck className="w-3.5 h-3.5 text-[#B67355]" />
                      {remainingForFreeShipping === 0 ? (
                        <span className="text-emerald-700 font-semibold">
                          {isArabic ? '🎉 مبروك! حصلتِ على شحن مجاني لكافة محافظات مصر!' : '🎉 You unlocked Free Delivery across Egypt!'}
                        </span>
                      ) : (
                        <span>
                          {isArabic ? (
                            <>أضيفي بقيمة <strong>{remainingForFreeShipping.toFixed(2)} ج.م</strong> للحصول على شحن مجاني</>
                          ) : (
                            <>Add <strong>EGP {remainingForFreeShipping.toFixed(2)}</strong> for Free Shipping</>
                          )}
                        </span>
                      )}
                    </span>
                    <span className="text-[#8E8A85] text-[11px] font-mono">
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

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  items.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.selectedColor.name}-${item.selectedSize}-${index}`}
                      className="flex gap-4 bg-white p-3.5 border border-[#E8E2D8] shadow-sm relative group"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-20 aspect-[3/4] bg-[#F6F3EE] shrink-0 overflow-hidden">
                        <Image
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif text-sm font-semibold text-[#1F1F1F] truncate pr-4">
                              {item.name}
                            </h4>
                            <button
                              onClick={() =>
                                removeFromCart(item.productId, item.selectedColor.name, item.selectedSize)
                              }
                              className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#8E8A85] font-sans mt-1">
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/20"
                                style={{ backgroundColor: item.selectedColor.hex }}
                              />
                              <span>{item.selectedColor.name}</span>
                            </div>
                            <span>•</span>
                            <span>{t.product.selectSize}: {item.selectedSize}</span>
                          </div>
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E8E2D8]/50">
                          <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                            EGP {(item.price * item.quantity).toFixed(2)}
                          </span>

                          <div className="flex items-center border border-[#E8E2D8] bg-white">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.selectedColor.name,
                                  item.selectedSize,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 text-[#1F1F1F] hover:bg-[#F6F3EE] transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-mono font-bold text-[#1F1F1F]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.selectedColor.name,
                                  item.selectedSize,
                                  item.quantity + 1
                                )
                              }
                              className="p-1 text-[#1F1F1F] hover:bg-[#F6F3EE] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer & Checkout Action */}
              {items.length > 0 && (
                <div className="p-6 bg-white border-t border-[#E8E2D8] space-y-4">
                  {/* Applied Discount Notification */}
                  {appliedDiscount && discountAmount > 0 && (
                    <div className="bg-[#FAF7F2] border border-[#DCC9A6] p-2.5 rounded flex items-center justify-between text-xs text-[#B67355]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isArabic && appliedDiscount.titleArabic
                            ? appliedDiscount.titleArabic
                            : appliedDiscount.title}
                        </span>
                      </div>
                      <span className="font-bold font-mono">-EGP {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Summary Breakdown */}
                  <div className="space-y-1.5 text-xs font-sans text-[#8E8A85]">
                    <div className="flex justify-between">
                      <span>{t.cart.subtotal}</span>
                      <span className="font-mono text-[#1F1F1F]">EGP {subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[#B67355] font-semibold">
                        <span>{t.cart.autoDiscount}</span>
                        <span className="font-mono">-EGP {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-[#1F1F1F] pt-2 border-t border-[#E8E2D8]">
                      <span>{t.cart.estimatedTotal}</span>
                      <span className="font-serif text-base text-[#B67355]">
                        EGP {totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8E8A85] text-center pt-1">
                      {t.cart.shippingNote}
                    </p>
                  </div>

                  {/* Checkout CTA */}
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3.5 px-6 text-xs uppercase font-sans font-bold tracking-[0.2em] hover:bg-[#B67355] hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.99]"
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
