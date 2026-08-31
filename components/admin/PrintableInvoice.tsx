'use client';

import React from 'react';
import { Order } from '@/types';
import BrandLogo from '@/components/common/BrandLogo';

interface PrintableInvoiceProps {
  order: Order;
}

export default function PrintableInvoice({ order }: PrintableInvoiceProps) {
  const customer = order.customerDetails;

  // Format date exactly like reference: "June 12, 2028"
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

  const invoiceNumber = order.orderId || (order.id ? `INV-${order.id.slice(0, 7).toUpperCase()}` : 'INV-2028001');

  return (
    <div
      id="printable-invoice"
      className="bg-white text-[#1F1F1F] w-full max-w-[800px] mx-auto font-sans shadow-2xl print:shadow-none print:max-w-none print:w-full print:m-0 relative"
      style={{ minHeight: '1050px' }}
    >
      {/* 1. TOP HEADER SECTION */}
      <div className="grid grid-cols-12 relative">
        {/* Left Dark Block (60% width) */}
        <div className="col-span-7 bg-[#232323] text-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-widest text-white uppercase font-sans">
              INVOICE
            </h1>
            <div className="w-full h-[1.5px] bg-white/70 mt-3 mb-5" />
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
              <span className="col-span-5 text-neutral-300 font-medium">Payment Terms</span>
              <span className="col-span-7 text-[#E5A84B] font-semibold">: Cash on Delivery (COD)</span>
            </div>
          </div>
        </div>

        {/* Right Gold Block (40% width) - Extends downwards slightly */}
        <div className="col-span-5 bg-[#E5A84B] p-6 sm:p-8 flex flex-col items-center justify-center text-center pb-12">
          <BrandLogo variant="dark" size="md" showTagline={true} href="" className="scale-105" />
        </div>
      </div>

      {/* 2. TWO INFORMATION COLUMNS */}
      <div className="px-8 sm:px-10 pt-10 pb-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 text-xs">
          
          {/* Left Column: Boutique Information (Reference: Freelancer Information) */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Boutique Information
            </h3>
            <div className="space-y-1.5 text-[#2A2A2A]">
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Name</span>
                <span className="col-span-8 font-semibold text-black">: ARMIA Boutique (آرميا)</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Address</span>
                <span className="col-span-8">: Cairo Atelier, Egypt</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Phone</span>
                <span className="col-span-8 font-mono">: +20 122 085 9992</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 text-neutral-700 font-medium">Email</span>
                <span className="col-span-8 font-mono">: armiaboutique1@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Right Column: Client Information (Reference: Client Information) */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Client Information
            </h3>
            <div className="space-y-1.5 text-[#2A2A2A]">
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Customer Name</span>
                <span className="col-span-7 font-bold text-black">: {customer?.fullName || 'Valued Client'}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Address</span>
                <span className="col-span-7 leading-tight text-black">: {customer?.address}, {customer?.city}, {customer?.governorate}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Phone</span>
                <span className="col-span-7 font-mono font-bold text-black">: {customer?.phone}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Email</span>
                <span className="col-span-7 font-mono">: {customer?.email || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ITEMS TABLE (MATCHING EXACT GOLD HEADER AND BORDERED GRID) */}
        <div className="pt-2">
          <table className="w-full text-left text-xs border-collapse border border-[#999999]">
            <thead>
              <tr className="bg-[#E5A84B] text-[#1F1F1F] font-bold text-xs">
                <th className="py-2.5 px-3 text-center w-12 border border-[#999999]">No.</th>
                <th className="py-2.5 px-4 text-center border border-[#999999]">Description</th>
                <th className="py-2.5 px-3 text-center w-24 border border-[#999999]">Quantity</th>
                <th className="py-2.5 px-4 text-center w-28 border border-[#999999]">Unit Price</th>
                <th className="py-2.5 px-4 text-center w-28 border border-[#999999]">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-[#999999]">
                  <td className="py-2.5 px-3 text-center font-mono text-neutral-800 border-r border-[#999999]">
                    {idx + 1}.
                  </td>
                  <td className="py-2.5 px-4 border-r border-[#999999]">
                    <span className="font-semibold text-black">{item.name}</span>
                    <span className="text-[11px] text-neutral-600 block">
                      {item.selectedColor?.name} • Size {item.selectedSize}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-black border-r border-[#999999]">
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

              {/* Shipping Row */}
              <tr className="border-b border-[#999999]">
                <td className="py-2.5 px-3 text-center font-mono text-neutral-800 border-r border-[#999999]">
                  {(order.items?.length || 0) + 1}.
                </td>
                <td className="py-2.5 px-4 border-r border-[#999999]">
                  <span className="font-semibold text-black">
                    Doorstep Delivery Across Egypt (توصيل للمحافظات)
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-black border-r border-[#999999]">
                  1
                </td>
                <td className="py-2.5 px-4 text-center font-mono text-neutral-900 border-r border-[#999999]">
                  {order.shippingFee === 0 ? '0.00' : `EGP ${order.shippingFee?.toFixed(2)}`}
                </td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-black border-r border-[#999999]">
                  {order.shippingFee === 0 ? 'Free' : `EGP ${order.shippingFee?.toFixed(2)}`}
                </td>
              </tr>

              {/* Discount / Voucher Promotion Row (if applicable) */}
              {order.discountAmount && order.discountAmount > 0 && (
                <tr className="border-b border-[#999999] bg-emerald-50/50">
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-neutral-800 border-r border-[#999999]">
                    {(order.items?.length || 0) + 2}
                  </td>
                  <td className="py-2.5 px-4 text-left border-r border-[#999999]">
                    <span className="font-bold text-emerald-900 block">
                      {order.discountTitle || 'Special Promotion / Voucher Discount'}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Voucher Code: {order.discountCode || 'AUTO_PROMO'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-neutral-900 border-r border-[#999999]">
                    1
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-emerald-700 font-bold border-r border-[#999999]">
                    -EGP {order.discountAmount?.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-800 border-r border-[#999999]">
                    -EGP {order.discountAmount?.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* TOTAL AMOUNT DUE BAR (EXACT FULL WIDTH GOLD BAR WITH WHITE DIVIDERS) */}
          <div className="bg-[#E5A84B] text-[#1F1F1F] grid grid-cols-12 items-center font-bold border border-t-0 border-[#999999] mt-2">
            <div className="col-span-9 text-center py-2.5 text-sm font-bold tracking-wide border-r border-[#999999]">
              Total Amount Due
            </div>
            <div className="col-span-3 text-center py-2.5 text-sm font-extrabold font-mono tracking-tight">
              EGP {order.totalAmount?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 4. PAYMENT METHOD & AUTHORIZATION SIGNATURE */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 pt-4">
          
          {/* Left: Payment Method Details */}
          <div className="sm:col-span-7 space-y-2.5 text-xs">
            <h4 className="font-bold text-sm text-[#1F1F1F]">
              Payment Method
            </h4>
            <div className="space-y-1 text-[#2A2A2A]">
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Payment Method</span>
                <span className="col-span-7 font-bold text-black">: Cash on Delivery (COD)</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Inspection Policy</span>
                <span className="col-span-7 font-medium text-emerald-800">: Allowed Prior to Payment</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Customer Support</span>
                <span className="col-span-7 font-mono">: +20 122 085 9992 (WhatsApp)</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Instapay Account</span>
                <span className="col-span-7 font-mono font-bold">: 01204000195</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 text-neutral-700 font-medium">Exchange Window</span>
                <span className="col-span-7">: 14 Days from Delivery Date</span>
              </div>
            </div>
          </div>

          {/* Right: Date & Handwritten Signature */}
          <div className="sm:col-span-5 flex flex-col items-center justify-end text-center">
            <p className="text-xs text-neutral-800 font-medium mb-1">
              Date : {formattedDate}
            </p>

            {/* Signature Drawing */}
            <div className="w-48 h-16 relative flex items-center justify-center">
              <svg viewBox="0 0 200 70" className="w-full h-full stroke-black fill-none stroke-[2]">
                <path d="M 20 45 Q 45 10, 70 40 T 120 25 Q 140 65, 170 30" />
                <path d="M 35 55 Q 85 15, 130 40" />
                <path d="M 75 15 Q 85 60, 100 25" />
              </svg>
            </div>

            <div className="w-48 border-t border-black pt-1">
              <p className="font-bold text-xs text-black">
                ARMIA Boutique
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM GOLD ACCENT BLOCK (MATCHING REFERENCE IMAGE) */}
      <div className="flex justify-center mt-12">
        <div className="w-1/2 h-7 bg-[#E5A84B]" />
      </div>
    </div>
  );
}
