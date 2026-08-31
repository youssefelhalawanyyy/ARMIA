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
  RotateCcw,
  AlertTriangle,
  FileText,
  Truck,
  MapPin,
  Clock,
  User,
  Package,
} from 'lucide-react';
import {
  getAllOrders,
  updateOrderStatusInFirestore,
  updatePaymentStatusInFirestore,
} from '@/lib/productService';
import { checkCustomerReturnHistory } from '@/lib/clientService';
import { printIsolatedInvoice } from '@/lib/invoiceGenerator';
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
  
  // Modals state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<Order | null>(null);
  const [inspectReceiptOrder, setInspectReceiptOrder] = useState<Order | null>(null);
  const [updatingAction, setUpdatingAction] = useState(false);

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
      success(
        newStatus === 'returned'
          ? `Order #${orderId} marked as RETURNED (تم تسجيل كمرتجع)`
          : `Order #${orderId} status changed to ${newStatus.toUpperCase()}`,
        'Status Updated'
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId || o.orderId === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedDetailsOrder && (selectedDetailsOrder.id === orderId || selectedDetailsOrder.orderId === orderId)) {
        setSelectedDetailsOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      if (selectedInvoiceOrder && (selectedInvoiceOrder.id === orderId || selectedInvoiceOrder.orderId === orderId)) {
        setSelectedInvoiceOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
      const e = err as { message?: string };
      error('Failed to update status: ' + (e.message || 'Error occurred'));
    }
  };

  const handleVerifyPayment = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    setUpdatingAction(true);
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

      if (selectedDetailsOrder && (selectedDetailsOrder.id === orderId || selectedDetailsOrder.orderId === orderId)) {
        setSelectedDetailsOrder((prev) =>
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
      setUpdatingAction(false);
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
      case 'returned':
        return 'bg-rose-950 text-rose-300 border-rose-800 font-bold';
      case 'cancelled':
        return 'bg-red-950 text-red-300 border-red-800';
    }
  };

  const instapayPendingCount = orders.filter(
    (o) => o.paymentMethod === 'INSTAPAY' && (!o.paymentStatus || o.paymentStatus === 'pending_verification')
  ).length;

  const returnedOrdersCount = orders.filter((o) => o.status === 'returned').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Real-Time Order & Verification Feed
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Orders & Returns Management
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans">
            Manage live orders, inspect Instapay receipts, view complete customer details, and track return histories.
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
            { id: 'returned', label: `⚠️ Returned (${returnedOrdersCount})` },
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
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer Details & Risk</th>
                  <th className="py-3.5 px-4">Governorate / City</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4">Payment Method & Receipt</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Delivery Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredOrders.map((ord) => {
                  const isInstapay = ord.paymentMethod === 'INSTAPAY';
                  const hasReceipt = Boolean(ord.receiptUrl);
                  const isPaymentVerified = ord.paymentStatus === 'verified';
                  const isPaymentRejected = ord.paymentStatus === 'rejected';

                  // SMART PREVIOUS RETURN DETECTION
                  const returnHistory = checkCustomerReturnHistory(
                    ord.customerDetails,
                    ord.customerUid,
                    ord.id || ord.orderId,
                    orders
                  );

                  return (
                    <tr
                      key={ord.id || ord.orderId}
                      className={`hover:bg-[#252525] transition-colors ${
                        returnHistory.hasReturns ? 'bg-red-950/15' : ''
                      }`}
                    >
                      {/* Order ID */}
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

                      {/* Customer Details + Smart Return Risk Alert */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-white">{ord.customerDetails?.fullName}</p>
                        
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

                        {/* SMART RETURN WARNING BADGE ON NEW ORDERS */}
                        {returnHistory.hasReturns && (
                          <div className="mt-1.5 inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                            <span>⚠️ Previous Returns: {returnHistory.returnCount} orders</span>
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-[#8E8A85]">
                        <p className="text-white">{ord.customerDetails?.governorate}</p>
                        <p className="text-[11px] truncate max-w-[140px]">{ord.customerDetails?.city}</p>
                      </td>

                      {/* Items Summary */}
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

                      {/* Total Amount & Price Breakdown */}
                      <td className="py-4 px-4">
                        <span className="font-serif text-sm font-bold text-[#DCC9A6] block">
                          EGP {ord.totalAmount?.toFixed(2)}
                        </span>
                        {ord.discountAmount && ord.discountAmount > 0 ? (
                          <div className="text-[10px] space-y-0.5 font-mono mt-0.5">
                            <span className="text-emerald-400 block font-semibold">
                              -EGP {ord.discountAmount.toFixed(2)} discount
                            </span>
                            <span className="text-[#DCC9A6] block text-[9.5px] font-medium">
                              After Disc: EGP {(ord.subtotal - ord.discountAmount).toFixed(2)}
                            </span>
                            <span className="text-[#8E8A85] block text-[9px]">
                              (+Ship: {ord.shippingFee === 0 ? 'Free' : `EGP ${ord.shippingFee?.toFixed(2)}`})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#8E8A85] block mt-0.5">
                            (Ship: {ord.shippingFee === 0 ? 'FREE' : `EGP ${ord.shippingFee?.toFixed(2)}`})
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown (Includes 'Returned') */}
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
                          <option value="returned">⚠️ Returned (مرتجع)</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Dual Action Buttons: Order Details + Invoice */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedDetailsOrder(ord)}
                            className="inline-flex items-center gap-1 bg-[#B67355] text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all rounded shadow-sm"
                            title="View Complete Order & Customer Details"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Order Details</span>
                          </button>

                          <button
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="inline-flex items-center gap-1 bg-[#141414] border border-[#333333] text-[#DCC9A6] px-2.5 py-1.5 text-xs hover:border-[#DCC9A6] transition-colors rounded"
                            title="Print Official A4 Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Invoice</span>
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

      {/* COMPREHENSIVE ORDER DETAILS & CUSTOMER PROFILE MODAL */}
      {selectedDetailsOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl rounded-2xl text-white space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B67355] flex items-center justify-center text-white">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-white">
                      Order #{selectedDetailsOrder.orderId}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusColor(selectedDetailsOrder.status)}`}>
                      {selectedDetailsOrder.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8A85] font-sans">
                    Placed on {typeof selectedDetailsOrder.createdAt === 'string' ? new Date(selectedDetailsOrder.createdAt).toLocaleString('en-GB') : 'Recent'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailsOrder(null)}
                className="p-1.5 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Return Warning in Order Details Modal */}
            {(() => {
              const returnHistory = checkCustomerReturnHistory(
                selectedDetailsOrder.customerDetails,
                selectedDetailsOrder.customerUid,
                selectedDetailsOrder.id || selectedDetailsOrder.orderId,
                orders
              );

              if (returnHistory.hasReturns) {
                return (
                  <div className="p-4 bg-red-950/50 border-2 border-red-700 rounded-xl text-red-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-red-300">
                        ⚠️ WARNING: Client has {returnHistory.returnCount} previous returned orders!
                      </h4>
                      <p className="text-xs text-red-200 mt-0.5">
                        This customer previously returned orders: <strong>{returnHistory.returnedOrderIds.join(', ')}</strong>. Please verify shipment before dispatch.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Customer & Delivery Information Card */}
            <div className="bg-[#141414] p-4 border border-[#333333] rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center justify-between">
                <span>Customer & Destination</span>
                <span className="text-[#8E8A85] text-xs font-normal">بيانات العميل والتوصيل</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#CCCCCC]">
                <div className="space-y-1.5">
                  <p>
                    <strong className="text-white">Full Name:</strong> {selectedDetailsOrder.customerDetails?.fullName}
                  </p>
                  <p>
                    <strong className="text-white">Primary Phone:</strong> {selectedDetailsOrder.customerDetails?.phone}
                  </p>
                  {selectedDetailsOrder.customerDetails?.alternatePhone && (
                    <p>
                      <strong className="text-white">Alternate Phone:</strong> {selectedDetailsOrder.customerDetails?.alternatePhone}
                    </p>
                  )}
                  <p>
                    <strong className="text-white">Email:</strong> {selectedDetailsOrder.customerDetails?.email}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p>
                    <strong className="text-white">Governorate & City:</strong> {selectedDetailsOrder.customerDetails?.governorate}, {selectedDetailsOrder.customerDetails?.city}
                  </p>
                  <p>
                    <strong className="text-white">Street Address:</strong> {selectedDetailsOrder.customerDetails?.address}
                  </p>
                  {selectedDetailsOrder.customerDetails?.notes && (
                    <p className="italic text-[#DCC9A6]">
                      <strong className="text-white not-italic">Notes:</strong> {selectedDetailsOrder.customerDetails?.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Direct Communication Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#262626]">
                <a
                  href={`tel:${selectedDetailsOrder.customerDetails?.phone}`}
                  className="inline-flex items-center gap-1.5 bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs font-semibold hover:border-[#DCC9A6] transition-colors rounded"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>Call Customer</span>
                </a>

                <a
                  href={`https://wa.me/2${selectedDetailsOrder.customerDetails?.phone?.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity rounded"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Customer</span>
                </a>
              </div>
            </div>

            {/* Items In Order List */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-[#333333] pb-2">
                Ordered Items ({selectedDetailsOrder.items?.length || 0})
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedDetailsOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#141414] border border-[#333333] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {item.imageUrl && (
                        <div className="relative w-12 h-14 bg-[#1F1F1F] rounded overflow-hidden shrink-0 border border-[#333333]">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <h5 className="font-bold text-white">{item.name}</h5>
                        <p className="text-[11px] text-[#8E8A85]">
                          {item.selectedColor?.name} • Size {item.selectedSize} • Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <span className="font-serif font-bold text-[#DCC9A6] text-sm">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="p-4 bg-[#141414] border border-[#333333] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-[#8E8A85]">
                <span>Items Original Subtotal:</span>
                <span className="font-mono font-bold text-white">EGP {selectedDetailsOrder.subtotal?.toFixed(2)}</span>
              </div>
              {selectedDetailsOrder.discountAmount ? (
                <>
                  <div className="flex justify-between text-emerald-400">
                    <span>Applied Discount ({selectedDetailsOrder.discountTitle || selectedDetailsOrder.discountCode || 'Promo'}):</span>
                    <span className="font-mono font-bold">-EGP {selectedDetailsOrder.discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#DCC9A6] font-semibold">
                    <span>Items Total (After Discount):</span>
                    <span className="font-mono font-bold">EGP {((selectedDetailsOrder.subtotal || 0) - selectedDetailsOrder.discountAmount).toFixed(2)}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between text-[#8E8A85]">
                <span>Delivery Fee:</span>
                <span className="font-mono font-bold text-white">
                  {selectedDetailsOrder.shippingFee === 0 ? 'FREE' : `EGP ${selectedDetailsOrder.shippingFee?.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#DCC9A6] border-t border-[#262626] pt-2">
                <span>Final Total Amount Due:</span>
                <span className="font-serif text-base">EGP {selectedDetailsOrder.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions Bar (Change Status, Mark as Returned, View Invoice) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#333333]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E8A85]">Delivery Status:</span>
                <select
                  value={selectedDetailsOrder.status}
                  onChange={(e) =>
                    handleStatusChange(selectedDetailsOrder.id || selectedDetailsOrder.orderId, e.target.value as OrderStatus)
                  }
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 border rounded focus:outline-none cursor-pointer ${getStatusColor(
                    selectedDetailsOrder.status
                  )}`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">⚠️ Returned (مرتجع)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {/* 1-Click Mark Order as Returned Button */}
                {selectedDetailsOrder.status !== 'returned' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedDetailsOrder.id || selectedDetailsOrder.orderId, 'returned')}
                    className="inline-flex items-center gap-1.5 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mark as Returned (مرتجع)</span>
                  </button>
                ) : (
                  <span className="text-xs text-rose-400 font-bold bg-rose-950 px-3 py-1.5 border border-rose-800 rounded">
                    ✓ Marked as Returned
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    printIsolatedInvoice(selectedDetailsOrder);
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#DCC9A6] text-[#1F1F1F] px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors rounded shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4 Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <span className="text-[#8E8A85] block text-[10px] uppercase">Current Status</span>
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

            {/* Customer Sender Account Info */}
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
                  disabled={updatingAction}
                  onClick={() => handleVerifyPayment(inspectReceiptOrder.id || inspectReceiptOrder.orderId, 'rejected')}
                  className="bg-red-950 border border-red-800 hover:bg-red-900 text-red-300 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                >
                  ✕ Reject Receipt
                </button>

                <button
                  type="button"
                  disabled={updatingAction}
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
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#1F1F1F] border border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] rounded-2xl">
            
            {/* Modal Controls Bar (Screen Only - Hidden in Print) */}
            <div className="no-print bg-[#141414] border-b border-[#333333] px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-[#DCC9A6] font-bold">
                  Official Invoice Preview • معاينة الفاتورة
                </span>
                <span className="text-xs bg-black px-2 py-0.5 border border-[#333333] text-white font-mono rounded">
                  #{selectedInvoiceOrder.orderId || selectedInvoiceOrder.id}
                </span>
                {selectedInvoiceOrder.paymentMethod === 'INSTAPAY' && (
                  <span className="bg-[#B67355] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    ⚡ INSTAPAY
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedInvoiceOrder.receiptUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setInspectReceiptOrder(selectedInvoiceOrder);
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#B67355] text-white px-3 py-1.5 text-xs font-semibold rounded hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                )}

                <a
                  href={`tel:${selectedInvoiceOrder.customerDetails?.phone}`}
                  className="inline-flex items-center gap-1.5 bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs font-semibold hover:border-[#DCC9A6] transition-colors rounded"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>Call</span>
                </a>

                <a
                  href={`https://wa.me/2${selectedInvoiceOrder.customerDetails?.phone?.replace(/^0/, '')}`}
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
                    printIsolatedInvoice(selectedInvoiceOrder);
                  }}
                  className="inline-flex items-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] px-4 py-1.5 text-xs uppercase font-bold tracking-wider hover:bg-white transition-all shadow-md active:scale-95 rounded"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print A4 Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="p-1.5 text-[#8E8A85] hover:text-white transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Container with Printable Invoice */}
            <div className="overflow-y-auto p-4 sm:p-8 bg-[#2A2A2A]">
              <PrintableInvoice order={selectedInvoiceOrder} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
