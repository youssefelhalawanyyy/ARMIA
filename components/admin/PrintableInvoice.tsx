'use client';

import React from 'react';
import { Order } from '@/types';
import BrandLogo from '@/components/common/BrandLogo';

interface PrintableInvoiceProps {
  order: Order;
}

export default function PrintableInvoice({ order }: PrintableInvoiceProps) {
  const customer = order.customerDetails;

  // Format date: "August 31, 2026"
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

  const invoiceNumber = order.orderId || (order.id ? `ARM-${order.id.slice(0, 6).toUpperCase()}` : 'ARM-100293');
  const isInstapay = order.paymentMethod === 'INSTAPAY';

  return (
    <div
      id="printable-invoice"
      className="bg-white text-[#1F1F1F] w-full max-w-[800px] mx-auto font-sans shadow-none print:shadow-none print:max-w-none print:w-full print:m-0 relative border border-[#E8E2D8] print:border-none"
      style={{ minHeight: '1020px' }}
    >
      {/* 1. TOP HEADER SECTION */}
      <div className="grid grid-cols-12 relative">
        {/* Left Dark Block (60% width) */}
        <div className="col-span-7 bg-[#232323] text-white p-7 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-white uppercase font-sans">
                INVOICE
              </h1>
              <span className="text-xs font-mono text-[#E5A84B] font-bold">
                فاتورة شراء رسمية
              </span>
            </div>
            <div className="w-full h-[1.5px] bg-white/60 mt-2 mb-4" />
          </div>

          <div className="space-y-1.5 text-xs text-neutral-200 font-sans">
            <div className="grid grid-cols-12">
              <span className="col-span-5 text-neutral-300 font-medium">Invoice Number</span>
              <span className="col-span-7 font-mono font-bold text-white">: #{invoiceNumber}</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-5 text-neutral-300 font-medium">Invoice Date</span>
              <span className="col-span-7 text-white">: {formattedDate}</span>
            </div>
            <div className="grid grid-cols-12">
              <span className="col-span-5 text-neutral-300 font-medium">Payment Method</span>
              <span className="col-span-7 text-[#E5A84B] font-bold">
                : {isInstapay ? 'Instapay Transfer (01204000195)' : 'Cash on Delivery (COD)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Gold Block (40% width) */}
        <div className="col-span-5 bg-[#E5A84B] p-6 sm:p-8 flex flex-col items-center justify-center text-center">
          <BrandLogo variant="dark" size="md" showTagline={true} href="" className="scale-105" />
          <p className="text-[10px] text-[#1F1F1F] font-bold uppercase tracking-widest mt-2">
            Haute Couture • Cairo Atelier
          </p>
        </div>
      </div>

      {/* 2. TWO INFORMATION COLUMNS: BOUTIQUE & CLIENT LOCATION DETAILS */}
      <div className="px-8 sm:px-10 pt-8 pb-4 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          
          {/* Left Column: Boutique Information */}
          <div className="space-y-2 border-r border-[#E8E2D8]/60 pr-4">
            <h3 className="font-bold text-sm text-[#1F1F1F] border-b border-[#E8E2D8] pb-1.5 flex items-center justify-between">
              <span>Boutique Information</span>
              <span className="text-[11px] text-[#8E8A85] font-normal">بيانات الأتيليه</span>
            </h3>
            <div className="space-y-1.5 text-[#2A2A2A]">
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Boutique</span>
                <span className="col-span-8 font-bold text-black">: ARMIA Boutique (آرميا بوتيك)</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Location</span>
                <span className="col-span-8">: Cairo Atelier & Showroom, Egypt</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Hotline / Calls</span>
                <span className="col-span-8 font-mono font-bold text-black">: +20 122 085 9992</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">WhatsApp</span>
                <span className="col-span-8 font-mono">: +20 122 085 9992</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Email</span>
                <span className="col-span-8 font-mono">: armiaboutique1@gmail.com</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Instapay</span>
                <span className="col-span-8 font-mono font-bold text-[#B67355]">: 01204000195</span>
              </div>
            </div>
          </div>

          {/* Right Column: Client Information & Delivery Location */}
          <div className="space-y-2 pl-2">
            <h3 className="font-bold text-sm text-[#1F1F1F] border-b border-[#E8E2D8] pb-1.5 flex items-center justify-between">
              <span>Client & Delivery Destination</span>
              <span className="text-[11px] text-[#8E8A85] font-normal">بيانات العميل والشحن</span>
            </h3>
            <div className="space-y-1.5 text-[#2A2A2A]">
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Customer Name</span>
                <span className="col-span-7 font-bold text-black">: {customer?.fullName || 'Valued Client'}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Governorate</span>
                <span className="col-span-7 font-semibold text-black">: {customer?.governorate || 'Cairo'}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">City / District</span>
                <span className="col-span-7 text-black">: {customer?.city || 'Cairo'}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Detailed Address</span>
                <span className="col-span-7 leading-tight text-black font-medium">: {customer?.address || 'Delivery Address'}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Contact Phone</span>
                <span className="col-span-7 font-mono font-bold text-black">
                  : {customer?.phone} {customer?.alternatePhone ? ` / ${customer.alternatePhone}` : ''}
                </span>
              </div>
              {customer?.notes && (
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-neutral-700 font-medium">Delivery Notes</span>
                  <span className="col-span-7 italic text-[#B67355]">: {customer.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. ITEMS TABLE (ONLY PURCHASED PRODUCTS - NO DELIVERY OR DISCOUNT IN ROWS) */}
        <div className="pt-2">
          <table className="w-full text-left text-xs border-collapse border border-[#999999]">
            <thead>
              <tr className="bg-[#E5A84B] text-[#1F1F1F] font-bold text-xs">
                <th className="py-2.5 px-3 text-center w-12 border border-[#999999]">No.</th>
                <th className="py-2.5 px-4 text-center border border-[#999999]">Description (المنتج والوصف)</th>
                <th className="py-2.5 px-3 text-center w-24 border border-[#999999]">Quantity (الكمية)</th>
                <th className="py-2.5 px-4 text-center w-28 border border-[#999999]">Unit Price (سعر الوحدة)</th>
                <th className="py-2.5 px-4 text-center w-28 border border-[#999999]">Subtotal (الإجمالي)</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-[#999999]">
                  <td className="py-2.5 px-3 text-center font-mono text-neutral-800 border-r border-[#999999]">
                    {idx + 1}.
                  </td>
                  <td className="py-2.5 px-4 border-r border-[#999999]">
                    <span className="font-bold text-black">{item.name}</span>
                    <span className="text-[11px] text-neutral-600 block">
                      {item.selectedColor?.name} • Size {item.selectedSize}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-black border-r border-[#999999]">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-neutral-900 border-r border-[#999999]">
                    EGP {item.price.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-black border-r border-[#999999]">
                    EGP {(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. FINANCIAL SUMMARY BREAKDOWN (BEFORE TOTAL AMOUNT DUE) */}
          <div className="flex justify-end mt-2">
            <div className="w-full sm:w-1/2 border border-[#999999] bg-white text-xs divide-y divide-[#999999]">
              
              {/* Items Subtotal */}
              <div className="flex justify-between items-center py-2 px-4">
                <span className="text-neutral-700 font-medium">
                  Items Subtotal (المجموع الفرعي للقطع)
                </span>
                <span className="font-mono font-bold text-black">
                  EGP {order.subtotal?.toFixed(2)}
                </span>
              </div>

              {/* Applied Discount (if any) */}
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="flex justify-between items-center py-2 px-4 bg-emerald-50 text-emerald-900">
                  <div className="flex flex-col">
                    <span className="font-bold">
                      Discount Applied (الخصم المطبق)
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      {order.discountTitle || order.discountCode || 'Promotion'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800">
                    -EGP {order.discountAmount.toFixed(2)}
                  </span>
                </div>
              ) : null}

              {/* Shipping & Delivery Fee */}
              <div className="flex justify-between items-center py-2 px-4">
                <span className="text-neutral-700 font-medium">
                  Delivery Fee ({customer?.governorate?.split('(')[0]?.trim() || 'Cairo'})
                </span>
                <span className="font-mono font-bold text-black">
                  {order.shippingFee === 0 ? 'FREE (مجاناً)' : `EGP ${order.shippingFee?.toFixed(2)}`}
                </span>
              </div>

              {/* TOTAL AMOUNT DUE BAR */}
              <div className="bg-[#E5A84B] text-[#1F1F1F] flex justify-between items-center py-2.5 px-4 font-bold text-sm">
                <span>TOTAL AMOUNT DUE (الإجمالي المستحق)</span>
                <span className="font-mono font-extrabold text-base">
                  EGP {order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. PAYMENT TERMS & ATELIER POLICY (NO SIGNATURE) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-[#E8E2D8]">
          <div className="sm:col-span-8 space-y-2 text-xs">
            <h4 className="font-bold text-sm text-[#1F1F1F]">
              Terms & Inspection Guarantee (سياسة الاستلام والمعاينة)
            </h4>
            <div className="space-y-1 text-[#444444] text-[11px] leading-relaxed">
              <p>
                • <strong>Package Inspection:</strong> You are entitled to open and inspect your package upon courier arrival prior to payment.
              </p>
              <p>
                • <strong>Exchange Policy:</strong> 14 days exchange window from delivery date for unworn items with original tags.
              </p>
              <p>
                • <strong>Customer Care Hotline:</strong> For instant support or tailoring inquiries, contact us on WhatsApp at <strong>+20 122 085 9992</strong>.
              </p>
            </div>
          </div>

          <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-[#FAF7F2] border border-[#DCC9A6] rounded text-center">
            <span className="text-[10px] uppercase tracking-widest text-[#B67355] font-bold">
              Official Atelier Seal
            </span>
            <p className="font-serif text-sm font-bold text-[#1F1F1F] mt-1">
              ARMIA BOUTIQUE
            </p>
            <span className="text-[9px] text-[#8E8A85] font-mono mt-0.5">
              Verified Order • #{invoiceNumber}
            </span>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM GOLD ACCENT BAR */}
      <div className="w-full h-3 bg-[#E5A84B] mt-6" />
    </div>
  );
}
