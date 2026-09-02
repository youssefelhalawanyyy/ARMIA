'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  MessageCircle,
  ShoppingBag,
  Printer,
  Sparkles,
  Zap,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import PrintableInvoice from '@/components/admin/PrintableInvoice';
import { printIsolatedInvoice } from '@/lib/invoiceGenerator';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getProducts, deductOrderInventory } from '@/lib/productService';
import { Order, OrderStatus, Product, ProductColor, CartItem, ExchangeRequest } from '@/types';

function OrderTrackingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const docId = params.id as string;
  const urlOrderId = searchParams.get('orderId');

  const { t, isArabic } = useLanguage();
  const { success, error, info } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Post-Purchase Upsell State
  const [upsellProduct, setUpsellProduct] = useState<Product | null>(null);
  const [selectedUpsellColor, setSelectedUpsellColor] = useState<ProductColor | null>(null);
  const [selectedUpsellSize, setSelectedUpsellSize] = useState<string>('Standard');
  const [addingUpsell, setAddingUpsell] = useState(false);
  const [upsellAdded, setUpsellAdded] = useState(false);

  // Self-Service Exchange / Size Swap State
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeItemIndex, setExchangeItemIndex] = useState(0);
  const [exchangeType, setExchangeType] = useState<'exchange_size' | 'return_refund'>('exchange_size');
  const [exchangeRequestedSize, setExchangeRequestedSize] = useState('M');
  const [exchangeRequestedColor, setExchangeRequestedColor] = useState('');
  const [exchangeReason, setExchangeReason] = useState('Size too tight / المقاس ضيق');
  const [exchangeNotes, setExchangeNotes] = useState('');
  const [submittingExchange, setSubmittingExchange] = useState(false);

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
          const ordData = { id: snap.id, ...snap.data() } as Order;
          setOrder(ordData);

          // Fetch only products that have real ACTIVE OFFERS (discountPrice < price)
          try {
            const allProducts = await getProducts('all');
            const offerProducts = allProducts.filter(
              (p) =>
                p.discountPrice &&
                p.discountPrice < p.price &&
                !ordData.items?.some((it) => it.productId === p.id)
            );

            if (offerProducts.length > 0) {
              const bestDeal = offerProducts[0];
              setUpsellProduct(bestDeal);
              if (bestDeal.colors && bestDeal.colors.length > 0) {
                setSelectedUpsellColor(bestDeal.colors[0]);
              }
              if (bestDeal.sizes && bestDeal.sizes.length > 0) {
                setSelectedUpsellSize(bestDeal.sizes[0]);
              }
            }
          } catch (e) {
            console.warn('Upsell fetch error:', e);
          }
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
    if (order) {
      printIsolatedInvoice(order);
    }
  };

  // POST-PURCHASE 1-CLICK UPSELL HANDLER (NO EXTRA SHIPPING)
  const handleAddUpsellToOrder = async () => {
    if (!order || !docId || !upsellProduct) return;
    setAddingUpsell(true);

    try {
      const chosenColor =
        selectedUpsellColor ||
        (upsellProduct.colors && upsellProduct.colors.length > 0
          ? upsellProduct.colors[0]
          : { name: 'Standard', hex: '#1F1F1F' });

      const chosenSize =
        selectedUpsellSize ||
        (upsellProduct.sizes && upsellProduct.sizes.length > 0
          ? upsellProduct.sizes[0]
          : 'Standard');

      const newItem: CartItem = {
        productId: upsellProduct.id,
        name: upsellProduct.name,
        price: upsellProduct.discountPrice || upsellProduct.price,
        originalPrice: upsellProduct.price,
        quantity: 1,
        selectedColor: chosenColor,
        selectedSize: chosenSize,
        imageUrl: upsellProduct.imageUrls[0] || '',
        category: upsellProduct.category,
      };

      const updatedItems = [...order.items, newItem];
      const newSubtotal = order.subtotal + newItem.price;
      const newTotal = order.totalAmount + newItem.price; // 0 extra shipping!

      const orderRef = doc(db, 'orders', docId);
      await updateDoc(orderRef, {
        items: updatedItems,
        subtotal: newSubtotal,
        totalAmount: newTotal,
        updatedAt: serverTimestamp(),
      });

      // Deduct inventory in real time
      await deductOrderInventory([newItem]);

      setOrder({
        ...order,
        items: updatedItems,
        subtotal: newSubtotal,
        totalAmount: newTotal,
      });

      setUpsellAdded(true);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DCC9A6', '#B67355', '#1F1F1F'],
      });

      success(
        isArabic
          ? `تمت إضافة "${newItem.name}" إلى شحنتكِ بنجاح بدون أي رسوم شحن إضافية!`
          : `"${newItem.name}" added to your shipment with Zero Extra Delivery Fee!`,
        isArabic ? 'تمت الإضافة بنجاح' : 'Added to Shipment'
      );
    } catch (err) {
      console.error('Error adding upsell to order:', err);
      error(isArabic ? 'تعذر إضافة القطعة، يرجى المحاولة لاحقاً' : 'Could not add piece to order');
    } finally {
      setAddingUpsell(false);
    }
  };

  // SELF-SERVICE EXCHANGE & SIZE SWAP SUBMISSION
  const handleSubmitExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !docId) return;

    const targetItem = order.items[exchangeItemIndex];
    if (!targetItem) return;

    setSubmittingExchange(true);
    try {
      const exchangePayload: ExchangeRequest = {
        itemIndex: exchangeItemIndex,
        productId: targetItem.productId,
        productName: targetItem.name,
        currentSize: targetItem.selectedSize,
        currentColor: targetItem.selectedColor?.name || '',
        type: exchangeType,
        requestedSize: exchangeType === 'exchange_size' ? exchangeRequestedSize : undefined,
        requestedColor:
          exchangeType === 'exchange_size'
            ? exchangeRequestedColor || targetItem.selectedColor?.name
            : undefined,
        reason: exchangeReason,
        notes: exchangeNotes.trim() || undefined,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };

      const orderRef = doc(db, 'orders', docId);
      await updateDoc(orderRef, {
        exchangeRequest: exchangePayload,
        updatedAt: serverTimestamp(),
      });

      setOrder({
        ...order,
        exchangeRequest: exchangePayload,
      });

      setShowExchangeModal(false);
      success(
        isArabic
          ? 'تم تسجيل طلب الاستبدال بنجاح! سيتواصل معكِ مندوب الشحن للتسليم والاستلام خلال 24–48 ساعة.'
          : 'Exchange request registered! Our courier will contact you within 24–48 hours.',
        isArabic ? 'تم تسجيل الطلب' : 'Request Submitted'
      );
    } catch (err) {
      console.error('Error submitting exchange:', err);
      error(isArabic ? 'تعذر إرسال طلب الاستبدال' : 'Failed to submit exchange request');
    } finally {
      setSubmittingExchange(false);
    }
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
            href="/collections"
            className="inline-block bg-[#1F1F1F] text-[#DCC9A6] hover:bg-[#B67355] hover:text-white px-6 py-2.5 text-xs uppercase tracking-wider font-sans font-semibold transition-colors rounded"
          >
            {isArabic ? 'تصفحي التشكيلات الحصرية' : 'Browse Exclusive Collections'}
          </Link>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top Hero Card */}
          <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#B67355] font-bold">
                    ARMIA Haute Couture Order Confirmed
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1F1F]">
                  {isArabic ? 'شكراً لطلبكِ، تفاصيل شحنتكِ جاهزة' : 'Thank You For Your Order'}
                </h1>
                <p className="text-xs text-[#8E8A85] font-sans mt-1">
                  {isArabic ? 'رقم الطلب المرجعي:' : 'Tracking Reference:'}{' '}
                  <strong className="font-mono text-[#1F1F1F]">#{order.orderId}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F6F3EE] hover:bg-[#EDE3CF] text-[#1F1F1F] text-xs font-sans font-semibold transition-colors border border-[#E8E2D8] rounded"
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

          {/* ⚡ FEATURE 2: POST-PURCHASE 1-CLICK UPSELL (ONLY ON PRODUCTS WITH ACTIVE OFFERS) */}
          {upsellProduct && !upsellAdded && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1F1F1F] via-[#2A2A2A] to-[#1F1F1F] p-5 sm:p-6 text-white border-2 border-[#DCC9A6] shadow-xl animate-scaleUp">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-[#DCC9A6]/40 shrink-0 bg-black">
                    <Image
                      src={upsellProduct.imageUrls[0] || ''}
                      alt={upsellProduct.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-[#B67355] text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-sans uppercase">
                      OFFER
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#DCC9A6] text-[#1F1F1F] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        ⚡ {isArabic ? 'إضافة حصرية للشحنة' : 'Post-Purchase Exclusive'}
                      </span>
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        <span>{isArabic ? 'بدون أي مصاريف شحن إضافية!' : 'Zero Extra Delivery Fee!'}</span>
                      </span>
                    </div>

                    <h4 className="font-serif text-base sm:text-lg font-bold text-white mt-1">
                      {isArabic && upsellProduct.nameArabic ? upsellProduct.nameArabic : upsellProduct.name}
                    </h4>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-serif text-lg font-extrabold text-[#DCC9A6]">
                        EGP {upsellProduct.discountPrice}
                      </span>
                      <span className="text-xs text-[#8E8A85] line-through font-mono">
                        EGP {upsellProduct.price}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                        {isArabic
                          ? `وفّري ${(upsellProduct.price - (upsellProduct.discountPrice || 0)).toFixed(0)} ج.م`
                          : `Save EGP ${(upsellProduct.price - (upsellProduct.discountPrice || 0)).toFixed(0)}`}
                      </span>
                    </div>

                    {/* Color & Size Swatches */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {upsellProduct.colors?.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedUpsellColor(c)}
                          className={`w-5 h-5 rounded-full border transition-all ${
                            selectedUpsellColor?.name === c.name
                              ? 'ring-2 ring-[#DCC9A6] scale-110'
                              : 'border-white/30 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}

                      {upsellProduct.sizes && upsellProduct.sizes.length > 0 && (
                        <div className="flex gap-1 ml-2">
                          {upsellProduct.sizes.slice(0, 4).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedUpsellSize(s)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                selectedUpsellSize === s
                                  ? 'bg-[#DCC9A6] text-[#1F1F1F]'
                                  : 'bg-[#333333] text-white hover:bg-[#444444]'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddUpsellToOrder}
                  disabled={addingUpsell}
                  className="w-full md:w-auto bg-[#B67355] hover:bg-[#DCC9A6] hover:text-[#1F1F1F] text-white px-6 py-3 rounded-xl text-xs font-sans uppercase font-bold tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {addingUpsell
                      ? isArabic ? 'جاري الإضافة...' : 'Adding...'
                      : isArabic
                      ? `أضيفي لطلبي الآن (+${upsellProduct.discountPrice} ج.م)`
                      : `Add to My Order (+EGP ${upsellProduct.discountPrice})`}
                  </span>
                </button>
              </div>
            </div>
          )}

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

          {/* 🔄 FEATURE 3: INSTANT SELF-SERVICE SIZE SWAP & EXCHANGE PORTAL */}
          <div className="bg-white border-2 border-[#DCC9A6] p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#DCC9A6] flex items-center justify-center text-[#B67355] shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-[#1F1F1F]">
                    {isArabic ? 'خدمة الاستبدال وتغيير المقاس الفورية' : 'Instant Size Swap & Easy Exchange Portal'}
                  </h4>
                  <p className="text-xs text-[#8E8A85] font-sans">
                    {isArabic
                      ? 'هل المقاس غير مناسب؟ يمكنكِ طلب استبدال المقاس أو القطعة وسيقوم المندوب بتوصيل المقاس الجديد لباب بيتكِ.'
                      : 'Wrong size or fit? Request an instant size swap and our courier will deliver your replacement directly to your door.'}
                  </p>
                </div>
              </div>

              {!order.exchangeRequest && order.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => setShowExchangeModal(true)}
                  className="bg-[#1F1F1F] hover:bg-[#B67355] text-[#DCC9A6] hover:text-white px-5 py-2.5 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all shadow shrink-0 active:scale-95"
                >
                  {isArabic ? '🔄 طلب استبدال المقاس' : '🔄 Request Size Swap'}
                </button>
              )}
            </div>

            {/* If Exchange is Already Logged */}
            {order.exchangeRequest ? (
              <div className="p-4 bg-[#FAF7F2] border border-[#DCC9A6] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#B67355] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isArabic ? 'تم تسجيل طلب الاستبدال بنجاح' : 'Exchange Request Active & Logged'}
                    </span>
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                    {order.exchangeRequest.status === 'approved'
                      ? isArabic ? '✓ تمت الموافقة وجاري التوصيل' : '✓ Approved & Dispatched'
                      : isArabic ? '⏳ قيد التجهيز مع المندوب' : '⏳ Pending Courier Dispatch'}
                  </span>
                </div>

                <p className="text-xs text-[#1F1F1F]">
                  <strong>{order.exchangeRequest.productName}</strong>: {isArabic ? 'المقاس الحالي:' : 'Current:'}{' '}
                  <span className="line-through text-[#8E8A85]">{order.exchangeRequest.currentSize}</span> ➔{' '}
                  <strong className="text-[#B67355] font-bold">{isArabic ? 'المقاس الجديد المطلوب:' : 'New Size:'} {order.exchangeRequest.requestedSize}</strong>
                  {order.exchangeRequest.requestedColor ? ` (${order.exchangeRequest.requestedColor})` : ''}
                </p>

                <p className="text-[11px] text-[#8E8A85]">
                  {isArabic
                    ? `سيقوم مندوب الشحن بالتواصل معكِ على ${order.customerDetails?.phone} لتسليم القطعة الجديدة واستلام السابقة.`
                    : `Our courier will contact you on ${order.customerDetails?.phone} to deliver your replacement and collect the previous piece.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#8E8A85] pt-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B67355] shrink-0" />
                  <span>{isArabic ? 'معاينة مجانية عند الاستلام' : 'Free Inspection at Doorstep'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#B67355] shrink-0" />
                  <span>{isArabic ? 'استبدال سريع خلال 48 ساعة' : 'Fast 48-Hour Exchange Delivery'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B67355] shrink-0" />
                  <span>{isArabic ? 'ضمان أقمشة أرميا الأصلية' : '100% ARMIA Atelier Guarantee'}</span>
                </div>
              </div>
            )}
          </div>

          {/* EXCHANGE / SIZE SWAP MODAL */}
          {showExchangeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
              <div className="relative w-full max-w-lg bg-white border border-[#E8E2D8] p-6 sm:p-7 rounded-2xl shadow-2xl text-[#1F1F1F] max-h-[90vh] overflow-y-auto space-y-5">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                  <div>
                    <span className="text-[10px] font-sans uppercase tracking-widest text-[#B67355] font-bold">
                      ARMIA Atelier Concierge
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#1F1F1F] mt-0.5">
                      {isArabic ? 'طلب استبدال المقاس أو القطعة' : 'Request Size Swap or Exchange'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExchangeModal(false)}
                    className="p-1.5 text-[#8E8A85] hover:text-[#1F1F1F]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitExchange} className="space-y-4">
                  {/* 1. Pick Item */}
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {isArabic ? '1. اختاري القطعة المراد استبدالها:' : '1. Select Item to Swap:'}
                    </label>
                    <select
                      value={exchangeItemIndex}
                      onChange={(e) => setExchangeItemIndex(Number(e.target.value))}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] text-xs font-sans p-2.5 rounded focus:outline-none focus:border-[#B67355]"
                    >
                      {order.items.map((it, i) => (
                        <option key={i} value={i}>
                          {it.name} — ({it.selectedColor?.name || 'Color'}, {it.selectedSize})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Action Type */}
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {isArabic ? '2. نوع الطلب:' : '2. Action Requested:'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExchangeType('exchange_size')}
                        className={`p-2.5 text-xs font-bold rounded-lg border transition-all ${
                          exchangeType === 'exchange_size'
                            ? 'bg-[#B67355] text-white border-[#B67355] shadow'
                            : 'bg-[#F6F3EE] text-[#1F1F1F] border-[#E8E2D8]'
                        }`}
                      >
                        {isArabic ? '🔄 تغيير المقاس' : '🔄 Size Swap'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExchangeType('return_refund')}
                        className={`p-2.5 text-xs font-bold rounded-lg border transition-all ${
                          exchangeType === 'return_refund'
                            ? 'bg-[#B67355] text-white border-[#B67355] shadow'
                            : 'bg-[#F6F3EE] text-[#1F1F1F] border-[#E8E2D8]'
                        }`}
                      >
                        {isArabic ? '↩️ إرجاع القطعة' : '↩️ Return Item'}
                      </button>
                    </div>
                  </div>

                  {/* If Size Swap: Pick New Size */}
                  {exchangeType === 'exchange_size' && (
                    <div className="p-3.5 bg-[#FAF7F2] border border-[#DCC9A6] rounded-xl space-y-3">
                      <label className="block text-xs font-sans uppercase tracking-wider text-[#B67355] font-bold">
                        {isArabic ? 'المقاس البديل المطلوب:' : 'New Size Desired:'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'].map((sz) => (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => setExchangeRequestedSize(sz)}
                            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border transition-all ${
                              exchangeRequestedSize === sz
                                ? 'bg-[#1F1F1F] text-[#DCC9A6] border-[#1F1F1F]'
                                : 'bg-white text-[#1F1F1F] border-[#E8E2D8] hover:border-[#B67355]'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {isArabic ? 'سبب الاستبدال أو الإرجاع:' : 'Reason for Exchange:'}
                    </label>
                    <select
                      value={exchangeReason}
                      onChange={(e) => setExchangeReason(e.target.value)}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] text-xs font-sans p-2.5 rounded focus:outline-none focus:border-[#B67355]"
                    >
                      <option value="Size too tight / المقاس ضيق">
                        {isArabic ? 'المقاس ضيق وأحتاج مقاس أكبر' : 'Size is too tight, need larger size'}
                      </option>
                      <option value="Size too loose / المقاس واسع">
                        {isArabic ? 'المقاس واسع وأحتاج مقاس أصغر' : 'Size is too loose, need smaller size'}
                      </option>
                      <option value="Want another color / أرغب في لون آخر">
                        {isArabic ? 'أرغب في تغيير اللون' : 'I prefer another color'}
                      </option>
                      <option value="Fit preference / تفضيل في القصة">
                        {isArabic ? 'القصّة تحتاج تعديل' : 'Fit preference / silhouette'}
                      </option>
                    </select>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-wider text-[#1F1F1F] mb-1 font-semibold">
                      {isArabic ? 'ملاحظات إضافية لمندوب الشحن (اختياري):' : 'Courier Delivery Notes (Optional):'}
                    </label>
                    <textarea
                      rows={2}
                      value={exchangeNotes}
                      onChange={(e) => setExchangeNotes(e.target.value)}
                      placeholder={isArabic ? 'مثال: يرجى التوصيل بعد الساعة 5 مساءً' : 'e.g. Please deliver after 5 PM'}
                      className="w-full bg-[#F6F3EE] border border-[#E8E2D8] text-xs font-sans p-2.5 rounded focus:outline-none focus:border-[#B67355]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D8]">
                    <button
                      type="button"
                      onClick={() => setShowExchangeModal(false)}
                      className="px-4 py-2 text-xs uppercase font-sans font-bold border border-[#E8E2D8] text-[#8E8A85] hover:text-[#1F1F1F] rounded"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submittingExchange}
                      className="bg-[#B67355] text-white hover:bg-[#1F1F1F] hover:text-[#DCC9A6] px-6 py-2 text-xs font-sans uppercase font-bold tracking-wider rounded transition-all shadow disabled:opacity-50"
                    >
                      {submittingExchange
                        ? isArabic ? 'جاري التسجيل...' : 'Submitting...'
                        : isArabic ? 'تأكيد طلب الاستبدال' : 'Confirm Exchange'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
