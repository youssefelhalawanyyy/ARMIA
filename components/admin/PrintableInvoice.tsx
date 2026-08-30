'use client';

import React from 'react';
import { Order } from '@/types';
import BrandLogo from '@/components/common/BrandLogo';

interface PrintableInvoiceProps {
  order: Order;
}

export default function PrintableInvoice({ order }: PrintableInvoiceProps) {
  const customer = order.customerDetails;

  // Format date cleanly
  let formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (order.createdAt) {
    try {
      const ts = order.createdAt as { seconds?: number; toDate?: () => Date };
      const dateObj = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : null;
      if (dateObj) {
        formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }
  }

  const invoiceNumber = order.orderId || (order.id ? `ARM-${order.id.slice(0, 6).toUpperCase()}` : 'ARM-100201');

  return (
    <div
      id="printable-invoice"
      className="bg-white text-[#1F1F1F] max-w-[850px] mx-auto shadow-2xl print:shadow-none print:max-w-none print:w-full print:m-0 font-sans overflow-hidden border border-[#DCC9A6]/40 print:border-none"
    >
      {/* 1. TOP HEADER SECTION (MATCHING REFERENCE GEOMETRIC SPLIT) */}
      <div className="grid grid-cols-12 min-h-[190px] relative">
        {/* Left Dark Charcoal Block (7 Cols) */}
        <div className="col-span-7 bg-[#1A1A1A] text-white p-8 sm:p-10 flex flex-col justify-between relative">
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-[0.18em] uppercase text-white">
              INVOICE
            </h1>
            <div className="w-full h-[2px] bg-white/40 mt-3 mb-4" />
          </div>

          <div className="space-y-1.5 text-xs text-neutral-300 font-sans">
            <div className="flex">
              <span className="w-32 text-neutral-400 font-medium">Invoice Number</span>
              <span className="font-mono font-bold text-white">: #{invoiceNumber}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-neutral-400 font-medium">Invoice Date</span>
              <span className="text-white">: {formattedDate}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-neutral-400 font-medium">Payment Method</span>
              <span className="text-[#DCC9A6] font-semibold">: Cash on Delivery (COD)</span>
            </div>
          </div>
        </div>

        {/* Right Gold Brand Block (5 Cols) */}
        <div className="col-span-5 bg-[#D4A373] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-inner">
          <BrandLogo variant="dark" size="md" showTagline={true} href="" className="scale-95" />
          <div className="mt-2 pt-2 border-t border-black/15 w-full text-center">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1F1F1F] block">
              Official Boutique Invoice
            </span>
            <span className="text-[9px] text-[#1F1F1F]/80 font-sans" dir="rtl">
              فاتورة مبيعات وإذن تسليم رسمي
            </span>
          </div>
        </div>
      </div>

      {/* 2. INFORMATION COLUMNS (BOUTIQUE & CLIENT DETAILS) */}
      <div className="p-8 sm:p-10 space-y-8 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
          
          {/* Left Column: Boutique Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCC9A6] pb-1">
              <h3 className="font-bold text-sm text-[#1F1F1F] uppercase tracking-wider">
                Boutique Information
              </h3>
              <span className="text-[11px] font-semibold text-[#B67355]" dir="rtl">
                بيانات البوتيك
              </span>
            </div>

            <div className="space-y-2 text-xs font-sans text-[#2A2A2A]">
              <div className="flex">
                <span className="w-24 text-neutral-500 font-medium">Name</span>
                <span className="font-semibold text-black">: ARMIA BOUTIQUE (آرميا)</span>
              </div>
              <div className="flex">
                <span className="w-24 text-neutral-500 font-medium">Atelier</span>
                <span>: Cairo Atelier, Egypt (القاهرة، مصر)</span>
              </div>
              <div className="flex">
                <span className="w-24 text-neutral-500 font-medium">Phone</span>
                <span className="font-mono">: +20 100 123 4567</span>
              </div>
              <div className="flex">
                <span className="w-24 text-neutral-500 font-medium">Website</span>
                <span className="font-mono text-[#B67355]">: www.armiaboutique.com</span>
              </div>
            </div>
          </div>

          {/* Right Column: Client Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCC9A6] pb-1">
              <h3 className="font-bold text-sm text-[#1F1F1F] uppercase tracking-wider">
                Client Information
              </h3>
              <span className="text-[11px] font-semibold text-[#B67355]" dir="rtl">
                بيانات العميل والشحن
              </span>
            </div>

            <div className="space-y-2 text-xs font-sans text-[#2A2A2A]">
              <div className="flex">
                <span className="w-28 text-neutral-500 font-medium">Customer</span>
                <span className="font-bold text-black">: {customer?.fullName || 'Valued Customer'}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-500 font-medium">Destination</span>
                <span className="font-medium text-black">
                  : {customer?.governorate} — {customer?.city}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-500 font-medium">Full Address</span>
                <span className="text-black font-medium leading-tight">: {customer?.address}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-neutral-500 font-medium">Phone</span>
                <span className="font-mono font-bold text-black">: {customer?.phone}</span>
              </div>
              {customer?.notes && (
                <div className="flex text-amber-900 bg-amber-50 p-1.5 border border-amber-200 text-[11px]">
                  <span className="w-28 font-semibold">Courier Note</span>
                  <span className="italic">: {customer.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. ORDERED ITEMS TABLE */}
        <div className="overflow-hidden border border-[#D4A373]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#D4A373] text-[#1F1F1F] font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12 border-r border-black/10">No.</th>
                <th className="py-3 px-4 border-r border-black/10">
                  <span>Description / اسم القطعة والموديل</span>
                </th>
                <th className="py-3 px-3 text-center w-24 border-r border-black/10">
                  <span>Quantity</span>
                </th>
                <th className="py-3 px-4 text-right w-32 border-r border-black/10">
                  <span>Unit Price</span>
                </th>
                <th className="py-3 px-4 text-right w-32">
                  <span>Subtotal</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8] bg-white">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/70">
                  <td className="py-3 px-3 text-center font-mono font-bold text-neutral-600 border-r border-[#E8E2D8]">
                    {idx + 1}.
                  </td>
                  <td className="py-3 px-4 border-r border-[#E8E2D8]">
                    <div className="font-bold text-black text-xs font-serif">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 flex items-center gap-2 mt-0.5">
                      <span>Color: <strong>{item.selectedColor?.name}</strong></span>
                      <span>•</span>
                      <span>Size: <strong>{item.selectedSize}</strong></span>
                      <span>•</span>
                      <span>Category: {item.category}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-sm text-black border-r border-[#E8E2D8]">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-neutral-800 border-r border-[#E8E2D8]">
                    EGP {item.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-black">
                    EGP {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Shipping Row */}
              <tr className="bg-neutral-50/50">
                <td className="py-2.5 px-3 text-center font-mono text-neutral-500 border-r border-[#E8E2D8]">
                  •
                </td>
                <td className="py-2.5 px-4 font-semibold text-neutral-700 border-r border-[#E8E2D8]">
                  Shipping & Doorstep Delivery (Across Egypt / توصيل لجميع المحافظات)
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-neutral-600 border-r border-[#E8E2D8]">
                  1
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-neutral-700 border-r border-[#E8E2D8]">
                  {order.shippingFee === 0 ? '0.00' : `EGP ${order.shippingFee?.toFixed(2)}`}
                </td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-neutral-800">
                  {order.shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase">Free (مجاني)</span>
                  ) : (
                    `EGP ${order.shippingFee?.toFixed(2)}`
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* TOTAL AMOUNT DUE BAR (MATCHING REFERENCE GOLD BAR) */}
          <div className="bg-[#D4A373] text-[#1F1F1F] flex items-center justify-between px-6 py-3 border-t border-black/15 font-bold">
            <div className="flex items-center gap-3">
              <span className="text-sm uppercase tracking-wider font-extrabold">
                Total Amount Due
              </span>
              <span className="text-xs text-[#1F1F1F]/80 font-sans" dir="rtl">
                (المبلغ الإجمالي المطلوب تحصيله عند الاستلام)
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-serif font-extrabold tracking-tight">
              EGP {order.totalAmount?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 4. PAYMENT METHOD & OFFICIAL AUTHORIZATION */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 pt-2">
          
          {/* Left Column: Payment Method Info (7 Cols) */}
          <div className="sm:col-span-7 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-black border-b border-[#DCC9A6] pb-1">
              Payment Method & Terms / طريقة السداد والشروط
            </h4>

            <div className="space-y-1.5 text-xs text-neutral-700 font-sans">
              <div className="flex">
                <span className="w-32 text-neutral-500 font-medium">Payment Method</span>
                <span className="font-bold text-black">: Cash on Delivery (COD) • دفع نقدي للمندوب</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 font-medium">Inspection Policy</span>
                <span className="font-semibold text-emerald-800">: Allowed Prior to Payment • حق المعاينة مكفول</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 font-medium">Exchange Window</span>
                <span>: 14 Days from Delivery Date (استبدال خلال 14 يوماً)</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 font-medium">Support Hotline</span>
                <span className="font-mono">: +20 100 123 4567 (WhatsApp 24/7)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Date & Elegant Signature (5 Cols) */}
          <div className="sm:col-span-5 flex flex-col items-center justify-end text-center space-y-2">
            <p className="text-xs text-neutral-600 font-medium">
              Date: <span className="font-bold text-black">{formattedDate}</span>
            </p>

            {/* Signature Graphic Mockup */}
            <div className="relative w-44 h-16 flex items-center justify-center">
              <svg
                viewBox="0 0 200 80"
                className="w-full h-full stroke-[#1F1F1F] fill-none stroke-[2]"
              >
                <path d="M 20 50 Q 50 10, 80 40 T 130 30 Q 150 70, 180 35" />
                <path d="M 40 60 Q 90 20, 140 45" />
                <path d="M 85 20 Q 95 65, 110 30" />
              </svg>
            </div>

            <div className="w-44 border-t border-black pt-1">
              <p className="font-serif font-bold text-xs text-black">
                ARMIA Boutique Atelier
              </p>
              <p className="text-[10px] text-neutral-500">
                Authorized Signature & Seal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM GEOMETRIC ACCENT BAR (MIRRORING HEADER) */}
      <div className="grid grid-cols-12 h-6">
        <div className="col-span-7 bg-[#1A1A1A]" />
        <div className="col-span-5 bg-[#D4A373]" />
      </div>
    </div>
  );
}
