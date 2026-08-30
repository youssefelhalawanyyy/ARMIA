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

/**
 * Fetch all categories from Firestore with local storage caching
 */
export async function getCategories(): Promise<Category[]> {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (cached) {
        // Cached exists
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
      if (data && Array.isArray(data.categories) && data.categories.length > 0) {
        const cats = data.categories as Category[];
        if (typeof window !== 'undefined') {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
        }
        return cats.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      }
    }
  } catch (err) {
    console.warn('Firestore categories notice (using defaults):', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  return DEFAULT_CATEGORIES;
}

/**
 * Save / Update a Category
 */
export async function saveCategory(category: Category): Promise<Category[]> {
  const current = await getCategories();
  const existingIdx = current.findIndex((c) => c.id === category.id || c.slug === category.slug);

  let updated: Category[];
  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx] = category;
  } else {
    updated = [...current, { ...category, orderIndex: current.length + 1 }];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
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
  const current = await getCategories();
  const updated = current.filter((c) => c.id !== categoryId && c.slug !== categoryId);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
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
  if (typeof window !== 'undefined') {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }

  try {
    const docRef = doc(db, 'settings', 'categories_config');
    await setDoc(docRef, { categories: DEFAULT_CATEGORIES, updatedAt: new Date() }, { merge: true });
  } catch (err) {
    console.warn('Firestore category reset notice:', err);
  }

  return DEFAULT_CATEGORIES;
}
