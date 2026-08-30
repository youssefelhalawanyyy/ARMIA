'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowRight,
  Database,
  Clock,
} from 'lucide-react';
import { getAllOrders, getProducts, seedProductsToFirestore } from '@/lib/productService';
import { Order, Product, OrderStatus } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function AdminDashboardOverview() {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ordersData, prodsData] = await Promise.all([
          getAllOrders(),
          getProducts('all'),
        ]);
        setOrders(ordersData);
        setProducts(prodsData);
      } catch (err) {
        console.error('Error fetching admin overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const count = await seedProductsToFirestore();
      success(`Successfully seeded ${count} initial ARMIA products to Firestore!`, 'Database Seeded');
      // Refresh products
      const prods = await getProducts('all');
      setProducts(prods);
    } catch (err: unknown) {
      console.error('Seeding error:', err);
      const e = err as { message?: string };
      error('Failed to seed catalog: ' + (e.message || 'Error occurred'));
    } finally {
      setSeeding(false);
    }
  };

  // Metrics calculations
  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const lowStockProducts = products.filter((p) => p.stockQuantity < 20);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] uppercase font-bold px-2 py-0.5">
            Pending COD
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] uppercase font-bold px-2 py-0.5">
            Confirmed
          </span>
        );
      case 'processing':
        return (
          <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] uppercase font-bold px-2 py-0.5">
            Processing
          </span>
        );
      case 'shipped':
        return (
          <span className="bg-[#B67355]/30 text-[#DCC9A6] border border-[#B67355] text-[10px] uppercase font-bold px-2 py-0.5">
            Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] uppercase font-bold px-2 py-0.5">
            Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-950 text-red-300 border border-red-800 text-[10px] uppercase font-bold px-2 py-0.5">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B67355]">
            ARMIA Boutique Management
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Dashboard Overview
          </h1>
          <p className="text-xs text-[#8E8A85] font-sans">
            Real-time analytics, order tracking, and boutique inventory status.
          </p>
        </div>

        {/* 1-Click Database Seeder Helper */}
        <button
          onClick={handleSeedDatabase}
          disabled={seeding}
          className="inline-flex items-center gap-2 bg-[#1F1F1F] border border-[#DCC9A6] text-[#DCC9A6] px-4 py-2.5 text-xs font-sans uppercase tracking-wider font-bold hover:bg-[#DCC9A6] hover:text-[#1F1F1F] transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>{seeding ? 'Seeding Firestore...' : 'Seed Initial Catalog to Firestore'}</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Metric 1: Total Sales */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase tracking-wider text-[#8E8A85]">
              Gross Sales (COD)
            </span>
            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#333333] flex items-center justify-center text-[#DCC9A6]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-white">
              EGP {totalSales.toFixed(2)}
            </span>
            <p className="text-[10px] text-[#8E8A85] font-sans mt-1">
              From {orders.length} placed orders
            </p>
          </div>
        </div>

        {/* Metric 2: Pending Orders */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase tracking-wider text-[#8E8A85]">
              Pending Orders
            </span>
            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#333333] flex items-center justify-center text-[#B67355]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#DCC9A6]">
              {pendingOrders.length}
            </span>
            <p className="text-[10px] text-[#8E8A85] font-sans mt-1">
              Awaiting confirmation & dispatch
            </p>
          </div>
        </div>

        {/* Metric 3: Active Products */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase tracking-wider text-[#8E8A85]">
              Catalog Products
            </span>
            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#333333] flex items-center justify-center text-[#DCC9A6]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {products.length}
            </span>
            <p className="text-[10px] text-[#8E8A85] font-sans mt-1">
              Across 6 curated categories
            </p>
          </div>
        </div>

        {/* Metric 4: Low Stock Alert */}
        <div className="bg-[#1F1F1F] border border-[#333333] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans uppercase tracking-wider text-[#8E8A85]">
              Inventory Alert
            </span>
            <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#333333] flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-400">
              {lowStockProducts.length}
            </span>
            <p className="text-[10px] text-[#8E8A85] font-sans mt-1">
              Items with &lt; 20 units remaining
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-[#1F1F1F] border border-[#333333] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#333333] pb-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#DCC9A6]" />
            <h2 className="font-serif text-lg font-bold text-white">
              Recent Incoming Orders
            </h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs uppercase tracking-wider text-[#DCC9A6] hover:text-white transition-colors flex items-center gap-1 font-semibold"
          >
            <span>Manage All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#8E8A85] text-xs">
            Loading recent orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="font-serif text-base text-[#DCC9A6]">
              No orders placed in store yet
            </p>
            <p className="text-xs text-[#8E8A85]">
              New customer Cash on Delivery orders will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="border-b border-[#333333] text-[#8E8A85] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Governorate</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Total (COD)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333333]">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id || ord.orderId} className="hover:bg-[#252525] transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      #{ord.orderId}
                    </td>
                    <td className="py-3.5 px-3 text-white font-medium">
                      {ord.customerDetails?.fullName}
                      <span className="block text-[10px] text-[#8E8A85]">
                        {ord.customerDetails?.phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#8E8A85]">
                      {ord.customerDetails?.governorate}
                    </td>
                    <td className="py-3.5 px-3 text-white">
                      {ord.items?.length} items
                    </td>
                    <td className="py-3.5 px-3 font-serif font-bold text-[#DCC9A6]">
                      EGP {ord.totalAmount?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3">{getStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1 text-[#DCC9A6] hover:text-white text-xs underline"
                      >
                        <span>Update Status</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/products"
          className="bg-[#1F1F1F] border border-[#333333] p-6 hover:border-[#DCC9A6] transition-all group shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#DCC9A6] transition-colors">
              Product Catalog & Inventory (CRUD) →
            </h3>
            <p className="text-xs text-[#8E8A85] font-sans">
              Add new dresses, sets, tops, update pricing, colors, and stock quantities.
            </p>
          </div>
          <Package className="w-8 h-8 text-[#8E8A85] group-hover:text-[#DCC9A6] transition-colors shrink-0 ml-4" />
        </Link>

        <Link
          href="/admin/orders"
          className="bg-[#1F1F1F] border border-[#333333] p-6 hover:border-[#DCC9A6] transition-all group shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#DCC9A6] transition-colors">
              Live Order Management & Invoices →
            </h3>
            <p className="text-xs text-[#8E8A85] font-sans">
              Update order statuses, coordinate Egyptian couriers, and generate printable slips.
            </p>
          </div>
          <ShoppingBag className="w-8 h-8 text-[#8E8A85] group-hover:text-[#DCC9A6] transition-colors shrink-0 ml-4" />
        </Link>
      </div>
    </div>
  );
}
