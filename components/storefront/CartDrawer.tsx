'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    appliedDiscount,
    shippingFee,
    totalAmount,
    shippingSettings,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
  } = useCart();

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

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[#F6F3EE] shadow-2xl flex flex-col justify-between border-l border-[#E8E2D8]"
            >
              {/* Drawer Header */}
              <div className="p-6 bg-white border-b border-[#E8E2D8]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#B67355]" />
                    <h2 className="font-serif text-lg font-bold tracking-wider text-[#1F1F1F]">
                      YOUR SHOPPING BAG
                    </h2>
                    <span className="text-xs bg-[#EDE3CF] text-[#1F1F1F] px-2 py-0.5 rounded-full font-sans font-medium">
                      {itemCount}
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
                          🎉 You unlocked Free Delivery across Egypt!
                        </span>
                      ) : (
                        <span>
                          Add <strong>EGP {remainingForFreeShipping.toFixed(2)}</strong> for Free Shipping
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
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#EDE3CF] flex items-center justify-center mb-4 text-[#B67355]">
                      <ShoppingBag className="w-8 h-8 stroke-1" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#1F1F1F] mb-1">
                      Your bag is currently empty
                    </h3>
                    <p className="text-xs text-[#8E8A85] max-w-xs font-sans mb-6">
                      Explore our handcrafted pieces designed for your timeless elegance.
                    </p>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        router.push('/collections');
                      }}
                      className="bg-[#1F1F1F] text-[#DCC9A6] px-6 py-3 text-xs uppercase tracking-[0.2em] font-sans hover:bg-[#B67355] hover:text-white transition-colors"
                    >
                      Shop Collections
                    </button>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${item.selectedColor.name}-${item.selectedSize}-${idx}`}
                      className="flex gap-4 p-3.5 bg-white border border-[#E8E2D8] transition-all hover:border-[#DCC9A6]"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-20 h-24 bg-[#F6F3EE] shrink-0 overflow-hidden">
                        <Image
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-serif text-sm font-semibold text-[#1F1F1F] truncate">
                              {item.name}
                            </h4>
                            <button
                              onClick={() =>
                                removeFromCart(
                                  item.productId,
                                  item.selectedColor.name,
                                  item.selectedSize
                                )
                              }
                              className="text-[#8E8A85] hover:text-[#B67355] transition-colors p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Color & Size Specs */}
                          <div className="flex items-center gap-3 text-[11px] text-[#8E8A85] font-sans mt-1">
                            <span className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-[#DCC9A6]"
                                style={{ backgroundColor: item.selectedColor.hex }}
                              />
                              {item.selectedColor.name}
                            </span>
                            <span>•</span>
                            <span className="font-medium text-[#1F1F1F]">Size: {item.selectedSize}</span>
                          </div>
                        </div>

                        {/* Price & Quantity Controls */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E8E2D8]/40">
                          <div className="flex items-center border border-[#E8E2D8] bg-[#F6F3EE]">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.selectedColor.name,
                                  item.selectedSize,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 text-[#1F1F1F] hover:bg-[#E8E2D8] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-medium font-mono text-[#1F1F1F]">
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
                              className="p-1 text-[#1F1F1F] hover:bg-[#E8E2D8] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                              EGP {(item.price * item.quantity).toFixed(2)}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-[10px] text-[#8E8A85] line-through block font-mono">
                                EGP {(item.originalPrice * item.quantity).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {items.length > 0 && (
                <div className="p-6 bg-white border-t border-[#E8E2D8] space-y-4">
                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="flex justify-between text-[#8E8A85]">
                      <span>Subtotal</span>
                      <span className="text-[#1F1F1F] font-semibold">
                        EGP {subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Auto Discount line */}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 border border-emerald-200 rounded">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{appliedDiscount?.title || 'Discount'}</span>
                        </span>
                        <span className="font-serif">-EGP {discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#8E8A85]">
                      <span>Shipping</span>
                      <span className="text-[#1F1F1F] font-semibold">
                        {shippingFee === 0 ? (
                          <span className="text-[#B67355] uppercase font-bold">Free</span>
                        ) : (
                          `EGP ${shippingFee.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    <div className="border-t border-[#E8E2D8] pt-2 flex justify-between text-sm font-bold text-[#1F1F1F]">
                      <span className="font-serif">Estimated Total</span>
                      <span className="font-serif text-base text-[#B67355]">
                        EGP {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Guarantee Notice */}
                  <div className="flex items-center gap-2 text-[10px] text-[#8E8A85] bg-[#F6F3EE] p-2 border border-[#E8E2D8]">
                    <ShieldCheck className="w-4 h-4 text-[#B67355] shrink-0" />
                    <span>Cash on Delivery (COD) across Egypt. Inspect before payment.</span>
                  </div>

                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3.5 text-xs uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-md active:scale-[0.99]"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
