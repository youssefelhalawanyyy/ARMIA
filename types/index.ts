export type CategoryType = 'dresses' | 'sets' | 'tops' | 'bottoms' | 'outerwear' | 'new-in' | string;

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameArabic: string;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
  orderIndex?: number;
}

export interface ProductColor {
  name: string;
  nameArabic?: string;
  hex: string;
}

export interface ProductSpecs {
  fabric: string;
  fabricArabic?: string;
  fit: string;
  fitArabic?: string;
  care: string;
  careArabic?: string;
  origin?: string;
  originArabic?: string;
  modelInfo?: string;
  modelInfoArabic?: string;
}

export interface Product {
  id: string;
  name: string;
  nameArabic?: string;
  category: string;
  categoryArabic?: string;
  price: number; // In EGP
  discountPrice?: number; // In EGP
  stockQuantity: number;
  colors: ProductColor[];
  sizes: string[];
  specs: ProductSpecs;
  description: string;
  descriptionArabic?: string;
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

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethodType = 'COD' | 'INSTAPAY';
export type PaymentStatus = 'pending_verification' | 'verified' | 'paid' | 'rejected';

export interface ClientProfile {
  id: string; // uid or phone/email identifier
  uid?: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  governorate?: string;
  city?: string;
  address?: string;
  createdAt?: unknown;
  totalOrders: number;
  totalSpent: number;
  deliveredOrders: number;
  returnedOrders: number;
  returnRate: number; // percentage
  hasPreviousReturns: boolean;
  lastOrderDate?: string;
  orders: Order[];
}

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

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type DiscountTrigger = 'auto' | 'coupon';
export type DiscountTargetType = 'all' | 'category' | 'product';

export interface Discount {
  id: string;
  title: string; // e.g. "VIP 15% OFF" or "Flash Deal: Linen Set"
  titleArabic?: string; // e.g. "خصم حصري 15%"
  code?: string; // e.g. "ARMIA15"
  type: DiscountType; // 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number; // e.g. 15 (%) or 150 (EGP)
  trigger: DiscountTrigger; // 'auto' (applies automatically) | 'coupon' (requires code)
  targetType?: DiscountTargetType; // 'all' | 'category' | 'product'
  applicableCategory?: string; // 'all' or specific category id/slug
  applicableProductId?: string; // Specific Product ID for single item flash deal
  applicableProductName?: string; // Snapshot of product name
  applicableProductImage?: string; // Snapshot of product thumbnail
  minSubtotal?: number; // Minimum cart subtotal in EGP
  maxDiscountAmount?: number; // Optional cap for percentage discounts
  startDate?: string;
  endDate?: string;
  startTime?: string; // ISO string or datetime string
  endTime?: string; // ISO string or datetime string for countdown
  isActive: boolean;
  usageCount?: number;
  usageLimit?: number;
  createdAt?: unknown;
}

export interface Order {
  id?: string;
  orderId: string;
  customerUid: string;
  customerDetails: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discountAmount?: number;
  discountCode?: string;
  discountTitle?: string;
  appliedDiscount?: Discount;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  receiptUrl?: string; // Instapay payment receipt screenshot/photo
  instapaySenderAccount?: string; // Optional sender name or mobile
  paymentStatus?: PaymentStatus;
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

export type AbandonedRecoveryStatus = 'dropped' | 'contacted' | 'recovered' | 'dismissed';

export interface AbandonedCheckout {
  id: string;
  customerDetails: Partial<CustomerDetails>;
  customerUid?: string;
  items: CartItem[];
  subtotal: number;
  discountCode?: string;
  appliedDiscount?: Discount;
  status: AbandonedRecoveryStatus;
  recoveryNotes?: string;
  lastContactedAt?: unknown;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface OutfitBundle {
  mainProduct: Product;
  pairedProduct: Product;
  bundleDiscountPercentage: number; // e.g. 10 (%)
  title: string;
  titleArabic: string;
}

export interface PushSubscriber {
  id: string;
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  customerUid?: string;
  customerName?: string;
  createdAt: unknown;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  titleArabic?: string;
  body: string;
  bodyArabic?: string;
  targetUrl: string;
  imageUrl?: string;
  badgeTag?: string;
  sentAt: unknown;
  recipientCount: number;
}

