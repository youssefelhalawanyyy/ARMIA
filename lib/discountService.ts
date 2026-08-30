import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Discount, CartItem } from '@/types';

export const DEFAULT_DISCOUNTS: Discount[] = [
  {
    id: 'auto-vip-15',
    title: 'VIP Atelier 15% Auto-Discount',
    titleArabic: 'خصم تلقائي 15% للطلبات المميزة',
    type: 'percentage',
    value: 15,
    trigger: 'auto',
    minSubtotal: 2000,
    maxDiscountAmount: 600,
    applicableCategory: 'all',
    isActive: true,
    usageCount: 42,
  },
  {
    id: 'coupon-welcome10',
    title: 'Welcome 10% Boutique Voucher',
    titleArabic: 'كوبون ترحيبي 10% لأول طلب',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    trigger: 'coupon',
    minSubtotal: 500,
    applicableCategory: 'all',
    isActive: true,
    usageCount: 18,
  },
  {
    id: 'coupon-armia200',
    title: 'EGP 200 Fixed Gift Voucher',
    titleArabic: 'قسيمة شراء بقيمة 200 جنيه',
    code: 'ARMIA200',
    type: 'fixed_amount',
    value: 200,
    trigger: 'coupon',
    minSubtotal: 1800,
    applicableCategory: 'all',
    isActive: true,
    usageCount: 9,
  },
];

const DISCOUNTS_STORAGE_KEY = 'armia_discounts_cache_v1';

/**
 * Fetch all discounts from Firestore with local storage caching
 */
export async function getDiscounts(): Promise<Discount[]> {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(DISCOUNTS_STORAGE_KEY);
      if (cached) {
        // Return cached immediately
      }
    } catch {
      // ignore
    }
  }

  try {
    const docRef = doc(db, 'settings', 'discounts_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.discounts)) {
        const discounts = data.discounts as Discount[];
        if (typeof window !== 'undefined') {
          localStorage.setItem(DISCOUNTS_STORAGE_KEY, JSON.stringify(discounts));
        }
        return discounts;
      }
    }
  } catch (err) {
    console.warn('Firestore discounts notice (using defaults):', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(DISCOUNTS_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  return DEFAULT_DISCOUNTS;
}

/**
 * Save / Update a Discount
 */
export async function saveDiscount(discount: Discount): Promise<Discount[]> {
  const current = await getDiscounts();
  const existingIdx = current.findIndex((d) => d.id === discount.id);

  let updated: Discount[];
  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx] = discount;
  } else {
    updated = [discount, ...current];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(DISCOUNTS_STORAGE_KEY, JSON.stringify(updated));
  }

  try {
    const docRef = doc(db, 'settings', 'discounts_config');
    await setDoc(docRef, { discounts: updated, updatedAt: new Date() }, { merge: true });
  } catch (err) {
    console.warn('Firestore discount save notice:', err);
  }

  return updated;
}

/**
 * Delete a Discount by ID
 */
export async function deleteDiscount(discountId: string): Promise<Discount[]> {
  const current = await getDiscounts();
  const updated = current.filter((d) => d.id !== discountId);

  if (typeof window !== 'undefined') {
    localStorage.setItem(DISCOUNTS_STORAGE_KEY, JSON.stringify(updated));
  }

  try {
    const docRef = doc(db, 'settings', 'discounts_config');
    await setDoc(docRef, { discounts: updated, updatedAt: new Date() }, { merge: true });
  } catch (err) {
    console.warn('Firestore discount delete notice:', err);
  }

  return updated;
}

export interface DiscountEvaluationResult {
  discountAmount: number;
  freeShipping: boolean;
  appliedDiscount: Discount | null;
  message: string;
}

/**
 * Calculate applicable discount dynamically:
 * Evaluates active auto discounts + entered promo code, returning the best savings.
 */
export function evaluateDiscounts({
  subtotal,
  items,
  couponCode,
  discounts = DEFAULT_DISCOUNTS,
}: {
  subtotal: number;
  items: CartItem[];
  couponCode?: string;
  discounts?: Discount[];
}): DiscountEvaluationResult {
  if (subtotal <= 0 || items.length === 0) {
    return {
      discountAmount: 0,
      freeShipping: false,
      appliedDiscount: null,
      message: '',
    };
  }

  const cleanCode = couponCode?.trim().toUpperCase();
  let bestDiscount: Discount | null = null;
  let maxSavings = 0;
  let freeShipping = false;
  let message = '';

  const activeDiscounts = discounts.filter((d) => d.isActive);

  for (const disc of activeDiscounts) {
    // Check minimum subtotal requirement
    if (disc.minSubtotal && subtotal < disc.minSubtotal) {
      continue;
    }

    // Check applicable category
    let eligibleSubtotal = subtotal;
    if (disc.applicableCategory && disc.applicableCategory !== 'all') {
      const matchingItems = items.filter(
        (it) => it.category.toLowerCase() === disc.applicableCategory?.toLowerCase()
      );
      if (matchingItems.length === 0) continue;
      eligibleSubtotal = matchingItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    }

    // Check Trigger Match (Auto vs Coupon)
    const isAutoMatch = disc.trigger === 'auto';
    const isCouponMatch = disc.trigger === 'coupon' && cleanCode && disc.code?.toUpperCase() === cleanCode;

    if (!isAutoMatch && !isCouponMatch) {
      continue;
    }

    let calculatedAmount = 0;
    if (disc.type === 'percentage') {
      calculatedAmount = (eligibleSubtotal * disc.value) / 100;
      if (disc.maxDiscountAmount && calculatedAmount > disc.maxDiscountAmount) {
        calculatedAmount = disc.maxDiscountAmount;
      }
    } else if (disc.type === 'fixed_amount') {
      calculatedAmount = Math.min(disc.value, eligibleSubtotal);
    } else if (disc.type === 'free_shipping') {
      freeShipping = true;
    }

    if (calculatedAmount > maxSavings || (disc.type === 'free_shipping' && !bestDiscount)) {
      maxSavings = calculatedAmount;
      bestDiscount = disc;
      message =
        disc.trigger === 'auto'
          ? `Auto-Applied: ${disc.title} (-EGP ${calculatedAmount.toFixed(2)})`
          : `Promo Code '${disc.code}' Applied: ${disc.title} (-EGP ${calculatedAmount.toFixed(2)})`;
    }
  }

  return {
    discountAmount: Math.round(maxSavings * 100) / 100,
    freeShipping,
    appliedDiscount: bestDiscount,
    message,
  };
}
