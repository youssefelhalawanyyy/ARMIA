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
import { Product, Order, OrderStatus } from '@/types';
import { INITIAL_PRODUCTS } from './seedData';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

/**
 * Fetch all products or filter by category
 */
export async function getProducts(category?: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    let q = query(productsRef);

    if (category && category !== 'all' && category !== 'new-in') {
      q = query(productsRef, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
        } as Product);
      });

      if (category === 'new-in') {
        return items.filter((item) => item.isNewArrival || item.category === 'new-in');
      }
      return items;
    }
  } catch (error) {
    console.warn('Firestore fetch warning, using fallback seed data:', error);
  }

  // Fallback to initial boutique catalog
  if (category && category !== 'all') {
    if (category === 'new-in') {
      return INITIAL_PRODUCTS.filter((p) => p.isNewArrival);
    }
    return INITIAL_PRODUCTS.filter((p) => p.category === category);
  }
  return INITIAL_PRODUCTS;
}

/**
 * Fetch single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Product;
    }
  } catch (error) {
    console.warn('Firestore getProductById warning:', error);
  }

  const fallback = INITIAL_PRODUCTS.find((p) => p.id === id);
  return fallback || null;
}

/**
 * Admin: Seed initial products into Firestore
 */
export async function seedProductsToFirestore(): Promise<number> {
  let count = 0;
  for (const product of INITIAL_PRODUCTS) {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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

  const payload = {
    ...product,
    id: prodId,
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });
  return prodId;
}

/**
 * Admin: Delete product
 */
export async function deleteProduct(productId: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await deleteDoc(docRef);
}

/**
 * Helper to generate unique order number
 */
export function generateOrderId(): string {
  return `ARM-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Create a new Customer Order (Cash on Delivery)
 */
export async function createOrderInFirestore(orderData: Omit<Order, 'id'>): Promise<string> {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const docRef = await addDoc(ordersRef, {
    ...orderData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
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
      orders.push({
        id: doc.id,
        ...doc.data(),
      } as Order);
    });

    // Sort by createdAt descending
    return orders.sort((a, b) => {
      const timeA = (a.createdAt as { seconds?: number })?.seconds || 0;
      const timeB = (b.createdAt as { seconds?: number })?.seconds || 0;
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
      orders.push({
        id: doc.id,
        ...doc.data(),
      } as Order);
    });

    return orders.sort((a, b) => {
      const timeA = (a.createdAt as { seconds?: number })?.seconds || 0;
      const timeB = (b.createdAt as { seconds?: number })?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}

/**
 * Admin: Update order status
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}
