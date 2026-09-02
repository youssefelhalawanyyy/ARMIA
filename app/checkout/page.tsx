'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Truck,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  UserCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  X,
  Smartphone,
  Copy,
  Check,
  UploadCloud,
  FileCheck,
  Banknote,
  ShieldCheck,
  Info,
  Navigation,
  Loader2,
  MapPin,
  Gift,
  Plus,
  Flame,
  Zap,
  CheckCircle2,
  Building,
  User,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressImage } from '@/lib/imageUtils';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { createOrderInFirestore, generateOrderId, getProducts } from '@/lib/productService';
import {
  getShippingSettings,
  calculateDeliveryFee,
  DEFAULT_SHIPPING_SETTINGS,
} from '@/lib/shippingService';
import {
  saveAbandonedCheckout,
  markAbandonedCheckoutRecovered,
} from '@/lib/abandonedService';
import { CustomerDetails, Order, ShippingSettings, ShippingZone, PaymentMethodType, Product, ProductColor, CartItem } from '@/types';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    discountAmount,
    appliedDiscount,
    couponCode,
    applyCoupon,
    removeCoupon,
    clearCart,
    addToCart,
  } = useCart();

  const { user, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const { t, isArabic } = useLanguage();
  const { success, error, info } = useToast();
  const mounted = useIsMounted();

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Payment method state: COD or INSTAPAY
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('COD');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [senderAccount, setSenderAccount] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);
  const [copiedInstapay, setCopiedInstapay] = useState<boolean>(false);

  // Load live dynamic shipping rates configured by admin
  useEffect(() => {
    let isMounted = true;
    getShippingSettings()
      .then((data) => {
        if (isMounted) setShippingSettings(data);
      })
      .catch((err) => console.warn('Shipping load notice:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Checkout Pre-Purchase Upsell States (Active Offers Only)
  const [upsellCandidates, setUpsellCandidates] = useState<Product[]>([]);
  const [selectedUpsellSizes, setSelectedUpsellSizes] = useState<Record<string, string>>({});
  const [addingUpsellId, setAddingUpsellId] = useState<string | null>(null);

  // Fetch products with active discounts for checkout upselling
  useEffect(() => {
    let isMounted = true;
    getProducts('all')
      .then((prods) => {
        if (!isMounted) return;
        const withOffers = prods.filter((p) => p.discountPrice && p.discountPrice < p.price);
        setUpsellCandidates(withOffers);
      })
      .catch((err) => console.warn('Checkout upsell load notice:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddCheckoutUpsell = (prod: Product) => {
    setAddingUpsellId(prod.id);
    try {
      const chosenColor = prod.colors?.[0] || { name: 'Standard', hex: '#1F1F1F' };
      const chosenSize = selectedUpsellSizes[prod.id] || prod.sizes?.[0] || 'Standard';

      const newItem: CartItem = {
        productId: prod.id,
        name: prod.name,
        price: prod.discountPrice || prod.price,
        originalPrice: prod.price,
        quantity: 1,
        selectedColor: chosenColor,
        selectedSize: chosenSize,
        imageUrl: prod.imageUrls[0] || '',
        category: prod.category,
      };

      addToCart(newItem, false);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DCC9A6', '#B67355', '#1F1F1F'],
      });

      success(
        isArabic
          ? `تمت إضافة "${prod.name}" إلى طلبكِ بنجاح!`
          : `"${prod.name}" added to your order!`,
        isArabic ? 'تمت الإضافة' : 'Added to Order'
      );
    } catch (err) {
      console.warn('Upsell add error:', err);
    } finally {
      setTimeout(() => setAddingUpsellId(null), 500);
    }
  };

  // Auth Guard States if user is unauthenticated
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Shipping details
  const [formData, setFormData] = useState<CustomerDetails>({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    governorate: 'Cairo (القاهرة)',
    city: '',
    address: '',
    buildingNumber: '',
    notes: '',
  });

  const [placingOrder, setPlacingOrder] = useState(false);

  const effectiveFullName = formData.fullName || user?.displayName || '';
  const effectiveEmail = formData.email || user?.email || '';

  // Dynamic shipping calculation with free shipping threshold & coupons
  const isFreeDelivery = subtotal >= shippingSettings.freeShippingThreshold && shippingSettings.freeShippingThreshold > 0;
  const dynamicShippingFee = isFreeDelivery ? 0 : calculateDeliveryFee(formData.governorate, subtotal, shippingSettings);
  
  // Checkout session ID for abandoned checkout tracking
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = sessionStorage.getItem('armia_checkout_sid');
      if (!sid) {
        sid = 'chk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        sessionStorage.setItem('armia_checkout_sid', sid);
      }
      setCheckoutSessionId(sid);
    }
  }, []);

  // Debounced auto-save abandoned checkout in the background
  useEffect(() => {
    if (!checkoutSessionId || items.length === 0) return;
    const hasContact = Boolean(formData.phone?.trim() || formData.email?.trim() || user?.email);
    if (!hasContact) return;

    const timer = setTimeout(() => {
      saveAbandonedCheckout(
        checkoutSessionId,
        items,
        {
          ...formData,
          fullName: effectiveFullName,
          email: effectiveEmail,
        },
        subtotal,
        appliedDiscount || undefined,
        user?.uid
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData, items, subtotal, appliedDiscount, user, checkoutSessionId, effectiveFullName, effectiveEmail]);

  // Total Due calculation (Subtotal - Discount + Shipping)
  const dynamicTotalAmount = Math.max(0, subtotal - discountAmount) + dynamicShippingFee;

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setApplyingCoupon(true);
    const result = await applyCoupon(couponInput.trim());
    setApplyingCoupon(false);

    if (result.success) {
      success(result.message, isArabic ? 'تم تطبيق الخصم' : 'Coupon Applied');
      setCouponInput('');
    } else {
      error(result.message, isArabic ? 'خطأ في الكوبون' : 'Invalid Code');
    }
  };

  const matchEgyptianGovernorate = (
    addr: Record<string, string>,
    displayName: string,
    zones: ShippingZone[]
  ): ShippingZone | undefined => {
    const fullText = `${addr.state || ''} ${addr.province || ''} ${addr.county || ''} ${addr.city || ''} ${addr.town || ''} ${addr.village || ''} ${addr.suburb || ''} ${addr.resort || ''} ${displayName || ''}`.toLowerCase();

    const rules: { keywords: string[]; zoneId: string }[] = [
      {
        keywords: [
          'matrouh', 'matruh', 'مطروح', 'sahel', 'north coast', 'الساحل', 'ستيلا', 'stella',
          'العلمين', 'alamein', 'el alamein', 'الضبعة', 'el dabaa', 'dabaa',
          'marina', 'مارينا', 'سيدي عبد الرحمن', 'sidi abdel rahman', 'ras el hekma', 'رأس الحكمة',
          'fuka', 'فوكة', 'marassi', 'مراسي', 'hacienda', 'هاسيندا', 'amwaj', 'أمواج'
        ],
        zoneId: 'matrouh',
      },
      {
        keywords: [
          'cairo', 'قاهرة', 'القاهرة', 'tagamoa', 'تجمع', 'rehab', 'رحاب', 'madinaty', 'مدينتي',
          'nasr city', 'مدينة نصر', 'heliopolis', 'مصر الجديدة', 'maadi', 'معادي',
          'shorouk', 'شروق', 'badr', 'بدر', 'zamalek', 'زمالك', 'katameya', 'قطامية', 'new cairo'
        ],
        zoneId: 'cairo',
      },
      {
        keywords: [
          'giza', 'جيزة', 'الجيزة', 'october', 'اكتوبر', 'أكتوبر', 'zayed', 'زايد',
          'dokki', 'دقي', 'الدقي', 'mohandessin', 'مهندسين', 'المهندسين', 'haram', 'هرم',
          'faisal', 'فيصل', 'smart village', 'القرية الذكية', 'hawamdia', 'badrashein'
        ],
        zoneId: 'giza',
      },
      {
        keywords: [
          'alexandria', 'alex', 'إسكندرية', 'اسكندرية', 'الإسكندرية', 'الاسكندرية',
          'smouha', 'سموحة', 'miami', 'ميامي', 'agami', 'عجمي', 'montaza', 'منتزه',
          'loran', 'لوران', 'stanley', 'ستانلي', 'sidi gaber', 'سيدي جابر', 'gleem', 'جليم'
        ],
        zoneId: 'alexandria',
      },
      {
        keywords: ['qalyubia', 'قليوبية', 'القليوبية', 'banha', 'بنها', 'shubra', 'شبرا الخيمة', 'obour', 'العبور', 'khanka'],
        zoneId: 'qalyubia',
      },
      {
        keywords: ['sharqia', 'شرقية', 'الشرقية', 'zagazig', 'الزقازيق', '10th of ramadan', 'العاشر من رمضان', 'belbeis'],
        zoneId: 'sharqia',
      },
      {
        keywords: ['dakahlia', 'دقهلية', 'الدقهلية', 'mansoura', 'المنصورة', 'talkha', 'طلخا', 'mit ghamr'],
        zoneId: 'dakahlia',
      },
      {
        keywords: ['gharbia', 'غربية', 'الغربية', 'tanta', 'طنطا', 'mahalla', 'المحلة الكبرى'],
        zoneId: 'gharbia',
      },
      {
        keywords: ['monufia', 'منوفية', 'المنوفية', 'shebin', 'شبين الكوم', 'sadat city', 'مدينة السادات', 'menouf', 'ashmoon'],
        zoneId: 'monufia',
      },
      {
        keywords: ['beheira', 'بحيرة', 'البحيرة', 'damanhour', 'دمنهور', 'kafr el dawwar', 'كفر الدوار', 'rashid', 'رشيد'],
        zoneId: 'beheira',
      },
      {
        keywords: ['kafr el sheikh', 'كفر الشيخ', 'دسوق', 'desouk', 'baltim', 'بلطيم'],
        zoneId: 'kafr-el-sheikh',
      },
      {
        keywords: ['damietta', 'دمياط', 'ras el bar', 'رأس البر'],
        zoneId: 'damietta',
      },
      {
        keywords: ['port said', 'بورسعيد', 'بورفؤاد', 'port fouad'],
        zoneId: 'port-said',
      },
      {
        keywords: ['ismailia', 'إسماعيلية', 'الإسماعيلية', 'فايد', 'fayed'],
        zoneId: 'ismailia',
      },
      {
        keywords: ['suez', 'سويس', 'السويس', 'ain sokhna', 'عين سخنة', 'sokhna'],
        zoneId: 'suez',
      },
      {
        keywords: ['faiyum', 'fayoum', 'فيوم', 'الفيوم'],
        zoneId: 'faiyum',
      },
      {
        keywords: ['beni suef', 'بني سويف'],
        zoneId: 'beni-suef',
      },
      {
        keywords: ['minya', 'منيا', 'المنيا', 'ملوي', 'mallawi'],
        zoneId: 'minya',
      },
      {
        keywords: ['asyut', 'assiut', 'أسيوط', 'اسيوط'],
        zoneId: 'asyut',
      },
      {
        keywords: ['sohag', 'سوهاج', 'tahta', 'طهطا'],
        zoneId: 'sohag',
      },
      {
        keywords: ['qena', 'قنا', 'nag hammadi', 'نجع حمادي'],
        zoneId: 'qena',
      },
      {
        keywords: ['luxor', 'أقصر', 'الأقصر'],
        zoneId: 'luxor',
      },
      {
        keywords: ['aswan', 'أسوان', 'اسوان', 'نوبة', 'nubia'],
        zoneId: 'aswan',
      },
      {
        keywords: [
          'red sea', 'بحر أحمر', 'البحر الأحمر', 'hurghada', 'غردقة', 'الغردقة',
          'gouna', 'el gouna', 'الجونة', 'safaga', 'سفاجا', 'marsa alam', 'مرسى علم'
        ],
        zoneId: 'red-sea',
      },
      {
        keywords: [
          'south sinai', 'جنوب سيناء', 'sharm', 'شرم الشيخ', 'dahab', 'دهب',
          'nuweiba', 'نويبع', 'ras sedr', 'رأس سدر', 'taba', 'طابا'
        ],
        zoneId: 'south-sinai',
      },
      {
        keywords: ['north sinai', 'شمال سيناء', 'arish', 'العريش'],
        zoneId: 'north-sinai',
      },
      {
        keywords: ['new valley', 'وادي جديد', 'الوادي الجديد', 'kharga', 'الخارجة', 'dakhla', 'الداخلة'],
        zoneId: 'new-valley',
      },
    ];

    for (const rule of rules) {
      if (rule.keywords.some((kw) => fullText.includes(kw))) {
        const match = zones.find((z) => z.id === rule.zoneId);
        if (match) return match;
      }
    }

    return zones.find((z) => {
      const en = z.governorate.toLowerCase();
      const ar = z.governorateArabic;
      return fullText.includes(en) || (ar && fullText.includes(ar));
    });
  };

  const [locatingAddress, setLocatingAddress] = useState(false);

  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      error(isArabic ? 'خاصية تحديد الموقع غير مدعومة في متصفحكِ' : 'Geolocation is not supported by your browser.');
      return;
    }

    setLocatingAddress(true);
    info(
      isArabic ? 'جاري تحديد موقعكِ بدقة عبر GPS...' : 'Detecting your GPS location...',
      isArabic ? 'تحديد الموقع' : 'Location'
    );

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=${isArabic ? 'ar' : 'en'}`
          );

          if (!res.ok) throw new Error('Geocoding service unavailable');
          const data = await res.json();
          const addr = data.address || {};

          // 1. Detect City / District / Resort / Village
          const detectedCity =
            addr.village ||
            addr.resort ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.city_district ||
            addr.quarter ||
            addr.town ||
            addr.city ||
            addr.county ||
            addr.residential ||
            addr.hamlet ||
            (data.display_name ? data.display_name.split(',')[0]?.trim() : '') ||
            '';

          // 2. Detect Detailed Street & Landmark
          const streetParts = [
            addr.road,
            addr.residential,
            addr.village,
            addr.suburb,
          ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

          const detectedStreet =
            streetParts.join('، ') ||
            (data.display_name ? data.display_name.split(',').slice(0, 3).join('، ') : '') ||
            '';

          // 3. Match Egyptian Governorate with 100% precision
          const matchedZone = matchEgyptianGovernorate(addr, data.display_name || '', activeZones);

          setFormData((prev) => ({
            ...prev,
            ...(matchedZone ? { governorate: `${matchedZone.governorate} (${matchedZone.governorateArabic})` } : {}),
            city: detectedCity || prev.city,
            address: detectedStreet || prev.address,
            // buildingNumber is intentionally left blank for customer to enter
          }));

          success(
            isArabic
              ? 'تم تحديد المحافظة والحي والشارع! يرجى كتابة رقم العمارة/الفيلا والشقة.'
              : 'Location detected! Please enter your Building/Villa & Apartment number.',
            isArabic ? 'تم تحديد العنوان' : 'Address Detected'
          );
        } catch (err) {
          console.warn('Location detection notice:', err);
          error(
            isArabic
              ? 'تعذر جلب تفاصيل الشارع، يرجى كتابة العنوان يدوياً'
              : 'Could not fetch detailed street address. Please type it manually.'
          );
        } finally {
          setLocatingAddress(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocatingAddress(false);
        if (err.code === err.PERMISSION_DENIED) {
          error(
            isArabic
              ? 'يرجى السماح بالوصول للموقع في متصفحكِ لتحديد العنوان تلقائياً'
              : 'Please allow location permission in browser to detect your address.'
          );
        } else {
          error(
            isArabic
              ? 'تعذر الوصول لإحداثيات GPS، يرجى كتابة العنوان'
              : 'GPS unavailable. Please enter address manually.'
          );
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCopyInstapay = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText('01204000195');
      setCopiedInstapay(true);
      success(
        isArabic ? 'تم نسخ رقم إنستاباي 01204000195' : 'Instapay number 01204000195 copied!',
        isArabic ? 'تم النسخ' : 'Copied'
      );
      setTimeout(() => setCopiedInstapay(false), 3000);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      // 1. Instant client compression
      const { blob, dataUrl } = await compressImage(file, 1400, 1800, 0.85);

      // 2. Race upload with 3s timeout fallback to dataUrl
      const uploadWithTimeout = async (): Promise<string> => {
        const storageRef = ref(storage, `receipts/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
        const snap = await uploadBytes(storageRef, blob);
        return await getDownloadURL(snap.ref);
      };

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 3000)
      );

      try {
        const downloadUrl = await Promise.race([uploadWithTimeout(), timeoutPromise]);
        setReceiptUrl(downloadUrl);
        success(
          isArabic ? 'تم رفع إيصال التحويل بنجاح!' : 'Payment receipt uploaded successfully!',
          isArabic ? 'تم الإرفاق' : 'Receipt Attached'
        );
      } catch {
        // Direct dataUrl attachment fallback
        setReceiptUrl(dataUrl);
        success(
          isArabic ? 'تم إرفاق صورة الإيصال بنجاح!' : 'Payment receipt attached successfully!',
          isArabic ? 'تم الإرفاق' : 'Receipt Attached'
        );
      }
    } catch (err) {
      console.error('Receipt upload error:', err);
      error(isArabic ? 'فشل معالجة الإيصال، يرجى المحاولة مرة أخرى' : 'Failed to process receipt image.');
    } finally {
      setUploadingReceipt(false);
      e.target.value = '';
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      setAuthError('');
      await loginWithGoogle();
      success(isArabic ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully with Google!');
    } catch (err: unknown) {
      console.error(err);
      setAuthError(isArabic ? 'فشل تسجيل الدخول عبر Google' : 'Google sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (authMode === 'signup') {
        if (!authName.trim()) {
          setAuthError(isArabic ? 'الاسم مطلوب' : 'Full name is required');
          setAuthLoading(false);
          return;
        }
        await signupWithEmail(authEmail, authPassword, authName.trim());
        success(isArabic ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
      } else {
        await loginWithEmail(authEmail, authPassword);
        success(isArabic ? 'تم تسجيل الدخول بنجاح!' : 'Signed in successfully!');
      }
    } catch (err: unknown) {
      console.error(err);
      setAuthError((err as Error).message || (isArabic ? 'فشل التحقق من البيانات' : 'Authentication failed. Please check credentials.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      error(isArabic ? 'يرجى تسجيل الدخول أولاً' : 'Please sign in or create an account to place your order.');
      return;
    }

    if (!effectiveFullName.trim()) {
      error(isArabic ? 'الاسم الكامل مطلوب' : 'Full Name is required.');
      return;
    }

    if (!formData.phone.trim()) {
      error(isArabic ? 'رقم الهاتف مطلوب للتوصيل' : 'Primary phone number is required for courier delivery.');
      return;
    }

    if (!formData.city.trim()) {
      error(isArabic ? 'يرجى تحديد المدينة أو المنطقة' : 'City / District is required for courier delivery.');
      return;
    }

    if (!formData.address.trim()) {
      error(isArabic ? 'يرجى كتابة العنوان بالتفصيل' : 'Detailed street address is required.');
      return;
    }

    if (!formData.buildingNumber?.trim()) {
      error(
        isArabic
          ? 'يرجى كتابة رقم العمارة / الفيلا ورقم الشقة لتسليم المندوب'
          : 'Building / Villa & Apartment number is mandatory for courier delivery.',
        isArabic ? 'رقم العمارة والشقة إلزامي' : 'Building Number Required'
      );
      return;
    }

    // Strict Instapay Validation: Customer MUST upload receipt
    if (paymentMethod === 'INSTAPAY' && !receiptUrl) {
      error(
        isArabic
          ? 'يرجى إرفاق لقطة شاشة لإيصال تحويل إنستاباي أولاً لإتمام طلبكِ'
          : 'Please upload your Instapay payment confirmation receipt before placing the order.',
        isArabic ? 'مطلوب إيصال التحويل' : 'Receipt Required'
      );
      return;
    }

    setPlacingOrder(true);

    try {
      const generatedOrderId = generateOrderId();

      const combinedAddress = formData.buildingNumber?.trim()
        ? `${formData.buildingNumber.trim()}، ${formData.address.trim()}`
        : formData.address.trim();

      const orderPayload: Order = {
        orderId: generatedOrderId,
        customerUid: user.uid,
        customerDetails: {
          fullName: effectiveFullName.trim(),
          email: effectiveEmail.trim() || user.email || 'client@armiaboutique.com',
          phone: formData.phone.trim(),
          alternatePhone: formData.alternatePhone?.trim() || '',
          governorate: formData.governorate,
          city: formData.city.trim(),
          address: combinedAddress,
          buildingNumber: formData.buildingNumber?.trim() || '',
          notes: formData.notes?.trim() || '',
        },
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          selectedColor: it.selectedColor,
          selectedSize: it.selectedSize,
          imageUrl: it.imageUrl,
          category: it.category,
        })),
        subtotal,
        discountAmount: discountAmount || 0,
        appliedDiscount: appliedDiscount || undefined,
        shippingFee: dynamicShippingFee,
        totalAmount: dynamicTotalAmount,
        paymentMethod: paymentMethod,
        receiptUrl: paymentMethod === 'INSTAPAY' ? receiptUrl : undefined,
        instapaySenderAccount: paymentMethod === 'INSTAPAY' ? senderAccount.trim() || undefined : undefined,
        paymentStatus: paymentMethod === 'INSTAPAY' ? 'pending_verification' : 'paid',
        status: 'pending',
        createdAt: null,
      };

      const docId = await createOrderInFirestore(orderPayload);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#DCC9A6', '#B67355', '#1F1F1F'],
      });

      clearCart();
      if (checkoutSessionId) {
        await markAbandonedCheckoutRecovered(checkoutSessionId);
      }
      success(
        isArabic
          ? paymentMethod === 'INSTAPAY'
            ? 'تم استلام طلبكِ وإيصال إنستاباي بنجاح! سيتم مراجعته وتأكيد الشحن فوراً.'
            : 'تم تأكيد طلب الدفع عند الاستلام بنجاح!'
          : 'Your order has been placed successfully!',
        isArabic ? 'تم تسجيل الطلب' : 'Order Confirmed'
      );
      router.push(`/order/${docId}?orderId=${generatedOrderId}`);
    } catch (err: unknown) {
      console.error('Order placement failed:', err);
      error(isArabic ? 'حدث خطأ في تسجيل الطلب، يرجى المحاولة مرة أخرى' : 'Failed to submit order. Please try again or contact support.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <div className="max-w-md mx-auto my-28 p-8 text-center flex-grow">
          <div className="w-10 h-10 border-2 border-[#B67355] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-sans tracking-widest text-[#8E8A85] uppercase">
            {isArabic ? 'جاري التحميل...' : 'Loading Checkout...'}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <div className="max-w-md mx-auto my-20 p-8 bg-white border border-[#E8E2D8] text-center flex-grow rounded-xl">
          <ShoppingBag className="w-12 h-12 text-[#8E8A85] mx-auto mb-3" />
          <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mb-1">
            {t.cart.emptyTitle}
          </h2>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            {t.cart.emptySubtitle}
          </p>
          <Link
            href="/collections"
            className="inline-block bg-[#1F1F1F] text-[#DCC9A6] px-8 py-3 text-xs uppercase tracking-widest font-sans font-bold hover:bg-[#B67355] transition-colors rounded"
          >
            {t.cart.explorePieces}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const activeZones = shippingSettings.zones.filter((z) => z.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[#8E8A85] hover:text-[#B67355] transition-colors"
            >
              <BackIcon className="w-4 h-4" />
              <span>{t.checkout.backToCart}</span>
            </Link>
            <h1 className="font-serif text-3xl font-bold text-[#1F1F1F] mt-3">
              {t.checkout.title}
            </h1>
            <p className="text-xs text-[#8E8A85] font-sans mt-1">
              {t.checkout.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Checkout Guard or Shipping Details Form (7 Cols) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* CHECKOUT GUARD: If User is Not Authenticated */}
              {!user ? (
                <div className="bg-white border-2 border-[#DCC9A6] p-6 sm:p-8 shadow-sm rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#EDE3CF] flex items-center justify-center text-[#B67355]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                        {isArabic ? 'تسجيل الدخول لإتمام طلبك' : 'Sign In to Complete Your Order'}
                      </h3>
                      <p className="text-xs text-[#8E8A85] font-sans">
                        {isArabic
                          ? 'تسجيل الدخول يحفظ تفاصيل تتبع شحنتك وطلباتك السابقة في حسابك.'
                          : 'Quick sign in saves your order tracking details to your account.'}
                      </p>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8E2D8] py-3 text-xs font-sans font-medium text-[#1F1F1F] hover:bg-[#FAF8F5] hover:border-[#DCC9A6] transition-all shadow-sm mb-4 rounded"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {isArabic ? 'المتابعة السريعة بحساب Google' : 'Continue with Google Account'}
                    </span>
                  </button>

                  <div className="relative flex items-center justify-center my-4">
                    <div className="border-t border-[#E8E2D8] w-full" />
                    <span className="bg-white px-3 text-[11px] text-[#8E8A85] uppercase font-sans tracking-wider absolute">
                      {isArabic ? 'أو بالبريد الإلكتروني' : 'Or with Email'}
                    </span>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                          {isArabic ? 'الاسم الكامل *' : 'Full Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder={isArabic ? 'مثال: نورهان عادل' : 'e.g. Salma Hassan'}
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                        {isArabic ? 'البريد الإلكتروني *' : 'Email Address *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                        {isArabic ? 'كلمة المرور *' : 'Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3 text-xs uppercase font-sans font-bold tracking-wider hover:bg-[#B67355] hover:text-white transition-all shadow rounded disabled:opacity-50"
                    >
                      {authLoading
                        ? isArabic ? 'جاري التحقق...' : 'Authenticating...'
                        : authMode === 'signin'
                        ? isArabic ? 'تسجيل الدخول ومتابعة الطلب' : 'Sign In & Continue'
                        : isArabic ? 'إنشاء حساب جديد ومتابعة الطلب' : 'Create Account & Continue'}
                    </button>
                  </form>

                  <div className="mt-4 text-center text-xs text-[#8E8A85]">
                    {authMode === 'signin' ? (
                      <p>
                        {isArabic ? 'ليس لديكِ حساب بعد؟ ' : "Don't have an account? "}
                        <button
                          type="button"
                          onClick={() => setAuthMode('signup')}
                          className="text-[#B67355] font-semibold underline underline-offset-4"
                        >
                          {isArabic ? 'إنشاء حساب جديد' : 'Create account'}
                        </button>
                      </p>
                    ) : (
                      <p>
                        {isArabic ? 'لديك حساب بالفعل؟ ' : 'Already registered? '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('signin')}
                          className="text-[#B67355] font-semibold underline underline-offset-4"
                        >
                          {isArabic ? 'تسجيل الدخول' : 'Sign in'}
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Authenticated User Status - Luxury Atelier Client Badge */
                <div className="bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] border border-[#DCC9A6] p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#1F1F1F] text-[#DCC9A6] flex items-center justify-center font-serif text-sm font-bold shadow-sm border border-[#DCC9A6]/40">
                      {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-sm font-bold text-[#1F1F1F]">
                          {user.displayName || user.email?.split('@')[0]}
                        </p>
                        <span className="text-[10px] uppercase font-sans font-extrabold bg-[#FAF0E6] text-[#B67355] px-2 py-0.5 rounded border border-[#DCC9A6]">
                          ARMIA VIP Client
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-[#8E8A85] mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-sans text-emerald-800 bg-emerald-50 px-3 py-1 border border-emerald-200 font-bold rounded-full shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isArabic ? 'حساب موثق' : 'Verified Client'}</span>
                  </span>
                </div>
              )}

              {/* SHIPPING DETAILS FORM */}
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-6 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#DCC9A6] flex items-center justify-center text-[#B67355] shrink-0 shadow-2xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                        {isArabic ? '١. بيانات الشحن وتوصيل الطلب' : '1. Delivery & Recipient Details'}
                      </h3>
                      <p className="text-[11px] font-sans text-[#8E8A85]">
                        {isArabic ? 'توصيل سريع لكافة المحافظات مع المعاينة عند الاستلام' : 'Express courier delivery with free doorstep inspection'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {t.checkout.fullName}
                    </label>
                    <input
                      type="text"
                      required
                      value={effectiveFullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder={t.checkout.fullNamePlaceholder}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {t.checkout.phone}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t.checkout.phonePlaceholder}
                      dir="ltr"
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                    />
                    <span className="text-[10px] text-[#8E8A85] font-sans mt-0.5 block">
                      {isArabic ? 'ضروري لتنسيق وتأكيد موعد التوصيل' : 'Required for courier delivery coordination'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {t.checkout.alternatePhone}
                    </label>
                    <input
                      type="tel"
                      value={formData.alternatePhone}
                      onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                      placeholder={t.checkout.alternatePhonePlaceholder}
                      dir="ltr"
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                    />
                  </div>

                  {/* 1-TAP GPS LOCATION FINDER */}
                  <div className="sm:col-span-2 bg-[#FAF7F2] border border-[#DCC9A6] p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#B67355] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1F1F1F] block">
                          {isArabic ? 'تحديد العنوان تلقائياً بنقرة واحدة (GPS)' : '1-Tap Fast GPS Address Finder'}
                        </span>
                        <span className="text-[10px] text-[#8E8A85] block">
                          {isArabic ? 'يحدد المحافظة والحي والشارع فوراً لتسهيل وصول المندوب' : 'Auto-detects governorate, city and street for courier accuracy'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locatingAddress}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1F1F1F] hover:bg-[#B67355] text-[#DCC9A6] hover:text-white rounded text-xs font-sans font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm shrink-0"
                    >
                      {locatingAddress ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DCC9A6]" />
                          <span>{isArabic ? 'جاري تحديد موقعكِ...' : 'Locating GPS...'}</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5 text-[#DCC9A6]" />
                          <span>{isArabic ? '📍 تحديد موقعي الآن' : '📍 Use My Current Location'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] font-semibold">
                        {t.checkout.governorate}
                      </label>
                      <span className="text-[11px] text-[#B67355] font-semibold">
                        {t.checkout.shippingFee}: {dynamicShippingFee === 0 ? t.checkout.free : `EGP ${dynamicShippingFee.toFixed(2)}`}
                      </span>
                    </div>
                    <select
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans text-[#1F1F1F] focus:outline-none focus:border-[#B67355] rounded"
                    >
                      {activeZones.map((zone) => (
                        <option key={zone.id} value={`${zone.governorate} (${zone.governorateArabic})`}>
                          {isArabic ? `${zone.governorateArabic} (${zone.governorate})` : `${zone.governorate} (${zone.governorateArabic})`} — EGP {zone.rate} ({zone.estimatedDays})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {t.checkout.city}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder={t.checkout.selectCity}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {t.checkout.address}
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={t.checkout.addressPlaceholder}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold flex items-center justify-between">
                      <span>
                        {isArabic ? 'رقم العمارة / الفيلا ورقم الشقة *' : 'Building / Villa & Apartment Number *'}
                      </span>
                      <span className="text-[10px] text-red-600 font-bold">
                        {isArabic ? 'إلزامي لتسليم المندوب' : 'Mandatory for courier delivery'}
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.buildingNumber || ''}
                      onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
                      placeholder={isArabic ? 'مثال: عمارة 15 - شقة 4 / فيلا 22' : 'e.g. Building 15, Apt 4 / Villa 22'}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {t.checkout.orderNotes}
                    </label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t.checkout.orderNotesPlaceholder}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                    />
                  </div>
                </div>

                {/* ADVANCED BILINGUAL PAYMENT METHODS SECTION */}
                <div className="pt-6 border-t border-[#E8E2D8] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-sans uppercase tracking-wider text-[#1F1F1F] font-bold">
                      {t.checkout.paymentMethod}
                    </h4>
                    <span className="text-[11px] text-[#8E8A85]">
                      {isArabic ? 'اختاري وسيلة الدفع المناسبة لكِ' : 'Select your payment option'}
                    </span>
                  </div>

                  {/* Payment Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* Option 1: Cash on Delivery (COD) */}
                    <div
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-4 border-2 cursor-pointer transition-all rounded-xl relative ${
                        paymentMethod === 'COD'
                          ? 'border-[#B67355] bg-[#FAF7F2] shadow-sm ring-1 ring-[#B67355]'
                          : 'border-[#E8E2D8] bg-white hover:border-[#DCC9A6]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                            paymentMethod === 'COD'
                              ? 'border-[#B67355] bg-[#B67355]'
                              : 'border-[#CCCCCC] bg-white'
                          }`}
                        >
                          {paymentMethod === 'COD' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                              {t.checkout.cashOnDelivery}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-[#B67355] uppercase bg-[#FAF0E6] px-2 py-0.5 border border-[#DCC9A6] rounded">
                              COD
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8E8A85] font-sans mt-1 leading-relaxed">
                            {t.checkout.cashOnDeliveryDesc}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Instapay Transfer */}
                    <div
                      onClick={() => setPaymentMethod('INSTAPAY')}
                      className={`p-4 border-2 cursor-pointer transition-all rounded-xl relative ${
                        paymentMethod === 'INSTAPAY'
                          ? 'border-[#B67355] bg-[#FAF7F2] shadow-sm ring-1 ring-[#B67355]'
                          : 'border-[#E8E2D8] bg-white hover:border-[#DCC9A6]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                            paymentMethod === 'INSTAPAY'
                              ? 'border-[#B67355] bg-[#B67355]'
                              : 'border-[#CCCCCC] bg-white'
                          }`}
                        >
                          {paymentMethod === 'INSTAPAY' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                              {t.checkout.instapay}
                            </span>
                            <span className="text-[10px] font-sans font-bold text-white uppercase bg-[#B67355] px-2 py-0.5 rounded shadow-sm">
                              INSTAPAY
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8E8A85] font-sans mt-1 leading-relaxed">
                            {t.checkout.instapayDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* INSTAPAY TRANSFER & RECEIPT UPLOAD PANEL */}
                  {paymentMethod === 'INSTAPAY' && (
                    <div className="bg-[#FAF7F2] border border-[#DCC9A6] p-5 rounded-xl space-y-5 animate-in fade-in duration-300">
                      
                      {/* Instapay Account Banner */}
                      <div className="bg-white border border-[#E8E2D8] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-[#B67355]">
                            {t.checkout.instapayNumber}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-lg font-extrabold text-[#1F1F1F] tracking-wider">
                              01204000195
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyInstapay}
                              className="inline-flex items-center gap-1 bg-[#1F1F1F] text-[#DCC9A6] hover:bg-[#B67355] hover:text-white px-2.5 py-1 text-xs font-sans rounded transition-all active:scale-95 shadow-sm"
                            >
                              {copiedInstapay ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{t.checkout.instapayCopied}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{t.checkout.instapayCopy}</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-[#8E8A85]">
                            {t.checkout.instapayName}: <strong className="text-[#1F1F1F]">armia emad</strong>
                          </p>
                        </div>

                        <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E8E2D8]">
                          <span className="text-[10px] uppercase font-sans font-bold text-[#8E8A85]">
                            {t.checkout.instapayAmountToTransfer}
                          </span>
                          <p className="font-serif text-lg font-extrabold text-[#B67355]">
                            EGP {dynamicTotalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="text-xs text-[#1F1F1F] space-y-1.5 bg-white/60 p-3 rounded border border-[#E8E2D8]/60">
                        <div className="flex items-center gap-2 font-semibold text-[#B67355]">
                          <Info className="w-4 h-4" />
                          <span>
                            {isArabic ? 'خطوات التحويل وتأكيد الطلب:' : 'Transfer & Confirmation Steps:'}
                          </span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[#8E8A85] text-[11px] leading-relaxed">
                          <li>
                            {isArabic
                              ? `افتحي تطبيق إنستاباي وحوّلي المبلغ المطلوب (${dynamicTotalAmount.toFixed(2)} ج.م) لرقم 01204000195.`
                              : `Open your Instapay app and transfer EGP ${dynamicTotalAmount.toFixed(2)} to 01204000195.`}
                          </li>
                          <li>
                            {isArabic
                              ? 'التقطي لقطة شاشة (Screenshot) لإيصال التحويل الناجح.'
                              : 'Capture a screenshot of your successful transfer receipt.'}
                          </li>
                          <li>
                            {isArabic
                              ? 'ارفعي صورة الإيصال في المربع بالأسفل قبل الضغط على تأكيد الطلب.'
                              : 'Upload the receipt screenshot below before submitting your order.'}
                          </li>
                        </ol>
                      </div>

                      {/* Receipt Upload Box */}
                      <div className="space-y-3">
                        <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] font-bold">
                          {t.checkout.uploadReceipt}
                        </label>

                        {!receiptUrl ? (
                          <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-[#DCC9A6] bg-white p-6 rounded-xl cursor-pointer hover:border-[#B67355] transition-all group">
                            <UploadCloud className="w-8 h-8 text-[#B67355] group-hover:scale-110 transition-transform mb-2" />
                            <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                              {uploadingReceipt
                                ? isArabic ? 'جاري رفع ومعالجة الإيصال...' : 'Uploading & Optimizing Receipt...'
                                : isArabic ? 'اضغطي لرفع لقطة شاشة إيصال إنستاباي' : 'Click to Upload Instapay Receipt'}
                            </span>
                            <span className="text-[11px] text-[#8E8A85] font-sans mt-1">
                              {t.checkout.uploadReceiptDesc}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              disabled={uploadingReceipt}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          /* Uploaded Receipt Preview Card */
                          <div className="bg-white border border-[#DCC9A6] p-4 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-16 bg-[#141414] rounded overflow-hidden shrink-0 border border-[#E8E2D8]">
                                <Image
                                  src={receiptUrl}
                                  alt="Payment Receipt"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>{isArabic ? '✓ تم إرفاق الإيصال بنجاح' : '✓ Receipt Attached'}</span>
                                </span>
                                <p className="text-[11px] text-[#8E8A85] mt-1">
                                  {isArabic ? 'جاهز للمراجعة من إدارة الأتيليه' : 'Ready for atelier verification'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="text-xs text-[#B67355] font-semibold underline cursor-pointer hover:text-[#1F1F1F]">
                                <span>{t.checkout.changeReceipt}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleReceiptUpload}
                                  disabled={uploadingReceipt}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setReceiptUrl('')}
                                className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                                title="Remove Receipt"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Optional Sender Account Details */}
                      <div>
                        <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                          {t.checkout.senderAccount}
                        </label>
                        <input
                          type="text"
                          value={senderAccount}
                          onChange={(e) => setSenderAccount(e.target.value)}
                          placeholder={t.checkout.senderAccountPlaceholder}
                          className="w-full bg-white border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355] rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary, Free Shipping Meter & Pre-Purchase Upsell (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E8E2D8] p-6 sm:p-7 shadow-sm sticky top-28 space-y-5 rounded-2xl">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3.5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#B67355]" />
                    <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                      {t.checkout.orderSummary}
                    </h3>
                  </div>
                  <span className="text-xs font-sans text-[#8E8A85] font-semibold">
                    {items.length} {t.cart.itemsCount}
                  </span>
                </div>

                {/* Free Shipping Progress Meter */}
                {shippingSettings.freeShippingThreshold > 0 && (
                  <div className="bg-gradient-to-r from-[#FAF7F2] to-white border border-[#DCC9A6] p-3.5 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-serif font-bold text-[#1F1F1F] flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#B67355]" />
                        <span>
                          {subtotal >= shippingSettings.freeShippingThreshold
                            ? isArabic ? '🎉 مبروك! شحن مجاني مفعل لطلبكِ!' : '🎉 Free Express Delivery Unlocked!'
                            : isArabic
                            ? `أضيفي ${(shippingSettings.freeShippingThreshold - subtotal).toFixed(0)} ج.م لشحن مجاني`
                            : `Add EGP ${(shippingSettings.freeShippingThreshold - subtotal).toFixed(0)} for Free Shipping`}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#B67355]">
                        {Math.min(100, Math.round((subtotal / shippingSettings.freeShippingThreshold) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-[#E8E2D8] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#B67355] to-[#DCC9A6] h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (subtotal / shippingSettings.freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Items preview list */}
                <div className="max-h-56 overflow-y-auto space-y-3 pr-1 divide-y divide-[#E8E2D8]/60">
                  {items.map((item, i) => {
                    const itemBasePrice = item.originalPrice || item.price;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 pt-3 first:pt-0"
                      >
                        <div className="relative w-12 h-16 bg-[#F6F3EE] shrink-0 border border-[#E8E2D8] overflow-hidden rounded-lg shadow-2xs">
                          <Image
                            src={item.imageUrl || ''}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-serif text-xs font-bold text-[#1F1F1F] truncate">
                            {item.name}
                          </h5>
                          <p className="text-[11px] text-[#8E8A85] font-sans mt-0.5">
                            {item.selectedColor.name} • {t.product.selectSize}: {item.selectedSize} • {t.product.quantity}: {item.quantity}
                          </p>
                        </div>
                        <span className="font-serif text-xs font-bold text-[#1F1F1F]">
                          EGP {(itemBasePrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* PRE-PURCHASE CHECKOUT UPSELL (ONLY PRODUCTS WITH ACTIVE OFFERS) */}
                {upsellCandidates.filter((p) => !items.some((it) => it.productId === p.id)).length > 0 && (
                  <div className="pt-3 border-t border-[#E8E2D8]">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#B67355]" />
                        <span className="font-serif text-xs font-bold text-[#1F1F1F]">
                          {isArabic ? 'اكملي إطلالتكِ بعروض خاصة' : 'Complete Your Look • Active Deals'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#B67355] bg-[#FAF0E6] px-2 py-0.5 rounded font-extrabold border border-[#DCC9A6]">
                        {isArabic ? 'حصرية الدفع' : 'Checkout Special'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {upsellCandidates
                        .filter((p) => !items.some((it) => it.productId === p.id))
                        .slice(0, 2)
                        .map((prod) => {
                          const discountSavings = (prod.price - (prod.discountPrice || prod.price)).toFixed(0);
                          const isAdding = addingUpsellId === prod.id;

                          return (
                            <div
                              key={prod.id}
                              className="p-3 bg-gradient-to-r from-[#FAF7F2] to-white border border-[#DCC9A6] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-[#B67355] transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-12 h-16 bg-black rounded-lg overflow-hidden border border-[#DCC9A6]/60 shrink-0 shadow-2xs">
                                  <Image
                                    src={prod.imageUrls[0] || ''}
                                    alt={prod.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h6 className="font-serif text-xs font-bold text-[#1F1F1F] truncate">
                                    {isArabic && prod.nameArabic ? prod.nameArabic : prod.name}
                                  </h6>
                                  <div className="flex items-baseline gap-1.5 mt-0.5">
                                    <span className="font-serif text-xs font-bold text-[#B67355]">
                                      EGP {prod.discountPrice}
                                    </span>
                                    <span className="text-[10px] text-[#8E8A85] line-through font-mono">
                                      EGP {prod.price}
                                    </span>
                                    <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-100/70 px-1 py-0.2 rounded">
                                      {isArabic ? `وفر ${discountSavings}` : `Save ${discountSavings}`}
                                    </span>
                                  </div>

                                  {/* Quick Size selection if product has sizes */}
                                  {prod.sizes && prod.sizes.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[9px] text-[#8E8A85] font-sans">
                                        {isArabic ? 'المقاس:' : 'Size:'}
                                      </span>
                                      <div className="flex gap-1">
                                        {prod.sizes.slice(0, 4).map((sz) => {
                                          const selected = (selectedUpsellSizes[prod.id] || prod.sizes[0]) === sz;
                                          return (
                                            <button
                                              key={sz}
                                              type="button"
                                              onClick={() =>
                                                setSelectedUpsellSizes((prev) => ({ ...prev, [prod.id]: sz }))
                                              }
                                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded border transition-all ${
                                                selected
                                                  ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F]'
                                                  : 'bg-white text-[#1F1F1F] border-[#E8E2D8] hover:border-[#B67355]'
                                              }`}
                                            >
                                              {sz}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 1-Click Add Button */}
                              <button
                                type="button"
                                onClick={() => handleAddCheckoutUpsell(prod)}
                                disabled={isAdding}
                                className="bg-[#1F1F1F] hover:bg-[#B67355] text-[#DCC9A6] hover:text-white px-3 py-2 rounded-lg text-[11px] font-sans font-bold transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1 disabled:opacity-50"
                              >
                                {isAdding ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                                <span>{isArabic ? 'أضيفي' : 'Add'}</span>
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* PROMO CODE VOUCHER INPUT BOX */}
                <div className="pt-2 border-t border-[#E8E2D8]/80">
                  {couponCode ? (
                    <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-emerald-700" />
                        <div>
                          <span className="font-mono font-bold text-emerald-800 tracking-wider">
                            {couponCode}
                          </span>
                          <span className="text-[10px] text-emerald-600 block">
                            {isArabic ? 'تم تطبيق كود الخصم' : 'Promo code applied'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-neutral-400 hover:text-red-600 p-1"
                        title="Remove coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCouponSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder={t.checkout.promoPlaceholder}
                        className="flex-1 bg-[#FAF7F2] border border-[#E8E2D8] px-3 py-2.5 text-xs font-mono uppercase focus:outline-none focus:border-[#B67355] rounded-xl"
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="bg-[#1F1F1F] text-[#DCC9A6] px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#B67355] hover:text-white transition-all disabled:opacity-40 rounded-xl shadow-sm active:scale-95"
                      >
                        {t.checkout.applyCode}
                      </button>
                    </form>
                  )}
                </div>

                {/* Cost calculation Breakdown */}
                <div className="space-y-2.5 border-t border-[#E8E2D8] pt-4 text-xs font-sans text-[#8E8A85]">
                  <div className="flex justify-between">
                    <span>{isArabic ? 'السعر الأصلي (المجموع الفرعي)' : 'Original Price (Subtotal)'}</span>
                    <span className="text-[#1F1F1F] font-semibold font-mono">
                      EGP {subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 border border-emerald-200 rounded-lg">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {isArabic && appliedDiscount?.titleArabic
                            ? appliedDiscount.titleArabic
                            : appliedDiscount?.title || (isArabic ? 'الخصم المطبق' : 'Applied Discount')}
                        </span>
                      </span>
                      <span className="font-mono font-bold">-EGP {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>
                      {t.checkout.shippingFee} ({formData.governorate.split('(')[0].trim()})
                    </span>
                    <span className="text-[#1F1F1F] font-semibold">
                      {dynamicShippingFee === 0 ? (
                        <span className="text-emerald-700 uppercase font-bold">{t.checkout.free}</span>
                      ) : (
                        `EGP ${dynamicShippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="border-t border-[#E8E2D8] pt-3 flex justify-between text-base font-bold text-[#1F1F1F]">
                    <span className="font-serif">{t.checkout.total}</span>
                    <span className="font-serif text-xl text-[#B67355] font-extrabold">
                      EGP {dynamicTotalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Selected Payment Method Badge Note */}
                <div className="p-3 bg-[#FAF7F2] border border-[#DCC9A6] rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#1F1F1F]">
                    <span>{isArabic ? 'طريقة الدفع المختارة:' : 'Selected Payment:'}</span>
                    <span className="text-[#B67355] font-bold">
                      {paymentMethod === 'COD' ? t.checkout.cashOnDelivery : 'Instapay (01204000195)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8E8A85]">
                    {paymentMethod === 'COD' ? t.checkout.codNote : t.checkout.instapayNote}
                  </p>
                </div>

                {/* Grand Confirm Order Button */}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={placingOrder || (paymentMethod === 'INSTAPAY' && !receiptUrl)}
                  className="w-full bg-gradient-to-r from-[#1F1F1F] via-[#2D241E] to-[#1F1F1F] hover:from-[#B67355] hover:to-[#8E523A] text-[#DCC9A6] hover:text-white py-4 text-xs font-sans uppercase tracking-[0.2em] font-extrabold transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 rounded-xl disabled:opacity-50"
                >
                  {placingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin" />
                      <span>{t.checkout.processing}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === 'COD'
                          ? isArabic
                            ? `تأكيد الطلب (دفع عند الاستلام • ${dynamicTotalAmount.toFixed(2)} ج.م)`
                            : `CONFIRM ORDER (COD • EGP ${dynamicTotalAmount.toFixed(2)})`
                          : isArabic
                          ? `تأكيد طلب إنستاباي (${dynamicTotalAmount.toFixed(2)} ج.م)`
                          : `CONFIRM INSTAPAY ORDER (EGP ${dynamicTotalAmount.toFixed(2)})`}
                      </span>
                      <ArrowIcon className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Instapay Receipt Warning if Missing */}
                {paymentMethod === 'INSTAPAY' && !receiptUrl && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 border border-amber-200 rounded-xl text-center font-medium">
                    ⚠️ {t.checkout.receiptRequired}
                  </p>
                )}

                {/* Trust Badges Strip */}
                <div className="pt-3 border-t border-[#E8E2D8] grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1">
                    <ShieldCheck className="w-4 h-4 text-[#B67355] mx-auto" />
                    <span className="text-[9px] text-[#8E8A85] block leading-tight font-sans">
                      {isArabic ? 'معاينة عند الباب' : 'Doorstep Inspection'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <RefreshCw className="w-4 h-4 text-[#B67355] mx-auto" />
                    <span className="text-[9px] text-[#8E8A85] block leading-tight font-sans">
                      {isArabic ? 'استبدال ١٤ يوم' : '14-Day Easy Swap'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Sparkles className="w-4 h-4 text-[#B67355] mx-auto" />
                    <span className="text-[9px] text-[#8E8A85] block leading-tight font-sans">
                      {isArabic ? 'أقمشة أرميا الأصلية' : 'Atelier Quality'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
