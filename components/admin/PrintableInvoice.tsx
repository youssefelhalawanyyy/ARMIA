'use client';

import React from 'react';
import { Order } from '@/types';
import BrandLogo from '@/components/common/BrandLogo';
import { printIsolatedInvoice } from '@/lib/invoiceGenerator';
import { Printer } from 'lucide-react';

interface PrintableInvoiceProps {
  order: Order;
  showPrintButton?: boolean;
}

export default function PrintableInvoice({ order, showPrintButton = true }: PrintableInvoiceProps) {
  const customer = order.customerDetails;

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
  const subtotalAfterDiscount = (order.subtotal || 0) - (order.discountAmount || 0);

  return (
    <div className="space-y-4">
      {showPrintButton && (
        <div className="no-print flex justify-end">
          <button
            type="button"
            onClick={() => printIsolatedInvoice(order)}
            className="inline-flex items-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] px-4 py-2 text-xs uppercase font-bold tracking-wider hover:bg-white transition-all shadow-md rounded"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official A4 Invoice (1 Page)</span>
          </button>
        </div>
      )}

      <div
        id="printable-invoice"
        className="bg-white text-[#1F1F1F] w-full max-w-[780px] mx-auto font-sans shadow-lg relative border border-[#E8E2D8]"
      >
        {/* 1. TOP HEADER SECTION */}
        <div className="grid grid-cols-12 relative">
          {/* Left Dark Block */}
          <div className="col-span-7 bg-[#202020] text-white p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-white uppercase font-sans">
                  INVOICE
                </h1>
                <span className="text-xs font-mono text-[#E5A84B] font-bold">
                  فاتورة شراء رسمية
                </span>
              </div>
              <div className="w-full h-[1.5px] bg-white/40 mt-2 mb-3" />
            </div>

            <div className="space-y-1 text-xs text-neutral-200 font-sans">
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

          {/* Right Gold Block */}
          <div className="col-span-5 bg-[#E5A84B] p-6 flex flex-col items-center justify-center text-center">
            <BrandLogo variant="dark" size="md" showTagline={true} href="" className="scale-105" />
            <p className="text-[9.5px] text-[#1F1F1F] font-bold uppercase tracking-widest mt-2">
              Haute Couture • Cairo Atelier
            </p>
          </div>
        </div>

        {/* 2. TWO INFORMATION COLUMNS: BOUTIQUE & CLIENT LOCATION DETAILS */}
        <div className="px-6 sm:px-8 pt-6 pb-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            
            {/* Left Column: Boutique Information */}
            <div className="space-y-1.5 border-r border-[#E8E2D8]/80 pr-4">
              <h3 className="font-bold text-xs text-[#1F1F1F] border-b border-[#202020] pb-1 flex items-center justify-between uppercase tracking-wider">
                <span>Boutique Information</span>
                <span className="text-[10px] text-[#8E8A85] font-normal">بيانات الأتيليه</span>
              </h3>
              <div className="space-y-1 text-[#2A2A2A] text-[11px]">
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-neutral-600 font-medium">Boutique</span>
                  <span className="col-span-8 font-bold text-black">: ARMIA Boutique (آرميا)</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-neutral-600 font-medium">Location</span>
                  <span className="col-span-8">: Cairo Atelier & Showroom, Egypt</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-neutral-600 font-medium">Hotline</span>
                  <span className="col-span-8 font-mono font-bold text-black">: +20 122 085 9992</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-neutral-600 font-medium">WhatsApp</span>
                  <span className="col-span-8 font-mono">: +20 122 085 9992</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-neutral-600 font-medium">Email</span>
                  <span className="col-span-8 font-mono">: armiaboutique1@gmail.com</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-neutral-600 font-medium">Instapay</span>
                  <span className="col-span-8 font-mono font-bold text-[#B67355]">: 01204000195</span>
                </div>
              </div>
            </div>

            {/* Right Column: Client Information & Delivery Location */}
            <div className="space-y-1.5 pl-2">
              <h3 className="font-bold text-xs text-[#1F1F1F] border-b border-[#202020] pb-1 flex items-center justify-between uppercase tracking-wider">
                <span>Client & Destination</span>
                <span className="text-[10px] text-[#8E8A85] font-normal">بيانات العميل والشحن</span>
              </h3>
              <div className="space-y-1 text-[#2A2A2A] text-[11px]">
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-neutral-600 font-medium">Customer Name</span>
                  <span className="col-span-7 font-bold text-black">: {customer?.fullName || 'Valued Client'}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-neutral-600 font-medium">Governorate</span>
                  <span className="col-span-7 font-semibold text-black">: {customer?.governorate || 'Cairo'}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-neutral-600 font-medium">City / District</span>
                  <span className="col-span-7 text-black">: {customer?.city || 'Cairo'}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-neutral-600 font-medium">Detailed Address</span>
                  <span className="col-span-7 leading-tight text-black font-medium">: {customer?.address || 'Cairo, Egypt'}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-5 text-neutral-600 font-medium">Contact Phone</span>
                  <span className="col-span-7 font-mono font-bold text-black">
                    : {customer?.phone} {customer?.alternatePhone ? ` / ${customer.alternatePhone}` : ''}
                  </span>
                </div>
                {customer?.notes && (
                  <div className="grid grid-cols-12">
                    <span className="col-span-5 text-neutral-600 font-medium">Delivery Notes</span>
                    <span className="col-span-7 italic text-[#B67355]">: {customer.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. ITEMS TABLE (ONLY PURCHASED PRODUCTS) */}
          <div className="pt-2">
            <table className="w-full text-left text-xs border-collapse border border-[#c4c4c4]">
              <thead>
                <tr className="bg-[#E5A84B] text-[#1F1F1F] font-bold text-xs">
                  <th className="py-2 px-3 text-center w-10 border border-[#c4c4c4]">No.</th>
                  <th className="py-2 px-4 text-center border border-[#c4c4c4]">Description (المنتج والوصف)</th>
                  <th className="py-2 px-3 text-center w-20 border border-[#c4c4c4]">Qty (الكمية)</th>
                  <th className="py-2 px-4 text-center w-28 border border-[#c4c4c4]">Unit Price (السعر)</th>
                  <th className="py-2 px-4 text-right w-28 border border-[#c4c4c4]">Subtotal (المجموع)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#c4c4c4]">
                    <td className="py-2 px-3 text-center font-mono text-neutral-800 border-r border-[#c4c4c4]">
                      ${idx + 1}.
                    </td>
                    <td className="py-2 px-4 border-r border-[#c4c4c4]">
                      <span className="font-bold text-black">{item.name}</span>
                      <span className="text-[10px] text-neutral-600 block">
                        {item.selectedColor?.name} • Size {item.selectedSize}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-black border-r border-[#c4c4c4]">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-4 text-center font-mono text-neutral-900 border-r border-[#c4c4c4]">
                      EGP {item.price.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-black border-r border-[#c4c4c4]">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. FINANCIAL SUMMARY BREAKDOWN UNDER TABLE BEFORE TOTAL */}
            <div className="flex justify-end mt-2">
              <div className="w-full sm:w-80 border border-[#c4c4c4] bg-white text-xs divide-y divide-[#c4c4c4]">
                
                {/* Items Subtotal */}
                <div className="flex justify-between items-center py-1.5 px-3">
                  <span className="text-neutral-700 font-medium">
                    Items Subtotal (المجموع الفرعي):
                  </span>
                  <span className="font-mono font-bold text-black">
                    EGP {order.subtotal?.toFixed(2)}
                  </span>
                </div>

                {/* Applied Discount (if any) */}
                {order.discountAmount && order.discountAmount > 0 ? (
                  <>
                    <div className="flex justify-between items-center py-1.5 px-3 bg-emerald-50 text-emerald-900">
                      <span className="font-bold">
                        Discount ({order.discountTitle || order.discountCode || 'Promotion'}):
                      </span>
                      <span className="font-mono font-bold text-emerald-800">
                        -EGP {order.discountAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 px-3 bg-neutral-50 text-neutral-800 font-semibold">
                      <span>Total After Discount (بعد الخصم):</span>
                      <span className="font-mono font-bold text-emerald-700">
                        EGP {subtotalAfterDiscount.toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : null}

                {/* Shipping & Delivery Fee */}
                <div className="flex justify-between items-center py-1.5 px-3">
                  <span className="text-neutral-700 font-medium">
                    Delivery Fee ({customer?.governorate?.split('(')[0]?.trim() || 'Cairo'}):
                  </span>
                  <span className="font-mono font-bold text-black">
                    {order.shippingFee === 0 ? 'FREE (مجاناً)' : `EGP ${order.shippingFee?.toFixed(2)}`}
                  </span>
                </div>

                {/* TOTAL AMOUNT DUE BAR */}
                <div className="bg-[#E5A84B] text-[#1F1F1F] flex justify-between items-center py-2 px-3 font-bold text-sm">
                  <span>TOTAL AMOUNT DUE (الإجمالي المستحق):</span>
                  <span className="font-mono font-extrabold text-base">
                    EGP {order.totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. POLICY & SEAL (NO SIGNATURE) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-3 border-t border-[#E8E2D8]">
            <div className="sm:col-span-8 space-y-1 text-xs">
              <h4 className="font-bold text-xs text-[#1F1F1F] uppercase tracking-wider">
                Terms of Inspection Guarantee (سياسة الاستلام والمعاينة)
              </h4>
              <div className="space-y-0.5 text-[#444444] text-[10px] leading-relaxed">
                <p>• <strong>Inspection:</strong> Open and inspect garments upon courier arrival before payment.</p>
                <p>• <strong>Exchange Window:</strong> 14 days for unworn items with original tags attached.</p>
                <p>• <strong>Customer Support:</strong> WhatsApp / Call <strong>+20 122 085 9992</strong>.</p>
              </div>
            </div>

            <div className="sm:col-span-4 flex flex-col items-center justify-center p-2.5 bg-[#FAF7F2] border border-[#DCC9A6] rounded text-center">
              <span className="text-[9px] uppercase tracking-widest text-[#B67355] font-bold">
                Official Atelier Seal
              </span>
              <p className="font-serif text-xs font-bold text-[#1F1F1F]">
                ARMIA BOUTIQUE
              </p>
              <span className="text-[8.5px] text-[#8E8A85] font-mono">
                Verified Order • #{invoiceNumber}
              </span>
            </div>
          </div>
        </div>

        {/* 6. BOTTOM GOLD BAR */}
        <div className="w-full h-2.5 bg-[#E5A84B] mt-4" />
      </div>
    </div>
  );
}
