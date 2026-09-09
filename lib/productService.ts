import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Order, OrderStatus, PaymentStatus } from '@/types';
import { INITIAL_PRODUCTS } from './seedData';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

/**
 * Recursively removes all undefined fields to ensure valid Firestore document payloads
 */
export function cleanUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedFields) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedFields(value);
      }
    }
    return cleaned as unknown as T;
  }
  return obj;
}

/**
 * Safely converts Firestore document data into a pure plain object serializable across React Server Component boundaries.
 */
function sanitizeFirestoreDoc<T>(id: string, rawData: Record<string, unknown> | null | undefined): T {
  if (!rawData || typeof rawData !== 'object') {
    return { id, ...(rawData || {}) } as T;
  }

  const serializeValue = (val: unknown): unknown => {
    if (val === null || val === undefined) return val;
    // Handle Firestore Timestamp
    const obj = val as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
    if (typeof obj?.toDate === 'function') {
      return obj.toDate().toISOString();
    }
    if (typeof obj?.seconds === 'number' && typeof obj?.nanoseconds === 'number') {
      return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000).toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(serializeValue);
    }
    if (typeof val === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) {
        sanitized[k] = serializeValue(v);
      }
      return sanitized;
    }
    return val;
  };

  const plainData = serializeValue(rawData) as Record<string, unknown>;
  return { id, ...plainData } as T;
}

const PRODUCT_CACHE = new Map<string, { data: Product[]; timestamp: number }>();
const SINGLE_PRODUCT_CACHE = new Map<string, { data: Product; timestamp: number }>();
const CACHE_TTL_MS = 300000; // 5 minutes hot in-memory cache

export function invalidateProductCache(): void {
  PRODUCT_CACHE.clear();
  SINGLE_PRODUCT_CACHE.clear();
  if (typeof window !== 'undefined') {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('armia_catalog_cache_') || key.startsWith('armia_prod_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
  }
}

async function refreshSingleProductInBackground(id: string) {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const fresh = sanitizeFirestoreDoc<Product>(snap.id, snap.data());
      SINGLE_PRODUCT_CACHE.set(id, { data: fresh, timestamp: Date.now() });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`armia_prod_${id}`, JSON.stringify(fresh));
        } catch {}
      }
    }
  } catch {}
}

async function refreshProductsInBackground(cacheKey: string, category?: string) {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    let q = query(productsRef);

    if (category && category !== 'all' && category !== 'new-in' && category !== 'best-sellers') {
      q = query(productsRef, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    const items: Product[] = [];
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const product = sanitizeFirestoreDoc<Product>(doc.id, doc.data());
        items.push(product);
      });
    }

    if (items.length > 0) {
      let finalItems = items;
      if (category === 'new-in') {
        finalItems = items.filter((item) => item.isNewArrival || item.category === 'new-in');
      } else if (category === 'best-sellers') {
        finalItems = items.filter((item) => item.featured);
        if (finalItems.length === 0) finalItems = items;
      }

      PRODUCT_CACHE.set(cacheKey, { data: finalItems, timestamp: Date.now() });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`armia_catalog_cache_${cacheKey}`, JSON.stringify(finalItems));
          finalItems.forEach((p) => {
            localStorage.setItem(`armia_prod_${p.id}`, JSON.stringify(p));
          });
        } catch {}
      }
    }
  } catch {}
}

/**
 * Fetch all products or filter by category with high-speed memory caching
 */
export async function getProducts(category?: string): Promise<Product[]> {
  const cacheKey = category || 'all';
  const cached = PRODUCT_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Instant client cache for zero-lag reloads (0ms initial render + background sync)
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`armia_catalog_cache_${cacheKey}`);
      if (local) {
        const parsed = JSON.parse(local) as Product[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          PRODUCT_CACHE.set(cacheKey, { data: parsed, timestamp: Date.now() });
          refreshProductsInBackground(cacheKey, category);
          return parsed;
        }
      }
    } catch {}
  }

  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    let q = query(productsRef);

    if (category && category !== 'all' && category !== 'new-in' && category !== 'best-sellers') {
      q = query(productsRef, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    const items: Product[] = [];
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const product = sanitizeFirestoreDoc<Product>(doc.id, doc.data());
        items.push(product);
      });
    }

    // Only fallback to INITIAL_PRODUCTS if Firestore is completely empty (e.g. uninitialized)
    if (items.length === 0 && (!category || category === 'all')) {
      items.push(...INITIAL_PRODUCTS);
    }

    let finalItems = items;
    if (category === 'new-in') {
      finalItems = items.filter((item) => item.isNewArrival || item.category === 'new-in');
    } else if (category === 'best-sellers') {
      finalItems = items.filter((item) => item.featured);
      if (finalItems.length === 0) finalItems = items;
    }

    PRODUCT_CACHE.set(cacheKey, { data: finalItems, timestamp: Date.now() });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`armia_catalog_cache_${cacheKey}`, JSON.stringify(finalItems));
        finalItems.forEach((p) => {
          localStorage.setItem(`armia_prod_${p.id}`, JSON.stringify(p));
        });
      } catch {}
    }

    return finalItems;
  } catch (error) {
    console.warn('Firestore fetch warning:', error);
    return INITIAL_PRODUCTS;
  }
}

/**
 * Real-time subscription to products collection.
 * Automatically notifies callback when an admin adds, edits, or removes a product in Firestore.
 */
export function subscribeToProducts(
  callback: (products: Product[]) => void,
  category?: string
): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    let q = query(productsRef);

    if (category && category !== 'all' && category !== 'new-in' && category !== 'best-sellers') {
      q = query(productsRef, where('category', '==', category));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap) => {
            const product = sanitizeFirestoreDoc<Product>(docSnap.id, docSnap.data());
            items.push(product);
          });
        }

        let finalItems = items;
        // Fallback to INITIAL_PRODUCTS only if Firestore is completely empty
        if (items.length === 0 && (!category || category === 'all')) {
          finalItems = [...INITIAL_PRODUCTS];
        } else {
          if (category === 'new-in') {
            finalItems = items.filter((item) => item.isNewArrival || item.category === 'new-in');
          } else if (category === 'best-sellers') {
            finalItems = items.filter((item) => item.featured);
            if (finalItems.length === 0) finalItems = items;
          }
        }

        // Update in-memory cache and localStorage immediately
        const cacheKey = category || 'all';
        PRODUCT_CACHE.set(cacheKey, { data: finalItems, timestamp: Date.now() });
        try {
          localStorage.setItem(`armia_catalog_cache_${cacheKey}`, JSON.stringify(finalItems));
          finalItems.forEach((p) => {
            localStorage.setItem(`armia_prod_${p.id}`, JSON.stringify(p));
          });
        } catch {}

        callback(finalItems);
      },
      (error) => {
        console.warn('Real-time products snapshot notice:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to start real-time product subscription:', err);
    return () => {};
  }
}

/**
 * Fetch single product by ID with caching
 */
export async function getProductById(id: string): Promise<Product | null> {
  const cached = SINGLE_PRODUCT_CACHE.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Instant local client cache lookup
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`armia_prod_${id}`);
      if (local) {
        const parsed = JSON.parse(local) as Product;
        SINGLE_PRODUCT_CACHE.set(id, { data: parsed, timestamp: Date.now() });
        // Background revalidation
        refreshSingleProductInBackground(id);
        return parsed;
      }
    } catch {}
  }

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const product = sanitizeFirestoreDoc<Product>(snap.id, snap.data());
      SINGLE_PRODUCT_CACHE.set(id, { data: product, timestamp: Date.now() });
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`armia_prod_${id}`, JSON.stringify(product));
        } catch {}
      }
      return product;
    }
  } catch (error) {
    console.warn('Firestore getProductById warning:', error);
  }

  // Fallback to INITIAL_PRODUCTS
  const initial = INITIAL_PRODUCTS.find((p) => p.id === id);
  if (initial) {
    SINGLE_PRODUCT_CACHE.set(id, { data: initial, timestamp: Date.now() });
    return initial;
  }

  return null;
}

/**
 * Admin: Seed initial products into Firestore
 */
export async function seedProductsToFirestore(): Promise<number> {
  let count = 0;
  for (const product of INITIAL_PRODUCTS) {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    const payload = cleanUndefinedFields({
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, payload);
    count++;
  }
  return count;
}

/**
 * Admin: Create or update product
 */
export async function saveProduct(product: Partial<Product> & { id?: string }): Promise<string> {
  const prodId = product.id || `prod-${Date.now()}`;
  const docRef = doc(db, PRODUCTS_COLLECTION, prodId);

  // Safeguard: re-compress any large base64 data URLs to guarantee document stays well within 1MB limit
  let sanitizedImages = product.imageUrls;
  if (Array.isArray(sanitizedImages) && typeof window !== 'undefined') {
    try {
      const { compressDataUrlIfNeeded } = await import('./imageUtils');
      sanitizedImages = await Promise.all(
        sanitizedImages.map(async (url) => {
          if (typeof url === 'string' && url.startsWith('data:image/')) {
            return await compressDataUrlIfNeeded(url, 800, 1060, 0.68, 65000);
          }
          return url;
        })
      );
    } catch {
      // Fallback silently if image compression is unavailable
    }
  }

  const rawPayload = {
    ...product,
    ...(sanitizedImages ? { imageUrls: sanitizedImages } : {}),
    id: prodId,
    updatedAt: serverTimestamp(),
  };

  const payload = cleanUndefinedFields(rawPayload);

  await setDoc(docRef, payload, { merge: true });
  invalidateProductCache();

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('armia_products_updated', { detail: { productId: prodId } }));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('armia_catalog_channel');
        bc.postMessage({ type: 'PRODUCT_SAVED', productId: prodId });
        bc.close();
      }
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/collections'] }),
      }).catch(() => {});
    } catch {}
  }

  return prodId;
}

/**
 * Admin: Delete product
 */
export async function deleteProduct(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
  invalidateProductCache();

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('armia_products_updated', { detail: { productId } }));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('armia_catalog_channel');
        bc.postMessage({ type: 'PRODUCT_DELETED', productId });
        bc.close();
      }
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/collections'] }),
      }).catch(() => {});
    } catch {}
  }
}

/**
 * Helper to generate unique order number
 */
export function generateOrderId(): string {
  return `ARM-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Deduct inventory for all items and specific variants in an order
 */
export async function deductOrderInventory(items: Order['items']): Promise<void> {
  if (!items || items.length === 0) return;

  for (const item of items) {
    if (!item.productId) continue;
    try {
      const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const snap = await getDoc(prodRef);
      if (snap.exists()) {
        const prodData = snap.data() as Product;
        const currentStock = Number(prodData.stockQuantity) || 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        let updatedVariants = prodData.variants;
        if (Array.isArray(prodData.variants) && prodData.variants.length > 0) {
          updatedVariants = prodData.variants.map((v) => {
            const matchesColor =
              v.color?.toLowerCase() === item.selectedColor?.name?.toLowerCase();
            const matchesSize =
              v.size?.toLowerCase() === item.selectedSize?.toLowerCase();

            if (matchesColor && matchesSize) {
              return {
                ...v,
                quantity: Math.max(0, (Number(v.quantity) || 0) - item.quantity),
              };
            }
            return v;
          });
        }

        await updateDoc(prodRef, {
          stockQuantity: newStock,
          ...(updatedVariants ? { variants: updatedVariants } : {}),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn(`Could not deduct inventory for product ${item.productId}:`, err);
    }
  }
  invalidateProductCache();
}

/**
 * Restock inventory for all items and variants when an order is cancelled or returned
 */
export async function restockOrderInventory(items: Order['items']): Promise<void> {
  if (!items || items.length === 0) return;

  for (const item of items) {
    if (!item.productId) continue;
    try {
      const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const snap = await getDoc(prodRef);
      if (snap.exists()) {
        const prodData = snap.data() as Product;
        const currentStock = Number(prodData.stockQuantity) || 0;
        const newStock = currentStock + item.quantity;

        let updatedVariants = prodData.variants;
        if (Array.isArray(prodData.variants) && prodData.variants.length > 0) {
          updatedVariants = prodData.variants.map((v) => {
            const matchesColor =
              v.color?.toLowerCase() === item.selectedColor?.name?.toLowerCase();
            const matchesSize =
              v.size?.toLowerCase() === item.selectedSize?.toLowerCase();

            if (matchesColor && matchesSize) {
              return {
                ...v,
                quantity: (Number(v.quantity) || 0) + item.quantity,
              };
            }
            return v;
          });
        }

        await updateDoc(prodRef, {
          stockQuantity: newStock,
          ...(updatedVariants ? { variants: updatedVariants } : {}),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn(`Could not restock inventory for product ${item.productId}:`, err);
    }
  }
  invalidateProductCache();
}

/**
 * Create a new Customer Order (Cash on Delivery / Instapay) & deduct inventory
 */
export async function createOrderInFirestore(orderData: Omit<Order, 'id'>): Promise<string> {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const rawPayload = {
    ...orderData,
    inventoryDeducted: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const payload = cleanUndefinedFields(rawPayload);
  const docRef = await addDoc(ordersRef, payload);

  // Automatically deduct inventory from products catalog in real time
  if (orderData.items && orderData.items.length > 0) {
    await deductOrderInventory(orderData.items);
  }

  return docRef.id;
}

/**
 * Customer: Get customer's orders
 */
export async function getCustomerOrders(customerUid: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef,
      where('customerUid', '==', customerUid)
    );
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push(sanitizeFirestoreDoc<Order>(doc.id, doc.data()));
    });

    // Sort by createdAt descending
    return orders.sort((a, b) => {
      const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
      const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
}

/**
 * Admin: Get all orders
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const snapshot = await getDocs(ordersRef);
    const orders: Order[] = [];
    snapshot.forEach((doc) => {
      orders.push(sanitizeFirestoreDoc<Order>(doc.id, doc.data()));
    });

    return orders.sort((a, b) => {
      const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
      const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}

/**
 * Admin: Update order status with automatic inventory restock on cancel/return
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) return;

  const orderData = snap.data() as Order & { inventoryDeducted?: boolean };
  const prevStatus = orderData.status;

  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  // If moving TO cancelled/returned from an active status -> RESTOCK items back to inventory
  if (
    (status === 'cancelled' || status === 'returned') &&
    prevStatus !== 'cancelled' &&
    prevStatus !== 'returned'
  ) {
    if (orderData.items && orderData.items.length > 0) {
      await restockOrderInventory(orderData.items);
      updates.inventoryDeducted = false;
    }
  }
  // If moving FROM cancelled/returned back to an active status -> RE-DEDUCT items
  else if (
    (prevStatus === 'cancelled' || prevStatus === 'returned') &&
    status !== 'cancelled' &&
    status !== 'returned'
  ) {
    if (orderData.items && orderData.items.length > 0) {
      await deductOrderInventory(orderData.items);
      updates.inventoryDeducted = true;
    }
  }

  await updateDoc(orderRef, updates);
}

/**
 * Admin: Update Instapay payment verification status
 */
export async function updatePaymentStatusInFirestore(
  orderId: string,
  paymentStatus: PaymentStatus,
  autoConfirmOrder = false
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const updates: Record<string, unknown> = {
    paymentStatus,
    updatedAt: serverTimestamp(),
  };
  if (autoConfirmOrder && paymentStatus === 'verified') {
    updates.status = 'confirmed';
  }
  await updateDoc(orderRef, updates);
}
