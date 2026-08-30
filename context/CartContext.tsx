'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, ShippingSettings } from '@/types';
import { useToast } from './ToastContext';
import {
  getShippingSettings,
  calculateDeliveryFee,
  DEFAULT_SHIPPING_SETTINGS,
} from '@/lib/shippingService';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  selectedGovernorate: string;
  setSelectedGovernorate: (gov: string) => void;
  shippingSettings: ShippingSettings;
  refreshShippingSettings: () => Promise<void>;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { success, info } = useToast();

  const refreshShippingSettings = useCallback(async () => {
    try {
      const data = await getShippingSettings();
      setShippingSettings(data);
    } catch (err) {
      console.warn('Shipping settings fetch notice:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getShippingSettings()
      .then((data) => {
        if (isMounted) {
          setShippingSettings(data);
        }
      })
      .catch((err) => console.warn('Shipping fetch notice:', err));

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
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.selectedColor.name === newItem.selectedColor.name &&
          item.selectedSize === newItem.selectedSize
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      } else {
        return [...prev, newItem];
      }
    });

    success(`${newItem.name} added to your bag`, 'Added to Bag');
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
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Dynamic calculation based on live admin settings and selected city
  const shippingFee = items.length === 0 ? 0 : calculateDeliveryFee(selectedGovernorate, subtotal, shippingSettings);
  const totalAmount = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shippingFee,
        totalAmount,
        selectedGovernorate,
        setSelectedGovernorate,
        shippingSettings,
        refreshShippingSettings,
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
