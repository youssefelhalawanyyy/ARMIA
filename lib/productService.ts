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
const CACHE_TTL_MS = 20000; // 20s hot memory cache

export function invalidateProductCache(): void {
  PRODUCT_CACHE.clear();
  SINGLE_PRODUCT_CACHE.clear();
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

  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    let q = query(productsRef);

    if (category && category !== 'all' && category !== 'new-in' && category !== 'best-sellers') {
      q = query(productsRef, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        const product = sanitizeFirestoreDoc<Product>(doc.id, doc.data());
        const seedMatch = INITIAL_PRODUCTS.find((p) => p.id === doc.id);
        if (seedMatch) {
          if (!product.nameArabic && seedMatch.nameArabic) product.nameArabic = seedMatch.nameArabic;
          if (!product.descriptionArabic && seedMatch.descriptionArabic) product.descriptionArabic = seedMatch.descriptionArabic;
          if (seedMatch.specs) {
            if (!product.specs) {
              product.specs = seedMatch.specs;
            } else {
              if (!product.specs.fabricArabic && seedMatch.specs.fabricArabic) product.specs.fabricArabic = seedMatch.specs.fabricArabic;
              if (!product.specs.fitArabic && seedMatch.specs.fitArabic) product.specs.fitArabic = seedMatch.specs.fitArabic;
              if (!product.specs.careArabic && seedMatch.specs.careArabic) product.specs.careArabic = seedMatch.specs.careArabic;
              if (!product.specs.originArabic && seedMatch.specs.originArabic) product.specs.originArabic = seedMatch.specs.originArabic;
            }
          }
        }
        items.push(product);
      });

      let finalItems = items;
      if (category === 'new-in') {
        const filtered = items.filter((item) => item.isNewArrival || item.category === 'new-in');
        finalItems = filtered.length > 0 ? filtered : items;
      } else if (category === 'best-sellers') {
        const featured = items.filter((item) => item.featured);
        finalItems = featured.length > 0 ? featured : items;
      }

      PRODUCT_CACHE.set(cacheKey, { data: finalItems, timestamp: Date.now() });
      return finalItems;
    }
  } catch (error) {
    console.warn('Firestore fetch warning, using fallback seed data:', error);
  }

  // Fallback to initial boutique catalog
  let fallbackResult: Product[];
  if (category && category !== 'all') {
    if (category === 'new-in') {
      const filtered = INITIAL_PRODUCTS.filter((p) => p.isNewArrival);
      fallbackResult = filtered.length > 0 ? filtered : INITIAL_PRODUCTS;
    } else if (category === 'best-sellers') {
      const featured = INITIAL_PRODUCTS.filter((p) => p.featured);
      fallbackResult = featured.length > 0 ? featured : INITIAL_PRODUCTS;
    } else {
      fallbackResult = INITIAL_PRODUCTS.filter((p) => p.category === category);
    }
  } else {
    fallbackResult = INITIAL_PRODUCTS;
  }

  PRODUCT_CACHE.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

/**
 * Fetch single product by ID with caching
 */
export async function getProductById(id: string): Promise<Product | null> {
  const cached = SINGLE_PRODUCT_CACHE.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const product = sanitizeFirestoreDoc<Product>(snap.id, snap.data());
      const seedMatch = INITIAL_PRODUCTS.find((p) => p.id === snap.id);
      if (seedMatch) {
        if (!product.nameArabic && seedMatch.nameArabic) product.nameArabic = seedMatch.nameArabic;
        if (!product.descriptionArabic && seedMatch.descriptionArabic) product.descriptionArabic = seedMatch.descriptionArabic;
        if (seedMatch.specs) {
          if (!product.specs) {
            product.specs = seedMatch.specs;
          } else {
            if (!product.specs.fabricArabic && seedMatch.specs.fabricArabic) product.specs.fabricArabic = seedMatch.specs.fabricArabic;
            if (!product.specs.fitArabic && seedMatch.specs.fitArabic) product.specs.fitArabic = seedMatch.specs.fitArabic;
            if (!product.specs.careArabic && seedMatch.specs.careArabic) product.specs.careArabic = seedMatch.specs.careArabic;
            if (!product.specs.originArabic && seedMatch.specs.originArabic) product.specs.originArabic = seedMatch.specs.originArabic;
          }
        }
      }
      SINGLE_PRODUCT_CACHE.set(id, { data: product, timestamp: Date.now() });
      return product;
    }
  } catch (error) {
    console.warn('Firestore getProductById warning:', error);
  }

  const fallback = INITIAL_PRODUCTS.find((p) => p.id === id);
  if (fallback) {
    SINGLE_PRODUCT_CACHE.set(id, { data: fallback, timestamp: Date.now() });
    return fallback;
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

  const rawPayload = {
    ...product,
    id: prodId,
    updatedAt: serverTimestamp(),
  };

  const payload = cleanUndefinedFields(rawPayload);

  await setDoc(docRef, payload, { merge: true });
  invalidateProductCache();
  return prodId;
}

/**
 * Admin: Delete product
 */
export async function deleteProduct(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
  invalidateProductCache();
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
