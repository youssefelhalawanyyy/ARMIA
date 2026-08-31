'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, ShippingSettings, Discount } from '@/types';
import { useToast } from './ToastContext';
import {
  getShippingSettings,
  calculateDeliveryFee,
  DEFAULT_SHIPPING_SETTINGS,
} from '@/lib/shippingService';
import {
  getDiscounts,
  evaluateDiscounts,
  DEFAULT_DISCOUNTS,
} from '@/lib/discountService';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  appliedDiscount: Discount | null;
  discountMessage: string;
  couponCode: string;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  shippingFee: number;
  totalAmount: number;
  selectedGovernorate: string;
  setSelectedGovernorate: (gov: string) => void;
  shippingSettings: ShippingSettings;
  refreshShippingSettings: () => Promise<void>;
  discounts: Discount[];
  refreshDiscounts: () => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem, openDrawer?: boolean) => void;
  removeFromCart: (productId: string, colorName: string, size: string) => void;
  updateQuantity: (productId: string, colorName: string, size: string, quantity: number) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'armia_cart_v1';
const WISHLIST_STORAGE_KEY = 'armia_wishlist_v1';
const GOV_STORAGE_KEY = 'armia_selected_gov_v1';
const COUPON_STORAGE_KEY = 'armia_coupon_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as CartItem[];
          return parsed.map((it) => {
            const base = it.originalPrice || it.price;
            return {
              ...it,
              price: base,
              originalPrice: base,
            };
          });
        }
        return [];
      } catch (e) {
        console.error('Failed to parse cart storage:', e);
        return [];
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Failed to parse wishlist storage:', e);
        return [];
      }
    }
    return [];
  });

  const [selectedGovernorate, setSelectedGovernorateState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(GOV_STORAGE_KEY) || 'Cairo (القاهرة)';
    }
    return 'Cairo (القاهرة)';
  });

  const [couponCode, setCouponCodeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(COUPON_STORAGE_KEY) || '';
    }
    return '';
  });

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('armia_shipping_settings_cache_v1');
        return cached ? JSON.parse(cached) : DEFAULT_SHIPPING_SETTINGS;
      } catch {
        return DEFAULT_SHIPPING_SETTINGS;
      }
    }
    return DEFAULT_SHIPPING_SETTINGS;
  });

  const [discounts, setDiscounts] = useState<Discount[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('armia_discounts_cache_v1');
        return cached ? JSON.parse(cached) : DEFAULT_DISCOUNTS;
      } catch {
        return DEFAULT_DISCOUNTS;
      }
    }
    return DEFAULT_DISCOUNTS;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { success, info, error } = useToast();

  const refreshShippingSettings = useCallback(async () => {
    try {
      const data = await getShippingSettings();
      setShippingSettings(data);
    } catch (err) {
      console.warn('Shipping settings fetch notice:', err);
    }
  }, []);

  const refreshDiscounts = useCallback(async () => {
    try {
      const data = await getDiscounts();
      setDiscounts(data);
    } catch (err) {
      console.warn('Discounts fetch notice:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getShippingSettings(), getDiscounts()])
      .then(([shipData, discData]) => {
        if (isMounted) {
          if (shipData) setShippingSettings(shipData);
          if (discData) setDiscounts(discData);
        }
      })
      .catch((err) => console.warn('Sync load notice:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const setSelectedGovernorate = (gov: string) => {
    setSelectedGovernorateState(gov);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GOV_STORAGE_KEY, gov);
    }
  };

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      removeCoupon();
      return { success: false, message: 'Please enter a coupon code' };
    }

    const matched = discounts.find(
      (d) => d.isActive && d.trigger === 'coupon' && d.code?.toUpperCase() === clean
    );

    if (!matched) {
      error(`Coupon code '${clean}' is invalid or expired.`, 'Invalid Code');
      return { success: false, message: 'Invalid or expired coupon code' };
    }

    setCouponCodeState(clean);
    if (typeof window !== 'undefined') {
      localStorage.setItem(COUPON_STORAGE_KEY, clean);
    }

    success(`Promo code '${clean}' applied successfully!`, 'Voucher Activated');
    return { success: true, message: `Promo code '${clean}' applied` };
  };

  const removeCoupon = () => {
    setCouponCodeState('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
    info('Coupon code removed');
  };

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const addToCart = (newItem: CartItem, openDrawer: boolean = true) => {
    const basePrice = newItem.originalPrice || newItem.price;
    const normalizedItem: CartItem = {
      ...newItem,
      price: basePrice,
      originalPrice: basePrice,
    };

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === normalizedItem.productId &&
          item.selectedColor.name === normalizedItem.selectedColor.name &&
          item.selectedSize === normalizedItem.selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += normalizedItem.quantity;
        return updated;
      } else {
        return [...prev, normalizedItem];
      }
    });

    success(`${normalizedItem.name} added to your bag`, 'Added to Bag');
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId: string, colorName: string, size: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.selectedColor.name === colorName &&
            item.selectedSize === size
          )
      )
    );
    info('Item removed from your bag');
  };

  const updateQuantity = (
    productId: string,
    colorName: string,
    size: string,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, colorName, size);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (
          item.productId === productId &&
          item.selectedColor.name === colorName &&
          item.selectedSize === size
        ) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        info('Removed from saved wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        success('Saved to your wishlist', 'Wishlist');
        return [...prev, productId];
      }
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const basePrice = item.originalPrice || item.price;
    return sum + basePrice * item.quantity;
  }, 0);

  // AUTOMATIC & COUPON DISCOUNT EVALUATION
  const discountEval = evaluateDiscounts({
    subtotal,
    items,
    couponCode,
    discounts,
  });

  const discountAmount = discountEval.discountAmount;
  const appliedDiscount = discountEval.appliedDiscount;
  const discountMessage = discountEval.message;

  // Dynamic shipping calculation based on live admin settings, free shipping coupon, and threshold
  const isFreeShipping = discountEval.freeShipping || (subtotal >= shippingSettings.freeShippingThreshold && shippingSettings.freeShippingThreshold > 0);
  const shippingFee = items.length === 0 ? 0 : isFreeShipping ? 0 : calculateDeliveryFee(selectedGovernorate, subtotal, shippingSettings);
  
  const totalAmount = Math.max(0, subtotal - discountAmount) + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discountAmount,
        appliedDiscount,
        discountMessage,
        couponCode,
        applyCoupon,
        removeCoupon,
        shippingFee,
        totalAmount,
        selectedGovernorate,
        setSelectedGovernorate,
        shippingSettings,
        refreshShippingSettings,
        discounts,
        refreshDiscounts,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
