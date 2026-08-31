'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Search,
  Phone,
  MessageCircle,
  Printer,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileCheck,
  Zap,
  ShieldAlert,
  Smartphone,
  Banknote,
  Check,
} from 'lucide-react';
import {
  getAllOrders,
  updateOrderStatusInFirestore,
  updatePaymentStatusInFirestore,
} from '@/lib/productService';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { useToast } from '@/context/ToastContext';
import PrintableInvoice from '@/components/admin/PrintableInvoice';

export default function AdminOrdersPage() {
  const { success, error, info } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inspectReceiptOrder, setInspectReceiptOrder] = useState<Order | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAllOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching admin orders:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusInFirestore(orderId, newStatus);
      success(`Order #${orderId} status changed to ${newStatus.toUpperCase()}`, 'Status Updated');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o.orderId === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderId === orderId)) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
      const e = err as { message?: string };
      error('Failed to update status: ' + (e.message || 'Error occurred'));
    }
  };

  const handleVerifyPayment = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    setVerifyingPayment(true);
    try {
      const autoConfirm = newPaymentStatus === 'verified';
      await updatePaymentStatusInFirestore(orderId, newPaymentStatus, autoConfirm);
      
      success(
        newPaymentStatus === 'verified'
          ? `Instapay payment verified & Order #${orderId} confirmed!`
          : `Payment marked as ${newPaymentStatus}`,
        'Payment Verified'
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.orderId === orderId
            ? {
                ...o,
                paymentStatus: newPaymentStatus,
                status: autoConfirm ? 'confirmed' : o.status,
              }
            : o
        )
      );

      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderId === orderId)) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: newPaymentStatus,
                status: autoConfirm ? 'confirmed' : prev.status,
              }
            : null
        );
      }

      if (inspectReceiptOrder && (inspectReceiptOrder.id === orderId || inspectReceiptOrder.orderId === orderId)) {
        setInspectReceiptOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: newPaymentStatus,
                status: autoConfirm ? 'confirmed' : prev.status,
              }
            : null
        );
      }
    } catch (err: unknown) {
      console.error('Payment verification failed:', err);
      const e = err as { message?: string };
      error('Failed to update payment status: ' + (e.message || 'Error occurred'));
    } finally {
      setVerifyingPayment(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'INSTAPAY' && ord.paymentMethod === 'INSTAPAY') ||
      (paymentFilter === 'COD' && (ord.paymentMethod === 'COD' || !ord.paymentMethod)) ||
      (paymentFilter === 'pending_verification' && ord.paymentMethod === 'INSTAPAY' && ord.paymentStatus === 'pending_verification');

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ord.orderId.toLowerCase().includes(q) ||
      ord.customerDetails?.fullName.toLowerCase().includes(q) ||
      ord.customerDetails?.phone.includes(q) ||
      ord.customerDetails?.governorate.toLowerCase().includes(q) ||
      ord.customerDetails?.city.toLowerCase().includes(q) ||
      (ord.instapaySenderAccount && ord.instapaySenderAccount.toLowerCase().includes(q));

    return matchesStatus && matchesPayment && matchesSearch;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'confirmed':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'processing':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'shipped':
        return 'bg-[#B67355]/30 text-[#DCC9A6] border-[#B67355]';
      case 'delivered':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'cancelled':
        return 'bg-red-950 text-red-300 border-red-800';
    }
  };

  const instapayPendingCount = orders.filter(
    (o) => o.paymentMethod === 'INSTAPAY' && (!o.paymentStatus || o.paymentStatus === 'pending_verification')
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Real-Time Order & Verification Feed
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Orders & Payment Verification
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans">
            Review incoming orders, verify uploaded Instapay receipts, and manage delivery logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {instapayPendingCount > 0 && (
            <button
              onClick={() => setPaymentFilter('pending_verification')}
              className="inline-flex items-center gap-2 bg-[#B67355] text-white px-3.5 py-2 text-xs uppercase tracking-wider font-bold rounded shadow-lg animate-pulse"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{instapayPendingCount} Instapay Receipts to Verify</span>
            </button>
          )}

          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-2 bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#2A2A2A] transition-colors rounded"
          >
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 space-y-4 shadow-sm rounded-xl">
        
        {/* Payment Method Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#333333] pb-3">
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-[#8E8A85] mr-2">
            Payment:
          </span>
          {[
            { id: 'all', label: 'All Payment Types' },
            { id: 'COD', label: 'Cash on Delivery (COD)' },
            { id: 'INSTAPAY', label: 'Instapay Transfer' },
            { id: 'pending_verification', label: `Pending Instapay Verification (${instapayPendingCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPaymentFilter(tab.id)}
              className={`px-3 py-1 text-xs font-sans uppercase tracking-wider font-semibold rounded transition-all ${
                paymentFilter === tab.id
                  ? 'bg-[#DCC9A6] text-[#1F1F1F] shadow-sm'
                  : 'bg-[#141414] text-[#8E8A85] border border-[#333333] hover:text-[#DCC9A6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Order Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-[#8E8A85] mr-2">
            Status:
          </span>
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'processing', label: 'Processing' },
            { id: 'shipped', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider font-semibold rounded transition-all ${
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
            placeholder="Search by Order ID (e.g. ARM-12345), customer name, phone, Instapay sender account, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#333333] text-white px-4 py-2.5 pl-10 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
          />
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-sm rounded-xl">
        {loading ? (
          <div className="py-16 text-center text-[#8E8A85] text-xs">
            <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading orders from database...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-[#8E8A85] mx-auto mb-2" />
            <p className="font-serif text-base text-[#DCC9A6]">No orders match your filter</p>
            <p className="text-xs text-[#8E8A85]">Try clearing search keywords or selecting another status tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#141414] border-b border-[#333333] text-[#8E8A85] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Governorate / City</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Payment Method & Receipt</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Delivery Status</th>
                  <th className="py-3.5 px-4 text-right">Invoice & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredOrders.map((ord) => {
                  const isInstapay = ord.paymentMethod === 'INSTAPAY';
                  const hasReceipt = Boolean(ord.receiptUrl);
                  const isPaymentVerified = ord.paymentStatus === 'verified';
                  const isPaymentRejected = ord.paymentStatus === 'rejected';

                  return (
                    <tr key={ord.id || ord.orderId} className="hover:bg-[#252525] transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-white">
                        <div className="flex flex-col">
                          <span>#{ord.orderId}</span>
                          <span className="text-[10px] text-[#8E8A85] font-normal">
                            {typeof ord.createdAt === 'string'
                              ? new Date(ord.createdAt).toLocaleDateString('en-GB')
                              : 'Recent'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-medium text-white">{ord.customerDetails?.fullName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${ord.customerDetails?.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-[#DCC9A6] hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{ord.customerDetails?.phone}</span>
                          </a>
                          <a
                            href={`https://wa.me/2${ord.customerDetails?.phone?.replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Open WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-[#8E8A85]">
                        <p className="text-white">{ord.customerDetails?.governorate}</p>
                        <p className="text-[11px] truncate max-w-[140px]">{ord.customerDetails?.city}</p>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-white font-semibold">{ord.items?.length} items</span>
                        <p className="text-[10px] text-[#8E8A85] truncate max-w-[150px]">
                          {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </td>

                      {/* Payment Method & Instapay Receipt Column */}
                      <td className="py-4 px-4">
                        {isInstapay ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 bg-[#B67355] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                <Zap className="w-3 h-3 fill-current" />
                                <span>INSTAPAY</span>
                              </span>
                              {isPaymentVerified ? (
                                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  ✓ Verified
                                </span>
                              ) : isPaymentRejected ? (
                                <span className="bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  ✕ Rejected
                                </span>
                              ) : (
                                <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                                  ⏳ Verify Receipt
                                </span>
                              )}
                            </div>

                            {hasReceipt && (
                              <button
                                type="button"
                                onClick={() => setInspectReceiptOrder(ord)}
                                className="inline-flex items-center gap-1.5 bg-[#141414] hover:bg-[#2A2A2A] border border-[#333333] text-[#DCC9A6] text-[11px] px-2 py-1 rounded transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#B67355]" />
                                <span>Inspect Receipt</span>
                              </button>
                            )}

                            {ord.instapaySenderAccount && (
                              <p className="text-[10px] text-[#8E8A85] truncate max-w-[150px]">
                                Sender: {ord.instapaySenderAccount}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 bg-[#141414] border border-[#333333] text-[#DCC9A6] text-[10px] font-bold px-2 py-0.5 rounded">
                              <Banknote className="w-3 h-3 text-[#DCC9A6]" />
                              <span>COD (الدفع عند الاستلام)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-serif text-sm font-bold text-[#DCC9A6]">
                          EGP {ord.totalAmount?.toFixed(2)}
                        </span>
                        {ord.discountAmount && ord.discountAmount > 0 && (
                          <span className="block text-[10px] text-emerald-400 font-mono">
                            -EGP {ord.discountAmount.toFixed(2)} discount
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            handleStatusChange(ord.id || ord.orderId, e.target.value as OrderStatus)
                          }
                          className={`text-[11px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 border focus:outline-none cursor-pointer rounded ${getStatusColor(
                            ord.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="inline-flex items-center gap-1 bg-[#141414] border border-[#333333] text-[#DCC9A6] px-3 py-1.5 text-xs hover:border-[#DCC9A6] transition-colors rounded"
                        >
                          <span>Invoice</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DEDICATED INSTAPAY RECEIPT INSPECTION & VERIFICATION MODAL */}
      {inspectReceiptOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl rounded-2xl text-white space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#B67355] flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#B67355] font-bold">
                    Instapay Payment Verification
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white mt-0.5">
                    Order #{inspectReceiptOrder.orderId}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectReceiptOrder(null)}
                className="p-1.5 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verification Details Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#141414] p-4 border border-[#333333] rounded-xl text-xs">
              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Expected Total</span>
                <span className="font-serif font-bold text-sm text-[#DCC9A6]">
                  EGP {inspectReceiptOrder.totalAmount?.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Instapay Target</span>
                <span className="font-mono font-bold text-white">01204000195</span>
              </div>

              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Customer</span>
                <span className="font-semibold text-white truncate block">
                  {inspectReceiptOrder.customerDetails?.fullName}
                </span>
              </div>

              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Current Verification</span>
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${
                    inspectReceiptOrder.paymentStatus === 'verified'
                      ? 'bg-emerald-900 text-emerald-300'
                      : inspectReceiptOrder.paymentStatus === 'rejected'
                      ? 'bg-red-900 text-red-300'
                      : 'bg-amber-900 text-amber-300'
                  }`}
                >
                  {inspectReceiptOrder.paymentStatus?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Customer Sender Account Info (if provided) */}
            {inspectReceiptOrder.instapaySenderAccount && (
              <div className="p-3 bg-[#141414] border border-[#333333] rounded-lg text-xs flex items-center justify-between">
                <span className="text-[#8E8A85]">Sender Account / Phone stated by customer:</span>
                <span className="font-mono font-bold text-white">
                  {inspectReceiptOrder.instapaySenderAccount}
                </span>
              </div>
            )}

            {/* High-Resolution Receipt Image Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans uppercase tracking-wider text-[#8E8A85] font-semibold">
                  Uploaded Transfer Receipt Screenshot:
                </span>
                {inspectReceiptOrder.receiptUrl && (
                  <a
                    href={inspectReceiptOrder.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#DCC9A6] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Full Size</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="relative w-full max-h-[380px] h-[340px] bg-[#141414] border border-[#333333] rounded-xl overflow-hidden flex items-center justify-center p-2">
                {inspectReceiptOrder.receiptUrl ? (
                  <Image
                    src={inspectReceiptOrder.receiptUrl}
                    alt={`Receipt for #${inspectReceiptOrder.orderId}`}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="text-center text-[#8E8A85] text-xs">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                    <span>No receipt image attached</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#333333]">
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/2${inspectReceiptOrder.customerDetails?.phone?.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-2 text-xs font-semibold rounded hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Customer</span>
                </a>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={verifyingPayment}
                  onClick={() => handleVerifyPayment(inspectReceiptOrder.id || inspectReceiptOrder.orderId, 'rejected')}
                  className="bg-red-950 border border-red-800 hover:bg-red-900 text-red-300 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  ✕ Reject Receipt
                </button>

                <button
                  type="button"
                  disabled={verifyingPayment}
                  onClick={() => handleVerifyPayment(inspectReceiptOrder.id || inspectReceiptOrder.orderId, 'verified')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 text-xs font-bold uppercase tracking-wider rounded shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>✓ Approve & Confirm Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED BILINGUAL ORDER INVOICE MODAL & A4 PRINTABLE VIEW */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#1F1F1F] border border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] rounded-2xl">
            
            {/* Modal Controls Bar (Screen Only - Hidden in Print) */}
            <div className="no-print bg-[#141414] border-b border-[#333333] px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-[#DCC9A6] font-bold">
                  Official Invoice Preview • معاينة الفاتورة
                </span>
                <span className="text-xs bg-black px-2 py-0.5 border border-[#333333] text-white font-mono rounded">
                  #{selectedOrder.orderId || selectedOrder.id}
                </span>
                {selectedOrder.paymentMethod === 'INSTAPAY' && (
                  <span className="bg-[#B67355] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ⚡ INSTAPAY
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedOrder.receiptUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setInspectReceiptOrder(selectedOrder);
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#B67355] text-white px-3 py-1.5 text-xs font-semibold rounded hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                )}

                <a
                  href={`tel:${selectedOrder.customerDetails?.phone}`}
                  className="inline-flex items-center gap-1.5 bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs font-semibold hover:border-[#DCC9A6] transition-colors rounded"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/2${selectedOrder.customerDetails?.phone?.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity rounded"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                  className="inline-flex items-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] px-4 py-1.5 text-xs uppercase font-bold tracking-wider hover:bg-white transition-all shadow-md active:scale-95 rounded"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-[#8E8A85] hover:text-white transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Container with Printable Invoice */}
            <div className="overflow-y-auto p-4 sm:p-8 bg-[#2A2A2A]">
              <PrintableInvoice order={selectedOrder} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
