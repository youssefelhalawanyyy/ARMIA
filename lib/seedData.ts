import { Product } from '@/types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-linen-set-1',
    name: 'LINEN SET',
    category: 'sets',
    price: 450.0,
    discountPrice: 420.0,
    stockQuantity: 28,
    colors: [
      { name: 'Oatmeal Beige', hex: '#DCC9A6' },
      { name: 'Pure White', hex: '#FFFFFF' },
      { name: 'Onyx Black', hex: '#1F1F1F' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    specs: {
      fabric: '100% Organic French Linen',
      fit: 'Relaxed Tailored Silhouette',
      care: 'Dry clean or gentle hand wash in cold water',
      origin: 'Crafted in Egypt',
      modelInfo: 'Model is 174cm wearing size S',
    },
    description:
      'Elevate your daily elegance with our signature two-piece Linen Set. Tailored with breathable organic linen, designed with clean lapels and relaxed straight-leg trousers that flow effortlessly.',
    imageUrls: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=85',
    ],
    featured: true,
    isNewArrival: true,
  },
  {
    id: 'prod-pleated-dress-2',
    name: 'PLEATED DRESS',
    category: 'dresses',
    price: 520.0,
    stockQuantity: 18,
    colors: [
      { name: 'Warm Taupe', hex: '#B67355' },
      { name: 'Champagne Sand', hex: '#DCC9A6' },
      { name: 'Midnight Black', hex: '#1F1F1F' },
    ],
    sizes: ['S', 'M', 'L'],
    specs: {
      fabric: 'Premium Micro-Pleat Chiffon & Satin Lining',
      fit: 'Flattering A-Line Midi Cut with belted waist',
      care: 'Professional dry clean only',
      origin: 'Crafted in Egypt',
      modelInfo: 'Model is 175cm wearing size M',
    },
    description:
      'A masterpiece of feminine grace. Fine accordion pleats create mesmerizing movement with every step, paired with delicate cuffs and an adjustable silhouette.',
    imageUrls: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&auto=format&fit=crop&q=85',
    ],
    featured: true,
    isNewArrival: true,
  },
  {
    id: 'prod-oversize-shirt-3',
    name: 'OVERSIZE SHIRT',
    category: 'tops',
    price: 310.0,
    stockQuantity: 45,
    colors: [
      { name: 'Alabaster White', hex: '#F6F3EE' },
      { name: 'Terracotta Rust', hex: '#B67355' },
      { name: 'Classic Black', hex: '#1F1F1F' },
    ],
    sizes: ['Free Size (S-XL)'],
    specs: {
      fabric: '100% Egyptian Crisp Poplin Cotton',
      fit: 'Contemporary Oversized Drape',
      care: 'Machine wash delicate at 30°C',
      origin: 'Crafted in Egypt',
      modelInfo: 'Model is 172cm wearing Free Size',
    },
    description:
      'The quintessential luxury wardrobe foundation. Tailored with premium Egyptian cotton, structured drop shoulders, mother-of-pearl finish buttons, and an elongated curved hem.',
    imageUrls: [
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=900&auto=format&fit=crop&q=85',
    ],
    featured: true,
    isNewArrival: true,
  },
  {
    id: 'prod-wide-leg-pants-4',
    name: 'WIDE LEG PANTS',
    category: 'bottoms',
    price: 380.0,
    stockQuantity: 30,
    colors: [
      { name: 'Espresso Charcoal', hex: '#2A2A2A' },
      { name: 'Camel Tan', hex: '#C4AE88' },
      { name: 'Off-White Cream', hex: '#F6F3EE' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    specs: {
      fabric: 'Tailored Twill Suiting Blend',
      fit: 'High-Waist Wide Pleated Leg',
      care: 'Cool iron, machine wash gentle',
      origin: 'Crafted in Egypt',
      modelInfo: 'Model is 176cm wearing size S',
    },
    description:
      'Impeccably tailored high-waisted trousers featuring front knife pleats and an ultra-flattering wide leg profile. Designed for commanding presence and effortless comfort.',
    imageUrls: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop&q=85',
    ],
    featured: true,
    isNewArrival: true,
  },
  {
    id: 'prod-blazer-jacket-5',
    name: 'BLAZER JACKET',
    category: 'outerwear',
    price: 560.0,
    discountPrice: 510.0,
    stockQuantity: 15,
    colors: [
      { name: 'Almond Beige', hex: '#DCC9A6' },
      { name: 'Deep Jet Black', hex: '#1F1F1F' },
      { name: 'Warm Terracotta', hex: '#B67355' },
    ],
    sizes: ['S', 'M', 'L'],
    specs: {
      fabric: 'Fine Wool-Blend Structured Suiting',
      fit: 'Sharp Tailored Double-Breasted Cut',
      care: 'Specialist dry clean only',
      origin: 'Crafted in Egypt',
      modelInfo: 'Model is 177cm wearing size S',
    },
    description:
      'Power dressing refined with feminine softness. Structured padded shoulders, peak lapels, and custom matte tortoiseshell buttons make this blazer the ultimate statement layer.',
    imageUrls: [
      'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop&q=85',
    ],
    featured: true,
    isNewArrival: true,
  },
  {
    id: 'prod-satin-dress-6',
    name: 'SATIN DRESS',
    category: 'dresses',
    price: 490.0,
    stockQuantity: 22,
    colors: [
      { name: 'Midnight Onyx', hex: '#1F1F1F' },
      { name: 'Champagne Silk', hex: '#DCC9A6' },
      { name: 'Terracotta Ember', hex: '#B67355' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    specs: {
      fabric: 'Heavyweight Lustrous Liquid Satin',
      fit: 'Bias-Cut Slip Silhouette',
      care: 'Gentle hand wash inside out, cool iron',
      origin: 'Crafted in Egypt',
      modelInfo: 'Model is 173cm wearing size S',
    },
    description:
      'Cut on the bias to drape like a second skin. Features an alluring low back, adjustable delicate straps, and a subtle side split for fluid evening elegance.',
    imageUrls: [
      'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&auto=format&fit=crop&q=85',
    ],
    featured: true,
    isNewArrival: true,
  },
];
