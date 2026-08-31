'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  ShoppingBag,
  RotateCcw,
  ShieldAlert,
  Star,
  ExternalLink,
  X,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Zap,
} from 'lucide-react';
import { getAllClients } from '@/lib/clientService';
import { ClientProfile, Order } from '@/types';
import { useToast } from '@/context/ToastContext';
import PrintableInvoice from '@/components/admin/PrintableInvoice';

export default function AdminClientsPage() {
  const { success, error, info } = useToast();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'buyers' | 'vip' | 'returns'>('all');
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllClients();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAllClients()
      .then((data) => {
        if (isMounted) {
          setClients(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading clients:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalClientsCount = clients.length;
  const totalLifetimeRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrdersCount = clients.reduce((sum, c) => sum + c.totalOrders, 0);
  const clientsWithReturns = clients.filter((c) => c.hasPreviousReturns);
  const totalReturnsCount = clients.reduce((sum, c) => sum + c.returnedOrders, 0);

  const filteredClients = clients.filter((client) => {
    const matchesSegment =
      segmentFilter === 'all' ||
      (segmentFilter === 'buyers' && client.totalOrders > 0) ||
      (segmentFilter === 'vip' && client.deliveredOrders >= 2 && client.returnedOrders === 0) ||
      (segmentFilter === 'returns' && client.hasPreviousReturns);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.phone.includes(q) ||
      (client.alternatePhone && client.alternatePhone.includes(q)) ||
      (client.governorate && client.governorate.toLowerCase().includes(q)) ||
      (client.city && client.city.toLowerCase().includes(q));

    return matchesSegment && matchesSearch;
  });

  const getClientBadge = (client: ClientProfile) => {
    if (client.hasPreviousReturns) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span>⚠️ {client.returnedOrders} Returned ({client.returnRate}%)</span>
        </span>
      );
    }
    if (client.deliveredOrders >= 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-[#DCC9A6]/20 text-[#DCC9A6] border border-[#DCC9A6]/40 text-[10px] font-bold px-2 py-0.5 rounded">
          <Star className="w-3 h-3 text-[#DCC9A6] fill-current" />
          <span>VIP Client</span>
        </span>
      );
    }
    if (client.totalOrders > 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
          <span>Active Client</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[#141414] text-[#8E8A85] border border-[#333333] text-[10px] font-medium px-2 py-0.5 rounded">
        <span>Registered User</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            Client Database & CRM Tracking
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Clients & Return History
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans">
            Comprehensive directory of registered accounts, order frequency, lifetime spending, and return tracking.
          </p>
        </div>

        <button
          onClick={loadClients}
          className="inline-flex items-center gap-2 bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#2A2A2A] transition-colors rounded"
        >
          <span>Refresh Database</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1F1F1F] border border-[#333333] p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Clients</span>
            <Users className="w-4 h-4 text-[#DCC9A6]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {totalClientsCount}
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            {clients.filter((c) => c.totalOrders > 0).length} buyers recorded
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Orders Placed</span>
            <ShoppingBag className="w-4 h-4 text-[#B67355]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {totalOrdersCount}
          </p>
          <span className="text-[10px] text-[#8E8A85] block">
            Across all client accounts
          </span>
        </div>

        <div className="bg-[#1F1F1F] border border-[#333333] p-4 sm:p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#8E8A85]">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Lifetime Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#DCC9A6]">
            EGP {totalLifetimeRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-400 block">
            Total sales generated
          </span>
        </div>

        <div className={`p-4 sm:p-5 rounded-xl shadow-sm space-y-1 border ${
          clientsWithReturns.length > 0
            ? 'bg-red-950/30 border-red-800 text-red-200'
            : 'bg-[#1F1F1F] border-[#333333] text-[#8E8A85]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Clients with Returns</span>
            <RotateCcw className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {clientsWithReturns.length}
          </p>
          <span className="text-[10px] text-red-400 block">
            {totalReturnsCount} total returned orders tracked
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-4 space-y-4 shadow-sm rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `All Clients (${clients.length})` },
            { id: 'buyers', label: `Active Buyers (${clients.filter((c) => c.totalOrders > 0).length})` },
            { id: 'vip', label: `VIP Clients (${clients.filter((c) => c.deliveredOrders >= 2 && c.returnedOrders === 0).length})` },
            { id: 'returns', label: `⚠️ Clients with Returns (${clientsWithReturns.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSegmentFilter(tab.id as 'all' | 'buyers' | 'vip' | 'returns')}
              className={`px-3.5 py-1.5 text-xs font-sans uppercase tracking-wider font-semibold rounded transition-all ${
                segmentFilter === tab.id
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
            placeholder="Search by client name, mobile phone number, email address, city, governorate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#333333] text-white px-4 py-2.5 pl-10 text-xs font-sans focus:outline-none focus:border-[#DCC9A6] rounded"
          />
          <Search className="w-4 h-4 text-[#8E8A85] absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Clients Database Table */}
      <div className="bg-[#1F1F1F] border border-[#333333] overflow-hidden shadow-sm rounded-xl">
        {loading ? (
          <div className="py-16 text-center text-[#8E8A85] text-xs">
            <div className="w-8 h-8 border-2 border-[#DCC9A6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Aggregating client database & order histories...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-[#8E8A85] mx-auto mb-2" />
            <p className="font-serif text-base text-[#DCC9A6]">No client records match this filter</p>
            <p className="text-xs text-[#8E8A85]">Try clearing search keywords or choosing another filter tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#141414] border-b border-[#333333] text-[#8E8A85] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Phone & Contacts</th>
                  <th className="py-3.5 px-4">Governorate / City</th>
                  <th className="py-3.5 px-4">Orders Placed</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">Return History & Risk</th>
                  <th className="py-3.5 px-4">Client Status</th>
                  <th className="py-3.5 px-4 text-right">Profile & Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredClients.map((client) => {
                  const initial = (client.name[0] || 'C').toUpperCase();
                  const hasReturns = client.hasPreviousReturns;

                  return (
                    <tr
                      key={client.id}
                      className={`hover:bg-[#252525] transition-colors ${
                        hasReturns ? 'bg-red-950/10' : ''
                      }`}
                    >
                      {/* Client Name & Initial */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            hasReturns
                              ? 'bg-red-950 border border-red-800 text-red-300'
                              : 'bg-[#B67355] text-white'
                          }`}>
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[160px]">
                              {client.name}
                            </p>
                            <span className="text-[10px] text-[#8E8A85] truncate block max-w-[160px]">
                              {client.email || 'No email recorded'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Contacts */}
                      <td className="py-4 px-4">
                        {client.phone ? (
                          <div>
                            <a
                              href={`tel:${client.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] text-[#DCC9A6] hover:underline"
                            >
                              <Phone className="w-3 h-3 text-[#B67355]" />
                              <span>{client.phone}</span>
                            </a>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={`https://wa.me/2${client.phone.replace(/^0/, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 text-[10px]"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#8E8A85] text-[11px]">-</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-[#8E8A85]">
                        <p className="text-white font-medium">{client.governorate || 'Cairo'}</p>
                        <p className="text-[11px] truncate max-w-[130px]">{client.city || '-'}</p>
                      </td>

                      {/* Orders Count */}
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-white text-sm">
                          {client.totalOrders}
                        </span>
                        <span className="text-[10px] text-[#8E8A85] block">
                          {client.deliveredOrders} delivered
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-4">
                        <span className="font-serif font-bold text-[#DCC9A6] text-sm">
                          EGP {client.totalSpent.toFixed(2)}
                        </span>
                      </td>

                      {/* Return History & Risk Alert */}
                      <td className="py-4 px-4">
                        {hasReturns ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>⚠️ Has Returned Orders</span>
                            </span>
                            <p className="text-[10px] text-red-400 font-semibold">
                              {client.returnedOrders} of {client.totalOrders} orders returned ({client.returnRate}%)
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>0 Returns (Safe)</span>
                          </span>
                        )}
                      </td>

                      {/* Badge */}
                      <td className="py-4 px-4">
                        {getClientBadge(client)}
                      </td>

                      {/* View Profile Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="inline-flex items-center gap-1 bg-[#141414] border border-[#333333] text-[#DCC9A6] px-3 py-1.5 text-xs hover:border-[#DCC9A6] transition-colors rounded"
                        >
                          <span>Profile ({client.totalOrders})</span>
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

      {/* COMPREHENSIVE CLIENT PROFILE & ORDER HISTORY MODAL */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#1F1F1F] border border-[#333333] p-6 sm:p-8 shadow-2xl rounded-2xl text-white space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#333333] pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                  selectedClient.hasPreviousReturns
                    ? 'bg-red-950 border border-red-800 text-red-300'
                    : 'bg-[#B67355] text-white'
                }`}>
                  {(selectedClient.name[0] || 'C').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-white">
                      {selectedClient.name}
                    </h3>
                    {getClientBadge(selectedClient)}
                  </div>
                  <p className="text-xs text-[#8E8A85] font-sans mt-0.5">
                    {selectedClient.email || 'Client Profile'} • Registered Account
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* RETURN RISK WARNING BANNER (IF APPLICABLE) */}
            {selectedClient.hasPreviousReturns && (
              <div className="p-4 bg-red-950/50 border-2 border-red-700 rounded-xl text-red-200 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-red-300 uppercase tracking-wider">
                    ⚠️ Return Warning Alert: Customer Has Previous Returned Orders
                  </h4>
                  <p className="text-xs text-red-200 mt-1 leading-relaxed">
                    This client has returned <strong>{selectedClient.returnedOrders}</strong> out of{' '}
                    <strong>{selectedClient.totalOrders}</strong> previous orders (<strong>{selectedClient.returnRate}% Return Rate</strong>).
                    Please verify delivery details and confirm intention with the client prior to shipping any new orders.
                  </p>
                </div>
              </div>
            )}

            {/* Client Key Analytics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#141414] p-4 border border-[#333333] rounded-xl text-xs">
              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Total Orders</span>
                <span className="font-mono font-bold text-lg text-white">
                  {selectedClient.totalOrders}
                </span>
              </div>

              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Lifetime Spent</span>
                <span className="font-serif font-bold text-lg text-[#DCC9A6]">
                  EGP {selectedClient.totalSpent.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Delivered Orders</span>
                <span className="font-mono font-bold text-lg text-emerald-400">
                  {selectedClient.deliveredOrders}
                </span>
              </div>

              <div>
                <span className="text-[#8E8A85] block text-[10px] uppercase">Returned Orders</span>
                <span className={`font-mono font-bold text-lg ${
                  selectedClient.returnedOrders > 0 ? 'text-red-400' : 'text-white'
                }`}>
                  {selectedClient.returnedOrders} ({selectedClient.returnRate}%)
                </span>
              </div>
            </div>

            {/* Contact & Location Details */}
            <div className="bg-[#141414] p-4 border border-[#333333] rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-[#333333] pb-2">
                Client Contact & Delivery Location
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#CCCCCC]">
                <div className="space-y-1.5">
                  <p>
                    <strong className="text-white">Primary Phone:</strong> {selectedClient.phone || 'N/A'}
                  </p>
                  {selectedClient.alternatePhone && (
                    <p>
                      <strong className="text-white">Alternate Phone:</strong> {selectedClient.alternatePhone}
                    </p>
                  )}
                  <p>
                    <strong className="text-white">Email:</strong> {selectedClient.email || 'N/A'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p>
                    <strong className="text-white">Governorate & City:</strong>{' '}
                    {selectedClient.governorate || 'Cairo'}, {selectedClient.city || ''}
                  </p>
                  <p>
                    <strong className="text-white">Street Address:</strong> {selectedClient.address || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Quick Communication Actions */}
              {selectedClient.phone && (
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={`tel:${selectedClient.phone}`}
                    className="inline-flex items-center gap-1.5 bg-[#1F1F1F] border border-[#333333] text-white px-3 py-1.5 text-xs font-semibold hover:border-[#DCC9A6] transition-colors rounded"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#B67355]" />
                    <span>Call Customer</span>
                  </a>

                  <a
                    href={`https://wa.me/2${selectedClient.phone.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity rounded"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct</span>
                  </a>
                </div>
              )}
            </div>

            {/* Complete Order History of this Client */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center justify-between border-b border-[#333333] pb-2">
                <span>All Orders Placed by {selectedClient.name} ({selectedClient.orders.length})</span>
                <span className="text-xs text-[#8E8A85] font-normal">سجل طلبات العميل بالكامل</span>
              </h4>

              {selectedClient.orders.length === 0 ? (
                <div className="p-6 text-center text-[#8E8A85] text-xs bg-[#141414] rounded-xl border border-[#333333]">
                  No orders placed yet with this account.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedClient.orders.map((ord) => {
                    const isReturned = ord.status === 'returned';
                    const isDelivered = ord.status === 'delivered';
                    const isInstapay = ord.paymentMethod === 'INSTAPAY';

                    return (
                      <div
                        key={ord.id || ord.orderId}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isReturned
                            ? 'bg-red-950/20 border-red-800'
                            : 'bg-[#141414] border-[#333333] hover:border-[#DCC9A6]/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              #{ord.orderId}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isReturned
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : isDelivered
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-[#1F1F1F] text-[#DCC9A6] border border-[#333333]'
                            }`}>
                              {ord.status.toUpperCase()}
                            </span>
                            {isReturned && (
                              <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                                ⚠️ RETURNED (مرتجع)
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#8E8A85]">
                            {typeof ord.createdAt === 'string' ? new Date(ord.createdAt).toLocaleDateString('en-GB') : 'Recent Order'} • {ord.items?.length || 0} items ({ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')})
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left sm:text-right">
                            <span className="font-serif font-bold text-sm text-[#DCC9A6] block">
                              EGP {ord.totalAmount?.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-[#8E8A85] block">
                              {isInstapay ? '⚡ Instapay' : 'COD'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setViewInvoiceOrder(ord)}
                            className="inline-flex items-center gap-1 bg-[#1F1F1F] border border-[#333333] text-[#DCC9A6] px-3 py-1.5 rounded hover:bg-[#2A2A2A] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview if opened from Client History */}
      {viewInvoiceOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#1F1F1F] border border-[#333333] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] rounded-2xl">
            <div className="no-print bg-[#141414] border-b border-[#333333] px-6 py-4 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#DCC9A6] font-bold">
                Invoice Preview • #{viewInvoiceOrder.orderId}
              </span>
              <button
                type="button"
                onClick={() => setViewInvoiceOrder(null)}
                className="p-1.5 text-[#8E8A85] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-8 bg-[#2A2A2A]">
              <PrintableInvoice order={viewInvoiceOrder} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
