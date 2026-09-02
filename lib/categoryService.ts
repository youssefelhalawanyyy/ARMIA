import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Category } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'dresses',
    slug: 'dresses',
    name: 'Dresses',
    nameArabic: 'فساتين',
    description: 'Flowing linen silhouettes, pleated maxi cuts, and evening elegance.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80',
    featured: true,
    orderIndex: 1,
  },
  {
    id: 'sets',
    slug: 'sets',
    name: 'Sets & Co-ords',
    nameArabic: 'أطقم متناسقة',
    description: 'Effortless two-piece luxury sets in organic breathable fabrics.',
    imageUrl: 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=900&auto=format&fit=crop&q=80',
    featured: true,
    orderIndex: 2,
  },
  {
    id: 'tops',
    slug: 'tops',
    name: 'Tops & Blouses',
    nameArabic: 'توبات وبلوزات',
    description: 'Refined silk wraps, linen shirts, and minimalist knit tops.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80',
    featured: true,
    orderIndex: 3,
  },
  {
    id: 'bottoms',
    slug: 'bottoms',
    name: 'Bottoms & Trousers',
    nameArabic: 'بناطيل وتنانير',
    description: 'Tailored high-waisted pants, wide-leg linen trousers, and skirts.',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=80',
    featured: true,
    orderIndex: 4,
  },
  {
    id: 'outerwear',
    slug: 'outerwear',
    name: 'Outerwear & Blazers',
    nameArabic: 'بليزر وجواكت',
    description: 'Structured wool blend coats, relaxed summer blazers, and trenches.',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=900&auto=format&fit=crop&q=80',
    featured: true,
    orderIndex: 5,
  },
  {
    id: 'new-in',
    slug: 'new-in',
    name: 'New In',
    nameArabic: 'أحدث الموديلات',
    description: 'The latest seasonal curation designed for your signature style.',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop&q=80',
    featured: true,
    orderIndex: 6,
  },
];

const CATEGORIES_STORAGE_KEY = 'armia_categories_cache_v1';

let inMemoryCategories: Category[] | null = null;
let lastCatFetch = 0;
const CAT_CACHE_TTL = 15000; // 15 seconds

/**
 * Fetch all categories from Firestore with high-speed caching.
 * If Firestore has a categories configuration, it strictly respects it.
 * If no document or empty array, returns empty list.
 */
export async function getCategories(forceFresh = false): Promise<Category[]> {
  if (!forceFresh && inMemoryCategories && Date.now() - lastCatFetch < CAT_CACHE_TTL) {
    return inMemoryCategories;
  }

  if (typeof window !== 'undefined' && !forceFresh) {
    try {
      const cached = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (cached && !inMemoryCategories) {
        inMemoryCategories = JSON.parse(cached);
      }
    } catch {
      // ignore
    }
  }

  try {
    const docRef = doc(db, 'settings', 'categories_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.categories)) {
        const cats = data.categories as Category[];
        const sorted = cats.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        inMemoryCategories = sorted;
        lastCatFetch = Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(sorted));
        }
        return sorted;
      }
    } else {
      // No categories configuration exists in Firestore yet
      inMemoryCategories = [];
      lastCatFetch = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify([]));
      }
      return [];
    }
  } catch (err) {
    console.warn('Firestore categories fetch notice:', err);
  }

  if (inMemoryCategories) return inMemoryCategories;
  return [];
}

/**
 * Save / Update a Category
 */
export async function saveCategory(category: Category): Promise<Category[]> {
  const current = await getCategories(true);
  const existingIdx = current.findIndex((c) => c.id === category.id || c.slug === category.slug);

  let updated: Category[];
  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx] = category;
  } else {
    updated = [...current, { ...category, orderIndex: current.length + 1 }];
  }

  inMemoryCategories = updated;
  lastCatFetch = Date.now();

  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('armia_categories_updated', { detail: updated }));
  }

  try {
    const docRef = doc(db, 'settings', 'categories_config');
    await setDoc(docRef, { categories: updated, updatedAt: new Date() }, { merge: true });
  } catch (err) {
    console.warn('Firestore category save notice:', err);
  }

  return updated;
}

/**
 * Delete a Category by ID or Slug
 */
export async function deleteCategory(categoryId: string): Promise<Category[]> {
  const current = await getCategories(true);
  const updated = current.filter((c) => c.id !== categoryId && c.slug !== categoryId);

  inMemoryCategories = updated;
  lastCatFetch = Date.now();

  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('armia_categories_updated', { detail: updated }));
  }

  try {
    const docRef = doc(db, 'settings', 'categories_config');
    await setDoc(docRef, { categories: updated, updatedAt: new Date() }, { merge: true });
  } catch (err) {
    console.warn('Firestore category delete notice:', err);
  }

  return updated;
}

/**
 * Reset Categories to Default Curation
 */
export async function resetCategories(): Promise<Category[]> {
  inMemoryCategories = DEFAULT_CATEGORIES;
  lastCatFetch = Date.now();

  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    window.dispatchEvent(new CustomEvent('armia_categories_updated', { detail: DEFAULT_CATEGORIES }));
  }

  try {
    const docRef = doc(db, 'settings', 'categories_config');
    await setDoc(docRef, { categories: DEFAULT_CATEGORIES, updatedAt: new Date() }, { merge: true });
  } catch (err) {
    console.warn('Firestore category reset notice:', err);
  }

  return DEFAULT_CATEGORIES;
}
