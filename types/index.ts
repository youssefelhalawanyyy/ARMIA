export type CategoryType = 'dresses' | 'sets' | 'tops' | 'bottoms' | 'outerwear' | 'new-in';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductSpecs {
  fabric: string;
  fit: string;
  care: string;
  origin?: string;
  modelInfo?: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryType;
  price: number; // In EGP
  discountPrice?: number; // In EGP
  stockQuantity: number;
  colors: ProductColor[];
  sizes: string[];
  specs: ProductSpecs;
  description: string;
  imageUrls: string[];
  featured?: boolean;
  isNewArrival?: boolean;
  createdAt?: unknown;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  selectedColor: ProductColor;
  selectedSize: string;
  imageUrl: string;
  category: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
}

export interface Order {
  id?: string;
  orderId: string;
  customerUid: string;
  customerDetails: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD'; // Strictly COD
  status: OrderStatus;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'customer' | 'admin';
  phone?: string;
  createdAt?: unknown;
}

export interface ShippingZone {
  id: string;
  governorate: string;
  governorateArabic: string;
  rate: number; // In EGP
  estimatedDays: string;
  isActive: boolean;
}

export interface ShippingSettings {
  defaultRate: number;
  freeShippingThreshold: number;
  zones: ShippingZone[];
}
