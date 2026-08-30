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
} from 'lucide-react';
import { getAllOrders, updateOrderStatusInFirestore } from '@/lib/productService';
import { Order, OrderStatus } from '@/types';
import { useToast } from '@/context/ToastContext';

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

      {/* ORDER DETAILS MODAL & PRINTABLE INVOICE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl text-white space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-[#B67355] font-bold">
                  ARMIA Boutique Invoice
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  Order #{selectedOrder.orderId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#141414] p-4 border border-[#333333] text-xs">
              <div className="space-y-1">
                <p className="text-[10px] text-[#8E8A85] uppercase tracking-wider font-semibold">
                  Customer & Contact
                </p>
                <p className="font-bold text-white text-sm">{selectedOrder.customerDetails?.fullName}</p>
                <p className="text-[#DCC9A6]">{selectedOrder.customerDetails?.email}</p>
                <p className="text-white font-mono">{selectedOrder.customerDetails?.phone}</p>
                {selectedOrder.customerDetails?.alternatePhone && (
                  <p className="text-[#8E8A85]">Alt: {selectedOrder.customerDetails?.alternatePhone}</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-[#8E8A85] uppercase tracking-wider font-semibold">
                  Shipping Destination
                </p>
                <p className="text-white">{selectedOrder.customerDetails?.address}</p>
                <p className="text-[#8E8A85]">
                  {selectedOrder.customerDetails?.city}, {selectedOrder.customerDetails?.governorate}
                </p>
                {selectedOrder.customerDetails?.notes && (
                  <p className="text-amber-400 italic text-[11px] pt-1">
                    Note: {selectedOrder.customerDetails?.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#DCC9A6]">
                Ordered Pieces ({selectedOrder.items?.length})
              </h4>
              <div className="divide-y divide-[#333333] border border-[#333333] bg-[#141414]">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-12 bg-[#1F1F1F] shrink-0 overflow-hidden">
                        <Image src={item.imageUrl || ''} alt={item.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-[10px] text-[#8E8A85]">
                          {item.selectedColor?.name} • Size {item.selectedSize} • Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-white">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Due */}
            <div className="flex justify-between items-center bg-[#141414] p-4 border border-[#333333]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8E8A85]">
                  Payment Method
                </span>
                <p className="font-serif font-bold text-sm text-[#DCC9A6]">
                  Cash on Delivery (COD)
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest text-[#8E8A85]">
                  Total Amount Due
                </span>
                <p className="font-serif text-xl font-bold text-[#DCC9A6]">
                  EGP {selectedOrder.totalAmount?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedOrder.customerDetails?.phone}`}
                  className="inline-flex items-center gap-1.5 bg-[#141414] border border-[#333333] px-3.5 py-2 text-xs font-semibold hover:border-[#DCC9A6] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                  <span>Call Customer</span>
                </a>

                <a
                  href={`https://wa.me/2${selectedOrder.customerDetails?.phone?.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="inline-flex items-center gap-1.5 bg-[#DCC9A6] text-[#1F1F1F] px-4 py-2 text-xs uppercase font-bold tracking-wider hover:bg-white transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
