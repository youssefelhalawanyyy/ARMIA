'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { subscribeToProducts, getProducts } from '@/lib/productService';

/**
 * Custom hook that initializes with server-rendered products (zero layout shift & full SEO)
 * and keeps them synchronized in real time with Firestore snapshots and cross-tab admin updates.
 */
export function useLiveProducts(initialProducts: Product[] = [], category?: string): Product[] {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    // 1. Attach real-time Firestore collection listener
    const unsubscribe = subscribeToProducts((liveList) => {
      setProducts(liveList);
    }, category);

    // 2. Cross-tab and local window event listener
    const handleCatalogUpdate = async () => {
      try {
        const fresh = await getProducts(category);
        setProducts(fresh);
      } catch (err) {
        console.warn('Failed to refresh catalog on update event:', err);
      }
    };

    window.addEventListener('armia_products_updated', handleCatalogUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('armia_catalog_channel');
        bc.onmessage = () => {
          handleCatalogUpdate();
        };
      } catch {}
    }

    // 3. Re-verify when user switches back from another tab (e.g. admin tab) to the storefront
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleCatalogUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('armia_products_updated', handleCatalogUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [category]);

  return products;
}
