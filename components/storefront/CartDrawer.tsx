'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CartDrawer() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { user } = useAuth();

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      // Prompt auth modal or go straight to checkout with checkout guard
      router.push('/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const freeShippingThreshold = 1500;
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-screen max-w-md bg-[#F6F3EE] flex flex-col shadow-2xl border-l border-[#E8E2D8]"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E8E2D8] bg-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-[#B67355]" />
                  <h2 className="font-serif text-xl font-bold tracking-wide text-[#1F1F1F]">
                    Shopping Bag
                  </h2>
                  <span className="text-xs bg-[#F6F3EE] text-[#1F1F1F] font-sans font-semibold px-2 py-0.5 border border-[#E8E2D8]">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-[#8E8A85] hover:text-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Bar */}
              <div className="bg-[#EDE3CF]/50 px-6 py-3 border-b border-[#E8E2D8] text-xs font-sans">
                {subtotal >= freeShippingThreshold ? (
                  <div className="flex items-center gap-2 text-[#1F1F1F] font-medium">
                    <Truck className="w-4 h-4 text-[#B67355]" />
                    <span>You unlocked <strong>FREE Shipping</strong> across Egypt!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-[#1F1F1F] mb-1.5">
                      <span>Add <strong>EGP {remainingForFreeShipping.toFixed(0)}</strong> for Free Delivery</span>
                      <span className="text-[#8E8A85]">{progressToFreeShipping.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E8E2D8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B67355] transition-all duration-500"
                        style={{ width: `${progressToFreeShipping}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[#E8E2D8]/50 flex items-center justify-center mb-4">
                      <ShoppingBag className="w-8 h-8 text-[#8E8A85]" />
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
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold font-sans">
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
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                              EGP {(item.price * item.quantity).toFixed(2)}
                            </span>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-[#8E8A85] font-sans">
                                (EGP {item.price.toFixed(2)} each)
                              </p>
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
                    <div className="flex justify-between text-[#8E8A85]">
                      <span>Shipping Estimate</span>
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
