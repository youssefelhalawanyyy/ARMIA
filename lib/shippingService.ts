import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ShippingSettings, ShippingZone } from '@/types';

export const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  { id: 'cairo', governorate: 'Cairo', governorateArabic: 'القاهرة', rate: 50, estimatedDays: '1-2 Days', isActive: true },
  { id: 'giza', governorate: 'Giza', governorateArabic: 'الجيزة', rate: 50, estimatedDays: '1-2 Days', isActive: true },
  { id: 'alexandria', governorate: 'Alexandria', governorateArabic: 'الإسكندرية', rate: 60, estimatedDays: '2-3 Days', isActive: true },
  { id: 'qalyubia', governorate: 'Qalyubia', governorateArabic: 'القليوبية', rate: 55, estimatedDays: '2-3 Days', isActive: true },
  { id: 'sharqia', governorate: 'Sharqia', governorateArabic: 'الشرقية', rate: 60, estimatedDays: '2-3 Days', isActive: true },
  { id: 'dakahlia', governorate: 'Dakahlia', governorateArabic: 'الدقهلية', rate: 60, estimatedDays: '2-3 Days', isActive: true },
  { id: 'gharbia', governorate: 'Gharbia', governorateArabic: 'الغربية', rate: 60, estimatedDays: '2-3 Days', isActive: true },
  { id: 'monufia', governorate: 'Monufia', governorateArabic: 'المنوفية', rate: 60, estimatedDays: '2-3 Days', isActive: true },
  { id: 'beheira', governorate: 'Beheira', governorateArabic: 'البحيرة', rate: 65, estimatedDays: '2-3 Days', isActive: true },
  { id: 'kafr-el-sheikh', governorate: 'Kafr El Sheikh', governorateArabic: 'كفر الشيخ', rate: 65, estimatedDays: '2-3 Days', isActive: true },
  { id: 'damietta', governorate: 'Damietta', governorateArabic: 'دمياط', rate: 65, estimatedDays: '2-4 Days', isActive: true },
  { id: 'port-said', governorate: 'Port Said', governorateArabic: 'بورسعيد', rate: 65, estimatedDays: '2-4 Days', isActive: true },
  { id: 'ismailia', governorate: 'Ismailia', governorateArabic: 'الإسماعيلية', rate: 65, estimatedDays: '2-4 Days', isActive: true },
  { id: 'suez', governorate: 'Suez', governorateArabic: 'السويس', rate: 65, estimatedDays: '2-4 Days', isActive: true },
  { id: 'faiyum', governorate: 'Faiyum', governorateArabic: 'الفيوم', rate: 70, estimatedDays: '2-4 Days', isActive: true },
  { id: 'beni-suef', governorate: 'Beni Suef', governorateArabic: 'بني سويف', rate: 70, estimatedDays: '2-4 Days', isActive: true },
  { id: 'minya', governorate: 'Minya', governorateArabic: 'المنيا', rate: 75, estimatedDays: '3-4 Days', isActive: true },
  { id: 'asyut', governorate: 'Asyut', governorateArabic: 'أسيوط', rate: 75, estimatedDays: '3-4 Days', isActive: true },
  { id: 'sohag', governorate: 'Sohag', governorateArabic: 'سوهاج', rate: 80, estimatedDays: '3-5 Days', isActive: true },
  { id: 'qena', governorate: 'Qena', governorateArabic: 'قنا', rate: 85, estimatedDays: '3-5 Days', isActive: true },
  { id: 'luxor', governorate: 'Luxor', governorateArabic: 'الأقصر', rate: 85, estimatedDays: '3-5 Days', isActive: true },
  { id: 'aswan', governorate: 'Aswan', governorateArabic: 'أسوان', rate: 90, estimatedDays: '3-5 Days', isActive: true },
  { id: 'red-sea', governorate: 'Red Sea (Hurghada/Gouna)', governorateArabic: 'البحر الأحمر (الغردقة والجونة)', rate: 95, estimatedDays: '3-5 Days', isActive: true },
  { id: 'south-sinai', governorate: 'South Sinai (Sharm/Dahab)', governorateArabic: 'جنوب سيناء (شرم الشيخ ودهب)', rate: 95, estimatedDays: '3-5 Days', isActive: true },
  { id: 'north-sinai', governorate: 'North Sinai', governorateArabic: 'شمال سيناء', rate: 95, estimatedDays: '3-6 Days', isActive: true },
  { id: 'matrouh', governorate: 'Matrouh & North Coast', governorateArabic: 'مطروح والساحل الشمالي', rate: 85, estimatedDays: '3-5 Days', isActive: true },
  { id: 'new-valley', governorate: 'New Valley', governorateArabic: 'الوادي الجديد', rate: 95, estimatedDays: '4-6 Days', isActive: true },
];

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  defaultRate: 50,
  freeShippingThreshold: 1500,
  zones: DEFAULT_SHIPPING_ZONES,
};

const SHIPPING_STORAGE_KEY = 'armia_shipping_settings_cache_v1';

/**
 * Get current shipping settings from Firestore (or local cache / defaults)
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  // Check local cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(SHIPPING_STORAGE_KEY);
      if (cached) {
        // Return cached immediately and refresh in background
      }
    } catch {
      // ignore
    }
  }

  try {
    const docRef = doc(db, 'settings', 'shipping');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as ShippingSettings;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn('Firestore shipping settings notice (using defaults):', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(SHIPPING_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  return DEFAULT_SHIPPING_SETTINGS;
}

/**
 * Save shipping settings to Firestore and local cache
 */
export async function saveShippingSettings(settings: ShippingSettings): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(settings));
  }

  try {
    const docRef = doc(db, 'settings', 'shipping');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.warn('Firestore shipping settings save notice (persisted in local cache):', err);
  }
}

/**
 * Calculate rate for a specific governorate & subtotal
 */
export function calculateDeliveryFee(
  governorateName: string,
  subtotal: number,
  settings: ShippingSettings = DEFAULT_SHIPPING_SETTINGS
): number {
  if (subtotal >= settings.freeShippingThreshold && settings.freeShippingThreshold > 0) {
    return 0; // Free delivery above threshold
  }

  if (!governorateName) return settings.defaultRate;

  const cleanName = governorateName.toLowerCase().trim();

  // 1. Direct or bidirectional match across English, Arabic, and ID
  const matchedZone = settings.zones.find((z) => {
    if (!z.isActive) return false;
    const govEng = z.governorate.toLowerCase().trim();
    const govAr = z.governorateArabic.toLowerCase().trim();
    const zoneId = z.id.toLowerCase().trim();

    return (
      cleanName.includes(govEng) ||
      govEng.includes(cleanName) ||
      cleanName.includes(govAr) ||
      govAr.includes(cleanName) ||
      cleanName.includes(zoneId)
    );
  });

  if (matchedZone) {
    return matchedZone.rate;
  }

  return settings.defaultRate;
}
