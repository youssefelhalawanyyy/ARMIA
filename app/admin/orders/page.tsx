'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Phone,
  MessageCircle,
  Printer,
  X,
  ExternalLink,
} from 'lucide-react';
import { getAllOrders, updateOrderStatusInFirestore } from '@/lib/productService';
import { Order, OrderStatus } from '@/types';
import { useToast } from '@/context/ToastContext';
import PrintableInvoice from '@/components/admin/PrintableInvoice';

export default function AdminOrdersPage() {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ord.orderId.toLowerCase().includes(q) ||
      ord.customerDetails?.fullName.toLowerCase().includes(q) ||
      ord.customerDetails?.phone.includes(q) ||
      ord.customerDetails?.governorate.toLowerCase().includes(q) ||
      ord.customerDetails?.city.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Real-Time Order Feed
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Order Management (COD)
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans">
            Review incoming orders, verify customer shipping details, and track delivery progress.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-2 bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#2A2A2A] transition-colors"
        >
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending COD' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'processing', label: 'Processing' },
            { id: 'shipped', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-sans uppercase tracking-wider font-semibold transition-all ${
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
            placeholder="Search by Order ID (e.g. ARM-12345), customer name, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#333333] text-white px-4 py-2.5 pl-10 text-xs font-sans focus:outline-none focus:border-[#DCC9A6]"
          />
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-[#8E8A85] text-xs">
            Loading orders from Firestore...
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
              <thead className="bg-[#141414] border-b border-[#333333] text-[#8E8A85] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Governorate / City</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">COD Total</th>
                  <th className="py-3 px-4">Status & Action</th>
                  <th className="py-3 px-4 text-right">View Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id || ord.orderId} className="hover:bg-[#252525] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      #{ord.orderId}
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

                    <td className="py-4 px-4">
                      <span className="font-serif text-sm font-bold text-[#DCC9A6]">
                        EGP {ord.totalAmount?.toFixed(2)}
                      </span>
                      <span className="block text-[9px] uppercase tracking-wider text-[#8E8A85]">
                        Cash on Delivery
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          handleStatusChange(ord.id || ord.orderId, e.target.value as OrderStatus)
                        }
                        className={`text-[11px] font-sans font-bold uppercase tracking-wider px-2 py-1 border focus:outline-none cursor-pointer ${getStatusColor(
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
                        className="inline-flex items-center gap-1 bg-[#141414] border border-[#333333] text-[#DCC9A6] px-3 py-1.5 text-xs hover:border-[#DCC9A6] transition-colors"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADVANCED BILINGUAL ORDER INVOICE MODAL & A4 PRINTABLE VIEW */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#1F1F1F] border border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Controls Bar (Screen Only - Hidden in Print) */}
            <div className="no-print bg-[#141414] border-b border-[#333333] px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-[#DCC9A6] font-bold">
                  Official Invoice Preview • معاينة الفاتورة
                </span>
                <span className="text-xs bg-black px-2 py-0.5 border border-[#333333] text-white font-mono">
                  #{selectedOrder.orderId || selectedOrder.id}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${selectedOrder.customerDetails?.phone}`}
                  className="inline-flex items-center gap-1.5 bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs font-semibold hover:border-[#DCC9A6] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>Call Customer</span>
                </a>

                <a
                  href={`https://wa.me/2${selectedOrder.customerDetails?.phone?.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') window.print();
                  }}
                  className="inline-flex items-center gap-2 bg-[#DCC9A6] text-[#1F1F1F] px-4 py-1.5 text-xs uppercase font-bold tracking-wider hover:bg-white transition-all shadow-md active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print A4 Invoice</span>
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
