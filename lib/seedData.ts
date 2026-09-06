import { Product } from '@/types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1788716511841',
    name: 'CHEVRON TOP',
    nameArabic: 'توب شيفرون مطرز بدون أكمام',
    category: 'tops',
    categoryArabic: 'بلوزات وتوبات',
    price: 500.0,
    discountPrice: 400.0,
    stockQuantity: 96,
    colors: [
      { name: 'Oatmeal Beige', nameArabic: 'بيج كشمير', hex: '#DCC9A6' },
      { name: 'Pure White', nameArabic: 'أبيض ناصع', hex: '#FFFFFF' },
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    specs: {
      fabric: '100% Premium Textured Cotton Linen',
      fabricArabic: 'كتان قطني فاخر مع نسيج شيفرون بارز 100%',
      fit: 'Sleeveless Relaxed Tailored Fit',
      fitArabic: 'قصّة عصرية بدون أكمام بتفصيل متقن',
      care: 'Dry clean or gentle hand wash in cold water',
      careArabic: 'تنظيف جاف أو غسيل يدوي لطيف بالماء البارد',
      origin: 'Handcrafted in Egypt',
      originArabic: 'صنع بأيدي مصرية محترفة في القاهرة',
      modelInfo: 'Model is 174cm wearing size S',
      modelInfoArabic: 'العارضة ترتدي مقاس S بطول 174 سم',
    },
    description:
      'An exquisite chevron top crafted with precision and timeless elegance. Features vertical textured chevron motifs, a refined boat neckline, and breathable summer weave.',
    descriptionArabic:
      'توب شيفرون فاخر محاك بدقة وأناقة لا تزول. يتميز بنقوش شيفرون بارزة مع ياقة أنيقة وقصّة بدون أكمام تمنحكِ إطلالة ساحرة ومميزة في جميع الأوقات.',
    imageUrls: [
      '/images/hero-editorial.jpg',
      '/images/pants-editorial.jpg',
    ],
    featured: true,
    isNewArrival: true,
  },
  {
    id: 'prod-relaxed-denim-pants',
    name: 'RELAXED DENIM PANTS',
    nameArabic: 'بنطال جينز واسع بخصر مريح',
    category: 'bottoms',
    categoryArabic: 'بناطيل وتنانير',
    price: 450.0,
    discountPrice: 380.0,
    stockQuantity: 40,
    colors: [
      { name: 'Light Wash Denim', nameArabic: 'جينز أزرق فاتح', hex: '#87CEEB' },
      { name: 'Classic Blue', nameArabic: 'أزرق كلاسيكي', hex: '#4682B4' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    specs: {
      fabric: '100% Premium Washed Cotton Denim',
      fabricArabic: 'دنيم قطن مصري مغسول فاخر 100%',
      fit: 'Relaxed Straight Wide-Leg Cut',
      fitArabic: 'قصّة واسعة مريحة مستقيمة مع خصر عالي',
      care: 'Machine wash cold inside out, gentle cycle',
      careArabic: 'غسيل آلي بماء بارد مقلوباً، دورة لطيفة',
      origin: 'Crafted in Egypt',
      originArabic: 'صنع بأيدي مصرية محترفة في القاهرة',
      modelInfo: 'Model is 174cm wearing size S',
      modelInfoArabic: 'العارضة ترتدي مقاس S بطول 174 سم',
    },
    description:
      'Effortless relaxed silhouette crafted with premium washed cotton denim. Features a high-rise waist with relaxed straight legs and subtle distressed accents for modern everyday luxury.',
    descriptionArabic:
      'بنطال جينز عصري بقصّة مريحة وانسيابية مصمم من خامة الدنيم القطنية الفاخرة، مع خصر مرتفع وأرجل واسعة تمنحكِ إطلالة كاجوال راقية تفيض بالثقة والراحة.',
    imageUrls: [
      '/images/pants-editorial.jpg',
      '/images/hero-editorial.jpg',
    ],
    featured: true,
    isNewArrival: true,
  },
];
