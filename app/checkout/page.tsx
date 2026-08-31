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
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { createOrderInFirestore, generateOrderId } from '@/lib/productService';
import {
  getShippingSettings,
  calculateDeliveryFee,
  DEFAULT_SHIPPING_SETTINGS,
} from '@/lib/shippingService';
import { CustomerDetails, Order, ShippingSettings } from '@/types';
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
  } = useCart();

  const { user, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const { t, isArabic } = useLanguage();
  const { success, error } = useToast();
  const mounted = useIsMounted();

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

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
    notes: '',
  });

  const [placingOrder, setPlacingOrder] = useState(false);

  const effectiveFullName = formData.fullName || user?.displayName || '';
  const effectiveEmail = formData.email || user?.email || '';

  // Dynamic shipping calculation with free shipping threshold & coupons
  const isFreeDelivery = subtotal >= shippingSettings.freeShippingThreshold && shippingSettings.freeShippingThreshold > 0;
  const dynamicShippingFee = isFreeDelivery ? 0 : calculateDeliveryFee(formData.governorate, subtotal, shippingSettings);
  
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

    setPlacingOrder(true);

    try {
      const generatedOrderId = generateOrderId();

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
          address: formData.address.trim(),
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
        paymentMethod: 'COD',
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
      success(isArabic ? 'تم تأكيد طلبك بنجاح!' : 'Your order has been placed successfully!', isArabic ? 'تم الطلب' : 'Order Confirmed');
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
        <div className="max-w-md mx-auto my-20 p-8 bg-white border border-[#E8E2D8] text-center flex-grow">
          <ShoppingBag className="w-12 h-12 text-[#8E8A85] mx-auto mb-3" />
          <h2 className="font-serif text-xl font-bold text-[#1F1F1F] mb-1">
            {t.cart.emptyTitle}
          </h2>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            {t.cart.emptySubtitle}
          </p>
          <Link
            href="/collections"
            className="inline-block bg-[#1F1F1F] text-[#DCC9A6] px-8 py-3 text-xs uppercase tracking-widest font-sans font-bold hover:bg-[#B67355] transition-colors"
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
                    <span>{isArabic ? 'تسجيل الدخول السريع عبر Google' : 'Instant Google Sign In'}</span>
                  </button>

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-[1px] bg-[#E8E2D8]" />
                    <span className="text-[10px] text-[#8E8A85] uppercase tracking-widest font-sans">
                      {isArabic ? 'أو بالبريد الإلكتروني' : 'or with email'}
                    </span>
                    <div className="flex-1 h-[1px] bg-[#E8E2D8]" />
                  </div>

                  {authError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* Email & Pass form */}
                  <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                    {authMode === 'signup' && (
                      <div>
                        <label className="block text-[11px] font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-medium">
                          {t.checkout.fullName}
                        </label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder={t.checkout.fullNamePlaceholder}
                          className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-medium">
                        {isArabic ? 'البريد الإلكتروني *' : 'Email Address *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-medium">
                        {isArabic ? 'كلمة المرور *' : 'Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3 text-xs uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-md mt-2 disabled:opacity-50"
                    >
                      <span>
                        {authLoading
                          ? t.checkout.processing
                          : authMode === 'signin'
                          ? isArabic ? 'تسجيل الدخول والمتابعة' : 'Sign In & Continue'
                          : isArabic ? 'إنشاء الحساب والمتابعة' : 'Create Account & Continue'}
                      </span>
                    </button>
                  </form>

                  <div className="mt-4 text-center text-xs font-sans text-[#8E8A85]">
                    {authMode === 'signin' ? (
                      <p>
                        {isArabic ? 'عميل جديد؟ ' : 'New customer? '}
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
                /* Authenticated User Status */
                <div className="bg-white border border-[#E8E2D8] p-4 flex items-center justify-between rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-sans text-[#8E8A85]">
                        {isArabic ? 'تم الطلب بحساب:' : 'Ordering as:'}
                      </p>
                      <p className="font-serif text-sm font-semibold text-[#1F1F1F]">
                        {user.displayName || user.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-sans text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200 font-semibold rounded">
                    {isArabic ? '✓ تم التحقق' : '✓ Authenticated'}
                  </span>
                </div>
              )}

              {/* SHIPPING DETAILS FORM */}
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white border border-[#E8E2D8] p-6 sm:p-8 space-y-6 rounded-xl">
                <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-4">
                  <Truck className="w-5 h-5 text-[#B67355]" />
                  <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                    {t.checkout.customerInfo}
                  </h3>
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
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
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
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
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
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                    />
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
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans text-[#1F1F1F] focus:outline-none focus:border-[#B67355]"
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
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
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
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
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
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] px-3.5 py-2.5 text-xs font-sans focus:outline-none focus:border-[#B67355]"
                    />
                  </div>
                </div>

                {/* Payment Option: Cash on Delivery (COD) */}
                <div className="pt-6 border-t border-[#E8E2D8]">
                  <h4 className="text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-3 font-semibold">
                    {t.checkout.paymentMethod}
                  </h4>
                  <div className="p-4 border-2 border-[#B67355] bg-[#F6F3EE] flex items-center justify-between rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#B67355] flex items-center justify-center text-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <div>
                        <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                          {t.checkout.cashOnDelivery}
                        </span>
                        <p className="text-[11px] text-[#8E8A85] font-sans">
                          {t.checkout.cashOnDeliveryDesc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-sans font-bold text-[#B67355] uppercase tracking-wider bg-white px-2 py-1 border border-[#DCC9A6] rounded">
                      COD
                    </span>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary & Place Order (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-[#E8E2D8] p-6 shadow-sm sticky top-28 space-y-4 rounded-xl">
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F] border-b border-[#E8E2D8] pb-3">
                  {t.checkout.orderSummary} ({items.length} {t.cart.itemsCount})
                </h3>

                {/* Items preview list */}
                <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 pb-3 border-b border-[#E8E2D8]/50 last:border-b-0"
                    >
                      <div className="relative w-12 h-14 bg-[#F6F3EE] shrink-0 border border-[#E8E2D8] overflow-hidden rounded">
                        <Image
                          src={item.imageUrl || ''}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-serif text-xs font-semibold text-[#1F1F1F] truncate">
                          {item.name}
                        </h5>
                        <p className="text-[10px] text-[#8E8A85] font-sans">
                          {item.selectedColor.name} • {t.product.selectSize}: {item.selectedSize} • {t.product.quantity}: {item.quantity}
                        </p>
                      </div>
                      <span className="font-serif text-xs font-bold text-[#1F1F1F]">
                        EGP {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* PROMO CODE VOUCHER INPUT BOX */}
                <div className="pt-3 border-t border-[#E8E2D8]/80">
                  {couponCode ? (
                    <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded flex items-center justify-between text-xs">
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
                        className="flex-1 bg-[#F6F3EE] border border-[#E8E2D8] px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-[#B67355]"
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="bg-[#1F1F1F] text-[#DCC9A6] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#B67355] hover:text-white transition-colors disabled:opacity-40"
                      >
                        {t.checkout.applyCode}
                      </button>
                    </form>
                  )}
                </div>

                {/* Cost calculation Breakdown */}
                <div className="space-y-2 border-t border-[#E8E2D8] pt-4 text-xs font-sans text-[#8E8A85]">
                  <div className="flex justify-between">
                    <span>{t.cart.subtotal}</span>
                    <span className="text-[#1F1F1F] font-semibold font-mono">
                      EGP {subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Applied Discount Line */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 border border-emerald-200 rounded">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {isArabic && appliedDiscount?.titleArabic
                            ? appliedDiscount.titleArabic
                            : appliedDiscount?.title || 'Discount Promotion'}
                        </span>
                      </span>
                      <span className="font-serif">-EGP {discountAmount.toFixed(2)}</span>
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
                    <span className="font-serif text-lg text-[#B67355]">
                      EGP {dynamicTotalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={placingOrder || !user}
                    className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-4 text-xs uppercase tracking-[0.2em] font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#B67355] hover:text-white transition-all shadow-lg active:scale-[0.99] disabled:opacity-40 rounded"
                  >
                    <span>
                      {placingOrder
                        ? t.checkout.processing
                        : !user
                        ? isArabic ? 'يرجى تسجيل الدخول أعلاه أولاً' : 'Sign In Required Above'
                        : t.checkout.placeOrderBtn}
                    </span>
                    {!placingOrder && <ArrowIcon className="w-4 h-4" />}
                  </button>
                  <p className="text-[10px] text-[#8E8A85] text-center font-sans mt-2">
                    {t.checkout.codNote}
                  </p>
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
