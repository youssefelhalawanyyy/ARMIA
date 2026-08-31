'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package,
  LogOut,
  User,
  ShieldAlert,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import AuthModal from '@/components/storefront/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { usePWA } from '@/context/PWAContext';
import { useLanguage } from '@/context/LanguageContext';
import { getCustomerOrders } from '@/lib/productService';
import { Order, OrderStatus } from '@/types';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, logout } = useAuth();
  const { promptInstall, isInstalled } = usePWA();
  const { t, isArabic } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      if (user) {
        setLoadingOrders(true);
        const data = await getCustomerOrders(user.uid);
        setOrders(data);
        setLoadingOrders(false);
      }
    }
    if (user) {
      loadOrders();
    }
  }, [user]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            {isArabic ? 'قيد المراجعة والتأكيد' : 'Pending Confirmation'}
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            {isArabic ? 'تم التأكيد' : 'Confirmed'}
          </span>
        );
      case 'processing':
        return (
          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            {isArabic ? 'جاري التجهيز والتغليف' : 'In Processing'}
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-[#EDE3CF] text-[#B67355] border border-[#DCC9A6] text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            {isArabic ? 'خرج للتوصيل مع المندوب' : 'Out for Delivery'}
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            {isArabic ? 'تم التسليم بنجاح' : 'Delivered'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            {isArabic ? 'ملغي' : 'Cancelled'}
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
        <Navbar />
        <div className="max-w-md mx-auto my-20 p-8 bg-white border border-[#E8E2D8] text-center flex-grow shadow-sm rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[#EDE3CF] flex items-center justify-center mx-auto mb-4 text-[#B67355]">
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-2">
            {isArabic ? 'تسجيل الدخول مطلوب' : 'Sign In to ARMIA'}
          </h2>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            {isArabic
              ? 'يرجى تسجيل الدخول لعرض تفاصيل حسابك وسجل مشترياتك ومتابعة مسار شحناتك.'
              : 'Please sign in to access your order history, tracking updates, and saved preferences.'}
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full bg-[#1F1F1F] text-[#DCC9A6] py-3.5 px-6 text-xs uppercase tracking-[0.2em] font-sans font-bold hover:bg-[#B67355] hover:text-white transition-all shadow-md rounded"
          >
            {isArabic ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}
          </button>
        </div>
        <Footer />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />

      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <span className="text-[11px] font-sans font-semibold tracking-[0.25em] text-[#B67355] uppercase block mb-1">
              {t.account.profile}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              {t.account.title}
            </h1>
            <p className="text-xs text-[#8E8A85] font-sans mt-1">
              {t.account.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Profile Card & Actions (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Profile Card */}
              <div className="bg-white border border-[#E8E2D8] p-6 shadow-sm rounded-xl">
                <div className="flex items-center gap-4 border-b border-[#E8E2D8] pb-6 mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#1F1F1F] text-[#DCC9A6] font-serif text-xl font-bold flex items-center justify-center border border-[#DCC9A6]">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg font-bold text-[#1F1F1F] truncate">
                      {user.displayName || (isArabic ? 'عميل أرميا' : 'Boutique Client')}
                    </h3>
                    <p className="text-xs text-[#8E8A85] font-sans truncate">{user.email}</p>
                    <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 mt-1 rounded font-semibold">
                      {isArabic ? 'عميل مميز (VIP Client)' : 'VIP Client'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {!isInstalled && (
                    <button
                      type="button"
                      onClick={promptInstall}
                      className="w-full flex items-center justify-between p-3 bg-[#141414] text-[#DCC9A6] border border-[#333333] hover:border-[#DCC9A6] transition-colors rounded-lg text-xs font-bold font-sans uppercase tracking-wider"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#DCC9A6]" />
                        <span>{t.account.installBtn}</span>
                      </span>
                      <span className="text-[9px] bg-[#B67355] text-white px-1.5 py-0.5 rounded">
                        PWA
                      </span>
                    </button>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#DCC9A6] text-[#B67355] hover:bg-[#EDE3CF] transition-colors rounded-lg text-xs font-bold font-sans uppercase tracking-wider"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span>{t.nav.adminPortal}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <button
                    onClick={async () => {
                      await logout();
                      router.push('/');
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 border border-red-200 transition-colors rounded-lg text-xs font-bold font-sans uppercase tracking-wider"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.account.logout}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Orders History (8 Cols) */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-[#E8E2D8] p-6 shadow-sm rounded-xl">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#B67355]" />
                    <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                      {t.account.orders}
                    </h3>
                  </div>
                  <span className="text-xs text-[#8E8A85] font-sans">
                    {orders.length} {isArabic ? 'طلبات' : orders.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-2 border-[#B67355] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-[#8E8A85] font-sans">
                      {isArabic ? 'جاري تحميل سجل الطلبات...' : 'Loading order history...'}
                    </p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#F6F3EE] flex items-center justify-center mx-auto text-[#8E8A85]">
                      <Package className="w-6 h-6" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#1F1F1F]">
                      {t.account.noOrders}
                    </h4>
                    <p className="text-xs text-[#8E8A85] font-sans max-w-sm mx-auto">
                      {t.account.noOrdersSubtitle}
                    </p>
                    <Link
                      href="/collections"
                      className="inline-block bg-[#1F1F1F] text-[#DCC9A6] px-6 py-2.5 text-xs font-sans uppercase tracking-wider font-bold hover:bg-[#B67355] hover:text-white transition-colors mt-2 rounded"
                    >
                      {t.cart.explorePieces}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id || order.orderId}
                        className="border border-[#E8E2D8] p-5 hover:border-[#B67355] transition-all rounded-lg"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D8]/60 pb-3 mb-4">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#1F1F1F] tracking-wider block">
                              #{order.orderId}
                            </span>
                            <span className="text-[10px] text-[#8E8A85] font-sans">
                              {order.createdAt ? new Date(order.createdAt as string).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusBadge(order.status)}
                            <Link
                              href={`/order/${order.id || order.orderId}?orderId=${order.orderId}`}
                              className="text-xs font-sans text-[#B67355] hover:underline font-semibold flex items-center gap-1"
                            >
                              <span>{t.account.viewDetails}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>

                        {/* Order Items preview */}
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs font-sans">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {item.imageUrl && (
                                  <div className="relative w-8 h-10 bg-[#F6F3EE] shrink-0 border border-[#E8E2D8] overflow-hidden rounded-sm">
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <span className="font-medium text-[#1F1F1F] truncate">
                                  {item.name} ({item.selectedColor.name}, {item.selectedSize}) × {item.quantity}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-[#1F1F1F] shrink-0">
                                EGP {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total Due */}
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-[#E8E2D8]/60 text-xs font-sans">
                          <span className="text-[#8E8A85]">
                            {isArabic ? 'طريقة الدفع: عند الاستلام (COD)' : 'Payment: Cash on Delivery'}
                          </span>
                          <div className="text-right">
                            <span className="text-[#8E8A85] text-[10px] block">
                              {isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}
                            </span>
                            <span className="font-serif font-bold text-sm text-[#B67355]">
                              EGP {order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
