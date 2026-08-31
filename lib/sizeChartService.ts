import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { SizeChartGuide } from '@/types';
import { cleanUndefinedFields } from './productService';

const SIZE_CHARTS_COLLECTION = 'size_charts';

export const DEFAULT_SIZE_CHARTS: SizeChartGuide[] = [
  {
    id: 'dresses',
    title: 'Dresses & Evening Gowns Size Chart',
    titleArabic: 'جدول قياسات الفساتين وفساتين السهرة',
    description: 'Accurate atelier measurements for full-length dresses, kaftans, and evening silhouettes.',
    descriptionArabic: 'قياسات الأتيليه الدقيقة للفساتين الطويلة، القفاطين، وإطلالات السهرة.',
    measuringTips: [
      'Bust: Measure around the fullest part of your chest with relaxed posture.',
      'Waist: Measure around the narrowest point of your natural waistline above the hip bone.',
      'Hips: Stand with feet together and measure around the widest part of your hips.',
      'Length: Measured from the highest point of the shoulder down to the bottom hem.',
    ],
    measuringTipsArabic: [
      'محيط الصدر: قيسي حول أوسع نقطة في منطقة الصدر مع استرخاء الجسم.',
      'محيط الخصر: قيسي حول أضيق نقطة في خصركِ الطبيعي فوق عظمة الحوض.',
      'محيط الأرداف: قفي مع ضم القدمين وقيسي حول أوسع نقطة في منطقة الأرداف.',
      'طول الفستان: يُقاس من أعلى نقطة في الكتف نزولاً إلى حافة الفستان السفلية.',
    ],
    rows: [
      { size: 'S', ukEuSize: '36-38 EU (8-10 UK)', bustCm: '86-90', waistCm: '68-72', hipsCm: '94-98', lengthCm: '140', sleeveCm: '59' },
      { size: 'M', ukEuSize: '38-40 EU (10-12 UK)', bustCm: '90-95', waistCm: '72-77', hipsCm: '98-103', lengthCm: '142', sleeveCm: '60' },
      { size: 'L', ukEuSize: '40-42 EU (12-14 UK)', bustCm: '95-101', waistCm: '77-83', hipsCm: '103-109', lengthCm: '144', sleeveCm: '61' },
      { size: 'XL', ukEuSize: '42-44 EU (14-16 UK)', bustCm: '101-108', waistCm: '83-90', hipsCm: '109-116', lengthCm: '145', sleeveCm: '62' },
      { size: 'XXL', ukEuSize: '44-46 EU (16-18 UK)', bustCm: '108-115', waistCm: '90-98', hipsCm: '116-124', lengthCm: '145', sleeveCm: '62' },
    ],
  },
  {
    id: 'sets',
    title: 'Two-Piece Sets & Co-Ords Size Chart',
    titleArabic: 'جدول قياسات الأطقم المتناسقة والكتان',
    description: 'Tailored for relaxed and elegant two-piece linen and crepe sets.',
    descriptionArabic: 'مصمم خصيصاً لأطقم الكتان والكرپ المتناسقة الفاخرة.',
    measuringTips: [
      'Top: Focus on bust and shoulder width.',
      'Trousers/Skirt: Focus on waist comfort and hip measurements.',
      'Waistbands on ARMIA sets feature flexible comfort tailoring.',
    ],
    measuringTipsArabic: [
      'القطعة العلوية: ركزي على محيط الصدر وعرض الأكتاف.',
      'البنطلون/التنورة: ركزي على راحة الخصر ومحيط الأرداف.',
      'تتميز أطقم ARMIA بتشطيب مرن ومريح عند الخصر.',
    ],
    rows: [
      { size: 'S', ukEuSize: '36-38 EU', bustCm: '88-92', waistCm: '66-72', hipsCm: '92-96', lengthCm: '72 (Top) / 102 (Pants)', sleeveCm: '58' },
      { size: 'M', ukEuSize: '38-40 EU', bustCm: '92-97', waistCm: '72-78', hipsCm: '96-102', lengthCm: '74 (Top) / 103 (Pants)', sleeveCm: '59' },
      { size: 'L', ukEuSize: '40-42 EU', bustCm: '97-103', waistCm: '78-84', hipsCm: '102-108', lengthCm: '75 (Top) / 104 (Pants)', sleeveCm: '60' },
      { size: 'XL', ukEuSize: '42-44 EU', bustCm: '103-110', waistCm: '84-92', hipsCm: '108-115', lengthCm: '76 (Top) / 105 (Pants)', sleeveCm: '61' },
      { size: 'XXL', ukEuSize: '44-46 EU', bustCm: '110-118', waistCm: '92-100', hipsCm: '115-123', lengthCm: '76 (Top) / 105 (Pants)', sleeveCm: '61' },
    ],
  },
  {
    id: 'tops',
    title: 'Tops, Blouses & Shirts Size Chart',
    titleArabic: 'جدول قياسات التوبات والبلوزات والقمصان',
    description: 'Measurements for silk wraps, oversized linen shirts, and minimalist blouses.',
    descriptionArabic: 'قياسات البلوزات الحريرية وقمصان الكتان الأنيقة.',
    measuringTips: [
      'Measure around the fullest part of bust and across shoulder seams.',
    ],
    measuringTipsArabic: [
      'قيسي محيط الصدر عند أوسع نقطة والمسافة بين درزات الكتفين.',
    ],
    rows: [
      { size: 'S', ukEuSize: '36-38 EU', bustCm: '86-90', waistCm: '68-72', hipsCm: '92-96', lengthCm: '65', sleeveCm: '58' },
      { size: 'M', ukEuSize: '38-40 EU', bustCm: '90-95', waistCm: '72-77', hipsCm: '96-101', lengthCm: '67', sleeveCm: '59' },
      { size: 'L', ukEuSize: '40-42 EU', bustCm: '95-101', waistCm: '77-83', hipsCm: '101-107', lengthCm: '68', sleeveCm: '60' },
      { size: 'XL', ukEuSize: '42-44 EU', bustCm: '101-108', waistCm: '83-90', hipsCm: '107-114', lengthCm: '70', sleeveCm: '61' },
      { size: 'XXL', ukEuSize: '44-46 EU', bustCm: '108-116', waistCm: '90-98', hipsCm: '114-122', lengthCm: '70', sleeveCm: '61' },
    ],
  },
  {
    id: 'bottoms',
    title: 'Trousers & Skirts Size Chart',
    titleArabic: 'جدول قياسات البناطيل والتنانير',
    description: 'High-waisted tailored trousers, wide-leg linen pants, and pleated skirts.',
    descriptionArabic: 'قياسات البناطيل عالية الخصر وبناطيل الكتان الواسعة والتنانير.',
    measuringTips: [
      'Ensure measuring tape is straight around hips and waist.',
    ],
    measuringTipsArabic: [
      'تأكدي من استقامة شريط القياس حول الخصر والأرداف.',
    ],
    rows: [
      { size: 'S', ukEuSize: '36-38 EU', bustCm: '-', waistCm: '66-70', hipsCm: '92-96', lengthCm: '102', sleeveCm: '-' },
      { size: 'M', ukEuSize: '38-40 EU', bustCm: '-', waistCm: '70-75', hipsCm: '96-101', lengthCm: '103', sleeveCm: '-' },
      { size: 'L', ukEuSize: '40-42 EU', bustCm: '-', waistCm: '75-81', hipsCm: '101-107', lengthCm: '104', sleeveCm: '-' },
      { size: 'XL', ukEuSize: '42-44 EU', bustCm: '-', waistCm: '81-88', hipsCm: '107-114', lengthCm: '105', sleeveCm: '-' },
      { size: 'XXL', ukEuSize: '44-46 EU', bustCm: '-', waistCm: '88-96', hipsCm: '114-122', lengthCm: '105', sleeveCm: '-' },
    ],
  },
  {
    id: 'outerwear',
    title: 'Outerwear, Abayas & Blazers Size Chart',
    titleArabic: 'جدول قياسات العبايات والجواكت والبليزرات',
    description: 'Generous tailoring designed for layering and modest movement.',
    descriptionArabic: 'قصات مريحة وواسعة مصممة لسهولة الارتداء والأناقة المحتشمة.',
    measuringTips: [
      'Outerwear is tailored with ease allowance for layering over inner pieces.',
    ],
    measuringTipsArabic: [
      'صُممت العبايات والبليزرات ببراح مريح لارتدائها فوق الملابس بكل انسيابية.',
    ],
    rows: [
      { size: 'S', ukEuSize: '36-38 EU', bustCm: '90-95', waistCm: '75-80', hipsCm: '98-103', lengthCm: '138', sleeveCm: '60' },
      { size: 'M', ukEuSize: '38-40 EU', bustCm: '95-100', waistCm: '80-85', hipsCm: '103-108', lengthCm: '140', sleeveCm: '61' },
      { size: 'L', ukEuSize: '40-42 EU', bustCm: '100-106', waistCm: '85-92', hipsCm: '108-114', lengthCm: '142', sleeveCm: '62' },
      { size: 'XL', ukEuSize: '42-44 EU', bustCm: '106-114', waistCm: '92-100', hipsCm: '114-122', lengthCm: '143', sleeveCm: '63' },
      { size: 'XXL', ukEuSize: '44-46 EU', bustCm: '114-122', waistCm: '100-108', hipsCm: '122-130', lengthCm: '143', sleeveCm: '63' },
    ],
  },
];

/**
 * Fetch all size charts from Firestore, seeding defaults if not found
 */
export async function getAllSizeCharts(): Promise<SizeChartGuide[]> {
  try {
    const snap = await getDocs(collection(db, SIZE_CHARTS_COLLECTION));
    if (snap.empty) {
      // Seed default size charts to Firestore
      for (const chart of DEFAULT_SIZE_CHARTS) {
        await setDoc(doc(db, SIZE_CHARTS_COLLECTION, chart.id), chart);
      }
      return DEFAULT_SIZE_CHARTS;
    }

    const list: SizeChartGuide[] = [];
    snap.forEach((d) => {
      list.push(d.data() as SizeChartGuide);
    });

    return list;
  } catch (err) {
    console.warn('Size charts fetch fallback:', err);
    return DEFAULT_SIZE_CHARTS;
  }
}

/**
 * Fetch size chart by category or return dresses default
 */
export async function getSizeChartByCategory(categorySlug: string): Promise<SizeChartGuide> {
  const cleanCategory = categorySlug ? categorySlug.toLowerCase() : 'dresses';
  try {
    const docRef = doc(db, SIZE_CHARTS_COLLECTION, cleanCategory);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SizeChartGuide;
    }
  } catch (err) {
    console.warn('Category size chart lookup:', err);
  }

  // Fallback to default in-memory chart
  const matched = DEFAULT_SIZE_CHARTS.find((c) => c.id === cleanCategory);
  return matched || DEFAULT_SIZE_CHARTS[0];
}

/**
 * Save or update size chart in Firestore
 */
export async function saveSizeChart(guide: SizeChartGuide): Promise<boolean> {
  try {
    const docRef = doc(db, SIZE_CHARTS_COLLECTION, guide.id);
    const rawPayload = {
      ...guide,
      updatedAt: serverTimestamp(),
    };
    const payload = cleanUndefinedFields(rawPayload);
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving size chart:', err);
    return false;
  }
}
