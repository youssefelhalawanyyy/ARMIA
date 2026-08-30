'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  ShoppingBag,
  Printer,
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import PrintableInvoice from '@/components/admin/PrintableInvoice';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus } from '@/types';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'pending', label: 'Order Placed', desc: 'Received & awaiting boutique verification' },
  { status: 'confirmed', label: 'Confirmed', desc: 'Verified by atelier team' },
  { status: 'processing', label: 'Processing & Packaging', desc: 'Steamed, inspected & boxed' },
  { status: 'shipped', label: 'Out for Delivery', desc: 'With courier across Egypt' },
  { status: 'delivered', label: 'Delivered', desc: 'Received & paid via COD' },
];

function OrderTrackingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const docId = params.id as string;
  const urlOrderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="bg-white border border-[#E8E2D8] p-10 text-center">
          <Package className="w-12 h-12 text-[#8E8A85] mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold text-[#1F1F1F] mb-1">
            Order Received
          </h2>
          <p className="text-xs text-[#8E8A85] font-sans mb-6">
            Order Ref:{' '}
            <strong className="text-[#1F1F1F]">{urlOrderId || docId}</strong>. Our team is
            preparing your order confirmation.
          </p>
          <Link
            href="/account"
            className="bg-[#1F1F1F] text-[#DCC9A6] px-8 py-3 text-xs uppercase tracking-widest font-sans inline-block"
          >
            View My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Status Card */}
          <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#B67355]">
                  Cash on Delivery Order Confirmed
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1F1F] mt-1">
                  Order #{order.orderId}
                </h1>
                <p className="text-xs text-[#8E8A85] font-sans mt-1">
                  Thank you for choosing ARMIA Boutique,{' '}
                  <strong className="text-[#1F1F1F]">{order.customerDetails?.fullName}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E8E2D8] text-xs font-sans hover:bg-[#F6F3EE] transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <a
                  href={`https://wa.me/201001234567?text=${encodeURIComponent(
                    `Hello ARMIA Boutique, I am inquiring about my Order #${order.orderId}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white text-xs font-sans font-semibold hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </div>

            {/* Realtime Order Progress Timeline */}
            <div className="mt-8">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#1F1F1F] mb-6">
                Live Delivery Tracking
              </h3>

              <div className="relative">
                {/* Progress line */}
                <div className="hidden sm:block absolute top-1/2 left-4 right-4 h-0.5 bg-[#E8E2D8] -translate-y-1/2 z-0" />
                <div
                  className="hidden sm:block absolute top-1/2 left-4 h-0.5 bg-[#B67355] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%`,
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={step.status}
                        className={`flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 text-left sm:text-center p-3 sm:p-0 ${
                          isCurrent ? 'bg-[#F6F3EE] sm:bg-transparent' : ''
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
            <div className="bg-white border border-[#E8E2D8] p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3 mb-3">
                <MapPin className="w-4 h-4 text-[#B67355]" />
                <h4 className="font-serif text-sm font-bold text-[#1F1F1F]">
                  Delivery Destination
                </h4>
              </div>
              <div className="text-xs font-sans text-[#1F1F1F] space-y-1">
                <p className="font-semibold">{order.customerDetails?.fullName}</p>
                <p className="text-[#8E8A85]">
                  {order.customerDetails?.address}, {order.customerDetails?.city}
                </p>
                <p className="text-[#8E8A85]">{order.customerDetails?.governorate}, Egypt</p>
                <p className="pt-1 flex items-center gap-1.5 font-medium text-[#1F1F1F]">
                  <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>{order.customerDetails?.phone}</span>
                </p>
                {order.customerDetails?.notes && (
                  <p className="pt-2 text-[11px] text-[#B67355] italic bg-[#F6F3EE] p-2 border border-[#E8E2D8]">
                    Note: {order.customerDetails?.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white border border-[#E8E2D8] p-6 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3 mb-3">
                <ShoppingBag className="w-4 h-4 text-[#B67355]" />
                <h4 className="font-serif text-sm font-bold text-[#1F1F1F]">
                  Payment & COD Total
                </h4>
              </div>
              <div className="text-xs font-sans space-y-2 text-[#8E8A85]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-[#1F1F1F] font-semibold">
                    EGP {order.subtotal?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping (Egypt):</span>
                  <span className="text-[#1F1F1F] font-semibold">
                    {order.shippingFee === 0 ? 'Free' : `EGP ${order.shippingFee?.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-[#E8E2D8] pt-2 flex justify-between text-sm font-bold text-[#1F1F1F]">
                  <span className="font-serif">Cash on Delivery Due:</span>
                  <span className="font-serif text-base text-[#B67355]">
                    EGP {order.totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-[#F6F3EE] border border-[#E8E2D8] text-[11px] text-[#1F1F1F] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>Please keep exact cash ready upon courier arrival.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items in Order */}
          <div className="bg-white border border-[#E8E2D8] p-6 sm:p-8">
            <h4 className="font-serif text-base font-bold text-[#1F1F1F] border-b border-[#E8E2D8] pb-4 mb-4">
              Items in Package ({order.items?.length})
            </h4>

            <div className="divide-y divide-[#E8E2D8]/60">
              {order.items?.map((item, i) => (
                <div key={i} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-16 bg-[#F6F3EE] border border-[#E8E2D8] overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl || ''}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="font-serif text-sm font-semibold text-[#1F1F1F]">
                        {item.name}
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-[#8E8A85] font-sans mt-0.5">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border"
                            style={{ backgroundColor: item.selectedColor?.hex }}
                          />
                          {item.selectedColor?.name}
                        </span>
                        <span>•</span>
                        <span>Size: {item.selectedSize}</span>
                        <span>•</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-serif text-sm font-bold text-[#1F1F1F]">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </span>
                    <p className="text-[10px] text-[#8E8A85] font-sans">
                      EGP {item.price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Printable Invoice Container (Activates upon Print) */}
          <div className="hidden print:block">
            <PrintableInvoice order={order} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F3EE]">
      <Navbar />
      <main className="flex-grow py-12">
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
              <div className="w-10 h-10 border-2 border-[#1F1F1F] border-t-[#DCC9A6] rounded-full animate-spin mx-auto" />
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
