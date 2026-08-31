'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  MessageCircle,
  ShoppingBag,
  Printer,
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import PrintableInvoice from '@/components/admin/PrintableInvoice';
import { useLanguage } from '@/context/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus } from '@/types';

function OrderTrackingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const docId = params.id as string;
  const urlOrderId = searchParams.get('orderId');

  const { t, isArabic } = useLanguage();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const statusSteps: { status: OrderStatus; label: string; desc: string }[] = [
    {
      status: 'pending',
      label: isArabic ? 'تم استلام الطلب' : 'Order Placed',
      desc: isArabic ? 'تم التسجيل وبانتظار التأكيد' : 'Received & awaiting boutique verification',
    },
    {
      status: 'confirmed',
      label: isArabic ? 'تم تأكيد الطلب' : 'Confirmed',
      desc: isArabic ? 'تمت مراجعة الطلب مع الأتيليه' : 'Verified by atelier team',
    },
    {
      status: 'processing',
      label: isArabic ? 'التجهيز والتغليف' : 'Processing & Packaging',
      desc: isArabic ? 'كي، فحص جودة وتغليف فاخر' : 'Steamed, inspected & boxed',
    },
    {
      status: 'shipped',
      label: isArabic ? 'خرج للتوصيل' : 'Out for Delivery',
      desc: isArabic ? 'مع مندوب الشحن للمحافظة' : 'With courier across Egypt',
    },
    {
      status: 'delivered',
      label: isArabic ? 'تم التسليم' : 'Delivered',
      desc: isArabic ? 'استلام ودفع عند الاستلام' : 'Received & paid via COD',
    },
  ];

  useEffect(() => {
    async function load() {
      if (!docId) return;
      try {
        const orderRef = doc(db, 'orders', docId);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() } as Order);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [docId]);

  const getStepIndex = (status: OrderStatus) => {
    const map: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
      returned: -2,
      cancelled: -1,
    };
    return map[status] ?? 0;
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin" />
        </div>
      ) : !order ? (
        <div className="bg-white border border-[#E8E2D8] p-10 text-center rounded-xl">
          <Package className="w-12 h-12 text-[#8E8A85] mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-1">
            {t.orderConfirmation.title}
          </h2>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            {isArabic ? 'رقم الطلب:' : 'Order Ref:'}{' '}
            <strong className="text-[#1F1F1F] font-mono">{urlOrderId || docId}</strong>.{' '}
            {isArabic ? 'فريقنا يقوم بإعداد تأكيد طلبك الآن.' : 'Our team is preparing your order confirmation.'}
          </p>
          <Link
            href="/account"
            className="bg-[#1F1F1F] text-[#DCC9A6] px-8 py-3 text-xs uppercase tracking-widest font-sans inline-block rounded"
          >
            {isArabic ? 'عرض طلباتي' : 'View My Orders'}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Status Card */}
          <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 shadow-sm rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#B67355]">
                  {t.orderConfirmation.badge}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1F1F] mt-1">
                  {isArabic ? `طلب رقم #${order.orderId}` : `Order #${order.orderId}`}
                </h1>
                <p className="text-xs text-[#8E8A85] font-sans mt-1">
                  {t.orderConfirmation.thankYou},{' '}
                  <strong className="text-[#1F1F1F]">{order.customerDetails?.fullName}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E8E2D8] text-xs font-sans hover:bg-[#F6F3EE] transition-colors rounded"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.orderConfirmation.printReceipt}</span>
                </button>
                <a
                  href={`https://wa.me/201220859992?text=${encodeURIComponent(
                    `مرحباً أرميا بوتيك، أود الاستفسار عن طلبي رقم #${order.orderId}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white text-xs font-sans font-semibold hover:opacity-90 transition-opacity rounded"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.orderConfirmation.whatsappSupport}</span>
                </a>
              </div>
            </div>

            {/* Realtime Order Progress Timeline */}
            <div className="mt-8">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#1F1F1F] mb-6">
                {t.orderConfirmation.timelineTitle}
              </h3>

              <div className="relative">
                {/* Progress line */}
                <div className="hidden sm:block absolute top-1/2 left-4 right-4 h-0.5 bg-[#E8E2D8] -translate-y-1/2 z-0" />
                <div
                  className="hidden sm:block absolute top-1/2 left-4 h-0.5 bg-[#B67355] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStep / (statusSteps.length - 1)) * 100)}%`,
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {statusSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={step.status}
                        className={`flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 text-left sm:text-center p-3 sm:p-0 ${
                          isCurrent ? 'bg-[#F6F3EE] sm:bg-transparent rounded' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-sans transition-all shrink-0 ${
                            isCompleted
                              ? 'bg-[#B67355] text-white ring-4 ring-[#EDE3CF]'
                              : 'bg-white border-2 border-[#E8E2D8] text-[#8E8A85]'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <p
                            className={`font-serif text-xs font-bold leading-tight ${
                              isCompleted ? 'text-[#1F1F1F]' : 'text-[#8E8A85]'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[#8E8A85] font-sans mt-0.5 hidden sm:block">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Order Info & Delivery Address Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping & Contact */}
            <div className="bg-white border border-[#E8E2D8] p-6 space-y-3 rounded-xl">
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3 mb-3">
                <MapPin className="w-4 h-4 text-[#B67355]" />
                <h4 className="font-serif text-sm font-bold text-[#1F1F1F]">
                  {t.orderConfirmation.deliveryDestination}
                </h4>
              </div>
              <div className="text-xs font-sans text-[#1F1F1F] space-y-1">
                <p className="font-semibold">{order.customerDetails?.fullName}</p>
                <p className="text-[#8E8A85]">
                  {order.customerDetails?.address}, {order.customerDetails?.city}
                </p>
                <p className="text-[#8E8A85]">{order.customerDetails?.governorate}</p>
                <p className="pt-1 flex items-center gap-1.5 font-medium text-[#1F1F1F]">
                  <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                  <span dir="ltr">{order.customerDetails?.phone}</span>
                </p>
                {order.customerDetails?.notes && (
                  <p className="pt-2 text-[11px] text-[#B67355] italic bg-[#F6F3EE] p-2 border border-[#E8E2D8] rounded">
                    {isArabic ? 'ملاحظات:' : 'Note:'} {order.customerDetails?.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white border border-[#E8E2D8] p-6 space-y-3 rounded-xl">
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3 mb-3">
                <ShoppingBag className="w-4 h-4 text-[#B67355]" />
                <h4 className="font-serif text-sm font-bold text-[#1F1F1F]">
                  {t.orderConfirmation.paymentSummary}
                </h4>
              </div>
              <div className="text-xs font-sans space-y-2 text-[#8E8A85]">
                <div className="flex justify-between items-center">
                  <span>{isArabic ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                  <span className="text-[#1F1F1F] font-semibold">
                    {order.paymentMethod === 'INSTAPAY' ? (
                      <span className="inline-flex items-center gap-1 text-white bg-[#B67355] px-2 py-0.5 rounded text-[11px] font-bold">
                        ⚡ Instapay (01204000195)
                      </span>
                    ) : (
                      <span className="text-[#1F1F1F]">
                        {isArabic ? 'دفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                      </span>
                    )}
                  </span>
                </div>

                {order.paymentMethod === 'INSTAPAY' && (
                  <div className="p-2.5 bg-[#FAF7F2] border border-[#DCC9A6] rounded text-[11px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[#8E8A85]">
                        {isArabic ? 'حالة مراجعة الإيصال:' : 'Receipt Verification:'}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          order.paymentStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentStatus === 'verified'
                          ? isArabic ? '✓ تم التحقق والتأكيد' : '✓ Verified & Confirmed'
                          : order.paymentStatus === 'rejected'
                          ? isArabic ? '✕ تم رفض الإيصال' : '✕ Receipt Rejected'
                          : isArabic ? '⏳ قيد المراجعة الفورية' : '⏳ Pending Atelier Review'}
                      </span>
                    </div>

                    {order.receiptUrl && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[#8E8A85]">{isArabic ? 'إيصال التحويل:' : 'Attached Receipt:'}</span>
                        <a
                          href={order.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#B67355] font-semibold underline"
                        >
                          {isArabic ? 'معاينة الإيصال' : 'View Uploaded Receipt'}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t.cart.subtotal}:</span>
                  <span className="text-[#1F1F1F] font-semibold font-mono">
                    EGP {order.subtotal?.toFixed(2)}
                  </span>
                </div>
                {order.discountAmount ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>{t.cart.autoDiscount}:</span>
                    <span className="font-mono font-bold">-EGP {order.discountAmount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>{t.checkout.shippingFee}:</span>
                  <span className="text-[#1F1F1F] font-semibold">
                    {order.shippingFee === 0 ? t.checkout.free : `EGP ${order.shippingFee?.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-[#E8E2D8] pt-2 flex justify-between text-sm font-bold text-[#1F1F1F]">
                  <span className="font-serif">
                    {order.paymentMethod === 'INSTAPAY'
                      ? isArabic ? 'إجمالي المدفوع إنستاباي:' : 'Total Paid via Instapay:'
                      : t.orderConfirmation.codDue}
                    :
                  </span>
                  <span className="font-serif text-base text-[#B67355]">
                    EGP {order.totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items In Order */}
          <div className="bg-white border border-[#E8E2D8] p-6 shadow-sm rounded-xl">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#1F1F1F] mb-4 border-b border-[#E8E2D8] pb-3">
              {t.orderConfirmation.itemsOrdered} ({order.items?.length || 0})
            </h4>

            <div className="divide-y divide-[#E8E2D8]">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imageUrl && (
                      <div className="relative w-14 h-16 bg-[#F6F3EE] shrink-0 border border-[#E8E2D8] overflow-hidden rounded">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="font-serif text-xs font-semibold text-[#1F1F1F] truncate">
                        {item.name}
                      </h5>
                      <p className="text-[10px] text-[#8E8A85] font-sans">
                        {item.selectedColor?.name} • {t.product.selectSize}: {item.selectedSize} • {t.product.quantity}: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <span className="font-serif text-xs font-bold text-[#1F1F1F] shrink-0">
                    EGP {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Printable Invoice Hidden Component */}
          <div className="hidden print:block">
            <PrintableInvoice order={order} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />
      <main className="flex-grow py-12">
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin" />
            </div>
          }
        >
          <OrderTrackingContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
