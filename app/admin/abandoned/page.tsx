'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  ShoppingCart,
  Search,
  Phone,
  MessageCircle,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Tag,
  ExternalLink,
  X,
  Send,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  getAllAbandonedCheckouts,
  updateAbandonedStatus,
  generateWhatsAppRecoveryLink,
} from '@/lib/abandonedService';
import { AbandonedCheckout, AbandonedRecoveryStatus } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function AdminAbandonedPage() {
  const { success, error, info } = useToast();
  const [checkouts, setCheckouts] = useState<AbandonedCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCheckout, setSelectedCheckout] = useState<AbandonedCheckout | null>(null);
  const [recoveryPromoCode, setRecoveryPromoCode] = useState<string>('VIP5');

  const loadAbandoned = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAbandonedCheckouts();
      setCheckouts(data);
    } catch (err) {
      console.error('Error fetching abandoned checkouts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAllAbandonedCheckouts()
      .then((data) => {
        if (isMounted) {
          setCheckouts(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading abandoned checkouts:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: AbandonedRecoveryStatus) => {
    try {
      await updateAbandonedStatus(id, newStatus);
      success(
        newStatus === 'recovered'
          ? 'Abandoned checkout marked as RECOVERED! 🎉'
          : `Status changed to ${newStatus.toUpperCase()}`,
        'Status Updated'
      );
      setCheckouts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      if (selectedCheckout && selectedCheckout.id === id) {
        setSelectedCheckout((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
      const e = err as { message?: string };
      error('Failed to update status: ' + (e.message || 'Error occurred'));
    }
  };

  const totalAbandonedValue = checkouts.reduce((sum, c) => sum + (c.subtotal || 0), 0);
  const droppedCount = checkouts.filter((c) => c.status === 'dropped').length;
  const contactedCount = checkouts.filter((c) => c.status === 'contacted').length;
  const recoveredCount = checkouts.filter((c) => c.status === 'recovered').length;
  const recoveredValue = checkouts
    .filter((c) => c.status === 'recovered')
    .reduce((sum, c) => sum + (c.subtotal || 0), 0);

  const filteredCheckouts = checkouts.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const cust = c.customerDetails;
    const matchesSearch =
      !q ||
      (cust?.fullName && cust.fullName.toLowerCase().includes(q)) ||
      (cust?.phone && cust.phone.includes(q)) ||
      (cust?.email && cust.email.toLowerCase().includes(q)) ||
      (cust?.city && cust.city.toLowerCase().includes(q)) ||
      (cust?.governorate && cust.governorate.toLowerCase().includes(q)) ||
      c.items.some((i) => i.name.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: AbandonedRecoveryStatus) => {
    switch (status) {
      case 'dropped':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Dropped / Pending</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
            <MessageCircle className="w-3 h-3 text-blue-400" />
            <span>Contacted</span>
          </span>
        );
      case 'recovered':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>✓ Recovered</span>
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 bg-neutral-900 text-neutral-400 border border-neutral-700 text-[10px] font-medium px-2 py-0.5 rounded">
            <span>Dismissed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Cart Drop-off & Recovery Engine
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Abandoned Checkout Recovery
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans">
            Track visitors who entered contact details but did not complete order placement. Reach out via 1-click WhatsApp with tailored discounts.
          </p>
        </div>

        <button
          onClick={loadAbandoned}
          className="inline-flex items-center gap-2 bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#2A2A2A] transition-colors rounded"
        >
          <span>Refresh List</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1F1F1F] border border-[#333333] p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Dropped Sessions</span>
            <ShoppingCart className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {checkouts.length}
          </p>
          <span className="text-[10px] text-amber-400 block">
            {droppedCount} pending follow-up
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Lost Potential Value</span>
            <DollarSign className="w-4 h-4 text-[#DCC9A6]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#DCC9A6]">
            EGP {totalAbandonedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            Total in dropped carts
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Recovered Sales</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            EGP {recoveredValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-400 block">
            {recoveredCount} completed orders recovered
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Recovery Rate</span>
            <RotateCcw className="w-4 h-4 text-[#B67355]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {checkouts.length > 0 ? Math.round((recoveredCount / checkouts.length) * 100) : 0}%
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            {contactedCount} contacted via WhatsApp
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 space-y-4 shadow-sm rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `All Dropped (${checkouts.length})` },
            { id: 'dropped', label: `Pending Follow-up (${droppedCount})` },
            { id: 'contacted', label: `Contacted (${contactedCount})` },
            { id: 'recovered', label: `Recovered (${recoveredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-sans uppercase tracking-wider font-semibold rounded transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#B67355] text-white shadow-md'
                  : 'bg-[#141414] text-[#8E8A85] border border-[#333333] hover:text-[#DCC9A6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search by customer name, phone number, email, city, or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#333333] text-white px-4 py-2.5 pl-10 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
          />
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Abandoned Checkouts Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-sm rounded-xl">
        {loading ? (
          <div className="py-16 text-center text-[#8E8A85] text-xs">
            <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading abandoned checkouts feed...</p>
          </div>
        ) : filteredCheckouts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShoppingCart className="w-10 h-10 text-[#8E8A85] mx-auto mb-2" />
            <p className="font-serif text-base text-[#DCC9A6]">No abandoned checkouts match your filter</p>
            <p className="text-xs text-[#8E8A85]">Check back soon or choose another status tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#141414] border-b border-[#333333] text-[#8E8A85] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Customer & Contact</th>
                  <th className="py-3.5 px-4">Governorate / City</th>
                  <th className="py-3.5 px-4">Items Left in Cart</th>
                  <th className="py-3.5 px-4">Cart Value</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">1-Click WhatsApp Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredCheckouts.map((checkout) => {
                  const cust = checkout.customerDetails;
                  const phone = cust?.phone;
                  const waLink = generateWhatsAppRecoveryLink(checkout, recoveryPromoCode);

                  return (
                    <tr key={checkout.id} className="hover:bg-[#252525] transition-colors">
                      {/* Customer Name & Phone */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-white">
                          {cust?.fullName || 'Anonymous Visitor'}
                        </p>
                        {phone ? (
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`tel:${phone}`}
                              className="inline-flex items-center gap-1 text-[11px] text-[#DCC9A6] hover:underline"
                            >
                              <Phone className="w-3 h-3 text-[#B67355]" />
                              <span>{phone}</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8E8A85] block">
                            {cust?.email || 'No phone entered'}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-[#8E8A85]">
                        <p className="text-white font-medium">{cust?.governorate || 'Cairo'}</p>
                        <p className="text-[11px] truncate max-w-[130px]">{cust?.city || '-'}</p>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {checkout.items?.slice(0, 3).map((item, i) => (
                            <div
                              key={i}
                              className="relative w-8 h-10 bg-[#141414] border border-[#333333] rounded overflow-hidden shrink-0"
                            >
                              {item.imageUrl && (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                          ))}
                          <div className="min-w-0">
                            <span className="font-bold text-white block">
                              {checkout.items?.length || 0} items
                            </span>
                            <span className="text-[10px] text-[#8E8A85] truncate block max-w-[160px]">
                              {checkout.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 px-4">
                        <span className="font-serif font-bold text-[#DCC9A6] text-sm">
                          EGP {checkout.subtotal?.toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(checkout.status)}
                      </td>

                      {/* 1-Click WhatsApp Recovery Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {phone ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => handleStatusUpdate(checkout.id, 'contacted')}
                              className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 text-xs font-semibold rounded hover:opacity-90 transition-opacity shadow-sm"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp Reminder</span>
                            </a>
                          ) : (
                            <span className="text-neutral-500 text-[10px]">No phone number</span>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedCheckout(checkout)}
                            className="inline-flex items-center gap-1 bg-[#141414] border border-[#333333] text-[#DCC9A6] px-2.5 py-1.5 text-xs rounded hover:border-[#DCC9A6] transition-colors"
                          >
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL & RECOVERY MODAL */}
      {selectedCheckout && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl rounded-2xl text-white space-y-6">
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B67355] flex items-center justify-center text-white">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">
                    Abandoned Checkout Details
                  </h3>
                  <p className="text-xs text-[#8E8A85]">
                    Session ID: {selectedCheckout.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCheckout(null)}
                className="p-1.5 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-4 bg-[#141414] border border-[#333333] rounded-xl text-xs space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-1.5">
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-[#CCCCCC]">
                <p><strong>Name:</strong> {selectedCheckout.customerDetails?.fullName || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedCheckout.customerDetails?.phone || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedCheckout.customerDetails?.email || 'N/A'}</p>
                <p><strong>Location:</strong> {selectedCheckout.customerDetails?.governorate || 'Cairo'}, {selectedCheckout.customerDetails?.city || ''}</p>
              </div>
            </div>

            {/* Items in Cart */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-1.5">
                Items Left Behind ({selectedCheckout.items?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedCheckout.items?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#141414] border border-[#333333] rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-white">{item.name}</h5>
                      <span className="text-[11px] text-[#8E8A85]">
                        {item.selectedColor?.name} • Size {item.selectedSize} • Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="font-serif font-bold text-[#DCC9A6]">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Recovery Box */}
            <div className="p-4 bg-[#141414] border border-[#333333] rounded-xl text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase tracking-wider">
                  Special Recovery Promo Code:
                </span>
                <input
                  type="text"
                  value={recoveryPromoCode}
                  onChange={(e) => setRecoveryPromoCode(e.target.value.toUpperCase())}
                  className="bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] font-mono font-bold px-3 py-1 text-xs rounded w-24 text-center"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#333333]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedCheckout.id, 'recovered')}
                    className="bg-emerald-900 border border-emerald-700 hover:bg-emerald-800 text-emerald-200 px-3 py-1.5 text-xs font-bold rounded"
                  >
                    ✓ Mark as Recovered
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(selectedCheckout.id, 'dismissed')}
                    className="bg-neutral-800 text-neutral-400 px-3 py-1.5 text-xs rounded"
                  >
                    Dismiss
                  </button>
                </div>

                {selectedCheckout.customerDetails?.phone && (
                  <a
                    href={generateWhatsAppRecoveryLink(selectedCheckout, recoveryPromoCode)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleStatusUpdate(selectedCheckout.id, 'contacted')}
                    className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-4 py-1.5 text-xs font-bold rounded hover:opacity-90 shadow-md"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send WhatsApp Recovery</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
